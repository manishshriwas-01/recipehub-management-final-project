import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';

import { CreateRecipe } from './create-recipe';

describe('CreateRecipe', () => {
  let component: CreateRecipe;
  let fixture: ComponentFixture<CreateRecipe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRecipe],
      providers: [
        provideRouter([]),
        provideToastr(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRecipe);
    component = fixture.componentInstance;
  });

  it('should have an invalid form when required fields are empty', () => {
    component.recipeForm.reset({
      title: '',
      ingredients: '',
      steps: '',
      category: 'Other'
    });

    expect(component.recipeForm.invalid).toBe(true);
  });

  it('should have a valid form when required fields are filled', () => {
    component.recipeForm.setValue({
      title: 'Paneer Recipe',
      ingredients: 'Paneer\nTomato',
      steps: 'Cut paneer\nCook ingredients',
      category: 'Other'
    });

    expect(component.recipeForm.valid).toBe(true);
  });
});