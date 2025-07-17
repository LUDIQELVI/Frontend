import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CategorieCredit, FrAss } from '../models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private rootUrl = 'https://backendsimteg-production.up.railway.app/api/categorieCredit';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategorieCredit[]> {
    return this.http.get<CategorieCredit[]>(`${this.rootUrl}/list`).pipe(
      map(response => response || []),
      catchError(this.handleError)
    );
  }

  getCategoryById(id: number): Observable<CategorieCredit> {
    return this.http.get<CategorieCredit>(`${this.rootUrl}/recuperer/${id}`).pipe(
      map(response => {
        if (!response) {
          throw new Error(`Catégorie avec ID ${id} non trouvée`);
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  getFrAss(id: number): Observable<FrAss> {
    return this.http.get<FrAss>(`${this.rootUrl}/listDesChamp/${id}`).pipe(
      map(response => {
        if (!response) {
          throw new Error(`Frais et assurances pour ID ${id} non trouvés`);
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  createCategory(category: CategorieCredit): Observable<CategorieCredit> {
    return this.http.post<CategorieCredit>(`${this.rootUrl}/creer`, category).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  updateCategory(id: number, category: CategorieCredit): Observable<CategorieCredit> {
    return this.http.put<CategorieCredit>(`${this.rootUrl}/update/${id}`, category).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Service Error:', error);
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else if (error.error?.message) {
      errorMessage = `Erreur du serveur: ${error.error.message}`;
    } else if (error.status) {
      errorMessage = `Erreur serveur: ${error.status} - ${error.statusText || 'Inconnu'}`;
    } else {
      errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion ou l\'état du serveur.';
    }
    return throwError(() => new Error(errorMessage));
  }
}