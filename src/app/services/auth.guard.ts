import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si ya verificó, responde inmediatamente
  if (auth.hasCheckedAuth()) {
    if (auth.isLoggedIn()) return true;
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Si no, espera a que termine restoreSession()
  return toObservable(auth.getAuthChecked()).pipe(
    filter(checked => checked === true),
    take(1),
    map(() => {
      if (auth.isLoggedIn()) return true;
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};