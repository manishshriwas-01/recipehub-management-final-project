import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service/auth.service';
import { NotificationSocketService } from '../../services/notification-service';
import { DatePipe } from '@angular/common';
import { Notification } from '../../models/notification';


@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationSocketService);
  notificationOpen = signal(false);

  menuOpen = signal(false);

  user = this.authService.user;
  unreadCount = this.notificationService.unreadCount;
  notifications = this.notificationService.notifications;

  constructor() {
    this.loadUser();
    this.notificationService.initialize();
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
  toggleNotifications(): void {
    this.notificationOpen.update(
      value => !value
    );
  }
  closeNotifications(): void {
    this.notificationOpen.set(false);
  }

  markNotificationAsRead(
  notification: Notification
): void {
  if (notification.read) {
    return;
  }

  this.notificationService.markAsRead(
    notification._id
  );
}

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }
}