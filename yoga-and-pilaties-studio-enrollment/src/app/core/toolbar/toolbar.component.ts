import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  fadeInOnEnterAnimation,
  fadeOutOnLeaveAnimation,
} from 'angular-animations';

import { DatabaseService } from '../database.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
  animations: [fadeInOnEnterAnimation(), fadeOutOnLeaveAnimation()],
})
export class ToolbarComponent implements OnInit {
  loggedIn: boolean = false;
  isAdmin: boolean = false;
  isCompany: boolean = false;

  photoLoaded = false;
  displayName!: string;
  email!: string;
  image!: string;

  constructor(
    public db: DatabaseService,
    public afAuth: AngularFireAuth,
    private authService: AuthService
  ) {}

  logout(): void {
    //this.authService.logout();
  }

  ngOnInit(): void {
    // const loadUser = sessionStorage.getItem('user');
    // const loadCompany = sessionStorage.getItem('company');
    // const loadAdmin = sessionStorage.getItem('admin');

    // if (!!loadAdmin) {
    //   const admin: Admin = JSON.parse(loadAdmin);
    //   this.displayName = admin.displayName;
    //   this.email = admin.email;
    //   this.image = admin.image;

    //   this.isAdmin = true;
    // }
    // else if (!!loadCompany) {
    //   const company: Company = JSON.parse(loadCompany);
    //   this.displayName = company.name;
    //   this.email = company.email;
    //   this.image = company.image;
      
    //   this.isCompany = true;
    // }
    // else if (!!loadUser) {
    //   const user = JSON.parse(loadUser);
    //   this.displayName = user.displayName;
    //   this.email = user.email;
    //   this.image = user.photoURL;
    // }

    // if(!!loadAdmin || !!loadCompany || !!loadUser) {
    //   this.photoLoaded = true;
    //   this.loggedIn = true;
    // }
  }
}
