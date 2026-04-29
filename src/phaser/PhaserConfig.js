import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SoccerScene } from './scenes/SoccerScene';
import { DuroMuroScene } from './scenes/DuroMuroScene';
import { JustDanceScene } from './scenes/JustDanceScene';

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
    postBoot: (game) => {
      game.registry.set('escenaInicial', escenaInicial);
    },
  },
  scene: [BootScene, SoccerScene, DuroMuroScene, JustDanceScene],
});
