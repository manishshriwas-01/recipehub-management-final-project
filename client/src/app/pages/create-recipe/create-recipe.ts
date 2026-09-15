import { Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-create-recipe',
  imports: [ReactiveFormsModule],
  templateUrl: './create-recipe.html',
  styleUrl: './create-recipe.css',
})
export class CreateRecipe {
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  selectedImage: File | null = null;

  recipeForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
      ],
    }),

    ingredients: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    steps: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    category: new FormControl('Other', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  isLoading = false;
  errorMessage = '';

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.recipeForm.invalid || !this.selectedImage) {
      this.recipeForm.markAllAsTouched();

      if (!this.selectedImage) {
        this.toastr.error('Recipe image is required.');
      }

      return;
    }

    const formValue = this.recipeForm.getRawValue();

    const ingredients = formValue.ingredients
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const steps = formValue.steps
      .split('\n')
      .map((step) => step.trim())
      .filter((step) => step.length > 0);

    const formData = new FormData();

    formData.append('title', formValue.title.trim());

    formData.append(
      'ingredients',
      JSON.stringify(ingredients)
    );

    formData.append(
      'steps',
      JSON.stringify(steps)
    );

    formData.append('category', formValue.category);

    formData.append('image', this.selectedImage);

    this.isLoading = true;
    this.errorMessage = '';

    this.recipeService.createRecipe(formData).subscribe({
      next: (response) => {
        this.isLoading = false;

        this.toastr.success(
          response.message || 'Recipe created successfully!'
        );

        this.router.navigate([
          '/recipes',
          response.recipe._id,
        ]);
      },

      error: () => {
        this.isLoading = false;
      },
    });
  }
}