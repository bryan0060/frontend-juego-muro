// App.jsx

import { useState, useEffect } from 'react';
import './styles/global.css';
import StartScreen from './components/StartScreen/StartScreen';
import GameMenu from './components/GameMenu/GameMenu';
import PhaserGame from './components/PhaserGame/PhaserGame';
import CharacterSelection from './components/CharacterSelection/CharacterSelection';
import { connectWebSocket } from './services/websocket/WebSocketClient';

function App() {
  const [pantalla, setPantalla] = useState('inicio');
  const [juegoActivo, setJuegoActivo] = useState(null);
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null);

  // Reconectar el LiDAR cada vez que se muestra el menú
  useEffect(() => {
    if (pantalla === 'menu' || pantalla === 'inicio') {
      connectWebSocket(8081, '', null);
    }
  }, [pantalla]);

  const handleSelectGame = (juego) => {
    if (!juego.disponible) return; // ← guarda extra
    setJuegoActivo(juego);
    
    // Si es Subway Surfers, pasamos a selección de personaje
    if (juego.id === 'subway-surfers') {
      setPantalla('seleccion-personaje');
    } else {
      setPantalla('juego');
    }
  };

  const handleSelectCharacter = (personajeId) => {
    setPersonajeSeleccionado(personajeId);
    setPantalla('juego');
  };

  const handleBack = () => {
    if (juegoActivo?.id === 'subway-surfers') {
      setPersonajeSeleccionado(null);
      setPantalla('seleccion-personaje');
    } else {
      setJuegoActivo(null);
      setPersonajeSeleccionado(null);
      setPantalla('menu');
    }
  };

  return (
    <>
      {pantalla === 'inicio' && (
        <StartScreen onPlay={() => setPantalla('menu')} />
      )}
      {pantalla === 'menu' && (
        <GameMenu
          onSelectGame={handleSelectGame}
          onBack={() => setPantalla('inicio')}
        />
      )}
      {pantalla === 'seleccion-personaje' && (
        <CharacterSelection
          onSelect={handleSelectCharacter}
          onBack={() => {
            setJuegoActivo(null);
            setPantalla('menu');
          }}
        />
      )}
      {pantalla === 'juego' && juegoActivo && (
        <PhaserGame
          escenaInicial={juegoActivo.escena}
          wsPort={juegoActivo.wsPort}
          wsPath={juegoActivo.wsPath}
          wsJuego={juegoActivo.wsJuego}
          personajeId={personajeSeleccionado}
          onBack={handleBack}
        />
      )}
    </>
  );
}

export default App;