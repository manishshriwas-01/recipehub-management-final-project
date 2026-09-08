import { ChangeDetectorRef,Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-edit-recipe',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-recipe.html',
  styleUrl: './edit-recipe.css',
})
export class EditRecipe {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  recipeId = '';

  recipeForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
      ],
    }),
    imageUrl: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/),
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
  errorMessage = '';

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
          imageUrl: recipe.imageUrl,
          ingredients: recipe.ingredients.join('\n'),
          steps: recipe.steps.join('\n'),
          category: recipe.category,
        });

        // console.log('Form value:', this.recipeForm.getRawValue());

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ||
          'Failed to load recipe. Please try again.';
      },
    });
  }
  onSubmit(): void {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      return;
    }

    const formValue = this.recipeForm.getRawValue();

    const data = {
      title: formValue.title.trim(),
      imageUrl: formValue.imageUrl.trim(),

      ingredients: formValue.ingredients
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),

      steps: formValue.steps
        .split('\n')
        .map((step) => step.trim())
        .filter((step) => step.length > 0),

      category: formValue.category,
    };
    this.isSaving = true;
    this.errorMessage = '';

    this.recipeService.updateRecipe(this.recipeId, data).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/recipes', this.recipeId]);
      },

      error: (error) => {
        this.isSaving = false;
        this.errorMessage =
          error.error?.message ||
          'Failed to update recipe. Please try again.';
      },
    });
  }
}