import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { authInterceptor } from './interceptors/authInterceptor/auth-interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Auth } from './services/auth/auth';
import { catchError, of } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideClientHydration(),
    provideAppInitializer(() => {
      var auth = inject(Auth)
      if(!auth.getToken()){
        return
      }
      
      auth.loadMe().subscribe({
      next: (user) => {
        console.log('Authenticated user:', user);
      },
        error: (err) => console.error('Could not load user:', err)
      })})
  ]
};
