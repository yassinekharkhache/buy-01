import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../envirement/environment';
import { NewJWT } from './profile.models';


@Injectable({ providedIn: 'root' })
export class ProfileApi {

    private readonly http = inject(HttpClient);

    private readonly base = environment.apiUrl;

    updateProfile(data: {name?: string, email?: string, password?: string, currentPassword?: string}): Observable<NewJWT> {
        return this.http.put<NewJWT>(this.base+"/api/auth/me", data);
    }

    getProfilePicture(userId: string): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}/profile/${encodeURIComponent(userId)}`, {
            responseType: 'blob',
        });
    }

    uploadProfilePicture(file: File): Observable<void> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<void>(`${environment.apiUrl}/api/media/profile`, formData);
    }
}
