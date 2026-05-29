import { useEffect, useRef, useState } from 'react';
import styles from './CharacterSelection.module.css';
import { getFirstTouch, connectWebSocket } from '../../services/websocket/WebSocketClient';

const CHARACTERS = [
  { id: 'NB1', image: 'assets/images/subway/Personaje/personajef1.png', label: 'Personaje 1' },
  { id: 'NB2', image: 'assets/images/subway/Personaje/personajef2.png', label: 'Personaje 2' },
  { id: 'NB3', image: 'assets/images/subway/Personaje/personajef3.png', label: 'Personaje 3' },
  { id: 'NB4', image: 'assets/images/subway/Personaje/personajef4.png', label: 'Personaje 4' },
];

const CharacterSelection = ({ onSelect, onBack }) => {
  const cardRefs = useRef({});
  const backBtnRef = useRef(null);

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const sensorHoldingRef = useRef(false);
  const mouseHoldingRef = useRef(false);

  const updateHoldingState = () => {
    setIsHolding(sensorHoldingRef.current || mouseHoldingRef.current);
  };

  // Música de fondo del menú
  useEffect(() => {
    const audio = new Audio('assets/audio/subway surfer/menú de personajes/Song_1.mp3');
    audio.loop = true;
    audio.volume = 0.4;

    // El autoplay puede estar bloqueado por el navegador hasta que haya interacción,
    // pero intentamos reproducirlo de inmediato.
    audio.play().catch(e => console.log('Audio autoplay bloqueado:', e));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Temporizador para el progreso de mantención (llenado y vaciado progresivo)
  useEffect(() => {
    let timer = null;
    if (isHolding) {
      timer = setInterval(() => {
        setHoldProgress((prev) => {
          const next = Math.min(prev + (20 / 1000) * 100, 100); // 1 segundo
          if (next >= 100) {
            clearInterval(timer);
            setTimeout(onBack, 0); // Evitar disparar en medio de la actualización de estado
          }
          return next;
        });
      }, 20);
    } else {
      // Vaciado suave (drain) del progreso al soltar
      timer = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return Math.max(prev - (20 / 300) * 100, 0); // Vaciado rápido en 300ms
        });
      }, 20);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isHolding, onBack]);

  // Listener para el sensor WebSocket (Radar LiDAR / Toque)
  useEffect(() => {
    connectWebSocket(8081);
    const mountTime = Date.now();

    const handleSensor = (e) => {
      if (e.detail.port !== 8081) return;
      if (Date.now() - mountTime < 1000) return; // Pequeño delay para evitar toques accidentales

      const touch = getFirstTouch(e.detail);
      if (!touch) {
        sensorHoldingRef.current = false;
        updateHoldingState();
        return;
      }
      const { x, y } = touch;

      // Detectar si el sensor está tocando el Botón Volver
      const backEl = backBtnRef.current;
      if (backEl) {
        const rect = backEl.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          sensorHoldingRef.current = true;
          updateHoldingState();
          return;
        }
      }

      sensorHoldingRef.current = false;
      updateHoldingState();

      // Selección de Personajes (toque instantáneo normal)
      for (const char of CHARACTERS) {
        const el = cardRefs.current[char.id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          onSelect(char.id);
          break;
        }
      }
    };

    window.addEventListener('ws-message', handleSensor);
    return () => window.removeEventListener('ws-message', handleSensor);
  }, [onSelect]);

  const handleMouseDown = () => {
    mouseHoldingRef.current = true;
    updateHoldingState();
  };

  const handleMouseUpOrLeave = () => {
    mouseHoldingRef.current = false;
    updateHoldingState();
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />

      <h1 className={styles.title}>Selecciona tu Personaje</h1>

      <div className={styles.grid}>
        {CHARACTERS.map((char) => (
          <div
            key={char.id}
            ref={el => cardRefs.current[char.id] = el}
            className={styles.card}
            onClick={() => onSelect(char.id)}
          >
            <div className={styles.imageWrapper}>
              <img src={char.image} alt={char.label} className={styles.image} />
            </div>
            <div className={styles.nameTag}>{char.label}</div>
          </div>
        ))}
      </div>

      <button
        ref={backBtnRef}
        className={`${styles.backButton} ${isHolding ? styles.holding : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUpOrLeave}
      >
        <span className={styles.progressFill} style={{ width: `${holdProgress}%` }} />
        <span className={styles.buttonText}>
          {holdProgress > 0 ? `Mantén: ${Math.round(holdProgress)}%` : '← Menú'}
        </span>
      </button>

      <div className={styles.hint}>Toca una foto para elegir</div>
    </div>
  );
};

export default CharacterSelection;
