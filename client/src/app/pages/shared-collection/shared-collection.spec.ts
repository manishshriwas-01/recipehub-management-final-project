import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SharedCollection } from './shared-collection';
import { CollectionService } from '../../services/collection-service';
import { RecipeService } from '../../services/recipe.service';

describe('SharedCollection', () => {
  let component: SharedCollection;
  let fixture: ComponentFixture<SharedCollection>;

  let collectionServiceMock: {
    getSharedCollection: ReturnType<typeof vi.fn>;
  };

  let recipeServiceMock: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    collectionServiceMock = {
      getSharedCollection: vi.fn().mockReturnValue(
        of({
          success: true,
          collection: {
            _id: 'collection-1',
            name: 'My Favorite Recipes',
            recipes: [],
          },
        })
      ),
    };

    recipeServiceMock = {};

    await TestBed.configureTestingModule({
      imports: [SharedCollection],

      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('share-token-123'),
              },
            },
          },
        },

        {
          provide: CollectionService,
          useValue: collectionServiceMock,
        },

        {
          provide: RecipeService,
          useValue: recipeServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedCollection);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the shared collection using the share token', () => {
    expect(
      collectionServiceMock.getSharedCollection
    ).toHaveBeenCalledWith('share-token-123');

    expect(component.collection()).toEqual({
      _id: 'collection-1',
      name: 'My Favorite Recipes',
      recipes: [],
    });

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });
});