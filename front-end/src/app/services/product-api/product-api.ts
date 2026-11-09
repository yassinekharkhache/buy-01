import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../envirement/environment';
import {
  AddProductRequest,
  CreateProductResponse,
  MainImageResponse,
  MediaUploadResponse,
  ProductListItem,
  UploadSession,
} from './product.models';

// Adjust these if your gateway adds a prefix such as /api or /media.
const MEDIA_PATH = '/api/media';
const UPLOAD_SESSIONS_PATH = MEDIA_PATH + '/upload-sessions';
const IMAGES_PATH = '/upload-sessions/images';
const PRODUCTS_PATH = '/api/products';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createUploadSession(): Observable<UploadSession> {
    return this.http.post<UploadSession>(`${this.baseUrl}${UPLOAD_SESSIONS_PATH}`, {});
  }

  uploadImage(sessionId: string, file: File, position: number): Observable<MediaUploadResponse> {
    const body = new FormData();
    body.append('file', file);
    body.append('position', String(position));

    return this.http.post<MediaUploadResponse>(
      `${this.baseUrl}${UPLOAD_SESSIONS_PATH}/${encodeURIComponent(sessionId)}/images`,
      body,
    );
  }

  deleteImage(imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${IMAGES_PATH}/${encodeURIComponent(imageId)}`);
  }

  // Keyset pagination: omit both params for the first page.
  getProducts(lastCreatedAt?: number, lastId?: string): Observable<ProductListItem[]> {
    let params = new HttpParams();
    if (lastCreatedAt !== undefined && lastId !== undefined) {
      params = params.set('lastCreatedAt', lastCreatedAt).set('lastId', lastId);
    }
    return this.http.get<ProductListItem[]>(`${this.baseUrl}${PRODUCTS_PATH}`, { params });
  }

  getMainImage(productId: string, position: number): Observable<MainImageResponse> {
    return this.http.get<MainImageResponse>(
      `${this.baseUrl}/api/media/${encodeURIComponent(productId)}/images/${position}`,
    );
  }

  // Downloads a protected image through HttpClient so the interceptor can add the JWT.
  getImageBlob(url: string): Observable<Blob> {
    const absolute = /^https?:\/\//i.test(url)
      ? url
      : `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    return this.http.get(absolute, { responseType: 'blob' });
  }

  createProduct(product: AddProductRequest): Observable<CreateProductResponse> {
    return this.http.post<CreateProductResponse>(`${this.baseUrl}${PRODUCTS_PATH}`, product);
  }
}