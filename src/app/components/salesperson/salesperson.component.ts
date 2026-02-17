import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  salesperson_id: number;
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

  // Get the logged-in salesperson ID (you need to implement this properly)
  loggedInSalespersonId: number = this.getSalespersonId();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('🔄 Salesperson Dashboard Initialized');
    console.log('👤 Salesperson ID:', this.loggedInSalespersonId);
    this.checkLowStock();
    
    // Start countdown for automatic navigation
    this.startCountdown();
    
    // Check stock every 30 seconds
    this.stockCheckSubscription = interval(30000).subscribe(() => {
      this.checkLowStock();
    });
  }

  ngOnDestroy(): void {
    if (this.stockCheckSubscription) {
      this.stockCheckSubscription.unsubscribe();
    }
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  startCountdown() {
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        this.navigateToManageProduct();
      }
    });
  }

  // Navigate immediately without waiting for countdown
  navigateNow() {
    this.navigateToManageProduct();
  }

  // Method to get salesperson ID (you need to implement this based on your auth system)
  getSalespersonId(): number {
    // TODO: Replace with your actual authentication logic
    // This could come from:
    // - Auth service
    // - Local storage
    // - Session storage
    // - JWT token
    
    // For now, using a hardcoded value for testing
    return 123; // Replace with actual salesperson ID from your auth system
  }

  checkLowStock() {
    console.log('🔍 Checking low stock for salesperson:', this.loggedInSalespersonId);
    
    // Try different endpoints to find products
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
          
          // Filter products that belong to this salesperson AND have low stock
          this.lowStockProducts = products.filter(product => {
            const isOwnProduct = product.salesperson_id === this.loggedInSalespersonId;
            const isLowStock = product.stock <= 2;
            
            if (isOwnProduct && isLowStock) {
              console.log(`📦 Low stock product found: ${product.name} (Stock: ${product.stock})`);
            }
            
            return isOwnProduct && isLowStock;
          });
          
          this.lowStockCount = this.lowStockProducts.length;
          console.log('📊 Final low stock count:', this.lowStockCount);
          console.log('📦 Low stock products:', this.lowStockProducts);
          
          // Auto-show alert if there are low stock items
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