import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/collections`;

  getMyCollections(page = 1, limit = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get<any>(this.apiUrl, { params });
  }

  createCollection(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  deleteCollection(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  addRecipeToCollection(
    collectionId: string,
    recipeId: string
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${collectionId}/recipes/${recipeId}`,
      {}
    );
  }

  removeRecipeFromCollection(
    collectionId: string,
    recipeId: string
  ): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${collectionId}/recipes/${recipeId}`
    );
  }
  shareCollection(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/share`, {});
  }

  unshareCollection(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/share`);
  }

  getSharedCollection(shareToken: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/shared/${shareToken}`);
  }
}