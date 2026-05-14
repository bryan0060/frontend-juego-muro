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

  // Reconectar el LiDAR cada vez que se muestra el menú
  useEffect(() => {
    if (pantalla === 'menu' || pantalla === 'inicio') {
      connectWebSocket(8081, '', null);
    }
  }, [pantalla]);

  const handleSelectGame = (juego) => {
    if (!juego.disponible) return; // ← guarda extra
    setJuegoActivo(juego);
    if (juego.id === 'subway-surfers') {
      setPantalla('seleccion-personaje');
    } else {
      setPantalla('juego');
    }
  };

  const handleBack = () => {
    setJuegoActivo(null);
    setPantalla('menu');
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
          onSelect={(char) => {
            setJuegoActivo(prev => ({ ...prev, personaje: char.id }));
            setPantalla('juego');
          }}
          onBack={handleBack}
        />
      )}
      {pantalla === 'juego' && juegoActivo && (
        <PhaserGame
          escenaInicial={juegoActivo.escena}
          wsPort={juegoActivo.wsPort}
          wsPath={juegoActivo.wsPath}
          wsJuego={juegoActivo.wsJuego}
          personaje={juegoActivo.personaje}
          onBack={handleBack}
        />
      )}
    </>
  );
}

export default App;