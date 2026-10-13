import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Order {
  id: number;
  customerId: number;
  total: number;
  status: string;
  hasInvoice?: boolean;
  customerName?: string;
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

interface Customer {
  id: number;
  name: string;
  email?: string;  // Made optional since we're not using it
  phone?: string;
  address?: string;
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
  customers: Map<number, Customer> = new Map();

  apiUrl: string = 'http://localhost:8889/api/accountant';
  paymentApiUrl: string = 'http://localhost:8889/api/payment';
  invoiceApiUrl: string = 'http://localhost:8889/api/invoices';
  customerApiUrl: string = 'http://localhost:8889/api/customers';

  isCreatingInvoice: number | null = null;
  isProcessingAction: boolean = false;

  showEmailModal: boolean = false;  // Kept for compatibility but not used
  selectedOrder: Order | null = null;  // Kept for compatibility
  customEmail: string = '';  // Kept for compatibility
  emailStatus: { success: boolean; message: string } | null = null;  // Kept for compatibility

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

  // ============== LOAD DATA ==============

  async loadOrders() {
    this.isProcessingAction = true;

    try {
      // First, fetch orders
      const orders = await firstValueFrom(this.http.get<Order[]>(`${this.apiUrl}/orders`));
      this.orders = orders || [];
      console.log('Orders loaded:', this.orders);

      // Clear existing customers
      this.customers.clear();

      // Then load customers for all orders
      await this.loadAllCustomers();

      // Update orders with customer info
      this.updateOrdersWithCustomerInfo();

      // Check for invoices
      await this.checkAllOrdersForInvoices();

      console.log('Final orders with customer data:', this.orders);
      console.log('Customers map:', Array.from(this.customers.entries()));

    } catch (error) {
      console.error('Failed to fetch orders:', error);
      this.orders = [];
      alert('Failed to load orders from server');
    } finally {
      this.isProcessingAction = false;
    }
  }

  async loadAllCustomers() {
    const uniqueCustomerIds = [...new Set(this.orders.map(o => o.customerId))];

    if (uniqueCustomerIds.length === 0) {
      return;
    }

    console.log('Loading customers for IDs:', uniqueCustomerIds);

    const promises = uniqueCustomerIds.map(async (customerId) => {
      try {
        const customer = await firstValueFrom(
          this.http.get<Customer>(`${this.customerApiUrl}/${customerId}`)
        );

        if (customer) {
          this.customers.set(customerId, customer);
          console.log(`Customer ${customerId} loaded:`, customer);
        }
      } catch (error) {
        console.error(`Failed to load customer ${customerId}:`, error);
      }
    });

    await Promise.all(promises);
  }

  updateOrdersWithCustomerInfo() {
    this.orders = this.orders.map(order => {
      const customer = this.customers.get(order.customerId);
      if (customer) {
        return {
          ...order,
          customerName: customer.name
        };
      }
      return order;
    });
  }

  async checkAllOrdersForInvoices() {
    const promises = this.orders.map(order => this.checkOrderHasInvoice(order));
    await Promise.all(promises);
  }

  async checkOrderHasInvoice(order: Order): Promise<void> {
    try {
      const invoice = await firstValueFrom(
        this.http.get(`${this.apiUrl}/invoices/order/${order.id}`)
      ) as any;
      order.hasInvoice = !!(invoice && invoice.id);
    } catch (error: any) {
      // 404 is expected - order has no invoice
      order.hasInvoice = false;
    }
  }

  async loadPayments() {
    this.isProcessingAction = true;

    try {
      const payments = await firstValueFrom(
        this.http.get<Payment[]>(`${this.paymentApiUrl}/payments`)
      );
      this.payments = payments || [];
      console.log('Payments loaded:', this.payments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      this.payments = [];
      alert('Failed to load payments from server');
    } finally {
      this.isProcessingAction = false;
    }
  }

  // ============== HELPER METHODS FOR CUSTOMER DATA ==============

  getCustomerEmail(customerId: number): string {
    // Removed email functionality - returns empty string
    return '';
  }

  getCustomerName(customerId: number): string {
    const order = this.orders.find(o => o.customerId === customerId);
    if (order?.customerName) {
      return order.customerName;
    }

    const customer = this.customers.get(customerId);
    return customer?.name || `Customer ${customerId}`;
  }

  // ============== INVOICE CREATION ==============

  async createInvoice(order: Order, event?: Event) {
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

    const invoiceNumber = 'INV-' + new Date().getTime() + '-' + order.id;

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/invoices`, {
          orderId: order.id,
          invoiceNumber,
          total: order.total
        })
      );

      alert(`✅ Invoice created successfully! ID: ${res.invoiceId}`);
      order.hasInvoice = true;

    } catch (error: any) {
      console.error('Failed to create invoice:', error);

      if (error.status === 409) {
        alert('Invoice already exists for this order.');
        order.hasInvoice = true;
      } else {
        alert('Failed to create invoice: ' + (error.error?.message || error.message));
      }
    } finally {
      this.isCreatingInvoice = null;
      this.isProcessingAction = false;
    }
  }

  // ============== EMAIL SENDING METHODS (REMOVED/STUBBED) ==============

  async sendInvoiceToCustomer(orderId: number, email: string): Promise<void> {
    // Stubbed - does nothing
    console.log('Email functionality removed');
    return;
  }

  openEmailModal(order: Order, event?: Event) {
    // Stubbed - does nothing
    console.log('Email functionality removed');
    return;
  }

  closeEmailModal() {
    // Stubbed - does nothing
    return;
  }

  async sendToCustomEmail() {
    // Stubbed - does nothing
    console.log('Email functionality removed');
    return;
  }

  async resendInvoice(order: Order, event?: Event) {
    // Stubbed - does nothing
    console.log('Email functionality removed');
    return;
  }

  private isValidEmail(email: string): boolean {
    // Stubbed - always returns false
    return false;
  }

  // ============== ORDER MANAGEMENT ==============

  async deleteOrder(order: Order, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (this.isProcessingAction) {
      return;
    }

    if (!confirm(`Are you sure you want to delete Order #${order.id}?`)) {
      return;
    }

    this.isProcessingAction = true;

    try {
      await firstValueFrom(
        this.http.delete(`http://localhost:8889/api/orders/${order.id}`)
      );

      alert(`✅ Order #${order.id} deleted successfully`);
      await this.loadOrders();

    } catch (error: any) {
      console.error('Failed to delete order:', error);

      if (error.status === 404) {
        alert('Order not found. It may have already been deleted.');
      } else if (error.status === 409) {
        alert('Cannot delete order because it has associated payments or invoices. Please delete those first.');
      } else {
        alert('Failed to delete order. Please try again.');
      }
    } finally {
      this.isProcessingAction = false;
    }
  }

  // ============== PAYMENT METHODS ==============

  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'paid';
      case 'pending':
        return 'pending';
      case 'failed':
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

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

  getTotalRevenue(): number {
    return this.payments
      .filter(p => p.paid)
      .reduce((sum, payment) => sum + (payment.amountPaid || payment.amount), 0);
  }

  getCompletedPayments(): number {
    return this.payments.filter(p => p.paid).length;
  }

  getPendingPayments(): number {
    return this.payments.filter(p => !p.paid).length;
  }

  viewPaymentDetails(payment: Payment, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const customerName = this.getCustomerName(payment.customerId);

    const details = `
Payment Details:
────────────────
Order ID: ${payment.orderId}
Customer: ${customerName}
Amount: $${payment.amount}
Amount Paid: $${payment.amountPaid || payment.amount}
Status: ${payment.paid ? 'Paid' : (payment.status || 'Pending')}
Session ID: ${payment.sessionId || 'N/A'}
Date: ${this.formatDate(payment.createdAt)}
    `;

    alert(details);
  }
}
