export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  salesperson_id?: number;
  category_id?: number;  // matches backend JSON
}
