/**
 * StartScreen — Pantalla de bienvenida de Parke Tr3s.
 * Muestra el logo del parque y el botón para ir al menú de juegos.
 */

import { useState } from 'react';
import styles from './StartScreen.module.css';

// Lista de las 6 canciones proporcionadas por el usuario
const SONGS_LIST = [
  '/assets/audioyvideosv/songsafepapper_1.mp3',
  '/assets/audioyvideosv/songsafepapper_2.mp3',
  '/assets/audioyvideosv/songsafepapper_3.mp3',
  '/assets/audioyvideosv/songsafepapper_4.mp3',
  '/assets/audioyvideosv/songsafepapper_5.mp3',
  '/assets/audioyvideosv/songsafepapper_6.mp3',
];

// Lista de videos del salvapantallas
const VIDEOS_LIST = [
  '/assets/audioyvideosv/salvapantallas.mp4',
  '/assets/audioyvideosv/salvapantallas2.mp4',
];

const StartScreen = ({ onPlay }) => {
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Selecciona una canción aleatoria
  const playRandomSong = () => {
    const randomIndex = Math.floor(Math.random() * SONGS_LIST.length);
    setCurrentSongIndex(randomIndex);
  };

  // Avanza al siguiente video al terminar el actual (crea el bucle entre los 2)
  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % VIDEOS_LIST.length);
  };

  // Cierra el salvapantallas
  const handleCloseScreensaver = () => {
    setShowScreensaver(false);
  };

  // Abre el salvapantallas e inicia todo desde cero con una canción aleatoria
  const handleOpenScreensaver = () => {
    setCurrentVideoIndex(0); // Empezar por el primer video
    playRandomSong();        // Seleccionar canción aleatoria
    setShowScreensaver(true);
  };

  return (
    <div className={styles.container}>

      {/* --- SALVAPANTALLAS --- */}
      {showScreensaver && (
        <div className={styles.screensaverOverlay} onClick={handleCloseScreensaver}>
          {/* Reproductor de Video (avanza al siguiente video al terminar) */}
          <video
            src={VIDEOS_LIST[currentVideoIndex]}
            autoPlay
            muted
            onEnded={handleVideoEnded}
            className={styles.screensaverVideo}
          />
          {/* Audio que se reproduce aleatoriamente */}
          <audio
            src={SONGS_LIST[currentSongIndex]}
            autoPlay
            onEnded={playRandomSong}
          />
        </div>
      )}

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

      {/* Botón para activar el salvapantallas (estrella interactiva) */}
      <button
        className={styles.starButton}
        onClick={handleOpenScreensaver}
        title="Activar Salvapantallas"
      >
        ⭐
      </button>

    </div>
  );
};

export default StartScreen;