
/**
 * TargetScene — Juego de Globos Flotantes
 * El niño lanza pelotas físicas contra la pared.
 * El sensor RPlidar detecta el impacto y lo enviamos como evento.
 */

// Configuración del juego — fácil de ajustar
import * as Phaser from 'phaser';

const CONFIG = {
  duracionPartida: 20,
  intervaloGlobo: 1500,
  intervaloMinimo: 600,
  globos: [
    { key: 'balloon_purple', puntos: 20, velocidad: 130, escala: 1.0 },
    { key: 'balloon_purple_light', puntos: 10, velocidad: 90, escala: 1.2 },
    { key: 'balloon_pink', puntos: 20, velocidad: 130, escala: 1.0 },
    { key: 'balloon_orange', puntos: 10, velocidad: 90, escala: 1.2 },
    { key: 'balloon_yellow', puntos: 50, velocidad: 170, escala: 0.7 },
    { key: 'balloon_green', puntos: 20, velocidad: 130, escala: 1.0 },
    { key: 'balloon_blue', puntos: 10, velocidad: 90, escala: 1.2 },
  ],
  confeti: [0xfa804f, 0xfdbf2c, 0x3dc9a1, 0x9c4eb3, 0x40c0dd, 0xff6b9d, 0xffffff],
};

export class TargetScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TargetScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.puntaje = 0;
    this.combo = 0;
    this.tiempoRestante = CONFIG.duracionPartida;
    this.globos = [];
    this.juegoActivo = true;

    // --- FONDO ---
    this.add.rectangle(0, 0, width, height, 0x1a0a2e).setOrigin(0);
    this._crearEstrellasFondo(width, height);

    // --- SONIDOS ---
    this.sonidoPop = this.sound.add('pop', { volume: 0.7 });
    this.sonidoTick = this.sound.add('tick', { volume: 1.0 });

    
    this.sonidoEnd = this.sound.add('end', { volume: 0.8 });

    // --- UI ---
    this.textoPuntaje = this.add.text(width / 2, 40, '0', {
      fontSize: '64px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0).setDepth(10);

    this.add.text(width / 2, 30, 'PUNTOS', {
      fontSize: '22px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff88',
    }).setOrigin(0.5, 1).setDepth(10);

    this.textoTimer = this.add.text(width - 30, 30, this.tiempoRestante.toString(), {
      fontSize: '52px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(1, 0).setDepth(10);

    this.add.text(width - 30, 26, 'SEG', {
      fontSize: '18px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff88',
    }).setOrigin(1, 1).setDepth(10);

    this.textoCombo = this.add.text(30, 30, '', {
      fontSize: '36px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fa804f',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0, 0).setDepth(10);

    // --- TIMER ---
    this.timerEvento = this.time.addEvent({
      delay: 1000,
      callback: this._tickTimer,
      callbackScope: this,
      loop: true,
    });

    // --- SPAWNER ---
    this._spawnGlobo();
    this._programarSiguienteGlobo();

    // --- SENSOR ---
    this._impactHandler = this.handleImpact.bind(this);
    window.addEventListener('laser-impact', this._impactHandler);

    this._mostrarCuentaRegresiva();
  }

  // ─── Cuenta regresiva ─────────────────────────────────────────
  _mostrarCuentaRegresiva() {
    const { width, height } = this.scale;
    this.juegoActivo = false;

    const numeros = ['3', '2', '1', '¡YA!'];
    let i = 0;

    const mostrar = () => {
      const texto = this.add.text(width / 2, height / 2, numeros[i], {
        fontSize: '160px',
        fontFamily: 'Fredoka, sans-serif',
        color: '#ffffff',
        stroke: '#9c4eb3',
        strokeThickness: 12,
      }).setOrigin(0.5).setDepth(20).setAlpha(0);

      this.tweens.add({
        targets: texto,
        alpha: { from: 0, to: 1 },
        scaleX: { from: 0.3, to: 1 },
        scaleY: { from: 0.3, to: 1 },
        duration: 300,
        onComplete: () => {
          this.time.delayedCall(600, () => {
            this.tweens.add({
              targets: texto,
              alpha: 0,
              duration: 200,
              onComplete: () => {
                texto.destroy();
                i++;
                if (i < numeros.length) {
                  mostrar();
                } else {
                  this.juegoActivo = true;
                }
              }
            });
          });
        }
      });
    };

    mostrar();
  }

  // ─── Estrellas de fondo ───────────────────────────────────────
  _crearEstrellasFondo(width, height) {
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.6);
      const circ = this.add.circle(x, y, r, 0xffffff, alpha);

      this.tweens.add({
        targets: circ,
        alpha: 0.05,
        duration: Phaser.Math.Between(800, 2500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  // ─── Spawner ──────────────────────────────────────────────────
  _programarSiguienteGlobo() {
    const progreso = 1 - (this.tiempoRestante / CONFIG.duracionPartida);
    const intervalo = Phaser.Math.Linear(
      CONFIG.intervaloGlobo,
      CONFIG.intervaloMinimo,
      progreso
    );

    this.time.delayedCall(intervalo, () => {
      if (this.tiempoRestante > 0) {
        this._spawnGlobo();
        this._programarSiguienteGlobo();
      }
    });
  }

  // ─── Crear globo ──────────────────────────────────────────────
  _spawnGlobo() {
    const { width, height } = this.scale;
    const tipo = Phaser.Utils.Array.GetRandom(CONFIG.globos);
    const radio = (128 * tipo.escala) / 2; // tamaño base del PNG
    const x = Phaser.Math.Between(radio + 20, width - radio - 20);

    // Contenedor principal
    const container = this.add.container(x, height + radio + 10);
    container.setDepth(5);

    // Imagen del globo
    const imagen = this.add.image(0, 0, tipo.key);
    imagen.setScale(tipo.escala);

    // Hilo del globo
    const hilo = this.add.graphics();
    hilo.lineStyle(2, 0xffffff, 0.5);
    hilo.beginPath();
    hilo.moveTo(0, radio);
    hilo.lineTo(
      Phaser.Math.Between(-15, 15),
      radio + 55
    );
    hilo.strokePath();

    // Nudo pequeño
    const nudo = this.add.circle(0, radio + 4, 5, 0xffffff, 0.6);

    container.add([hilo, nudo, imagen]);

    container.setData('radio', radio);
    container.setData('puntos', tipo.puntos);
    container.setData('activo', true);
    container.setData('xBase', x);
    container.setData('amplitud', Phaser.Math.Between(60, 140));
    container.setData('frecuencia', Phaser.Math.FloatBetween(0.015, 0.03));
    container.setData('t', 0);

    // Movimiento vertical
    this.tweens.add({
      targets: container,
      y: -radio - 80,
      duration: (height / tipo.velocidad) * 1000,
      ease: 'Linear',
      onComplete: () => {
        if (container.getData('activo')) {
          this.combo = 0;
          this._actualizarCombo();
        }
        container.destroy();
        this.globos = this.globos.filter(g => g !== container);
      }
    });

    this.globos.push(container);
  }

  // ─── Update zigzag ────────────────────────────────────────────
  update() {
    this.globos.forEach(globo => {
      if (!globo.active) return;
      const t = globo.getData('t') + 1;
      const xBase = globo.getData('xBase');
      const amplitud = globo.getData('amplitud');
      const frecuencia = globo.getData('frecuencia');
      globo.setData('t', t);
      globo.x = xBase + Math.sin(t * frecuencia) * amplitud;
    });
  }

  // ─── Timer ────────────────────────────────────────────────────
  _tickTimer() {
    if (!this.juegoActivo) return;
    this.tiempoRestante--;
    this.textoTimer.setText(`${this.tiempoRestante}`);


    if (this.tiempoRestante <= 10 && this.tiempoRestante > 0) {
      this.textoTimer.setColor('#fa804f');
      this.cameras.main.shake(80, 0.002);
      if (this.sonidoTick.isPlaying) this.sonidoTick.stop();
      this.sonidoTick.play();
    }

    if (this.tiempoRestante <= 0) {
      if (this.sonidoTick.isPlaying) this.sonidoTick.stop();
      this._finDePartida();
    }
  }

  // ─── Impacto del sensor ───────────────────────────────────────
  handleImpact(event) {
    if (!this.juegoActivo) return;
    const { x, y } = event.detail;

    let golpeado = false;

    for (let i = this.globos.length - 1; i >= 0; i--) {
      const globo = this.globos[i];
      if (!globo.active || !globo.getData('activo')) continue;

      const radio = globo.getData('radio');
      const dist = Phaser.Math.Distance.Between(x, y, globo.x, globo.y);

      if (dist <= radio) {
        this._explotarGlobo(globo, x, y);
        golpeado = true;
        break;
      }
    }

    if (!golpeado) {
      this._efectoFallo(x, y);
      this.combo = 0;
      this._actualizarCombo();
    }
  }

  // ─── Explotar globo ───────────────────────────────────────────
  _explotarGlobo(globo, impactoX, impactoY) {
    const puntos = globo.getData('puntos');

    this.combo++;
    const multiplicador = Math.min(this.combo, 5);
    const puntosFinales = puntos * multiplicador;
    this.puntaje += puntosFinales;

    globo.setData('activo', false);
    this.globos = this.globos.filter(g => g !== globo);

    // Animación de pop — escala rápida antes de destruir
    this.tweens.add({
      targets: globo,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 120,
      ease: 'Power2',
      onComplete: () => globo.destroy(),
    });

    this.sonidoPop.play();

    // Confeti de colores
    CONFIG.confeti.forEach((color, idx) => {
      const emitter = this.add.particles(globo.x, globo.y, '__DEFAULT', {
        speed: { min: 200, max: 500 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        tint: color,
        blendMode: 'NORMAL',
        lifespan: 800,
        quantity: 6,
        gravityY: 300,
        emitting: false,
      });
      emitter.explode(6);
      this.time.delayedCall(900, () => emitter.destroy());
    });

    // Destellos adicionales
    const destellos = this.add.particles(globo.x, globo.y, '__DEFAULT', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      tint: 0xffffff,
      blendMode: 'ADD',
      lifespan: 500,
      quantity: 15,
      emitting: false,
    });
    destellos.explode(15);
    this.time.delayedCall(600, () => destellos.destroy());

    // Texto flotante de puntaje
    const prefijo = multiplicador > 1 ? `x${multiplicador} ` : '';
    const textoFlotante = this.add.text(globo.x, globo.y, `${prefijo}+${puntosFinales}`, {
      fontSize: multiplicador > 1 ? '52px' : '38px',
      fontFamily: 'Fredoka, sans-serif',
      color: multiplicador > 1 ? '#fdbf2c' : '#ffffff',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: textoFlotante,
      y: globo.y - 140,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => textoFlotante.destroy(),
    });

    // Shake de cámara
    this.cameras.main.shake(150, multiplicador > 2 ? 0.01 : 0.005);

    // Actualizar UI
    this.textoPuntaje.setText(`${this.puntaje}`);
    this._actualizarCombo();
  }

  // ─── Efecto de fallo ──────────────────────────────────────────
  _efectoFallo(x, y) {
    const texto = this.add.text(x, y, '✗', {
      fontSize: '52px',
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: texto,
      y: y - 70,
      alpha: 0,
      duration: 600,
      onComplete: () => texto.destroy(),
    });
  }

  // ─── Combo UI ─────────────────────────────────────────────────
  _actualizarCombo() {
    if (this.combo >= 2) {
      this.textoCombo.setText(`🔥 COMBO x${Math.min(this.combo, 5)}`);
    } else {
      this.textoCombo.setText('');
    }
  }

  // ─── Fin de partida ───────────────────────────────────────────
  _finDePartida() {
    this.juegoActivo = false;
    this.timerEvento.destroy();

    // Detener tick si sigue sonando
    if (this.sonidoTick.isPlaying) {
      this.sonidoTick.stop();
    }

    this.sonidoEnd.play();

    this.globos.forEach(g => g.destroy());
    this.globos = [];

    const { width, height } = this.scale;

    // Confeti de celebración final
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 200, () => {
        CONFIG.confeti.forEach(color => {
          const emitter = this.add.particles(
            Phaser.Math.Between(0, width),
            Phaser.Math.Between(0, height / 2),
            '__DEFAULT',
            {
              speed: { min: 100, max: 300 },
              angle: { min: 0, max: 360 },
              scale: { start: 0.5, end: 0 },
              tint: color,
              lifespan: 1000,
              quantity: 8,
              gravityY: 200,
              emitting: false,
            }
          );
          emitter.explode(8);
          this.time.delayedCall(1200, () => emitter.destroy());
        });
      });
    }

    // Overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0)
      .setDepth(30);

    // Panel
    this.add.rectangle(width / 2, height / 2, 520, 380, 0x1a0a2e)
      .setDepth(31)
      .setStrokeStyle(4, 0x9c4eb3);

    this.add.text(width / 2, height / 2 - 130, '🎉 ¡Fin del juego!', {
      fontSize: '48px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 - 40, 'Tu puntaje:', {
      fontSize: '28px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 + 55, `${this.puntaje}`, {
      fontSize: '96px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000',
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(32);

    // Botón jugar de nuevo
    const btn = this.add.rectangle(width / 2, height / 2 + 165, 300, 68, 0x9c4eb3)
      .setDepth(32)
      .setInteractive({ cursor: 'pointer' });

    this.add.text(width / 2, height / 2 + 165, '🔄 Jugar de nuevo', {
      fontSize: '26px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(33);

    btn.on('pointerdown', () => this.scene.restart());
    btn.on('pointerover', () => btn.setFillColor(0x7a3690));
    btn.on('pointerout', () => btn.setFillColor(0x9c4eb3));
  }

  // ─── Limpieza ─────────────────────────────────────────────────
  shutdown() {
    window.removeEventListener('laser-impact', this._impactHandler);
  }
}