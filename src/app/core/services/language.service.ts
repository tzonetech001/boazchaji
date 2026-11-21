import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private _lang = signal<string>(localStorage.getItem('lang') || 'sw');
  readonly lang = this._lang.asReadonly();

  setLang(lang: string) {
    this._lang.set(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }

  toggle() {
    this.setLang(this._lang() === 'sw' ? 'en' : 'sw');
  }
}