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
    // TODO: Cargar assets reales aquí cuando estén listos
    // this.load.image('ball-basket', 'assets/images/ball-basket.png');
    // this.load.audio('impact', 'assets/audio/impact.mp3');

    // Pantalla de carga mínima mientras se descargan los assets
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'Cargando...', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  create() {
    // Cuando los assets estén listos, ir a la escena de baloncesto
    // En el futuro esto lo controlará el GameMenu de React
    this.scene.start('BasketballScene');
  }
}