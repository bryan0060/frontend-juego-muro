/**
 * MockWebSocket — Simulador del sensor para desarrollo.
 * 
 * Convierte CLICS DEL MOUSE en eventos 'laser-impact',
 * imitando exactamente lo que haría el sensor RPlidar C1.
 * 
 * Solo se activa en modo desarrollo (import.meta.env.DEV).
 * Nunca corre en producción.
 */
export const initMockWebSocket = () => {
  if (!import.meta.env.DEV) return;

  console.info('[MOCK WS] Modo simulación activo. Haz clic en la pantalla para simular impactos del sensor.');

  const handleClick = (e) => {
    const mockPayload = {
      tipo_evento: 'impacto',
      x: e.clientX,
      y: e.clientY,
    };

    console.debug('[MOCK WS] Impacto simulado:', mockPayload);

    window.dispatchEvent(new CustomEvent('laser-impact', {
      detail: { x: mockPayload.x, y: mockPayload.y },
    }));
  };

  window.addEventListener('click', handleClick);

  // Retornar función de limpieza
  return () => window.removeEventListener('click', handleClick);
};