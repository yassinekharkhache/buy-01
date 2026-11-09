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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { Auth } from '../../services/auth/auth';
import { SnackbarService } from '../../components/snackbar/snackbar.service';
import { ProfileApi } from '../../services/profile-api/profile-api';

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
  private readonly snackbar = inject(SnackbarService);
  private readonly profileApi = inject(ProfileApi);
  private readonly destroyRef = inject(DestroyRef);

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

  // ---- avatar (saved on its own, separate from the details form) ----
  readonly avatarFile = signal<File | null>(null);
  readonly avatarPreview = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);
  readonly uploadingAvatar = signal(false);

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

    this.destroyRef.onDestroy(() => this.revokePreview());
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

  uploadAvatar(): void {
    const file = this.avatarFile();
    if (!file || this.uploadingAvatar()) return;

    this.uploadingAvatar.set(true);

    this.profileApi
      .uploadProfilePicture(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Refresh the signed-in user first, then drop the local preview.
          this.auth
            .loadMe()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.finishAvatarUpload(),
              error: () => this.finishAvatarUpload(),
            });
        },
        error: () => {
          this.uploadingAvatar.set(false);
          this.snackbar.error('Could not upload profile picture. Please try again.');
        },
      });
  }

  private finishAvatarUpload(): void {
    this.uploadingAvatar.set(false);
    this.discardAvatar();
    this.snackbar.success('Profile picture updated.');
  }

  private revokePreview(): void {
    const url = this.avatarPreview();
    if (url) URL.revokeObjectURL(url);
  }

  // ---------- details form ----------
  togglePasswords(): void {
    this.showPasswords.update((v) => !v);
  }

  touched(name: string): boolean {
    return !!this.form.get(name)?.touched;
  }

  hasChanges(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) return;

    const formValue = this.form.getRawValue();

    const data = {
      name: formValue.name,
      email: formValue.email,
      ...(formValue.currentPassword ? { currentPassword: formValue.currentPassword } : {}),
      ...(formValue.newPassword ? { password: formValue.newPassword } : {}),
    };

    this.saving.set(true);

    this.profileApi
      .updateProfile(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rep) => {
          this.auth.setToken(rep.token);

          // loadMe() is cold: it only runs when subscribed.
          this.auth
            .loadMe()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.finishSave(),
              error: () => this.finishSave(),
            });
        },
        error: (err: unknown) => {
          console.error('Failed to update profile:', err);
          this.saving.set(false);
          this.snackbar.error('Failed to update profile. Please try again.');
        },
      });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.form.patchValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
    this.form.markAsPristine();
    this.snackbar.success('Profile updated successfully!');
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
  }
}