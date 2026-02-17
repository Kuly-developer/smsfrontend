// permissions.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { MatCardModule } from "@angular/material/card";

interface CustomerPermissions {
  id: number;
  name: string;
  email: string;
  accountantAccess: boolean;
  salespersonAccess: boolean;
  customerAccess: boolean;
}

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
  //imports: [MatCardModule]
})
export class PermissionsComponent implements OnInit {
  customers: CustomerPermissions[] = [];
  loading = false;
  saving = false;
  selectedCustomer: CustomerPermissions | null = null;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.http.get<CustomerPermissions[]>('http://localhost:8889/api/permissions')
      .subscribe({
        next: (data) => {
          this.customers = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.toastr.error('Failed to load customers');
          this.loading = false;
        }
      });
  }

  selectCustomer(customer: CustomerPermissions) {
    this.selectedCustomer = { ...customer };
  }

  updatePermissions() {
    if (!this.selectedCustomer) return;

    this.saving = true;
    const payload = {
      accountantAccess: this.selectedCustomer.accountantAccess,
      salespersonAccess: this.selectedCustomer.salespersonAccess,
      customerAccess: this.selectedCustomer.customerAccess
    };

    this.http.put(`http://localhost:8889/api/permissions/${this.selectedCustomer.id}`, payload)
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Permissions updated successfully');
          this.saving = false;

          // Update the local customers array
          const index = this.customers.findIndex(c => c.id === this.selectedCustomer!.id);
          if (index !== -1) {
            this.customers[index] = { ...this.selectedCustomer! };
          }
        },
        error: (error) => {
          console.error('Error updating permissions:', error);
          this.toastr.error('Failed to update permissions');
          this.saving = false;
        }
      });
  }

  toggleAllAccess(enable: boolean) {
    if (this.selectedCustomer) {
      this.selectedCustomer.accountantAccess = enable;
      this.selectedCustomer.salespersonAccess = enable;
      this.selectedCustomer.customerAccess = enable;
    }
  }

  getAccessStatus(customer: CustomerPermissions): string {
    const accesses = [
      customer.accountantAccess ? 'Accountant' : '',
      customer.salespersonAccess ? 'Salesperson' : '',
      customer.customerAccess ? 'Customer' : ''
    ].filter(Boolean);

    return accesses.length > 0 ? accesses.join(', ') : 'No Access';
  }
}
