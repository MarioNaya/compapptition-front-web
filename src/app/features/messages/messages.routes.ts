import { Routes } from '@angular/router';

export const MESSAGES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inbox/inbox.page').then((m) => m.InboxPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./conversation/conversation.page').then((m) => m.ConversationPage),
  },
];
