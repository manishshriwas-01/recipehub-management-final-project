import {
  AsyncPipe,
  DatePipe,
  TitleCasePipe,
} from '@angular/common';

import {
  Component,
  inject,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Observable,
  catchError,
  of,
} from 'rxjs';

import { AppointmentService } from '../../services/appointment.service.ts';
import { AvailabilityService, Availability } from '../../services/availability.js';


interface TeachingAppointment {
  _id: string;

  student: {
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


interface TeachingAppointmentsResponse {
  success: boolean;
  appointments: TeachingAppointment[];
}


interface MyAvailabilityResponse {
  success: boolean;
  availability: Availability[];
}


@Component({
  selector: 'app-instructor-dashboard',

  imports: [
    AsyncPipe,
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
  ],

  templateUrl: './instructor-dashboard.html',
  styleUrl: './instructor-dashboard.css',
})
export class InstructorDashboard {

  private appointmentService =
    inject(AppointmentService);

  private availabilityService =
    inject(AvailabilityService);

  private fb =
    inject(FormBuilder);

  meetingLinks: Record<string, string> = {};

  appointmentError = '';
availabilityError = '';


  // -----------------------------
  // Teaching Appointments
  // -----------------------------

  appointments$: Observable<TeachingAppointmentsResponse | null> =
    this.appointmentService
      .getTeachingAppointments()
      .pipe(
        catchError((error) => {

          console.error(
            'Failed to load teaching appointments:',
            error
          );
          this.appointmentError = 'Failed to load appointments';


          return of(null);
        })
      );


  // -----------------------------
  // Availability
  // -----------------------------

  availability$: Observable<MyAvailabilityResponse | null> =
    this.availabilityService
      .getMyAvailability()
      .pipe(
        catchError((error) => {

          console.error(
            'Failed to load availability:',
            error
          );
           this.availabilityError = 'Failed to load availability';

          return of(null);
        })
      );


  // -----------------------------
  // Availability Form
  // -----------------------------

  availabilityForm =
    this.fb.nonNullable.group({

      dayOfWeek: [
        '',
        Validators.required,
      ],

      startTime: [
        '',
        Validators.required,
      ],

      endTime: [
        '',
        Validators.required,
      ],

    });


  // -----------------------------
  // Add Availability
  // -----------------------------

  addAvailability(): void {

    if (this.availabilityForm.invalid) {

      this.availabilityForm.markAllAsTouched();

      return;
    }


    const formData =
      this.availabilityForm.getRawValue();


    if (
      formData.startTime >=
      formData.endTime
    ) {

      alert(
        'End time must be after start time'
      );

      return;
    }


    this.availabilityService
      .createAvailability(formData)
      .subscribe({

        next: (response) => {

          console.log(
            'Availability created:',
            response
          );

          alert(
            'Availability added successfully!'
          );

          this.availabilityForm.reset();

          // Refresh availability list
          this.refreshAvailability();
        },

        error: (error) => {

          console.error(
            'Failed to create availability:',
            error
          );

          alert(
            error?.error?.message ||
            'Unable to add availability'
          );
        },

      });
  }


  // -----------------------------
  // Refresh Availability
  // -----------------------------

  refreshAvailability(): void {

    this.availability$ =
      this.availabilityService
        .getMyAvailability()
        .pipe(
          catchError((error) => {

            console.error(
              'Failed to refresh availability:',
              error
            );

            return of(null);
          })
        );
  }


  // -----------------------------
  // Total Earnings
  // -----------------------------

  getTotalEarnings(
    appointments: TeachingAppointment[]
  ): number {

    return appointments

      .filter(
        appointment =>
          appointment.status === 'confirmed' ||
          appointment.status === 'completed'
      )

      .reduce(
        (total, appointment) =>
          total + appointment.amount,
        0
      );
  }


  // -----------------------------
  // Unique Students
  // -----------------------------

  getUniqueStudents(
    appointments: TeachingAppointment[]
  ): number {

    return new Set(
      appointments.map(
        appointment =>
          appointment.student._id
      )
    ).size;
  }

  toggleAvailability(
    id: string,
    currentStatus: boolean
  ): void {
    const newStatus = !currentStatus;

    this.availabilityService
      .updateAvailability(id, newStatus)
      .subscribe({
        next: (response) => {
          console.log('Availability updated:', response);

          alert(
            newStatus
              ? 'Availability activated successfully!'
              : 'Availability deactivated successfully!'
          );

          this.refreshAvailability();
        },

        error: (error) => {
          console.error('Failed to update availability:', error);

          alert(
            error?.error?.message ||
            'Unable to update availability'
          );
        }
      });
  }

  deleteAvailability(id: string): void {
    const confirmed = confirm(
      'Are you sure you want to delete this availability?'
    );

    if (!confirmed) {
      return;
    }

    this.availabilityService
      .deleteAvailability(id)
      .subscribe({
        next: (response) => {
          console.log('Availability deleted:', response);

          alert('Availability deleted successfully!');

          this.refreshAvailability();
        },

        error: (error) => {
          console.error('Failed to delete availability:', error);

          alert(
            error?.error?.message ||
            'Unable to delete availability'
          );
        }
      });
  }

  saveMeetingLink(appointmentId: string): void {
    const meetLink = this.meetingLinks[appointmentId]?.trim();
    if (!meetLink) {
      alert('Please enter a Google Meet link.');
      return;
    }

    this.appointmentService.addMeetingLink(appointmentId, meetLink).subscribe({
      next: response => {
        console.log('Meeting link saved:', response);
        alert('Meeting link saved successfully.');
        this.meetingLinks[appointmentId] = '';
        this.appointments$ = this.appointmentService.getTeachingAppointments().pipe(
          catchError(error => {
            console.error('Failed to reload appointments:', error);
            return of(null);
          })
        );
      },
      error: error => {
        console.error('Failed to save meeting link:', error);
        alert(error?.error?.message || 'Unable to save meeting link.');
      }
    });
  }



}