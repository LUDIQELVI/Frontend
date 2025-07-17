
import { Routes } from '@angular/router';

import { HomePageComponent } from './components/Home/home-page/home-page.component';
import { LoginComponent } from './auth/login/login.component';
import { SigninComponent } from './auth/signin/signin.component';

import { DashboardAdminComponent } from './admin/dashboard-admin/dashboard-admin.component';
import { DashboardUserComponent } from './user/dashboard-user/dashboard-user.component';
import { ListUserComponent }    from './admin/list-user/list-user.component';

import { CategorieComponent }          from './categorie/categorie.component';
import { SimulationComponent }         from './user/simulation/simulation.component';
import { SimulationResultModalComponent } from './user/simulation-result-modal/simulation-result-modal.component';
import { ProfileComponent }            from './profile/profile.component';
import { HelpComponent }               from './user/help/help.component';
import { NotificationComponent }       from './user/notification/notification.component';
import { CategorieNonConnecteeComponent } from './nonConnecte/categorie-non-connectee/categorie-non-connectee.component';
import { SimulationNonConnecteeComponent } from './nonConnecte/simulation-non-connectee/simulation-non-connectee.component';
import { AdminProfileComponent } from './admin/admin-profile/admin-profile.component';
import { authGuard } from './guards/auth.guard';
import { HeaderComponent } from './nonConnecte/header/header.component';
import { GestionCategoriesComponent } from './admin/gestion-categories/gestion-categories.component';
import { EditSimulationComponent } from './user/edit-simulation/edit-simulation.component';
import { ListSimulationsComponent } from './user/list-simulations/list-simulations.component';
import { StatistiqueTauxUsureComponent } from './user/statistique-taux-usure/statistique-taux-usure.component';
import { HomeConnecteeComponent } from './Home/home-connectee/home-connectee.component';

export const routes: Routes = [
  { path: 'home', component: HomePageComponent },

  /* Auth */
  { path: 'auth/login',  component: LoginComponent },
  { path: 'auth/signin', component: SigninComponent },
  {
    path: 'home-connected',
    component: HomeConnecteeComponent,
    canActivate: [authGuard],
    data: {roles:['USER']}
  },

  /* Admin */
  {
    path: 'admin/dashboard',
    component: DashboardAdminComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'admin/gestion-categories',
    component:   GestionCategoriesComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },

  {
    path: 'admin/gerer-users',
    component: ListUserComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'admin/profile-admin',
    component: AdminProfileComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },

  /* User protégées */
  {
    path: 'user/dashboard',
    component: DashboardUserComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },
  {
    path: 'user/edit-simulation',
    component: EditSimulationComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },


  {
    path: 'user/list-simulations',
    component: ListSimulationsComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },
  {
    path: 'user/statistique-taux-usure',
    component: StatistiqueTauxUsureComponent,
    canActivate: [authGuard],
    data: { roles: ['USER', 'ADMIN'] },
  },

  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },
  
  {
    path: 'user/aide',
    component: HelpComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },
  {
    path: 'user/notifications',
    component: NotificationComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },

  {
    path: 'user/simulation',
    component: SimulationComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },

  {
    path: 'user/categorie',
    component: CategorieComponent,
    canActivate: [authGuard],
    data: { roles: ['USER'] },
  },

  /* Pages « invité » */
  { path: 'user/categorieNon',  component: CategorieNonConnecteeComponent },     
  { path: 'user/simulationNon', component: SimulationNonConnecteeComponent },
  { path: 'user/simulation-result', component: SimulationResultModalComponent },
  { path: 'header', component: HeaderComponent},

  /* Redirects */
  { path: '',   redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' },
];
