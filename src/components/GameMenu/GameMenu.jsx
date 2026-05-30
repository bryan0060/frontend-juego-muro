import { useEffect, useRef } from 'react';
import styles from './GameMenu.module.css';
import { GAMES } from '../../config/games.config';
import { getFirstTouch } from '../../services/websocket/WebSocketClient';

const GameMenu = ({ onSelectGame, onBack }) => {
  const cardRefs = useRef({});
  const backBtnRef = useRef(null);

  useEffect(() => {
    const mountTime = Date.now();

    const handleSensor = (e) => {
      try {
        if (e.detail.port !== 8081) return;
        if (Date.now() - mountTime < 2000) return;

        const touch = getFirstTouch(e.detail);
        if (!touch) return;
        const { x, y } = touch;

        const backEl = backBtnRef.current;
        if (backEl) {
          const rect = backEl.getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            onBack();
            return;
          }
        }

        for (const juego of GAMES) {
          if (!juego.disponible) continue;
          const el = cardRefs.current[juego.id];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            onSelectGame(juego);
            break;
          }
        }
      } catch (_) {
        return;
      }
    };

    window.addEventListener('ws-message', handleSensor);
    return () => window.removeEventListener('ws-message', handleSensor);
  }, []);

  return (
    <div className={styles.container}>
      <div className={`${styles.bubble} ${styles.bubble1}`} />
      <div className={`${styles.bubble} ${styles.bubble2}`} />

      <h1 className={styles.title}>¿A qué jugamos hoy? 🎉</h1>

      <div className={styles.grid}>
        {GAMES.map((juego) => (
          <button
            key={juego.id}
            ref={el => cardRefs.current[juego.id] = el}
            className={`${styles.card} ${!juego.disponible ? styles.cardBloqueado : ''}`}
            onClick={() => {
              if (!juego.disponible) return;
              onSelectGame(juego);
            }}
            disabled={!juego.disponible}
          >
            <span className={styles.cardEmoji}>{juego.emoji}</span>
            {juego.nombre}
            {!juego.disponible && (
              <span className={styles.proximamente}>Próximamente</span>
            )}
          </button>
        ))}
      </div>

      <button
        ref={backBtnRef}
        className={styles.backButton}
        onClick={onBack}
      >
        ← Volver
      </button>

      <p className={styles.credits}>Desarrollado por Noah Technology Solutions</p>
    </div>
  );
};

export default GameMenu;