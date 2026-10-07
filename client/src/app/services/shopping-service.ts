import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ShoppingItem {
  ingredient: string;
  quantity: number;
  checked?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/meal-plans`;

  getShoppingList(
    startDate: string,
    endDate: string
  ): Observable<{
    success: boolean;
    shoppingList: ShoppingItem[];
  }> {
    return this.http.get<{
      success: boolean;
      shoppingList: ShoppingItem[];
    }>(
      `${this.apiUrl}/shopping-list?startDate=${startDate}&endDate=${endDate}`
    );
  }
}