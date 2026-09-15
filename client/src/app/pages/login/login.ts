import { Component, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
      ],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
      ],
    }),
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);

        this.authService.getMe().subscribe({
          next: (meResponse) => {
            this.authService.setUser(meResponse.user);

            this.isLoading = false;
            this.toastr.success(
              response.message || 'Login successful!'
            );

            this.router.navigate(['/recipes']);
          },

          error: () => {
            this.isLoading = false;
            this.toastr.error(
              'Unable to load user information. Please try again.'
            );
            this.router.navigate(['/recipes']);
          },
        });
      },

      error: () => {
        this.isLoading = false;
      }
    });
  }
}