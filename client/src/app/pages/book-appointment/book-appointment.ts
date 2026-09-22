import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';
import { AppointmentService } from '../../services/appointment.service.ts';
import { PaymentService } from '../../services/payment.service.ts';

interface Availability {
  _id: string;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface AvailabilityResponse {
  success: boolean;
  availability: Availability[];
}

declare var Razorpay: any;

@Component({
  selector: 'app-book-appointment',
  imports: [AsyncPipe],
  templateUrl: './book-appointment.html',
  styleUrl: './book-appointment.css'
})
export class BookAppointment implements OnInit {
  private route = inject(ActivatedRoute);
  recipeService = inject(RecipeService);
  private appointmentService = inject(AppointmentService);
  private paymentService = inject(PaymentService);

  recipeId = '';
  selectedDate = '';
  selectedTime = '';
  availableTimeSlots: string[] = [];
  selectedTimeSlot = signal<string | null>(null);
  bookedTimeSlots = signal<string[]>([]);
  availabilityData: Availability[] = [];
  bookingLoading = signal(false);
  paymentProcessing = false;
  recipeError = '';
  availabilityError = '';
  availabilityLoading = signal(true);




  recipe$: Observable<{ success: boolean; recipe: Recipe } | null> = this.route.paramMap.pipe(
    switchMap(params => {
      this.recipeId = params.get('recipeId')!;
      return this.recipeService.getRecipe(this.recipeId).pipe(
        catchError(error => {
          console.error('Failed to load recipe:', error);
          this.recipeError = 'Failed to load recipe';
          return of(null);
        })
      );
    })
  );

  availability$: Observable<AvailabilityResponse | null> = this.route.paramMap.pipe(
    switchMap(params => {
      const recipeId = params.get('recipeId')!;
      return this.recipeService.getRecipeAvailability(recipeId).pipe(
        catchError(error => {
          console.error('Failed to load availability:', error);
          this.availabilityError = 'Unable to load instructor availability';
          return of(null);
        })
      );
    })
  );


  ngOnInit(): void {
    this.availability$.subscribe({
      next: response => {
        this.availabilityLoading.set(false);

        if (!response) {
          this.availabilityData = [];
          return;
        }

        this.availabilityData = response.availability;
        console.log('Availability loaded:', this.availabilityData);
      },
      error: error => {
        this.availabilityLoading.set(false);
        console.error('Availability loading error:', error);
        this.availabilityData = [];
        this.availabilityError = 'Unable to load instructor availability';
      }
    });
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.selectedDate = input.value;
    this.selectedTime = '';
    this.selectedTimeSlot.set(null);
    this.availableTimeSlots = [];
    this.bookedTimeSlots.set([]);

    if (!this.selectedDate) return;

    const selectedDay = new Date(`${this.selectedDate}T00:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: 'UTC'
    });

    const matchingAvailability = this.availabilityData.filter(
      slot => slot.dayOfWeek === selectedDay && slot.isActive
    );

    for (const slot of matchingAvailability) {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);

      let currentMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      while (currentMinutes + 60 <= endMinutes) {
        const startHourValue = Math.floor(currentMinutes / 60);
        const startMinuteValue = currentMinutes % 60;

        const endSlotMinutes = currentMinutes + 60;
        const endHourValue = Math.floor(endSlotMinutes / 60);
        const endMinuteValue = endSlotMinutes % 60;

        const startTime = `${startHourValue.toString().padStart(2, '0')}:${startMinuteValue.toString().padStart(2, '0')}`;
        const endTime = `${endHourValue.toString().padStart(2, '0')}:${endMinuteValue.toString().padStart(2, '0')}`;

        this.availableTimeSlots.push(`${startTime}-${endTime}`);
        currentMinutes += 60;
      }
    }

    this.availableTimeSlots = [...new Set(this.availableTimeSlots)];

    this.appointmentService.getBookedSlots(this.recipeId, this.selectedDate).subscribe({
      next: response => {
        this.bookedTimeSlots.set(response.bookedSlots);
        console.log('Booked time slots:', response.bookedSlots);
      },
      error: error => {
        console.error('Failed to load booked slots:', error);
        this.bookedTimeSlots.set([]);
      }
    });

    console.log('Generated time slots:', this.availableTimeSlots);
  }

  isSlotBooked(slot: string): boolean {
    return this.bookedTimeSlots().includes(slot.split('-')[0]);
  }

  selectTimeSlot(slot: string): void {
    if (this.isSlotBooked(slot)) return;

    this.selectedTimeSlot.set(slot);
    this.selectedTime = slot.split('-')[0];

    console.log('Selected slot:', slot);
    console.log('Selected start time:', this.selectedTime);
  }

  bookAppointment(): void {
    if (this.bookingLoading()) return;

    if (!this.selectedDate) {
      alert('Please select a date');
      return;
    }

    if (!this.selectedTime) {
      alert('Please select a time slot');
      return;
    }

    if (this.isSlotBooked(`${this.selectedTime}-${this.getEndTime(this.selectedTime)}`)) {
      alert('This time slot is already booked');
      return;
    }

    this.bookingLoading.set(true);

    this.appointmentService.createAppointment({
      recipeId: this.recipeId,
      date: this.selectedDate,
      startTime: this.selectedTime
    }).subscribe({
      next: response => {
        console.log('Appointment created:', response);
        this.createPaymentOrder(response.appointment._id);
      },
      error: error => {
        console.error('Appointment creation failed:', error);
        this.bookingLoading.set(false);
        alert(error?.error?.message || 'Unable to create appointment. Please try again.');
      }
    });
  }

  private getEndTime(startTime: string): string {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + 60;

    return `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
  }

  private createPaymentOrder(appointmentId: string): void {
    this.paymentService.createOrder(appointmentId).subscribe({
      next: response => {
        console.log('Razorpay order created:', response);

        const options = {
          key: response.keyId,
          amount: response.order.amount,
          currency: response.order.currency,
          name: 'RecipeHub',
          description: 'Recipe Learning Appointment',
          order_id: response.order.id,

          handler: (paymentResponse: any) => {
            this.paymentProcessing = true;
            // console.log('Payment response:', paymentResponse);
            this.verifyPayment(appointmentId, paymentResponse);
          },

          theme: {
            color: '#ff6b35'
          },

          modal: {
            ondismiss: () => {
              // console.log('Razorpay checkout closed');
              this.bookingLoading.set(false);
            }
          }
        };

        const razorpay = new Razorpay(options);
        razorpay.open();
      },

      error: error => {
        console.error('Razorpay order creation failed:', error);
        this.bookingLoading.set(false);
        alert(error?.error?.message || 'Unable to create payment order. Please try again.');
      }
    });
  }

  private verifyPayment(appointmentId: string, paymentResponse: any): void {
    this.paymentService.verifyPayment({
      appointmentId,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature
    }).subscribe({
      next: response => {
        console.log('Payment verified:', response);
        this.bookingLoading.set(false);
        alert('Payment successful! Appointment confirmed.');
      },

      error: error => {
        console.error('Payment verification failed:', error);
        this.cancelAppointment(appointmentId);
      }
    });
  }

  private cancelAppointment(appointmentId: string): void {
    this.appointmentService.cancelAppointment(appointmentId).subscribe({
      next: response => {
        console.log('Appointment cancelled:', response);
        this.bookingLoading.set(false);
        this.selectedTimeSlot.set(null);
        this.selectedTime = '';
        alert('Payment cancelled. Appointment slot released.');
      },

      error: error => {
        console.error('Failed to cancel appointment:', error);
        this.bookingLoading.set(false);
        alert(error?.error?.message || 'Unable to cancel appointment.');
      }
    });
  }
}