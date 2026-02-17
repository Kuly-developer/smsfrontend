import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Order {
  id: number;
  customerId: number;
  total: number;
  status: string;
  hasInvoice?: boolean;
}

interface Payment {
  id: number;
  orderId: number;
  customerId: number;
  amount: number;
  status: string;
  sessionId: string;
  createdAt: string;
  paid: boolean;
  amountPaid?: number;
}

@Component({
  selector: 'app-accountant',
  templateUrl: './accountant.component.html',
  styleUrls: ['./accountant.component.scss']
})
export class AccountantComponent implements OnInit {
  activeMenu: string = 'invoices';
  orders: Order[] = [];
  payments: Payment[] = [];
  apiUrl: string = 'http://localhost:8889/api/accountant';
  paymentApiUrl: string = 'http://localhost:8889/api/payment';
  
  isCreatingInvoice: number | null = null;
  isProcessingAction: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.activeMenu === 'invoices') {
      this.loadOrders();
    }
  }

  setActive(menu: string) {
    this.activeMenu = menu;

    if (menu === 'invoices') {
      this.loadOrders();
    } else if (menu === 'payments') {
      this.loadPayments();
    }
  }

  // Fetch all orders and check for existing invoices
  loadOrders() {
    this.http.get<Order[]>(`${this.apiUrl}/orders`).subscribe({
      next: (res) => {
        this.orders = res;
        // Check which orders already have invoices
        this.checkAllOrdersForInvoices();
      },
      error: (err) => {
        console.error('Failed to fetch orders:', err);
        this.orders = [];
        alert('Failed to load orders from server');
      }
    });
  }

  // Check all orders for existing invoices
  checkAllOrdersForInvoices() {
    const checkPromises = this.orders.map(order => 
      this.checkOrderHasInvoice(order)
    );

    // Wait for all invoice checks to complete
    Promise.all(checkPromises).then(() => {
      console.log('All invoice checks completed');
    });
  }

  // Check if a specific order has an invoice
  checkOrderHasInvoice(order: Order): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/invoices/order/${order.id}`).subscribe({
        next: (invoice: any) => {
          // If invoice exists for this order, mark it
          if (invoice && invoice.id) {
            order.hasInvoice = true;
            console.log(`Order ${order.id} has existing invoice`);
          } else {
            order.hasInvoice = false;
          }
          resolve();
        },
        error: (err) => {
          // If 404, no invoice exists
          if (err.status === 404) {
            order.hasInvoice = false;
          } else {
            console.error('Error checking invoice for order:', order.id, err);
            // On error, assume no invoice to be safe
            order.hasInvoice = false;
          }
          resolve();
        }
      });
    });
  }

  // Alternative method: Load orders with invoices in one API call
  loadOrdersWithInvoices() {
    this.http.get<Order[]>(`${this.apiUrl}/orders`).subscribe({
      next: (orders) => {
        // First set all orders without invoices
        this.orders = orders.map(order => ({
          ...order,
          hasInvoice: false
        }));

        // Then get all invoices and mark orders that have them
        this.http.get<any[]>(`${this.apiUrl}/invoices`).subscribe({
          next: (invoices) => {
            const ordersWithInvoices = new Set(
              invoices.map(invoice => invoice.orderId)
            );
            
            this.orders = this.orders.map(order => ({
              ...order,
              hasInvoice: ordersWithInvoices.has(order.id)
            }));
          },
          error: (err) => {
            console.error('Failed to load invoices:', err);
            // If we can't load invoices, keep orders as is (no invoices)
          }
        });
      },
      error: (err) => {
        console.error('Failed to fetch orders:', err);
        this.orders = [];
        alert('Failed to load orders from server');
      }
    });
  }

  // Fetch all payments
  loadPayments() {
    this.http.get<Payment[]>(`${this.paymentApiUrl}/payments`).subscribe({
      next: (res) => {
        this.payments = res;
        console.log('Payments loaded:', this.payments);
      },
      error: (err) => {
        console.error('Failed to fetch payments:', err);
        this.payments = [];
        alert('Failed to load payments from server');
      }
    });
  }

  // Create invoice for a specific order
  createInvoice(order: Order, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isCreatingInvoice || this.isProcessingAction || order.hasInvoice) {
      return;
    }

    if (!confirm(`Create invoice for Order #${order.id}?`)) {
      return;
    }

    this.isCreatingInvoice = order.id;
    this.isProcessingAction = true;

    const invoiceNumber = 'INV-' + new Date().getTime();
    
    this.http.post(`${this.apiUrl}/invoices`, {
      orderId: order.id,
      invoiceNumber,
      total: order.total
    }).subscribe({
      next: (res: any) => {
        alert(`Invoice created successfully! ID: ${res.invoiceId}`);
        
        // Mark order as having an invoice
        order.hasInvoice = true;
        
        console.log(`Invoice created for order ${order.id}, hasInvoice set to:`, order.hasInvoice);
      },
      error: (err) => {
        console.error('Failed to create invoice:', err);
        
        if (err.status === 409) {
          alert('Invoice already exists for this order.');
          order.hasInvoice = true;
        } else {
          alert('Failed to create invoice');
        }
      },
      complete: () => {
        this.isCreatingInvoice = null;
        this.isProcessingAction = false;
      }
    });
  }

  // Delete order
  deleteOrder(order: Order, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isProcessingAction) {
      return;
    }

    if (!confirm(`#${order.id}`)) {
      return;
    }

    this.isProcessingAction = true;

    this.http.delete(`http://localhost:8889/api/orders/${order.id}`).subscribe({
      next: () => {
        alert(`Order #${order.id} deleted successfully`);
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed to delete order:', err);
        
        if (err.status === 404) {
          alert('Order not found. It may have already been deleted.');
        } else if (err.status === 409) {
          alert('Cannot delete order because it has associated payments or invoices. Please delete those first.');
        } else {
          alert('Failed to delete order. Please try again.');
        }
      },
      complete: () => {
        this.isProcessingAction = false;
      }
    });
  }

  // Get payment status badge class
  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'failed':
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  // Format date
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  // Calculate total revenue
  getTotalRevenue(): number {
    return this.payments
      .filter(p => p.paid)
      .reduce((sum, payment) => sum + (payment.amountPaid || payment.amount), 0);
  }

  // Count completed payments
  getCompletedPayments(): number {
    return this.payments.filter(p => p.paid).length;
  }

  // Count pending payments
  getPendingPayments(): number {
    return this.payments.filter(p => !p.paid).length;
  }

  // View payment details
  viewPaymentDetails(payment: Payment, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const details = `
Payment Details:
────────────────
Order ID: ${payment.orderId}
Customer ID: ${payment.customerId}
Amount: $${payment.amount}
Amount Paid: $${payment.amountPaid || payment.amount}
Status: ${payment.paid ? 'Paid' : (payment.status || 'Pending')}
Session ID: ${payment.sessionId || 'N/A'}
Date: ${this.formatDate(payment.createdAt)}
Paid: ${payment.paid ? 'Yes' : 'No'}
    `;

    alert(details);
  }
}