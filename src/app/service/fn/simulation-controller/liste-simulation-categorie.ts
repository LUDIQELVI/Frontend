/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { Simulation } from '../../models/simulation';

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
    rb.build({ responseType: 'blob', accept: '*/*', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<Simulation>>;
    })
  );
}

listeSimulationCategorie.PATH = '/api/simulation/simulationParCategorieId/{userId}';
