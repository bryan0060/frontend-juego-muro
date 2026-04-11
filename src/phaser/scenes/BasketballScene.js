/**
 * BasketballScene — Escena de juego de Baloncesto.
 * Responsabilidad: lógica del juego, físicas y efectos visuales.
 * 
 * Escucha el evento global 'laser-impact' despachado por el WebSocketClient.
 * Esto desacopla completamente la lógica de red de la lógica del juego.
 */
import * as Phaser from 'phaser';

export class BasketballScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BasketballScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Fondo temporal para confirmar que la escena carga
    this.add.text(width / 2, height / 2, '🏀 BasketballScene activa', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Texto de debug para ver coordenadas de impacto
    this.statusText = this.add.text(16, 16, 'Esperando impacto del sensor...', {
      fontSize: '20px',
      color: '#00ff99',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 6 },
    });

    // --- PARTÍCULAS DE IMPACTO ---
    this.particles = this.add.particles(0, 0, '__DEFAULT', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      quantity: 20,
      emitting: false,
    });

    // --- ESCUCHAR EVENTOS DEL SENSOR ---
    this._impactHandler = this.handleImpact.bind(this);
    window.addEventListener('laser-impact', this._impactHandler);
  }

  /**
   * Maneja un impacto recibido del sensor láser (o del mock).
   * @param {CustomEvent} event - Contiene { detail: { x, y } }
   */
  handleImpact(event) {
    const { x, y } = event.detail;

    // Detonar partículas en el punto de impacto
    this.particles.setPosition(x, y);
    this.particles.explode(25);

    // Actualizar texto de debug
    this.statusText.setText(`💥 Impacto en X:${Math.round(x)} Y:${Math.round(y)}`);
  }

  shutdown() {
    // Limpiar listener al destruir la escena — evita memory leaks
    window.removeEventListener('laser-impact', this._impactHandler);
  }
}