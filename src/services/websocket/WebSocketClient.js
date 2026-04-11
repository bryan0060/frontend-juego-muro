/**
 * WebSocketClient — Cliente real para el sensor RPlidar C1.
 * Se conecta al servidor WebSocket del Backend.
 * 
 * Transforma el payload del servidor en un CustomEvent del navegador
 * que Phaser puede escuchar sin depender directamente de React.
 * 
 * Payload esperado: { "tipo_evento": "impacto", "x": 850, "y": 420 }
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

let socket = null;

export const connectWebSocket = () => {
  if (socket?.readyState === WebSocket.OPEN) return;

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log(`[WS] Conectado al servidor: ${WS_URL}`);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (
        data.tipo_evento === 'impacto' &&
        typeof data.x === 'number' &&
        typeof data.y === 'number'
      ) {
        window.dispatchEvent(new CustomEvent('laser-impact', {
          detail: { x: data.x, y: data.y },
        }));
      }
    } catch (err) {
      console.error('[WS] Error al parsear mensaje:', err);
    }
  };

  socket.onerror = (err) => {
    console.error('[WS] Error de conexión:', err);
  };

  socket.onclose = () => {
    console.warn('[WS] Conexión cerrada. Reintentando en 3s...');
    setTimeout(connectWebSocket, 3000);
  };
};

export const disconnectWebSocket = () => {
  socket?.close();
};