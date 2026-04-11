/**
 * BootScene — Primera escena que corre siempre.
 * Responsabilidad: precargar assets globales (imágenes, audio, spritesheets).
 * Cuando se añada un juego nuevo, sus assets se precargan aquí.
 */
import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'Cargando...', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  create() {
    // Leer la escena inicial definida desde React
    const escenaInicial = this.registry.get('escenaInicial') || 'BasketballScene';
    this.scene.start(escenaInicial);
  }
}