// import { Component, inject } from '@angular/core';
// import { Auth } from '../../services/auth/auth';

// @Component({
//   imports: [],
//   selector: 'app-side-bar',
//   styleUrl: './side-bar.css',
//   templateUrl: './side-bar.html',
// })
// export class SideBar {
//   private auth = inject(Auth);
//   user = this.auth.user;

//   readonly role = this.user()?.role;
//   readonly name = this.user()?.name;
//   readonly email = this.user()?.email
// }

// import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
// import { RouterLink, RouterLinkActive } from '@angular/router';
// import { Auth } from '../../services/auth/auth';

// type UserRole = 'SELLER' | 'CLIENT';

// interface NavItem {
//   label: string;
//   path: string;
//   /** SVG path data for a 24x24 stroke icon */
//   icon: string;
//   roles: UserRole[];
//   group: 'CLIENT' | 'SELLER' | "ALL";
//   /** Only highlight when the URL matches exactly */
//   exact?: boolean;
// }


// @Component({
//   imports: [RouterLink, RouterLinkActive],
//   selector: 'app-side-bar',
//   styleUrl: './side-bar.css',
//   templateUrl: './side-bar.html',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })

// export class SideBar {
//   NAV_ITEMS: NavItem[] = [
//     // Shared
//     { label: 'Dashboard', path: '/dashboard', roles: ['CLIENT', 'SELLER'], group: 'ALL', exact: true,
//       icon: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
  
//     // CLIENT only
//     { label: 'Browse products', path: '/shop', roles: ['CLIENT'], group: 'CLIENT',
//       icon: 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0' },
//     { label: 'My orders', path: '/orders', roles: ['CLIENT'], group: 'CLIENT',
//       icon: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3zM8 8h8M8 12h8' },
//     { label: 'Wishlist', path: '/wishlist', roles: ['CLIENT'], group: 'CLIENT',
//       icon: 'M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z' },
  
//     // SELLER only
//     { label: 'My products', path: '/products', roles: ['SELLER'], group: 'SELLER', exact: true,
//       icon: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10' },
//     { label: 'Add product', path: '/products/new', roles: ['SELLER'], group: 'SELLER',
//       icon: 'M12 5v14M5 12h14' },
//     { label: 'Sales', path: '/sales', roles: ['SELLER'], group: 'SELLER',
//       icon: 'M3 17l6-6 4 4 8-8M15 7h6v6' },
//     { label: 'Analytics', path: '/analytics', roles: ['SELLER'], group: 'SELLER',
//       icon: 'M5 20V10M12 20V4M19 20v-7' },
  
//     // Account (shared)
//     { label: 'Profile', path: '/profile', roles: ['CLIENT', 'SELLER'], group: 'ALL',
//       icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
//     { label: 'Settings', path: '/settings', roles: ['CLIENT', 'SELLER'], group: 'ALL',
//       icon: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4' },
//   ];

//   private readonly auth = inject(Auth);

//   readonly user = this.auth.user;
  
//   readonly name = this.auth.name;
//   readonly email = this.auth.email;
//   readonly role = this.auth.role;
//   readonly id = this.auth.id;


//   readonly collapsed = signal(false);

//   readonly roleLabel = computed(() => (this.role() === 'SELLER' ? 'SELLER' : 'CLIENT'));
//   readonly initial = computed(() => (this.name().trim().charAt(0) || this.roleLabel().charAt(0)).toUpperCase());

//   private readonly visibleItems = computed(() => {
//     const role = this.role();
//     return role ? this.NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
//   });

//   readonly logoutIcon = 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9';

//   toggle(): void {
//     this.collapsed.update((v) => !v);
//   }

//   logout(): void {
//       this.auth.logout();
//   }
// }


import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth/auth';

type UserRole = 'seller' | 'client';

interface NavItem {
  label: string;
  path: string;
  /** SVG path data for a 24x24 stroke icon */
  icon: string;
  roles: UserRole[];
  group: 'main' | 'account';
  /** Only highlight when the URL matches exactly */
  exact?: boolean;
}


@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-side-bar',
  styleUrl: './side-bar.css',
  templateUrl: './side-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBar {
  private auth = inject(Auth);
  private router = inject(Router);
  NAV_ITEMS: NavItem[] = [
    // Shared
    { label: 'Dashboard', path: '/dashboard', roles: ['client', 'seller'], group: 'main', exact: true,
      icon: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
  
    // Client only
    { label: 'Browse products', path: '/shop', roles: ['client'], group: 'main',
      icon: 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0' },
    { label: 'My orders', path: '/orders', roles: ['client'], group: 'main',
      icon: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3zM8 8h8M8 12h8' },
    { label: 'Wishlist', path: '/wishlist', roles: ['client'], group: 'main',
      icon: 'M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z' },
  
    // Seller only
    { label: 'My products', path: '/products', roles: ['seller'], group: 'main', exact: true,
      icon: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10' },
    { label: 'Add product', path: '/products/new', roles: ['seller'], group: 'main',
      icon: 'M12 5v14M5 12h14' },
    { label: 'Sales', path: '/sales', roles: ['seller'], group: 'main',
      icon: 'M3 17l6-6 4 4 8-8M15 7h6v6' },
    { label: 'Analytics', path: '/analytics', roles: ['seller'], group: 'main',
      icon: 'M5 20V10M12 20V4M19 20v-7' },
    {label: 'Create product', path: '/products/create', roles: ['seller'], group: 'main',
      icon: 'M12 5v14M5 12h14'},
  
    // Account (shared)
    { label: 'Profile', path: '/profile', roles: ['client', 'seller'], group: 'account',
      icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
    { label: 'Settings', path: '/settings', roles: ['client', 'seller'], group: 'account',
      icon: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4' },
  ];
  user = this.auth.user;

  // computed() keeps these in sync if the user signal changes (login, logout, profile update)
  readonly role = computed<UserRole | null>(() => {
    const value = String(this.user()?.role ?? '').toLowerCase();
    return value === 'seller' || value === 'client' ? value : null;
  });
  readonly name = computed(() => this.user()?.name ?? '');
  readonly email = computed(() => this.user()?.email ?? '');

  readonly collapsed = signal(false);

  readonly roleLabel = computed(() => (this.role() === 'seller' ? 'Seller' : 'Client'));
  readonly initial = computed(() => (this.name().trim().charAt(0) || this.roleLabel().charAt(0)).toUpperCase());

  private readonly visibleItems = computed(() => {
    const role = this.role();
    return role ? this.NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
  });

  readonly mainItems = computed(() => this.visibleItems().filter((i) => i.group === 'main'));
  readonly accountItems = computed(() => this.visibleItems().filter((i) => i.group === 'account'));

  readonly logoutIcon = 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9';

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);

  }
}