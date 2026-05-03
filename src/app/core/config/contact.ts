/**
 * Direcciones de contacto centralizadas.
 *
 * Diferenciación intencional entre legal y operativa:
 *
 * - LEGAL_CONTACT_EMAIL: para ejercicio de derechos RGPD (acceso,
 *   rectificación, supresión, oposición, portabilidad), denuncias,
 *   notificaciones AEPD, contacto con el responsable del tratamiento como
 *   persona física. Aparece en Política de privacidad, Aviso legal y
 *   Términos de uso.
 *
 * - OPERATIONAL_CONTACT_EMAIL: para soporte técnico, dudas funcionales,
 *   reporte de bugs y comunicación operativa de la app. Es también el
 *   remitente (`From`) de los emails automáticos de la app (registro,
 *   recuperación de contraseña, invitaciones, aviso de partido).
 *
 * Si en el futuro se da de alta un alias dedicado para soporte (p.ej.
 * `soporte@compapptition.com`), basta con cambiar la constante de aquí
 * y se propaga al footer, register, manual HTML (manualmente), tickets, etc.
 */
export const LEGAL_CONTACT_EMAIL = 'contacto@marionaya.com';
export const OPERATIONAL_CONTACT_EMAIL = 'no-reply@compapptition.com';

/** mailto: prefabricado para usar en plantillas. */
export const LEGAL_CONTACT_MAILTO = `mailto:${LEGAL_CONTACT_EMAIL}`;
export const OPERATIONAL_CONTACT_MAILTO = `mailto:${OPERATIONAL_CONTACT_EMAIL}`;
