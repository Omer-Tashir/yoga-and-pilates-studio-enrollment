import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AngularFirestore } from '@angular/fire/firestore';
import { catchError, first, map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { forkJoin, from, Observable, of, Subject } from 'rxjs';

import { SessionStorageService } from './session-storage-service';
import { Auditorium } from '../model/auditorium';
import { ClubMember } from '../model/club-member';
import { Class } from '../model/class';

import * as moment from 'moment/moment';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {

  constructor(
    private SessionStorageService: SessionStorageService,
    private db: AngularFirestore,
    private http: HttpClient
  ) { }

  init(): Observable<boolean> {
    return forkJoin([
      this.getAuditoriums().pipe(first()),
      this.getClasses().pipe(first()),
      this.getClubMembers().pipe(first())
    ]).pipe(
      map(results => !!results)
    );
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
        tap(classes => console.log(classes)),
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
          clubMember.memberSince = moment(data['memberSince'].toDate()).toDate()
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
      if (!!i) {
        classes[i] = c;
      }

      this.SessionStorageService.setItem('classes', JSON.stringify(classes));
    })).pipe(
      switchMap(() => of(c.uid))
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