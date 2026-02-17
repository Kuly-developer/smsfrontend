import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Order {
  id: number;
  customerId: number;
  total: number;
  status: string;
  createdAt: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
}

interface OrderDetails {
  order: Order;
  items: OrderItem[];
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  selectedOrder: OrderDetails | null = null;
  loading: boolean = false;
  apiUrl: string = 'http://localhost:8889/api';

  searchTerm: string = '';

  // Stats - Only what we need
  totalOrders: number = 0;
  totalRevenue: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // Load all orders
  loadOrders() {
    this.loading = true;
    this.http.get<Order[]>(`${this.apiUrl}/orders`).subscribe({
      next: (res) => {
        this.orders = res;
        this.calculateTotalRevenue();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch orders:', err);
        this.orders = [];
        this.loading = false;
      }
    });
  }

  // Calculate total revenue - SIMPLE VERSION
  calculateTotalRevenue() {
    this.totalOrders = this.orders.length;
    
    // Simply add up all order totals
    this.totalRevenue = this.orders.reduce((sum, order) => {
      return sum + (order.total || 0);
    }, 0);
    
    console.log('Total Revenue Calculated:', this.totalRevenue);
    console.log('Number of orders:', this.totalOrders);
  }

  // Get filtered orders
  get filteredOrders(): Order[] {
    if (!this.searchTerm) {
      return this.orders;
    }

    const term = this.searchTerm.toLowerCase();
    return this.orders.filter(order =>
      order.id.toString().includes(term) ||
      order.customerId.toString().includes(term) ||
      order.status.toLowerCase().includes(term)
    );
  }

  // View order details
  viewOrderDetails(order: Order) {
    this.loading = true;

    this.http.get<OrderItem[]>(`${this.apiUrl}/orders/${order.id}/items`).subscribe({
      next: (items) => {
        this.selectedOrder = {
          order: order,
          items: items
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch order items:', err);
        this.selectedOrder = {
          order: order,
          items: []
        };
        this.loading = false;
      }
    });
  }

  // Close order details
  closeOrderDetails() {
    this.selectedOrder = null;
  }

  // Create invoice for order
  createInvoice(order: Order) {
    const invoiceNumber = 'INV-' + new Date().getTime() + '-' + order.id;
    this.http.post(`${this.apiUrl}/invoices`, {
      orderId: order.id,
      invoiceNumber: invoiceNumber,
      total: order.total
    }).subscribe({
      next: (res: any) => {
        alert(`Invoice created successfully! ID: ${res.invoiceId}`);
      },
      error: (err) => {
        console.error('Failed to create invoice:', err);
        alert('Failed to create invoice');
      }
    });
  }

  // Format currency
  formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Clear filters
  clearFilters() {
    this.searchTerm = '';
  }
}