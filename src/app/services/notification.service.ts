import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { AuthServiceService } from './auth/auth-service.service';
import { Simulation } from '../models/simulation.models';

export interface AppNotification {
  id: string;
  message: string;
  dateNotification: string;
  alerte?: boolean;
  simulation?: { id: number };
  type?: 'success' | 'error';
  read?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'https://backendsimteg-production.up.railway.app/api/notification';

  private notificationCountSubject = new BehaviorSubject<number>(0);
  notificationCount$ = this.notificationCountSubject.asObservable();

  private notificationSubject = new Subject<AppNotification>();
  notification$ = this.notificationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthServiceService
  ) {}

  getNotificationsForSimulation(simulationId: number): Observable<AppNotification[]> {
    if (!simulationId) return of([]);

    return this.http.get<AppNotification[]>(`${this.apiUrl}/afficherNot/${simulationId}`).pipe(
      map(notifications =>
        (notifications ?? []).map(n => ({
          ...n,
          read: n.read ?? false,
          type: n.alerte ? 'error' : 'success' as 'error' | 'success'
        }))
      ),
      tap(notifications => this.updateNotificationCount(notifications.filter(n => !n.read).length)),
      catchError(() => of([]))
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      catchError(() => of(void 0))
    );
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.authService.currentUser$.subscribe(user => {
          if (user?.id) {
            this.getNotificationsForUser(user.id).subscribe();
          }
        });
      })
    );
  }

  showNotification(notification: AppNotification): void {
    this.notificationSubject.next(notification);
  }

  updateNotificationCount(count: number): void {
    this.notificationCountSubject.next(count);
  }

  updateNotificationCountByDelta(delta: number): void {
    const current = this.notificationCountSubject.getValue();
    const newCount = Math.max(current + delta, 0);
    this.notificationCountSubject.next(newCount);
  }

  getNotificationsForUser(userId: number): Observable<AppNotification[]> {
    if (!userId) return of([]);
    return this.http.get<Simulation[]>(`http://localhost:3331/api/simulation/simulationUser/${userId}`).pipe(
      switchMap((simulations: Simulation[]) => {
        if (!simulations?.length) return of([]);
        const notificationRequests = simulations.map(sim =>
          this.getNotificationsForSimulation(sim.id)
        );
        return forkJoin(notificationRequests).pipe(
          map((results: AppNotification[][]) => results.flat()),
          tap((notifications: AppNotification[]) => {
            const unreadCount = notifications.filter(n => !n.read).length;
            this.updateNotificationCount(unreadCount);
          })
        );
      }),
      catchError(() => of([]))
    );
  }
}