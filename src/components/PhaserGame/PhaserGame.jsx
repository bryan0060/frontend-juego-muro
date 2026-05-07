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

import { useEffect, useRef, useState } from 'react';
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

  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  const startHold = () => {
    startTimeRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / 2000, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        clearInterval(holdTimerRef.current);
        let handled = false;
        if (gameRef.current && gameRef.current.scene) {
          const activeScenes = gameRef.current.scene.getScenes(true);
          if (activeScenes.length > 0) {
            const activeScene = activeScenes[0];
            if (typeof activeScene.returnToMenu === 'function') {
              handled = activeScene.returnToMenu();
            }
          }
        }
        if (!handled) {
          onBack();
        }
      }
    }, 50);
  };

  const cancelHold = () => {
    clearInterval(holdTimerRef.current);
    setHoldProgress(0);
  };

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div
        ref={gameContainerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <div
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        style={{
          position: 'absolute',
          bottom: escenaInicial === 'MagicBoardScene' ? 'auto' : '20px',
          top: escenaInicial === 'MagicBoardScene' ? '20px' : 'auto',
          left: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: '50px',
          padding: '10px 24px',
          color: '#fff',
          fontSize: '1rem',
          fontFamily: 'var(--font-principal)',
          cursor: 'pointer',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '4px',
          width: `${holdProgress * 100}%`,
          background: '#00ff00',
          transition: 'width 0.1s linear'
        }} />
        ← Menú
      </div>
    </div>
  );
};

export default PhaserGame;