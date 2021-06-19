import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  fadeInOnEnterAnimation,
  fadeOutOnLeaveAnimation,
} from 'angular-animations';

import { DatabaseService } from '../database.service';
import { AuthService } from '../../auth/auth.service';
import { Admin } from 'src/app/model/admin';
import { ClubMember } from 'src/app/model/club-member';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
  animations: [fadeInOnEnterAnimation(), fadeOutOnLeaveAnimation()],
})
export class ToolbarComponent implements OnInit {
  loggedIn: boolean = false;
  isAdmin: boolean = false;
  isMember: boolean = false;

  name!: string;
  email!: string;

  constructor(
    public db: DatabaseService,
    public afAuth: AngularFireAuth,
    private authService: AuthService
  ) {}

  logout(): void {
    this.authService.logout();
  }

  ngOnInit(): void {
    const loadMember = sessionStorage.getItem('member');
    const loadAdmin = sessionStorage.getItem('admin');

    if (!!loadAdmin) {
      const admin: Admin = JSON.parse(loadAdmin);
      this.name = admin.name;
      this.email = admin.email;

      this.isAdmin = true;
    }
    else if (!!loadMember) {
      const member: ClubMember = JSON.parse(loadMember);
      this.name = member.name;
      this.email = member.email;
      
      this.isMember = true;
    }

    if (!!loadAdmin || !!loadMember) {
      this.loggedIn = true;
    }
  }
}
