import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { SessionStorageService } from '../session-storage-service';
import { ClubMember } from 'src/app/model/club-member';

@Component({
  selector: 'add-participent-dialog',
  templateUrl: './add-participent-dialog.component.html',
  styleUrls: ['./add-participent-dialog.component.scss']
})
export class AddParticipentDialogComponent {
  members!: ClubMember[];

  public form: FormGroup = new FormGroup({});

  constructor(
    private sessionStorageService: SessionStorageService,
    private dialogRef: MatDialogRef<AddParticipentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.members = JSON.parse(this.sessionStorageService.getItem('club-members'));
    this.form = new FormGroup({
      member: new FormControl(null, [Validators.required]),
    });
  }

  hasError = (controlName: string, errorName: string) => {
    return this.form?.controls[controlName].hasError(errorName);
  };

  cancel(): void {
    this.dialogRef.close();
  }
}
