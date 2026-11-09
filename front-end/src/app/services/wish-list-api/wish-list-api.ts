import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../envirement/environment';

const WISHLIST_PATH = '/api/wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private url(productId: string): string {
    return `${this.baseUrl}${WISHLIST_PATH}/${encodeURIComponent(productId)}`;
  }

  /** GET /api/wishlist/{productId} -> true | false */
  isInWishlist(productId: string): Observable<boolean> {
    return this.http.get<boolean>(this.url(productId));
  }

  // The backend answers with plain text, so responseType must be 'text'
  // (the default JSON parsing would fail on a successful 200).
  add(productId: string): Observable<string> {
    return this.http.post(this.url(productId), null, { responseType: 'text' });
  }

  remove(productId: string): Observable<string> {
    return this.http.delete(this.url(productId), { responseType: 'text' });
  }

  /** GET /api/wishlist -> ids of every wish-listed product */
  getWishlistIds(): Observable<string[]> {
    console.log(`${this.baseUrl}/api/wishlist`)
    return this.http.get<string[]>(`${this.baseUrl}/api/wishlist`);
  }
}