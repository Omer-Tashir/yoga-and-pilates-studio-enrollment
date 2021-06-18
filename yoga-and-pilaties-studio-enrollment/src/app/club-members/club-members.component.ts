import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { merge, Observable, of } from 'rxjs';

import { DatabaseService } from '../core/database.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AlertService } from '../core/alerts/alert.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ClubMember, MembershipType } from '../model/club-member';
import { SessionStorageService } from '../core/session-storage-service';

@Component({
  selector: 'app-club-members',
  templateUrl: './club-members.component.html',
  styleUrls: ['./club-members.component.scss']
})
export class ClubMembersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'email', 'membershipType', 'memberSince'];
  form: FormGroup = new FormGroup({});

  auth$!: Observable<any>;
  members!: ClubMember[];
  membershipTypes = MembershipType;

  dataSource!: MatTableDataSource<ClubMember>;
  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  sort: any;
  paginator: any;

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
      this.paginator = mp;
  }

  constructor(
    public afAuth: AngularFireAuth,
    private sessionStorageService: SessionStorageService, 
    private db: DatabaseService,
    private alert: AlertService
  ) { 
    this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  sortData(sort: Sort) {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a: ClubMember, b: ClubMember) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return this.compare(a.name, b.name, isAsc);
        case 'email': return this.compare(a.email, b.email, isAsc);
        case 'membershipType': return this.compare(a.membershipType, b.membershipType, isAsc);
        case 'memberSince': return this.compare(a.memberSince, b.memberSince, isAsc);
        default: return 0;
      }
    });
  }

  private compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  track(index: any, member: ClubMember) {
    return member.uid;
  }

  submit = (formValue: any) => {
    if (this.form?.valid) {
      this.afAuth.createUserWithEmailAndPassword(this.form.get('email')?.value, '123456').then(() => {
        this.db.createClubMember(Object.assign(formValue, new ClubMember())).subscribe(() => {
          this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));
          this.initDatasource(this.members);

          this.alert.ok('תודה רבה, קלטנו את פרטי המנוי בהצלחה', 'כעת ניתן לשבץ את המנוי לחוגים השונים');
          this.form.reset();
        });
      });
    }
  };

  hasError = (controlName: string, errorName: string) => {
    return this.form?.controls[controlName].hasError(errorName);
  };

  private initDatasource(data: ClubMember[]): void {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.filterPredicate = (member: ClubMember, filter: string) => {
      return JSON.stringify(member).indexOf(filter) != -1
    };
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.sortData({ active: 'name', direction: 'asc' });

    console.log(this.dataSource.data);
  }

  ngOnInit(): void {
    this.auth$ = this.afAuth.authState;

    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.email, Validators.required]),
      membershipType: new FormControl('', [Validators.required]),
      memberSince: new FormControl(new Date(), [Validators.required]),
    });
  }

  ngAfterViewInit(): void {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return of(this.members);
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = data === null;

          if (data === null) {
            return [];
          }

          this.resultsLength = data.length;
          return data;
        })
      ).subscribe(data => {
        this.initDatasource(data);
      });
  }
}