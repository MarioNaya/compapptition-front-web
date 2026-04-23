import { Routes } from '@angular/router';

// Rutas hijas montadas bajo /competitions/:competicionId/...
export const EVENT_ROUTES: Routes = [
  {
    path: 'events/new',
    loadComponent: () => import('./new/new-event.page').then((m) => m.NewEventPage),
  },
  {
    path: 'events/:eventoId',
    loadComponent: () => import('./detail/event-detail.page').then((m) => m.EventDetailPage),
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./calendar-wizard/calendar-wizard.page').then((m) => m.CalendarWizardPage),
  },
];
