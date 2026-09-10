import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-favorites',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites {
  private recipeService = inject(RecipeService);

  favorites = signal<Recipe[]>([]);
  loading = signal(true);

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    this.recipeService.getFavorites().subscribe({
      next: (response) => {
        this.favorites.set(response.recipes);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load favorites:', error);
        this.loading.set(false);
      },
    });
  }

  removeFavorite(recipeId: string): void {
    this.recipeService.removeFavorite(recipeId).subscribe({
      next: () => {
        this.favorites.update((recipes) =>
          recipes.filter((recipe) => recipe._id !== recipeId)
        );
      },
      error: (error) => {
        console.error('Remove favorite error:', error);
      },
    });
  }
}