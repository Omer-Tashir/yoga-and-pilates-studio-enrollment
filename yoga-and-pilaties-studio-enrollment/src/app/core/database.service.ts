import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AngularFirestore } from '@angular/fire/firestore';
import { catchError, first, map, switchMap, tap } from 'rxjs/operators';
import { forkJoin, from, Observable, of } from 'rxjs';

import { SessionStorageService } from './session-storage-service';
import { Auditorium } from '../model/auditorium';
import { ClubMember, MembershipType } from '../model/club-member';
import { Class } from '../model/class';
import { Admin } from '../model/admin';

import * as moment from 'moment/moment';
import { Teacher } from '../model/teacher';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {

  constructor(
    private db: AngularFirestore,
    private SessionStorageService: SessionStorageService
  ) { }

  init(): Observable<boolean> {
    return forkJoin([
      this.getAdmins().pipe(first()),
      this.getTeachers().pipe(first()),
      this.getAuditoriums().pipe(first()),
      this.getClasses().pipe(first()),
      this.getClubMembers().pipe(first())
    ]).pipe(
      map(results => !!results)
    );
  }

  private getAdmins(): Observable<Admin[]> {
    if(!this.SessionStorageService.getItem('admins')) {
      return this.db.collection(`admins`).get().pipe(
        map(admins => admins.docs.map(doc => {
          return <Admin>doc.data();
        })),
        tap(admins => this.SessionStorageService.setItem('admins', JSON.stringify(admins))),
        catchError(err => of([])),
      );
    }
    else {
      return of(JSON.parse(this.SessionStorageService.getItem('admins')));
    }
  }

  private getTeachers(): Observable<Teacher[]> {
    if (!this.SessionStorageService.getItem('teachers')) {
      return this.db.collection(`teachers`).get().pipe(
        map(teachers => teachers.docs.map(doc => {
          return <Teacher>doc.data();
        })),
        tap(teachers => this.SessionStorageService.setItem('teachers', JSON.stringify(teachers))),
        catchError(err => of([])),
      );
    }
    else {
      return of(JSON.parse(this.SessionStorageService.getItem('teachers')));
    }
  }

  private getAuditoriums(): Observable<Auditorium[]> {
    if(!this.SessionStorageService.getItem('auditoriums')) {
      return this.db.collection(`auditoriums`).get().pipe(
        map(auditoriums => auditoriums.docs.map(doc => {
          return <Auditorium>doc.data();
        })),
        tap(auditoriums => this.SessionStorageService.setItem('auditoriums', JSON.stringify(auditoriums))),
        catchError(err => of([])),
      );
    }
    else {
      return of(JSON.parse(this.SessionStorageService.getItem('auditoriums')));
    }
  }

  private getClasses(): Observable<Class[]> {
    if(!this.SessionStorageService.getItem('classes')) {
      return this.db.collection(`classes`).get().pipe(
        map(classes => classes.docs.map(doc => {
          const data: any = doc.data();
          let c = Object.assign(data, new Class);
          c.date = moment(data['date'].toDate()).utc().toDate();
          return c;
        })),
        tap(classes => this.SessionStorageService.setItem('classes', JSON.stringify(classes))),
        catchError(err => of([])),
      );
    }
    else {
      return of(JSON.parse(this.SessionStorageService.getItem('classes')));
    }
  }

  private getClubMembers(): Observable<ClubMember[]> {
    if(!this.SessionStorageService.getItem('club-members')) {
      return this.db.collection(`club-members`).get().pipe(
        map(clubMembers => clubMembers.docs.map(doc => {
          const data: any = doc.data();
          let clubMember = Object.assign(data, new ClubMember);
          clubMember.memberSince = moment(data['memberSince'].toDate()).toDate();

          if (data['expirationDate']) {
            clubMember.expirationDate = moment(data['expirationDate'].toDate()).toDate();
          }
          else {
            clubMember.expirationDate = moment(clubMember.memberSince).add(1, 'months').toDate();
          }

          if (!data['entrancesLeft']) {
            switch (data['membershipType']) {
              case MembershipType.CARD_OF_5_ENTRANCES:
                clubMember.entrancesLeft = 5;
                break;

              case MembershipType.CARD_OF_10_ENTRANCES:
                clubMember.entrancesLeft = 10;
                break;

              default:
                break;
            }
          }

          return clubMember;
        })),
        tap(clubMembers => this.SessionStorageService.setItem('club-members', JSON.stringify(clubMembers))),
        catchError(err => of([])),
      );
    }
    else {
      return of(JSON.parse(this.SessionStorageService.getItem('club-members')));
    }
  }

  createClass(c: Class): Observable<string> {
    const uid = this.db.createId();
    c.uid = uid;

    return from(this.db.collection(`classes`).doc(uid).set(c).then(() => {
      let classes = JSON.parse(this.SessionStorageService.getItem('classes'));
      classes.push(c);

      this.SessionStorageService.setItem('classes', JSON.stringify(classes));
    })).pipe(
      switchMap(() => of(uid))
    );
  }

  updateClass(c: Class): Observable<string> {
    c.date = moment(c.date).toDate();
    return from(this.db.collection(`classes`).doc(c.uid).set(c).then(() => {
      let classes = JSON.parse(this.SessionStorageService.getItem('classes'));
      let i = classes.findIndex((cls: Class) => cls.uid === c.uid);
      if (i !== -1) {
        classes[i] = c;
      }

      this.SessionStorageService.setItem('classes', JSON.stringify(classes));
    })).pipe(
      switchMap(() => of(c.uid))
    );
  }

  updateMember(member: ClubMember): Observable<string> {
    member.expirationDate = moment(member.expirationDate).toDate();
    member.memberSince = moment(member.memberSince).toDate();

    return from(this.db.collection(`club-members`).doc(member.uid).set(member).then(() => {
      let clubMembers = JSON.parse(this.SessionStorageService.getItem('club-members'));
      let i = clubMembers.findIndex((m: ClubMember) => m.uid === member.uid);
      if (i !== -1) {
        clubMembers[i] = member;
      }

      this.SessionStorageService.setItem('member', JSON.stringify(member));
      this.SessionStorageService.setItem('club-members', JSON.stringify(clubMembers));
    })).pipe(
      switchMap(() => of(member.uid))
    );
  }

  createClubMember(member: ClubMember): Observable<string> {
    const uid = this.db.createId();
    member.uid = uid;

    return from(this.db.collection(`club-members`).doc(uid).set(member).then(() => {
      let clubMembers = JSON.parse(this.SessionStorageService.getItem('club-members'));
      clubMembers.push(member);

      this.SessionStorageService.setItem('club-members', JSON.stringify(clubMembers));
    })).pipe(
      switchMap(() => of(uid))
    );
  }

  // getCitiesJSON(): Observable<any> {
  //   let response = this.http.get("./assets/israel-cities.json");
  //   return response
  // }

  // getStreetsJSON(): Observable<any> {
  //   let response = this.http.get("./assets/israel-streets.json");
  //   return response
  // }
}