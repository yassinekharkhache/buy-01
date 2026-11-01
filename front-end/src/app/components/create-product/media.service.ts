import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
// Adjust the path to your environments folder
import { environment } from '../../../envirement/environment';

/** The backend may answer with `sessionId` or `id`; both are handled. */
interface UploadSessionResponse {
  sessionId?: string;
  id?: string;
}

/** Response of POST /upload-sessions/{sessionId}/images */
export interface UploadedImageResponse {
  /** Image name on the server. Used for the preview URL and for DELETE /images/{id} */
  id: string;
  sessionId: string;
  position: number;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.mediaApiUrl;

  /** POST {mediaApiUrl}/upload-sessions -> session id */
  createSession(): Observable<string> {
    return this.http.post<UploadSessionResponse>(`${this.base}/api/media/upload-sessions`, {}).pipe(
      map((res) => {
        const id = res.sessionId ?? res.id;
        if (!id) throw new Error('Upload session id missing from response.');
        return id;
      }),
    );
  }

  /**
   * POST {mediaApiUrl}/upload-sessions/{sessionId}/images
   * Emits progress events, then a final response event (the "confirmed" signal).
   * Multipart fields:
   *  - `file`     the image (change the name if your backend expects another one)
   *  - `position` zero-based position of the image; 0 means it is the cover
   */
  uploadImage(
    sessionId: string,
    file: File,
    position: number,
  ): Observable<HttpEvent<UploadedImageResponse>> {
    const data = new FormData();
    data.append('file', file, file.name);
    data.append('position', String(position));
    return this.http.post<UploadedImageResponse>(
      `${this.base}/api/media/upload-sessions/${encodeURIComponent(sessionId)}/images`,
      data,
      { reportProgress: true, observe: 'events' },
    );
  }

  /** Server preview of an uploaded image: {mediaBaseUrl}/product/tmp/{id} */
  previewUrl(imageId: string): string {
    return `${environment.mediaApiUrl}/product/tmp/${encodeURIComponent(imageId)}`;
  }

  /** DELETE {mediaApiUrl}/images/{imageId} */
  deleteImage(imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/images/${encodeURIComponent(imageId)}`);
  }
}