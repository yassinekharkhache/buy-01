import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
// Adjust the path to your environments folder
import { environment } from '../../../envirement/environment';

export interface CreateProductBody {
  name: string;
  price: number;
  quantity: number;
  description: string;
  /** The upload session the images were uploaded to */
  uploadSessionId: string;
  /** Confirmed image ids, in display order (first = cover) */
  imageIds: string[];
}

export interface Product {
  name: string;
  price: number;
  description: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  /** POST {productApiUrl}/products */
  create(body: CreateProductBody): Observable<Product> {
    return this.http.post<Product>(`${environment.productApiUrl}/api/products`, body);
  }
}