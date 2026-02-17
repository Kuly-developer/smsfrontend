import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { AuthInterceptor } from './services/auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

// ADD THESE MISSING MODULES FOR REPORTS
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// ADD THESE MISSING MODULES FOR PERMISSIONS COMPONENT
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Components
import { LoginComponent } from './pages/login/login.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersListComponent } from './pages/users-list/users-list.component';
import { UserEditComponent } from './pages/user-edit/user-edit.component';
import { UserComponent } from './user/user.component';
import { CustomerManagementComponent } from './components/customer-management/customer-management.component';
import { SalespersonComponent } from './components/salesperson/salesperson.component';
import { AccountantComponent } from './components/accountant/accountant.component';
import { ManageProductComponent } from './components/manage-product/manage-product.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/payment-cancel/payment-cancel.component';
import { InvoiceComponent } from './components/invoice/invoice.component';
import { ProductsComponent } from './components/products/products.component';
import { OrdersComponent } from './components/orders/orders.component';

// ADD REPORTS COMPONENT
import { ReportsComponent } from './reports/reports.component';

// ADD PERMISSIONS COMPONENT
import { PermissionsComponent } from './permissions/permissions.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavbarComponent,
    SidebarComponent,
    DashboardComponent,
    UsersListComponent,
    UserEditComponent,
    UserComponent,
    CustomerManagementComponent,
    SalespersonComponent,
    AccountantComponent,
    ManageProductComponent,
    CustomerDashboardComponent,
    PaymentSuccessComponent,
    PaymentCancelComponent,
    ProductsComponent,
    OrdersComponent,
    ReportsComponent,
    PermissionsComponent, // Add PermissionsComponent here
    // Remove InvoiceComponent from declarations array
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    AppRoutingModule,

    // Angular Material Modules
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatCardModule,
    MatListModule,
    MatToolbarModule,
    MatMenuModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,

    // ADD THESE MATERIAL MODULES FOR REPORTS
    MatProgressSpinnerModule, // For mat-spinner
    MatTabsModule,           // For future tabbed reports
    MatDatepickerModule,     // For date range pickers
    MatNativeDateModule,     // For datepicker

    // ADD THIS FOR PERMISSIONS COMPONENT
    MatSlideToggleModule,    // For mat-slide-toggle

    // Import standalone components here
    InvoiceComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
