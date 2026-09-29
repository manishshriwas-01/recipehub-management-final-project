import { Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { FoodDetectionService } from '../../services/food-detection-service';
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
  private foodDetectionService = inject(FoodDetectionService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  selectedImage: File | null = null;
  isAnalyzingImage = false;
  imageValidationMessage = '';
  isFoodImage = false;

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

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.selectedImage = null;
    this.isAnalyzingImage = true;
    this.imageValidationMessage = '';
    this.isFoodImage = false;

    try {
      const predictions =
        await this.foodDetectionService.classifyImage(file);

      console.log('MobileNet predictions:', predictions);

      const isFood = this.foodDetectionService.isFood(predictions);

      if (isFood) {
        this.selectedImage = file;
        this.isFoodImage = true;
        this.imageValidationMessage = 'Food image detected.';
      } else {
        this.toastr.warning(
          'Please upload an image related to food or a recipe.'
        );
        this.imageValidationMessage =
          'This image does not appear to be food.';
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      this.toastr.error('Unable to analyze the image.');
      this.imageValidationMessage = 'Image analysis failed.';
    } finally {
      this.isAnalyzingImage = false;
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

      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ||
          'Failed to create recipe. Please try again.';
      },
    });
  }
}