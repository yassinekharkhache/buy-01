// import { Component } from '@angular/core';

// @Component({
//   imports: [],
//   selector: 'app-profile',
//   styleUrl: './profile.css',
//   templateUrl: './profile.html',
// })
// export class Profile {}
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { forkJoin, Observable } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { SnackbarService } from '../../components/snackbar/snackbar.service';
import { ProfileService } from './profile.service';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

/** Password fields are optional, but if any is filled the whole set must be valid. */
function passwordRules(group: AbstractControl): ValidationErrors | null {
  const current = group.get('currentPassword')?.value as string;
  const next = group.get('newPassword')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;

  if (!current && !next && !confirm) return null;

  const errors: ValidationErrors = {};
  if (!current) errors['currentRequired'] = true;
  if (!next) errors['newRequired'] = true;
  else if (next.length < 8) errors['newShort'] = true;
  if (next !== confirm) errors['mismatch'] = true;

  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(Auth);
  private readonly profileApi = inject(ProfileService);
  private readonly snackbar = inject(SnackbarService);

  readonly user = this.auth.user;

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: [''],
    },
    { validators: passwordRules },
  );

  // ---- avatar ----
  readonly avatarFile = signal<File | null>(null);
  readonly avatarPreview = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);

  readonly avatarUrl = computed(() => {
    const current = (this.user() as unknown as { avatar?: string } | null)?.avatar;
    return this.avatarPreview() ?? current ?? null;
  });

  readonly initial = computed(() => (this.user()?.name?.trim().charAt(0) || '?').toUpperCase());

  // ---- ui state ----
  readonly saving = signal(false);
  readonly showPasswords = signal(false);

  constructor() {
    // Fill the form whenever the signed-in user changes
    effect(() => {
      const u = this.user();
      if (!u) return;
      untracked(() => {
        this.form.patchValue({ name: u.name ?? '', email: u.email ?? '' });
        this.form.markAsPristine();
      });
    });

    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  // ---------- avatar ----------
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the user re-pick the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      this.avatarError.set('Image must be 2 MB or smaller.');
      return;
    }

    this.avatarError.set(null);
    this.revokePreview();
    this.avatarFile.set(file);
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  discardAvatar(): void {
    this.revokePreview();
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  private revokePreview(): void {
    const url = this.avatarPreview();
    if (url) URL.revokeObjectURL(url);
  }

  // ---------- form ----------
  togglePasswords(): void {
    this.showPasswords.update((v) => !v);
  }

  touched(name: string): boolean {
    return !!this.form.get(name)?.touched;
  }

  hasChanges(): boolean {
    return this.form.dirty || this.avatarFile() !== null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const current = this.user();
    const name = value.name.trim();
    const email = value.email.trim();

    // Send only what actually changed
    const data = new FormData();
    if (name !== (current?.name ?? '')) data.append('name', name);
    if (email !== (current?.email ?? '')) data.append('email', email);
    const file = this.avatarFile();
    if (file) data.append('avatar', file);

    const profileChanged = [...data.keys()].length > 0;
    const passwordChanged = !!value.newPassword;

    if (!profileChanged && !passwordChanged) {
      this.snackbar.info('Nothing to save.');
      return;
    }

    const requests: Observable<unknown>[] = [];
    if (profileChanged) requests.push(this.profileApi.updateProfile(data));
    if (passwordChanged) {
      requests.push(
        this.profileApi.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        }),
      );
    }

    this.saving.set(true);
    forkJoin(requests).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success('Profile updated.');
        this.discardAvatar();
        this.form.patchValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        // TODO: refresh the signed-in user in your Auth service so the sidebar updates,
        // e.g. this.auth.refreshUser() or set the user signal with the API response.
      },
      error: () => {
        this.saving.set(false);
        this.snackbar.error('Could not save your changes. Please try again.');
      },
    });
  }

  resetForm(): void {
    const u = this.user();
    this.form.reset({
      name: u?.name ?? '',
      email: u?.email ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    this.discardAvatar();
  }
}