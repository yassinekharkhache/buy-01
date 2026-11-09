import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth/auth';
import { ProfileApi } from '../../services/profile-api/profile-api';

import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';

type Role = 'CLIENT' | 'SELLER';

interface NavLink {
  label: string;
  path: string;
  icon: string; // SVG path data (24x24, stroke icons)
  roles?: readonly Role[]; // omitted = every role
}

interface NavSection {
  title: string;
  links: readonly NavLink[];
}

const ICONS = {
  products: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  profiles:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  wishlists:
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  myProducts:
    'M7.5 4.27l9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7 12 12l8.7-5M12 22V12',
  create: 'M12 5v14M5 12h14',
} as const;

const SECTIONS: readonly NavSection[] = [
  {
    title: 'Browse',
    links: [
      { label: 'Products', path: '/products', icon: ICONS.products },
      { label: 'Wish lists', path: '/wishlists', icon: ICONS.wishlists },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'My products', path: '/products/mine', icon: ICONS.myProducts, roles: ['SELLER'] },
      { label: 'Create product', path: 'createproduct', icon: ICONS.create, roles: ['SELLER'] },
    ],
  },
];

const ROLE_LABELS: Record<Role, string> = { CLIENT: 'Client', SELLER: 'Seller' };

@Component({
  selector: 'app-side-bar',
  imports: [RouterLink, RouterLinkActive,AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.collapsed]': 'collapsed()' },
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css',
})

export class SideBar {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileApi = inject(ProfileApi);


  protected readonly user = this.auth.user;
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  // Two-way: [(collapsed)]="..." in the parent, or just leave it alone.
  readonly collapsed = model(false);
  readonly logout = output<void>();

  // Accepts "SELLER" or "ROLE_SELLER"; anything else gets the least privileges.
  private readonly role = computed<Role | null>(() => {
    const raw = this.auth.role();
    if (!raw) return null;
    return String(raw).replace(/^ROLE_/, '').toUpperCase() === 'SELLER' ? 'SELLER' : 'CLIENT';
  });

  protected readonly initials = computed(() =>
    this.auth
      .name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );

  protected readonly roleLabel = computed(() => {
    const role = this.role();
    return role ? ROLE_LABELS[role] : '';
  });

  protected readonly sections = computed(() => {
    const role = this.role();
    if (!role) return [];

    return SECTIONS.map((section) => ({
      title: section.title,
      links: section.links.filter((link) => !link.roles || link.roles.includes(role)),
    })).filter((section) => section.links.length > 0);
  });

  profilePicture$!: Observable<string>;

  constructor() {
    effect(() => {
      const user = this.auth.user();

      if (user?.id) {
        this.profilePicture$ = this.getProfilePicture(user.id);
      } else {
        this.profilePicture$ = of('/public/default.png');
      }
    });
  }

  protected toggle(): void {
    this.collapsed.update((value) => !value);
  }

  protected retry(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.failed.set(false);

    this.auth
      .loadMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }


  getProfilePicture(userId: string): Observable<string> {
    return this.profileApi.getProfilePicture(userId).pipe(
      map(blob => {
        console.log("-----------------")
        return URL.createObjectURL(blob)

      }),
      catchError(err => {
        console.error('Failed to load profile picture:', userId, err);
        return of('http://localhost:4200//public/default.png');
      })
    );
  }
}