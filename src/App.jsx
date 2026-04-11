/**
 * App — Punto de entrada principal de React.
 * Por ahora monta directamente el juego para validar la integración.
 * En la Fase 1 añadiremos StartScreen y GameMenu aquí.
 */

import { useState } from 'react';
import './styles/global.css';
import StartScreen from './components/StartScreen/StartScreen';
import PhaserGame from './components/PhaserGame/PhaserGame';

function App() {
  const [pantalla, setPantalla] = useState('inicio');

  return (
    <>
      {pantalla === 'inicio' && (
        <StartScreen onPlay={() => setPantalla('juego')} />
      )}
      {pantalla === 'juego' && (
        <PhaserGame />
      )}
    </>
  );
}

export default App;