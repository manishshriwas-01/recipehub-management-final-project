import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RecipeResponse, Recipe } from '../models/Recipe';


@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private http = inject(HttpClient);

  // private apiUrl =
  //   'https://recipehub-management-final-project.onrender.com/api/recipes';

  private apiUrl = 'http://localhost:3000/api/recipes';

  getRecipes(page: number = 1,limit: number = 9,search: string = '', category: string = ''): Observable<RecipeResponse> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    return this.http.get<RecipeResponse>(url);
  }

  getRecipe(id: string): Observable<{ success: boolean; recipe: Recipe }> {
    return this.http.get<{ success: boolean; recipe: Recipe }>(
      `${this.apiUrl}/${id}`
    );
  }
  createRecipe(data: {
    title: string;
    imageUrl: string;
    ingredients: string[];
    steps: string[];
    category: string;
  }): Observable<{
    success: boolean;
    message: string;
    recipe: Recipe;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      recipe: Recipe;
    }>(this.apiUrl, data);
  }


  updateRecipe(
    id: string,
    data: {
      title?: string;
      imageUrl?: string;
      ingredients?: string[];
      steps?: string[];
      category?: string;
    }
  ): Observable<{
    success: boolean;
    message: string;
    recipe: Recipe;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      recipe: Recipe;
    }>(`${this.apiUrl}/${id}`, data);
  }


  getMyRecipes(): Observable<{
    success: boolean;
    count: number;
    recipes: Recipe[];
  }> {
    return this.http.get<{
      success: boolean;
      count: number;
      recipes: Recipe[];
    }>(`${this.apiUrl}/my-recipes`);
  }


  deleteRecipe(
    id: string
  ): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${id}`);
  }


  addFavorite(id: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${id}/favorite`, {});
  }

  removeFavorite(id: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${id}/favorite`);
  }


  getFavorites(): Observable<{
    success: boolean;
    count: number;
    recipes: Recipe[];
  }> {
    return this.http.get<{
      success: boolean;
      count: number;
      recipes: Recipe[];
    }>(`${this.apiUrl}/favorites`);
  }


  getRecipesByUser(email: string, search: string = ''): Observable<RecipeResponse>
   {
    let url = `${this.apiUrl}?ownerEmail=${encodeURIComponent(email)}`;

    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    console.log('User Recipe API:', url);
    return this.http.get<RecipeResponse>(url);
  }
}


