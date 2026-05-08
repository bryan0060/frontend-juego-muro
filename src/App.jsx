// App.jsx

import { useState, useEffect } from 'react';
import './styles/global.css';
import StartScreen from './components/StartScreen/StartScreen';
import GameMenu from './components/GameMenu/GameMenu';
import PhaserGame from './components/PhaserGame/PhaserGame';
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
    setJuegoActivo(juego);
    setPantalla('juego');
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
      {pantalla === 'juego' && juegoActivo && (
        <PhaserGame
          escenaInicial={juegoActivo.escena}
          wsPort={juegoActivo.wsPort}
          wsPath={juegoActivo.wsPath}
          wsJuego={juegoActivo.wsJuego}
          onBack={handleBack}
        />
      )}
    </>
  );
}

export default App;