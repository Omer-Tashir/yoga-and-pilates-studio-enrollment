import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';

import { AddParticipentDialogComponent } from '../core/add-participent-dialog/add-participent-dialog.component';
import { AddClassDialogComponent } from '../core/add-class-dialog/add-class-dialog.component';
import { DateFormatPipe } from '../core/date-formatter/date-formatter';
import { SessionStorageService } from '../core/session-storage-service';
import { DatabaseService } from '../core/database.service';
import { AlertService } from '../core/alerts/alert.service';
import { Auditorium } from '../model/auditorium';
import { ClubMember } from '../model/club-member';
import { Class, ClassType } from '../model/class';

import { environment } from 'src/environments/environment';

import * as moment from 'moment/moment';

declare let Email: any;

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

  isLoading = false;

  constructor(
    private db: DatabaseService,
    private sessionStorageService: SessionStorageService,
    private dateFormatPipe: DateFormatPipe,
    private alert: AlertService,
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

  runAlgorithem () {
    this.isLoading = true;

    this.dailyClasses.forEach(c => {
      let isClassChanged = false;
      let auditorium = this.getAuditorium(c);
      let allAuditoriums = this.auditoriums;

      if(!!auditorium) {
        // auditorium arrangement
        let capacity = auditorium.capacity;
        let betterAuditorium = allAuditoriums.find(a => a.capacity > capacity);

        if ((c?.waitingList?.length > 0) && (!!betterAuditorium)) {
          // find if the better auditorium is available
          let classInBetterAuditorium = this.dailyClasses.find(cls => ((cls.uid !== c.uid) && (cls.auditorium === betterAuditorium?.uid) && (moment(cls.date).isSame(c.date, 'day')) && (cls.hour === c.hour) && (!cls.waitingList || cls.waitingList.length === 0)));
          if (!!classInBetterAuditorium) {
            let currentIndex = this.dailyClasses.findIndex(i => i.uid === c?.uid);
            let betterIndex = this.dailyClasses.findIndex(i => i.uid === classInBetterAuditorium?.uid);
            
            if (currentIndex !== -1 && betterIndex !== -1) {
              let currentParticipents = classInBetterAuditorium.participents;
              let currentWaitingList = classInBetterAuditorium.waitingList;

              this.dailyClasses[betterIndex].participents = this.dailyClasses[currentIndex].participents;
              this.dailyClasses[betterIndex].waitingList = this.dailyClasses[currentIndex].waitingList;
              this.dailyClasses[currentIndex].participents = currentParticipents;
              this.dailyClasses[currentIndex].waitingList = currentWaitingList;

              isClassChanged = true;
            }
          }
        }

        // class internal arrangement
        if ((c?.participents?.length < auditorium?.capacity) && (c?.waitingList?.length > 0)) {
          while ((c?.participents?.length < auditorium?.capacity) && (c.waitingList?.length > 0)) {
            let waitingP = c.waitingList.pop();
            if (!!waitingP) {
              c.participents.push(waitingP);
              this.sendMessageToWaitingParticipent(waitingP, c);

              isClassChanged = true;
            }
          }
        }
      }

      if (isClassChanged) {
        this.db.updateClass(c).pipe(first()).subscribe(() => {
          this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
          this.dateChanged(this.calendarActiveDate);
          this.isLoading = false;
        });
      }
    });

    this.isLoading = false;
  }

  addClass() {
    this.isLoading = true;
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

        if (this.classes.find(c => (moment(c.date).isSame(newClass.date, 'day')) && (c.hour === newClass.hour) && (c.auditorium === newClass.auditorium) )) {
          this.alert.ok('שגיאה', 'כבר קיים שיעור באולם זה בשעה זאת');
          this.isLoading = false;
        }
        else {
          this.db.createClass(newClass).pipe(first()).subscribe(() => {
            this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
            this.dateChanged(this.calendarActiveDate);
            this.isLoading = false;
          });
        }
      }
      else {
        this.isLoading = false;
      }
    });
  }

  addParticipent(c: Class): void {
    this.isLoading = true;
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
      else {
        this.isLoading = false;
      }
    });
  }

  removeParticipent(c: Class, participent: string): void {
    this.isLoading = true;
    c.participents = c.participents.filter(p => p !== participent);
    this.db.updateClass(c).pipe(first()).subscribe(() => {
      this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
      this.dateChanged(this.calendarActiveDate);
      this.isLoading = false;
    });
  }

  addWaitingList(c: Class): void {
    this.isLoading = true;
    const dialogRef = this.dialog.open(AddParticipentDialogComponent, {
      width: '50vw',
      height: '50vh',
      data: {
        title: `רישום משתתף לרשימת המתנה ${c.type} ב${this.dateFormatPipe.transform(c.date)} בשעה ${c.hour}:00`,
        class: c
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!!result) {
        let p = result['member'];
        this.addParticipentToWaitingList(c, p);
      }
      else {
        this.isLoading = false;
      }
    });
  }

  removeWaitingList(c: Class, participent: string): void {
    this.isLoading = true;
    c.waitingList = c.waitingList.filter(p => p !== participent);
    this.db.updateClass(c).pipe(first()).subscribe(() => {
      this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
      this.dateChanged(this.calendarActiveDate);
      this.isLoading = false;
    });
  }

  private addParticipentToClass(c: Class, participent: string): void {
    if (!!participent && this.canJoinClass(c)) {
        if (!c.participents) {
            c.participents = new Array<string>();
        }
        else if (c.participents.includes(participent)) {
          this.alert.ok('שגיאה', 'המנוי כבר צורף לשיעור המבוקש');
          this.isLoading = false;
          return;
        }
        
        c.participents.push(participent);
    }
    else {
        this.alert.ok('שגיאה', 'לא ניתן להוסיף את המנוי לשיעור המבוקש');
        this.isLoading = false;
        return;
    }

    this.db.updateClass(c).pipe(first()).subscribe(() => {
      this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
      this.dateChanged(this.calendarActiveDate);
      this.isLoading = false;
    });
  }

  private addParticipentToWaitingList(c: Class, participent: string): void {
    if (!!participent) {
        if (!!c.participents && !!c.participents.find(p => p === participent)) {
          this.alert.ok('שגיאה', 'המנוי משתתף בשיעור המבוקש');
          this.isLoading = false;
          return;
        }
        if (!c.waitingList) {
            c.waitingList = new Array<string>();
        }
        else if (c.waitingList.includes(participent)) {
          this.alert.ok('שגיאה', 'המנוי כבר צורף לרשימת הממתנה של השיעור המבוקש');
          this.isLoading = false;
          return;
        }

        c.waitingList.push(participent);
    }
    else {
        this.alert.ok('שגיאה','לא ניתן להוסיף את המנוי לרשימת הממתנה');
        this.isLoading = false;
        return;
    }

    this.db.updateClass(c).pipe(first()).subscribe(() => {
      this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
      this.dateChanged(this.calendarActiveDate);
      this.isLoading = false;
    });
  }

  private sendMessageToWaitingParticipent(participent: string, c: Class): void {
    let p: ClubMember | undefined = this.members.find(m => m.uid === participent);
    if (!!p) {
      Email.send({
        Host : environment.smtp.server,
        Username : environment.smtp.username,
        Password : environment.smtp.password,
        From : environment.smtp.username,
        To : p.email,
        Subject : `הודעה על שיבוץ לשיעור - הסטודיו לפילאטיס ויוגה`,
        Body : `היי ${p.name}, אנו שמחים להודיע לך כי שובצת לשיעור ${c.type} שייערך בתאריך ${this.dateFormatPipe.transform(c.date)} בשעה ${c.hour}:00`,
      });
    }
  }

  canJoinClass(c: Class): boolean {
    if (!c.auditorium) {
        this.alert.ok('שגיאה','השיעור לא שוייך לאף אולם');
        this.isLoading = false;
        return false;
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