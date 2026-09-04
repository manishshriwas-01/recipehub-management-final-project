import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'recipes',
    loadComponent: () =>
      import('./pages/recipes/recipes').then((m) => m.Recipes),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register').then((m) => m.Register),
  },
  // Protected routes
  {
    path: 'my-recipes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-recipes/my-recipes').then((m) => m.MyRecipes),
  },
  {
    path: 'create-recipe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/create-recipe/create-recipe').then(
        (m) => m.CreateRecipe
      ),
  },
  {
    path: 'edit-recipe/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/edit-recipe/edit-recipe').then(
        (m) => m.EditRecipe
      ),
  },
  {
  path: 'recipes/:id',
  loadComponent: () =>
    import('./pages/view-recipe/view-recipe').then(
      (m) => m.ViewRecipe
    ),
},
  // Admin only
  {
    path: 'manage-recipes',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/manage-recipes/manage-recipes').then(
        (m) => m.ManageRecipes
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];