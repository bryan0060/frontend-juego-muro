import { useState, useEffect, useRef } from 'react';
import styles from './StartScreen.module.css';

const SONGS_LIST = [
  '/assets/audioyvideosv/songsafepapper_1.mp3',
  '/assets/audioyvideosv/songsafepapper_2.mp3',
  '/assets/audioyvideosv/songsafepapper_3.mp3',
  '/assets/audioyvideosv/songsafepapper_4.mp3',
  '/assets/audioyvideosv/songsafepapper_5.mp3',
  '/assets/audioyvideosv/songsafepapper_6.mp3',
];

const VIDEOS_LIST = [
  '/assets/audioyvideosv/salvapantallas.mp4',
  '/assets/audioyvideosv/salvapantallas2.mp4',
];

const StartScreen = ({ onPlay }) => {
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const playBtnRef = useRef(null);   // ← AGREGAR
  const starBtnRef = useRef(null);   // ← AGREGAR

  const playRandomSong = () => {
    const randomIndex = Math.floor(Math.random() * SONGS_LIST.length);
    setCurrentSongIndex(randomIndex);
  };

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % VIDEOS_LIST.length);
  };

  const handleCloseScreensaver = () => setShowScreensaver(false);

  const handleOpenScreensaver = () => {
    setCurrentVideoIndex(0);
    playRandomSong();
    setShowScreensaver(true);
  };

  // ← AGREGAR
  useEffect(() => {
    const handleSensor = (e) => {
      if (e.detail.port !== 8081) return;
      const { x, y } = e.detail;

      // Si el salvapantallas está activo, cualquier toque lo cierra
      if (showScreensaver) {
        handleCloseScreensaver();
        return;
      }

      // Chequear botón ¡A Jugar!
      const playEl = playBtnRef.current;
      if (playEl) {
        const rect = playEl.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          onPlay();
          return;
        }
      }

      // Chequear botón salvapantallas
      // Chequear botón salvapantallas
      const starEl = starBtnRef.current;
      if (starEl) {
        const rect = starEl.getBoundingClientRect();
        const margin = 20; // ← margen extra alrededor del botón
        if (
          x >= rect.left - margin && x <= rect.right + margin &&
          y >= rect.top - margin && y <= rect.bottom + margin
        ) {
          handleOpenScreensaver();
          return;
        }
      }
    };

    window.addEventListener('ws-message', handleSensor);
    return () => window.removeEventListener('ws-message', handleSensor);
  }, [showScreensaver]); // ← depende de showScreensaver para el cierre del salvapantallas

  return (
    <div className={styles.container}>

      {showScreensaver && (
        <div className={styles.screensaverOverlay} onClick={handleCloseScreensaver}>
          <video
            src={VIDEOS_LIST[currentVideoIndex]}
            autoPlay
            muted
            onEnded={handleVideoEnded}
            className={styles.screensaverVideo}
          />
          <audio
            src={SONGS_LIST[currentSongIndex]}
            autoPlay
            onEnded={playRandomSong}
          />
        </div>
      )}

      <div className={`${styles.bubble} ${styles.bubble1}`} />
      <div className={`${styles.bubble} ${styles.bubble2}`} />
      <div className={`${styles.bubble} ${styles.bubble3}`} />
      <div className={`${styles.bubble} ${styles.bubble4}`} />

      <span className={`${styles.star} ${styles.star1}`}>⭐</span>
      <span className={`${styles.star} ${styles.star2}`}>🌟</span>
      <span className={`${styles.star} ${styles.star3}`}>✨</span>
      <span className={`${styles.star} ${styles.star4}`}>⭐</span>

      <img
        src="/assets/images/Logo-parke.png"
        alt="Parke Tr3s"
        className={styles.logo}
      />

      <button
        ref={playBtnRef} // ← AGREGAR
        className={styles.playButton}
        onClick={onPlay}
      >
        ¡A Jugar! 🎮
      </button>

      <p className={styles.credits}>
        Desarrollado por Noah Technology Solutions
      </p>

      <button
        ref={starBtnRef} // ← AGREGAR
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