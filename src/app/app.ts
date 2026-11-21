import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { translations } from './core/translations';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Tunatumia inject hapa nje ya constructor
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.setTranslation('en', translations.en);
    this.translate.setTranslation('sw', translations.sw);
    this.translate.use('sw');
  }
}