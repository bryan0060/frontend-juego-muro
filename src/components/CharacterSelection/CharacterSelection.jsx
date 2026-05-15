import { useEffect, useRef } from 'react';
import styles from './CharacterSelection.module.css';
import { getFirstTouch } from '../../services/websocket/WebSocketClient';

const CHARACTERS = [
  { id: 'NB1', image: 'assets/images/subway/Personaje/personaje1.png', label: 'Personaje 1' },
  { id: 'NB2', image: 'assets/images/subway/Personaje/Personaje2.png', label: 'Personaje 2' },
  { id: 'NB3', image: 'assets/images/subway/Personaje/personaje3.png', label: 'Personaje 3' },
  { id: 'NB4', image: 'assets/images/subway/Personaje/Personaje4.png', label: 'Personaje 4' },
];

const CharacterSelection = ({ onSelect, onBack }) => {
  const cardRefs = useRef({});
  const backBtnRef = useRef(null);

  useEffect(() => {
    const mountTime = Date.now();

    const handleSensor = (e) => {
      if (e.detail.port !== 8081) return;
      if (Date.now() - mountTime < 1000) return; // Pequeño delay para evitar toques accidentales

      const touch = getFirstTouch(e.detail);
      if (!touch) return;
      const { x, y } = touch;

      // Botón Volver
      const backEl = backBtnRef.current;
      if (backEl) {
        const rect = backEl.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          onBack();
          return;
        }
      }

      // Selección de Personajes
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
  }, [onSelect, onBack]);

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
        className={styles.backButton}
        onClick={onBack}
      >
        ← Menú
      </button>

      <div className={styles.hint}>Toca una foto para elegir</div>
    </div>
  );
};

export default CharacterSelection;
