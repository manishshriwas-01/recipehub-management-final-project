import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Recipes } from './recipes';
import { RecipeService } from '../../services/recipe.service';
import { VoiceRecognitionService } from '../../services/voice-recognition-service';

describe('Recipes', () => {
  let component: Recipes;
  let fixture: ComponentFixture<Recipes>;

  let transcriptSubject: Subject<string>;
  let errorSubject: Subject<string>;
  let endSubject: Subject<void>;

  let voiceRecognitionServiceMock: {
    transcript$: ReturnType<Subject<string>['asObservable']>;
    error$: ReturnType<Subject<string>['asObservable']>;
    end$: ReturnType<Subject<void>['asObservable']>;
    startListening: ReturnType<typeof vi.fn>;
    stopListening: ReturnType<typeof vi.fn>;
  };

  let recipeServiceMock: {
    getRecipes: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    transcriptSubject = new Subject<string>();
    errorSubject = new Subject<string>();
    endSubject = new Subject<void>();

    voiceRecognitionServiceMock = {
      transcript$: transcriptSubject.asObservable(),
      error$: errorSubject.asObservable(),
      end$: endSubject.asObservable(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
    };

    recipeServiceMock = {
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
    };

    await TestBed.configureTestingModule({
      imports: [Recipes],
      providers: [
        provideRouter([]),
        {
          provide: RecipeService,
          useValue: recipeServiceMock,
        },
        {
          provide: VoiceRecognitionService,
          useValue: voiceRecognitionServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Recipes);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});