/**
 * JustDanceScene.js — "Just Dance Style"
 *
 * Juego rítmico con estética neón.
 * Un muro de cristal neón se acerca al jugador.
 * El jugador debe encajar en la silueta al ritmo de la música.
 */

import * as Phaser from 'phaser';

const CONFIG = {
  totalRondas: 10,
  duracionPorPose: 4,  // Más rápido que el original para dar ritmo
  tolerancia: 0.20,
  poses: [
    { id: 'estrella', nombre: 'Estrella', emoji: '⭐', esqueleto: { nariz: { x: 0.50, y: 0.12 }, hombro_izquierdo: { x: 0.35, y: 0.28 }, hombro_derecho: { x: 0.65, y: 0.28 }, codo_izquierdo: { x: 0.20, y: 0.18 }, codo_derecho: { x: 0.80, y: 0.18 }, muneca_izquierda: { x: 0.08, y: 0.10 }, muneca_derecha: { x: 0.92, y: 0.10 }, cadera_izquierda: { x: 0.42, y: 0.55 }, cadera_derecha: { x: 0.58, y: 0.55 }, rodilla_izquierda: { x: 0.35, y: 0.73 }, rodilla_derecha: { x: 0.65, y: 0.73 }, tobillo_izquierdo: { x: 0.28, y: 0.91 }, tobillo_derecho: { x: 0.72, y: 0.91 } } },
    { id: 'manos-cielo', nombre: 'Manos al Cielo', emoji: '🙌', esqueleto: { nariz: { x: 0.50, y: 0.15 }, hombro_izquierdo: { x: 0.40, y: 0.30 }, hombro_derecho: { x: 0.60, y: 0.30 }, codo_izquierdo: { x: 0.38, y: 0.18 }, codo_derecho: { x: 0.62, y: 0.18 }, muneca_izquierda: { x: 0.36, y: 0.05 }, muneca_derecha: { x: 0.64, y: 0.05 }, cadera_izquierda: { x: 0.43, y: 0.55 }, cadera_derecha: { x: 0.57, y: 0.55 }, rodilla_izquierda: { x: 0.43, y: 0.73 }, rodilla_derecha: { x: 0.57, y: 0.73 }, tobillo_izquierdo: { x: 0.43, y: 0.91 }, tobillo_derecho: { x: 0.57, y: 0.91 } } },
    { id: 'rayo', nombre: 'Rayo', emoji: '⚡', esqueleto: { nariz: { x: 0.50, y: 0.12 }, hombro_izquierdo: { x: 0.40, y: 0.28 }, hombro_derecho: { x: 0.60, y: 0.28 }, codo_izquierdo: { x: 0.38, y: 0.45 }, codo_derecho: { x: 0.70, y: 0.15 }, muneca_izquierda: { x: 0.36, y: 0.62 }, muneca_derecha: { x: 0.78, y: 0.03 }, cadera_izquierda: { x: 0.43, y: 0.55 }, cadera_derecha: { x: 0.57, y: 0.55 }, rodilla_izquierda: { x: 0.43, y: 0.73 }, rodilla_derecha: { x: 0.57, y: 0.73 }, tobillo_izquierdo: { x: 0.43, y: 0.91 }, tobillo_derecho: { x: 0.57, y: 0.91 } } },
    // Añadir más si se desea...
  ]
};

const CONEXIONES = [
  ['nariz', 'hombro_izquierdo'], ['nariz', 'hombro_derecho'], ['hombro_izquierdo', 'hombro_derecho'],
  ['hombro_izquierdo', 'codo_izquierdo'], ['codo_izquierdo', 'muneca_izquierda'],
  ['hombro_derecho', 'codo_derecho'], ['codo_derecho', 'muneca_derecha'],
  ['hombro_izquierdo', 'cadera_izquierda'], ['hombro_derecho', 'cadera_derecha'],
  ['cadera_izquierda', 'cadera_derecha'], ['cadera_izquierda', 'rodilla_izquierda'],
  ['rodilla_izquierda', 'tobillo_izquierdo'], ['cadera_derecha', 'rodilla_derecha'],
  ['rodilla_derecha', 'tobillo_derecho'],
];

export class JustDanceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'JustDanceScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.rondaActual = 0;
    this.puntaje = 0;
    this.esqueletoActual = null;
    this.juegoActivo = false;
    this.validando = false;

    this.posesRonda = Phaser.Utils.Array.Shuffle([...CONFIG.poses]);

    // Fondo Neon Stage
    this.add.image(width / 2, height / 2, 'neon_stage')
      .setDisplaySize(width, height)
      .setDepth(0);

    // Grid de pista de baile
    this.graficosPiso = this.add.graphics().setDepth(1);
    this.gridOffset = 0;

    this.graficosEsqueleto = this.add.graphics().setDepth(5);
    this.graficosMuro = this.add.graphics().setDepth(10);

    // UI Estilo Pop
    this.textoPuntaje = this.add.text(30, 30, 'PUNTOS: 0', {
      fontSize: '42px', fontFamily: 'Arial Black', color: '#00ffff', stroke: '#ff00ff', strokeThickness: 6
    }).setDepth(20);

    this.textoTimer = this.add.text(width / 2, 80, '', {
      fontSize: '84px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(20);

    this.textoInstruccion = this.add.text(width / 2, height - 60, '', {
      fontSize: '42px', fontFamily: 'Arial Black', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(20);

    this._wsHandler = (event) => {
      const data = event.detail;
      if (data.port === 8080 && data.juego_activo === 'poses') {
        if (data.poses?.esqueleto) this.esqueletoActual = data.poses.esqueleto;
      }
    };
    window.addEventListener('ws-message', this._wsHandler);

    this._iniciarRonda();

    // Sistema de hold
    this.holdBtn = null;
    this.holdGraphics = this.add.graphics().setDepth(20000);
  }

  _cancelHold() {
    this.holdBtn = null;
    this.holdGraphics.clear();
  }

  _iniciarRonda() {
    if (this.rondaActual >= CONFIG.totalRondas) return;
    
    const { width, height } = this.scale;
    this.validando = false;
    this.juegoActivo = true;
    this.tiempoRestante = CONFIG.duracionPorPose;
    
    const pose = this.posesRonda[this.rondaActual % this.posesRonda.length];
    this.rondaActual++;

    this.textoTimer.setText(this.tiempoRestante);
    this.textoInstruccion.setText(`${pose.emoji} ${pose.nombre.toUpperCase()}`);

    this._tweenMuro = { escala: 0.1 };
    this.tweens.add({
      targets: this._tweenMuro,
      escala: 1.0,
      duration: CONFIG.duracionPorPose * 1000,
      onUpdate: () => {
        this.graficosMuro.clear();
        this._dibujarMuro(pose, this._tweenMuro.escala);
      },
      onComplete: () => this._validarPose(pose)
    });
  }

  _dibujarMuro(pose, escala) {
    const { width, height } = this.scale;
    const muroW = width * escala, muroH = height * escala;
    const cx = width / 2, cy = height / 2;

    this.graficosMuro.fillStyle(0x9c4eb3, 0.3);
    this.graficosMuro.fillRect(cx - muroW / 2, cy - muroH / 2, muroW, muroH);
    this.graficosMuro.lineStyle(Math.max(4, 15 * escala), 0x00ffff, 1);
    this.graficosMuro.strokeRect(cx - muroW / 2, cy - muroH / 2, muroW, muroH);

    this._dibujarEsqueleto(this.graficosMuro, pose.esqueleto, cx - muroW / 2, cy - muroH / 2, muroW, muroH, 0xffffff, Math.max(2, 6 * escala), Math.max(4, 12 * escala));
  }

  _dibujarEsqueleto(graphics, esqueleto, offsetX, offsetY, areaW, areaH, color, grosor, radio) {
    graphics.lineStyle(grosor, color, 1);
    CONEXIONES.forEach(([a, b]) => {
      if (esqueleto[a] && esqueleto[b]) {
        graphics.beginPath();
        graphics.moveTo(offsetX + esqueleto[a].x * areaW, offsetY + esqueleto[a].y * areaH);
        graphics.lineTo(offsetX + esqueleto[b].x * areaW, offsetY + esqueleto[b].y * areaH);
        graphics.strokePath();
      }
    });
    graphics.fillStyle(color, 1);
    Object.values(esqueleto).forEach(p => graphics.fillCircle(offsetX + p.x * areaW, offsetY + p.y * areaH, radio));
  }

  update(time, delta) {
    // Sistema de hold
    if (this.holdBtn) {
      this.holdBtn.time += delta;
      const progress = Math.min(this.holdBtn.time / this.holdBtn.duration, 1);
      this.holdGraphics.clear();
      this.holdGraphics.lineStyle(8, 0x00ff00, 0.8);
      this.holdGraphics.beginPath();
      this.holdGraphics.arc(this.holdBtn.x, this.holdBtn.y, 70, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
      this.holdGraphics.strokePath();
      if (progress >= 1) {
        const cb = this.holdBtn.callback;
        this._cancelHold();
        cb();
      }
    }
    this._drawGrid();
    this.graficosEsqueleto.clear();
    if (this.esqueletoActual) {
      this._dibujarEsqueleto(this.graficosEsqueleto, this.esqueletoActual, 0, 0, this.scale.width, this.scale.height, 0x00ffcc, 8, 14);
    }
  }

  _drawGrid() {
    this.graficosPiso.clear();
    const { width, height } = this.scale;
    const horizon = height * 0.55;
    this.gridOffset += 0.03;
    if (this.gridOffset > 1) this.gridOffset = 0;

    for (let i = 0; i <= 12; i++) {
      const xTop = (width / 2) + (i - 6) * (width * 0.05);
      const xBot = (width / 2) + (i - 6) * (width * 0.5);
      this.graficosPiso.lineStyle(2, 0x9c4eb3, 0.4);
      this.graficosPiso.beginPath();
      this.graficosPiso.moveTo(xTop, horizon);
      this.graficosPiso.lineTo(xBot, height);
      this.graficosPiso.strokePath();
    }
    for (let i = 0; i <= 6; i++) {
      const ratio = (i + this.gridOffset) / 6;
      const y = horizon + Math.pow(ratio, 2) * (height - horizon);
      this.graficosPiso.lineStyle(3, 0x00ffff, ratio * 0.6);
      this.graficosPiso.beginPath();
      this.graficosPiso.moveTo(0, y);
      this.graficosPiso.lineTo(width, y);
      this.graficosPiso.strokePath();
    }
  }

  _validarPose(pose) {
    this.validando = true;
    this.juegoActivo = false;
    let aciertos = 0;
    const joints = ['muneca_izquierda', 'muneca_derecha', 'codo_izquierdo', 'codo_derecho'];
    if (this.esqueletoActual) {
      joints.forEach(j => {
        const d = Math.sqrt(Math.pow(this.esqueletoActual[j].x - pose.esqueleto[j].x, 2) + Math.pow(this.esqueletoActual[j].y - pose.esqueleto[j].y, 2));
        if (d <= CONFIG.tolerancia) aciertos++;
      });
    }
    const exito = aciertos >= 2;
    if (exito) this.puntaje += 100;
    this.textoPuntaje.setText(`PUNTOS: ${this.puntaje}`);
    
    this.cameras.main.flash(200, exito ? 0x00ffcc : 0xff0000, 0.3);
    this.time.delayedCall(1000, () => this._iniciarRonda());
  }

  shutdown() {
    window.removeEventListener('ws-message', this._wsHandler);
  }
}
