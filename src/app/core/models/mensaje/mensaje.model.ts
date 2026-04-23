export interface ConversacionSimple {
  id: number;
  otroUsuarioId: number;
  otroUsuarioUsername: string;
  ultimoMensaje?: string | null;
  fechaUltimoMensaje?: string | null;
  unreadCount: number;
}

export interface Mensaje {
  id: number;
  conversacionId: number;
  autorId: number;
  autorUsername: string;
  contenido: string;
  fechaEnvio: string;
  leido: boolean;
}

export interface MensajeCreateRequest {
  contenido: string;
}

export interface ConversacionStartRequest {
  destinatarioId: number;
}
