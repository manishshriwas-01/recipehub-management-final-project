import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef,Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-recipes',
  imports: [AsyncPipe, ReactiveFormsModule ],
  templateUrl: './my-recipes.html',
  styleUrl: './my-recipes.css',
})
export class MyRecipes {
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private cdr=inject(ChangeDetectorRef);

  recipes$: Observable<{
    success: boolean;
    count: number;
    recipes: Recipe[];
  }> = this.recipeService.getMyRecipes();

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
      next: () => {
        // Delete successful hone ke baad
        // My Recipes ko dobara fetch karo
        this.recipes$ = this.recipeService.getMyRecipes();
        this.cdr.detectChanges();
      },

      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          'Failed to delete recipe. Please try again.';
      },
    });
  }
}