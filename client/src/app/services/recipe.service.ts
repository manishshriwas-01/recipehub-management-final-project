import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RecipeResponse,Recipe } from '../models/Recipe';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/recipes';

  getRecipes(
    page: number = 1,
    limit: number = 10
  ): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(
      `${this.apiUrl}?page=${page}&limit=${limit}`
    );
  }

  getRecipe(id: string): Observable<{ success: boolean; recipe: Recipe }> {
  return this.http.get<{ success: boolean; recipe: Recipe }>(
    `${this.apiUrl}/${id}`
  );
}


}