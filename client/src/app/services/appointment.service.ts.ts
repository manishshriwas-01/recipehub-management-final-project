import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

interface AppointmentResponse {
  success: boolean;
  message: string;
  appointment: {
    _id: string;
    student: string;
    instructor: string;
    recipe: string;
    date: string;
    startTime: string;
    duration: number;
    amount: number;
    status: string;
  };
}

interface TeachingAppointmentsResponse {
  success: boolean;
  appointments: {
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
  }[];
}

export interface Appointment {
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

export interface MyAppointmentsResponse {
  success: boolean;
  appointments: Appointment[];
}
export interface BookedSlotsResponse {
  success: boolean;
  bookedSlots: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/appointments`;

  createAppointment(data: {
    recipeId: string;
    date: string;
    startTime: string;
  }): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(
      this.apiUrl,
      data
    );
  }

  getMyAppointments(): Observable<MyAppointmentsResponse> {
    return this.http.get<MyAppointmentsResponse>(
      `${this.apiUrl}/my`
    );
  }

  getTeachingAppointments(): Observable<TeachingAppointmentsResponse> {
    return this.http.get<TeachingAppointmentsResponse>(
      `${this.apiUrl}/teaching`
    );
  }

  getBookedSlots(
    recipeId: string,
    date: string
  ): Observable<BookedSlotsResponse> {
    return this.http.get<BookedSlotsResponse>(
      `${this.apiUrl}/booked-slots`,
      {
        params: {
          recipeId,
          date
        }
      }
    );
  }

  cancelAppointment(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/cancel`, {});
  }

  addMeetingLink(id: string, meetLink: string): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}/meeting-link`,
      { meetLink }
    );
  }
}