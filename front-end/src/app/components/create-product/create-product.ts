import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductApi } from '../../services/product-api/product-api';
import { AddProductRequest } from '../../services/product-api/product.models';
import { CATEGORY_OPTIONS, ProductCategory } from '../../services/product-api/product-category';

const MAX_IMAGES = 6;
const POSITIONS = [1, 2, 3, 4, 5, 6] as const; // backend positions are 1-based
const SNACK_MS = 5000;
const LABELS = {
  name: 'Name',
  category: 'Category',
  description: 'Description',
  price: 'Price',
  quantity: 'Quantity',
} as const;

type Field = keyof typeof LABELS;
type UploadStatus = 'uploading' | 'done' | 'error' | 'deleting';
type SessionState = 'loading' | 'ready' | 'failed';

interface ProductImage {
  key: string;
  position: number;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  serverId: string | null;
}

interface Snack {
  kind: 'success' | 'fail';
  text: string;
}

const notBlank: ValidatorFn = (control) =>
  String(control.value ?? '').trim() ? null : { required: true };

const wholeNumber: ValidatorFn = (control) =>
  control.value === null || Number.isInteger(control.value) ? null : { integer: true };

@Component({
  selector: 'app-create-product',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-product.html',
  styleUrl: './create-product.css',
})
export class CreateProduct {
  private readonly api = inject(ProductApi);
  private readonly destroyRef = inject(DestroyRef);

  private nextKey = 0;
  private snackTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly maxImages = MAX_IMAGES;
  protected readonly categories = CATEGORY_OPTIONS;

  // The session lives only in this component: refresh or leaving the route drops it.
  protected readonly sessionId = signal<string | null>(null);
  protected readonly sessionState = signal<SessionState>('loading');

  protected readonly images = signal<ProductImage[]>([]);
  private readonly coverPosition = signal<number | null>(null);

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly snack = signal<Snack | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.minLength(3), Validators.maxLength(70)],
    }),
    category: new FormControl<ProductCategory | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.minLength(10), Validators.maxLength(500)],
    }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(1_000_000)],
    }),
    quantity: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(1_000_000), wholeNumber],
    }),
  });

  protected readonly sortedImages = computed(() =>
    [...this.images()].sort((a, b) => a.position - b.position),
  );

  private readonly doneImages = computed(() =>
    this.images().filter((image) => image.status === 'done'),
  );

  protected readonly pendingCount = computed(
    () =>
      this.images().filter((image) => image.status === 'uploading' || image.status === 'deleting')
        .length,
  );

  // Cover = the chosen image, otherwise the lowest-position uploaded image.
  protected readonly cover = computed<number | null>(() => {
    const done = this.doneImages();
    const chosen = this.coverPosition();
    if (chosen !== null && done.some((image) => image.position === chosen)) return chosen;
    return done.length ? Math.min(...done.map((image) => image.position)) : null;
  });

  protected readonly canCreate = computed(
    () =>
      this.sessionId() !== null &&
      this.pendingCount() === 0 &&
      this.doneImages().length > 0 &&
      !this.submitting(),
  );

  protected readonly hint = computed(() => {
    if (this.pendingCount() > 0) return 'Waiting for images to finish…';
    if (this.doneImages().length === 0) return 'Add at least one image to continue.';
    return '';
  });

  constructor() {
    // Browser only: the request needs the stored token.
    afterNextRender(() => this.startSession());

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.snackTimer);
      this.images().forEach((image) => URL.revokeObjectURL(image.previewUrl));
    });
  }

  protected retrySession(): void {
    this.startSession();
  }

  protected onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    input.value = ''; // lets the same file be picked again

    if (!this.sessionId() || picked.length === 0) return;

    const files = picked.filter((file) => file.type.startsWith('image/'));
    if (files.length < picked.length) this.notify('fail', 'Only image files can be uploaded.');

    const used = new Set(this.images().map((image) => image.position));
    const free = POSITIONS.filter((position) => !used.has(position));
    if (files.length > free.length) this.notify('fail', `You can add up to ${MAX_IMAGES} images.`);

    const added = files.slice(0, free.length).map(
      (file, index): ProductImage => ({
        key: `image-${this.nextKey++}`,
        position: free[index],
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'uploading',
        serverId: null,
      }),
    );
    if (added.length === 0) return;

    this.images.update((list) => [...list, ...added]);
    added.forEach((image) => this.upload(image));
  }

  protected retry(image: ProductImage): void {
    this.patch(image.key, { status: 'uploading' });
    this.upload(image);
  }

  protected setCover(image: ProductImage): void {
    this.coverPosition.set(image.position);
  }

  protected remove(image: ProductImage): void {
    if (image.serverId === null) {
      this.dropLocal(image);
      return;
    }

    const wasCover = this.cover() === image.position;
    this.patch(image.key, { status: 'deleting' });

    this.api
      .deleteImage(image.serverId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.dropLocal(image);
          if (wasCover) this.coverPosition.set(this.lowestDonePosition());
        },
        error: () => {
          this.patch(image.key, { status: 'done' });
          this.notify('fail', 'Could not remove the image. Try again.');
        },
      });
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    const sessionId = this.sessionId();
    const cover = this.cover();
    if (this.form.invalid || !sessionId || cover === null || !this.canCreate()) return;

    const value = this.form.getRawValue();
    if (value.category === '') return;

    const body: AddProductRequest = {
      name: value.name.trim(),
      category: value.category,
      description: value.description.trim(),
      price: Number(value.price),
      quantity: Number(value.quantity),
      uploadSessionId: sessionId,
      mainPicPosition: cover,
    };

    this.submitting.set(true);

    this.api
      .createProduct(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notify('success', 'Product created successfully.');
          this.resetPage();
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.notify('fail', this.errorText(error, 'Could not create the product.'));
        },
      });
  }

  // Template helper: one message per field, shown after touch or submit.
  protected message(field: Field): string | null {
    const control = this.form.controls[field];
    const errors = control.errors;
    if (!errors || !(control.touched || this.submitted())) return null;

    const label = LABELS[field];
    if (errors['required']) return `${label} is required`;
    if (errors['minlength']) return `${label} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${label} must be at most ${errors['maxlength'].requiredLength} characters`;
    if (errors['integer']) return `${label} must be a whole number`;
    if (errors['min']) return field === 'price' ? 'Price must be positive' : 'Quantity cannot be negative';
    if (errors['max']) return `${label} must not exceed 1,000,000`;
    return `${label} is not valid`;
  }

  private startSession(): void {
    this.sessionState.set('loading');
    this.sessionId.set(null);

    this.api
      .createUploadSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.sessionId.set(session.id);
          this.sessionState.set('ready');
        },
        error: (error: unknown) => {
          console.error('Upload session failed', error);
          this.sessionState.set('failed');
          this.notify('fail', this.errorText(error, 'Could not start the upload session.'));
        },
      });
  }

  private upload(image: ProductImage): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      this.patch(image.key, { status: 'error' });
      return;
    }

    this.api
      .uploadImage(sessionId, image.file, image.position)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.patch(image.key, { status: 'done', serverId: response.id }),
        error: (error: unknown) => {
          console.error('Image upload failed', error);
          this.patch(image.key, { status: 'error' });
          this.notify('fail', this.errorText(error, 'Image upload failed.'));
        },
      });
  }

  private patch(key: string, changes: Partial<ProductImage>): void {
    this.images.update((list) =>
      list.map((image) => (image.key === key ? { ...image, ...changes } : image)),
    );
  }

  private dropLocal(image: ProductImage): void {
    URL.revokeObjectURL(image.previewUrl);
    this.images.update((list) => list.filter((item) => item.key !== image.key));
  }

  private lowestDonePosition(): number | null {
    const done = this.doneImages();
    return done.length ? Math.min(...done.map((image) => image.position)) : null;
  }

  private resetPage(): void {
    this.images().forEach((image) => URL.revokeObjectURL(image.previewUrl));
    this.images.set([]);
    this.coverPosition.set(null);
    this.form.reset();
    this.submitted.set(false);
    this.startSession(); // the previous session was consumed by the product
  }

  private notify(kind: Snack['kind'], text: string): void {
    clearTimeout(this.snackTimer);
    this.snack.set({ kind, text });
    this.snackTimer = setTimeout(() => this.snack.set(null), SNACK_MS);
  }

  private errorText(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;

    if (error.status === 0) return `${fallback} Server unreachable (network, CORS or wrong URL).`;
    if (error.status === 413) return `${fallback} File too large for the server (413).`;
    if (typeof error.error?.message === 'string') return error.error.message;
    if (error.status === 401 || error.status === 403) return `${fallback} Not authorized (${error.status}).`;
    if (error.status === 404) return `${fallback} Endpoint not found (404).`;
    return `${fallback} Server returned ${error.status}.`;
  }
}