import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';

import { MyRecipes } from './my-recipes';
import { RecipeService } from '../../services/recipe.service';

describe('MyRecipes', () => {
  let component: MyRecipes;
  let fixture: ComponentFixture<MyRecipes>;

  beforeEach(async () => {
    const recipeServiceMock = {
      getMyRecipes: () =>
        of({
          success: true,
          recipes: [],
        }),
    };

    await TestBed.configureTestingModule({
      imports: [MyRecipes],
      providers: [
        provideRouter([]),
        provideToastr(),
        {
          provide: RecipeService,
          useValue: recipeServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyRecipes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});