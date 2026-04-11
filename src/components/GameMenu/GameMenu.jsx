/**
 * GameMenu — Pantalla de selección de juegos.
 * Cada tarjeta lanza una escena diferente de Phaser.
 * Para añadir un juego nuevo: agregar un objeto al array JUEGOS.
 */

import styles from './GameMenu.module.css';

// Para añadir un juego nuevo, solo agrega un objeto aquí
const JUEGOS = [
  {
    id: 'basketball',
    nombre: 'Baloncesto',
    emoji: '🏀',
    escena: 'BasketballScene',
    estilo: styles.cardBasketball,
  },
  {
    id: 'soccer',
    nombre: 'Fútbol',
    emoji: '⚽',
    escena: 'SoccerScene',
    estilo: styles.cardSoccer,
  },
  {
    id: 'target',
    nombre: 'Tiro al Blanco',
    emoji: '🎯',
    escena: 'TargetScene',
    estilo: styles.cardTarget,
  },
];

const GameMenu = ({ onSelectGame, onBack }) => {
  return (
    <div className={styles.container}>

      {/* Burbujas decorativas */}
      <div className={`${styles.bubble} ${styles.bubble1}`} />
      <div className={`${styles.bubble} ${styles.bubble2}`} />

      <h1 className={styles.title}>¿A qué jugamos hoy? 🎉</h1>

      {/* Tarjetas de juegos */}
      <div className={styles.grid}>
        {JUEGOS.map((juego) => (
          <button
            key={juego.id}
            className={`${styles.card} ${juego.estilo}`}
            onClick={() => onSelectGame(juego.escena)}
          >
            <span className={styles.cardEmoji}>{juego.emoji}</span>
            {juego.nombre}
          </button>
        ))}
      </div>

      {/* Botón volver */}
      <button className={styles.backButton} onClick={onBack}>
        ← Volver
      </button>

      <p className={styles.credits}>Desarrollado por Noah Technology Solutions</p>
    </div>
  );
};

export default GameMenu;