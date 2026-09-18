import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Availability {
  _id: string;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailabilityResponse {
  success: boolean;
  message: string;
  availability: Availability;
}

export interface MyAvailabilityResponse {
  success: boolean;
  availability: Availability[];
}

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/availability`;

  createAvailability(data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }): Observable<AvailabilityResponse> {

    return this.http.post<AvailabilityResponse>(
      this.apiUrl,
      data
    );
  }

  getMyAvailability(): Observable<MyAvailabilityResponse> {

    return this.http.get<MyAvailabilityResponse>(
      `${this.apiUrl}/my`
    );
  }

  updateAvailability(
    id: string,
    isActive: boolean
  ): Observable<AvailabilityResponse> {
    return this.http.patch<AvailabilityResponse>(
      `${this.apiUrl}/${id}`,
      { isActive }
    );
  }

  deleteAvailability(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }
}