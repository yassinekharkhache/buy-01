import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {LoginCredentials, LoginResponse, RegisterCredentials, User} from './auth.models'
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../envirement/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class Auth {
    private readonly http = inject(HttpClient);

  private readonly BaseUrl = environment.apiUrl;

  // Current authenticated user.
  private readonly currentUser = signal<User | null>(null);
  private readonly platformId = inject(PLATFORM_ID);
  
  readonly user = this.currentUser.asReadonly();

  readonly role = computed(() => this.user()?.role ?? null);

  readonly name = computed(() => this.user()?.name ?? '');

  readonly email = computed(() => this.user()?.email ?? '');

  readonly id = computed(() => this.user()?.id ?? null);

  // Store the JWT after successful login.
  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('access_token');
  }

  // Fetch the authenticated user's information.
    // Load authenticated user
  loadMe(): Observable<User> {
    return this.http
      .get<User>(`${this.BaseUrl}/api/auth/me`)
      .pipe(
        tap(user => this.currentUser.set(user))
      );
  }

  // Used by guards to check the user's role.
  hasRole(role: User['role']): boolean {
    return this.currentUser()?.role === role;
  }

  // Clear authentication data.
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
    }
    this.currentUser.set(null);
  }

    // Log in and store the returned JWT.
  login(name: string, password: string): Observable<LoginResponse> {
    const credentials: LoginCredentials = { name, password };

    return this.http
      .post<LoginResponse>(`${this.BaseUrl}/api/auth/login`, credentials)
      .pipe(
        tap(response => this.setToken(response.token))
      );
  }

  register(name: string, email: string, password: string, role: string){
    const credentials: RegisterCredentials= {name, email,password,role}
    return this.http
    .post<any>(`${this.BaseUrl}/api/auth/register`, credentials)
    .pipe(
      tap(response => this.setToken(response.token) )
    );
  }
  
}
