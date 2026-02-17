import { PermissionsComponent } from './permissions/permissions.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { LoginComponent } from './pages/login/login.component';
import { UserComponent } from './user/user.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/payment-cancel/payment-cancel.component';
import { AccountantComponent } from './components/accountant/accountant.component';
import { SalespersonComponent } from './components/salesperson/salesperson.component';
import { CustomerManagementComponent } from './components/customer-management/customer-management.component';
import { ManageProductComponent } from './components/manage-product/manage-product.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
//import { PermissionsComponent } from './permissions/permissions.component';
import { ProductsComponent } from './components/products/products.component';
import { OrdersComponent } from './components/orders/orders.component';
import { ReportsComponent } from './reports/reports.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InvoiceComponent } from './components/invoice/invoice.component';
//import { AddProductComponent } from './components/add-product/add-product.component'; // stub component
//import { PaymentSuccessComponent } from './payment-success/payment-success.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'users', component: UserComponent },
  { path: 'accountant', component: AccountantComponent },
  { path: 'salesperson', component: SalespersonComponent },
    { path: 'products', component: ProductsComponent },
  { path: 'orders', component: OrdersComponent },

  { path: 'success', component: PaymentSuccessComponent },
//  { path: 'invoice', component: InvoiceComponent },

  { path: 'customer-dashboard', component: CustomerDashboardComponent },
  //{ path: 'customer-dashboard/add-product', component: AddProductComponent },  // Added stub
{ path: 'invoice', component: InvoiceComponent },
  { path: 'reports', component: ReportsComponent },  // 👈 Route for Reports

  { path: 'products/manage', component: ManageProductComponent },
  { path: 'customers', component: CustomerManagementComponent },
  { path: 'payment-success', component: PaymentSuccessComponent },
  { path: 'payment-cancel', component: PaymentCancelComponent },
  { path: 'permissions', component: PermissionsComponent },

  { path: '**', redirectTo: '/login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
