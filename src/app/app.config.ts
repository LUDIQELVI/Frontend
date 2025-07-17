import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideZoneChangeDetection } from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withFetch                 
} from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { AUTH_INTERCEPTOR_PROVIDER } from './auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    /* HttpClient avec interceptors + fetch() */
    provideHttpClient(
      withInterceptorsFromDi(),
      withFetch()
    ),
    AUTH_INTERCEPTOR_PROVIDER,          

    /* SSR / hydration */
    provideClientHydration(withEventReplay())
  ]
};
