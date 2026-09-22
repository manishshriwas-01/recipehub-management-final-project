import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  startWith,
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  of
} from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-manage-recipes',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './manage-recipes.html',
  styleUrl: './manage-recipes.css',
})
export class ManageRecipes {
  recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  searchControl = new FormControl('', {
    nonNullable: true,
  });

  currentPage$ = new BehaviorSubject<number>(1);

  users = signal<
    {
      _id: string;
      name: string;
      email: string;
      role: string;
    }[]
  >([]);

  totalUsers = signal(0);

  selectedUserName = signal('All Recipes');
  selectedUserId = signal<string | null>(null);
  selectedUserId$ = new BehaviorSubject<string | null>(null);

  isDeleting = false;
  errorMessage = '';

  recipes$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged()
    ),
    this.selectedUserId$,
  ]).pipe(
    switchMap(([search, userId]) => {
      const request$ = userId
        ? this.recipeService.getRecipesByUser(userId, search.trim())
        : this.recipeService.getRecipes(1, 50, search.trim());

      this.errorMessage = '';

      return request$.pipe(
        catchError(error => {
          console.error('Failed to load recipes:', error);
          this.errorMessage = 'Failed to load recipes';

          return of({
            success: false,
            recipes: [],
            count: 0,
            total: 0,
            page: 1,
            pages: 0
          });
        })
      );
    })
  );

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.totalUsers.set(response.count);
      },

      error: () => {
        // API error handled by HTTP interceptor
      },
    });
  }

  selectUser(userId: string, name: string): void {
    this.selectedUserId.set(userId);
    this.selectedUserName.set(name);
    this.selectedUserId$.next(userId);
  }

  showAllRecipes(): void {
    this.selectedUserId.set(null);
    this.selectedUserName.set('All Recipes');
    this.selectedUserId$.next(null);
  }

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

    this.recipeService.deleteRecipe(id).subscribe({
      next: (response) => {
        this.isDeleting = false;

        this.toastr.success(
          response.message || 'Recipe deleted successfully!'
        );

        // Refresh current recipe list
        this.selectedUserId$.next(this.selectedUserId());
      },

      error: () => {
        this.isDeleting = false;

        // API error handled by HTTP interceptor
      },
    });
  }

  deleteUser(userId: string, userName: string): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${userName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.authService.deleteUser(userId).subscribe({
      next: (response) => {
        this.users.update((users) =>
          users.filter(user => user._id !== userId)
        );

        this.totalUsers.update(count => count - 1);

        this.toastr.success(
          response.message || 'User deleted successfully!'
        );

        const selectedUserId = this.selectedUserId();

        const selectedUserStillExists = this.users().some(
          user => user._id === selectedUserId
        );

        if (selectedUserId && !selectedUserStillExists) {
          this.showAllRecipes();
        }
      },

      error: () => {
        // API error handled by HTTP interceptor
      },
    });
  }
}