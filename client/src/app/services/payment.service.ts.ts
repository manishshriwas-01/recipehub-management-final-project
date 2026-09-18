import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    amount: number;
    currency: string;
  };
  keyId: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  appointment: any;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/payments`;

  createOrder(appointmentId: string): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.apiUrl}/create-order`,
      { appointmentId }
    );
  }

  verifyPayment(data: {
    appointmentId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>(
      `${this.apiUrl}/verify`,
      data
    );
  }

  
}