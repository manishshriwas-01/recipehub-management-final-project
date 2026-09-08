import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef,Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Recipe, RecipeResponse } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-manage-recipes',
  imports: [AsyncPipe],
  templateUrl: './manage-recipes.html',
  styleUrl: './manage-recipes.css',
})
export class ManageRecipes {
  private recipeService = inject(RecipeService);
  private router = inject(Router);
   private cdr = inject(ChangeDetectorRef);

  recipes$: Observable<RecipeResponse> =
    this.recipeService.getRecipes(1, 50);

  isDeleting = false;
  errorMessage = '';

  viewRecipe(id: string): void {
    this.router.navigate(['/recipes', id]);
  }

  editRecipe(id: string): void {
    this.router.navigate(['/edit-recipe', id]);
  }

  deleteRecipe(id: string): void {
    const confirmed = confirm(
      'Are you sure you want to delete this recipe?'
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.recipeService.deleteRecipe(id).subscribe({
      next: () => {
        this.isDeleting = false;

        // Delete ke baad latest recipes dobara fetch
        this.recipes$ = this.recipeService.getRecipes(1, 50);
         this.cdr.detectChanges();
      },

      error: (error) => {
        this.isDeleting = false;

        this.errorMessage =
          error.error?.message ||
          'Failed to delete recipe. Please try again.';

           this.cdr.detectChanges();
      },
    });
  }
}