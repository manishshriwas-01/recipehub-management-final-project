import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MealPlanService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/meal-plans`;

  getMealPlans(
    startDate: string,
    endDate: string
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}?startDate=${startDate}&endDate=${endDate}`
    );
  }

  createMealPlan(data: {
    recipe: string;
    date: string;
    mealType: string;
  }): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      data
    );
  }

  updateMealPlan(
    id: string,
    data: {
      recipe?: string;
      date?: string;
      mealType?: string;
    }
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  deleteMealPlan(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );
  }

  
}