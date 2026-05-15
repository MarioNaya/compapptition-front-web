import { Routes } from '@angular/router';

/**
 * Rutas del sistema de tickets de soporte.
 *
 * - `/app/tickets` — listado: "Mis tickets" para usuario, listado global con
 *   filtro por estado para admin de sistema.
 * - `/app/tickets/nuevo` — formulario de creación de ticket.
 * - `/app/tickets/:id` — detalle de un ticket. Si el usuario es admin de
 *   sistema, puede cambiar el estado desde esa misma vista.
 */
export const TICKETS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./list/tickets-list.page').then((m) => m.TicketsListPage),
    title: 'Tickets de soporte · Compapptition',
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./new/tickets-new.page').then((m) => m.TicketsNewPage),
    title: 'Nuevo ticket · Compapptition',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/tickets-detail.page').then((m) => m.TicketsDetailPage),
    title: 'Detalle de ticket · Compapptition',
  },
];
