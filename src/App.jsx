/**
 * App.jsx — Punto de entrada principal de React.
 *
 * Maneja la navegación entre pantallas y transporta
 * el objeto completo del juego seleccionado.
 */

import { useState } from 'react';
import './styles/global.css';
import StartScreen from './components/StartScreen/StartScreen';
import GameMenu from './components/GameMenu/GameMenu';
import PhaserGame from './components/PhaserGame/PhaserGame';

function App() {
  const [pantalla, setPantalla] = useState('inicio');
  const [juegoActivo, setJuegoActivo] = useState(null);

  const handleSelectGame = (juego) => {
    // juego = { id, nombre, escena, wsPort, disponible, ... }
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