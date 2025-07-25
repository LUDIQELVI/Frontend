/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface SavePhotos$Params {
  context: string;
  email: string;
  title: string;
      body?: {
'file': Blob;
}
}

export function savePhotos(http: HttpClient, rootUrl: string, params: SavePhotos$Params, context?: HttpContext): Observable<StrictHttpResponse<{
}>> {
  const rb = new RequestBuilder(rootUrl, savePhotos.PATH, 'post');
  if (params) {
    rb.path('context', params.context, {});
    rb.path('email', params.email, {});
    rb.path('title', params.title, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'blob', accept: '*/*', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<{
      }>;
    })
  );
}

savePhotos.PATH = '/auth/photos/{email}/{title}/{context}';
