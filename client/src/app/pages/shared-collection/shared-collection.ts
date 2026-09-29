import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CollectionService } from '../../services/collection-service';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-shared-collection',
  imports: [],
  templateUrl: './shared-collection.html',
  styleUrl: './shared-collection.css',
})
export class SharedCollection {
  private route = inject(ActivatedRoute);
  private collectionService = inject(CollectionService);
  recipeService = inject(RecipeService);

  collection = signal<any | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  constructor() {
    this.loadCollection();
  }

  private loadCollection() {
    const shareToken = this.route.snapshot.paramMap.get('shareToken');

    if (!shareToken) {
      this.errorMessage.set('Invalid collection link');
      this.loading.set(false);
      return;
    }

    this.collectionService.getSharedCollection(shareToken).subscribe({
      next: (response: any) => {
        this.collection.set(response.collection);
        this.loading.set(false);
      },
      error: (error: any) => {
        this.errorMessage.set(
          error.error?.message || 'Collection not found'
        );
        this.loading.set(false);
      },
    });
  }
}