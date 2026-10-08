import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ShoppingListService } from './shopping-service';
import { environment } from '../../environments/environment';

describe('ShoppingListService', () => {
  let service: ShoppingListService;
  let httpTestingController: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/meal-plans`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ShoppingListService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ShoppingListService);

    httpTestingController =
      TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get shopping list', () => {
    const mockResponse = {
      success: true,
      shoppingList: [
        {
          ingredient: 'Tomato',
          quantity: 4,
        },
        {
          ingredient: 'Paneer',
          quantity: 500,
        },
        {
          ingredient: 'Onion',
          quantity: 2,
        },
      ],
    };

    service
      .getShoppingList(
        '2026-10-06',
        '2026-10-12'
      )
      .subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
        expect(response.shoppingList.length).toBe(3);
      });

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/shopping-list?startDate=2026-10-06&endDate=2026-10-12`
      );

    expect(request.request.method).toBe('GET');

    request.flush(mockResponse);
  });

  it('should handle an empty shopping list', () => {
    const mockResponse = {
      success: true,
      shoppingList: [],
    };

    service
      .getShoppingList(
        '2026-10-06',
        '2026-10-12'
      )
      .subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.shoppingList).toEqual([]);
      });

    const request =
      httpTestingController.expectOne(
        `${apiUrl}/shopping-list?startDate=2026-10-06&endDate=2026-10-12`
      );

    expect(request.request.method).toBe('GET');

    request.flush(mockResponse);
  });
});