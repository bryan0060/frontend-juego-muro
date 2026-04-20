/**
 * PhaserGame.jsx — Puente entre React y Phaser.
 *
 * Responsabilidades:
 * 1. Montar el canvas de Phaser en el DOM.
 * 2. Conectar el WebSocket al puerto correcto según el juego.
 * 3. Destruir el juego y desconectar el WS al salir.
 */

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { createPhaserConfig } from '../../phaser/PhaserConfig';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket/WebSocketClient';
import { initMockWebSocket } from '../../services/websocket/MockWebSocket';

const PhaserGame = ({ escenaInicial = 'SoccerScene', wsPort, onBack }) => {
  const gameContainerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container || gameRef.current) return;

    // Montar Phaser
    const config = createPhaserConfig(container, escenaInicial);
    gameRef.current = new Phaser.Game(config);

    // Conectar WebSocket al puerto del juego activo
    if (import.meta.env.DEV) {
      const cleanup = initMockWebSocket(wsPort); // ← Agregar wsPort
      gameRef.current._mockCleanup = cleanup;
    } else {
      connectWebSocket(wsPort);
    }

    return () => {
      // Cleanup al salir del juego
      gameRef.current?._mockCleanup?.();
      disconnectWebSocket();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div
        ref={gameContainerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          bottom: '20px',
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