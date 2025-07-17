import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { RequestBuilder } from '../service/request-builder';
import { StrictHttpResponse } from '../service/strict-http-response';
import { SimulationDtoRequest } from '../service/models';
import { SimulationDtoResponse } from '../models/simulation.models';
import { Simulation } from '../service/models';
import { SimulationRequestGlobal } from '../service/models';
import { Category } from '../models/category';
import { TauxUsure } from '../service/models';
export interface CalculerTeg$Params {
  body: SimulationDtoRequest;
}

export function calculerTeg(http: HttpClient, rootUrl: string, params: CalculerTeg$Params, context?: HttpContext): Observable<StrictHttpResponse<SimulationDtoResponse>> {
  const rb = new RequestBuilder(rootUrl, calculerTeg.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<SimulationDtoResponse>;
    })
  );
}
calculerTeg.PATH = '/api/simulation/calculer';

export interface ListeSimulationCategorie$Params {
  userId: number;
  categorieId: number;
}

export function listeSimulationCategorie(http: HttpClient, rootUrl: string, params: ListeSimulationCategorie$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<Simulation>>> {
  const rb = new RequestBuilder(rootUrl, listeSimulationCategorie.PATH, 'get');
  if (params) {
    rb.path('userId', params.userId, {});
    rb.query('categorieId', params.categorieId, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<Simulation>>;
    })
  );
}
listeSimulationCategorie.PATH = '/api/simulation/simulationParCategorieId/{userId}';

export interface ListeSimulationUser$Params {
  id: number;
}

export function listeSimulationUser(http: HttpClient, rootUrl: string, params: ListeSimulationUser$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<Simulation>>> {
  const rb = new RequestBuilder(rootUrl, listeSimulationUser.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<Simulation>>;
    })
  );
}
listeSimulationUser.PATH = '/api/simulation/simulationUser/{id}';

export interface MettreAjour$Params {
  idSimulation: number;
  body: SimulationDtoRequest;
}

export function mettreAjour(http: HttpClient, rootUrl: string, params: MettreAjour$Params, context?: HttpContext): Observable<StrictHttpResponse<Simulation>> {
  const rb = new RequestBuilder(rootUrl, mettreAjour.PATH, 'put');
  if (params) {
    rb.path('idSimulation', params.idSimulation, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Simulation>;
    })
  );
}
mettreAjour.PATH = '/api/simulation/mettrejour/{idSimulation}';

export interface SaveSimulation$Params {
  email: string;
  body: SimulationRequestGlobal;
}

export function saveSimulation(http: HttpClient, rootUrl: string, params: SaveSimulation$Params, context?: HttpContext): Observable<StrictHttpResponse<Simulation>> {
  const rb = new RequestBuilder(rootUrl, saveSimulation.PATH, 'post');
  if (params) {
    rb.path('email', params.email, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Simulation>;
    })
  );
}
saveSimulation.PATH = '/api/simulation/save/{email}';

export interface SupprimerSimulation$Params {
  idSimulation: number;
}

export function supprimerSimulation(http: HttpClient, rootUrl: string, params: SupprimerSimulation$Params, context?: HttpContext): Observable<StrictHttpResponse<boolean>> {
  const rb = new RequestBuilder(rootUrl, supprimerSimulation.PATH, 'delete');
  if (params) {
    rb.path('idSimulation', params.idSimulation, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<boolean>;
    })
  );
}
supprimerSimulation.PATH = '/api/simulation/supprimer/{idSimulation}';

 export interface ListeCategorieCredit$Params {}

export function listeCategorieCredit(http: HttpClient, rootUrl: string, params?: ListeCategorieCredit$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<Category>>> {
  const rb = new RequestBuilder(rootUrl, listeCategorieCredit.PATH, 'get');
  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<Category>>;
    })
  );
}
listeCategorieCredit.PATH = '/api/categorieCredit/list';

export interface RecupererCategorieCredit$Params {
  id: number;
}

export function recupererCategorieCredit(http: HttpClient, rootUrl: string, params: RecupererCategorieCredit$Params, context?: HttpContext): Observable<StrictHttpResponse<Category>> {
  const rb = new RequestBuilder(rootUrl, recupererCategorieCredit.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
  }
  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Category>;
    })
  );
}
recupererCategorieCredit.PATH = '/api/categorieCredit/recuperer/{id}';

export interface ListeTauxUsureParCategorie$Params {
  categorieId: number;
}

export function listeTauxUsureParCategorie(http: HttpClient, rootUrl: string, params: ListeTauxUsureParCategorie$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<TauxUsure>>> {
  const rb = new RequestBuilder(rootUrl, listeTauxUsureParCategorie.PATH, 'get');
  if (params) {
    rb.path('categorieId', params.categorieId, {});
  }
  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<TauxUsure>>;
    })
  );
}
listeTauxUsureParCategorie.PATH = '/api/tauxUsure/listeParCategorie/{categorieId}';
