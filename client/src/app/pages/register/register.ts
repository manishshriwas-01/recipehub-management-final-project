import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../services/auth.service/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  isLoading = false;

  registerForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
      ],
    }),

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
        Validators.minLength(6),
      ],
    }),
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const formData = this.registerForm.getRawValue();

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.isLoading = false;

        this.toastr.success(
          response.message || 'Registration successful!'
        );

        this.router.navigate(['/login']);
      },

      error: () => {
        this.isLoading = false;

        // API error is handled by the HTTP interceptor.
      },
    });
  }
}