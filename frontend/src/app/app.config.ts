import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { catchError, firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { autenticacaoErroInterceptor } from './core/auth-erro.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([autenticacaoErroInterceptor])),
    // Semeia o cookie XSRF-TOKEN antes do 1º POST (login e escritas). Resiliente a
    // falha (ex.: API fora do ar) para não travar o bootstrap.
    provideAppInitializer(() => {
      const http = inject(HttpClient);
      return firstValueFrom(
        http.get('/api/auth/csrf', { withCredentials: true }).pipe(catchError(() => of(null))),
      );
    }),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          // Força o modo claro: nossas superfícies são claras (design system).
          // A classe '.modo-escuro' nunca é aplicada, então o tema não segue o SO.
          darkModeSelector: '.modo-escuro',
          // Evita conflito de especificidade com utilitários; camada dedicada ao PrimeNG.
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng'
          }
        }
      },
      license: environment.primengLicenseKey,
    })
  ]
};
