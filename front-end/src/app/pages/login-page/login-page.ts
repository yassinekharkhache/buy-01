import {Component,inject,signal} from '@angular/core';
import {FormBuilder,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import { Auth } from '../../services/auth/auth';
import { SnackbarService } from '../../components/snackbar/snackbar.service';
import { Router } from '@angular/router';


@Component({
  imports: [ReactiveFormsModule],
  standalone: true,
  selector: 'app-login-page',
  styleUrl: './login-page.css',
  templateUrl: './login-page.html',
})

export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private auth = inject(Auth)
  private router = inject(Router)

  readonly mode = signal('login');
  readonly showPassword = signal(false);
  private snackbar = inject(SnackbarService);

  readonly loginForm = this.fb.group({
    name: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly roles: { value: string; label: string; hint: string }[] = [
    { value: 'CLIENT', label: 'CLIENT', hint: 'Browse and buy' },
    { value: 'SELLER', label: 'SELLER', hint: 'List and sell' },
  ];


  readonly registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      role:['CLIENT',[Validators.required]]
    },
  );

  setMode(mode: string): void {
    this.mode.set(mode);
    this.showPassword.set(false);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  hasError(form: FormGroup, name: string, error: string): boolean {
    const control = form.get(name);
    return !!control && control.touched && control.hasError(error);
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    var credentials = this.loginForm.getRawValue()
    //login will return ovservable
    this.auth.login(credentials.name,credentials.password).subscribe({
      next: (response) => {
        this.snackbar.error('Login successful')
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.snackbar.error(error)
        console.error('Login failed', error);
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    var credentials = this.registerForm.getRawValue()
    if(credentials.confirmPassword != credentials.password){
      this.snackbar.error("you must use the same password in the password confirmation")
      return
    }
    this.auth.register(credentials.name,credentials.email,credentials.password,credentials.role).subscribe({
      next: () => {
        this.snackbar.success('Login successful')
      },
      error: (error) => {
        this.snackbar.error(error.error)
        console.log(error.error)
        console.error('Login failed', error);
      }
    });
  }
}