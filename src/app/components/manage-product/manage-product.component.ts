import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from 'src/app/models/product1.model';
import { Product1Service } from 'src/app/services/product1.service';

@Component({
  selector: 'app-manage-product',
  templateUrl: './manage-product.component.html',
  styleUrls: ['./manage-product.component.scss'],
})
export class ManageProductComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  productForm!: FormGroup;

  editing = false;
  selectedProductId?: number;

  imageFile?: File;
  imagePreview?: string;

  searchTerm: string = '';
  showAddForm: boolean = false;
  lowStockCount: number = 0;
  criticalStockCount: number = 0;

  // Example logged-in salesperson ID (replace with real auth logic)
  loggedInSalespersonId: number = 123;

  constructor(
    private fb: FormBuilder,
    private product1Service: Product1Service,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, Validators.required],
      stock: [0, Validators.required],
      image_url: [''],
    });
  }

  loadProducts(): void {
    this.product1Service
      .getAll(this.loggedInSalespersonId)
      .subscribe((data: Product[]) => {
        this.products = data;
        this.filteredProducts = [...data]; // Initialize filteredProducts
        this.sortProductsByStock();
        this.updateStockCounts();
        console.log('📦 Products loaded:', this.products.length);
        console.log('🔍 Filtered products:', this.filteredProducts.length);
      });
  }

  filterProducts(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter((p) =>
        p.name.toLowerCase().includes(term)
      );
    }
    this.sortProductsByStock();
    this.updateStockCounts();
  }

  // Sort products: critical stock first, then low stock, then normal stock
  sortProductsByStock(): void {
    this.filteredProducts.sort((a, b) => {
      const priorityA = this.getStockPriority(a.stock);
      const priorityB = this.getStockPriority(b.stock);
      
      // First sort by stock priority (critical first)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then sort by name alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  updateStockCounts(): void {
    this.lowStockCount = this.filteredProducts.filter(product => 
      product.stock > 0 && product.stock <= 2
    ).length;
    
    this.criticalStockCount = this.filteredProducts.filter(product => 
      product.stock === 0
    ).length;
    
    console.log('📊 Stock counts - Critical:', this.criticalStockCount, 'Low:', this.lowStockCount);
  }

  // Check if stock is low (≤ 2)
  isLowStock(stock: number): boolean {
    return stock <= 2;
  }

  // Check if stock is critical (0)
  isCriticalStock(stock: number): boolean {
    return stock === 0;
  }

  // Get stock level text
  getStockLevelText(stock: number): string {
    if (stock === 0) return 'OUT OF STOCK';
    if (stock === 1) return 'VERY LOW';
    if (stock === 2) return 'LOW STOCK';
    return '';
  }

  // Get CSS class for stock display
  getStockClass(stock: number): string {
    if (stock === 0) return 'out-of-stock-text';
    if (stock <= 2) return 'low-stock-text';
    return 'normal-stock-text';
  }

  // Get priority level for sorting (lower number = higher priority)
  getStockPriority(stock: number): number {
    if (stock === 0) return 1; // Highest priority - Critical
    if (stock === 1) return 2; // High priority - Very Low
    if (stock === 2) return 3; // Medium priority - Low
    return 4; // Normal priority - Normal stock
  }

  openAddForm(): void {
    this.resetForm();
    this.showAddForm = true;
    this.editing = false;
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  // Updated method to navigate to login page
  goBackToDashboard(): void {
    console.log('🔐 Navigating to login page');
    this.router.navigate(['/login']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.productForm.patchValue({ image_url: this.imagePreview });
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const formValue = this.productForm.value;

    const product: Product = {
      ...formValue,
      salesperson_id: this.loggedInSalespersonId,
    };

    if (this.editing && this.selectedProductId != null) {
      this.product1Service
        .update(this.selectedProductId, product)
        .subscribe(() => {
          this.loadProducts();
          this.cancelForm();
        });
    } else {
      this.product1Service.create(product).subscribe(() => {
        this.loadProducts();
        this.cancelForm();
      });
    }
  }

  editProduct(product: Product): void {
    this.editing = true;
    this.selectedProductId = product.id;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url
    });
    this.imagePreview = product.image_url;
    this.showAddForm = true;
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.product1Service.delete(id).subscribe(() => {
        this.loadProducts();
      });
    }
  }

  resetForm(): void {
    this.editing = false;
    this.selectedProductId = undefined;
    this.productForm.reset();
    this.imagePreview = undefined;
    this.imageFile = undefined;
  }
}