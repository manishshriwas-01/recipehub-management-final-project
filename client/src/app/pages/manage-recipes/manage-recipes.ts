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
} from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service/auth.service';

@Component({
  selector: 'app-manage-recipes',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './manage-recipes.html',
  styleUrl: './manage-recipes.css',
})
export class ManageRecipes {
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private router = inject(Router);

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

  selectedUserEmail = signal<string | null>(null);

  selectedUserName = signal('All Recipes');

  // User selection ko observable banaya
  selectedUserEmail$ = new BehaviorSubject<string | null>(null);

  isDeleting = false;
  errorMessage = '';

  recipes$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged()
    ),

    this.selectedUserEmail$
  ]).pipe(
    switchMap(([search, email]) => {

      // User selected hai
      if (email) {
        return this.recipeService.getRecipesByUser(
          email,
          search.trim()
        );
      }

      // All recipes
      return this.recipeService.getRecipes(
        1,
        50,
        search.trim()
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

      error: (error) => {
        console.error(
          'Failed to load users:',
          error
        );

        this.errorMessage =
          error.error?.message ||
          'Failed to load users.';
      },
    });
  }

  // HTML se email yahan aayegi
  selectUser( email: string, name: string): void {

    // console.log('Selected User:', name);
    // console.log('Selected Email:', email);

    this.selectedUserEmail.set(email);
    this.selectedUserName.set(name);

    // Observable ko trigger karo
    this.selectedUserEmail$.next(email);
  }

  showAllRecipes(): void {

    this.selectedUserEmail.set(null);
    this.selectedUserName.set('All Recipes');

    // All recipes dobara fetch
    this.selectedUserEmail$.next(null);
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
    this.errorMessage = '';

    this.recipeService.deleteRecipe(id).subscribe({
      next: () => {

        this.isDeleting = false;

        // Current selection/search ke according
        // recipes dobara fetch
        this.selectedUserEmail$.next(
          this.selectedUserEmail()
        );
      },

      error: (error) => {

        this.isDeleting = false;

        this.errorMessage =
          error.error?.message ||
          'Failed to delete recipe. Please try again.';
      },
    });
  }

  deleteUser(
    userId: string,
    userName: string
  ): void {

    const confirmed = confirm(
      `Are you sure you want to delete "${userName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.authService.deleteUser(userId).subscribe({
      next: () => {

        this.users.update((users) =>
          users.filter(
            (user) => user._id !== userId
          )
        );

        this.totalUsers.update(
          (count) => count - 1
        );

        const selectedEmail =
          this.selectedUserEmail();

        const deletedUserStillExists =
          this.users().some(
            (user) =>
              user.email === selectedEmail
          );

        if (
          selectedEmail &&
          !deletedUserStillExists
        ) {
          this.showAllRecipes();
        }
      },

      error: (error) => {

        this.errorMessage =
          error.error?.message ||
          'Failed to delete user.';
      },
    });
  }
}