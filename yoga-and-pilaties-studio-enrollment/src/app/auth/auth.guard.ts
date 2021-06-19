import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class isAdminGuard implements CanActivate {
  constructor() {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      !!sessionStorage.getItem('admin') ? resolve(true) : reject();
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class isMemberGuard implements CanActivate {
  constructor() {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      !!sessionStorage.getItem('member') ? resolve(true) : reject();
    });
  }
}