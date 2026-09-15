import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-favorites',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites {
  private toastr = inject(ToastrService);
  recipeService = inject(RecipeService);

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

      error: () => {
        this.loading.set(false);
      },
    });
  }

  removeFavorite(recipeId: string): void {
    this.recipeService.removeFavorite(recipeId).subscribe({
      next: (response) => {
        this.favorites.update((recipes) =>
          recipes.filter((recipe) => recipe._id !== recipeId)
        );

        this.toastr.success(
          response.message || 'Recipe removed from favorites!'
        );
      },

      error: () => {
        // Error handled by HTTP interceptor
      },
    });
  }
}