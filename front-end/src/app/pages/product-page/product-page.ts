import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, map } from 'rxjs';
import { CATEGORY_OPTIONS } from '../../services/product-api/product-category';
import { ProductDetailsApi } from '../../services/product-api/product-dtails-api';
import { ProductDetails } from '../../services/product-api/product-details.models';
import { WishlistApi } from '../../services/wish-list-api/wish-list-api';

const CURRENCY = 'USD';
const LOW_STOCK = 5;

type PageStatus = 'loading' | 'ready' | 'notfound' | 'failed';

interface WishlistNote {
  kind: 'info' | 'error';
  text: string;
}

interface GalleryImage {
  id: string;
  position: number;
  url: string | null; // blob URL once downloaded
  status: 'loading' | 'ready' | 'error';
}

@Component({
  selector: 'app-product-page',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage {
  private readonly api = inject(ProductDetailsApi);
  private readonly wishlist = inject(WishlistApi);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );

  private loadSub = new Subscription();
  private objectUrls: string[] = [];

  protected readonly currency = CURRENCY;

  protected readonly status = signal<PageStatus>('loading');
  protected readonly product = signal<ProductDetails | null>(null);
  protected readonly images = signal<GalleryImage[]>([]);
  protected readonly imagesLoading = signal(true);
  protected readonly selectedId = signal<string | null>(null);

  protected readonly wishlisted = signal(false);
  protected readonly wishlistReady = signal(false); // false until the current state is known
  protected readonly wishlistBusy = signal(false);
  protected readonly wishlistNote = signal<WishlistNote | null>(null);

  protected readonly selected = computed(
    () => this.images().find((image) => image.id === this.selectedId()) ?? null,
  );

  protected readonly mainId = computed(() => {
    const images = this.images();
    const position = this.product()?.mainPicPosition;
    return (images.find((image) => image.position === position) ?? images[0])?.id ?? null;
  });

  protected readonly categoryOption = computed(() =>
    CATEGORY_OPTIONS.find((option) => option.value === this.product()?.category),
  );

  protected readonly stockLabel = computed(() => {
    const quantity = this.product()?.quantity ?? 0;
    if (quantity <= 0) return 'Out of stock';
    if (quantity <= LOW_STOCK) return `Only ${quantity} left`;
    return 'In stock';
  });

  constructor() {
    // Browser only (the requests need the stored token). Re-runs when the :id changes.
    effect(() => {
      const id = this.id();
      if (id && this.isBrowser) untracked(() => this.load(id));
    });

    inject(DestroyRef).onDestroy(() => {
      this.loadSub.unsubscribe();
      this.releaseUrls();
    });
  }

  protected select(imageId: string): void {
    this.selectedId.set(imageId);
  }

  protected retry(): void {
    const id = this.id();
    if (id) this.load(id);
  }

  private load(id: string): void {
    this.loadSub.unsubscribe();
    this.loadSub = new Subscription();
    this.releaseUrls();

    this.status.set('loading');
    this.product.set(null);
    this.images.set([]);
    this.imagesLoading.set(true);
    this.selectedId.set(null);
    this.wishlisted.set(false);
    this.wishlistReady.set(false);
    this.wishlistBusy.set(false);
    this.wishlistNote.set(null);

    this.loadSub.add(
      this.api.getProduct(id).subscribe({
        next: (product) => {
          this.product.set(product);
          this.status.set('ready');
          this.loadImages(product);
          this.loadWishlistState(product.id);
        },
        error: (error: unknown) => {
          console.error('Loading product failed', error);
          this.status.set(error instanceof HttpErrorResponse && error.status === 404 ? 'notfound' : 'failed');
        },
      }),
    );
  }

  protected toggleWishlist(): void {
    const product = this.product();
    if (!product || !this.wishlistReady() || this.wishlistBusy()) return;

    const next = !this.wishlisted();
    this.wishlisted.set(next); // optimistic, rolled back on error
    this.wishlistBusy.set(true);
    this.wishlistNote.set(null);

    const request = next ? this.wishlist.add(product.id) : this.wishlist.remove(product.id);

    this.loadSub.add(
      request.subscribe({
        next: () => {
          this.wishlistBusy.set(false);
          this.wishlistNote.set({
            kind: 'info',
            text: next ? 'Added to your wish list.' : 'Removed from your wish list.',
          });
        },
        error: (error: unknown) => {
          console.error('Updating wish list failed', error);
          this.wishlisted.set(!next);
          this.wishlistBusy.set(false);
          this.wishlistNote.set({ kind: 'error', text: "We couldn't update your wish list." });
        },
      }),
    );
  }

  private loadWishlistState(productId: string): void {
    this.loadSub.add(
      this.wishlist.isInWishlist(productId).subscribe({
        next: (inWishlist) => {
          this.wishlisted.set(inWishlist);
          this.wishlistReady.set(true);
        },
        error: (error: unknown) => {
          console.error('Checking wish list failed', error);
          this.wishlistNote.set({ kind: 'error', text: "We couldn't check your wish list." });
        },
      }),
    );
  }

  private loadImages(product: ProductDetails): void {
    this.loadSub.add(
      this.api.getImages(product.id).subscribe({
        next: (list) => {
          const items = [...list]
            .sort((a, b) => a.position - b.position)
            .map((image): GalleryImage => ({
              id: image.id,
              position: image.position,
              url: null,
              status: 'loading',
            }));

          this.images.set(items);
          this.selectedId.set(this.mainId());
          this.imagesLoading.set(false);

          items.forEach((item) => this.loadImageFile(product.id, item.id));
        },
        error: (error: unknown) => {
          console.error('Loading product images failed', error);
          this.imagesLoading.set(false);
        },
      }),
    );
  }

  private loadImageFile(productId: string, imageId: string): void {
    this.loadSub.add(
      this.api.getImageBlob(productId, imageId).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this.objectUrls.push(url);
          this.patchImage(imageId, { url, status: 'ready' });
        },
        error: () => this.patchImage(imageId, { status: 'error' }),
      }),
    );
  }

  private patchImage(id: string, changes: Partial<GalleryImage>): void {
    this.images.update((list) => list.map((image) => (image.id === id ? { ...image, ...changes } : image)));
  }

  private releaseUrls(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }
}