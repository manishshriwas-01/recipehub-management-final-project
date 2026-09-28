import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  helpfulBy: string[];
  createdAt: string;
  user: {
    _id: string;
    name: string;
  };
}

export interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reviews`;

  getReviewsByRecipe(
    recipeId: string,
    sort: string = 'newest'
  ): Observable<ReviewsResponse> {
    return this.http.get<ReviewsResponse>(
      `${this.apiUrl}/${recipeId}?sort=${sort}`
    );
  }

  createReview(data: {
    recipeId: string;
    rating: number;
    comment: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      this.apiUrl,
      data
    );
  }

  deleteReview(reviewId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${reviewId}`
    );
  }


  toggleHelpfulReview(
  reviewId: string
): Observable<{
  success: boolean;
  message: string;
  helpful: boolean;
  helpfulCount: number;
}> {
  return this.http.post<{
    success: boolean;
    message: string;
    helpful: boolean;
    helpfulCount: number;
  }>(`${this.apiUrl}/${reviewId}/helpful`, {});
}

}