import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Snackbar } from './components/snackbar/snackbar';

@Component({
  imports: [RouterOutlet,Snackbar],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})

// root Component
export class App {
  protected readonly title = signal('front-end');
}
