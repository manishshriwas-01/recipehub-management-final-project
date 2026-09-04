import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, switchMap } from 'rxjs';

import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-view-recipe',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './view-recipe.html',
  styleUrl: './view-recipe.css',
})
export class ViewRecipe {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);

  recipe$: Observable<{ success: boolean; recipe: Recipe }> =
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.recipeService.getRecipe(params.get('id')!)
      )
    );
}