import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { AppointmentService } from '../../services/appointment.service.ts';

interface Appointment {
  _id: string;
  student: string;

  instructor: {
    _id: string;
    name: string;
    email: string;
  };

  recipe: {
    _id: string;
    title: string;
    imageUrl: string;
  };

  date: string;
  startTime: string;
  duration: number;
  amount: number;
  status: string;
  meetLink?: string | null;
}

interface MyAppointmentsResponse {
  success: boolean;
  appointments: Appointment[];
}

@Component({
  selector: 'app-my-bookings',
  imports: [AsyncPipe, DatePipe, TitleCasePipe],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookings {
  private appointmentService = inject(AppointmentService);

  appointments$: Observable<MyAppointmentsResponse | null> =
    this.appointmentService.getMyAppointments().pipe(
      catchError(error => {
        console.error('Failed to load appointments:', error);
        return of(null);
      })
    );

  cancelAppointment(id: string): void {
    const confirmed = confirm('Are you sure you want to cancel this appointment?');

    if (!confirmed) return;

    this.appointmentService.cancelAppointment(id).subscribe({
      next: response => {
        console.log('Appointment cancelled:', response);
        alert('Appointment cancelled successfully.');

        this.appointments$ = this.appointmentService.getMyAppointments().pipe(
          catchError(error => {
            console.error('Failed to reload appointments:', error);
            return of(null);
          })
        );
      },
      error: error => {
        console.error('Failed to cancel appointment:', error);
        alert(error?.error?.message || 'Unable to cancel appointment.');
      }
    });
  }
}