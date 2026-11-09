import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../envirement/environment';
import { ProductDetails, ProductImageResponse } from './product-details.models';

const PRODUCTS_PATH = '/api/products';
const MEDIA_PATH = '/api/media';
// Image files live at {IMAGE_FILES_BASE}/{productId}/{imageId}. Change the base if it is not the API host.
const IMAGE_FILES_BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ProductDetailsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getProduct(id: string): Observable<ProductDetails> {
    return this.http.get<ProductDetails>(`${this.baseUrl}${PRODUCTS_PATH}/${encodeURIComponent(id)}`);
  }

  getImages(productId: string): Observable<ProductImageResponse[]> {
    return this.http.get<ProductImageResponse[]>(
      `${this.baseUrl}/api/media/${encodeURIComponent(productId)}/images`,
    );
  }

  // Downloaded through HttpClient so the interceptor adds the JWT (an <img> tag cannot).
  getImageBlob(productId: string, imageId: string): Observable<Blob> {
    return this.http.get(
      `${IMAGE_FILES_BASE}/product/${encodeURIComponent(productId)}/${encodeURIComponent(imageId)}`,
      { responseType: 'blob' },
    );
  }
}