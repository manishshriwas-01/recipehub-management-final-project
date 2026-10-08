import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { NotificationSocketService } from './notification-service';
import { environment } from '../../environments/environment';

describe('NotificationSocketService', () => {
  let service: NotificationSocketService;
  let httpTestingController: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/notifications`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationSocketService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(
      NotificationSocketService
    );

    httpTestingController =
      TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    service.disconnect();
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not initialize when token is missing', () => {
    service.initialize();

    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  it('should not connect when token is missing', () => {
    service.connect();

    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  it('should load notifications', () => {
    const mockNotifications: any[] = [
      {
        _id: 'notification1',
        read: false,
      },
      {
        _id: 'notification2',
        read: true,
      },
    ];

    service.loadNotifications();

    const request =
      httpTestingController.expectOne(
        `${apiUrl}`
      );

    expect(request.request.method).toBe('GET');

    request.flush({
      success: true,
      notifications: mockNotifications,
    });

    expect(service.notifications()).toEqual(
      mockNotifications
    );
  });

  it('should load unread notification count', () => {
    service.loadUnreadCount();

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/unread-count`
      );

    expect(request.request.method).toBe('GET');

    request.flush({
      success: true,
      count: 5,
    });

    expect(service.unreadCount()).toBe(5);
  });

  it('should mark a notification as read', () => {
    const notifications: any[] = [
      {
        _id: 'notification1',
        read: false,
      },
      {
        _id: 'notification2',
        read: false,
      },
    ];

    service.notifications.set(notifications);
    service.unreadCount.set(2);

    service.markAsRead('notification1');

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/notification1/read`
      );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});

    request.flush({
      success: true,
      message: 'Notification marked as read',
      notification: {
        _id: 'notification1',
        read: true,
      },
    });

    expect(
      service.notifications()[0].read
    ).toBe(true);

    expect(service.unreadCount()).toBe(1);
  });

  it('should mark all notifications as read', () => {
    const notifications: any[] = [
      {
        _id: 'notification1',
        read: false,
      },
      {
        _id: 'notification2',
        read: false,
      },
    ];

    service.notifications.set(notifications);
    service.unreadCount.set(2);

    service.markAllAsRead();

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/read-all`
      );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});

    request.flush({
      success: true,
      message: 'All notifications marked as read',
    });

    expect(
      service.notifications().every(
        (notification) => notification.read
      )
    ).toBe(true);

    expect(service.unreadCount()).toBe(0);
  });

  it('should not update notification when markAsRead response is unsuccessful', () => {
    const notifications: any[] = [
      {
        _id: 'notification1',
        read: false,
      },
    ];

    service.notifications.set(notifications);
    service.unreadCount.set(1);

    service.markAsRead('notification1');

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/notification1/read`
      );

    request.flush({
      success: false,
      message: 'Failed',
      notification: notifications[0],
    });

    expect(
      service.notifications()[0].read
    ).toBe(false);

    expect(service.unreadCount()).toBe(1);
  });

  it('should not update notifications when markAllAsRead response is unsuccessful', () => {
    const notifications: any[] = [
      {
        _id: 'notification1',
        read: false,
      },
    ];

    service.notifications.set(notifications);
    service.unreadCount.set(1);

    service.markAllAsRead();

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/read-all`
      );

    request.flush({
      success: false,
      message: 'Failed',
    });

    expect(
      service.notifications()[0].read
    ).toBe(false);

    expect(service.unreadCount()).toBe(1);
  });

  it('should disconnect and clear notifications', () => {
    service.notifications.set([
      {
        _id: 'notification1',
        read: false,
      } as any,
    ]);

    service.unreadCount.set(3);

    service.disconnect();

    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });
});