import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/auth';

  user = signal<User | null>(null);

  register(data: {
    name: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data
    );
  }

  login(data: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      data
    );
  }

  getMe(): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(
      `${this.apiUrl}/me`
    );
  }

  setUser(user: User): void {
    this.user.set(user);
  }

  clearUser(): void {
    this.user.set(null);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.clearUser();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}