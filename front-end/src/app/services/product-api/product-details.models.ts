import { ProductCategory } from './product-category';

// GET /api/products/{id}
export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  userId: string;
  category: ProductCategory;
  price: number;
  quantity: number;
  mainPicPosition: number;
  createdAt: number;
}

// GET /api/media/{productId}/images. Adjust if your ProductImageResponse has other field names.
export interface ProductImageResponse {
  id: string;
  position: number;
}