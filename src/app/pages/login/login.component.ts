import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  hidePassword = true; // 👈 initially hidden

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (response) => {
          const role = response.role;
          if (role === 'admin') {
            this.router.navigate(['/dashboard']);
          } else if (role === 'salesperson') {
            this.router.navigate(['/salesperson']);
          } else if (role === 'accountant') {
            this.router.navigate(['/accountant']);
          } else if (role === 'customer') {
            this.router.navigate(['/customer-dashboard']);
          } else {
            this.errorMessage = 'Unauthorized role';
          }
        },
        error: () => {
          this.errorMessage = 'Invalid username or password';
        },
      });
    }
  }
}
