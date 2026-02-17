// src/app/models/cart-item.model.ts
export interface CartItem {
  id?: number;
  customerId: number; // required now
  productId: number;
  quantity: number;
  name?: string;
  price?: number;
  image_url?: string;
}
