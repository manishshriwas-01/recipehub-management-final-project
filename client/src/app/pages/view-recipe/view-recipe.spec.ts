import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { ViewRecipe } from './view-recipe';

import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service/auth.service';
import { ReviewService } from '../../services/review-service';
import { ToxicityService } from '../../services/toxicity';
import { SentimentService } from '../../services/sentiment';
import { RecipeSimilarityService } from '../../services/recipe-similarity.service.ts';
import { CookModeService } from '../../services/cook-mode-service';

import {
  ActivatedRoute,
  convertToParamMap,
} from '@angular/router';

import { ToastrService } from 'ngx-toastr';

describe('ViewRecipe', () => {
  let component: ViewRecipe;
  let fixture: ComponentFixture<ViewRecipe>;

  let recipeServiceMock: {
    getRecipe: ReturnType<typeof vi.fn>;
    getRecipes: ReturnType<typeof vi.fn>;
    getImageUrl: ReturnType<typeof vi.fn>;
    addFavorite: ReturnType<typeof vi.fn>;
    removeFavorite: ReturnType<typeof vi.fn>;
  };

  let reviewServiceMock: {
    getReviewsByRecipe: ReturnType<typeof vi.fn>;
    createReview: ReturnType<typeof vi.fn>;
    deleteReview: ReturnType<typeof vi.fn>;
    toggleHelpfulReview: ReturnType<typeof vi.fn>;
  };

  let authServiceMock: {
    user: ReturnType<typeof signal>;
    isLoggedIn: ReturnType<typeof vi.fn>;
  };

  let toxicityServiceMock: {
    isToxic: ReturnType<typeof vi.fn>;
  };

  let sentimentServiceMock: {
    analyzeSentiment: ReturnType<typeof vi.fn>;
  };

  let recipeSimilarityServiceMock: {
    generateEmbedding: ReturnType<typeof vi.fn>;
  };

  let cookModeServiceMock: {
    speak: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
  };

  let toastrServiceMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    recipeServiceMock = {
      getRecipe: vi.fn().mockReturnValue(
        of({
          success: true,
          recipe: {
            _id: 'recipe-1',
            title: 'Paneer Curry',
            ingredients: ['200g paneer', '2 tomatoes'],
            steps: ['Cut paneer', 'Cook the curry'],
            category: 'Indian',
            servings: 2,
          },
          averageRating: 4.5,
          reviewCount: 2,
        })
      ),

      getRecipes: vi.fn().mockReturnValue(
        of({
          success: true,
          recipes: [],
          count: 0,
          total: 0,
          page: 1,
          pages: 0,
        })
      ),

      getImageUrl: vi.fn().mockReturnValue(
        'https://example.com/recipe.jpg'
      ),

      addFavorite: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Recipe added to favorites!',
        })
      ),

      removeFavorite: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Recipe removed from favorites!',
        })
      ),
    };

    reviewServiceMock = {
      getReviewsByRecipe: vi.fn().mockReturnValue(
        of({
          reviews: [],
          averageRating: 0,
          reviewCount: 0,
        })
      ),

      createReview: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Review added successfully',
        })
      ),

      deleteReview: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Review deleted successfully',
        })
      ),

      toggleHelpfulReview: vi.fn().mockReturnValue(
        of({
          success: true,
          helpful: true,
        })
      ),
    };

    authServiceMock = {
      user: signal(null),
      isLoggedIn: vi.fn().mockReturnValue(false),
    };

    toxicityServiceMock = {
      isToxic: vi.fn().mockResolvedValue(false),
    };

    sentimentServiceMock = {
      analyzeSentiment: vi.fn().mockResolvedValue('positive'),
    };

    recipeSimilarityServiceMock = {
      generateEmbedding: vi.fn().mockResolvedValue([
        0.1,
        0.2,
        0.3,
        0.4,
      ]),
    };

    cookModeServiceMock = {
      speak: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    };

    toastrServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ViewRecipe],

      providers: [
        provideRouter([]),

        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({
                id: 'recipe-1',
              })
            ),
          },
        },

        {
          provide: RecipeService,
          useValue: recipeServiceMock,
        },

        {
          provide: AuthService,
          useValue: authServiceMock,
        },

        {
          provide: ReviewService,
          useValue: reviewServiceMock,
        },

        {
          provide: ToxicityService,
          useValue: toxicityServiceMock,
        },

        {
          provide: SentimentService,
          useValue: sentimentServiceMock,
        },

        {
          provide: RecipeSimilarityService,
          useValue: recipeSimilarityServiceMock,
        },

        {
          provide: CookModeService,
          useValue: cookModeServiceMock,
        },

        {
          provide: ToastrService,
          useValue: toastrServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewRecipe);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});