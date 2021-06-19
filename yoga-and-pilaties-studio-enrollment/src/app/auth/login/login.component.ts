import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeInOnEnterAnimation } from 'angular-animations';

import { AuthService } from '../auth.service';

/**
 * Login page component.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [fadeInOnEnterAnimation()],
})
export class LoginComponent {
  logo: string = 'assets/logo.png';
  formGroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.formGroup = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.formGroup.invalid) {
      return;
    }

    this.authService.login(
      this.formGroup.get('email')?.value,
      this.formGroup.get('password')?.value
    );
  }
}