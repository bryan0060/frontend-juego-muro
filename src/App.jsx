/**
 * App — Punto de entrada principal de React.
 * Por ahora monta directamente el juego para validar la integración.
 * En la Fase 1 añadiremos StartScreen y GameMenu aquí.
 */

import './styles/global.css';
import PhaserGame from './components/PhaserGame/PhaserGame';

function App() {
  return <PhaserGame />;
}

export default App;