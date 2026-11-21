import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settingsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    @Inject(TranslateService) private translate: TranslateService,
    private themeService: ThemeService
  ) {
    this.settingsForm = this.fb.group({
      language: [this.translate.currentLang() || 'sw'],
      theme: [this.themeService.isDarkMode() ? 'dark' : 'light']
    });
  }

  ngOnInit() {
    // Weka thamani ya sasa kwenye form
    this.settingsForm.patchValue({
      language: this.translate.currentLang() || 'sw',
      theme: this.themeService.isDarkMode() ? 'dark' : 'light'
    });

    // Sikiliza mabadiliko ya form papo hapo
    this.settingsForm.get('language')?.valueChanges.subscribe(lang => {
      this.translate.use(lang);
    });

    this.settingsForm.get('theme')?.valueChanges.subscribe(theme => {
      this.themeService.setTheme(theme);
    });
  }
}