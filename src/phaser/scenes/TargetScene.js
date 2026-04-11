import * as Phaser from 'phaser';

/**
 * TargetScene — Placeholder para el juego de Tiro al Blanco.
 * La lógica del juego se desarrollará en la Fase 2.
 */
export class TargetScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TargetScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, '🎯 TargetScene Activa', {
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.statusText = this.add.text(16, 16, 'Esperando impacto del sensor...', {
      fontSize: '20px',
      color: '#fa804f',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 6 },
    });

    this.particles = this.add.particles(0, 0, '__DEFAULT', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      quantity: 20,
      emitting: false,
    });

    this._impactHandler = this.handleImpact.bind(this);
    window.addEventListener('laser-impact', this._impactHandler);
  }

  handleImpact(event) {
    const { x, y } = event.detail;
    this.particles.setPosition(x, y);
    this.particles.explode(25);
    this.statusText.setText(`💥 Impacto en X:${Math.round(x)} Y:${Math.round(y)}`);
  }

  shutdown() {
    window.removeEventListener('laser-impact', this._impactHandler);
  }
}