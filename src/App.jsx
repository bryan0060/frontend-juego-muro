/**
 * App — Punto de entrada principal de React.
 * Por ahora monta directamente el juego para validar la integración.
 * En la Fase 1 añadiremos StartScreen y GameMenu aquí.
 */

import { useState } from 'react';
import './styles/global.css';
import StartScreen from './components/StartScreen/StartScreen';
import GameMenu from './components/GameMenu/GameMenu';
import PhaserGame from './components/PhaserGame/PhaserGame';

function App() {
  const [pantalla, setPantalla] = useState('inicio');
  const [escenaActiva, setEscenaActiva] = useState(null);

  const handleSelectGame = (escena) => {
    setEscenaActiva(escena);
    setPantalla('juego');
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
      {pantalla === 'juego' && (
        <PhaserGame
          escenaInicial={escenaActiva}
          onBack={() => setPantalla('menu')}
        />
      )}
    </>
  );
}

export default App;