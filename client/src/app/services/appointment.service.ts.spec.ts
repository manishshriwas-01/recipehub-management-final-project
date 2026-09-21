import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AppointmentService } from './appointment.service.ts';
import { environment } from '../../environments/environment';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/appointments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create an appointment', () => {
    const appointmentData = {
      recipeId: 'recipe123',
      date: '2026-09-25',
      startTime: '10:00'
    };

    const mockResponse = {
      success: true,
      message: 'Appointment created successfully',
      appointment: {
        _id: 'appointment123',
        student: 'student123',
        instructor: 'instructor123',
        recipe: 'recipe123',
        date: '2026-09-25',
        startTime: '10:00',
        duration: 60,
        amount: 299,
        status: 'pending'
      }
    };

    service.createAppointment(appointmentData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(appointmentData);

    req.flush(mockResponse);
  });

  it('should get my appointments', () => {
    const mockResponse = {
      success: true,
      appointments: []
    };

    service.getMyAppointments().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/my`);

    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('should get teaching appointments', () => {
    const mockResponse = {
      success: true,
      appointments: []
    };

    service.getTeachingAppointments().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/teaching`);

    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('should get booked slots for a recipe and date', () => {
    const mockResponse = {
      success: true,
      bookedSlots: ['10:00', '12:00']
    };

    service.getBookedSlots('recipe123', '2026-09-25').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request =>
      request.url === `${apiUrl}/booked-slots` &&
      request.params.get('recipeId') === 'recipe123' &&
      request.params.get('date') === '2026-09-25'
    );

    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('should cancel an appointment', () => {
    const mockResponse = {
      success: true,
      message: 'Appointment cancelled successfully'
    };

    service.cancelAppointment('appointment123').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${apiUrl}/appointment123/cancel`
    );

    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});

    req.flush(mockResponse);
  });

  it('should add a meeting link to an appointment', () => {
    const meetLink = 'https://meet.google.com/abc-defg-hij';

    const mockResponse = {
      success: true,
      message: 'Meeting link added successfully'
    };

    service.addMeetingLink('appointment123', meetLink).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${apiUrl}/appointment123/meeting-link`
    );

    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      meetLink
    });

    req.flush(mockResponse);
  });
});