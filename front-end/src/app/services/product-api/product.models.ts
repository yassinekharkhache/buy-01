export interface UploadSession {
  id: string;
}

export interface MediaUploadResponse {
  id: string;
  sessionId: string;
  position: number;
  expiresAt: number;
}

export interface AddProductRequest {
  name: string;
  category: String;
  description: string;
  price: number;
  quantity: number;
  uploadSessionId: string;
  mainPicPosition: number;
}

export interface CreateProductResponse {
  message: string;
}

// Shape used by the product card. Adjust the fields to match your product response.
export interface ProductSummary {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  mainPicPosition: number | null;
}

// One item of GET /products. createdAt + id are the keyset cursor for the next page.
export interface ProductListItem extends ProductSummary {
  createdAt: number;
}

// Response of GET /api/media/{productId}/images/main. Adjust to your MainImageResponse fields.
export interface MainImageResponse {
  id: string;
}