/**
 * MockWebSocket.js — Simulador del sensor para desarrollo.
 *
 * Convierte CLICS DEL MOUSE en eventos 'ws-message',
 * imitando exactamente lo que haría el WebSocketClient real.
 *
 * Solo se activa en modo desarrollo (import.meta.env.DEV).
 * Nunca corre en producción.
 *
 * @param {number} port - Puerto a simular (8080 o 8081)
 */
export const initMockWebSocket = (port) => {
  if (!import.meta.env.DEV) return;

  console.info(
    `[MOCK WS] Modo simulación activo en puerto ${port}. Haz clic para simular impactos.`
  );

  const handleClick = (e) => {
    const payload = {
      port,
      tipo_evento: 'impacto',
      x: e.clientX,
      y: e.clientY,
    };

    console.debug('[MOCK WS] Impacto simulado:', payload);

    window.dispatchEvent(
      new CustomEvent('ws-message', {
        detail: payload,
      })
    );
  };

  window.addEventListener('click', handleClick);

  return () => window.removeEventListener('click', handleClick);
};