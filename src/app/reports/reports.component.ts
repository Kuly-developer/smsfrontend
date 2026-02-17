// reports.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  dashboardStats: any = {};
  paymentAnalytics: any = {};
  salesTrends: any[] = [];
  customerAnalytics: any = {};
  productPerformance: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboardStats();
    this.loadPaymentAnalytics();
    this.loadSalesTrends();
  }

  loadDashboardStats() {
    this.loading = true;
    this.error = null;
    this.http.get('http://localhost:8889/api/reports/dashboard-stats').subscribe({
      next: (data: any) => {
        this.dashboardStats = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'Failed to load dashboard statistics';
        this.loading = false;
      }
    });
  }

  loadPaymentAnalytics() {
    this.http.get('http://localhost:8889/api/reports/payment-analytics').subscribe({
      next: (data: any) => {
        this.paymentAnalytics = data;
      },
      error: (error) => {
        console.error('Error loading payment analytics:', error);
        this.error = 'Failed to load payment analytics';
      }
    });
  }

  loadSalesTrends(days: number = 30) {
    this.http.get(`http://localhost:8889/api/reports/sales-trends?days=${days}`).subscribe({
      next: (data: any) => {
        this.salesTrends = data;
      },
      error: (error) => {
        console.error('Error loading sales trends:', error);
        this.error = 'Failed to load sales trends';
      }
    });
  }

  loadCustomerAnalytics() {
    this.http.get('http://localhost:8889/api/reports/customer-analytics').subscribe({
      next: (data: any) => {
        this.customerAnalytics = data;
      },
      error: (error) => {
        console.error('Error loading customer analytics:', error);
        this.error = 'Failed to load customer analytics';
      }
    });
  }

  loadProductPerformance() {
    this.http.get('http://localhost:8889/api/reports/product-performance').subscribe({
      next: (data: any) => {
        this.productPerformance = data;
      },
      error: (error) => {
        console.error('Error loading product performance:', error);
        this.error = 'Failed to load product performance';
      }
    });
  }

  retry() {
    this.error = null;
    this.loadDashboardStats();
    this.loadPaymentAnalytics();
    this.loadSalesTrends();
  }
}
