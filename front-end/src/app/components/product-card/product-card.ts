import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductSummary } from '../../services/product-api/product.models';
import { ProductApi } from '../../services/product-api/product-api';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { catchError, map, of } from 'rxjs';

const LOW_STOCK = 5;

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<ProductSummary>();
  readonly wishlisted = input(false);
  readonly showWishlist = input(true);
  readonly currency = input('USD');

  /** Emits the product id when the heart is pressed. */
  readonly wishlistToggle = output<string>();

  private readonly api = inject(ProductApi);

  protected readonly imageFailed = signal(false);

  // Fetches the main image once per product; null while loading, when there is none, or on error.
  protected readonly imageUrl = toSignal(
    toObservable(this.product).pipe(
      switchMap((product) =>
        product.mainPicPosition === null
          ? of(null)
          : this.api.getMainImage(product.id, product.mainPicPosition).pipe(
              switchMap((response) => this.api.getImageBlob(`/product/${product.id}/${response.id}`)),
              map((blob) => URL.createObjectURL(blob)),
              
              catchError(() => of(null)),
            ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly showImage = computed(() => !!this.imageUrl() && !this.imageFailed());

  protected readonly stockLabel = computed(() => {
    const quantity = this.product().quantity;
    if (quantity <= 0) return 'Out of stock';
    if (quantity <= LOW_STOCK) return `Only ${quantity} left`;
    return null;
  });
}