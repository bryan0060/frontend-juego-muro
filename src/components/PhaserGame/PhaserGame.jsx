/**
 * PhaserGame.jsx — Puente entre React y Phaser.
 *
 * Responsabilidades:
 * 1. Montar el canvas de Phaser en el DOM.
 * 2. Conectar el WebSocket al puerto, path y juego correctos.
 * 3. Destruir el juego y desconectar el WS al salir.
 *
 * Props:
 * - escenaInicial: string  → qué escena de Phaser lanzar
 * - wsPort: number         → puerto del WebSocket (8080 o 8081)
 * - wsPath: string         → path de la URL ('/ws' o '')
 * - wsJuego: string|null   → juego a activar en el backend al conectar
 * - onBack: function       → volver al menú
 */

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { createPhaserConfig } from '../../phaser/PhaserConfig';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket/WebSocketClient';
import { initMockWebSocket } from '../../services/websocket/MockWebSocket';

const PhaserGame = ({ escenaInicial = 'SoccerScene', wsPort, wsPath = '', wsJuego = null, onBack }) => {
  const gameContainerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container || gameRef.current) return;

    const config = createPhaserConfig(container, escenaInicial);
    gameRef.current = new Phaser.Game(config);

    const forceWS = import.meta.env.VITE_FORCE_WS === 'true';

    if (!forceWS && import.meta.env.DEV) {
      const cleanup = initMockWebSocket(wsPort);
      gameRef.current._mockCleanup = cleanup;
    } else {
      connectWebSocket(wsPort, wsPath, wsJuego);
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