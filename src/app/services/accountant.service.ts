// src/app/services/accountant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  id: number;
  customerId: number;
  total: number;
  status: string;
  // Optional: add items if you want
  items?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AccountantService {
  private apiUrl = 'http://localhost:8889/api/accountant';

  constructor(private http: HttpClient) {}

  // Get all orders
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  // Create invoice
  createInvoice(orderId: number, invoiceNumber: string, total: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices`, {
      orderId,
      invoiceNumber,
      total
    });
  }
}
