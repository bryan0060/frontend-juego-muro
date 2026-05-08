import { useEffect, useRef } from 'react';
import styles from './GameMenu.module.css';
import { GAMES } from '../../config/games.config';

const GameMenu = ({ onSelectGame, onBack }) => {
  const cardRefs = useRef({});
  const backBtnRef = useRef(null); // ← AGREGAR

  useEffect(() => {
    const mountTime = Date.now(); // ← timestamp de cuando montó el componente

    const handleSensor = (e) => {
      if (e.detail.port !== 8081) return;
      if (Date.now() - mountTime < 500) return; // ← ignorar eventos tempranos

      const { x, y } = e.detail;

      // Chequear botón volver
      const backEl = backBtnRef.current;
      if (backEl) {
        const rect = backEl.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          onBack();
          return;
        }
      }

      // Chequear cards de juegos
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
            onClick={() => juego.disponible && onSelectGame(juego)}
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
        ref={backBtnRef} // ← AGREGAR
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