import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-recipe',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-recipe.html',
  styleUrl: './edit-recipe.css',
})
export class EditRecipe {
  private route = inject(ActivatedRoute);
  recipeService = inject(RecipeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);

  recipeId = '';
  errorMessage = '';

  // New image selected by user
  selectedImage: File | null = null;

  // Existing image
  currentImageUrl = '';

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
  isSaving = false;

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id')!;
    this.loadRecipe();
  }

  private loadRecipe(): void {
    this.isLoading = true;

    this.recipeService.getRecipe(this.recipeId).subscribe({
      next: (response) => {
        const recipe = response.recipe;

        this.recipeForm.patchValue({
          title: recipe.title,
          ingredients: recipe.ingredients.join('\n'),
          steps: recipe.steps.join('\n'),
          category: recipe.category,
        });

        // Store existing image path
        this.currentImageUrl = recipe.imageUrl;

        this.isLoading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message || 'Failed to load recipe. Please try again.';
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
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
    formData.append('ingredients', JSON.stringify(ingredients));
    formData.append('steps', JSON.stringify(steps));
    formData.append('category', formValue.category);

    // Only send image if user selected a new one
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    this.isSaving = true;

    this.recipeService.updateRecipe(this.recipeId, formData).subscribe({
      next: (response) => {
        this.isSaving = false;

        this.toastr.success(
          response.message || 'Recipe updated successfully!'
        );

        this.router.navigate([
          '/recipes',
          this.recipeId,
        ]);
      },

      error: (error) => {
        this.isSaving = false;
        this.errorMessage =
          error?.error?.message || 'Failed to update recipe.';
        this.toastr.error(this.errorMessage);
      },
    });
  }
}