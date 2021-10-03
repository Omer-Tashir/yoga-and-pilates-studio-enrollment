import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';

import { AddParticipentDialogComponent } from '../core/add-participent-dialog/add-participent-dialog.component';
import { AddClassDialogComponent } from '../core/add-class-dialog/add-class-dialog.component';
import { DateFormatPipe } from '../core/date-formatter/date-formatter';
import { SessionStorageService } from '../core/session-storage-service';
import { DatabaseService } from '../core/database.service';
import { AlertService } from '../core/alerts/alert.service';
import { Auditorium } from '../model/auditorium';
import { ClubMember, MembershipType } from '../model/club-member';
import { Class, ClassType } from '../model/class';
import { Admin } from '../model/admin';

import { environment } from 'src/environments/environment';

import * as moment from 'moment/moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Message } from '../model/message';
import { MessageService } from '../core/message.service';
import { FormControl } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';

declare let Email: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  calendarActiveDate: Date = new Date();
  classes!: Class[];
  dailyClasses!: Class[];
  auditoriums!: Auditorium[];
  members!: ClubMember[];
  messages!: Message[];
  message = new FormControl(null);

  admin!: Admin;
  member!: ClubMember;

  isAdmin: boolean;
  isMember: boolean;
  isLoading = false;

  constructor(
    private db: DatabaseService,
    private sessionStorageService: SessionStorageService,
    private messageService: MessageService,
    private dateFormatPipe: DateFormatPipe,
    private alert: AlertService,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) { 
    this.admin = JSON.parse(this.sessionStorageService.getItem('admin'));
    this.member = JSON.parse(this.sessionStorageService.getItem('member'));
    this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
    this.auditoriums = JSON.parse(this.sessionStorageService.getItem('auditoriums'));
    this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));
    this.messages = JSON.parse(this.sessionStorageService.getItem('messages'));

    this.isAdmin = !!this.admin;
    this.isMember = !!this.member;
  }

  dateChanged(date: Date) {
    this.calendarActiveDate = date;
    this.dailyClasses = this.classes?.filter(c => moment(c.date).isSame(date, 'day')) ?? [];
  }

  private runAlgorithem() {
    this.isLoading = true;

    this.dailyClasses.forEach(c => {
      let isClassChanged = false;
      let auditorium = this.getAuditorium(c);
      let allAuditoriums = this.auditoriums;

      if(!!auditorium) {
        // auditorium arrangement
        let capacity = auditorium.capacity;
        let totalParticipents: number = (c.participents?.length ?? 0) + (c.waitingList?.length ?? 0);
        let betterAuditorium = allAuditoriums.find(a => ((a.capacity === capacity + 3) && (a.uid !== auditorium?.uid) && !!this.getClassInBetterAuditorium(c, a)));

        if ((c?.waitingList?.length > 0) && (!!betterAuditorium)) {
          // find if the better auditorium is available
          let classInBetterAuditorium = this.dailyClasses.find(cls => ((cls.uid !== c.uid) && (cls.auditorium === betterAuditorium?.uid) && (moment(cls.date).isSame(c.date, 'day')) && (cls.hour === c.hour) && (!cls.waitingList || cls.waitingList.length === 0)));

          if (!!classInBetterAuditorium && ((classInBetterAuditorium.participents?.length ?? 0) + (classInBetterAuditorium.waitingList?.length ?? 0) < totalParticipents)) {
            let currentIndex = this.dailyClasses.findIndex(i => i.uid === c?.uid);
            let betterIndex = this.dailyClasses.findIndex(i => i.uid === classInBetterAuditorium?.uid);
            
            if (currentIndex !== -1 && betterIndex !== -1) {
              let currentParticipents = classInBetterAuditorium.participents ?? [];
              let currentWaitingList = classInBetterAuditorium.waitingList ?? [];

              // check if need to move from participents to waiting list
              while (currentParticipents?.length > 0 && auditorium?.capacity < currentParticipents?.length) {
                let wp = currentParticipents.pop();
                if (!!wp) {
                  currentWaitingList.push(wp);
                }
              }

              this.dailyClasses[betterIndex].participents = this.dailyClasses[currentIndex].participents ?? [];
              this.dailyClasses[betterIndex].waitingList = this.dailyClasses[currentIndex].waitingList ?? [];
              this.dailyClasses[currentIndex].participents = currentParticipents ?? [];
              this.dailyClasses[currentIndex].waitingList = currentWaitingList ?? [];

              isClassChanged = true;
            }
          }
        }

        // class internal arrangement
        if ((c?.participents?.length < auditorium?.capacity) && (c?.waitingList?.length > 0)) {
          while ((c?.participents?.length < auditorium?.capacity) && (c.waitingList?.length > 0)) {
            let waitingP = c.waitingList.pop();
            if (!!waitingP) {
              if (!c.participents) {
                c.participents = new Array<string>();
              }
              c.participents.push(waitingP);
              this.sendMessageToWaitingParticipent(waitingP, c);

              isClassChanged = true;
            }
          }
        }
      }

      if (isClassChanged) {
        if (!c.participents) {
          c.participents = [];
        }
        if (!c.waitingList) {
          c.waitingList = [];
        }
        this.db.updateClass(c).pipe(first()).subscribe(() => {
          this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
          this.dateChanged(this.calendarActiveDate);
          this.isLoading = false;
        });
      }
    });

    this.isLoading = false;
  }

  private getClassInBetterAuditorium(c: Class, auditorium: Auditorium): Class | undefined {
    return this.dailyClasses.find(cls => ((cls.uid !== c.uid) && (cls.auditorium === auditorium?.uid) && (moment(cls.date).isSame(c.date, 'day')) && (cls.hour === c.hour) && (!cls.waitingList || cls.waitingList.length === 0)));
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
            this.runAlgorithem();
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

  addMyselfToClass(c: Class): void {
    if (this.member.membershipType === MembershipType.MONTHLY && (!!this.member.expirationDate && (moment(this.member.expirationDate).diff(new Date(), 'days') >= 0))) {
      this.addParticipentToClass(c, this.member.uid);
    }
    else if (this.member.membershipType !== MembershipType.MONTHLY && !!this.member.entrancesLeft) {
      this.addParticipentToClass(c, this.member.uid);
      this.addMemberEntrence();
    }
    else {
      this.alert.ok('שגיאה', 'יש לחדש את המנוי');
    }
  }

  isMyselfInClass(c: Class) {
    return (!!c.participents && !!c.participents.find((p: any) => p === this.member.uid));
  }

  isMyselfInWaitingList(c: Class) {
    return (!!c.waitingList && !!c.waitingList.find(p => p === this.member.uid));
  }

  removeParticipent(c: Class, participent: string): void {
    this.isLoading = true;
    c.participents = c.participents.filter((p:any) => p !== participent);
    this.db.updateClass(c).pipe(first()).subscribe(() => {
      this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
      this.dateChanged(this.calendarActiveDate);
      this.runAlgorithem();
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

  addMyselfToWaitingList(c: Class): void {
    this.addParticipentToWaitingList(c, this.member.uid);
  }

  removeWaitingList(c: Class, participent: string): void {
    this.isLoading = true;
    c.waitingList = c.waitingList.filter(p => p !== participent);
    this.db.updateClass(c).pipe(first()).subscribe(() => {
      this.classes = JSON.parse(this.sessionStorageService.getItem('classes'));
      this.dateChanged(this.calendarActiveDate);
      this.runAlgorithem();
    });
  }

  removeMyselfFromWaitingList(c: Class): void {
    this.removeWaitingList(c, this.member.uid);
  }

  removeMyselfFromClass(c: Class): void {
    // check if class can be cancelled (less than 6 hours from it)
    var now = moment();
    var date: Date = new Date(c.date);
    date.setHours(c.hour);
    var classDate = moment(date);
    
    if (now.diff(classDate, 'hours') <= 6) {
      this.alert.ok('שגיאה', 'לא ניתן לבטל השתתפות 6 שעות לפני מועד השיעור');
      return;
    }
    else {
      this.removeParticipent(c, this.member.uid);
      this.removeMemberEntrence();
    }
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
      this.runAlgorithem();
    });
  }

  private addParticipentToWaitingList(c: Class, participent: string): void {
    if (!!participent) {
      if (!!c.participents && !!c.participents.find((p: any) => p === participent)) {
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
      this.runAlgorithem();
    });
  }

  private sendMessageToWaitingParticipent(participent: string, c: Class): void {
    let p: ClubMember | undefined = this.members.find(m => m.uid === participent);
    if (!!p) {
      this.messageService.sendMessageToClubMember({
        memberUid: p.uid,
        message: `היי ${p.name}, אנו שמחים להודיע לך כי שובצת לשיעור ${c.type} שייערך בתאריך ${this.dateFormatPipe.transform(c.date)} בשעה ${c.hour}:00`
      } as Message).pipe(first()).subscribe();
    }
  }

  private addMemberEntrence(): void {
    if (this.member.membershipType !== MembershipType.MONTHLY) {
      if (!!this.member.entrancesLeft) {
        this.member.entrancesLeft-=1;
        this.db.updateMember(this.member).pipe(first()).subscribe(() => {
          this.member = JSON.parse(this.sessionStorageService.getItem('member'));
          this.runAlgorithem();
        });
      }
    }
  }

  private removeMemberEntrence(): void {
    if (this.member.membershipType !== MembershipType.MONTHLY) {
      if (this.member.entrancesLeft !== undefined) {
        this.member.entrancesLeft+=1;
        this.db.updateMember(this.member).pipe(first()).subscribe(() => {
          this.member = JSON.parse(this.sessionStorageService.getItem('member'));
          this.runAlgorithem();
        });
      }
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

  sendMessageToClass(c: Class, message: string): void {
    let forkArr: Observable<string>[] = [];
    if (c?.participents && message) {
      for (let i = 0; i < c.participents.length; i++) {
        forkArr.push(
          this.messageService.sendMessageToClubMember({
            memberUid: c.participents[i],
            message
          } as Message
          ).pipe(first())
        );
      }

      forkJoin(forkArr).subscribe(() => {
        this.alert.ok('ההודעה נשלחה בהצלחה', '');
      });

      this.message.reset();
    }
  }

  ngOnInit(): void {
    this.dateChanged(new Date());
    if (this.member && this.messages) {
      this.messages.filter(msg => msg.memberUid === this.member.uid).forEach(m => {
        this._snackBar.open(`${m.message}`, 'סגור', {
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });

        this.messageService.removeMessage(m).pipe(first()).subscribe();
      });
    }
  }

  ngAfterViewInit(): void {
    this.runAlgorithem();
  }
}