import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { SessionStorageService } from '../session-storage-service';
import { Auditorium } from 'src/app/model/auditorium';

import * as moment from 'moment/moment';

@Component({
  selector: 'add-class-dialog',
  templateUrl: './add-class-dialog.component.html',
  styleUrls: ['./add-class-dialog.component.scss']
})
export class AddClassDialogComponent {
  auditoriums!: Auditorium[];
  hours: number[] = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  public form: FormGroup = new FormGroup({});

  constructor(
    private sessionStorageService: SessionStorageService,
    private dialogRef: MatDialogRef<AddClassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.auditoriums = JSON.parse(this.sessionStorageService.getItem('auditoriums'));
    this.form = new FormGroup({
      date: new FormControl(moment(this.data?.date).format("yyyy-MM-DD") ?? moment(new Date()).format("yyyy-MM-DD"), [Validators.required]),
      type: new FormControl(false, [Validators.nullValidator]),
      hour: new FormControl(null, [Validators.required]),
      auditorium: new FormControl(null, [Validators.required]),
    });
  }

  hasError = (controlName: string, errorName: string) => {
    return this.form?.controls[controlName].hasError(errorName);
  };

  cancel(): void {
    this.dialogRef.close();
  }
}
