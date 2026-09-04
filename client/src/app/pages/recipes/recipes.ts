import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AsyncPipe } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
import { RecipeResponse } from '../../models/Recipe';
import { RouterLink,Router } from '@angular/router';

@Component({
  selector: 'app-recipes',
  imports: [AsyncPipe,RouterLink],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
})
export class Recipes {
  private router = inject(Router);
  private recipeService = inject(RecipeService);

  viewRecipe(id: string): void {
  this.router.navigate(['/recipes', id]);
}

  recipes$: Observable<RecipeResponse> =
    this.recipeService.getRecipes();
}