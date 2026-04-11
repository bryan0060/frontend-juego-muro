/**
 * PhaserGame — El puente entre React y Phaser 3.
 *
 * Responsabilidades:
 * 1. Crear y montar el canvas de Phaser en el DOM.
 * 2. Destruir el juego correctamente al desmontar el componente.
 * 3. No re-renderizar innecesariamente (el canvas lo controla Phaser).
 */

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { createPhaserConfig } from '../../phaser/PhaserConfig';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket/WebSocketClient';
import { initMockWebSocket } from '../../services/websocket/MockWebSocket';

const PhaserGame = () => {
  const gameContainerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container || gameRef.current) return;

    // 1. Crear instancia de Phaser
    const config = createPhaserConfig(container);
    gameRef.current = new Phaser.Game(config);

    // 2. Conectar fuente de datos según el entorno
    if (import.meta.env.DEV) {
      const cleanup = initMockWebSocket();
      gameRef.current._mockCleanup = cleanup;
    } else {
      connectWebSocket();
    }

    // 3. Limpieza al desmontar
    return () => {
      gameRef.current?._mockCleanup?.();
      disconnectWebSocket();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={gameContainerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    />
  );
};

export default PhaserGame;