import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import * as moment from 'moment/moment';
import { DatabaseService } from '../database.service';

@Component({
  selector: 'add-class-dialog',
  templateUrl: './add-class-dialog.component.html',
  styleUrls: ['./add-class-dialog.component.scss']
})
export class AddClassDialogComponent {
  auditoriums$ = this.db.getAuditoriums();

  public form: FormGroup = new FormGroup({});

  constructor(
    private db: DatabaseService,
    private dialogRef: MatDialogRef<AddClassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = new FormGroup({
      date: new FormControl(moment(this.data?.date).format("yyyy-MM-DD") ?? moment(new Date()).format("yyyy-MM-DD"), [Validators.required]),
      type: new FormControl(false, [Validators.nullValidator]),
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
