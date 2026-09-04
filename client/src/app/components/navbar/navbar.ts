import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService = inject(AuthService);
  private router = inject(Router);

  menuOpen = signal(false);

  user = this.authService.user;

  constructor() {
    this.loadUser();
  }

  private loadUser(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.authService.getMe().subscribe({
      next: (response) => {
        // Check again because user might have logged out
        // while the API request was running.
        if (this.authService.isLoggedIn()) {
          this.authService.setUser(response.user);
        }
      },
      error: () => {
        this.authService.clearUser();
      },
    });
  }

  toggleMenu() {
    this.menuOpen.update((value) => !value);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.authService.logout();

    this.closeMenu();

    this.router.navigate(['/login']);
  }
}