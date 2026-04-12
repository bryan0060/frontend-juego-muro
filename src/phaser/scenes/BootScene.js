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

    // Pantalla de carga
    const loadingText = this.add.text(width / 2, height / 2, 'Cargando...', {
      fontSize: '32px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Assets de globos
    this.load.image('balloon_purple', 'assets/images/balloons/balloon_purple.png');
    this.load.image('balloon_purple_light', 'assets/images/balloons/balloon_purple_light.png');
    this.load.image('balloon_pink', 'assets/images/balloons/balloon_pink.png');
    this.load.image('balloon_orange', 'assets/images/balloons/balloon_orange.png');
    this.load.image('balloon_yellow', 'assets/images/balloons/balloon_yellow.png');
    this.load.image('balloon_green', 'assets/images/balloons/balloon_green.png');
    this.load.image('balloon_blue', 'assets/images/balloons/balloon_blue.png');

    // Sonidos
    this.load.audio('pop', 'assets/audio/pop.mp3');
    this.load.audio('tick', 'assets/audio/tick.mp3');
    this.load.audio('end', 'assets/audio/end.mp3');
  }

  create() {
    // Leer la escena inicial definida desde React
    const escenaInicial = this.registry.get('escenaInicial') || 'BasketballScene';
    this.scene.start(escenaInicial);
  }
}