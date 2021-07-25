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
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);

      worksheet['A1'].v = "שם המנוי";
      worksheet['B1'].v = "תאריך סיום המנוי";
      worksheet['C1'].v = "הצטרף בתאריך";
      worksheet['D1'].v = "אימייל";
      worksheet['E1'].v = "מזהה מנוי";
      worksheet['F1'].v = "כניסות שנשארו";
      worksheet['G1'].v = "סוג מנוי";

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
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);

      worksheet['A1'].v = "משתתפים";
      worksheet['B1'].v = "שעת התחלה";
      worksheet['C1'].v = "תאריך";
      worksheet['D1'].v = "מזהה שיעור";
      worksheet['E1'].v = "אולם";
      worksheet['F1'].v = "סוג השיעור";

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
