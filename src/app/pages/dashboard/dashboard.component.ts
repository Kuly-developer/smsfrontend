import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  totalUsers: number = 0;
  totalOrders: number = 0;
  totalRevenue: number = 0;
  totalProducts: number = 0;
  loading: boolean = false;
  apiUrl: string = 'http://localhost:8889/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    
    // Array to track completion of all API calls
    let completedCalls = 0;
    const totalCalls = 3; // users, orders, products

    const checkAllCompleted = () => {
      completedCalls++;
      if (completedCalls === totalCalls) {
        this.loading = false;
      }
    };

    // Load users count
    this.http.get<any[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => {
        this.totalUsers = users.length;
        checkAllCompleted();
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        checkAllCompleted();
      }
    });

    // Load orders count and calculate revenue
    this.http.get<any[]>(`${this.apiUrl}/orders`).subscribe({
      next: (orders) => {
        this.totalOrders = orders.length;
        this.totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        checkAllCompleted();
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        checkAllCompleted();
      }
    });

    // Load products count - using the SAME endpoint as products component
    this.http.get<any[]>(`${this.apiUrl}/products`).subscribe({
      next: (products) => {
        // This calculates total products the SAME way as products component
        this.totalProducts = products.length;
        console.log('Dashboard - Total products calculated:', this.totalProducts);
        console.log('Dashboard - Products array length:', products.length);
        checkAllCompleted();
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        checkAllCompleted();
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}