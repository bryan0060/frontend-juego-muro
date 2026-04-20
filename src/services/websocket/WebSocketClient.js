/**
 * WebSocketClient.js — Cliente WebSocket dinámico.
 *
 * Soporta conexión a múltiples puertos según el juego activo.
 * Puerto 8080 → Juegos de Cámara (pose, esquive, impacto corporal)
 * Puerto 8081 → Juegos de RPLiDAR (coordenadas láser)
 *
 * Contrato con Phaser: despacha CustomEvent 'ws-message' en window.
 * Payload: { detail: { port, tipo_evento, ...resto } }
 *
 * Las escenas de Phaser filtran por `port` o `tipo_evento` según necesiten.
 */

const BASE_URL = import.meta.env.VITE_WS_HOST || 'localhost';

// Estado interno del módulo — nunca exportar directamente
let _socket = null;
let _currentPort = null;
let _retryTimeout = null;
let _isIntentionalClose = false;

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Conecta al WebSocket del puerto indicado.
 * Si ya existe una conexión abierta al MISMO puerto, no hace nada.
 * Si existe una conexión a un puerto DIFERENTE, la cierra primero.
 *
 * @param {number|string} port - Puerto destino (8080 o 8081)
 */
export const connectWebSocket = (port) => {
  const targetPort = Number(port);

  // Ya conectado al puerto correcto — no hacer nada
  if (
    _socket?.readyState === WebSocket.OPEN &&
    _currentPort === targetPort
  ) {
    console.info(`[WS] Ya conectado al puerto ${targetPort}. Sin cambios.`);
    return;
  }

  // Hay una conexión a otro puerto — cerrar limpiamente antes de reconectar
  if (_socket) {
    console.info(`[WS] Cambiando de puerto ${_currentPort} → ${targetPort}`);
    _closeSocket();
  }

  _currentPort = targetPort;
  _isIntentionalClose = false;

  _openSocket();
};

/**
 * Cierra la conexión activa de forma intencional.
 * Cancela cualquier reintento pendiente.
 * Llamar siempre al salir de un juego (cleanup de PhaserGame).
 */
export const disconnectWebSocket = () => {
  _isIntentionalClose = true;
  _clearRetry();
  _closeSocket();
  _currentPort = null;
  console.info('[WS] Desconectado intencionalmente.');
};

/**
 * Retorna el puerto activo o null si no hay conexión.
 * Útil para debug desde DevTools.
 * @returns {number|null}
 */
export const getCurrentPort = () => _currentPort;

// ─── Internals ────────────────────────────────────────────────────────────────

function _openSocket() {
  const url = `ws://${BASE_URL}:${_currentPort}`;
  console.info(`[WS] Conectando a ${url}...`);

  _socket = new WebSocket(url);

  _socket.onopen = () => {
    console.info(`[WS] ✅ Conectado al puerto ${_currentPort}`);
    _clearRetry(); // Cancelar cualquier reintento pendiente
  };

  _socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      _dispatch(data);
    } catch (err) {
      console.error('[WS] ❌ Error al parsear mensaje:', err, event.data);
    }
  };

  _socket.onerror = () => {
    // onerror siempre va seguido de onclose — la lógica de retry va ahí
    console.error(`[WS] ❌ Error en puerto ${_currentPort}`);
  };

  _socket.onclose = (event) => {
    console.warn(
      `[WS] Conexión cerrada (puerto ${_currentPort}, código ${event.code})`
    );

    if (!_isIntentionalClose) {
      _scheduleRetry();
    }
  };
}

function _closeSocket() {
  if (_socket) {
    _socket.onclose = null; // Prevenir retry en cierre intencional
    _socket.close();
    _socket = null;
  }
}

function _scheduleRetry() {
  _clearRetry();
  console.info(`[WS] Reintentando en 3s (puerto ${_currentPort})...`);
  _retryTimeout = setTimeout(() => {
    if (!_isIntentionalClose && _currentPort) {
      _openSocket();
    }
  }, 3000);
}

function _clearRetry() {
  if (_retryTimeout) {
    clearTimeout(_retryTimeout);
    _retryTimeout = null;
  }
}

/**
 * Despacha un CustomEvent en window para que las escenas de Phaser lo escuchen.
 *
 * Estructura del evento:
 * event.detail = {
 *   port: 8080 | 8081,       ← para que la escena sepa de qué sensor viene
 *   tipo_evento: string,      ← 'impacto', 'pose', 'coordenada', etc.
 *   ...resto del payload      ← lo que envíe el backend
 * }
 *
 * @param {object} data - Payload JSON ya parseado del mensaje WS
 */
function _dispatch(data) {
  window.dispatchEvent(
    new CustomEvent('ws-message', {
      detail: {
        port: _currentPort,
        ...data,
      },
    })
  );
}