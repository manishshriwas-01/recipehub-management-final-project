import { Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-recipe',
  imports: [ReactiveFormsModule],
  templateUrl: './create-recipe.html',
  styleUrl: './create-recipe.css',
})
export class CreateRecipe {
  private recipeService=inject(RecipeService);
  private router=inject(Router);
  recipeForm=new FormGroup({
    title:new FormControl('',{
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
  errorMessage='';

  onSubmit():void{
    if(this.recipeForm.invalid){
      this.recipeForm.markAllAsTouched();
      return;
    }
    const formValue=this.recipeForm.getRawValue();
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

    this.isLoading = true;
    this.errorMessage = '';

    this.recipeService.createRecipe(data).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/recipes', response.recipe._id]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ||
          'Failed to create recipe. Please try again.';
      },
    });
  }





}
