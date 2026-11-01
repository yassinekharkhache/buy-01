import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth/auth';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const auth = inject(Auth);

    const requiredRole = route.data?.['role'];
     const user = auth.user();

    // Avoid accessing browser cookies during SSR
    if (!isPlatformBrowser(platformId)) {
      return true; // Let the server render; check authentication in the browser
    }

    if (!user) {
      return router.createUrlTree(['/login']);
    }

    if ((requiredRole === 'CLIENT' || requiredRole === 'SELLER') && user.role !== requiredRole) {
      return router.createUrlTree(['/forbidden']);
    }

    if (requiredRole === 'ANY' && user.role !== 'CLIENT' && user.role !== 'SELLER') {
      return router.createUrlTree(['/forbidden']);
    }

    // Redirect to login if the JWT cookie doesn't exist
    return true;
};
