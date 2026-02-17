import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface Order {
  customerId: number;
  total: number;
  items: OrderItem[];
}

export interface OrderResponse {
  message: string;
  orderId: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = 'http://localhost:8889/api/orders';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Create order - this will automatically update stock in backend
  createOrder(order: Order): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, order, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all orders
  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl, {
      headers: this.getAuthHeaders()
    });
  }

  // Get order by ID
  getOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get order items
  getOrderItems(orderId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${orderId}/items`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update order status
  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${orderId}/status`, { status }, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete order
  deleteOrder(orderId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${orderId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get orders by customer
  getOrdersByCustomer(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/customer/${customerId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get orders by status
  getOrdersByStatus(status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/status/${status}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create invoice
  createInvoice(orderId: number, invoiceNumber: string, total: number): Observable<any> {
    return this.http.post<any>(`http://localhost:8889/api/invoices`, {
      orderId,
      invoiceNumber,
      total
    }, {
      headers: this.getAuthHeaders()
    });
  }
}
