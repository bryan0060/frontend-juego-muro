import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SoccerScene } from './scenes/SoccerScene';
import { DuroMuroScene } from './scenes/DuroMuroScene';

import { MagicBoardScene } from './scenes/MagicBoardScene';
import { JustDanceScene } from './scenes/JustDanceScene';

import { SubwaySurfersScene } from './scenes/SubwaySurfersScene';


import { AnimalesScene } from './scenes/AnimalesScene';



export const createPhaserConfig = (parent, escenaInicial = 'SoccerScene', personajeSeleccionado = null) => ({
  type: Phaser.AUTO,
  parent: parent,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  callbacks: {
    preBoot: (game) => {
      game.registry.set('escenaInicial', escenaInicial);
      if (personajeSeleccionado) {
        game.registry.set('personajeSeleccionado', personajeSeleccionado);
      }
    },
  },

  scene: [BootScene, SoccerScene, DuroMuroScene, MagicBoardScene, JustDanceScene, SubwaySurfersScene, AnimalesScene],
});
