import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal} from '@angular/core';

import { HttpEventType } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription, finalize, of, shareReplay, switchMap, tap } from 'rxjs';
import { SnackbarService } from '../../components/snackbar/snackbar.service';
import { MediaService } from './media.service';
import { ProductService } from './product.service';

export type ImageStatus = 'uploading' | 'confirmed' | 'error' | 'deleting';

export interface ImageItem {
  id: number;
  file: File;
  previewUrl: string;
  status: ImageStatus;
  progress: number;
  /** Set once the backend has confirmed the upload */
  imageId?: string;
}

export interface ImageItem {
  id: number;
  file: File;
  previewUrl: string;
  serverUrl?: string;
  status: ImageStatus;
  progress: number;
  imageId?: string;
}

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB each
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-create-product',
  imports: [ReactiveFormsModule],
  templateUrl: './create-product.html',
  styleUrl: './create-product.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProduct {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly media = inject(MediaService);
  private readonly productApi = inject(ProductService);
  private readonly snackbar = inject(SnackbarService);

  readonly maxImages = MAX_IMAGES;
  readonly currency = '$'; // change to your currency symbol

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    quantity: this.fb.control<number | null>(1, [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d+$/),
    ]),
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  // ---- images ----
  private nextId = 0;
  private readonly uploads = new Map<number, Subscription>();
  private sessionId: string | null = null;
  private session$: Observable<string> | null = null;

  readonly images = signal<ImageItem[]>([]);
  readonly imageError = signal<string | null>(null);
  readonly dragging = signal(false);
  readonly saving = signal(false);

  readonly slotsLeft = computed(() => MAX_IMAGES - this.images().length);
  readonly canAddMore = computed(() => this.slotsLeft() > 0);

  /**
   * empty   -> no image yet
   * pending -> something is still uploading or being removed
   * failed  -> at least one upload failed (not confirmed by the backend)
   * ready   -> every image is confirmed
   */
  readonly uploadState = computed<'empty' | 'pending' | 'failed' | 'ready'>(() => {
    const list = this.images();
    if (list.length === 0) return 'empty';
    if (list.some((i) => i.status === 'error')) return 'failed';
    if (list.some((i) => i.status !== 'confirmed')) return 'pending';
    return 'ready';
  });

  /** The create button is disabled unless at least one image exists and all are confirmed. */
  readonly canSubmit = computed(() => this.uploadState() === 'ready' && !this.saving());

  readonly submitHint = computed(() => {
    switch (this.uploadState()) {
      case 'empty':
        return 'Add at least one photo to continue.';
      case 'pending':
        return 'Waiting for your photos to finish uploading…';
      case 'failed':
        return 'Some photos failed to upload. Retry or remove them.';
      default:
        return null;
    }
  });

  constructor() {
    // Leaving the page without saving: free the uploaded images on the server
    inject(DestroyRef).onDestroy(() => this.discardRemote());
  }

  // ---------- upload session ----------
  /** Creates the upload session once; parallel uploads share the same request. */
  private ensureSession(): Observable<string> {
    if (this.sessionId) return of(this.sessionId);

    this.session$ ??= this.media.createSession().pipe(
      tap((id) => (this.sessionId = id)),
      finalize(() => (this.session$ = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.session$;
  }

  // ---------- image handling ----------
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // allow picking the same file again
    this.addFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.canAddMore()) this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  private addFiles(files: File[]): void {
    if (!files.length) return;

    let error: string | null = null;
    const accepted: File[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        error = 'Only JPG, PNG or WebP images are allowed.';
      } else if (file.size > MAX_IMAGE_BYTES) {
        error = 'Each image must be 5 MB or smaller.';
      } else {
        accepted.push(file);
      }
    }

    const room = this.slotsLeft();
    if (accepted.length > room) {
      error = `You can add up to ${MAX_IMAGES} photos. Extra files were ignored.`;
    }

    const items: ImageItem[] = accepted.slice(0, room).map((file) => ({
      id: ++this.nextId,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0,
    }));

    this.images.update((list) => [...list, ...items]);
    this.imageError.set(error);

    items.forEach((item) => this.upload(item));
  }

  private upload(item: ImageItem): void {
    this.patch(item.id, { status: 'uploading', progress: 0 });

    const sub = this.ensureSession()
      .pipe(
        // position is read when the request fires, so it matches the current order (0 = cover)
        switchMap((sessionId) =>
          this.media.uploadImage(sessionId, item.file, this.positionOf(item.id)),
        ),
        finalize(() => this.uploads.delete(item.id)),
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.patch(item.id, { progress: Math.round((100 * event.loaded) / event.total) });
          } else if (event.type === HttpEventType.Response) {
            // Confirmed by the backend: it answers with the image id (its file name)
            const imageId = event.body?.id;
            this.patch(
              item.id,
              imageId
                ? {
                    status: 'confirmed',
                    progress: 100,
                    imageId,
                    serverUrl: this.media.previewUrl(imageId),
                  }
                : { status: 'error' },
            );
          }
        },
        error: () => this.patch(item.id, { status: 'error' }),
      });

    this.uploads.set(item.id, sub);
  }

  /** Zero-based index of an image in the list. Position 0 is the cover. */
  private positionOf(id: number): number {
    return Math.max(0, this.images().findIndex((i) => i.id === id));
  }

  /** If the server preview cannot be loaded, fall back to the local preview. */
  useLocalPreview(id: number): void {
    this.patch(id, { serverUrl: undefined });
  }

  retry(id: number): void {
    const item = this.images().find((i) => i.id === id);
    if (item?.status === 'error') this.upload(item);
  }

  removeImage(id: number): void {
    const item = this.images().find((i) => i.id === id);
    if (!item || item.status === 'deleting') return;

    // Cancel an upload that is still running
    this.uploads.get(id)?.unsubscribe();
    this.uploads.delete(id);
    this.imageError.set(null);

    if (item.status === 'confirmed' && item.imageId) {
      this.patch(id, { status: 'deleting' });
      this.media.deleteImage(item.imageId).subscribe({
        next: () => this.dropLocal(id),
        error: () => {
          this.patch(id, { status: 'confirmed' });
          this.snackbar.error('Could not remove the photo. Please try again.');
        },
      });
    } else {
      this.dropLocal(id);
    }
  }

  makeCover(id: number): void {
    this.images.update((list) => {
      const picked = list.find((i) => i.id === id);
      return picked ? [picked, ...list.filter((i) => i.id !== id)] : list;
    });
  }

  private patch(id: number, changes: Partial<ImageItem>): void {
    this.images.update((list) => list.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  }

  private dropLocal(id: number): void {
    const item = this.images().find((i) => i.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    this.images.update((list) => list.filter((i) => i.id !== id));
  }

  // ---------- form ----------
  touched(name: 'name' | 'price' | 'quantity' | 'description'): boolean {
    return this.form.controls[name].touched;
  }

  save(): void {
    if (!this.canSubmit()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const imageIds = this.images().flatMap((i) => (i.imageId ? [i.imageId] : []));

    this.saving.set(true);
    this.productApi
      .create({
        name: value.name.trim(),
        price: Number(value.price),
        quantity: Number(value.quantity),
        description: value.description.trim(),
        uploadSessionId: this.sessionId ?? '',
        imageIds,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.success('Product created.');
          // Images now belong to the product, so only reset locally (no deletes)
          this.resetLocal();
        },
        error: (err) => {
          this.saving.set(false);
          console.log(err)
          this.snackbar.error('Could not create the product. Please try again.');
        },
      });
  }

  /** "Clear" button: also deletes the uploaded images from the server. */
  clear(): void {
    this.discardRemote();
    this.resetLocal();
  }

  /** Best-effort cleanup of images that were uploaded but never attached to a product. */
  private discardRemote(): void {
    this.uploads.forEach((sub) => sub.unsubscribe());
    this.uploads.clear();

    this.images().forEach((img) => {
      if (img.imageId) {
        this.media.deleteImage(img.imageId).subscribe({ error: () => undefined });
      }
    });
  }

  private resetLocal(): void {
    this.images().forEach((i) => URL.revokeObjectURL(i.previewUrl));
    this.images.set([]);
    this.imageError.set(null);
    this.sessionId = null; // the next upload starts a fresh session
    this.session$ = null;
    this.form.reset({ name: '', price: null, quantity: 1, description: '' });
  }
}
