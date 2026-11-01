import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SnackbarService, SnackbarType } from './snackbar.service';

@Component({
  imports: [],
  selector: 'app-snackbar',
  styleUrl: './snackbar.css',
  templateUrl: './snackbar.html',
})

export class Snackbar {
  protected readonly service = inject(SnackbarService);

  /** Each type gets its own glyph, so meaning never depends on color. */
  protected readonly glyphs: Record<SnackbarType, string> = {
    success: '✓',
    error: '!',
    info: 'i',
  };
}