import { TourStep } from './tour.service';

/**
 * Pasos del tour por patrón de ruta. La clave es una expresión regular que se
 * compara con la URL actual (sin query params). El componente que lance el
 * tour usa el primer match.
 *
 * Para añadir un tour nuevo: registra una entrada en {@code TOUR_REGISTRY} con
 * el patrón de ruta y los pasos. Selectores: usa atributos {@code data-tour}
 * para que el HTML quede inalterado por la presencia del tour.
 */
export interface TourRouteSteps {
  readonly pattern: RegExp;
  readonly title: string;
  readonly steps: readonly TourStep[];
}

export const TOUR_REGISTRY: readonly TourRouteSteps[] = [
  {
    pattern: /^\/app\/dashboard\/?$/,
    title: 'Dashboard',
    steps: [
      {
        selector: '[data-tour="dashboard-stats"]',
        title: 'Tus números de un vistazo',
        description:
          'Estas tarjetas resumen lo más relevante: competiciones en las que participas, equipos, próximos partidos e invitaciones pendientes. Pulsa cualquier tarjeta para ir a su listado completo.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="dashboard-hero"]',
        title: 'Tu próximo partido',
        description:
          'Aquí aparece el siguiente partido programado de cualquiera de tus competiciones. Toca la tarjeta para abrir su detalle, registrar resultado o consultar estadísticas.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="dashboard-calendar"]',
        title: 'Calendario',
        description:
          'Tira temporal con los partidos de la quincena. Arrástrala lateralmente para moverte por los días y pulsa un día con eventos para ver el detalle.',
        placement: 'top',
      },
      {
        selector: '[data-tour="dashboard-competitions"]',
        title: 'Tus competiciones',
        description:
          'Tus competiciones agrupadas por el rol con el que participas: administrador, manager de equipo, árbitro y jugador. Pulsa "Ver todas" para abrir la vista dedicada.',
        placement: 'top',
      },
      {
        selector: '[data-tour="dashboard-shortcuts"]',
        title: 'Atajos',
        description:
          'Accesos rápidos para crear una competición o un equipo nuevos. El creador queda automáticamente como administrador (competición) o manager (equipo).',
        placement: 'left',
      },
      {
        selector: '[data-tour="dashboard-myteams"]',
        title: 'Mis equipos',
        description:
          'Equipos donde participas como creador, manager o jugador. Pulsa cualquiera para ver su plantilla, gestionar dorsales o consultar el código de invitación si es privado.',
        placement: 'left',
      },
      {
        selector: '[data-tour="dashboard-pending"]',
        title: 'Gestiones pendientes',
        description:
          'Recordatorio de cosas por hacer: competiciones en borrador listas para activar e invitaciones que has enviado y aún esperan respuesta.',
        placement: 'left',
      },
      {
        selector: '[data-tour="navbar-create"]',
        title: 'Crear nuevo',
        description:
          'Atajo para crear una competición o un equipo. Como creador quedas automáticamente como administrador o manager.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="navbar-bell"]',
        title: 'Notificaciones',
        description:
          'Avisos de invitaciones, resultados, vinculaciones y más. La campana lleva un punto rojo cuando hay no leídos.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="navbar-mail"]',
        title: 'Mensajería',
        description:
          'Bandeja de mensajes 1-a-1. Inicia conversaciones con otros usuarios desde aquí o desde el detalle de un jugador.',
        placement: 'bottom',
      },
    ],
  },
  {
    pattern: /^\/app\/competitions\/\d+\/?$/,
    title: 'Detalle de competición',
    steps: [
      {
        selector: '[data-tour="comp-actions"]',
        title: 'Acciones del administrador',
        description:
          'Si eres admin de la competición, aquí tienes los CTAs para editarla, abrirla, generar calendario, crear partidos, invitar árbitro o eliminarla.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="comp-tabs"]',
        title: 'Pestañas',
        description:
          'Navega entre partidos, calendario, clasificación, equipos, estadísticas y, si aplica, el cuadro de playoff.',
        placement: 'bottom',
      },
    ],
  },
];

/** Devuelve los pasos del tour aplicables a una URL, o `null` si no hay. */
export function findTourForRoute(url: string): TourRouteSteps | null {
  const cleanUrl = url.split('?')[0]!.split('#')[0]!;
  return TOUR_REGISTRY.find((t) => t.pattern.test(cleanUrl)) ?? null;
}
