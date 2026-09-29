import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';
import { CollectionService } from '../../services/collection-service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites {
  private toastr = inject(ToastrService);
  recipeService = inject(RecipeService);
  private collectionService = inject(CollectionService);

  favorites = signal<Recipe[]>([]);
  collections = signal<any[]>([]);

  loading = signal(true);
  collectionsLoading = signal(true);

  errorMessage = signal('');
  collectionsError = signal('');

  showCollectionForm = signal(false);
  collectionName = signal('');
  collectionImage = signal<File | null>(null);
  collectionImagePreview = signal('');

  showCollectionSelector = signal(false);
  selectedRecipe = signal<Recipe | null>(null);
  selectedCollectionId = signal('');

  selectedCollection = signal<any | null>(null);

  currentCollectionPage = signal(1);
  collectionTotalPages = signal(1);

  constructor() {
    this.loadFavorites();
    this.loadCollections();
  }

  private loadFavorites() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.recipeService.getFavorites().subscribe({
      next: (response) => {
        this.favorites.set(response.recipes || []);
        this.loading.set(false);
      },
      error: (error: any) => {
        this.errorMessage.set(
          error.error?.message || 'Failed to load favorites'
        );
        this.loading.set(false);
      },
    });
  }

  private loadCollections(page = 1) {
    this.collectionsLoading.set(true);
    this.collectionsError.set('');

    this.collectionService.getMyCollections(page, 6).subscribe({
      next: (response) => {
        this.collections.set(response.collections || []);
        this.currentCollectionPage.set(response.pagination?.page || page);
        this.collectionTotalPages.set(
          response.pagination?.totalPages || 1
        );
        this.collectionsLoading.set(false);
      },
      error: (error: any) => {
        this.collectionsError.set(
          error.error?.message || 'Failed to load collections'
        );
        this.collectionsLoading.set(false);
      },
    });
  }

  removeFavorite(recipeId: string) {
    this.recipeService.removeFavorite(recipeId).subscribe({
      next: () => {
        this.favorites.update((recipes) =>
          recipes.filter((recipe) => recipe._id !== recipeId)
        );

        this.toastr.success('Recipe removed from favorites');
      },
      error: (error: any) => {
        this.toastr.error(
          error.error?.message || 'Failed to remove recipe'
        );
      },
    });
  }

  openCollectionForm() {
    this.collectionName.set('');
    this.collectionImage.set(null);
    this.collectionImagePreview.set('');
    this.showCollectionForm.set(true);
  }

  closeCollectionForm() {
    this.showCollectionForm.set(false);
    this.collectionName.set('');
    this.collectionImage.set(null);
    this.collectionImagePreview.set('');
  }

  onCollectionImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.collectionImage.set(file);
    this.collectionImagePreview.set(URL.createObjectURL(file));
  }

  createCollection() {
    const name = this.collectionName().trim();

    if (name.length < 2) {
      this.toastr.error('Collection name must be at least 2 characters');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);

    const image = this.collectionImage();

    if (image) {
      formData.append('coverImage', image);
    }

    this.collectionService.createCollection(formData).subscribe({
      next: () => {
        this.toastr.success('Collection created successfully');
        this.closeCollectionForm();
        this.loadCollections(1);
      },
      error: (error: any) => {
        this.toastr.error(
          error.error?.message || 'Failed to create collection'
        );
      },
    });
  }

  deleteCollection(id: string) {
    if (!confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    this.collectionService.deleteCollection(id).subscribe({
      next: () => {
        this.toastr.success('Collection deleted successfully');

        const currentPage = this.currentCollectionPage();

        this.loadCollections(
          currentPage > 1 && this.collections().length === 1
            ? currentPage - 1
            : currentPage
        );
      },
      error: (error: any) => {
        this.toastr.error(
          error.error?.message || 'Failed to delete collection'
        );
      },
    });
  }

  openCollectionSelector(recipe: Recipe) {
    this.selectedRecipe.set(recipe);
    this.selectedCollectionId.set('');
    this.showCollectionSelector.set(true);
  }

  closeCollectionSelector() {
    this.showCollectionSelector.set(false);
    this.selectedRecipe.set(null);
    this.selectedCollectionId.set('');
  }

  addRecipeToCollection() {
    const recipe = this.selectedRecipe();
    const collectionId = this.selectedCollectionId();

    if (!recipe || !collectionId) {
      return;
    }

    this.collectionService
      .addRecipeToCollection(collectionId, recipe._id)
      .subscribe({
        next: () => {
          this.toastr.success('Recipe added to collection');
          this.closeCollectionSelector();
          this.loadCollections(this.currentCollectionPage());
        },
        error: (error: any) => {
          this.toastr.error(
            error.error?.message || 'Failed to add recipe'
          );
        },
      });
  }

  openCollection(collection: any) {
    this.selectedCollection.set(collection);
  }

  closeCollection() {
    this.selectedCollection.set(null);
  }

  removeRecipeFromCollection(collectionId: string, recipeId: string) {
    this.collectionService
      .removeRecipeFromCollection(collectionId, recipeId)
      .subscribe({
        next: () => {
          const collection = this.selectedCollection();

          if (collection) {
            collection.recipes = collection.recipes.filter(
              (recipe: Recipe) => recipe._id !== recipeId
            );

            this.selectedCollection.set({ ...collection });
          }

          this.toastr.success('Recipe removed from collection');
          this.loadCollections(this.currentCollectionPage());
        },
        error: (error: any) => {
          this.toastr.error(
            error.error?.message || 'Failed to remove recipe'
          );
        },
      });
  }

  shareCollection(collection: any) {
    this.collectionService.shareCollection(collection._id).subscribe({
      next: (response: any) => {
        collection.isPublic = true;

        if (response.shareUrl) {
          collection.shareUrl = response.shareUrl;

          navigator.clipboard
            .writeText(response.shareUrl)
            .then(() => {
              this.toastr.success('Collection link copied');
            })
            .catch(() => {
              this.toastr.success('Collection shared successfully');
            });
        } else {
          this.toastr.success('Collection shared successfully');
        }

        this.collections.update((collections) => [...collections]);
      },
      error: (error: any) => {
        this.toastr.error(
          error.error?.message || 'Failed to share collection'
        );
      },
    });
  }

  unshareCollection(collection: any) {
    this.collectionService.unshareCollection(collection._id).subscribe({
      next: () => {
        collection.isPublic = false;
        collection.shareToken = undefined;
        collection.shareUrl = undefined;

        this.collections.update((collections) => [...collections]);

        this.toastr.success('Collection sharing disabled');
      },
      error: (error: any) => {
        this.toastr.error(
          error.error?.message || 'Failed to disable sharing'
        );
      },
    });
  }

  nextCollectionPage() {
    const nextPage = this.currentCollectionPage() + 1;

    if (nextPage <= this.collectionTotalPages()) {
      this.loadCollections(nextPage);
    }
  }

  previousCollectionPage() {
    const previousPage = this.currentCollectionPage() - 1;

    if (previousPage >= 1) {
      this.loadCollections(previousPage);
    }
  }
}