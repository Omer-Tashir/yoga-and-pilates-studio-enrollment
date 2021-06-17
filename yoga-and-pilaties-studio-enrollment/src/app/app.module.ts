// Angular Core Modules
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';

// Angular Material Modules
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from './core/custom.mat.paginator.intl';
import { CustomMaterialModule } from './core/material.module';

// Third party library modules
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

// Firebase
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { environment } from '../environments/environment';

// Application modules
import { AppRoutingModule } from './app-routing.module';
import { AuthRoutingModule } from './auth/auth-routing.module';

// Main component
import { AppComponent } from './app.component';

// Pipes
import {
  DateFormatPipe,
  DateTimeFormatPipe,
  YearDateFormatPipe,
  TimeFormatPipe,
} from './core/date-formatter/date-formatter';
import { ArraySortPipe } from './core/sort.pipe';

// Core components
import { OkSnackComponent } from './core/alerts/ok-snack.component';
import { BadRequestSnackComponent } from './core/alerts/bad-request-snack.component';
import { HttpErrorSnackComponent } from './core/alerts/http-error-snack.component';
import { HttpDownSnackComponent } from './core/alerts/http-down-snack.component';
import { InvalidRequestSnackComponent } from './core/alerts/invalid-request-snack.component';
import { ConflictSnackComponent } from './core/alerts/conflict-snack.component';
import { NotFoundSnackComponent } from './core/alerts/not-found-snack.component';
import { WarningDialogComponent } from './core/warning-dialog/warning-dialog.component';

// Shared presentation components and supporting services
import { ToolbarComponent } from './core/toolbar/toolbar.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { CalendarComponent } from './calendar/calendar.component';
import { AddClassDialogComponent } from './core/add-class-dialog/add-class-dialog.component';

export const CUSTOM_DATE_FORMAT = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    ToolbarComponent,
    WarningDialogComponent,
    InvalidRequestSnackComponent,
    ConflictSnackComponent,
    NotFoundSnackComponent,
    OkSnackComponent,
    BadRequestSnackComponent,
    HttpDownSnackComponent,
    HttpErrorSnackComponent,
    ArraySortPipe,
    DateFormatPipe,
    YearDateFormatPipe,
    DateTimeFormatPipe,
    TimeFormatPipe,
    CalendarComponent,
    AddClassDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    CustomMaterialModule,
    NgxMaterialTimepickerModule,
    AuthRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features
    AngularFireStorageModule,
  ],
  entryComponents: [
    OkSnackComponent,
    BadRequestSnackComponent,
    HttpDownSnackComponent,
    HttpErrorSnackComponent,
    InvalidRequestSnackComponent,
    ConflictSnackComponent,
    NotFoundSnackComponent,
    WarningDialogComponent,
    AddClassDialogComponent,
  ],
  providers: [
    ArraySortPipe,
    DateFormatPipe,
    YearDateFormatPipe,
    DateTimeFormatPipe,
    TimeFormatPipe,
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'he' },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMAT },
    { provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
