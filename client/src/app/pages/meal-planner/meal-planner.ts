import { Component, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

import { MealPlanService } from '../../services/meal-service';
import { RecipeService } from '../../services/recipe.service';
import {
  ShoppingItem,
  ShoppingListService,
} from '../../services/shopping-service';


type MealType = 'breakfast' | 'lunch' | 'dinner';

interface PlannerDay {
  date: Date;
  dayName: string;
  dayNumber: number;
}

interface Recipe {
  _id: string;
  title: string;
  imageUrl?: string;
}

interface MealPlan {
  _id: string;
  recipe: Recipe;
  date: string;
  mealType: MealType;
}

@Component({
  selector: 'app-meal-planner',
  imports: [TitleCasePipe],
  templateUrl: './meal-planner.html',
  styleUrl: './meal-planner.css',
})
export class MealPlanner {
  private mealPlanService = inject(MealPlanService);
  private recipeService = inject(RecipeService);
  private shoppingListService = inject(ShoppingListService);

  days = signal<PlannerDay[]>([]);
  recipes = signal<Recipe[]>([]);
  mealPlans = signal<MealPlan[]>([]);
  shoppingList = signal<ShoppingItem[]>([]);

  selectedDate = signal<PlannerDay | null>(null);
  selectedMealType = signal<MealType | null>(null);

  editingMealPlan = signal<MealPlan | null>(null);

  mealTypes: MealType[] = [
    'breakfast',
    'lunch',
    'dinner',
  ];

  constructor() {
    this.generateWeek();
    this.loadMealPlans();
    this.loadRecipes();
    this.loadShoppingList();
  }

  generateWeek(): void {
    const today = new Date();

    const day = today.getDay();

    const monday = new Date(today);

    const difference = day === 0 ? -6 : 1 - day;

    monday.setDate(today.getDate() + difference);

    const week: PlannerDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);

      date.setDate(monday.getDate() + i);

      week.push({
        date,
        dayName: date.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        dayNumber: date.getDate(),
      });
    }

    this.days.set(week);
  }

  loadRecipes(): void {
    this.recipeService.getRecipes().subscribe({
      next: (response: any) => {
        this.recipes.set(response.recipes || []);
      },
      error: (error) => {
        console.error(
          error.error?.message || 'Failed to load recipes'
        );
      },
    });
  }

  loadMealPlans(): void {
    const week = this.days();

    if (week.length === 0) {
      return;
    }

    const startDate = this.formatDate(week[0].date);
    const endDate = this.formatDate(
      week[week.length - 1].date
    );

    this.mealPlanService
      .getMealPlans(startDate, endDate)
      .subscribe({
        next: (response: any) => {
          this.mealPlans.set(response.mealPlans || []);
        },
        error: (error) => {
          console.error(
            error.error?.message ||
            'Failed to load meal plans'
          );
        },
      });
  }

  selectMealSlot(
    day: PlannerDay,
    mealType: MealType
  ): void {
    const existingMeal = this.getMealPlan(
      day,
      mealType
    );

    this.selectedDate.set(day);
    this.selectedMealType.set(mealType);

    this.editingMealPlan.set(existingMeal ?? null);
  }

  getMealPlan(
    day: PlannerDay,
    mealType: MealType
  ): MealPlan | undefined {
    const date = this.formatDate(day.date);

    return this.mealPlans().find(
      (meal) =>
        this.formatDate(new Date(meal.date)) === date &&
        meal.mealType === mealType
    );
  }

  addRecipeToMeal(recipe: Recipe): void {
    const day = this.selectedDate();
    const mealType = this.selectedMealType();

    if (!day || !mealType) {
      return;
    }

    const existingMeal = this.editingMealPlan();

    if (existingMeal) {
      this.updateMeal(existingMeal._id, recipe._id);
      return;
    }

    const date = this.formatDate(day.date);

    this.mealPlanService
      .createMealPlan({
        recipe: recipe._id,
        date,
        mealType,
      })
      .subscribe({
        next: () => {
          this.closeRecipeModal();
          this.loadMealPlans();
        },
        error: (error) => {
          console.error(
            error.error?.message ||
            'Failed to add meal'
          );
        },
      });
  }

  clearCheckedItems(): void {
  this.shoppingList.update((items) => {
    const remainingItems = items.filter(
      (item) => !item.checked
    );

    this.saveCheckedItems(remainingItems);

    return remainingItems;
  });
}

  updateMeal(
    mealPlanId: string,
    recipeId: string
  ): void {
    this.mealPlanService
      .updateMealPlan(mealPlanId, {
        recipe: recipeId,
      })
      .subscribe({
        next: () => {
          this.closeRecipeModal();
          this.loadMealPlans();
        },
        error: (error) => {
          console.error(
            error.error?.message ||
            'Failed to update meal'
          );
        },
      });
  }

  deleteMeal(mealPlan: MealPlan): void {
    this.mealPlanService
      .deleteMealPlan(mealPlan._id)
      .subscribe({
        next: () => {
          this.closeRecipeModal();
          this.loadMealPlans();
        },
        error: (error) => {
          console.error(
            error.error?.message ||
            'Failed to delete meal'
          );
        },
      });
  }

  closeRecipeModal(): void {
    this.selectedDate.set(null);
    this.selectedMealType.set(null);
    this.editingMealPlan.set(null);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadShoppingList(): void {
  const week = this.days();

  if (week.length === 0) {
    return;
  }

  const startDate = this.formatDate(week[0].date);
  const endDate = this.formatDate(
    week[week.length - 1].date
  );

  console.log('Shopping dates:', startDate, endDate);

  this.shoppingListService
    .getShoppingList(startDate, endDate)
    .subscribe({
      next: (response) => {
        console.log('Shopping API response:', response);

        const items = response.shoppingList.map((item) => ({
          ...item,
          checked: false,
        }));

        this.shoppingList.set(
          this.restoreCheckedItems(items)
        );
      },

      error: (error) => {
        console.error(
          'Shopping API error:',
          error
        );
      },
    });
}
  toggleShoppingItem(index: number): void {
    this.shoppingList.update((items) => {
      const updatedItems = items.map((item, i) =>
        i === index
          ? {
            ...item,
            checked: !item.checked,
          }
          : item
      );

      this.saveCheckedItems(updatedItems);

      return updatedItems;
    });
  }
  printShoppingList(): void {
  window.print();
}
  private saveCheckedItems(items: ShoppingItem[]): void {
    const checkedItems = items
      .filter((item) => item.checked)
      .map((item) => item.ingredient);

    localStorage.setItem(
      'shopping-list-checked',
      JSON.stringify(checkedItems)
    );
  }
  private restoreCheckedItems(
    items: ShoppingItem[]
  ): ShoppingItem[] {
    const stored = localStorage.getItem(
      'shopping-list-checked'
    );

    if (!stored) {
      return items;
    }

    const checkedItems: string[] = JSON.parse(stored);

    return items.map((item) => ({
      ...item,
      checked: checkedItems.includes(item.ingredient),
    }));
  }
}



