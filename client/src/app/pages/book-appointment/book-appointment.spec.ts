import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { BookAppointment } from './book-appointment';
import { RecipeService } from '../../services/recipe.service';
import { AppointmentService } from '../../services/appointment.service.ts';
import { PaymentService } from '../../services/payment.service.ts';

describe('BookAppointment', () => {
  let component: BookAppointment;
  let fixture: ComponentFixture<BookAppointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookAppointment],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ recipeId: 'recipe123' }))
          }
        },
        {
          provide: RecipeService,
          useValue: {
            getRecipe: () => of(null),
            getRecipeAvailability: () => of({
              success: true,
              availability: []
            })
          }
        },
        {
          provide: AppointmentService,
          useValue: {
            getBookedSlots: () => of({
              success: true,
              bookedSlots: []
            }),
            createAppointment: () => of(null),
            cancelAppointment: () => of(null)
          }
        },
        {
          provide: PaymentService,
          useValue: {
            createOrder: () => of(null),
            verifyPayment: () => of(null)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookAppointment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});