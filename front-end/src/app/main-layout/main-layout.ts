import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Auth } from '../services/auth/auth'; // adjust to where your Auth file lives
import { SideBar } from '../components/side-bar/side-bar';

@Component({
  imports: [RouterOutlet, SideBar],
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly collapsed = signal(false);

  protected onLogout(): void {
    this.auth.logout(); // clears the token and the user
    this.router.navigateByUrl('/login');
  }
}