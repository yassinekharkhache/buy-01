// import { Component } from '@angular/core';

// @Component({
//   imports: [],
//   selector: 'app-wishlist-page',
//   styleUrl: './wishlist-page.css',
//   templateUrl: './wishlist-page.html',
// })
// export class WishlistPage {}
import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subscription, catchError, from, map, mergeMap, of, switchMap, toArray } from 'rxjs';
import { CATEGORY_OPTIONS } from '../../services/product-api/product-category';
import { ProductDetailsApi } from '../../services/product-api/product-dtails-api';
import { ProductDetails } from '../../services/product-api/product-details.models';
import { WishlistApi } from '../../services/wish-list-api/wish-list-api';

const CURRENCY = 'USD';
const LOW_STOCK = 5;
const FETCH_CONCURRENCY = 5; // product requests in flight at once
const THUMB_CONCURRENCY = 3; // image downloads in flight at once

const CATEGORY_BY_VALUE = new Map(CATEGORY_OPTIONS.map((option) => [option.value, option]));

type Status = 'loading' | 'ready' | 'failed';
type SortKey = 'name' | 'price';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-wishlist-page',
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.css',
})
export class WishlistPage {
  private readonly wishlist = inject(WishlistApi);
  private readonly details = inject(ProductDetailsApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currency = CURRENCY;

  protected readonly status = signal<Status>('loading');
  protected readonly items = signal<ProductDetails[]>([]);
  protected readonly note = signal<string | null>(null);
  protected readonly removingIds = signal<ReadonlySet<string>>(new Set());

  // productId -> blob URL of the main image. undefined = still loading, null = none or failed.
  protected readonly thumbs = signal<Readonly<Record<string, string | null>>>({});
  private thumbSub = new Subscription();

  protected readonly sortKey = signal<SortKey>('name');
  protected readonly sortDir = signal<SortDir>('asc');

  // Sorting happens here in the browser; the backend only returns the ids.
  protected readonly sorted = computed(() => {
    const key = this.sortKey();
    const direction = this.sortDir() === 'asc' ? 1 : -1;
    const byName = (a: ProductDetails, b: ProductDetails) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

    return [...this.items()].sort((a, b) =>
      key === 'name' ? direction * byName(a, b) : direction * (a.price - b.price) || byName(a, b),
    );
  });

  protected readonly sortDescription = computed(
    () => `sorted by ${this.sortKey()}, ${this.sortDir() === 'asc' ? 'ascending' : 'descending'}`,
  );

  constructor() {
    // Browser only: the requests need the stored token.
    afterNextRender(() => this.load());

    this.destroyRef.onDestroy(() => {
      this.thumbSub.unsubscribe();
      this.releaseAllThumbs();
    });
  }

  protected load(): void {
    this.status.set('loading');
    this.note.set(null);
    this.thumbSub.unsubscribe();
    this.releaseAllThumbs();

    this.wishlist
      .getWishlistIds()
      .pipe(
        switchMap((ids) =>
          from(ids).pipe(
            mergeMap(
              (id) => this.details.getProduct(id).pipe(catchError(() => of(null))), // skip deleted products
              FETCH_CONCURRENCY,
            ),
            toArray(),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (list) => {
          const products = list.filter((product): product is ProductDetails => product !== null);
          this.items.set(products);
          this.status.set('ready');
          this.loadThumbnails(products);
        },
        error: (error: unknown) => {
          console.error('Loading wish list failed', error);
          this.status.set('failed');
        },
      });
  }

  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  protected remove(item: ProductDetails): void {
    if (this.removingIds().has(item.id)) return;

    this.removingIds.update((ids) => new Set(ids).add(item.id));
    this.note.set(null);

    this.wishlist
      .remove(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items.update((list) => list.filter((product) => product.id !== item.id));
          this.releaseThumb(item.id);
          this.stopRemoving(item.id);
        },
        error: (error: unknown) => {
          console.error('Removing from wish list failed', error);
          this.stopRemoving(item.id);
          this.note.set(`We couldn't remove "${item.name}". Try again.`);
        },
      });
  }

  protected categoryOf(item: ProductDetails) {
    return CATEGORY_BY_VALUE.get(item.category);
  }

  protected stockLabel(quantity: number): string {
    if (quantity <= 0) return 'Out of stock';
    if (quantity <= LOW_STOCK) return `Only ${quantity} left`;
    return 'In stock';
  }

  // Main image = the image whose position equals mainPicPosition (falls back to the first one).
  // Downloaded through HttpClient so the interceptor adds the JWT.
  private loadThumbnails(products: ProductDetails[]): void {
    this.thumbSub = from(products)
      .pipe(
        mergeMap(
          (product) =>
            this.details.getImages(product.id).pipe(
              map(
                (images) =>
                  (images.find((image) => image.position === product.mainPicPosition) ?? images[0])
                    ?.id ?? null,
              ),
              switchMap((imageId) =>
                imageId ? this.details.getImageBlob(product.id, imageId) : of(null),
              ),
              map((blob) => ({ id: product.id, url: blob ? URL.createObjectURL(blob) : null })),
              catchError(() => of({ id: product.id, url: null })),
            ),
          THUMB_CONCURRENCY,
        ),
      )
      .subscribe(({ id, url }) => this.thumbs.update((current) => ({ ...current, [id]: url })));
  }

  private releaseThumb(id: string): void {
    const url = this.thumbs()[id];
    if (url) URL.revokeObjectURL(url);

    this.thumbs.update((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  private releaseAllThumbs(): void {
    Object.values(this.thumbs()).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    this.thumbs.set({});
  }

  private stopRemoving(id: string): void {
    this.removingIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }
}