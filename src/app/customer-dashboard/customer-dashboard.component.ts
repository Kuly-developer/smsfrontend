import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { CartService } from 'src/app/services/cart.service';
import { Router } from '@angular/router';
import { CartItem } from 'src/app/models/cart-item.model';
import { PaymentService } from 'src/app/services/payment.service';
import { Subscription, interval } from 'rxjs';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  cart: CartItem[] = [];
  searchTerm: string = '';
  
  // REMOVED: totalPayment: number = 0;
  // Using computed property instead
  
  cartVisible: boolean = false;
  itemCount: number = 0;
  isProcessing: boolean = false;
  showPaymentModal: boolean = false;
  paymentStatus: 'success' | 'failed' | 'processing' | null = null;
  private cartSubscription: Subscription | null = null;
  private paymentPollingSubscription: Subscription | null = null;
  private currentSessionId: string | null = null;

  private apiUrl = 'http://localhost:8889/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  // 🧮 COMPUTED PROPERTY: Calculate total correctly
  get totalPayment(): number {
    return this.cart.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      const itemTotal = price ;
      return total + itemTotal;
    }, 0);
  }

  ngOnInit(): void {
    this.fetchProducts();
    this.setupCartSubscription();
    this.cartService.fetchCart();

    // Check if user returned from payment gateway
    this.checkPaymentReturn();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    this.stopPaymentPolling();
  }

  // 🧩 Helper: get product stock by ID
  getProductStock(productId: number): number {
    const product = this.products.find(p => p.id === productId);
    return product ? product.stock : 0;
  }

  // 🧩 Check if user reached max allowed quantity
  isMaxQuantityReached(item: CartItem): boolean {
    const productStock = this.getProductStock(item.productId);
    return (item.quantity || 1) >= productStock;
  }

  // 🧩 Stop polling payment status
  private stopPaymentPolling(): void {
    if (this.paymentPollingSubscription) {
      this.paymentPollingSubscription.unsubscribe();
      this.paymentPollingSubscription = null;
    }
  }

  // 🧩 Check payment return
  private checkPaymentReturn(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      this.currentSessionId = sessionId;
      this.isProcessing = true;
      this.paymentStatus = 'processing';
      this.showPaymentModal = true;
      this.verifyPaymentStatus(sessionId);

      // Clean up URL immediately
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }

  // 🧩 Verify payment success/failure
  private verifyPaymentStatus(sessionId: string): void {
    this.stopPaymentPolling();

    let attempts = 0;
    const maxAttempts = 15;

    this.paymentPollingSubscription = interval(2000).subscribe(() => {
      if (attempts >= maxAttempts) {
        this.stopPaymentPolling();
        this.handlePaymentFailure();
        return;
      }

      attempts++;
      console.log(`🔄 Payment verification attempt ${attempts}/${maxAttempts}`);
      
      this.paymentService.verifySession(sessionId).subscribe({
        next: (response) => {
          console.log('💰 Payment verification response:', response);
          if (response.paid) {
            this.handlePaymentSuccess();
          } else if (attempts >= maxAttempts) {
            this.handlePaymentFailure();
          }
        },
        error: (err) => {
          console.error('❌ Payment verification error:', err);
          if (attempts >= maxAttempts) {
            this.handlePaymentFailure();
          }
        }
      });
    });
  }

  private handlePaymentSuccess(): void {
    console.log('✅ Payment successful!');
    this.stopPaymentPolling();
    this.isProcessing = false;
    this.paymentStatus = 'success';
    this.cartVisible = false;

    // Clear cart immediately and forcefully
    this.clearCartAfterPayment();

    // Store payment success timestamp
    localStorage.setItem('lastPaymentSuccess', new Date().toISOString());
    
    // Force refresh the cart to ensure it's empty
    setTimeout(() => {
      this.cartService.fetchCart();
    }, 1000);
  }

  private handlePaymentFailure(): void {
    console.log('❌ Payment failed or could not be verified');
    this.stopPaymentPolling();
    this.isProcessing = false;
    this.paymentStatus = 'failed';
    this.cartService.fetchCart();
  }

  private clearCartAfterPayment(): void {
    console.log('🛒 FORCE Clearing cart after successful payment...');
    this.cartService.clearLocalCart();
    
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('✅ Cart cleared successfully from backend');
        this.cartService.fetchCart();
      },
      error: (err) => {
        console.error('❌ Error clearing cart from backend:', err);
        this.cartService.clearLocalCart();
      }
    });
  }

  private setupCartSubscription(): void {
    this.cartSubscription = this.cartService.cart$.subscribe(cartItems => {
      console.log('🛒 Cart updated in dashboard:', cartItems);
      this.cart = cartItems;
      
      // REMOVED: this.totalPayment = this.cartService.calculateTotal();
      // Using computed property instead
      
      this.itemCount = this.cartService.getItemCount();
      
      // Debug: Log detailed calculation
      console.log('🧮 Detailed total calculation:');
      this.cart.forEach(item => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        console.log(`   ${item.name}: $${item.price} x ${item.quantity} = $${itemTotal}`);
      });
      console.log('💰 FINAL TOTAL:', this.totalPayment);
      
      if (this.cart.length === 0) console.log('🛒 Cart is now EMPTY');
      else console.log(`🛒 Cart has ${this.cart.length} items`);
      this.checkRecentPayment();
    });
  }

  private checkRecentPayment(): void {
    const lastPaymentSuccess = localStorage.getItem('lastPaymentSuccess');
    if (lastPaymentSuccess && this.cart.length > 0) {
      const paymentTime = new Date(lastPaymentSuccess).getTime();
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - paymentTime;

      if (timeDiff < 2 * 60 * 1000) {
        console.log('🕒 Recent payment detected, clearing cart...');
        this.clearCartAfterPayment();
        localStorage.removeItem('lastPaymentSuccess');
      }
    }
  }

  // 📦 Fetch products
  fetchProducts() {
    this.http.get<Product[]>(`${this.apiUrl}/products/public`).subscribe({
      next: res => {
        this.products = res;
        this.filteredProducts = [...res];
        console.log('📦 Products loaded for stock validation');
      },
      error: err => console.error('❌ Error fetching products:', err)
    });
  }

  // 🔍 Search
  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = term
      ? this.products.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
        )
      : [...this.products];
  }

  toggleCart() {
    this.cartVisible = !this.cartVisible;
  }

  addToCart(product: Product) {
    if (product.stock <= 0) {
      alert('This product is out of stock!');
      return;
    }

    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      alert('You must be logged in to add items to cart.');
      this.router.navigate(['/login']);
      return;
    }

    const item: CartItem = {
      customerId,
      productId: product.id,
      quantity: 1,
      name: product.name,
      price: product.price,
      image_url: product.image_url
    };

    this.cartService.addToCart(item).subscribe({
      next: () => {
        console.log('✅ Item added to cart:', product.name);
        this.cartService.fetchCart();
      },
      error: err => {
        console.error('❌ Error adding to cart:', err);
        alert('Failed to add item to cart: ' + (err?.error?.message || err.message));
      }
    });
  }

  increaseQuantity(item: CartItem) {
    if (!item.id) return;
    const productStock = this.getProductStock(item.productId);
    const currentQuantity = item.quantity || 1;

    if (currentQuantity >= productStock) {
      alert(`Cannot add more than available stock! Maximum quantity: ${productStock}`);
      return;
    }

    const newQuantity = currentQuantity + 1;
    this.cartService.updateQuantity(item.id, newQuantity).subscribe(() => this.cartService.fetchCart());
  }

  decreaseQuantity(item: CartItem) {
    if (!item.id) return;
    if ((item.quantity || 1) > 1) {
      const newQuantity = (item.quantity || 1) - 1;
      this.cartService.updateQuantity(item.id, newQuantity).subscribe(() => this.cartService.fetchCart());
    } else {
      this.removeFromCart(item);
    }
  }

  removeFromCart(item: CartItem) {
    if (!item.id) return;
    this.cartService.removeFromCart(item.id).subscribe(() => this.cartService.fetchCart());
  }

  checkout() {
    if (this.cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const invalidItems = this.cart.filter(item => {
      const productStock = this.getProductStock(item.productId);
      return (item.quantity || 1) > productStock;
    });

    if (invalidItems.length > 0) {
      alert('Some items in your cart exceed available stock. Please adjust quantities before checkout.');
      return;
    }

    console.log('💰 Starting checkout process...');
    console.log('🧮 Final total to charge:', this.totalPayment);
    this.isProcessing = true;

    this.paymentService.createCheckout(this.totalPayment, 'usd').subscribe({
      next: (res: any) => {
        if (res.url && res.sessionId) {
          this.currentSessionId = res.sessionId;
          console.log('🔗 Redirecting to payment gateway...');
          localStorage.setItem('currentCheckoutSession', res.sessionId);
          window.location.href = res.url;
        } else {
          alert('Payment session could not be created.');
          this.isProcessing = false;
        }
      },
      error: (err) => {
        console.error('❌ Payment failed:', err);
        alert('Failed to start payment. Try again.');
        this.isProcessing = false;
      }
    });
  }

  closeModal() {
    this.showPaymentModal = false;
    this.paymentStatus = null;
    this.isProcessing = false;
    this.cartService.fetchCart();
  }

  forceClearCart() {
    console.log('🛒 Manually clearing cart...');
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('✅ Cart cleared manually');
        this.cartService.fetchCart();
        this.closeModal();
      },
      error: (err) => {
        console.error('❌ Error clearing cart manually:', err);
        this.cartService.clearLocalCart();
        this.closeModal();
      }
    });
  }

  // 📄 Navigate to invoice page
  goToInvoice() {
    this.router.navigate(['/invoice']);
  }

  // 🔙 Navigate back to login page
  goBackToLogin() {
    this.router.navigate(['/login']);
  }
}