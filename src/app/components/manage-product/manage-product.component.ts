import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from 'src/app/models/product1.model';
import { Category } from 'src/app/models/category.model';
import { Product1Service } from 'src/app/services/product1.service';
import { CategoryService } from 'src/app/services/category.service';

@Component({
  selector: 'app-manage-product',
  templateUrl: './manage-product.component.html',
  styleUrls: ['./manage-product.component.scss']
})
export class ManageProductComponent implements OnInit {

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  productForm!: FormGroup;

  editing: boolean = false;
  selectedProductId?: number;

  imageFile?: File;
  imagePreview?: string;

  searchTerm: string = '';
  selectedCategoryId: number | null = null;
  showAddForm: boolean = false;

  lowStockCount: number = 0;
  criticalStockCount: number = 0;

  loggedInSalespersonId: number = 123; // example, replace with actual

  constructor(
    private fb: FormBuilder,
    private product1Service: Product1Service,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
    this.loadCategories();
  }

  // ---------------- Form Initialization ----------------
  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, Validators.required],
      stock: [0, Validators.required],
      image_url: [''],
      category_id: [null, Validators.required] // required category
    });
  }

  // ---------------- Load Data ----------------
  loadProducts(): void {
    this.product1Service.getAll(this.loggedInSalespersonId)
      .subscribe((data: Product[]) => {
        this.products = data || [];
        this.applyFilters();
      });
  }

  loadCategories(): void {
    this.categoryService.getAll()
      .subscribe((data: Category[]) => {
        this.categories = data || [];
      });
  }

  // ---------------- Filtering ----------------
  filterProducts(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredProducts = this.products.filter((p: Product) => {
      const matchesName = p.name?.toLowerCase().includes(term);
      const matchesCategory = this.selectedCategoryId != null
        ? p.category_id === this.selectedCategoryId
        : true;
      return matchesName && matchesCategory;
    });

    this.sortProductsByStock();
    this.updateStockCounts();
  }

  // ---------------- Stock Sorting & Counts ----------------
  sortProductsByStock(): void {
    this.filteredProducts.sort((a: Product, b: Product) => {
      const priorityA = this.getStockPriority(a.stock);
      const priorityB = this.getStockPriority(b.stock);

      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.name.localeCompare(b.name);
    });
  }

  updateStockCounts(): void {
    this.lowStockCount = this.filteredProducts.filter(p => p.stock > 0 && p.stock <= 2).length;
    this.criticalStockCount = this.filteredProducts.filter(p => p.stock === 0).length;
  }

  isLowStock(stock: number): boolean {
    return stock <= 2 && stock > 0;
  }

  isCriticalStock(stock: number): boolean {
    return stock === 0;
  }

  getStockLevelText(stock: number): string {
    if (stock === 0) return 'OUT OF STOCK';
    if (stock === 1) return 'VERY LOW';
    if (stock === 2) return 'LOW STOCK';
    return '';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'out-of-stock-text';
    if (stock <= 2) return 'low-stock-text';
    return 'normal-stock-text';
  }

  getStockPriority(stock: number): number {
    if (stock === 0) return 1;
    if (stock === 1) return 2;
    if (stock === 2) return 3;
    return 4;
  }

  // ---------------- Category ----------------
  getCategoryName(categoryId?: number | string): string {
    if (categoryId === undefined || categoryId === null) return 'Unknown';
    const id = typeof categoryId === 'string' ? Number(categoryId) : categoryId;
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
  }

  // ---------------- Form Actions ----------------
  openAddForm(): void {
    this.resetForm();
    this.showAddForm = true;
    this.editing = false;
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  goBackToDashboard(): void {
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
      category_id: Number(formValue.category_id) // ensure number
    };

    if (this.editing && this.selectedProductId != null) {
      this.product1Service.update(this.selectedProductId, product)
        .subscribe(() => {
          this.loadProducts();
          this.cancelForm();
        });
    } else {
      this.product1Service.create(product)
        .subscribe(() => {
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
      image_url: product.image_url,
      category_id: product.category_id || null
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
