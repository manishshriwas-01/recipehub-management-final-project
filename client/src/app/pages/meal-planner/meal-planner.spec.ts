import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { vi } from 'vitest';

import { MealPlanner } from './meal-planner';

import { MealPlanService } from '../../services/meal-service';

import { RecipeService } from '../../services/recipe.service';

import { ShoppingListService } from '../../services/shopping-service';

describe('MealPlanner', () => {
  let component: MealPlanner;
  let fixture: ComponentFixture<MealPlanner>;

  let mealPlanServiceMock: {
    getMealPlans: ReturnType<typeof vi.fn>;
    createMealPlan: ReturnType<typeof vi.fn>;
    updateMealPlan: ReturnType<typeof vi.fn>;
    deleteMealPlan: ReturnType<typeof vi.fn>;
  };

  let recipeServiceMock: {
    getRecipes: ReturnType<typeof vi.fn>;
  };

  let shoppingListServiceMock: {
    getShoppingList: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mealPlanServiceMock = {
      getMealPlans: vi.fn().mockReturnValue(
        of({ mealPlans: [] })
      ),
      createMealPlan: vi.fn().mockReturnValue(of({})),
      updateMealPlan: vi.fn().mockReturnValue(of({})),
      deleteMealPlan: vi.fn().mockReturnValue(of({})),
    };

    recipeServiceMock = {
      getRecipes: vi.fn().mockReturnValue(
        of({ recipes: [] })
      ),
    };

    shoppingListServiceMock = {
      getShoppingList: vi.fn().mockReturnValue(
        of({ shoppingList: [] })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [MealPlanner],
      providers: [
        {
          provide: MealPlanService,
          useValue: mealPlanServiceMock,
        },
        {
          provide: RecipeService,
          useValue: recipeServiceMock,
        },
        {
          provide: ShoppingListService,
          useValue: shoppingListServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MealPlanner);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // ==================================================
  // Component
  // ==================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==================================================
  // generateWeek()
  // ==================================================

  it('should generate 7 days for the current week', () => {
    expect(component.days().length).toBe(7);
  });

  it('should generate valid planner days', () => {
    const days = component.days();

    expect(days.length).toBe(7);
    expect(days[0].date).toBeInstanceOf(Date);
    expect(days[0].dayName).toBeTruthy();
    expect(days[0].dayNumber).toBeTruthy();
  });

  // ==================================================
  // formatDate()
  // ==================================================

  it('should format date as YYYY-MM-DD', () => {
    const date = new Date(2026, 9, 5);

    expect(component.formatDate(date)).toBe(
      '2026-10-05'
    );
  });

  it('should add leading zeros to month and day', () => {
    const date = new Date(2026, 0, 5);

    expect(component.formatDate(date)).toBe(
      '2026-01-05'
    );
  });

  // ==================================================
  // loadRecipes()
  // ==================================================

  it('should load recipes successfully', () => {
    const recipes = [
      {
        _id: 'recipe-1',
        title: 'Poha',
        imageUrl: 'poha.jpg',
      },
      {
        _id: 'recipe-2',
        title: 'Pasta',
        imageUrl: 'pasta.jpg',
      },
    ];

    recipeServiceMock.getRecipes.mockReturnValue(
      of({ recipes })
    );

    component.loadRecipes();

    expect(
      recipeServiceMock.getRecipes
    ).toHaveBeenCalled();

    expect(component.recipes()).toEqual(recipes);
  });

  it('should set an empty recipe list when API returns no recipes', () => {
    recipeServiceMock.getRecipes.mockReturnValue(
      of({})
    );

    component.loadRecipes();

    expect(component.recipes()).toEqual([]);
  });

  // ==================================================
  // loadMealPlans()
  // ==================================================

  it('should load meal plans successfully', () => {
    const day = component.days()[0];

    const mealPlans = [
      {
        _id: 'meal-1',
        recipe: {
          _id: 'recipe-1',
          title: 'Poha',
        },
        date: component.formatDate(day.date),
        mealType: 'breakfast' as const,
      },
    ];

    mealPlanServiceMock.getMealPlans.mockReturnValue(
      of({ mealPlans })
    );

    component.loadMealPlans();

    expect(
      mealPlanServiceMock.getMealPlans
    ).toHaveBeenCalled();

    expect(component.mealPlans()).toEqual(mealPlans);
  });

  it('should not load meal plans when there are no days', () => {
    component.days.set([]);

    // Constructor already calls loadMealPlans(),
    // so clear the previous call before testing this method.
    mealPlanServiceMock.getMealPlans.mockClear();

    component.loadMealPlans();

    expect(
      mealPlanServiceMock.getMealPlans
    ).not.toHaveBeenCalled();
  });

  // ==================================================
  // getMealPlan()
  // ==================================================

  it('should return a matching meal plan', () => {
    const day = component.days()[0];

    const mealPlan = {
      _id: 'meal-1',
      recipe: {
        _id: 'recipe-1',
        title: 'Poha',
      },
      date: component.formatDate(day.date),
      mealType: 'breakfast' as const,
    };

    component.mealPlans.set([mealPlan]);

    const result = component.getMealPlan(
      day,
      'breakfast'
    );

    expect(result).toEqual(mealPlan);
  });

  it('should return undefined when no matching meal exists', () => {
    const day = component.days()[0];

    component.mealPlans.set([]);

    const result = component.getMealPlan(
      day,
      'breakfast'
    );

    expect(result).toBeUndefined();
  });

  // ==================================================
  // selectMealSlot()
  // ==================================================

  it('should select a meal slot', () => {
    const day = component.days()[0];

    component.selectMealSlot(
      day,
      'lunch'
    );

    expect(component.selectedDate()).toEqual(day);
    expect(component.selectedMealType()).toBe('lunch');
    expect(component.editingMealPlan()).toBeNull();
  });

  it('should select an existing meal for editing', () => {
    const day = component.days()[0];

    const mealPlan = {
      _id: 'meal-1',
      recipe: {
        _id: 'recipe-1',
        title: 'Poha',
      },
      date: component.formatDate(day.date),
      mealType: 'breakfast' as const,
    };

    component.mealPlans.set([mealPlan]);

    component.selectMealSlot(
      day,
      'breakfast'
    );

    expect(
      component.editingMealPlan()
    ).toEqual(mealPlan);
  });

  // ==================================================
  // addRecipeToMeal()
  // ==================================================

  it('should not create a meal when no slot is selected', () => {
    component.selectedDate.set(null);
    component.selectedMealType.set(null);

    component.addRecipeToMeal({
      _id: 'recipe-1',
      title: 'Poha',
    });

    expect(
      mealPlanServiceMock.createMealPlan
    ).not.toHaveBeenCalled();
  });

  it('should create a meal plan when adding a recipe', () => {
    const day = component.days()[0];

    component.selectedDate.set(day);
    component.selectedMealType.set('breakfast');
    component.editingMealPlan.set(null);

    const closeModalSpy = vi.spyOn(
      component,
      'closeRecipeModal'
    );

    const loadMealPlansSpy = vi.spyOn(
      component,
      'loadMealPlans'
    );

    const recipe = {
      _id: 'recipe-1',
      title: 'Poha',
    };

    component.addRecipeToMeal(recipe);

    expect(
      mealPlanServiceMock.createMealPlan
    ).toHaveBeenCalledWith({
      recipe: 'recipe-1',
      date: component.formatDate(day.date),
      mealType: 'breakfast',
    });

    expect(closeModalSpy).toHaveBeenCalled();
    expect(loadMealPlansSpy).toHaveBeenCalled();
  });

  it('should update an existing meal instead of creating a new one', () => {
    const existingMeal = {
      _id: 'meal-1',
      recipe: {
        _id: 'recipe-1',
        title: 'Poha',
      },
      date: '2026-10-05',
      mealType: 'breakfast' as const,
    };

    component.selectedDate.set(component.days()[0]);
    component.selectedMealType.set('breakfast');
    component.editingMealPlan.set(existingMeal);

    const updateMealSpy = vi.spyOn(
      component,
      'updateMeal'
    );

    component.addRecipeToMeal({
      _id: 'recipe-2',
      title: 'Pasta',
    });

    expect(updateMealSpy).toHaveBeenCalledWith(
      'meal-1',
      'recipe-2'
    );

    expect(
      mealPlanServiceMock.createMealPlan
    ).not.toHaveBeenCalled();
  });

  // ==================================================
  // updateMeal()
  // ==================================================

  it('should update an existing meal plan', () => {
    const closeModalSpy = vi.spyOn(
      component,
      'closeRecipeModal'
    );

    const loadMealPlansSpy = vi.spyOn(
      component,
      'loadMealPlans'
    );

    component.updateMeal(
      'meal-1',
      'recipe-2'
    );

    expect(
      mealPlanServiceMock.updateMealPlan
    ).toHaveBeenCalledWith(
      'meal-1',
      {
        recipe: 'recipe-2',
      }
    );

    expect(closeModalSpy).toHaveBeenCalled();
    expect(loadMealPlansSpy).toHaveBeenCalled();
  });

  // ==================================================
  // deleteMeal()
  // ==================================================

  it('should delete a meal plan', () => {
    const closeModalSpy = vi.spyOn(
      component,
      'closeRecipeModal'
    );

    const loadMealPlansSpy = vi.spyOn(
      component,
      'loadMealPlans'
    );

    const mealPlan = {
      _id: 'meal-1',
      recipe: {
        _id: 'recipe-1',
        title: 'Poha',
      },
      date: '2026-10-05',
      mealType: 'breakfast' as const,
    };

    component.deleteMeal(mealPlan);

    expect(
      mealPlanServiceMock.deleteMealPlan
    ).toHaveBeenCalledWith('meal-1');

    expect(closeModalSpy).toHaveBeenCalled();
    expect(loadMealPlansSpy).toHaveBeenCalled();
  });

  // ==================================================
  // closeRecipeModal()
  // ==================================================

  it('should close the recipe modal', () => {
    const day = component.days()[0];

    component.selectedDate.set(day);
    component.selectedMealType.set('lunch');

    component.editingMealPlan.set({
      _id: 'meal-1',
      recipe: {
        _id: 'recipe-1',
        title: 'Poha',
      },
      date: component.formatDate(day.date),
      mealType: 'lunch',
    });

    component.closeRecipeModal();

    expect(component.selectedDate()).toBeNull();
    expect(component.selectedMealType()).toBeNull();
    expect(component.editingMealPlan()).toBeNull();
  });

  // ==================================================
  // Shopping List
  // ==================================================

  it('should load shopping list successfully', () => {
    const shoppingList = [
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: false,
      },
      {
        ingredient: 'Onion',
        quantity: 1,
        checked: false,
      },
    ];

    shoppingListServiceMock.getShoppingList.mockReturnValue(
      of({ shoppingList })
    );

    component.loadShoppingList();

    expect(
      shoppingListServiceMock.getShoppingList
    ).toHaveBeenCalled();

    expect(component.shoppingList().length).toBe(2);

    expect(
      component.shoppingList()[0].ingredient
    ).toBe('Tomato');

    expect(
      component.shoppingList()[0].checked
    ).toBe(false);
  });

  it('should not load shopping list when there are no days', () => {
    component.days.set([]);

    // Constructor already calls loadShoppingList(),
    // so clear the previous call before testing this method.
    shoppingListServiceMock.getShoppingList.mockClear();

    component.loadShoppingList();

    expect(
      shoppingListServiceMock.getShoppingList
    ).not.toHaveBeenCalled();
  });

  // ==================================================
  // toggleShoppingItem()
  // ==================================================

  it('should check an unchecked shopping item', () => {
    component.shoppingList.set([
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: false,
      },
    ]);

    component.toggleShoppingItem(0);

    expect(
      component.shoppingList()[0].checked
    ).toBe(true);
  });

  it('should uncheck a checked shopping item', () => {
    component.shoppingList.set([
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: true,
      },
    ]);

    component.toggleShoppingItem(0);

    expect(
      component.shoppingList()[0].checked
    ).toBe(false);
  });

  // ==================================================
  // clearCheckedItems()
  // ==================================================

  it('should remove checked shopping items', () => {
    component.shoppingList.set([
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: true,
      },
      {
        ingredient: 'Onion',
        quantity: 1,
        checked: false,
      },
      {
        ingredient: 'Potato',
        quantity: 3,
        checked: true,
      },
    ]);

    component.clearCheckedItems();

    expect(component.shoppingList()).toEqual([
      {
        ingredient: 'Onion',
        quantity: 1,
        checked: false,
      },
    ]);
  });

  it('should remove all shopping items when all are checked', () => {
    component.shoppingList.set([
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: true,
      },
      {
        ingredient: 'Onion',
        quantity: 1,
        checked: true,
      },
    ]);

    component.clearCheckedItems();

    expect(component.shoppingList()).toEqual([]);
  });

  it('should keep unchecked items when clearing checked items', () => {
    component.shoppingList.set([
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: false,
      },
      {
        ingredient: 'Onion',
        quantity: 1,
        checked: true,
      },
    ]);

    component.clearCheckedItems();

    expect(component.shoppingList()).toEqual([
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: false,
      },
    ]);
  });

  // ==================================================
  // localStorage
  // ==================================================

  it('should save checked items to localStorage', () => {
    component.shoppingList.set([
      {
        ingredient: 'Tomato',
        quantity: 2,
        checked: false,
      },
      {
        ingredient: 'Onion',
        quantity: 1,
        checked: true,
      },
    ]);

    component.toggleShoppingItem(0);

    const stored = JSON.parse(
      localStorage.getItem(
        'shopping-list-checked'
      ) || '[]'
    );

    expect(stored).toContain('Tomato');
    expect(stored).toContain('Onion');
  });

  it('should restore checked items from localStorage', () => {
    localStorage.setItem(
      'shopping-list-checked',
      JSON.stringify(['Tomato'])
    );

    shoppingListServiceMock.getShoppingList.mockReturnValue(
      of({
        shoppingList: [
          {
            ingredient: 'Tomato',
            quantity: 2,
            checked: false,
          },
          {
            ingredient: 'Onion',
            quantity: 1,
            checked: false,
          },
        ],
      })
    );

    component.loadShoppingList();

    expect(
      component.shoppingList()[0].checked
    ).toBe(true);

    expect(
      component.shoppingList()[1].checked
    ).toBe(false);
  });

  // ==================================================
  // Error handling
  // ==================================================

  it('should handle recipe loading errors', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    recipeServiceMock.getRecipes.mockReturnValue(
      throwError(() => ({
        error: {
          message: 'Failed to load recipes',
        },
      }))
    );

    component.loadRecipes();

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle meal plan loading errors', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mealPlanServiceMock.getMealPlans.mockReturnValue(
      throwError(() => ({
        error: {
          message: 'Failed to load meal plans',
        },
      }))
    );

    component.loadMealPlans();

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle shopping list loading errors', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    shoppingListServiceMock.getShoppingList.mockReturnValue(
      throwError(() => ({
        message: 'Failed to load shopping list',
      }))
    );

    component.loadShoppingList();

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  // ==================================================
  // Print
  // ==================================================

  it('should call window.print()', () => {
    const printSpy = vi
      .spyOn(window, 'print')
      .mockImplementation(() => {});

    component.printShoppingList();

    expect(printSpy).toHaveBeenCalled();

    printSpy.mockRestore();
  });
});