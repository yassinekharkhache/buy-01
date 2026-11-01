import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProfileUser {
  name: string;
  email: string;
  avatar?: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/**
 * Adjust the endpoints to match your backend.
 * - PATCH /api/users/me          multipart/form-data with any of: name, email, avatar (file)
 * - POST  /api/users/me/password JSON { currentPassword, newPassword }
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/users/me';

  updateProfile(data: FormData): Observable<ProfileUser> {
    return this.http.patch<ProfileUser>(this.base, data);
  }

  changePassword(body: ChangePasswordBody): Observable<void> {
    return this.http.post<void>(`${this.base}/password`, body);
  }
}