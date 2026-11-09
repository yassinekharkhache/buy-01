import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductApi } from '../../services/product-api/product-api';
import { ProductListItem } from '../../services/product-api/product.models';

const PAGE_SIZE = 10; // the backend returns 10 per request
const CURRENCY = 'USD';
const SHOW_WISHLIST = false; // turn on once the wish list endpoints exist
const SKELETONS = [1, 2, 3, 4] as const;

@Component({
  selector: 'app-browse-products',
  imports: [ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './browse-products.html',
  styleUrl: './browse-products.css',
})
export class BrowseProducts {
  private readonly api = inject(ProductApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
  private observer: IntersectionObserver | null = null;

  protected readonly currency = CURRENCY;
  protected readonly showWishlist = SHOW_WISHLIST;
  protected readonly skeletons = SKELETONS;

  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly loadedOnce = signal(false);

  constructor() {
    // Browser only. Observing the sentinel fires once straight away, which loads page 1.
    afterNextRender(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.loadMore();
        },
        { rootMargin: '400px 0px' },
      );
      this.observer.observe(this.sentinel().nativeElement);
      this.destroyRef.onDestroy(() => this.observer?.disconnect());
    });
  }

  protected loadMore(): void {
    if (this.loading() || !this.hasMore()) return;

    const last = this.products().at(-1);
    this.loading.set(true);
    this.failed.set(false);

    this.api
      .getProducts(last?.createdAt, last?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          const known = new Set(this.products().map((product) => product.id));
          const fresh = page.filter((product) => !known.has(product.id));
          // add image link from /<product-id>/image_name.png
          // console.log("feash == ",fresh);


          this.products.update((list) => [...list, ...fresh]);
          this.hasMore.set(page.length >= PAGE_SIZE);
          this.loadedOnce.set(true);
          this.loading.set(false);

          if (this.hasMore()) this.recheckSentinel();
        },
        error: (error: unknown) => {
          console.error('Loading products failed', error);
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  // If the sentinel is still in view after new cards render, load the next page too.
  private recheckSentinel(): void {
    afterNextRender(
      () => {
        const element = this.sentinel().nativeElement;
        this.observer?.unobserve(element);
        this.observer?.observe(element);
      },
      { injector: this.injector },
    );
  }
}