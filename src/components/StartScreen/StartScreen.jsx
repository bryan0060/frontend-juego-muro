/**
 * StartScreen — Pantalla de bienvenida de Parke Tr3s.
 * Muestra el logo del parque y el botón para ir al menú de juegos.
 */

import styles from './StartScreen.module.css';

const StartScreen = ({ onPlay }) => {
  return (
    <div className={styles.container}>

      {/* Burbujas decorativas de fondo */}
      <div className={`${styles.bubble} ${styles.bubble1}`} />
      <div className={`${styles.bubble} ${styles.bubble2}`} />
      <div className={`${styles.bubble} ${styles.bubble3}`} />
      <div className={`${styles.bubble} ${styles.bubble4}`} />

      {/* Estrellas animadas */}
      <span className={`${styles.star} ${styles.star1}`}>⭐</span>
      <span className={`${styles.star} ${styles.star2}`}>🌟</span>
      <span className={`${styles.star} ${styles.star3}`}>✨</span>
      <span className={`${styles.star} ${styles.star4}`}>⭐</span>

      {/* Logo del parque */}
      <img
        src="/assets/images/Logo-parke.png"
        alt="Parke Tr3s"
        className={styles.logo}
      />

      {/* Botón principal */}
      <button className={styles.playButton} onClick={onPlay}>
        ¡A Jugar! 🎮
      </button>

      {/* Créditos */}
      <p className={styles.credits}>
        Desarrollado por Noah Technology Solutions
      </p>

    </div>
  );
};

export default StartScreen;