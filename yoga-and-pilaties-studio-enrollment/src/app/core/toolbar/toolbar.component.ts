import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  fadeInOnEnterAnimation,
  fadeOutOnLeaveAnimation,
} from 'angular-animations';

import { DatabaseService } from '../database.service';
import { AuthService } from '../../auth/auth.service';
import { Admin } from 'src/app/model/admin';
import { ClubMember, MembershipType } from 'src/app/model/club-member';
import { Class } from 'src/app/model/class';

import * as moment from 'moment/moment';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

import { Auditorium } from 'src/app/model/auditorium';
import { SessionStorageService } from '../session-storage-service';
import { Teacher } from 'src/app/model/teacher';


const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
  animations: [fadeInOnEnterAnimation(), fadeOutOnLeaveAnimation()],
})
export class ToolbarComponent implements OnInit {
  loggedIn: boolean = false;
  isAdmin: boolean = false;
  isTeacher: boolean = false;
  isMember: boolean = false;
  auditoriums!: Auditorium[];
  members!: ClubMember[];

  name!: string;
  email!: string;

  constructor(
    public db: DatabaseService,
    public afAuth: AngularFireAuth,
    private authService: AuthService,
    private sessionStorageService: SessionStorageService,
  ) {
    this.auditoriums = JSON.parse(this.sessionStorageService.getItem('auditoriums'));
    this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));
  }

  exportClubMembers(): void {
      let json: ClubMember[] = this.members;
      json.forEach(m => {
        if (m.membershipType !== MembershipType.MONTHLY) {
          m.expirationDate = '';
        }
      });
    
      let stringified = JSON.stringify(json);
      stringified = stringified.replace(/memberSince/gm, "תאריך הצטרפות");
      stringified = stringified.replace(/membershipType/gm, "מזהה מנוי");
      stringified = stringified.replace(/expirationDate/gm, "תאריך סיום מנוי חודשי");
      stringified = stringified.replace(/entrancesLeft/gm, "כניסות שנשארו");
      stringified = stringified.replace(/uid/gm, "ת.ז");
      stringified = stringified.replace(/name/gm, "שם מנוי");
      stringified = stringified.replace(/email/gm, "אימייל");
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(JSON.parse(stringified));

      const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'דוח לקוחות הסטודיו');
  }

  exportClasses(): void {
    let classes = sessionStorage.getItem('classes');
    if (classes) {
      let json: Class[] = JSON.parse(classes);
      json.forEach(c => {
        c.date = moment(c.date).format('DD/MM/YYYY');
        c.participents = this.getParticipents(c).map(p => p.name).toString();
        c.auditorium = this.getAuditorium(c)?.name;
      });

      let stringified = JSON.stringify(json);
      stringified = stringified.replace(/uid/gm, "מזהה שיעור");
      stringified = stringified.replace(/date/gm, "תאריך");
      stringified = stringified.replace(/hour/gm, "שעת התחלה");
      stringified = stringified.replace(/type/gm, "סוג שיעור");
      stringified = stringified.replace(/auditorium/gm, "אולם");
      stringified = stringified.replace(/participents/gm, "משתתפים");
      stringified = stringified.replace(/waitingList/gm, "רשימת המתנה");
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(JSON.parse(stringified));

      const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'דוח שיעורי הסטודיו');
    }
  }

  getAuditorium(c: Class): Auditorium | undefined {
    return this.auditoriums.find(a => a.uid === c.auditorium);
  }

  getParticipents(c: Class): ClubMember[] {
    return this.members.filter(m => c.participents?.includes(m.uid));
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnInit(): void {
    const loadMember = sessionStorage.getItem('member');
    const loadAdmin = sessionStorage.getItem('admin');
    const loadTeacher = sessionStorage.getItem('teacher');

    if (!!loadAdmin) {
      const admin: Admin = JSON.parse(loadAdmin);
      this.name = admin.name;
      this.email = admin.email;

      this.isAdmin = true;
    }
    else if (!!loadTeacher) {
      const teacher: Teacher = JSON.parse(loadTeacher);
      this.name = teacher.name;
      this.email = teacher.email;

      this.isTeacher = true;
    }
    else if (!!loadMember) {
      const member: ClubMember = JSON.parse(loadMember);
      this.name = member.name;
      this.email = member.email;
      
      this.isMember = true;
    }

    if (!!loadAdmin || !!loadTeacher || !!loadMember) {
      this.loggedIn = true;
    }
  }
}
