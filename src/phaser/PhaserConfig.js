import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SoccerScene } from './scenes/SoccerScene';
import { DuroMuroScene } from './scenes/DuroMuroScene';

import { MagicBoardScene } from './scenes/MagicBoardScene';
import { JustDanceScene } from './scenes/JustDanceScene';
<<<<<<< HEAD
import { SubwaySurfersScene } from './scenes/SubwaySurfersScene';

=======
import { AnimalesScene } from './scenes/AnimalesScene';
>>>>>>> b66ab8cfa21a1e7b6df25dace0036e4cbba87def


export const createPhaserConfig = (parent, escenaInicial = 'SoccerScene') => ({
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
  },
},

<<<<<<< HEAD
  scene: [BootScene, SoccerScene, DuroMuroScene, MagicBoardScene, JustDanceScene, SubwaySurfersScene],
=======
  scene: [BootScene, SoccerScene, DuroMuroScene, MagicBoardScene, JustDanceScene, AnimalesScene],
>>>>>>> b66ab8cfa21a1e7b6df25dace0036e4cbba87def
});
