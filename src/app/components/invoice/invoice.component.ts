import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService, Invoice } from 'src/app/services/invoice.service';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service'; // Your actual auth service

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
  invoices: Invoice[] = [];
  displayedInvoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;

  showDeleteModal: boolean = false;
  invoiceToDelete: Invoice | null = null;

  // Customer data from auth service
  currentCustomerId: number = 0;
  userName: string = 'Loading...';
  customerCode: string = 'Loading...';

  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService // Inject your auth service
  ) {}

  ngOnInit() {
    this.loadCustomerData();
  }

  loadCustomerData() {
    // Get customer ID from auth service
    const customerId = this.authService.getCustomerId();
    const username = localStorage.getItem('username') || 'Customer';
    
    if (customerId) {
      this.currentCustomerId = customerId;
      this.userName = username;
      this.customerCode = `CUST-${customerId}`;
      
      console.log('👤 Loaded customer from auth:', {
        id: this.currentCustomerId,
        name: this.userName,
        code: this.customerCode
      });
      
      this.fetchInvoices();
    } else {
      console.error('❌ No customer ID found in auth service');
      this.showAuthError();
    }
  }

  private showAuthError() {
    console.log('🔍 Debug auth storage:');
    console.log('customerId:', this.authService.getCustomerId());
    console.log('token:', this.authService.getToken());
    console.log('username:', localStorage.getItem('username'));
    console.log('role:', localStorage.getItem('role'));
    
    alert('Please log in to view your invoices. No customer ID found.');
    
    // For debugging, you can temporarily set a test customer ID
    // ⚠️ Remove this in production
    const testCustomerId = this.getTestCustomerId();
    if (testCustomerId) {
      this.currentCustomerId = testCustomerId;
      this.userName = 'Test Customer';
      this.customerCode = 'CUST-TEST';
      console.warn('⚠️ Using test customer ID:', this.currentCustomerId);
      this.fetchInvoices();
    }
  }

  private getTestCustomerId(): number | null {
    // Check if there's a test customer ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('testCustomerId');
    if (testId) return parseInt(testId);
    
    // Or return a default test ID (change this to match your database)
    return 1; // Change this to an actual customer ID that has invoices
  }

  fetchInvoices() {
    if (!this.currentCustomerId || this.currentCustomerId === 0) {
      console.error('❌ Invalid customer ID:', this.currentCustomerId);
      return;
    }

    console.log('🔄 Fetching invoices for customer ID:', this.currentCustomerId);
    
    this.invoiceService.getInvoicesByCustomer(this.currentCustomerId).subscribe({
      next: (data: Invoice[]) => {
        console.log('✅ Received invoices:', data);
        this.invoices = data;
        this.filteredInvoices = [...this.invoices];
        this.updateDisplayedInvoices();
        
        if (this.invoices.length === 0) {
          console.warn('⚠️ No invoices found for customer ID:', this.currentCustomerId);
          this.showNoInvoicesMessage();
        } else {
          console.log('🎉 Successfully loaded', this.invoices.length, 'invoices');
        }
      },
      error: (err: any) => {
        console.error('❌ Failed to fetch invoices', err);
        this.handleError(err);
      }
    });
  }

  private showNoInvoicesMessage() {
    const message = `No invoices found for customer ${this.currentCustomerId}. 
This could mean:
1. The customer has no orders
2. Orders exist but no invoices were generated
3. The customer ID doesn't exist in the database

Please check the database for customer ID: ${this.currentCustomerId}`;
    
    console.warn(message);
  }

  private handleError(err: any) {
    let message = 'Error loading invoices. ';
    
    if (err.status === 404) {
      message += 'Customer not found. ';
    } else if (err.status === 500) {
      message += 'Server error. ';
    } else if (err.status === 0) {
      message += 'Cannot connect to server. Check if backend is running. ';
    }
    
    message += `Customer ID: ${this.currentCustomerId}`;
    alert(message);
  }

  // ... rest of your methods remain the same ...
  filterInvoices() {
    if (!this.searchTerm.trim()) {
      this.filteredInvoices = [...this.invoices];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredInvoices = this.invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.total.toString().includes(term) ||
        this.formatDate(inv.created_at).toLowerCase().includes(term) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(term))
      );
    }
    this.currentPage = 1;
    this.updateDisplayedInvoices();
  }

  updateDisplayedInvoices() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedInvoices = this.filteredInvoices.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    if (totalPages === 0) return [];
    
    const maxPages = 5;
    const start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    const end = Math.min(totalPages, start + maxPages - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage = page;
    this.updateDisplayedInvoices();
  }

  getStartIndex(): number {
    return (this.currentCustomerId - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredInvoices.length);
  }

  getUserInitials(): string {
    return this.userName.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  openDeleteModal(invoice: Invoice) {
    this.invoiceToDelete = invoice;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.invoiceToDelete = null;
  }

  confirmDelete() {
    if (this.invoiceToDelete) {
      this.invoiceService.deleteInvoice(this.invoiceToDelete.id).subscribe({
        next: () => {
          this.invoices = this.invoices.filter(i => i.id !== this.invoiceToDelete!.id);
          this.filterInvoices();
          this.closeDeleteModal();
          alert('Invoice deleted successfully!');
        },
        error: (err: any) => {
          console.error('❌ Failed to delete invoice', err);
          alert('Error deleting invoice. Please try again.');
        }
      });
    }
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  downloadPDF(invoice: Invoice) {
    console.log('Download PDF for invoice', invoice.invoice_number);
    alert('PDF download feature coming soon!');
  }

  printInvoice(invoice: Invoice) {
    this.invoiceService.printInvoice(invoice);
  }
}