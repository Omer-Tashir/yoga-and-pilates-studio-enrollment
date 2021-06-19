import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormControl, FormGroup } from '@angular/forms';
import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { DatabaseService } from '../core/database.service';
import { SessionStorageService } from '../core/session-storage-service';
import { ClubMember, MembershipType } from '../model/club-member';
import { Class } from '../model/class';

import * as moment from 'moment/moment';

@Component({
  selector: 'app-club-member-profile',
  templateUrl: './club-member-profile.component.html',
  styleUrls: ['./club-member-profile.component.scss']
})
export class ClubMemberProfileComponent implements OnInit {

  membershipType = MembershipType;
  form: FormGroup = new FormGroup({});
  auth$!: Observable<any>;
  classes!: Class[];
  member!: ClubMember;
  expiration!: Date;
  entrancesLeft!: number;
  isLoading = false;

  constructor(
    public afAuth: AngularFireAuth,
    private sessionStorageService: SessionStorageService,
    private db: DatabaseService
  ) { 
    this.member = JSON.parse(this.sessionStorageService.getItem('member'));
    this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
  }

  renew(): void {
    this.isLoading = true;
    if (this.member.membershipType === MembershipType.MONTHLY) {
      if (!!this.member.expirationDate) {
        this.member.expirationDate = moment(this.member.expirationDate).add(1, 'months').toDate();
      }
      else {
        this.member.expirationDate = moment(this.member.memberSince).add(1, 'months').toDate();
      }

      this.expiration = this.member.expirationDate;
    }
    else if (this.member.membershipType === MembershipType.CARD_OF_5_ENTRANCES) {
      this.member.entrancesLeft = this.entrancesLeft + 5;
    }
    else if (this.member.membershipType === MembershipType.CARD_OF_10_ENTRANCES) {
      this.member.entrancesLeft = this.entrancesLeft + 10;
    }

    this.entrancesLeft = this.member.entrancesLeft;

    this.db.updateMember(this.member).pipe(first()).subscribe(() => {
      this.member = JSON.parse(this.sessionStorageService.getItem('member'));
      this.isLoading = false;
    });
  }

  getCountOfClasses(): number {
    const myClasses = this.classes.filter(c => c.participents.includes(this.member.uid));
    return myClasses?.length ?? 0;
  }

  ngOnInit(): void {
    this.auth$ = this.afAuth.authState;

    this.form = new FormGroup({
      name: new FormControl({value: this.member.name, disabled: true}),
      email: new FormControl({value: this.member.email, disabled: true}),
      membershipType: new FormControl({value: this.member.membershipType, disabled: true}),
      memberSince: new FormControl({value: this.member.memberSince, disabled: true}),
    });

    if (this.member.membershipType === MembershipType.MONTHLY) {
      if (!!this.member.expirationDate) {
        this.expiration = moment(this.member.expirationDate).toDate();
      }
      else {
        this.expiration = moment(this.member.memberSince).add(1, 'months').toDate();
      }
    }
    else if (this.member.membershipType === MembershipType.CARD_OF_5_ENTRANCES) {
      this.entrancesLeft = (this.member.entrancesLeft ?? 5 - this.getCountOfClasses());
    }
    else if (this.member.membershipType === MembershipType.CARD_OF_10_ENTRANCES) {
      this.entrancesLeft = (this.member.entrancesLeft ?? 10 - this.getCountOfClasses());
    }
  }
}