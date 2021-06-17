import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { AddClassDialogComponent } from '../core/add-class-dialog/add-class-dialog.component';
import { Class, ClassType } from '../model/class';
import { DatabaseService } from '../core/database.service';
import { Auditorium } from '../model/auditorium';

import * as moment from 'moment/moment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  calendarActiveDate: Date = new Date();
  classes$!: Observable<Class[]>;
  dailyClasses$!: Observable<Class[]>;

  constructor(
    private db: DatabaseService,
    private dialog: MatDialog
  ) { }

  dateChanged(date: Date) {
    this.dailyClasses$ = this.classes$.pipe(
      map(arr => arr.filter(c => moment(c.date).isSame(date, 'day'))),
    );
  }

  addClass() {
    const dialogRef = this.dialog.open(AddClassDialogComponent, {
      width: '50vw',
      height: '50vh',
      data: {
        title: `הוספת שיעור חדש`,
        date: this.calendarActiveDate
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!!result) {
        let newClass: Class = Object.assign({
          ...result,
          date: moment(result['date']).toDate(),
          type: result['type'] === true ? ClassType.PILATES : ClassType.YOGA,
        }, new Class());

        this.db.putClass(newClass).pipe(first()).subscribe(() => {
          console.log('added class');
        });
      }
    });
  }

  canJoinClass(c: Class): Observable<boolean> {
    if (!c.auditorium) {
        throw new Error('השיעור לא שוייך לאף אולם');
    }
    else if (!c.participents) {
        return of(true);
    }

    return this.db.getAuditoriums().pipe(
        map(arr => arr.find(a => a.uid === c.auditorium)),
        filter((a: any) => !!a),
        switchMap((a: Auditorium) => of(a.capacity < c.participents.length))
    )
  }

  addParticipent(c: Class, participent: string): void {
    if (!!participent && this.canJoinClass(c)) {
        if (!c.participents) {
            c.participents = new Array<string>();
        }

        c.participents.push(participent);
    }
    else {
        throw new Error('לא ניתן להוסיף את המנוי לשיעור המבוקש');
    }
  }

  ngOnInit(): void {
    this.classes$ = this.db.getClasses();
    this.dateChanged(new Date());
  }
}