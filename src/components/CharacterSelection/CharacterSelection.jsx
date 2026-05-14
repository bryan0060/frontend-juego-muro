import styles from './CharacterSelection.module.css';

const characters = [
  { id: 'nino_blanco', name: 'Niño Blanco', isVideo: true, path: '/assets/images/subway/personajes/NiñoBlanco.mp4' },
  { id: 'empty_1', name: 'Próximamente', isEmpty: true },
  { id: 'empty_2', name: 'Próximamente', isEmpty: true },
  { id: 'empty_3', name: 'Próximamente', isEmpty: true },
];

const CharacterSelection = ({ onSelect, onBack }) => {
  return (
    <div className={styles.selectionContainer}>
      <h1 className={styles.title}>Selecciona tu Personaje</h1>
      <div className={styles.grid}>
        {characters.map((char) => (
          <div
            key={char.id}
            className={`${styles.card} ${char.isEmpty ? styles.emptyCard : ''}`}
            onClick={() => !char.isEmpty && onSelect(char)}
          >
            {char.isVideo ? (
              <video
                src={char.path}
                className={styles.charVideo}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div className={styles.placeholder}>
                {char.isEmpty ? '?' : ''}
              </div>
            )}
            <h3 className={styles.charName}>{char.name}</h3>
          </div>
        ))}
      </div>
      <button className={styles.backButton} onClick={onBack}>
        Volver
      </button>
    </div>
  );
};

export default CharacterSelection;
