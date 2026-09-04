import { Component,inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { RecipeResponse } from '../../models/Recipe';


@Component({
  selector: 'app-home',
  imports: [RouterLink,AsyncPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private recipeService = inject(RecipeService);
  recipes$: Observable<RecipeResponse> =
    this.recipeService.getRecipes(1, 6);

}
