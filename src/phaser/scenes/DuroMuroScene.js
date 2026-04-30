/**
 * DuroMuroScene.js — "Duro contra el Muro"
 *
 * Juego tipo "Hole in the Wall".
 * Valida poses comparando ÁNGULOS de articulaciones,
 * no posiciones absolutas — funciona sin importar
 * la distancia del jugador a la cámara.
 *
 * Modo: 1 jugador (2 jugadores pendiente de soporte en backend)
 * Puerto: 8080 — Cámara de reconocimiento corporal
 */

import * as Phaser from 'phaser';

// ─── Paleta de colores Parke Tr3s ─────────────────────────────────────────────
const C = {
  purpura:    0x9c4eb3,
  verde:      0x3dc9a1,
  naranja:    0xfa804f,
  amarillo:   0xfdbf2c,
  azul:       0x40c0dd,
  blanco:     0xffffff,
  negro:      0x000000,
  oscuro:     0x0d0d1a,
};

// ─── Configuración del juego ──────────────────────────────────────────────────
const CONFIG = {
  totalRondas:      5,
  duracionPorPose:  8,    // segundos que tiene el jugador
  toleranciaAngulo: 25,   // grados de tolerancia por articulación
  umbralExito:      0.60, // necesita acertar el 60% de los ángulos evaluados
  poses: [
    {
      id: 'estrella',
      nombre: '⭐ Estrella',
      descripcion: '¡Abre brazos y piernas!',
      // Ángulos objetivo en grados para cada articulación
      // Cada ángulo se calcula como: punto_medio visto desde punto_a hacia punto_b
      angulos: {
        codo_izquierdo:   { a: 'hombro_izquierdo',  m: 'codo_izquierdo',   b: 'muneca_izquierda',  objetivo: 160 },
        codo_derecho:     { a: 'hombro_derecho',     m: 'codo_derecho',     b: 'muneca_derecha',    objetivo: 160 },
        hombro_izquierdo: { a: 'cadera_izquierda',   m: 'hombro_izquierdo', b: 'codo_izquierdo',    objetivo: 135 },
        hombro_derecho:   { a: 'cadera_derecha',     m: 'hombro_derecho',   b: 'codo_derecho',      objetivo: 135 },
        rodilla_izquierda:{ a: 'cadera_izquierda',   m: 'rodilla_izquierda',b: 'tobillo_izquierdo', objetivo: 165 },
        rodilla_derecha:  { a: 'cadera_derecha',     m: 'rodilla_derecha',  b: 'tobillo_derecho',   objetivo: 165 },
        cadera_izquierda: { a: 'hombro_izquierdo',   m: 'cadera_izquierda', b: 'rodilla_izquierda', objetivo: 145 },
        cadera_derecha:   { a: 'hombro_derecho',     m: 'cadera_derecha',   b: 'rodilla_derecha',   objetivo: 145 },
      },
      // Silueta visual del muro (coordenadas normalizadas 0-1)
      silueta: {
        nariz:             { x: 0.50, y: 0.10 },
        hombro_izquierdo:  { x: 0.35, y: 0.28 },
        hombro_derecho:    { x: 0.65, y: 0.28 },
        codo_izquierdo:    { x: 0.18, y: 0.18 },
        codo_derecho:      { x: 0.82, y: 0.18 },
        muneca_izquierda:  { x: 0.05, y: 0.08 },
        muneca_derecha:    { x: 0.95, y: 0.08 },
        cadera_izquierda:  { x: 0.40, y: 0.52 },
        cadera_derecha:    { x: 0.60, y: 0.52 },
        rodilla_izquierda: { x: 0.32, y: 0.70 },
        rodilla_derecha:   { x: 0.68, y: 0.70 },
        tobillo_izquierdo: { x: 0.25, y: 0.90 },
        tobillo_derecho:   { x: 0.75, y: 0.90 },
      },
    },
    {
      id: 'manos-cielo',
      nombre: '🙌 Manos al Cielo',
      descripcion: '¡Levanta ambas manos!',
      angulos: {
        codo_izquierdo:   { a: 'hombro_izquierdo',  m: 'codo_izquierdo',   b: 'muneca_izquierda',  objetivo: 170 },
        codo_derecho:     { a: 'hombro_derecho',     m: 'codo_derecho',     b: 'muneca_derecha',    objetivo: 170 },
        hombro_izquierdo: { a: 'cadera_izquierda',   m: 'hombro_izquierdo', b: 'codo_izquierdo',    objetivo: 170 },
        hombro_derecho:   { a: 'cadera_derecha',     m: 'hombro_derecho',   b: 'codo_derecho',      objetivo: 170 },
        rodilla_izquierda:{ a: 'cadera_izquierda',   m: 'rodilla_izquierda',b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha:  { a: 'cadera_derecha',     m: 'rodilla_derecha',  b: 'tobillo_derecho',   objetivo: 175 },
      },
      silueta: {
        nariz:             { x: 0.50, y: 0.12 },
        hombro_izquierdo:  { x: 0.40, y: 0.30 },
        hombro_derecho:    { x: 0.60, y: 0.30 },
        codo_izquierdo:    { x: 0.38, y: 0.16 },
        codo_derecho:      { x: 0.62, y: 0.16 },
        muneca_izquierda:  { x: 0.36, y: 0.03 },
        muneca_derecha:    { x: 0.64, y: 0.03 },
        cadera_izquierda:  { x: 0.43, y: 0.54 },
        cadera_derecha:    { x: 0.57, y: 0.54 },
        rodilla_izquierda: { x: 0.43, y: 0.72 },
        rodilla_derecha:   { x: 0.57, y: 0.72 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho:   { x: 0.57, y: 0.91 },
      },
    },
    {
      id: 'cangrejo',
      nombre: '🦀 Cangrejo',
      descripcion: '¡Brazos extendidos a los lados!',
      angulos: {
        codo_izquierdo:   { a: 'hombro_izquierdo',  m: 'codo_izquierdo',   b: 'muneca_izquierda',  objetivo: 170 },
        codo_derecho:     { a: 'hombro_derecho',     m: 'codo_derecho',     b: 'muneca_derecha',    objetivo: 170 },
        hombro_izquierdo: { a: 'cadera_izquierda',   m: 'hombro_izquierdo', b: 'codo_izquierdo',    objetivo: 90  },
        hombro_derecho:   { a: 'cadera_derecha',     m: 'hombro_derecho',   b: 'codo_derecho',      objetivo: 90  },
        rodilla_izquierda:{ a: 'cadera_izquierda',   m: 'rodilla_izquierda',b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha:  { a: 'cadera_derecha',     m: 'rodilla_derecha',  b: 'tobillo_derecho',   objetivo: 175 },
      },
      silueta: {
        nariz:             { x: 0.50, y: 0.11 },
        hombro_izquierdo:  { x: 0.35, y: 0.28 },
        hombro_derecho:    { x: 0.65, y: 0.28 },
        codo_izquierdo:    { x: 0.16, y: 0.28 },
        codo_derecho:      { x: 0.84, y: 0.28 },
        muneca_izquierda:  { x: 0.02, y: 0.28 },
        muneca_derecha:    { x: 0.98, y: 0.28 },
        cadera_izquierda:  { x: 0.42, y: 0.54 },
        cadera_derecha:    { x: 0.58, y: 0.54 },
        rodilla_izquierda: { x: 0.42, y: 0.72 },
        rodilla_derecha:   { x: 0.58, y: 0.72 },
        tobillo_izquierdo: { x: 0.42, y: 0.91 },
        tobillo_derecho:   { x: 0.58, y: 0.91 },
      },
    },
    {
      id: 'rayo',
      nombre: '⚡ Rayo',
      descripcion: '¡Brazo derecho arriba, izquierdo abajo!',
      angulos: {
        codo_izquierdo:   { a: 'hombro_izquierdo',  m: 'codo_izquierdo',   b: 'muneca_izquierda',  objetivo: 165 },
        codo_derecho:     { a: 'hombro_derecho',     m: 'codo_derecho',     b: 'muneca_derecha',    objetivo: 165 },
        hombro_izquierdo: { a: 'cadera_izquierda',   m: 'hombro_izquierdo', b: 'codo_izquierdo',    objetivo: 50  },
        hombro_derecho:   { a: 'cadera_derecha',     m: 'hombro_derecho',   b: 'codo_derecho',      objetivo: 160 },
        rodilla_izquierda:{ a: 'cadera_izquierda',   m: 'rodilla_izquierda',b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha:  { a: 'cadera_derecha',     m: 'rodilla_derecha',  b: 'tobillo_derecho',   objetivo: 175 },
      },
      silueta: {
        nariz:             { x: 0.50, y: 0.11 },
        hombro_izquierdo:  { x: 0.40, y: 0.28 },
        hombro_derecho:    { x: 0.60, y: 0.28 },
        codo_izquierdo:    { x: 0.38, y: 0.44 },
        codo_derecho:      { x: 0.72, y: 0.14 },
        muneca_izquierda:  { x: 0.36, y: 0.60 },
        muneca_derecha:    { x: 0.82, y: 0.02 },
        cadera_izquierda:  { x: 0.43, y: 0.54 },
        cadera_derecha:    { x: 0.57, y: 0.54 },
        rodilla_izquierda: { x: 0.43, y: 0.72 },
        rodilla_derecha:   { x: 0.57, y: 0.72 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho:   { x: 0.57, y: 0.91 },
      },
    },
    {
      id: 'victoria',
      nombre: '✌️ Victoria',
      descripcion: '¡Forma una V con los brazos!',
      angulos: {
        codo_izquierdo:   { a: 'hombro_izquierdo',  m: 'codo_izquierdo',   b: 'muneca_izquierda',  objetivo: 165 },
        codo_derecho:     { a: 'hombro_derecho',     m: 'codo_derecho',     b: 'muneca_derecha',    objetivo: 165 },
        hombro_izquierdo: { a: 'cadera_izquierda',   m: 'hombro_izquierdo', b: 'codo_izquierdo',    objetivo: 145 },
        hombro_derecho:   { a: 'cadera_derecha',     m: 'hombro_derecho',   b: 'codo_derecho',      objetivo: 145 },
        rodilla_izquierda:{ a: 'cadera_izquierda',   m: 'rodilla_izquierda',b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha:  { a: 'cadera_derecha',     m: 'rodilla_derecha',  b: 'tobillo_derecho',   objetivo: 175 },
      },
      silueta: {
        nariz:             { x: 0.50, y: 0.11 },
        hombro_izquierdo:  { x: 0.40, y: 0.28 },
        hombro_derecho:    { x: 0.60, y: 0.28 },
        codo_izquierdo:    { x: 0.26, y: 0.16 },
        codo_derecho:      { x: 0.74, y: 0.16 },
        muneca_izquierda:  { x: 0.15, y: 0.05 },
        muneca_derecha:    { x: 0.85, y: 0.05 },
        cadera_izquierda:  { x: 0.43, y: 0.54 },
        cadera_derecha:    { x: 0.57, y: 0.54 },
        rodilla_izquierda: { x: 0.43, y: 0.72 },
        rodilla_derecha:   { x: 0.57, y: 0.72 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho:   { x: 0.57, y: 0.91 },
      },
    },
  ],
};

// Conexiones para dibujar el esqueleto con líneas
const CONEXIONES = [
  ['nariz', 'hombro_izquierdo'], ['nariz', 'hombro_derecho'],
  ['hombro_izquierdo', 'hombro_derecho'],
  ['hombro_izquierdo', 'codo_izquierdo'], ['codo_izquierdo', 'muneca_izquierda'],
  ['hombro_derecho', 'codo_derecho'],     ['codo_derecho', 'muneca_derecha'],
  ['hombro_izquierdo', 'cadera_izquierda'], ['hombro_derecho', 'cadera_derecha'],
  ['cadera_izquierda', 'cadera_derecha'],
  ['cadera_izquierda', 'rodilla_izquierda'], ['rodilla_izquierda', 'tobillo_izquierdo'],
  ['cadera_derecha', 'rodilla_derecha'],     ['rodilla_derecha', 'tobillo_derecho'],
];

export class DuroMuroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DuroMuroScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Estado
    this.rondaActual   = 0;
    this.puntaje       = 0;
    this.esqueleto     = null; // Último esqueleto recibido del backend
    this.juegoActivo   = false;
    this.validando     = false;
    this.posesRonda    = Phaser.Utils.Array.Shuffle([...CONFIG.poses])
                          .slice(0, CONFIG.totalRondas);

    // ── Fondo degradado oscuro ────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d2e, 0x0d0d2e, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, width, height);

    // ── Estrellas de fondo animadas ───────────────────────────────
    this._crearEstrellas(width, height);

    // ── Gráficos reutilizables (se limpian y redibujan cada frame)
    this.grafMuro      = this.add.graphics().setDepth(10);
    this.grafEsqueleto = this.add.graphics().setDepth(5);
    this.grafFeedback  = this.add.graphics().setDepth(6);

    // ── UI — Puntaje ──────────────────────────────────────────────
    this.textoPuntaje = this.add.text(30, 30, '0', {
      fontSize: '64px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000000',
      strokeThickness: 6,
    }).setDepth(20);

    this.add.text(30, 24, 'PUNTOS', {
      fontSize: '20px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff88',
    }).setOrigin(0, 1).setDepth(20);

    // ── UI — Ronda ────────────────────────────────────────────────
    this.textoRonda = this.add.text(width - 30, 30, `1/${CONFIG.totalRondas}`, {
      fontSize: '40px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(1, 0).setDepth(20);

    this.add.text(width - 30, 24, 'RONDA', {
      fontSize: '20px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff88',
    }).setOrigin(1, 1).setDepth(20);

    // ── UI — Timer ────────────────────────────────────────────────
    this.textoTimer = this.add.text(width / 2, 30, '', {
      fontSize: '56px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0).setDepth(20);

    // ── UI — Instrucción de pose ──────────────────────────────────
    this.textoInstruccion = this.add.text(width / 2, height - 30, '', {
      fontSize: '38px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      backgroundColor: '#00000099',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5, 1).setDepth(20);

    // ── UI — Aviso sin jugador ────────────────────────────────────
    this.textoSinJugador = this.add.text(width / 2, height / 2, '👤 Buscando jugador...', {
      fontSize: '32px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff66',
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // ── Escuchar WebSocket ────────────────────────────────────────
    this._wsHandler = this._onWsMessage.bind(this);
    window.addEventListener('ws-message', this._wsHandler);

    // ── Arrancar ──────────────────────────────────────────────────
    this._cuentaRegresiva();
  }

  // ─── Estrellas de fondo ───────────────────────────────────────────────────
  _crearEstrellas(width, height) {
    for (let i = 0; i < 80; i++) {
      const x     = Phaser.Math.Between(0, width);
      const y     = Phaser.Math.Between(0, height);
      const r     = Phaser.Math.FloatBetween(0.5, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.15, 0.6);
      const circ  = this.add.circle(x, y, r, 0xffffff, alpha).setDepth(1);

      this.tweens.add({
        targets: circ,
        alpha: 0.05,
        duration: Phaser.Math.Between(800, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  // ─── Cuenta regresiva ─────────────────────────────────────────────────────
  _cuentaRegresiva() {
    const { width, height } = this.scale;
    this.juegoActivo = false;

    const pasos = ['3', '2', '1', '¡YA!'];
    const colores = ['#fa804f', '#fdbf2c', '#3dc9a1', '#ffffff'];
    let i = 0;

    const mostrar = () => {
      const texto = this.add.text(width / 2, height / 2, pasos[i], {
        fontSize: '200px',
        fontFamily: 'Fredoka, sans-serif',
        color: colores[i],
        stroke: '#000000',
        strokeThickness: 16,
      }).setOrigin(0.5).setDepth(30).setAlpha(0).setScale(0.3);

      this.tweens.add({
        targets: texto,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 250,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(550, () => {
            this.tweens.add({
              targets: texto,
              alpha: 0,
              scaleX: 1.4,
              scaleY: 1.4,
              duration: 200,
              onComplete: () => {
                texto.destroy();
                i++;
                if (i < pasos.length) mostrar();
                else this._iniciarRonda();
              },
            });
          });
        },
      });
    };

    mostrar();
  }

  // ─── Iniciar ronda ────────────────────────────────────────────────────────
  _iniciarRonda() {
    if (this.rondaActual >= CONFIG.totalRondas) {
      this._finDePartida();
      return;
    }

    this.validando       = false;
    this.juegoActivo     = true;
    this.tiempoRestante  = CONFIG.duracionPorPose;
    this._escalaMuro     = { v: 0.12 }; // Empieza pequeño (lejos)

    const pose = this.posesRonda[this.rondaActual];
    this.rondaActual++;
    this._poseActual = pose;

    // Actualizar UI
    this.textoRonda.setText(`${this.rondaActual}/${CONFIG.totalRondas}`);
    this.textoTimer.setText(`${this.tiempoRestante}`).setColor('#ffffff');
    this.textoInstruccion.setText(pose.descripcion);

    // Animar el muro acercándose
    this.tweens.add({
      targets: this._escalaMuro,
      v: 1.0,
      duration: CONFIG.duracionPorPose * 1000,
      ease: 'Linear',
      onComplete: () => {
        if (!this.validando) this._validarPose(pose);
      },
    });

    // Timer por segundo
    this._timerRonda = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.juegoActivo) return;
        this.tiempoRestante--;
        this.textoTimer.setText(`${this.tiempoRestante}`);

        if (this.tiempoRestante <= 3 && this.tiempoRestante > 0) {
          this.textoTimer.setColor('#fa804f');
          this.cameras.main.shake(80, 0.003);
        }
      },
    });
  }

  // ─── Update — cada frame ──────────────────────────────────────────────────
  update() {
    const { width, height } = this.scale;

    // Redibujar muro
    this.grafMuro.clear();
    if (this._poseActual && this._escalaMuro) {
      this._dibujarMuro(this._poseActual, this._escalaMuro.v);
    }

    // Redibujar esqueleto del jugador
    this.grafEsqueleto.clear();
    this.grafFeedback.clear();

    if (this.esqueleto) {
      this.textoSinJugador.setVisible(false);
      this._dibujarEsqueleto(
        this.grafEsqueleto,
        this.esqueleto,
        0, 0, width, height,
        C.verde, 5, 10,
      );

      // Feedback visual en tiempo real — qué joints están bien
      if (this.juegoActivo && this._poseActual) {
        this._dibujarFeedbackTiempoReal(this._poseActual);
      }
    } else if (this.juegoActivo) {
      this.textoSinJugador.setVisible(true);
    }
  }

  // ─── Dibujar el muro que se acerca ───────────────────────────────────────
  _dibujarMuro(pose, escala) {
    const { width, height } = this.scale;
    const cx    = width / 2;
    const cy    = height / 2;
    const muroW = width  * escala;
    const muroH = height * escala;
    const x0    = cx - muroW / 2;
    const y0    = cy - muroH / 2;

    // Sombra del muro
    this.grafMuro.fillStyle(0x000000, 0.3);
    this.grafMuro.fillRect(x0 + 8, y0 + 8, muroW, muroH);

    // Cuerpo del muro — gradiente simulado con dos rectángulos
    this.grafMuro.fillStyle(C.purpura, 0.92);
    this.grafMuro.fillRect(x0, y0, muroW, muroH);

    // Borde superior más claro (efecto de luz)
    this.grafMuro.fillStyle(0xb96fd0, 0.6);
    this.grafMuro.fillRect(x0, y0, muroW, muroH * 0.08);

    // Borde del muro — color amarillo brandbook
    const grosorBorde = Math.max(3, 6 * escala);
    this.grafMuro.lineStyle(grosorBorde, C.amarillo, 1);
    this.grafMuro.strokeRect(x0, y0, muroW, muroH);

    // Líneas decorativas del muro (efecto ladrillo sutil)
    if (escala > 0.3) {
      const alpha = Math.min(1, (escala - 0.3) * 3);
      this.grafMuro.lineStyle(1, 0x000000, 0.15 * alpha);
      for (let fy = y0 + muroH * 0.15; fy < y0 + muroH; fy += muroH * 0.12) {
        this.grafMuro.beginPath();
        this.grafMuro.moveTo(x0, fy);
        this.grafMuro.lineTo(x0 + muroW, fy);
        this.grafMuro.strokePath();
      }
    }

    // Silueta del hueco dentro del muro (color blanco)
    this._dibujarEsqueleto(
      this.grafMuro,
      pose.silueta,
      x0, y0, muroW, muroH,
      C.blanco,
      Math.max(2, 5 * escala),
      Math.max(3, 9 * escala),
    );

    // Nombre de la pose en el muro (solo cuando es suficientemente grande)
    if (escala > 0.4) {
      const alpha = Math.min(1, (escala - 0.4) * 5);
      this.grafMuro.fillStyle(C.amarillo, alpha * 0.9);
    }
  }

  // ─── Dibujar esqueleto genérico ───────────────────────────────────────────
  // offsetX/Y = esquina superior izquierda del área donde se dibuja
  // areaW/H   = tamaño del área (las coords normalizadas se multiplican por esto)
  _dibujarEsqueleto(graphics, esqueleto, offsetX, offsetY, areaW, areaH, color, grosor, radio) {
    // Líneas entre joints
    graphics.lineStyle(grosor, color, 0.9);
    CONEXIONES.forEach(([a, b]) => {
      if (!esqueleto[a] || !esqueleto[b]) return;
      graphics.beginPath();
      graphics.moveTo(offsetX + esqueleto[a].x * areaW, offsetY + esqueleto[a].y * areaH);
      graphics.lineTo(offsetX + esqueleto[b].x * areaW, offsetY + esqueleto[b].y * areaH);
      graphics.strokePath();
    });

    // Círculos en cada joint
    graphics.fillStyle(color, 1);
    Object.values(esqueleto).forEach((p) => {
      graphics.fillCircle(
        offsetX + p.x * areaW,
        offsetY + p.y * areaH,
        radio,
      );
    });
  }

  // ─── Feedback visual en tiempo real ──────────────────────────────────────
  // Muestra círculos verdes/rojos en los joints del jugador según si encajan
  _dibujarFeedbackTiempoReal(pose) {
    if (!this.esqueleto) return;
    const { width, height } = this.scale;

    Object.entries(pose.angulos).forEach(([nombreJoint, def]) => {
      const encaja = this._evaluarAngulo(def, this.esqueleto);
      const punto  = this.esqueleto[nombreJoint];
      if (!punto) return;

      const px = punto.x * width;
      const py = punto.y * height;

      this.grafFeedback.fillStyle(encaja ? C.verde : C.naranja, 0.85);
      this.grafFeedback.fillCircle(px, py, 14);

      // Borde blanco para contraste
      this.grafFeedback.lineStyle(2, C.blanco, 0.7);
      this.grafFeedback.strokeCircle(px, py, 14);
    });
  }

  // ─── Calcular ángulo entre 3 puntos ──────────────────────────────────────
  // Calcula el ángulo en el punto "m" (medio) formado por los puntos a → m → b
  // Devuelve el ángulo en grados (0-180)
  _calcularAngulo(puntoA, puntoM, puntoB) {
    const ax = puntoA.x - puntoM.x;
    const ay = puntoA.y - puntoM.y;
    const bx = puntoB.x - puntoM.x;
    const by = puntoB.y - puntoM.y;

    const dot      = ax * bx + ay * by;
    const magA     = Math.sqrt(ax * ax + ay * ay);
    const magB     = Math.sqrt(bx * bx + by * by);

    if (magA === 0 || magB === 0) return 0;

    const cosAngulo = Math.max(-1, Math.min(1, dot / (magA * magB)));
    return (Math.acos(cosAngulo) * 180) / Math.PI;
  }

  // ─── Evaluar si un ángulo encaja con la pose ──────────────────────────────
  _evaluarAngulo(def, esqueleto) {
    const pA = esqueleto[def.a];
    const pM = esqueleto[def.m];
    const pB = esqueleto[def.b];
    if (!pA || !pM || !pB) return false;

    const anguloActual = this._calcularAngulo(pA, pM, pB);
    return Math.abs(anguloActual - def.objetivo) <= CONFIG.toleranciaAngulo;
  }

  // ─── Validar pose al llegar el muro ──────────────────────────────────────
  _validarPose(pose) {
    if (this.validando) return;
    this.validando   = true;
    this.juegoActivo = false;

    this._timerRonda?.destroy();
    this.tweens.killAll();

    if (!this.esqueleto) {
      this._mostrarResultado(false, 0, Object.keys(pose.angulos).length, '¡No te detecté!');
      return;
    }

    const angulos      = Object.values(pose.angulos);
    const totalAngulos = angulos.length;
    let   aciertos     = 0;

    angulos.forEach((def) => {
      if (this._evaluarAngulo(def, this.esqueleto)) aciertos++;
    });

    const porcentaje = aciertos / totalAngulos;
    const exito      = porcentaje >= CONFIG.umbralExito;

    if (exito) {
      // Más aciertos = más puntos (máximo 500 por ronda)
      const bonus = Math.round(porcentaje * 500);
      this.puntaje += bonus;
      this.textoPuntaje.setText(`${this.puntaje}`);
    }

    this._mostrarResultado(exito, aciertos, totalAngulos);
  }

  // ─── Mostrar resultado de la ronda ───────────────────────────────────────
  _mostrarResultado(exito, aciertos, total, mensajeExtra = null) {
    const { width, height } = this.scale;

    // Flash de pantalla
    const flash = this.add.rectangle(0, 0, width, height,
      exito ? C.verde : C.naranja, 0.35).setOrigin(0).setDepth(25);

    // Texto principal
    const emoji   = exito ? '🎉' : '😅';
    const mensaje = exito ? '¡ATRAVESASTE!' : '¡FALLASTE!';
    const color   = exito ? '#3dc9a1' : '#fa804f';

    const textoGrande = this.add.text(width / 2, height / 2 - 60, `${emoji} ${mensaje}`, {
      fontSize: '88px',
      fontFamily: 'Fredoka, sans-serif',
      color,
      stroke: '#000000',
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(26).setAlpha(0).setScale(0.5);

    // Texto de detalle
    const detalle = mensajeExtra ?? `${aciertos} de ${total} posiciones correctas`;
    const textoDetalle = this.add.text(width / 2, height / 2 + 50, detalle, {
      fontSize: '36px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(26).setAlpha(0);

    // Animación de entrada
    this.tweens.add({
      targets: textoGrande,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: textoDetalle,
      alpha: 1,
      duration: 300,
      delay: 200,
    });

    // Shake de cámara
    this.cameras.main.shake(300, exito ? 0.01 : 0.02);

    // Confeti si fue exitoso
    if (exito) this._confeti(width, height);

    // Esperar y pasar a siguiente ronda
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [flash, textoGrande, textoDetalle],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          flash.destroy();
          textoGrande.destroy();
          textoDetalle.destroy();
          this.grafMuro.clear();
          this._escalaMuro = null;
          this._poseActual = null;
          this._iniciarRonda();
        },
      });
    });
  }

  // ─── Confeti de celebración ───────────────────────────────────────────────
  _confeti(width, height) {
    const colores = [C.purpura, C.verde, C.naranja, C.amarillo, C.azul, C.blanco];
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 120, () => {
        colores.forEach((color) => {
          const emitter = this.add.particles(
            Phaser.Math.Between(width * 0.2, width * 0.8),
            Phaser.Math.Between(0, height * 0.4),
            '__DEFAULT',
            {
              speed:     { min: 150, max: 400 },
              angle:     { min: 0, max: 360 },
              scale:     { start: 0.6, end: 0 },
              tint:      color,
              lifespan:  900,
              quantity:  5,
              gravityY:  250,
              emitting:  false,
            },
          );
          emitter.explode(5);
          this.time.delayedCall(1100, () => emitter.destroy());
        });
      });
    }
  }

  // ─── Fin de partida ───────────────────────────────────────────────────────
  _finDePartida() {
    this.juegoActivo = false;
    const { width, height } = this.scale;

    this.grafMuro.clear();
    this.textoInstruccion.setVisible(false);
    this.textoTimer.setVisible(false);

    this._confeti(width, height);

    // Overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0).setDepth(30);

    // Panel
    this.add.rectangle(width / 2, height / 2, 560, 400, 0x1a0a2e)
      .setDepth(31)
      .setStrokeStyle(5, C.purpura);

    // Borde decorativo interno
    this.add.rectangle(width / 2, height / 2, 540, 380, 0x000000, 0)
      .setDepth(31)
      .setStrokeStyle(2, C.amarillo);

    this.add.text(width / 2, height / 2 - 145, '🏆 ¡Fin del Juego!', {
      fontSize: '52px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 - 50, 'Tu puntaje final:', {
      fontSize: '28px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 + 55, `${this.puntaje}`, {
      fontSize: '110px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(32);

    // Botón jugar de nuevo
    const btn = this.add.rectangle(width / 2, height / 2 + 165, 320, 70, C.purpura)
      .setDepth(32)
      .setInteractive({ cursor: 'pointer' });

    this.add.text(width / 2, height / 2 + 165, '🔄 Jugar de nuevo', {
      fontSize: '28px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(33);

    btn.on('pointerdown', () => this.scene.restart());
    btn.on('pointerover',  () => {
      btn.setFillColor(0x7a3690);
      this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    btn.on('pointerout', () => {
      btn.setFillColor(C.purpura);
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
    });
  }

  // ─── WebSocket ────────────────────────────────────────────────────────────
  _onWsMessage(event) {
    const data = event.detail;
    if (data.port !== 8080)          return;
    if (data.juego_activo !== 'poses') return;

    if (!data.jugador_detectado) {
      this.esqueleto = null;
      return;
    }

    if (data.poses?.esqueleto) {
      this.esqueleto = data.poses.esqueleto;
    }
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  shutdown() {
    window.removeEventListener('ws-message', this._wsHandler);
    this._timerRonda?.destroy();
  }
}