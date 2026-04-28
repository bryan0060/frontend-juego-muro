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


    // Sonidos
    this.load.audio('pop', 'assets/audio/pop.mp3');
    this.load.audio('tick', 'assets/audio/tick.mp3');
    this.load.audio('end', 'assets/audio/end.mp3');
    this.load.audio('victoria', 'assets/audio/victoria.mp3');
    this.load.image('keeper_neutral', 'assets/images/futbol/posicion1.png');
    this.load.image('keeper_side', 'assets/images/futbol/posicion iz.png');
    this.load.image('ball', 'assets/images/futbol/Balon.png');
  }

  create() {
    // Leer la escena inicial definida desde React
    const escenaInicial = this.registry.get('escenaInicial') || 'BasketballScene';
    this.scene.start(escenaInicial);
  }
}