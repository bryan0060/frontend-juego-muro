import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { createPhaserConfig } from '../../phaser/PhaserConfig';
import { connectWebSocket, disconnectWebSocket, getFirstTouch } from '../../services/websocket/WebSocketClient';
import { initMockWebSocket } from '../../services/websocket/MockWebSocket';

const PhaserGame = ({ escenaInicial = 'SoccerScene', wsPort, wsPath = '', wsJuego = null, onBack }) => {
  const gameContainerRef = useRef(null);
  const gameRef = useRef(null);
  const btnRef = useRef(null);

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
      if (wsPort === 8080) {
        connectWebSocket(8081, '', null);
      }
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
  const holdCancelTimerRef = useRef(null);

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
        if (!handled) onBack();
      }
    }, 50);
  };

  const cancelHold = () => {
    clearInterval(holdTimerRef.current);
    setHoldProgress(0);
    startTimeRef.current = null;
  };

  useEffect(() => {
    const handleSensor = (e) => {
      if (e.detail.port !== 8081) return;

      const touch = getFirstTouch(e.detail);
      if (!touch) return;
      const { x, y } = touch;

      const btn = btnRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const margin = 25;
      const isOverBtn =
        x >= rect.left - margin && x <= rect.right + margin &&
        y >= rect.top - margin && y <= rect.bottom + margin;

      if (isOverBtn) {
        if (!startTimeRef.current) {
          startHold();
        }
        clearTimeout(holdCancelTimerRef.current);
        holdCancelTimerRef.current = setTimeout(() => {
          cancelHold();
        }, 600);
      }
    };

    window.addEventListener('ws-message', handleSensor);
    return () => window.removeEventListener('ws-message', handleSensor);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div
        ref={gameContainerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <div
        ref={btnRef}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        style={{
          position: 'absolute',
          bottom: 'auto',
          top: '20px',
          left: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: '50px',
          padding: '20px 36px',
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