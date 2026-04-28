/**
 * WebSocketClient.js — Cliente WebSocket dinámico.
 *
 * Soporta conexión a múltiples puertos y paths según el juego activo.
 * Puerto 8080 /ws → Juegos de Cámara (poses, esquive, impacto, ritmo)
 * Puerto 8081     → Juegos de RPLiDAR (coordenadas láser)
 *
 * Contrato con Phaser: despacha CustomEvent 'ws-message' en window.
 * Payload: { detail: { port, tipo_evento, ...resto } }
 */

const BASE_URL = import.meta.env.VITE_WS_HOST || 'localhost';

let _socket = null;
let _currentPort = null;
let _currentPath = '';
let _currentJuego = null;
let _retryTimeout = null;
let _isIntentionalClose = false;

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Conecta al WebSocket del puerto y path indicados.
 * Si ya existe una conexión abierta al mismo puerto, no hace nada.
 * Si existe una conexión a un puerto diferente, la cierra primero.
 *
 * @param {number|string} port   - Puerto destino (8080 o 8081)
 * @param {string}        path   - Path de la URL (ej: '/ws' o '')
 * @param {string|null}   juego  - Juego a activar al conectar (ej: 'poses')
 */
export const connectWebSocket = (port, path = '', juego = null) => {
  const targetPort = Number(port);

  // Ya conectado al puerto correcto — no hacer nada
  if (
    _socket?.readyState === WebSocket.OPEN &&
    _currentPort === targetPort
  ) {
    console.info(`[WS] Ya conectado al puerto ${targetPort}. Sin cambios.`);
    return;
  }

  // Hay una conexión a otro puerto — cerrar antes de reconectar
  if (_socket) {
    console.info(`[WS] Cambiando de puerto ${_currentPort} → ${targetPort}`);
    _closeSocket();
  }

  _currentPort = targetPort;
  _currentPath = path;
  _currentJuego = juego;
  _isIntentionalClose = false;

  _openSocket();
};

/**
 * Cierra la conexión activa de forma intencional.
 * Llamar siempre al salir de un juego (cleanup de PhaserGame).
 */
export const disconnectWebSocket = () => {
  _isIntentionalClose = true;
  _clearRetry();
  _closeSocket();
  _currentPort = null;
  _currentPath = '';
  _currentJuego = null;
  console.info('[WS] Desconectado intencionalmente.');
};

/**
 * Envía un mensaje JSON por el WebSocket activo.
 * @param {object} payload
 */
export const sendMessage = (payload) => {
  if (_socket?.readyState === WebSocket.OPEN) {
    _socket.send(JSON.stringify(payload));
  } else {
    console.warn('[WS] No se pudo enviar — socket no está abierto.', payload);
  }
};

export const getCurrentPort = () => _currentPort;

// ─── Internals ────────────────────────────────────────────────────────────────

function _openSocket() {
  const url = `ws://${BASE_URL}:${_currentPort}${_currentPath}`;
  console.info(`[WS] Conectando a ${url}...`);

  _socket = new WebSocket(url);

  _socket.onopen = () => {
    console.info(`[WS] ✅ Conectado al puerto ${_currentPort}`);
    _clearRetry();

    // Mandar el juego activo al backend apenas se conecte
    if (_currentJuego) {
      sendMessage({ juego: _currentJuego });
      console.info(`[WS] 🎮 Juego activado en backend: ${_currentJuego}`);
    }
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
    _socket.onclose = null;
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