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

const PhaserGame = ({ escenaInicial = 'BasketballScene', onBack }) => {
  const gameContainerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container || gameRef.current) return;

    const config = createPhaserConfig(container, escenaInicial);
    gameRef.current = new Phaser.Game(config);

    if (import.meta.env.DEV) {
      const cleanup = initMockWebSocket();
      gameRef.current._mockCleanup = cleanup;
    } else {
      connectWebSocket();
    }

    return () => {
      gameRef.current?._mockCleanup?.();
      disconnectWebSocket();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* Canvas de Phaser */}
      <div
        ref={gameContainerRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Botón volver al menú — overlay sobre el canvas */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          bottom: '20px',      // ← Cambiar top por bottom
          left: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: '50px',
          padding: '10px 24px',
          color: '#fff',
          fontSize: '1rem',
          fontFamily: 'var(--font-principal)',
          cursor: 'pointer',
        }}
      >
        ← Menú
      </button>
    </div>
  );
};

export default PhaserGame;