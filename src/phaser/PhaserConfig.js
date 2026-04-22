/**
 * PhaserConfig.js — Configuración central de Phaser.
 *
 * Solo registrar aquí las escenas que existen.
 * Para agregar una escena nueva: importarla y añadirla al array scene.
 */

import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SoccerScene } from './scenes/SoccerScene';

export const createPhaserConfig = (parent, escenaInicial = 'SoccerScene') => ({
  type: Phaser.AUTO,
  parent: parent,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: import.meta.env.DEV,
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
  scene: [BootScene, SoccerScene],
});