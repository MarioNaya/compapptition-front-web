import { Routes } from '@angular/router';

export const INVITATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inbox/invitations.page').then((m) => m.InvitationsPage),
  },
];
