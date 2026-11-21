import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app'; // Hakikisha unatumia App kama ilivyo kwenye Angular 18

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));