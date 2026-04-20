// Configuración central de Phaser 3
import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SoccerScene } from './scenes/SoccerScene';


/**
 * Genera la config de Phaser adaptada al tamaño real de la pantalla.
 * Se llama en tiempo de ejecución para capturar las dimensiones reales
 * del dispositivo (crítico para proyección en pared de tamaño desconocido de momento).
 */

/**
 * @param {HTMLElement} parent - Contenedor DOM
 * @param {string} escenaInicial - Escena a lanzar después del Boot
 */

export const createPhaserConfig = (parent, escenaInicial = 'BasketballScene') => ({
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
  // Pasamos la escena inicial como datos globales
  callbacks: {
    preBoot: (game) => {
      game.registry.set('escenaInicial', escenaInicial);
    },
  },
  scene: [BootScene, SoccerScene],
});