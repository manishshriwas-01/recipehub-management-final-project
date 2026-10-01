import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { RecipeService } from '../../services/recipe.service';
import { VoiceRecognitionService } from '../../services/voice-recognition-service';

@Component({
  selector: 'app-recipes',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
})
export class Recipes {
  recipeService = inject(RecipeService);
  private router = inject(Router);
  private voiceRecognitionService = inject(VoiceRecognitionService);

  selectedRecipe: any = null;
  copied = false;

  searchControl = new FormControl('', {
    nonNullable: true,
  });

  categoryControl = new FormControl('', {
    nonNullable: true,
  });

  maxCookTimeControl = new FormControl<number | null>(null);

  minRatingControl = new FormControl<number | null>(null);

  sortControl = new FormControl('newest', {
    nonNullable: true,
  });

  ingredientControl = new FormControl('', {
    nonNullable: true,
  });

  selectedIngredients = signal<string[]>([]);

  selectedIngredients$ = toObservable(this.selectedIngredients);

  isListening = signal(false);

  voiceError = signal('');

  currentPage$ = new BehaviorSubject<number>(1);

  errorMessage$ = new BehaviorSubject<string>('');

  recipes$: Observable<any> = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged(),
      tap((search) => {
      })
    ),

    this.categoryControl.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged()
    ),

    this.maxCookTimeControl.valueChanges.pipe(
      startWith(null),
      distinctUntilChanged()
    ),

    this.minRatingControl.valueChanges.pipe(
      startWith(null),
      distinctUntilChanged()
    ),

    this.sortControl.valueChanges.pipe(
      startWith('newest'),
      distinctUntilChanged()
    ),

    this.selectedIngredients$,

    this.currentPage$.pipe(
      distinctUntilChanged()
    ),
  ]).pipe(

    tap(([
      search,
      category,
      maxCookTime,
      minRating,
      sort,
      selectedIngredients,
      page,
    ]) => {
    }),

    switchMap(([
      search,
      category,
      maxCookTime,
      minRating,
      sort,
      selectedIngredients,
      page,
    ]) => {

      this.errorMessage$.next('');

      return this.recipeService.getRecipes(
        page,
        9,
        search.trim(),
        category,
        maxCookTime ?? undefined,
        minRating ?? undefined,
        sort,
        selectedIngredients
      ).pipe(

        tap((response) => {
        }),

        catchError((error) => {

          this.errorMessage$.next(
            'Failed to load recipes'
          );

          return of({
            success: false,
            recipes: [],
            count: 0,
            total: 0,
            page,
            pages: 0,
          });
        })
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

    this.maxCookTimeControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    this.minRatingControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    this.sortControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    this.voiceRecognitionService.transcript$
      .subscribe((transcript) => {

        this.searchControl.setValue(transcript);
        this.voiceError.set('');
        this.isListening.set(false);
      });

    this.voiceRecognitionService.error$
      .subscribe((error) => {

        this.isListening.set(false);

        if (error === 'not-allowed') {
          this.voiceError.set(
            'Microphone permission was denied.'
          );
        } else if (error === 'no-speech') {
          this.voiceError.set(
            'No speech detected. Please try again.'
          );
        } else if (error === 'network') {
          this.voiceError.set(
            'Network error. Please try again.'
          );
        } else {
          this.voiceError.set(
            'Voice search failed. Please try again.'
          );
        }
      });

    this.voiceRecognitionService.end$
      .subscribe(() => {

        this.isListening.set(false);
      });
  }

  startVoiceSearch(): void {
    if (this.isListening()) {
      return;
    }

    this.voiceError.set('');
    this.isListening.set(true);

    this.voiceRecognitionService.startListening();
  }

  createRecipe(): void {
    this.router.navigate(['/create-recipe']);
  }

  viewRecipe(id: string): void {
    this.router.navigate(['/recipes', id]);
  }

  nextPage(
    currentPage: number,
    totalPages: number
  ): void {
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

  closeShare(): void {
    this.selectedRecipe = null;
  }

  shareRecipe(recipe: any): void {
    this.selectedRecipe = recipe;
  }

  shareOnWhatsApp(recipe: any): void {
    const recipeUrl =
      `${window.location.origin}/recipes/${recipe._id}`;

    const message =
      `Check out this recipe: ${recipe.title}\n${recipeUrl}`;

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  }

  copyRecipeLink(recipe: any): void {
    const recipeUrl =
      `${window.location.origin}/recipes/${recipe._id}`;

    navigator.clipboard
      .writeText(recipeUrl)
      .then(() => {
        this.copied = true;

        setTimeout(() => {
          this.copied = false;
        }, 2000);
      })
      .catch((error) => {
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  clearCategory(): void {
    this.categoryControl.setValue('');
  }

  clearCookTime(): void {
    this.maxCookTimeControl.setValue(null);
  }

  clearRating(): void {
    this.minRatingControl.setValue(null);
  }

  clearSort(): void {
    this.sortControl.setValue('newest');
  }

  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.maxCookTimeControl.setValue(null);
    this.minRatingControl.setValue(null);
    this.sortControl.setValue('newest');

    this.currentPage$.next(1);
  }

  getSortLabel(): string {
    switch (this.sortControl.value) {
      case 'cookTime':
        return 'Quickest';

      case 'rating':
        return 'Highest Rated';

      case 'reviews':
        return 'Most Reviewed';

      default:
        return 'Newest';
    }
  }

  addIngredient(): void {
    const ingredient =
      this.ingredientControl.value
        .trim()
        .toLowerCase();

    if (!ingredient) return;

    if (!this.selectedIngredients().includes(ingredient)) {
      this.selectedIngredients.update(
        ingredients => [
          ...ingredients,
          ingredient
        ]
      );
    }

    this.ingredientControl.setValue('');
  }

  removeIngredient(ingredient: string): void {
    this.selectedIngredients.update(
      ingredients =>
        ingredients.filter(
          item => item !== ingredient
        )
    );
  }

  clearIngredients(): void {
    this.selectedIngredients.set([]);
  }
}