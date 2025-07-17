import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TauxUsure, TauxUsureDto, HistoriqueTauxUsure } from '../models/taux-usure';

@Injectable({
  providedIn: 'root'
})
export class TauxUsureService {
  private rootUrl = 'http://localhost:3331/api/tauxUsure';

  constructor(private http: HttpClient) {}

  creerTauxUsure(body: TauxUsureDto): Observable<TauxUsure> {
    console.log('Sending TauxUsureDto to backend:', body); // Debug log
    return this.http.post<TauxUsure>(`${this.rootUrl}/creer`, body).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  deleteTauxUsure(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.rootUrl}/delete/${id}`).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  getDonneeStatistique(): Observable<{ [key: string]: { [key: string]: any[] } }> {
    return this.http.get<{ [key: string]: { [key: string]: any[] } }>(`${this.rootUrl}/donneStatistique`).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  getListeByCategorieId(idCategorie: number): Observable<TauxUsure[]> {
    return this.http.get<TauxUsure[]>(`${this.rootUrl}/listeParCategorie/${idCategorie}`).pipe(
      map(response => response || []),
      catchError(this.handleError)
    );
  }

  getHistoriqueMiseAJour(idTauxUsure: number): Observable<HistoriqueTauxUsure[]> {
    return this.http.get<HistoriqueTauxUsure[]>(`${this.rootUrl}/historiqueUpdate/${idTauxUsure}`).pipe(
      map(response => response || []),
      catchError(this.handleError)
    );
  }

  getTauxUsure(): Observable<TauxUsure[]> {
    return this.http.get<TauxUsure[]>(`${this.rootUrl}/listeTaux`).pipe(
      map(response => response || []),
      catchError(this.handleError)
    );
  }

  updateTauxUsure(id: number, body: TauxUsureDto): Observable<TauxUsure> {
    return this.http.put<TauxUsure>(`${this.rootUrl}/update/${id}`, body).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('TauxUsureService Error:', error);
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else if (error.error?.message) {
      errorMessage = `Erreur du serveur: ${error.error.message}`;
    } else if (error.status) {
      errorMessage = `Erreur serveur: ${error.status} - ${error.statusText || 'Inconnu'}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}