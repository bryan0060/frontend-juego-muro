// Configuración central de Phaser 3
import { BootScene } from './scenes/BootScene';
import { BasketballScene } from './scenes/BasketballScene';
import * as Phaser from 'phaser';

/**
 * Genera la config de Phaser adaptada al tamaño real de la pantalla.
 * Se llama en tiempo de ejecución para capturar las dimensiones reales
 * del dispositivo (crítico para proyección en pared de tamaño desconocido de momento).
 */
export const createPhaserConfig = (parent) => ({
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
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, BasketballScene],
});