import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
} from 'rxjs';


import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipes',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
})
export class Recipes {
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  searchControl = new FormControl('', {
    nonNullable: true,
  });

  categoryControl = new FormControl('', {
    nonNullable: true,
  });

  currentPage$ = new BehaviorSubject<number>(1);

  errorMessage$ = new BehaviorSubject<string>('');

  recipes$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged()
    ),

    this.categoryControl.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged()
    ),

    this.currentPage$,
  ]).pipe(
    switchMap(([search, category, page]) => {
      this.errorMessage$.next('');

      return this.recipeService.getRecipes(
        page,
        9,
        search.trim(),
        category
      );
    })
  );

  constructor() {
    this.searchControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    this.categoryControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });
  }

  createRecipe(): void {
  this.router.navigate(['/create-recipe']);
}

  viewRecipe(id: string): void {
    this.router.navigate(['/recipes', id]);
  }

  nextPage(currentPage: number, totalPages: number): void {
    if (currentPage < totalPages) {
      this.currentPage$.next(currentPage + 1);
    }
  }

  previousPage(currentPage: number): void {
    if (currentPage > 1) {
      this.currentPage$.next(currentPage - 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage$.next(page);
  }
}