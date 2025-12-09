import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: definePreset(Aura, {
          semantic: {
            primary: {
              50: '#f4f8f8',
              100: '#e3eeef',
              200: '#c6dfe0',
              300: '#9cc7c9',
              400: '#6eaab0',
              500: '#5d8a8c', // Base Color (Petróleo)
              600: '#4a7073',
              700: '#3d5a5c',
              800: '#354a4c',
              900: '#2f3f41',
              950: '#1a2628'
            },
            colorScheme: {
              light: {
                surface: {
                  0: '#ffffff',
                  50: '#fbf9f6', // Fundo
                  100: '#f3e4c9', // Bege
                  200: '#e5e7eb',
                  300: '#d1d5db',
                  400: '#9ca3af',
                  500: '#6b7280',
                  600: '#4b5563',
                  700: '#3a3a3a', // Text
                  800: '#1f2937',
                  900: '#111827',
                  950: '#030712'
                },
                formField: {
                  hoverBorderColor: '{primary.color}'
                }
              },
              dark: {
                surface: {
                  0: '#ffffff',
                  50: '#fbf9f6',
                  100: '#f3e4c9',
                  200: '#e5e7eb',
                  300: '#d1d5db',
                  400: '#9ca3af',
                  500: '#6b7280',
                  600: '#4b5563',
                  700: '#3a3a3a',
                  800: '#1f2937',
                  900: '#111827',
                  950: '#030712'
                }
              }
            }
          }
        }),
        options: {
          darkModeSelector: '.my-app-dark'
        }
      }
    })
  ]
};
