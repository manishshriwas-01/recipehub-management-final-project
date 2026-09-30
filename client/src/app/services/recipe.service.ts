import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RecipeResponse, Recipe } from '../models/Recipe';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/recipes`;

  // Get Recipes
  // Updated for Day 3:
  // - maxCookTime
  // - minRating
  // - sort
  getRecipes(
    page: number = 1,
    limit: number = 9,
    search: string = '',
    category: string = '',
    maxCookTime?: number,
    minRating?: number,
    sort: string = 'newest',
    ingredients: string[] = []
  ): Observable<RecipeResponse> {

    let url =
      `${this.apiUrl}?page=${page}&limit=${limit}`;

    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    if (maxCookTime !== undefined) {
      url += `&maxCookTime=${maxCookTime}`;
    }

    if (minRating !== undefined) {
      url += `&minRating=${minRating}`;
    }

    // Backend already defaults to newest
    if (sort && sort !== 'newest') {
      url += `&sort=${encodeURIComponent(sort)}`;
    }
    if (ingredients.length > 0) {
      url += `&ingredients=${encodeURIComponent(ingredients.join(','))}`;
    }

    console.log('Recipe API URL:', url);

    return this.http.get<RecipeResponse>(url);
  }

  getRecipe(id: string): Observable<{
    success: boolean;
    recipe: Recipe;
    averageRating: number;
    reviewCount: number;
  }> {
    return this.http.get<{
      success: boolean;
      recipe: Recipe;
      averageRating: number;
      reviewCount: number;
    }>(`${this.apiUrl}/${id}`);
  }

  createRecipe(
    data: FormData
  ): Observable<{
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
    data: FormData
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

  deleteRecipe(id: string): Observable<{
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

  getRecipesByUser(
    ownerId: string,
    search: string = ''
  ): Observable<RecipeResponse> {
    let url = `${this.apiUrl}?ownerId=${encodeURIComponent(ownerId)}`;

    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    console.log('User Recipe API:', url);

    return this.http.get<RecipeResponse>(url);
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return '';
    }

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {
      return imageUrl;
    }

    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    return `${baseUrl}/${imageUrl.replace(/^\/+/, '')}`;
  }

  getRecipeAvailability(
    recipeId: string
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${recipeId}/availability`
    );
  }

  // Day 3 - Trending Recipes
  getTrendingRecipes(
    type: 'mostReviewed' | 'highestRated' = 'mostReviewed'
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/trending?type=${type}`
    );
  }
}