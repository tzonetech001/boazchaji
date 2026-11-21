import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private themeService = inject(ThemeService);
  langService          = inject(LanguageService);

  settingsForm!: FormGroup;
  // Tabs zimebakisha 2 tu
  activeTab: 'appearance' | 'language' = 'appearance';
  savedMessage = '';

  translations: Record<string, Record<string, string>> = {
    sw: {
      title: 'Mipangilio',
      subtitle: 'Binafsisha mfumo kulingana na mapendeleo yako',
      appearance: 'Muonekano',
      language: 'Lugha',
      theme: 'Mandhari',
      themeDesc: 'Chagua mwonekano unaokupendeza',
      light: 'Mwanga',
      dark: 'Giza',
      system: 'Mfumo',
      languageTitle: 'Lugha ya Mfumo',
      languageDesc: 'Chagua lugha unayotaka kutumia',
      swahili: 'Kiswahili',
      english: 'English',
      saved: 'Mipangilio imehifadhiwa!',
      save: 'Hifadhi Mipangilio',
      reset: 'Rejesha'
    },
    en: {
      title: 'Settings',
      subtitle: 'Customize the system based on your preferences',
      appearance: 'Appearance',
      language: 'Language',
      theme: 'Theme',
      themeDesc: 'Choose your preferred look',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      languageTitle: 'System Language',
      languageDesc: 'Choose the language to use',
      swahili: 'Kiswahili',
      english: 'English',
      saved: 'Settings saved!',
      save: 'Save Settings',
      reset: 'Reset'
    }
  };

  constructor() {
    this.settingsForm = this.fb.group({
      theme:    [this.themeService.isDarkMode() ? 'dark' : 'light'],
      language: [this.langService.lang()]
    });
  }

  ngOnInit() {
    // Sikiliza mabadiliko ya theme
    this.settingsForm.get('theme')?.valueChanges.subscribe(v => {
      if (v === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.themeService.setTheme(prefersDark ? 'dark' : 'light');
      } else {
        this.themeService.setTheme(v);
      }
    });

    // Sikiliza mabadiliko ya lugha
    this.settingsForm.get('language')?.valueChanges.subscribe(v => {
      this.langService.setLang(v);
    });
  }

  t(key: string): string {
    return this.translations[this.langService.lang()]?.[key] ?? key;
  }

  setTab(tab: 'appearance' | 'language') {
    this.activeTab = tab;
  }

  saveAll() {
    this.savedMessage = this.t('saved');
    setTimeout(() => this.savedMessage = '', 2500);
  }

  resetDefaults() {
    this.settingsForm.patchValue({
      theme: 'light', 
      language: 'sw'
    });
  }
}