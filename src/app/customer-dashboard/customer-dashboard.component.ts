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
  category_id?: number;
  category_name?: string;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  cart: CartItem[] = [];
  searchTerm: string = '';
  cartVisible: boolean = false;
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

  // COMPUTED: total cart payment
  get totalPayment(): number {
    return this.cart.reduce((total, item) => total + (item.price || 0)  , 0);
  }

  ngOnInit(): void {
    console.log('🚀 CustomerDashboardComponent initialized');

    // Try to fetch from API first
    this.fetchProducts();
    this.fetchCategories();

    // Set up cart subscription
    this.setupCartSubscription();
    this.cartService.fetchCart();
    this.checkPaymentReturn();

    // Fallback: if no categories after 3 seconds, use fallback
    setTimeout(() => {
      if (this.categories.length === 0) {
        console.warn('⚠️ No categories loaded after 3 seconds, using fallback');
        this.useFallbackCategories();
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) this.cartSubscription.unsubscribe();
    if (this.paymentPollingSubscription) this.paymentPollingSubscription.unsubscribe();
  }

  // -------------------- PRODUCTS --------------------
  fetchProducts() {
    console.log('🔍 Fetching products from:', `${this.apiUrl}/products/public`);

    this.http.get<Product[]>(`${this.apiUrl}/products/public`, { observe: 'response' }).subscribe({
      next: (response) => {
        console.log('✅ Products response status:', response.status);
        console.log('📦 Products response body:', response.body);

        if (response.body) {
          this.products = response.body;
          this.filteredProducts = [...this.products];

          // Debug: Check which products have category information
          const productsWithCategoryId = this.products.filter(p => p.category_id);
          const productsWithCategoryName = this.products.filter(p => p.category_name);

          console.log(`📊 Products with category_id: ${productsWithCategoryId.length}/${this.products.length}`);
          console.log(`📊 Products with category_name: ${productsWithCategoryName.length}/${this.products.length}`);

          // Log first product to see structure
          if (this.products.length > 0) {
            console.log('📦 First product structure:', JSON.stringify(this.products[0], null, 2));
          }

          // If categories array is still empty, try to extract from products
          if (this.categories.length === 0) {
            this.extractCategoriesFromProducts();
          }
        }
      },
      error: (err) => {
        console.error('❌ Error fetching products. Status:', err.status);
        console.error('Error details:', err.message);
        console.error('Full error:', err);

        // Use mock products as fallback
        this.useMockProducts();
      }
    });
  }

  fetchCategories() {
    console.log('🔍 Fetching categories from:', `${this.apiUrl}/categories`);

    this.http.get<Category[]>(`${this.apiUrl}/categories`, { observe: 'response' }).subscribe({
      next: (response) => {
        console.log('✅ Categories response status:', response.status);
        console.log('📦 Categories response body:', response.body);

        if (response.body && response.body.length > 0) {
          this.categories = response.body;
          console.log('🎉 Categories loaded successfully:', this.categories);
        } else {
          console.warn('⚠️ Categories array is empty or null');
          // If no categories from API, try to extract from products
          this.extractCategoriesFromProducts();
        }
      },
      error: (err) => {
        console.error('❌ Error fetching categories. Status:', err.status);
        console.error('Error details:', err.message);
        console.error('Full error:', err);

        // If API fails, try to extract from products
        this.extractCategoriesFromProducts();
      }
    });
  }

  // Extract unique categories from products
  extractCategoriesFromProducts() {
    console.log('🔍 Extracting categories from products...');

    if (!this.products || this.products.length === 0) {
      console.warn('⚠️ No products available to extract categories');
      // Use fallback categories
      this.useFallbackCategories();
      return;
    }

    const categoryMap = new Map<number, string>();

    this.products.forEach(product => {
      if (product.category_id) {
        // Use category_name if available, otherwise use a default name
        const categoryName = product.category_name || `Category ${product.category_id}`;
        categoryMap.set(product.category_id, categoryName);
      }
    });

    if (categoryMap.size === 0) {
      console.warn('⚠️ No categories found in products');
      this.useFallbackCategories();
      return;
    }

    this.categories = Array.from(categoryMap.entries()).map(([id, name]) => ({
      id,
      name
    }));

    console.log('✅ Categories extracted from products:', this.categories);
  }

  // Fallback categories if everything fails
  useFallbackCategories() {
    console.log('📦 Using fallback categories');
    this.categories = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Clothing' },
      { id: 3, name: 'Books' },
     
    ];
  }

  // Add mock products as fallback
  useMockProducts() {
    console.log('📦 Using mock products');
    this.products = [
      {
        id: 1,
        name: 'Smartphone',
        description: 'Latest model with great features',
        price: 699.99,
        stock: 15,
        image_url: 'https://via.placeholder.com/150',
        category_id: 1,
        category_name: 'Electronics'
      },
      {
        id: 2,
        name: 'T-Shirt',
        description: 'Cotton comfortable t-shirt',
        price: 19.99,
        stock: 50,
        image_url: 'https://via.placeholder.com/150',
        category_id: 2,
        category_name: 'Clothing'
      },
      {
        id: 3,
        name: 'Novel',
        description: 'Bestselling fiction book',
        price: 14.99,
        stock: 30,
        image_url: 'https://via.placeholder.com/150',
        category_id: 3,
        category_name: 'Books'
      }
    ];
    this.filteredProducts = [...this.products];
    this.extractCategoriesFromProducts();
  }

  filterByCategory(event: Event) {
    const select = event.target as HTMLSelectElement;
    const categoryId = select.value;

    if (!categoryId) {
      // If "All Categories" is selected, show all products
      this.filteredProducts = [...this.products];
      return;
    }

    console.log(`Filtering by category ID: ${categoryId}`);

    // Filter locally first (instant feedback)
    this.filteredProducts = this.products.filter(p => p.category_id === Number(categoryId));

    // Also fetch from server to get complete data with category names
    this.http.get<Product[]>(`${this.apiUrl}/products/category/${categoryId}`)
      .subscribe({
        next: (data) => {
          this.filteredProducts = data;
          console.log('Filtered by category:', data);
        },
        error: (err) => {
          console.error('Error filtering by category:', err);
          // If server fails, keep the local filter result
        }
      });
  }

  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = term
      ? this.products.filter(p =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
        )
      : [...this.products];
  }

  // Helper method to get category name for display
  getCategoryName(categoryId: number | undefined): string {
    if (!categoryId) return 'Uncategorized';
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  // -------------------- CART --------------------
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
      alert('Please login first!');
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
      next: () => this.cartService.fetchCart(),
      error: (err) => console.error('Error adding to cart:', err)
    });
  }

  increaseQuantity(item: CartItem) {
    if (!item.id) return;
    const stock = this.getProductStock(item.productId);
    const qty = item.quantity || 1;
    if (qty >= stock) return;
    this.cartService.updateQuantity(item.id, qty + 1).subscribe(() => this.cartService.fetchCart());
  }

  decreaseQuantity(item: CartItem) {
    if (!item.id) return;
    const qty = item.quantity || 1;
    if (qty > 1) {
      this.cartService.updateQuantity(item.id, qty - 1).subscribe(() => this.cartService.fetchCart());
    } else {
      this.removeFromCart(item);
    }
  }

  removeFromCart(item: CartItem) {
    if (!item.id) return;
    this.cartService.removeFromCart(item.id).subscribe(() => this.cartService.fetchCart());
  }

  getProductStock(productId: number): number {
    const product = this.products.find(p => p.id === productId);
    return product ? product.stock : 0;
  }

  isMaxQuantityReached(item: CartItem): boolean {
    return (item.quantity || 1) >= this.getProductStock(item.productId);
  }

  // -------------------- PAYMENT --------------------
  checkout() {
    if (!this.cart.length) {
      alert('Cart is empty!');
      return;
    }

    const invalid = this.cart.filter(i => (i.quantity || 1) > this.getProductStock(i.productId));
    if (invalid.length) {
      alert('Some items exceed available stock!');
      return;
    }

    this.isProcessing = true;
    this.paymentStatus = 'processing';
    this.showPaymentModal = true;

    this.paymentService.createCheckout(this.totalPayment, 'usd').subscribe({
      next: (res: any) => {
        if (res.url && res.sessionId) {
          this.currentSessionId = res.sessionId;
          localStorage.setItem('currentCheckoutSession', res.sessionId);
          window.location.href = res.url;
        } else {
          alert('Payment session could not be created');
          this.isProcessing = false;
          this.showPaymentModal = false;
        }
      },
      error: (err) => {
        console.error('Checkout error:', err);
        alert('Failed to start payment');
        this.isProcessing = false;
        this.showPaymentModal = false;
      }
    });
  }

  private checkPaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      this.currentSessionId = sessionId;
      this.isProcessing = true;
      this.paymentStatus = 'processing';
      this.showPaymentModal = true;
      this.verifyPaymentStatus(sessionId);
      history.replaceState({}, '', window.location.pathname);
    }
  }

  private verifyPaymentStatus(sessionId: string) {
    let attempts = 0;
    const maxAttempts = 15;

    this.paymentPollingSubscription = interval(2000).subscribe(() => {
      if (attempts >= maxAttempts) {
        this.handlePaymentFailure();
        return;
      }
      attempts++;

      this.paymentService.verifySession(sessionId).subscribe({
        next: (res: any) => {
          if (res.paid) {
            this.handlePaymentSuccess();
          } else if (attempts >= maxAttempts) {
            this.handlePaymentFailure();
          }
        },
        error: (err) => {
          console.error('Payment verification error:', err);
          if (attempts >= maxAttempts) {
            this.handlePaymentFailure();
          }
        }
      });
    });
  }

  private handlePaymentSuccess() {
    if (this.paymentPollingSubscription) {
      this.paymentPollingSubscription.unsubscribe();
    }
    this.paymentStatus = 'success';
    this.isProcessing = false;
    this.cartVisible = false;
    this.clearCartAfterPayment();
  }

  private handlePaymentFailure() {
    if (this.paymentPollingSubscription) {
      this.paymentPollingSubscription.unsubscribe();
    }
    this.paymentStatus = 'failed';
    this.isProcessing = false;
    this.cartService.fetchCart();
  }

  private clearCartAfterPayment() {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.cartService.fetchCart();
        this.cartService.clearLocalCart();
      },
      error: (err) => console.error('Error clearing cart:', err)
    });
  }

  closeModal() {
    this.showPaymentModal = false;
    this.paymentStatus = null;
  }

  forceClearCart() {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.cartService.clearLocalCart();
        this.closeModal();
      },
      error: (err) => console.error('Error force clearing cart:', err)
    });
  }

  // -------------------- NAVIGATION --------------------
  goToInvoice() {
    this.router.navigate(['/invoice']);
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  // -------------------- CART SUBSCRIPTION --------------------
  private setupCartSubscription() {
    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.cart = items;
    });
  }
}
