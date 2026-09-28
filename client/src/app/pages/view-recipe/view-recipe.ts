import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, catchError, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Recipe } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service/auth.service';
import { Review, ReviewService } from '../../services/review-service';

@Component({
  selector: 'app-view-recipe',
  imports: [AsyncPipe, RouterLink, FormsModule],
  templateUrl: './view-recipe.html',
  styleUrl: './view-recipe.css',
})
export class ViewRecipe {
  private reviewService = inject(ReviewService);
  private route = inject(ActivatedRoute);
  recipeService = inject(RecipeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);

  selectedRating = signal(0);
  reviewComment = signal('');
  reviewSubmitting = signal(false);

  user = this.authService.user;

  reviews = signal<Review[]>([]);
  reviewsLoading = signal(false);
  reviewsError = signal('');

  reviewSort = signal('newest');
  averageRating = signal(0);
  reviewCount = signal(0);

   Math = Math;

  helpfulLoading = signal<string | null>(null);

  isFavorite = signal(false);
  isFavoriteLoading = signal(false);

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  errorMessage = signal('');

  recipeId = '';

  recipe$: Observable<{
    success: boolean;
    recipe: Recipe;
    averageRating: number;
    reviewCount: number;
  } | null> =
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.recipeId = params.get('id')!;

        this.errorMessage.set('');
        this.loadReviews();

        return this.recipeService.getRecipe(this.recipeId).pipe(
          catchError(() => {
            this.errorMessage.set('Recipe not found');
            return of(null);
          })
        );
      })
    );

  loadReviews(): void {
    if (!this.recipeId) return;

    this.reviewsLoading.set(true);
    this.reviewsError.set('');

    this.reviewService
      .getReviewsByRecipe(this.recipeId, this.reviewSort())
      .subscribe({
        next: (response) => {
          this.reviews.set(response.reviews);
          this.averageRating.set(response.averageRating);
          this.reviewCount.set(response.reviewCount);
          this.reviewsLoading.set(false);
        },

        error: () => {
          this.reviewsError.set('Unable to load reviews');
          this.reviewsLoading.set(false);
        },
      });
  }

  toggleFavorite(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isFavoriteLoading()) {
      return;
    }

    this.isFavoriteLoading.set(true);

    if (this.isFavorite()) {
      this.recipeService.removeFavorite(this.recipeId).subscribe({
        next: (response) => {
          this.isFavorite.set(false);
          this.isFavoriteLoading.set(false);

          this.toastr.success(
            response.message || 'Recipe removed from favorites!'
          );
        },

        error: () => {
          this.isFavoriteLoading.set(false);
        },
      });
    } else {
      this.recipeService.addFavorite(this.recipeId).subscribe({
        next: (response) => {
          this.isFavorite.set(true);
          this.isFavoriteLoading.set(false);

          this.toastr.success(
            response.message || 'Recipe added to favorites!'
          );
        },

        error: () => {
          this.isFavoriteLoading.set(false);
        },
      });
    }
  }

  learnRecipe(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: `/book-appointment/${this.recipeId}`,
        },
      });

      return;
    }

    this.router.navigate(['/book-appointment', this.recipeId]);
  }

  submitReview(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.selectedRating() === 0) {
      this.toastr.error('Please select a rating');
      return;
    }

    if (this.reviewComment().trim().length < 3) {
      this.toastr.error('Review must be at least 3 characters');
      return;
    }

    if (this.reviewSubmitting()) return;

    this.reviewSubmitting.set(true);

    this.reviewService
      .createReview({
        recipeId: this.recipeId,
        rating: this.selectedRating(),
        comment: this.reviewComment().trim(),
      })
      .subscribe({
        next: (response) => {
          this.toastr.success(
            response.message || 'Review added successfully'
          );

          this.reviewComment.set('');
          this.selectedRating.set(0);
          this.reviewSubmitting.set(false);

          this.loadReviews();
        },

        error: (error) => {
          this.toastr.error(
            error.error?.message || 'Unable to add review'
          );

          this.reviewSubmitting.set(false);
        },
      });
  }

  canDeleteReview(
    review: Review,
    recipeOwnerId: string | undefined
  ): boolean {
    const currentUser = this.user();

    if (!currentUser) {
      return false;
    }

    // Admin can delete any review
    if (currentUser.role === 'admin') {
      return true;
    }

    // Review creator can delete their own review
    if (String(currentUser.id) === String(review.user._id)) {
      return true;
    }

    // Recipe owner can delete reviews on their recipe
    if (
      recipeOwnerId &&
      String(currentUser.id) === String(recipeOwnerId)
    ) {
      return true;
    }

    return false;
  }

  deleteReview(reviewId: string): void {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    this.reviewService.deleteReview(reviewId).subscribe({
      next: (response) => {
        this.toastr.success(
          response.message || 'Review deleted successfully'
        );

        this.loadReviews();
      },

      error: (error) => {
        this.toastr.error(
          error.error?.message || 'Unable to delete review'
        );
      },
    });
  }

  toggleHelpfulReview(review: Review): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.helpfulLoading()) return;

    this.helpfulLoading.set(review._id);

    this.reviewService.toggleHelpfulReview(review._id).subscribe({
      next: (response) => {
        review.helpfulBy = response.helpful
          ? [...review.helpfulBy, this.user()?.id || '']
          : review.helpfulBy.filter(
            userId => String(userId) !== String(this.user()?.id)
          );

        this.helpfulLoading.set(null);
      },

      error: (error) => {
        this.toastr.error(
          error.error?.message || 'Unable to update helpful vote'
        );

        this.helpfulLoading.set(null);
      },
    });
  }

  changeReviewSort(sort: string): void {
    this.reviewSort.set(sort);
    this.loadReviews();
  }
}