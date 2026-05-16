import { type Notificacion, TipoNotificacion } from '@core/models/notificacion';

/**
 * Iconos disponibles para los distintos tipos de notificación.
 * Se mantiene como union literal para preservar el chequeo de tipos en el
 * componente {@code IconComponent} (también unión literal `IconName`).
 */
export type NotificationIcon = 'bell' | 'mail' | 'trophy' | 'users' | 'check';

/** Vista derivada para listas/dropdown de notificaciones. */
export interface NotificationView {
  readonly id: number;
  readonly icon: NotificationIcon;
  readonly title: string;
  readonly detail: string;
  readonly leida: boolean;
  readonly fechaCreacion: string;
  readonly link: readonly unknown[] | null;
}

/**
 * Título humano para cada tipo de notificación. Compartido entre el dropdown
 * de la campana y la página listado para evitar drift cuando cambien las
 * etiquetas (cierra AF-4).
 */
export const NOTIFICATION_TITLES: Record<TipoNotificacion, string> = {
  INVITACION_RECIBIDA: 'Nueva invitación',
  EQUIPO_ACEPTADO: 'Equipo aceptado',
  RESULTADO_REGISTRADO: 'Resultado registrado',
  MENSAJE_RECIBIDO: 'Nuevo mensaje',
  COMPETICION_ACTIVADA: 'Competición activada',
  SOLICITUD_VINCULACION_RECIBIDA: 'Solicitud de vinculación',
  SOLICITUD_VINCULACION_RESUELTA: 'Vinculación resuelta',
};

/** Icono asociado a cada tipo. Compartido por las dos UIs. */
export const NOTIFICATION_ICONS: Record<TipoNotificacion, NotificationIcon> = {
  INVITACION_RECIBIDA: 'bell',
  EQUIPO_ACEPTADO: 'check',
  RESULTADO_REGISTRADO: 'trophy',
  MENSAJE_RECIBIDO: 'mail',
  COMPETICION_ACTIVADA: 'trophy',
  SOLICITUD_VINCULACION_RECIBIDA: 'users',
  SOLICITUD_VINCULACION_RESUELTA: 'check',
};

/**
 * Resuelve el destino de navegación de una notificación a partir de su tipo
 * y el {@code payload} adjunto. Devuelve {@code null} si la notificación no
 * tiene acción navegable (notificaciones meramente informativas).
 */
export function notificationLink(n: Notificacion): readonly unknown[] | null {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  switch (n.tipo) {
    case TipoNotificacion.INVITACION_RECIBIDA:
      return ['/app/invitations'];
    case TipoNotificacion.EQUIPO_ACEPTADO:
    case TipoNotificacion.COMPETICION_ACTIVADA:
      return p['competicionId'] != null ? ['/app/competitions', p['competicionId']] : null;
    case TipoNotificacion.RESULTADO_REGISTRADO:
      return p['competicionId'] != null && p['eventoId'] != null
        ? ['/app/competitions', p['competicionId'], 'events', p['eventoId']]
        : null;
    case TipoNotificacion.MENSAJE_RECIBIDO:
      return p['conversacionId'] != null ? ['/app/messages', p['conversacionId']] : ['/app/messages'];
    case TipoNotificacion.SOLICITUD_VINCULACION_RECIBIDA:
    case TipoNotificacion.SOLICITUD_VINCULACION_RESUELTA:
      return ['/app/players/vinculaciones'];
  }
  return null;
}

/**
 * Resuelve el detalle textual mostrado debajo del título según el tipo y los
 * campos del {@code payload}. Devuelve cadena vacía si no se puede componer.
 */
export function notificationDetail(n: Notificacion): string {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  switch (n.tipo) {
    case TipoNotificacion.INVITACION_RECIBIDA:
      return String(p['competicionNombre'] ?? 'Tienes una invitación pendiente');
    case TipoNotificacion.EQUIPO_ACEPTADO: {
      const team = p['equipoNombre'] ?? '';
      const comp = p['competicionNombre'] ?? '';
      return `${team}${comp ? ' · ' + comp : ''}`.trim() || 'Equipo aceptado';
    }
    case TipoNotificacion.RESULTADO_REGISTRADO: {
      const local = p['localNombre'];
      const visitante = p['visitanteNombre'];
      const resultado = p['resultado'];
      if (local && visitante && resultado) return `${local} vs ${visitante} · ${resultado}`;
      if (local && visitante) return `${local} vs ${visitante}`;
      return String(resultado ?? 'Resultado registrado');
    }
    case TipoNotificacion.MENSAJE_RECIBIDO:
      return String(p['autorUsername'] ?? 'Nuevo mensaje');
    case TipoNotificacion.COMPETICION_ACTIVADA:
      return String(p['competicionNombre'] ?? 'Competición activada');
    case TipoNotificacion.SOLICITUD_VINCULACION_RECIBIDA: {
      const j = p['jugadorNombre'] ?? '';
      const e = p['equipoNombre'] ?? '';
      return `${j}${e ? ' · ' + e : ''}`.trim() || 'Solicitud pendiente';
    }
    case TipoNotificacion.SOLICITUD_VINCULACION_RESUELTA: {
      const j = p['jugadorNombre'] ?? '';
      return `${j} · ${p['aceptada'] ? 'aceptada' : 'rechazada'}`.trim();
    }
  }
  return '';
}

/**
 * Convierte una notificación de dominio en su vista lista para renderizar.
 * Útil para componentes que quieren mostrar el título/icono/detalle/link en
 * un solo objeto, sin replicar el switch.
 */
export function toNotificationView(n: Notificacion): NotificationView {
  return {
    id: n.id,
    icon: NOTIFICATION_ICONS[n.tipo],
    title: NOTIFICATION_TITLES[n.tipo],
    detail: notificationDetail(n),
    leida: n.leida,
    fechaCreacion: n.fechaCreacion,
    link: notificationLink(n),
  };
}
