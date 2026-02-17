import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  loading: boolean = false;
  deletingProductId: number | null = null;

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
        console.log('Products loaded:', data);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  deleteProduct(productId: number): void {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.deletingProductId = productId;
    console.log('Attempting to delete product ID:', productId);

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        console.log('Product deleted successfully, ID:', productId);
        this.products = this.products.filter(product => product.id !== productId);
        this.deletingProductId = null;
      },
      error: (err) => {
        console.error('Full error object:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error details:', err.error);
        console.error('Error name:', err.name);
        console.error('Error URL:', err.url);
        this.deletingProductId = null;
        alert('Error deleting product. Please check console for details.');
      }
    });
  }

  getSellerInitials(salespersonName: string | undefined): string {
    if (!salespersonName) return 'S';
    return salespersonName.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
