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
  constructor() {
    const translate = inject(TranslateService);
    translate.setTranslation('en', translations.en);
    translate.setTranslation('sw', translations.sw);
    translate.use('sw');
  }
}
export const apiBaseUrl = '/api';