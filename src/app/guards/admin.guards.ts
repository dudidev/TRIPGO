import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser();

  if (user?.rol === 'admin') {
    return true;
  }

  router.navigate(['/principal']);

  return false;
};