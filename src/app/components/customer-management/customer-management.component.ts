import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-management',
  templateUrl: './customer-management.component.html',
  styleUrls: ['./customer-management.component.scss']
})
export class CustomerManagementComponent implements OnInit {
  customerForm: FormGroup;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  editMode = false;
  editingCustomer: Customer | null = null;
  searchTerm = '';
  showForm = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService
  ) {
    this.customerForm = this.fb.group({
      name: [''],
      email: [''],
      phone: [''],
      address: [''],
      portalAccess: [false],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.customerService.getAllCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = [...data];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.errorMessage = 'Failed to load customers. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get totalCustomers(): number {
    return this.customers.length;
  }

  get portalCustomerCount(): number {
    return this.customers.filter(c => c.portalAccess).length;
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.cancelEdit();
    }
  }

  editCustomer(customer: Customer) {
    this.editMode = true;
    this.showForm = true;
    this.editingCustomer = customer;
    
    this.customerForm.patchValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      portalAccess: customer.portalAccess || false,
      password: ''
    });
  }

  cancelEdit() {
    this.editMode = false;
    this.showForm = false;
    this.editingCustomer = null;
    this.customerForm.reset({ portalAccess: false });
  }

  onSubmit() {
    const formData = { ...this.customerForm.value };

    // Remove empty password in edit mode
    if (this.editMode && (!formData.password || formData.password === '')) {
      delete formData.password;
    }

    if (this.editMode && this.editingCustomer) {
      this.isLoading = true;
      this.customerService.updateCustomer({
        ...formData,
        id: this.editingCustomer.id
      }).subscribe({
        next: (updatedCustomer) => {
          const index = this.customers.findIndex(c => c.id === updatedCustomer.id);
          if (index !== -1) this.customers[index] = updatedCustomer;
          this.filteredCustomers = [...this.customers];
          this.cancelEdit();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error updating customer:', err);
          alert('Failed to update customer. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = true;
      this.customerService.registerCustomer(formData).subscribe({
        next: (newCustomer) => {
          this.customers.push(newCustomer);
          this.filteredCustomers = [...this.customers];
          this.cancelEdit();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error creating customer:', err);
          alert('Failed to create customer. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    this.isLoading = true;
    this.customerService.deleteCustomer(id).subscribe({
      next: () => {
        this.customers = this.customers.filter(c => c.id !== id);
        this.filteredCustomers = this.filteredCustomers.filter(c => c.id !== id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error deleting customer:', err);
        alert('Failed to delete customer. Please try again.');
        this.isLoading = false;
      }
    });
  }
}