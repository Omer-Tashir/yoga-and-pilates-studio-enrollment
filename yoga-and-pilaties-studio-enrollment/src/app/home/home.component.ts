import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';

import { AddParticipentDialogComponent } from '../core/add-participent-dialog/add-participent-dialog.component';
import { AddClassDialogComponent } from '../core/add-class-dialog/add-class-dialog.component';
import { DateFormatPipe } from '../core/date-formatter/date-formatter';
import { SessionStorageService } from '../core/session-storage-service';
import { DatabaseService } from '../core/database.service';
import { Auditorium } from '../model/auditorium';
import { ClubMember } from '../model/club-member';
import { Class, ClassType } from '../model/class';

import * as moment from 'moment/moment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  calendarActiveDate: Date = new Date();
  classes!: Class[];
  dailyClasses!: Class[];
  auditoriums!: Auditorium[];
  members!: ClubMember[];

  constructor(
    private db: DatabaseService,
    private sessionStorageService: SessionStorageService,
    private dateFormatPipe: DateFormatPipe,
    private dialog: MatDialog
  ) { 
    this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
    this.auditoriums = JSON.parse(this.sessionStorageService.getItem('auditoriums'));
    this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));
  }

  dateChanged(date: Date) {
    this.calendarActiveDate = date;
    this.dailyClasses = this.classes?.filter(c => moment(c.date).isSame(date, 'day')) ?? [];
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

        this.db.createClass(newClass).pipe(first()).subscribe(() => {
          this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
          this.dateChanged(this.calendarActiveDate);
        });
      }
    });
  }

  addParticipent(c: Class): void {
    const dialogRef = this.dialog.open(AddParticipentDialogComponent, {
      width: '50vw',
      height: '50vh',
      data: {
        title: `רישום משתתף לשיעור ${c.type} ב${this.dateFormatPipe.transform(c.date)} בשעה ${c.hour}:00`,
        class: c
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!!result) {
        let p = result['member'];
        this.addParticipentToClass(c, p);
      }
    });
  }

  addWaitingList(c: Class): void {

  }

  private addParticipentToClass(c: Class, participent: string): void {
    if (!!participent && this.canJoinClass(c)) {
        if (!c.participents) {
            c.participents = new Array<string>();
        }

        c.participents.push(participent);
    }
    else {
        throw new Error('לא ניתן להוסיף את המנוי לשיעור המבוקש');
    }

    this.db.updateClass(c).pipe(first()).subscribe(() => {
      this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
      this.dateChanged(this.calendarActiveDate);
    });
  }

  private addParticipentToWaitingList(c: Class, participent: string): void {
    if (!!participent && !this.canJoinClass(c)) {
        if (!c.waitingList) {
            c.waitingList = new Array<string>();
        }

        c.waitingList.push(participent);
    }
    else {
        throw new Error('לא ניתן להוסיף את המנוי לרשימת הממתנה');
    }
  }

  private canJoinClass(c: Class): boolean {
    if (!c.auditorium) {
        throw new Error('השיעור לא שוייך לאף אולם');
    }
    else if (!c.participents) {
        return true;
    }

    let auditorium: Auditorium | undefined = this.auditoriums.find(a => a.uid === c.auditorium);
    if (auditorium) {
      return auditorium.capacity > c.participents.length;
    }

    return false;
  }

  getAuditorium(c: Class): Auditorium | undefined {
    return this.auditoriums.find(a => a.uid === c.auditorium);
  }

  getParticipents(c: Class): ClubMember[] {
    return this.members.filter(m => c.participents?.includes(m.uid));
  }

  getWaitingList(c: Class): ClubMember[] {
    return this.members.filter(m => c.waitingList?.includes(m.uid));
  }

  ngOnInit(): void {
    this.dateChanged(new Date());
  }
}