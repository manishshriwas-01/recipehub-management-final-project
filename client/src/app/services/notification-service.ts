import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Notification } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationSocketService {

  private socket: Socket | null = null;

  private http = inject(HttpClient);

  readonly unreadCount = signal(0);
  readonly notifications = signal<Notification[]>([]);

  initialize(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      // console.log('No authentication token found');
      return;
    }

    this.connect();
  }

  connect(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      // console.log('No authentication token found');
      return;
    }

    // Already connected
    if (this.socket?.connected) {
      // console.log('Socket already connected');
      return;
    }

    // Remove old socket if it exists
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Load existing notifications
    this.loadNotifications();

    // Load unread count
    this.loadUnreadCount();

    this.socket = io(environment.socketUrl, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      // console.log(
      //   'Socket connected:',
      //   this.socket?.id
      // );
    });

    this.socket.on('connect_error', (error) => {
      // console.error(
      //   'Socket connection error:',
      //   error.message
      // );
    });

    this.socket.on(
      'newNotification',
      (notification: Notification) => {

        // console.log(
        //   '🔥 New notification received:',
        //   notification
        // );

        this.notifications.update(
          notifications => [
            notification,
            ...notifications
          ]
        );

        this.unreadCount.update(
          count => count + 1
        );
      }
    );

    this.socket.on('disconnect', (reason) => {
      // console.log(
      //   'Socket disconnected:',
      //   reason
      // );
    });
  }

  disconnect(): void {
    if (this.socket) {
      // console.log(
      //   'Disconnecting notification socket'
      // );

      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  loadNotifications(): void {
    this.http
      .get<{
        success: boolean;
        notifications: Notification[];
      }>(
        `${environment.apiUrl}/notifications`
      )
      .subscribe({
        next: (response) => {
          this.notifications.set(
            response.notifications
          );
        },

        error: (error) => {
          // console.error(
          //   'Failed to load notifications:',
          //   error
          // );
        }
      });
  }

  loadUnreadCount(): void {
    this.http
      .get<{
        success: boolean;
        count: number;
      }>(
        `${environment.apiUrl}/notifications/unread-count`
      )
      .subscribe({
        next: (response) => {
          this.unreadCount.set(
            response.count
          );
        },

        error: (error) => {
          // console.error(
          //   'Failed to load unread notification count:',
          //   error
          // );
        }
      });
  }

  markAsRead(id: string): void {
    this.http
      .patch<{
        success: boolean;
        message: string;
        notification: Notification;
      }>(
        `${environment.apiUrl}/notifications/${id}/read`,
        {}
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            return;
          }

          this.notifications.update((notifications) =>
            notifications.map((notification) =>
              notification._id === id
                ? {
                    ...notification,
                    read: true,
                  }
                : notification
            )
          );

          this.unreadCount.update((count) =>
            Math.max(0, count - 1)
          );
        },

        error: (error) => {
          // console.error(
          //   'Failed to mark notification as read:',
          //   error
          // );
        },
      });
  }

  markAllAsRead(): void {
    this.http
      .patch<{
        success: boolean;
        message: string;
      }>(
        `${environment.apiUrl}/notifications/read-all`,
        {}
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            return;
          }

          this.notifications.update((notifications) =>
            notifications.map((notification) => ({
              ...notification,
              read: true,
            }))
          );

          this.unreadCount.set(0);
        },

        error: (error) => {
          // console.error(
          //   'Failed to mark all notifications as read:',
          //   error
          // );
        },
      });
  }
}