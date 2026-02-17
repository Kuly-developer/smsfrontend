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

  getInvoicesByCustomer(customerId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/${customerId}`);
  }

  deleteInvoice(invoiceId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${invoiceId}`);
  }

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
              <span>$${invoice.total.toFixed(2)}</span>
            </div>
            <div class="detail-row">
            </div>
          </div>

          <div class="total">
            Total Amount: $${invoice.total.toFixed(2)}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this invoice, please contact us +251974496613.</p>
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
}