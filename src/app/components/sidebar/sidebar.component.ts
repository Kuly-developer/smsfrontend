import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  currentRoute: string = '/';

  constructor(private router: Router) {
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  getPageTitle(): string {
    switch (this.currentRoute) {
      case '/products': return 'Products Management';
      case '/seller': return 'Seller Management';
      case '/orders': return 'Orders Management';
      case '/invoices': return 'Invoices Management';
      case '/users': return 'User Management';
      case '/reports': return 'Reports & Analytics';
      default: return 'Dashboard Overview';
    }
  }

  isDashboard(): boolean {
    return this.currentRoute === '/';
  }
}
