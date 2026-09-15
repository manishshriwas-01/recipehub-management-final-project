import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, switchMap } from 'rxjs';

import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-view-recipe',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './view-recipe.html',
  styleUrl: './view-recipe.css',
})
export class ViewRecipe {
  private route = inject(ActivatedRoute);
  recipeService = inject(RecipeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  isFavorite = signal(false);
  isFavoriteLoading = signal(false);

  recipeId = '';

  recipe$: Observable<{ success: boolean; recipe: Recipe }> =
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.recipeId = params.get('id')!;

        return this.recipeService.getRecipe(this.recipeId);
      })
    );

  toggleFavorite(): void {
    const token = localStorage.getItem('token');

    // User is not logged in
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // Prevent multiple clicks
    if (this.isFavoriteLoading()) {
      return;
    }

    this.isFavoriteLoading.set(true);

    if (this.isFavorite()) {
      // Remove from favorites
      this.recipeService.removeFavorite(this.recipeId).subscribe({
        next: (response) => {
          this.isFavorite.set(false);
          this.isFavoriteLoading.set(false);

          this.toastr.success(
            response.message || 'Recipe removed from favorites!'
          );
        },

        error: () => {
          this.isFavoriteLoading.set(false);
        },
      });
    } else {
      // Add to favorites
      this.recipeService.addFavorite(this.recipeId).subscribe({
        next: (response) => {
          this.isFavorite.set(true);
          this.isFavoriteLoading.set(false);

          this.toastr.success(
            response.message || 'Recipe added to favorites!'
          );
        },

        error: () => {
          this.isFavoriteLoading.set(false);
        },
      });
    }
  }
}