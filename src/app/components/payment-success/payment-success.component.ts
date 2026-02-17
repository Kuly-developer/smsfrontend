import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from 'src/app/services/payment.service';
import { CartService } from 'src/app/services/cart.service'; // Add CartService
import { AuthService } from 'src/app/services/auth.service'; // Add AuthService

@Component({
  selector: 'app-payment-success',
  template: `
    <div class="payment-container">
      <div *ngIf="processing" class="processing">
        <div class="spinner"></div>
        <p>⏳ Processing your payment...</p>
      </div>

      <div *ngIf="!processing && paid" class="success-page">
        <div class="success-icon">✅</div>
        <h2>Payment Successful</h2>
        <p>Thank you! Your order has been processed.</p>
        <p>Your cart has been cleared.</p>
        <button (click)="goDashboard()" class="btn-primary">Back to Dashboard</button>
      </div>

      <div *ngIf="!processing && !paid" class="failed-page">
        <div class="failed-icon">❌</div>
        <h2>Payment Failed</h2>
        <p>Your payment could not be verified.</p>
        <button (click)="goDashboard()" class="btn-primary">Back to Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .payment-container {
      max-width: 500px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .processing {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .success-page, .failed-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }
    .success-icon, .failed-icon {
      font-size: 60px;
      margin-bottom: 10px;
    }
    .success-icon {
      color: #28a745;
    }
    .failed-icon {
      color: #dc3545;
    }
    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    }
    .btn-primary:hover {
      background: #0056b3;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  sessionId: string = '';
  processing = true;
  paid = false;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private cartService: CartService, // Inject CartService
    private authService: AuthService, // Inject AuthService
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') || '';
    console.log('🔄 Payment Success Component - Session ID:', this.sessionId);
    
    if (!this.sessionId) {
      this.processing = false;
      this.paid = false;
      return;
    }

    // Poll /verify-session until payment is confirmed
    this.pollPaymentStatus();
  }

  pollPaymentStatus() {
    let attempts = 0;
    const maxAttempts = 15;
    
    const interval = setInterval(() => {
      attempts++;
      console.log(`🔄 Payment verification attempt ${attempts}/${maxAttempts}`);

      if (attempts >= maxAttempts) {
        console.log('❌ Max verification attempts reached');
        this.processing = false;
        this.paid = false;
        clearInterval(interval);
        return;
      }

      this.paymentService.verifySession(this.sessionId).subscribe({
        next: (res: any) => {
          console.log('💰 Payment verification response:', res);
          if (res.paid) {
            console.log('✅ Payment confirmed as PAID - Clearing cart...');
            this.processing = false;
            this.paid = true;
            this.clearCartAfterPayment(); // Clear cart on success
            clearInterval(interval);
          } else {
            console.log('⏳ Payment not yet confirmed, waiting...');
          }
        },
        error: (err) => {
          console.error('❌ Payment verification error:', err);
          this.processing = false;
          this.paid = false;
          clearInterval(interval);
        }
      });
    }, 2000); // every 2 seconds
  }

  private clearCartAfterPayment(): void {
    console.log('🛒 Clearing cart after successful payment...');
    
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      console.error('❌ No customer ID found for clearing cart');
      return;
    }

    // Clear cart from backend
    this.cartService.clearCart().subscribe({
      next: (response: any) => {
        console.log('✅ Cart cleared successfully from backend:', response);
        // Also clear local cart state
        this.cartService.clearLocalCart();
        
        // Store payment success timestamp
        localStorage.setItem('lastPaymentSuccess', new Date().toISOString());
      },
      error: (err: any) => {
        console.error('❌ Error clearing cart from backend:', err);
        // Even if backend fails, clear local cart
        this.cartService.clearLocalCart();
        localStorage.setItem('lastPaymentSuccess', new Date().toISOString());
      }
    });
  }

  goDashboard() {
    console.log('🔙 Navigating to dashboard...');
    this.router.navigate(['/customer-dashboard']);
  }
}