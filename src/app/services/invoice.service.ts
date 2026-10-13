import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Invoice {
  id: number;
  invoice_number: string;
  total: number;
  created_at: string;
  order_id: number;
  customer_name: string;
  customer_email: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'http://localhost:8889/api/invoices';

  constructor(private http: HttpClient) {}

  // Get all invoices for a customer
  getInvoicesByCustomer(customerId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/${customerId}`);
  }

  // Delete an invoice
  deleteInvoice(invoiceId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${invoiceId}`);
  }

  // Print invoice in a new window
  printInvoice(invoice: Invoice): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(this.generateInvoiceHTML(invoice));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  // Generate invoice HTML for printing
  private generateInvoiceHTML(invoice: Invoice): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              line-height: 1.6; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
            }
            .invoice-info { 
              display: flex; 
              justify-content: space-between; 
              margin: 20px 0; 
            }
            .customer-info { 
              background: #f9f9f9; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0; 
              padding: 5px 0; 
            }
            .total { 
              font-size: 20px; 
              font-weight: bold; 
              margin-top: 25px; 
              padding-top: 15px; 
              border-top: 2px solid #333; 
              text-align: right; 
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              color: #666; 
              font-style: italic; 
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <h2>${invoice.invoice_number}</h2>
          </div>
          
          <div class="invoice-info">
            <div>
              <strong>Invoice Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}<br>
              <strong>Order ID:</strong> ${invoice.order_id}
            </div>
          </div>

          <div class="customer-info">
            <h3>Bill To:</h3>
            <strong>${invoice.customer_name}</strong><br>
            ${invoice.customer_email}
          </div>

          <div style="margin: 30px 0;">
            <h3>Invoice Details:</h3>
            <div class="detail-row">
              <span><strong>Description</strong></span>
              <span><strong>Amount</strong></span>
            </div>
            <div class="detail-row">
              <span>Products/Services</span>
              <span>$${invoice.total.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span>Subtotal</span>
              <span>$${invoice.total.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
          </div>

          <div class="total">
            Total Amount: $${invoice.total.toFixed(2)}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this invoice, please contact us at +251974496613</p>
          </div>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Invoice
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
              Close Window
            </button>
          </div>
        </body>
      </html>
    `;
  }

  // ============== NEW EMAIL METHODS ==============

  /**
   * Create a new invoice and automatically send it to customer's email
   * @param orderId - The order ID
   * @param invoiceNumber - Generated invoice number
   * @param total - Total amount
   * @returns Observable with the response
   */
  createInvoice(orderId: number, invoiceNumber: string, total: number): Observable<any> {
    const payload = {
      orderId: orderId,
      invoiceNumber: invoiceNumber,
      total: total
    };
    
    console.log('📝 Creating invoice with payload:', payload);
    return this.http.post(`http://localhost:8889/api/invoices`, payload);
  }

  /**
   * Resend an existing invoice to customer's email
   * @param invoiceId - The invoice ID to resend
   * @returns Observable with the response
   */
  resendInvoiceEmail(invoiceId: number): Observable<any> {
    console.log('📧 Resending invoice email for ID:', invoiceId);
    return this.http.post(`http://localhost:8889/api/invoices/${invoiceId}/resend`, {});
  }

  /**
   * Check if customer has email (helper method)
   * @param invoice - The invoice object
   * @returns boolean indicating if customer has email
   */
  hasCustomerEmail(invoice: Invoice): boolean {
    return !!(invoice.customer_email && invoice.customer_email.trim() !== '');
  }

  /**
   * Download invoice as PDF (if you want to add this feature)
   * @param invoiceId - The invoice ID to download
   * @returns Observable with blob data
   */
  downloadInvoicePDF(invoiceId: number): Observable<Blob> {
    return this.http.get(`http://localhost:8889/api/invoices/${invoiceId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Send invoice to a specific email (if you want manual email entry)
   * @param invoiceId - The invoice ID
   * @param email - Custom email address
   * @returns Observable with the response
   */
  sendInvoiceToCustomEmail(invoiceId: number, email: string): Observable<any> {
    return this.http.post(`http://localhost:8889/api/invoices/${invoiceId}/send?email=${encodeURIComponent(email)}`, {});
  }

  /**
   * Get invoice by ID (if needed)
   * @param invoiceId - The invoice ID
   * @returns Observable with invoice details
   */
  getInvoiceById(invoiceId: number): Observable<Invoice> {
    return this.http.get<Invoice>(`http://localhost:8889/api/invoices/details/${invoiceId}`);
  }

  /**
   * Get all invoices (admin feature)
   * @returns Observable with list of all invoices
   */
  getAllInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>('http://localhost:8889/api/invoices/admin/all');
  }

  /**
   * Get invoices by date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Observable with filtered invoices
   */
  getInvoicesByDateRange(startDate: string, endDate: string): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`http://localhost:8889/api/invoices/range?start=${startDate}&end=${endDate}`);
  }
}