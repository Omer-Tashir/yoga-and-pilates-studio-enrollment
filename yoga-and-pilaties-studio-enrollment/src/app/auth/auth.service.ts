import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { HttpErrorResponse } from '@angular/common/http';

import { DatabaseService } from '../core/database.service';
import { AlertService } from '../core/alerts/alert.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private db: DatabaseService,
    private router: Router,
    private alertService: AlertService,
  ) {}

  // login(email: string, password: string) {
  //   this.afAuth
  //     .signInWithEmailAndPassword(email, password)
  //     .then((auth) => {
  //       this.db.getAdmins().subscribe(admins => {
  //         const currentUser = admins.find(a => a.email === email);
  //         if (!!currentUser) {
  //           sessionStorage.setItem('admin', JSON.stringify(currentUser));
  //         }

  //         sessionStorage.setItem('user', JSON.stringify(auth.user));
  //         this.router.navigate(['']);
  //       });
  //     })
  //     .catch((error: any) => {
  //       console.log(error);
  //       this.alertService.httpError(error);
  //     });
  // }

  // companyLogin(email: string, password: string) {
  //   this.afAuth
  //     .signInWithEmailAndPassword(email, password)
  //     .then((auth) => {
  //       this.db.getCompanies().subscribe(companies => {
  //         const currentUser = companies.find(c => c.email === email);
  //         if (!!currentUser) {
  //           sessionStorage.setItem('company', JSON.stringify(currentUser));
  //         }

  //         sessionStorage.setItem('user', JSON.stringify(auth.user));
  //         this.router.navigate(['company-new-job-offer']);
  //       });
  //     })
  //     .catch((error: any) => {
  //       console.log(error);
  //       this.alertService.httpError(error);
  //     });
  // }
  
  // companyRegister(name: string, contactName: string, contactPhone: string, contactRole: string, phone: string, domain: string, email: string, password: string, image: string) {
  //   let newCompany: Company = Object.assign({name, contactName, contactPhone, contactRole, phone, domain, email, image}, new Company);

  //   this.afAuth.
  //   createUserWithEmailAndPassword(email, password)
  //   .then((auth) => {
  //     this.db.putCompany(newCompany).subscribe(() => {
  //       sessionStorage.setItem('company', JSON.stringify(newCompany));
  //       sessionStorage.setItem('user', JSON.stringify(auth.user));
  //       this.router.navigate(['company-new-job-offer']);
  //     });
  //   });
  // }

  // logout(error?: HttpErrorResponse | undefined) {
  //   if (error != undefined) {
  //     this.alertService.httpError(error);
  //   }

  //   this.afAuth.signOut();
  //   sessionStorage.clear();
  //   this.router.navigate(['login']);
  // }

  // companyLogout(error?: HttpErrorResponse | undefined) {
  //   if (error != undefined) {
  //     this.alertService.httpError(error);
  //   }

  //   this.afAuth.signOut();
  //   sessionStorage.clear();
  //   this.router.navigate(['company-sign-up']);
  // }
}
