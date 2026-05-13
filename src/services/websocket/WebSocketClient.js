/**
 * WebSocketClient.js — Cliente WebSocket dinámico.
 *
 * Soporta conexión simultánea a múltiples puertos.
 * Puerto 8080 /ws → Juegos de Cámara (poses, esquive, impacto, ritmo)
 * Puerto 8081     → Juegos de RPLiDAR (coordenadas láser)
 *
 * Contrato con Phaser: despacha CustomEvent 'ws-message' en window.
 * Payload: { detail: { port, tipo_evento, ...resto } }
 */

const BASE_URL = import.meta.env.VITE_WS_HOST || 'localhost';

// Mapa de conexiones activas: port → { socket, path, juego, retryTimeout, isIntentionalClose }
const _connections = new Map();

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Extrae el primer toque de un evento ws-message.
 * Compatible con formato nuevo (touches) y viejo (x, y directo).
 */
export const getFirstTouch = (detail) => {
  if (detail.touches && detail.touches.length > 0) {
    return { x: detail.touches[0].x, y: detail.touches[0].y };
  }
  if (detail.x !== undefined && detail.y !== undefined) {
    return { x: detail.x, y: detail.y };
  }
  return null;
};

/**
 * Conecta al WebSocket del puerto y path indicados.
 * Si ya existe una conexión abierta al mismo puerto, no hace nada.
 * Múltiples puertos pueden estar conectados simultáneamente.
 */
export const connectWebSocket = (port, path = '', juego = null) => {
  const targetPort = Number(port);
  const existing = _connections.get(targetPort);

  // Ya conectado al puerto correcto — no hacer nada
  if (existing?.socket?.readyState === WebSocket.OPEN) {
    console.info(`[WS] Ya conectado al puerto ${targetPort}. Sin cambios.`);
    return;
  }

  // Si hay una conexión previa en ese puerto cerrándose, limpiarla
  if (existing) {
    _closeConnection(targetPort);
  }

  const conn = { path, juego, retryTimeout: null, isIntentionalClose: false, socket: null };
  _connections.set(targetPort, conn);
  _openConnection(targetPort);
};

/**
 * Cierra la conexión de un puerto específico.
 * Si no se especifica puerto, cierra TODAS las conexiones.
 */
export const disconnectWebSocket = (port = null) => {
  if (port !== null) {
    const targetPort = Number(port);
    const conn = _connections.get(targetPort);
    if (conn) {
      conn.isIntentionalClose = true;
      _closeConnection(targetPort);
      _connections.delete(targetPort);
      console.info(`[WS] Puerto ${targetPort} desconectado intencionalmente.`);
    }
  } else {
    // Cerrar todas
    for (const [p] of _connections) {
      const conn = _connections.get(p);
      if (conn) conn.isIntentionalClose = true;
      _closeConnection(p);
    }
    _connections.clear();
    console.info('[WS] Todos los puertos desconectados.');
  }
};

/**
 * Envía un mensaje JSON por el WebSocket de un puerto específico.
 * Si no se especifica puerto, usa el primero disponible.
 */
export const sendMessage = (payload, port = null) => {
  if (port !== null) {
    const conn = _connections.get(Number(port));
    if (conn?.socket?.readyState === WebSocket.OPEN) {
      conn.socket.send(JSON.stringify(payload));
    } else {
      console.warn(`[WS] No se pudo enviar al puerto ${port} — socket no abierto.`);
    }
  } else {
    // Enviar por el primer socket disponible
    for (const [p, conn] of _connections) {
      if (conn.socket?.readyState === WebSocket.OPEN) {
        conn.socket.send(JSON.stringify(payload));
        return;
      }
    }
    console.warn('[WS] No se pudo enviar — ningún socket abierto.', payload);
  }
};

export const getCurrentPort = () => {
  // Retorna el primer puerto conectado (compatibilidad con código existente)
  for (const [p, conn] of _connections) {
    if (conn.socket?.readyState === WebSocket.OPEN) return p;
  }
  return null;
};

// ─── Internals ────────────────────────────────────────────────────────────────

function _openConnection(port) {
  const conn = _connections.get(port);
  if (!conn) return;

  const url = `ws://${BASE_URL}:${port}${conn.path}`;
  console.info(`[WS] Conectando a ${url}...`);

  const socket = new WebSocket(url);
  conn.socket = socket;

  socket.onopen = () => {
    console.info(`[WS] ✅ Conectado al puerto ${port}`);
    if (conn.retryTimeout) {
      clearTimeout(conn.retryTimeout);
      conn.retryTimeout = null;
    }
    if (conn.juego) {
      socket.send(JSON.stringify({ juego: conn.juego }));
      console.info(`[WS] 🎮 Juego activado en backend: ${conn.juego}`);
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      _dispatch(port, data);
    } catch (err) {
      console.error(`[WS] ❌ Error al parsear mensaje (puerto ${port}):`, err, event.data);
    }
  };

  socket.onerror = () => {
    console.error(`[WS] ❌ Error en puerto ${port}`);
  };

  socket.onclose = (event) => {
    console.warn(`[WS] Conexión cerrada (puerto ${port}, código ${event.code})`);
    if (!conn.isIntentionalClose) {
      _scheduleRetry(port);
    }
  };
}

function _closeConnection(port) {
  const conn = _connections.get(port);
  if (!conn) return;
  if (conn.retryTimeout) {
    clearTimeout(conn.retryTimeout);
    conn.retryTimeout = null;
  }
  if (conn.socket) {
    conn.socket.onclose = null;
    conn.socket.close();
    conn.socket = null;
  }
}

function _scheduleRetry(port) {
  const conn = _connections.get(port);
  if (!conn) return;
  console.info(`[WS] Reintentando en 3s (puerto ${port})...`);
  conn.retryTimeout = setTimeout(() => {
    if (!conn.isIntentionalClose && _connections.has(port)) {
      _openConnection(port);
    }
  }, 500);
}

function _dispatch(port, data) {
  window.dispatchEvent(
    new CustomEvent('ws-message', {
      detail: {
        port,
        ...data,
      },
    })
  );
}