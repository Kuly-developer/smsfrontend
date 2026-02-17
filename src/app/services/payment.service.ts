import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = 'http://localhost:8889/api/payment';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // 1️⃣ Create Checkout Session
  createCheckout(amount: number, currency: string): Observable<{ url: string; orderId: number; sessionId: string }> {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      throw new Error('Customer is not logged in');
    }

    return this.http.post<{ url: string; orderId: number; sessionId: string }>(
      `${this.apiUrl}/checkout`,
      { amount, currency, customerId }
    );
  }

  // 2️⃣ Verify Session by ID
  verifySession(sessionId: string): Observable<{ paid: boolean }> {
    return this.http.post<{ paid: boolean }>(
      `${this.apiUrl}/verify-session`,
      { sessionId }
    );
  }
}
