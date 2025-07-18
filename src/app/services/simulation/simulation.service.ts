import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { AuthServiceService } from '../auth/auth-service.service';
import { NotificationService } from '../notification.service';
import { TauxUsure } from '../../models/taux-usure';
import {
  Simulation,
  SimulationDtoRequest,
  SimulationRequestGlobal
} from '../../models/simulation.models';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly rootUrl = 'https://backendsimteg-production.up.railway.app';
  private simulationCreatedSubject = new Subject<Simulation>();
  simulationCreated$ = this.simulationCreatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthServiceService,
    private notificationService: NotificationService // Ajout
  ) {}

  getUserSimulations(userId: number): Observable<Simulation[]> {
    if (!userId) {
      return throwError(() => new Error('ID utilisateur manquant.'));
    }
    const headers = this.auth.getAuthHeaders();
    return this.http.get<Simulation[]>(`${this.rootUrl}/simulationUser/${userId}`, { headers }).pipe(
      catchError((error) => this.handleError(error, 'Erreur lors de la récupération des simulations.'))
    );
  }

  calculer(dto: SimulationDtoRequest): Observable<Simulation> {
    const headers = this.auth.getAuthHeaders();
    const hasDeblocages = Array.isArray(dto.tableauDeblocages) && dto.tableauDeblocages.length > 0;

    const mappedDto: SimulationDtoRequest = {
      ...dto,
      tableauDeblocages: hasDeblocages ? dto.tableauDeblocages : [{
        dateDeblocage: dto.datePremiereEcheance,
        montant: dto.montantEmprunte,
        numero: 1
      }]
    };

    return this.http.post<Simulation>(`${this.rootUrl}/calculer`, mappedDto, { headers }).pipe(
      tap((simulation) => this.simulationCreatedSubject.next(simulation)),
      catchError((error) => this.handleError(error, 'Erreur lors du calcul du TEG.'))
    );
  }

  getTauxUsureByCategorieId(catId: number): Observable<TauxUsure[]> {
    const headers = this.auth.getAuthHeaders();
    return this.http.get<TauxUsure[]>(`https://backendsimteg-production.up.railway.app/api/tauxUsure/listeParCategorie/${catId}`, { headers }).pipe(
      catchError((error) => this.handleError(error, 'Erreur lors de la récupération des taux d\'usure.'))
    );
  }

  searchSimulations(term: string): Observable<Simulation[]> {
    const headers = this.auth.getAuthHeaders();
    const user = this.auth.getUser();

    if (!term.trim()) {
      if (user?.id) return this.getUserSimulations(user.id);
      return throwError(() => new Error('Impossible de rechercher sans utilisateur.'));
    }

    return this.http.get<Simulation[]>(`${this.rootUrl}/search?term=${encodeURIComponent(term)}`, { headers }).pipe(
      catchError((error) => this.handleError(error, 'Erreur lors de la recherche des simulations.'))
    );
  }

  deleteSimulation(id: number): Observable<boolean> {
    const headers = this.auth.getAuthHeaders();
    return this.http.delete<boolean>(`${this.rootUrl}/supprimer/${id}`, { headers }).pipe(
      catchError((error) => this.handleError(error, 'Erreur lors de la suppression de la simulation.'))
    );
  }

  saveSimulation(simulationRequestGlobal: SimulationRequestGlobal): Observable<Simulation> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Simulation>(`${this.rootUrl}/save`, simulationRequestGlobal, { headers }).pipe(
      tap((simulation) => {
        this.simulationCreatedSubject.next(simulation);
        // Récupérer les notifications pour la simulation sauvegardée
        this.notificationService.getNotificationsForSimulation(simulation.id).subscribe(notifications => {
          notifications.forEach(notification => this.notificationService.showNotification(notification));
        });
      }),
      catchError((error) => this.handleError(error, 'Erreur lors de l\'enregistrement de la simulation. Veuillez vérifier les données saisies.'))
    );
  }

  getSimulationById(id: number): Observable<Simulation> {
  const headers = this.auth.getAuthHeaders();
  return this.http.get<Simulation>(`${this.rootUrl}/${id}`, { headers }).pipe(
    catchError((error) => this.handleError(error, 'Erreur lors de la récupération de la simulation.'))
  );
}


  updateSimulation(idSimulation: number, body: SimulationDtoRequest): Observable<Simulation> {
    const headers = this.auth.getAuthHeaders();
    return this.http.put<Simulation>(`${this.rootUrl}/mettrejour/${idSimulation}`, body, { headers }).pipe(
      tap((simulation) => {
        // Récupérer les notifications pour la simulation mise à jour
        this.notificationService.getNotificationsForSimulation(simulation.id).subscribe(notifications => {
          notifications.forEach(notification => this.notificationService.showNotification(notification));
        });
      }),
      catchError((error) => this.handleError(error, 'Erreur lors de la mise à jour de la simulation.'))
    );
  }

  importExcel(file: File): Observable<SimulationDtoRequest> {
    const headers = this.auth.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<SimulationDtoRequest>(`${this.rootUrl}/import-excel`, formData, { headers }).pipe(
      catchError((error) => this.handleError(error, 'Erreur lors de l\'importation du fichier Excel.'))
    );
  }

  exportToPdf(simulation: SimulationRequestGlobal): Observable<Blob> {
    const headers = new HttpHeaders({
      ...this.auth.getAuthHeaders(),
      Accept: 'application/pdf'
    });

    return this.http.post(`${this.rootUrl}/export-pdf`, simulation, {
      headers,
      responseType: 'blob'
    }).pipe(
      catchError((error) => this.handleError(error, 'Erreur lors de l\'exportation en PDF.'))
    );
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    console.error('[SimulationService] Erreur:', error);
    let errorMessage = defaultMessage;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client : ${error.error.message}`;
    } else if (error.error?.message) {
      errorMessage = `Erreur serveur : ${error.error.message}`;
    } else if (error.status) {
      errorMessage = `Erreur serveur : ${error.status} - ${error.statusText || 'Inconnu'}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}