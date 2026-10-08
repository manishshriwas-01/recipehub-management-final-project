import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MealPlanService } from './meal-service';
import { environment } from '../../environments/environment';

describe('MealPlanService', () => {
  let service: MealPlanService;
  let httpTestingController: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/meal-plans`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MealPlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(MealPlanService);
    httpTestingController =
      TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get meal plans', () => {
    const mockResponse = {
      mealPlans: [
        {
          _id: 'meal1',
          recipe: 'recipe1',
          date: '2026-10-08',
          mealType: 'lunch',
        },
      ],
    };

    service
      .getMealPlans('2026-10-06', '2026-10-12')
      .subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

    const request =
      httpTestingController.expectOne(
        `${apiUrl}?startDate=2026-10-06&endDate=2026-10-12`
      );

    expect(request.request.method).toBe('GET');

    request.flush(mockResponse);
  });

  it('should create a meal plan', () => {
    const mealData = {
      recipe: 'recipe123',
      date: '2026-10-08',
      mealType: 'dinner',
    };

    const mockResponse = {
      message: 'Meal plan created successfully',
      mealPlan: {
        _id: 'meal123',
        ...mealData,
      },
    };

    service
      .createMealPlan(mealData)
      .subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

    const request =
      httpTestingController.expectOne(apiUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(mealData);

    request.flush(mockResponse);
  });

  it('should update a meal plan', () => {
    const mealId = 'meal123';

    const updateData = {
      recipe: 'recipe456',
    };

    const mockResponse = {
      message: 'Meal plan updated successfully',
      mealPlan: {
        _id: mealId,
        recipe: 'recipe456',
      },
    };

    service
      .updateMealPlan(mealId, updateData)
      .subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/${mealId}`
      );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(updateData);

    request.flush(mockResponse);
  });

  it('should delete a meal plan', () => {
    const mealId = 'meal123';

    const mockResponse = {
      message: 'Meal plan deleted successfully',
    };

    service
      .deleteMealPlan(mealId)
      .subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/${mealId}`
      );

    expect(request.request.method).toBe('DELETE');

    request.flush(mockResponse);
  });
});