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

  // Stores the text entered in the search box.
  searchControl = new FormControl('', {
    nonNullable: true,
  });

  // Stores the selected recipe category.
  categoryControl = new FormControl('', {
    nonNullable: true,
  });

  // Stores the maximum cooking time filter.
  maxCookTimeControl = new FormControl<number | null>(null);

  // Stores the minimum rating filter.
  minRatingControl = new FormControl<number | null>(null);

  // Stores the selected sorting option.
  sortControl = new FormControl('newest', {
    nonNullable: true,
  });

  // Stores the ingredient entered by the user.
  ingredientControl = new FormControl('', {
    nonNullable: true,
  });

  // Stores the ingredients selected by the user.
  selectedIngredients = signal<string[]>([]);

  // Converts selectedIngredients signal into an Observable.
  selectedIngredients$ = toObservable(this.selectedIngredients);

  // Tracks whether voice recognition is currently running.
  isListening = signal(false);

  // Stores voice search error messages.
  voiceError = signal('');

  // Stores the current pagination page.
  currentPage$ = new BehaviorSubject<number>(1);

  // Stores recipe loading/API error messages.
  errorMessage$ = new BehaviorSubject<string>('');

  // Combines all filters and calls the API whenever a filter changes.
  recipes$: Observable<any> = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged(),
      tap((search) => {
        console.log('SEARCH VALUE:', search);
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

    // Shows all current filter values in the console.
    tap(([
      search,
      category,
      maxCookTime,
      minRating,
      sort,
      selectedIngredients,
      page,
    ]) => {
      console.log('FILTER VALUES:', {
        search,
        category,
        maxCookTime,
        minRating,
        sort,
        selectedIngredients,
        page,
      });
    }),

    // Calls the recipe API whenever any filter changes.
    switchMap(([
      search,
      category,
      maxCookTime,
      minRating,
      sort,
      selectedIngredients,
      page,
    ]) => {
      console.log('SWITCHMAP EXECUTED');

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

        // Shows the API response in the console.
        tap((response) => {
          console.log('RECIPE RESPONSE:', response);
        }),

        // Handles recipe API errors.
        catchError((error) => {
          console.error('RECIPE API ERROR:', error);

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

  // Runs when the Recipes component is created.
  constructor() {
    console.log('RECIPES COMPONENT CREATED');

    // Resets pagination when search changes.
    this.searchControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    // Resets pagination when category changes.
    this.categoryControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    // Resets pagination when cook time changes.
    this.maxCookTimeControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    // Resets pagination when rating changes.
    this.minRatingControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    // Resets pagination when sorting changes.
    this.sortControl.valueChanges.subscribe(() => {
      this.currentPage$.next(1);
    });

    // Receives text recognized from voice search.
    this.voiceRecognitionService.transcript$
      .subscribe((transcript) => {
        console.log('VOICE SEARCH TEXT:', transcript);

        this.searchControl.setValue(transcript);
        this.voiceError.set('');
        this.isListening.set(false);
      });

    // Handles voice recognition errors.
    this.voiceRecognitionService.error$
      .subscribe((error) => {
        console.error('VOICE SEARCH ERROR:', error);

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

    // Handles the end of voice recognition.
    this.voiceRecognitionService.end$
      .subscribe(() => {
        console.log('VOICE SEARCH ENDED');

        this.isListening.set(false);
      });
  }

  // Starts voice recognition when the microphone button is clicked.
  startVoiceSearch(): void {
    if (this.isListening()) {
      return;
    }

    this.voiceError.set('');
    this.isListening.set(true);

    this.voiceRecognitionService.startListening();
  }

  // Navigates to the create recipe page.
  createRecipe(): void {
    this.router.navigate(['/create-recipe']);
  }

  // Navigates to the selected recipe detail page.
  viewRecipe(id: string): void {
    this.router.navigate(['/recipes', id]);
  }

  // Moves to the next recipe page.
  nextPage(
    currentPage: number,
    totalPages: number
  ): void {
    if (currentPage < totalPages) {
      this.currentPage$.next(currentPage + 1);
    }
  }

  // Moves to the previous recipe page.
  previousPage(currentPage: number): void {
    if (currentPage > 1) {
      this.currentPage$.next(currentPage - 1);
    }
  }

  // Moves directly to a selected recipe page.
  goToPage(page: number): void {
    this.currentPage$.next(page);
  }

  // Closes the share modal.
  closeShare(): void {
    this.selectedRecipe = null;
  }

  // Opens the share modal for a recipe.
  shareRecipe(recipe: any): void {
    this.selectedRecipe = recipe;
  }

  // Shares the recipe through WhatsApp.
  shareOnWhatsApp(recipe: any): void {
    const recipeUrl =
      `${window.location.origin}/recipes/${recipe._id}`;

    const message =
      `Check out this recipe: ${recipe.title}\n${recipeUrl}`;

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  }

  // Copies the recipe URL to the clipboard.
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
        console.error(
          'Failed to copy recipe link:',
          error
        );
      });
  }

  // Clears the search text.
  clearSearch(): void {
    this.searchControl.setValue('');
  }

  // Clears the category filter.
  clearCategory(): void {
    this.categoryControl.setValue('');
  }

  // Clears the cook time filter.
  clearCookTime(): void {
    this.maxCookTimeControl.setValue(null);
  }

  // Clears the rating filter.
  clearRating(): void {
    this.minRatingControl.setValue(null);
  }

  // Resets the sorting option.
  clearSort(): void {
    this.sortControl.setValue('newest');
  }

  // Clears all filters and resets pagination.
  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.maxCookTimeControl.setValue(null);
    this.minRatingControl.setValue(null);
    this.sortControl.setValue('newest');

    this.currentPage$.next(1);
  }

  // Returns the readable label for the selected sorting option.
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

  // Adds the entered ingredient to the selected ingredients list.
  addIngredient(): void {
    const ingredient =
      this.ingredientControl.value
        .trim()
        .toLowerCase();

    console.log(
      'INGREDIENT ENTERED:',
      ingredient
    );

    if (!ingredient) return;

    if (!this.selectedIngredients().includes(ingredient)) {
      this.selectedIngredients.update(
        ingredients => [
          ...ingredients,
          ingredient
        ]
      );
    }

    console.log(
      'SELECTED INGREDIENTS:',
      this.selectedIngredients()
    );

    this.ingredientControl.setValue('');
  }

  // Removes one ingredient from the selected ingredients list.
  removeIngredient(ingredient: string): void {
    this.selectedIngredients.update(
      ingredients =>
        ingredients.filter(
          item => item !== ingredient
        )
    );
  }

  // Clears all selected ingredients.
  clearIngredients(): void {
    this.selectedIngredients.set([]);
  }
}