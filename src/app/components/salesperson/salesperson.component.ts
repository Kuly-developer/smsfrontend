import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  salesperson_id: number;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-salesperson',
  templateUrl: './salesperson.component.html',
  styleUrls: ['./salesperson.component.scss']
})
export class SalespersonComponent implements OnInit, OnDestroy {
  lowStockProducts: Product[] = [];
  lowStockCount: number = 0;
  showAlert: boolean = false;
  countdown: number = 2; // 5 seconds countdown
  private apiUrl = 'http://localhost:8889/api';
  private stockCheckSubscription: Subscription | null = null;
  private countdownSubscription: Subscription | null = null;

  categories: Category[] = [];  // <-- Added categories array
  form: FormGroup;               // <-- Reactive form for category filter

  // Get the logged-in salesperson ID (you need to implement this properly)
  loggedInSalespersonId: number = this.getSalespersonId();

  constructor(
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      categoryId: ['']  // Default value
    });
  }

  ngOnInit(): void {
    console.log('🔄 Salesperson Dashboard Initialized');
    console.log('👤 Salesperson ID:', this.loggedInSalespersonId);

    this.loadCategories(); // <-- Load categories

    this.checkLowStock();
    
    // Start countdown for automatic navigation
    this.startCountdown();
    
    // Check stock every 30 seconds
    this.stockCheckSubscription = interval(30000).subscribe(() => {
      this.checkLowStock();
    });

    // Optional: React to category changes
    this.form.get('categoryId')?.valueChanges.subscribe(categoryId => {
      console.log('Selected Category ID:', categoryId);
      // You can call a method to filter products by category here
      this.filterProductsByCategory(categoryId);
    });
  }

  ngOnDestroy(): void {
    if (this.stockCheckSubscription) this.stockCheckSubscription.unsubscribe();
    if (this.countdownSubscription) this.countdownSubscription.unsubscribe();
  }

  // ---------- Categories ----------
  loadCategories() {
    this.http.get<Category[]>('http://localhost:8080/api/categories')
      .subscribe({
        next: data => {
          this.categories = data;
          console.log('📦 Categories loaded:', this.categories);
        },
        error: err => {
          console.error('❌ Failed to load categories:', err);
        }
      });
  }

  filterProductsByCategory(categoryId: string) {
    if (!categoryId) {
      // Reset or load all products
      this.checkLowStock();
      return;
    }

    this.http.get<Product[]>(`${this.apiUrl}/products/category/${categoryId}`)
      .subscribe({
        next: products => {
          console.log('Filtered products by category:', products);
          this.lowStockProducts = products.filter(p => p.stock <= 2);
          this.lowStockCount = this.lowStockProducts.length;
        },
        error: err => {
          console.error('❌ Failed to load products by category:', err);
        }
      });
  }

  // ---------- Countdown ----------
  startCountdown() {
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.countdown--;
      if (this.countdown <= 0) this.navigateToManageProduct();
    });
  }

  navigateNow() {
    this.navigateToManageProduct();
  }

  // ---------- Auth ----------
  getSalespersonId(): number {
    // TODO: Replace with actual authentication logic
    return 123; // Hardcoded for now
  }

  // ---------- Low Stock ----------
  checkLowStock() {
    console.log('🔍 Checking low stock for salesperson:', this.loggedInSalespersonId);

    const endpoints = [
      `${this.apiUrl}/products/salesperson/${this.loggedInSalespersonId}`,
      `${this.apiUrl}/products/public`,
      `${this.apiUrl}/products`
    ];

    let currentEndpointIndex = 0;

    const tryNextEndpoint = () => {
      if (currentEndpointIndex >= endpoints.length) {
        console.error('❌ All endpoints failed');
        return;
      }

      const endpoint = endpoints[currentEndpointIndex];
      console.log(`🔄 Trying endpoint: ${endpoint}`);

      this.http.get<Product[]>(endpoint).subscribe({
        next: (products) => {
          console.log('✅ Products fetched successfully:', products);
          this.lowStockProducts = products.filter(product => product.salesperson_id === this.loggedInSalespersonId && product.stock <= 2);
          this.lowStockCount = this.lowStockProducts.length;

          if (this.lowStockCount > 0 && !this.showAlert) {
            this.showAlert = true;
            this.showBrowserNotification();
          }
        },
        error: (err) => {
          console.error(`❌ Endpoint ${endpoint} failed:`, err);
          currentEndpointIndex++;
          tryNextEndpoint();
        }
      });
    };

    tryNextEndpoint();
  }

  showLowStockAlert() {
    this.showAlert = true;
    console.log('🔔 Manual alert triggered');
  }

  hideAlert() {
    this.showAlert = false;
    console.log('🔕 Alert hidden');
  }

  showBrowserNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Low Stock Alert!', {
        body: `${this.lowStockCount} of your products have low stock (≤ 2 items remaining)`,
        icon: '/assets/alert-icon.png',
        tag: 'low-stock-alert'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Low Stock Alert!', {
            body: `${this.lowStockCount} of your products have low stock (≤ 2 items remaining)`,
            icon: '/assets/alert-icon.png',
            tag: 'low-stock-alert'
          });
        }
      });
    }
  }

  navigateToManageProduct() {
    console.log('🚀 Navigating to manage products');
    this.router.navigate(['/products/manage']);
  }
}
