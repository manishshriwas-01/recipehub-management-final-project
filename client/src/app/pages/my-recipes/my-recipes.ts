import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-recipes',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './my-recipes.html',
  styleUrl: './my-recipes.css',
})
export class MyRecipes {
  private router = inject(Router);
  recipeService = inject(RecipeService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);

  recipes$: Observable<{
    success: boolean;
    count: number;
    recipes: Recipe[];
  }> = this.recipeService.getMyRecipes().pipe(
    catchError(() => {
      this.errorMessage = 'Failed to load your recipes';
      return of({
        success: false,
        count: 0,
        recipes: [],
      });
    })
  );

  isDeleting = false;
  errorMessage = '';

  viewRecipe(id: string): void {
    this.router.navigate(['/recipes', id]);
  }

  editRecipe(id: string): void {
    this.router.navigate(['/edit-recipe', id]);
  }

  createRecipe(): void {
    this.router.navigate(['/create-recipe']);
  }

  deleteRecipe(id: string): void {
    const confirmed = confirm(
      'Are you sure you want to delete this recipe?'
    );

    if (!confirmed) {
      return;
    }

    this.recipeService.deleteRecipe(id).subscribe({
      next: (response) => {
        this.toastr.success(
          response.message || 'Recipe deleted successfully!'
        );

        // Delete successful hone ke baad
        // My Recipes ko dobara fetch karo
        this.errorMessage = '';
        this.recipes$ = this.recipeService.getMyRecipes().pipe(
          catchError(() => {
            this.errorMessage = 'Failed to load your recipes';
            return of({ success: false, count: 0, recipes: [] });
          })
        );
        this.cdr.detectChanges();
      },

      error: (error) => {
        this.toastr.error(error?.error?.message || 'Failed to delete recipe');
      },
    });
  }
}