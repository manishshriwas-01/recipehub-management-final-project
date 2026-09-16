import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

interface AiResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/ai`;

  chat(message: string): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${this.apiUrl}/chat`, {
      message,
    });
  }
}