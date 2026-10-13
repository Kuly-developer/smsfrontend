import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { CartItem } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:8889/api';
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Fetch cart from backend
  fetchCart(): void {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      this.cartSubject.next([]);
      return;
    }

    this.http.get<CartItem[]>(`${this.apiUrl}/cart/${customerId}`).subscribe({
      next: (cartItems) => {
        console.log('🛒 Fetched cart items:', cartItems);
        this.cartSubject.next(cartItems);
      },
      error: (err) => {
        console.error('❌ Error fetching cart:', err);
        this.cartSubject.next([]);
      }
    });
  }

  // Add item to cart
  addToCart(item: CartItem): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart`, item);
  }

  // Update quantity
  updateQuantity(cartItemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/cart/${cartItemId}`, { quantity });
  }

  // Remove item from cart
  removeFromCart(cartItemId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/${cartItemId}`);
  }

  // Clear entire cart
  clearCart(): Observable<any> {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      return new Observable(observer => {
        observer.next({});
        observer.complete();
      });
    }

    console.log('🗑️ Clearing cart for customer:', customerId);
    return this.http.delete(`${this.apiUrl}/cart/customer/${customerId}`);
  }

  // Clear local cart state immediately
  clearLocalCart(): void {
    console.log('🗑️ Clearing local cart state');
    this.cartSubject.next([]);
  }

  // FIXED: Calculate total correctly
  calculateTotal(): number {
    const cartItems = this.cartSubject.value;
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      // Return price * quantity for each item
      return total + (price * quantity);
    }, 0);
  }

  // Get item count
  getItemCount(): number {
    const cartItems = this.cartSubject.value;
    return cartItems.reduce((count, item) => {
      const quantity = item.quantity || 1;
      return count + quantity;
    }, 0);
  }

  // Get current cart
  getCart(): CartItem[] {
    return this.cartSubject.value;
  }
}
