/**
 * GameMenu.jsx — Menú de selección de juegos.
 *
 * Lee los juegos desde games.config.js.
 * Para agregar un juego nuevo, solo tocar el config.
 */

import styles from './GameMenu.module.css';
import { GAMES } from '../../config/games.config';

const GameMenu = ({ onSelectGame, onBack }) => {
  return (
    <div className={styles.container}>

      <div className={`${styles.bubble} ${styles.bubble1}`} />
      <div className={`${styles.bubble} ${styles.bubble2}`} />

      <h1 className={styles.title}>¿A qué jugamos hoy? 🎉</h1>

      <div className={styles.grid}>
        {GAMES.map((juego) => (
          <button
            key={juego.id}
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

      <button className={styles.backButton} onClick={onBack}>
        ← Volver
      </button>

      <p className={styles.credits}>Desarrollado por Noah Technology Solutions</p>
    </div>
  );
};

export default GameMenu;