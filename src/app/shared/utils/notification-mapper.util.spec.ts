import {
  NOTIFICATION_ICONS,
  NOTIFICATION_TITLES,
  notificationDetail,
  notificationLink,
  toNotificationView,
} from './notification-mapper.util';
import { Notificacion, TipoNotificacion } from '@core/models/notificacion';

function build(tipo: TipoNotificacion, payload: Record<string, unknown> = {}): Notificacion {
  return {
    id: 1,
    tipo,
    payload,
    leida: false,
    fechaCreacion: '2026-05-03T08:00:00Z',
  };
}

describe('notification-mapper.util', () => {
  describe('NOTIFICATION_TITLES / NOTIFICATION_ICONS', () => {
    it('cubre todos los tipos del enum sin huecos (ningún drift entre maps)', () => {
      const tipos = Object.values(TipoNotificacion);
      for (const t of tipos) {
        expect(NOTIFICATION_TITLES[t]).toBeTruthy();
        expect(NOTIFICATION_ICONS[t]).toBeTruthy();
      }
    });
  });

  describe('notificationLink', () => {
    it('INVITACION_RECIBIDA → /app/invitations independientemente del payload', () => {
      expect(notificationLink(build(TipoNotificacion.INVITACION_RECIBIDA)))
        .toEqual(['/app/invitations']);
    });

    it('EQUIPO_ACEPTADO con competicionId → enlace a la competición', () => {
      expect(notificationLink(build(TipoNotificacion.EQUIPO_ACEPTADO, { competicionId: 42 })))
        .toEqual(['/app/competitions', 42]);
    });

    it('EQUIPO_ACEPTADO sin competicionId → null (no navegable)', () => {
      expect(notificationLink(build(TipoNotificacion.EQUIPO_ACEPTADO))).toBeNull();
    });

    it('RESULTADO_REGISTRADO requiere competicionId Y eventoId, si no devuelve null', () => {
      expect(
        notificationLink(build(TipoNotificacion.RESULTADO_REGISTRADO, { competicionId: 1, eventoId: 7 })),
      ).toEqual(['/app/competitions', 1, 'events', 7]);
      expect(notificationLink(build(TipoNotificacion.RESULTADO_REGISTRADO, { competicionId: 1 }))).toBeNull();
      expect(notificationLink(build(TipoNotificacion.RESULTADO_REGISTRADO, { eventoId: 7 }))).toBeNull();
    });

    it('MENSAJE_RECIBIDO con conversacionId → conversación; sin conversacionId → /app/messages', () => {
      expect(notificationLink(build(TipoNotificacion.MENSAJE_RECIBIDO, { conversacionId: 12 })))
        .toEqual(['/app/messages', 12]);
      expect(notificationLink(build(TipoNotificacion.MENSAJE_RECIBIDO)))
        .toEqual(['/app/messages']);
    });

    it('SOLICITUD_VINCULACION_* siempre va a /app/players/vinculaciones', () => {
      expect(notificationLink(build(TipoNotificacion.SOLICITUD_VINCULACION_RECIBIDA)))
        .toEqual(['/app/players/vinculaciones']);
      expect(notificationLink(build(TipoNotificacion.SOLICITUD_VINCULACION_RESUELTA)))
        .toEqual(['/app/players/vinculaciones']);
    });
  });

  describe('notificationDetail', () => {
    it('INVITACION_RECIBIDA: usa competicionNombre cuando está', () => {
      expect(notificationDetail(build(TipoNotificacion.INVITACION_RECIBIDA, { competicionNombre: 'Liga Test' })))
        .toBe('Liga Test');
    });

    it('INVITACION_RECIBIDA: fallback genérico si no hay competicionNombre', () => {
      expect(notificationDetail(build(TipoNotificacion.INVITACION_RECIBIDA)))
        .toBe('Tienes una invitación pendiente');
    });

    it('RESULTADO_REGISTRADO: compone "local vs visitante · resultado"', () => {
      expect(notificationDetail(build(TipoNotificacion.RESULTADO_REGISTRADO, {
        localNombre: 'Athletic', visitanteNombre: 'Real', resultado: '2-1',
      }))).toBe('Athletic vs Real · 2-1');
    });

    it('RESULTADO_REGISTRADO: omite resultado si falta', () => {
      expect(notificationDetail(build(TipoNotificacion.RESULTADO_REGISTRADO, {
        localNombre: 'Athletic', visitanteNombre: 'Real',
      }))).toBe('Athletic vs Real');
    });

    it('SOLICITUD_VINCULACION_RESUELTA: refleja aceptada/rechazada en el detalle', () => {
      expect(notificationDetail(build(TipoNotificacion.SOLICITUD_VINCULACION_RESUELTA, {
        jugadorNombre: 'Pepe', aceptada: true,
      }))).toBe('Pepe · aceptada');
      expect(notificationDetail(build(TipoNotificacion.SOLICITUD_VINCULACION_RESUELTA, {
        jugadorNombre: 'Pepe', aceptada: false,
      }))).toBe('Pepe · rechazada');
    });
  });

  describe('toNotificationView', () => {
    it('combina id+icon+title+detail+leida+fecha+link en un único objeto', () => {
      const v = toNotificationView(build(TipoNotificacion.MENSAJE_RECIBIDO, {
        conversacionId: 9, autorUsername: 'pepe',
      }));
      expect(v.id).toBe(1);
      expect(v.icon).toBe('mail');
      expect(v.title).toBe('Nuevo mensaje');
      expect(v.detail).toBe('pepe');
      expect(v.leida).toBeFalse();
      expect(v.link).toEqual(['/app/messages', 9]);
    });
  });
});
