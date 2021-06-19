import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { HttpErrorResponse } from '@angular/common/http';

import { DatabaseService } from '../core/database.service';
import { AlertService } from '../core/alerts/alert.service';
import { SessionStorageService } from '../core/session-storage-service';

import { Admin } from '../model/admin';
import { ClubMember } from '../model/club-member';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  admins!: Admin[];
  members!: ClubMember[];

  constructor(
    private afAuth: AngularFireAuth,
    private db: DatabaseService,
    private router: Router,
    private alertService: AlertService,
    private sessionStorageService: SessionStorageService,
  ) {
    this.admins = JSON.parse(this.sessionStorageService.getItem('admins'));
    this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));
  }

  login(email: string, password: string) {
    this.admins = JSON.parse(this.sessionStorageService.getItem('admins'));
    this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));

    this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((auth) => {
        const admin = this.admins.find(a => a.email === email);
        const member = this.members.find(m => m.email === email);

        if (!!admin) {
          sessionStorage.setItem('admin', JSON.stringify(admin));
        }
        else if (!!member) {
          sessionStorage.setItem('member', JSON.stringify(member));
        }

        sessionStorage.setItem('user', JSON.stringify(auth.user));
        this.router.navigate(['']);
      })
      .catch((error: any) => {
        console.log(error);
        this.alertService.httpError(error);
      });
  }

  logout(error?: HttpErrorResponse | undefined) {
    if (error != undefined) {
      this.alertService.httpError(error);
    }

    this.afAuth.signOut();
    sessionStorage.clear();
    this.router.navigate(['login']);
  }
}