/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { CategorieDto } from '../../models/categorie-dto';

export interface GetCategorieCredit$Params {
  id: number;
}

export function getCategorieCredit(http: HttpClient, rootUrl: string, params: GetCategorieCredit$Params, context?: HttpContext): Observable<StrictHttpResponse<CategorieDto>> {
  const rb = new RequestBuilder(rootUrl, getCategorieCredit.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'blob', accept: '*/*', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<CategorieDto>;
    })
  );
}

getCategorieCredit.PATH = '/api/categorieCredit/recuperer/{id}';
