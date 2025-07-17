import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthServiceService } from '../services/auth/auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class authGuard implements CanActivate {
  constructor(
    private auth: AuthServiceService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const publicRoutes = [
      'user/categorie',
      'user/simulation',
      'user/simulation-result',
      'home'
    ];
    const currentPath = route.routeConfig?.path ?? '';

    if (publicRoutes.includes(currentPath)) {
      return true;
    }

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: route.url.join('/') } });
      return false;
    }

    const allowedRoles = (route.data['roles'] as string[]) ?? [];
    const userRoles = this.auth.getRoles();

    if (allowedRoles.length === 0) {
      return true;
    }

    const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase().replace('ROLE_', ''));
    const hasAccess = normalizedAllowedRoles.some(role => userRoles.includes(role));

    if (hasAccess) {
      return true;
    }

    this.router.navigate(['/home']);
    return false;
  }
}