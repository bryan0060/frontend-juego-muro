/**
 * DuroMuroScene.js — "Duro contra el Muro"
 *
 * Juego tipo "Hole in the Wall".
 * - Fondo de escenario TV con efecto Ken Burns y luces
 * - Muro con imagen real y hueco de silueta usando RenderTexture
 * - Validación por ángulos de articulaciones
 * - Feedback en tiempo real con colores del brandbook
 */

import * as Phaser from 'phaser';
import { connectWebSocket, sendMessage } from '../../services/websocket/WebSocketClient.js';

const C = {
  purpura: 0x9c4eb3,
  verde: 0x3dc9a1,
  naranja: 0xfa804f,
  amarillo: 0xfdbf2c,
  azul: 0x40c0dd,
  blanco: 0xffffff,
  negro: 0x000000,
  oscuro: 0x0d0d1a,
};

const CONFIG = {
  totalRondas: 8,
  duracionPorPose: 10,
  toleranciaAngulo: 30,
  umbralExito: 0.60,
  poses: [
    {
      id: 'estrella',
      nombre: '⭐ Estrella',
      descripcion: '¡Abre brazos y piernas!',
      angulos: {
        codo_izquierdo: { a: 'hombro_izquierdo', m: 'codo_izquierdo', b: 'muneca_izquierda', objetivo: 160 },
        codo_derecho: { a: 'hombro_derecho', m: 'codo_derecho', b: 'muneca_derecha', objetivo: 160 },
        hombro_izquierdo: { a: 'cadera_izquierda', m: 'hombro_izquierdo', b: 'codo_izquierdo', objetivo: 135 },
        hombro_derecho: { a: 'cadera_derecha', m: 'hombro_derecho', b: 'codo_derecho', objetivo: 135 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 165 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 165 },
      },
      silueta: {
        nariz: { x: 0.50, y: 0.10 },
        hombro_izquierdo: { x: 0.35, y: 0.28 },
        hombro_derecho: { x: 0.65, y: 0.28 },
        codo_izquierdo: { x: 0.18, y: 0.18 },
        codo_derecho: { x: 0.82, y: 0.18 },
        muneca_izquierda: { x: 0.05, y: 0.08 },
        muneca_derecha: { x: 0.95, y: 0.08 },
        cadera_izquierda: { x: 0.40, y: 0.52 },
        cadera_derecha: { x: 0.60, y: 0.52 },
        rodilla_izquierda: { x: 0.32, y: 0.70 },
        rodilla_derecha: { x: 0.68, y: 0.70 },
        tobillo_izquierdo: { x: 0.25, y: 0.90 },
        tobillo_derecho: { x: 0.75, y: 0.90 },
      },
      imagenKey: 'pose_estrella',

    },
    {
      id: 'egipcia',
      nombre: '🧿 Egipcia',
      descripcion: '¡Brazos al frente y atrás!',
      angulos: {
        codo_izquierdo: { a: 'hombro_izquierdo', m: 'codo_izquierdo', b: 'muneca_izquierda', objetivo: 170 },
        codo_derecho: { a: 'hombro_derecho', m: 'codo_derecho', b: 'muneca_derecha', objetivo: 170 },
        hombro_izquierdo: { a: 'cadera_izquierda', m: 'hombro_izquierdo', b: 'codo_izquierdo', objetivo: 90 },
        hombro_derecho: { a: 'cadera_derecha', m: 'hombro_derecho', b: 'codo_derecho', objetivo: 90 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 165 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 165 },
      },
      silueta: {
        nariz: { x: 0.55, y: 0.08 },
        hombro_izquierdo: { x: 0.38, y: 0.28 }, hombro_derecho: { x: 0.60, y: 0.28 },
        codo_izquierdo: { x: 0.18, y: 0.28 }, codo_derecho: { x: 0.80, y: 0.28 },
        muneca_izquierda: { x: 0.02, y: 0.28 }, muneca_derecha: { x: 0.96, y: 0.28 },
        cadera_izquierda: { x: 0.42, y: 0.53 }, cadera_derecha: { x: 0.58, y: 0.53 },
        rodilla_izquierda: { x: 0.38, y: 0.71 }, rodilla_derecha: { x: 0.60, y: 0.71 },
        tobillo_izquierdo: { x: 0.34, y: 0.91 }, tobillo_derecho: { x: 0.64, y: 0.91 },
      },
      imagenKey: 'pose_egipcia',
    },
    {
      id: 'bicep2',
      nombre: '💪 Súper Bíceps',
      descripcion: '¡Un brazo arriba, mano en la cadera!',
      angulos: {
        codo_izquierdo: { a: 'hombro_izquierdo', m: 'codo_izquierdo', b: 'muneca_izquierda', objetivo: 50 },
        codo_derecho: { a: 'hombro_derecho', m: 'codo_derecho', b: 'muneca_derecha', objetivo: 90 },
        hombro_izquierdo: { a: 'cadera_izquierda', m: 'hombro_izquierdo', b: 'codo_izquierdo', objetivo: 150 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 175 },
      },
      silueta: {
        nariz: { x: 0.52, y: 0.08 },
        hombro_izquierdo: { x: 0.38, y: 0.28 }, hombro_derecho: { x: 0.60, y: 0.28 },
        codo_izquierdo: { x: 0.28, y: 0.12 }, codo_derecho: { x: 0.75, y: 0.38 },
        muneca_izquierda: { x: 0.32, y: 0.03 }, muneca_derecha: { x: 0.68, y: 0.48 },
        cadera_izquierda: { x: 0.42, y: 0.53 }, cadera_derecha: { x: 0.58, y: 0.53 },
        rodilla_izquierda: { x: 0.42, y: 0.71 }, rodilla_derecha: { x: 0.58, y: 0.71 },
        tobillo_izquierdo: { x: 0.42, y: 0.91 }, tobillo_derecho: { x: 0.58, y: 0.91 },
      },
      imagenKey: 'pose_bicep2',
    },
    {
      id: 'equilibrio',
      nombre: '🦅 Equilibrio',
      descripcion: '¡Brazos abiertos y una pierna arriba!',
      angulos: {
        codo_izquierdo: { a: 'hombro_izquierdo', m: 'codo_izquierdo', b: 'muneca_izquierda', objetivo: 170 },
        codo_derecho: { a: 'hombro_derecho', m: 'codo_derecho', b: 'muneca_derecha', objetivo: 170 },
        hombro_izquierdo: { a: 'cadera_izquierda', m: 'hombro_izquierdo', b: 'codo_izquierdo', objetivo: 90 },
        hombro_derecho: { a: 'cadera_derecha', m: 'hombro_derecho', b: 'codo_derecho', objetivo: 90 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 90 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 175 },
      },
      silueta: {
        nariz: { x: 0.50, y: 0.05 },
        hombro_izquierdo: { x: 0.35, y: 0.25 }, hombro_derecho: { x: 0.65, y: 0.25 },
        codo_izquierdo: { x: 0.16, y: 0.25 }, codo_derecho: { x: 0.84, y: 0.25 },
        muneca_izquierda: { x: 0.02, y: 0.25 }, muneca_derecha: { x: 0.98, y: 0.25 },
        cadera_izquierda: { x: 0.42, y: 0.50 }, cadera_derecha: { x: 0.58, y: 0.50 },
        rodilla_izquierda: { x: 0.35, y: 0.62 }, rodilla_derecha: { x: 0.58, y: 0.68 },
        tobillo_izquierdo: { x: 0.48, y: 0.72 }, tobillo_derecho: { x: 0.58, y: 0.91 },
      },
      imagenKey: 'pose_equilibrio',
    },
    {
      id: 'manos-cielo',
      nombre: '🙌 Manos al Cielo',
      descripcion: '¡Levanta ambas manos!',
      angulos: {
        codo_izquierdo: { a: 'hombro_izquierdo', m: 'codo_izquierdo', b: 'muneca_izquierda', objetivo: 170 },
        codo_derecho: { a: 'hombro_derecho', m: 'codo_derecho', b: 'muneca_derecha', objetivo: 170 },
        hombro_izquierdo: { a: 'cadera_izquierda', m: 'hombro_izquierdo', b: 'codo_izquierdo', objetivo: 170 },
        hombro_derecho: { a: 'cadera_derecha', m: 'hombro_derecho', b: 'codo_derecho', objetivo: 170 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 175 },
      },
      silueta: {
        nariz: { x: 0.50, y: 0.12 },
        hombro_izquierdo: { x: 0.40, y: 0.30 },
        hombro_derecho: { x: 0.60, y: 0.30 },
        codo_izquierdo: { x: 0.38, y: 0.16 },
        codo_derecho: { x: 0.62, y: 0.16 },
        muneca_izquierda: { x: 0.36, y: 0.03 },
        muneca_derecha: { x: 0.64, y: 0.03 },
        cadera_izquierda: { x: 0.43, y: 0.54 },
        cadera_derecha: { x: 0.57, y: 0.54 },
        rodilla_izquierda: { x: 0.43, y: 0.72 },
        rodilla_derecha: { x: 0.57, y: 0.72 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho: { x: 0.57, y: 0.91 },
      },
      imagenKey: 'pose_manos_cielo',

    },
    {
      id: 'cangrejo',
      nombre: '🦀 Cangrejo',
      descripcion: '¡Brazos extendidos a los lados!',
      angulos: {
        hombro_izquierdo: { a: 'cadera_izquierda', m: 'hombro_izquierdo', b: 'codo_izquierdo', objetivo: 90 },
        hombro_derecho: { a: 'cadera_derecha', m: 'hombro_derecho', b: 'codo_derecho', objetivo: 90 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 175 },
      },
      silueta: {
        nariz: { x: 0.50, y: 0.11 },
        hombro_izquierdo: { x: 0.35, y: 0.28 },
        hombro_derecho: { x: 0.65, y: 0.28 },
        codo_izquierdo: { x: 0.16, y: 0.28 },
        codo_derecho: { x: 0.84, y: 0.28 },
        muneca_izquierda: { x: 0.02, y: 0.28 },
        muneca_derecha: { x: 0.98, y: 0.28 },
        cadera_izquierda: { x: 0.42, y: 0.54 },
        cadera_derecha: { x: 0.58, y: 0.54 },
        rodilla_izquierda: { x: 0.42, y: 0.72 },
        rodilla_derecha: { x: 0.58, y: 0.72 },
        tobillo_izquierdo: { x: 0.42, y: 0.91 },
        tobillo_derecho: { x: 0.58, y: 0.91 },
      },
      imagenKey: 'pose_cangrejo',

    },
    {
      id: 'rayo',
      nombre: '⚡ Rayo',
      descripcion: '¡Brazo derecho arriba, izquierdo abajo!',
      angulos: {
        codo_izquierdo: { a: 'hombro_izquierdo', m: 'codo_izquierdo', b: 'muneca_izquierda', objetivo: 165 },
        codo_derecho: { a: 'hombro_derecho', m: 'codo_derecho', b: 'muneca_derecha', objetivo: 165 },
        hombro_izquierdo: { a: 'cadera_izquierda', m: 'hombro_izquierdo', b: 'codo_izquierdo', objetivo: 50 },
        hombro_derecho: { a: 'cadera_derecha', m: 'hombro_derecho', b: 'codo_derecho', objetivo: 160 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 175 },
      },
      silueta: {
        nariz: { x: 0.50, y: 0.11 },
        hombro_izquierdo: { x: 0.40, y: 0.28 },
        hombro_derecho: { x: 0.60, y: 0.28 },
        codo_izquierdo: { x: 0.38, y: 0.44 },
        codo_derecho: { x: 0.72, y: 0.14 },
        muneca_izquierda: { x: 0.36, y: 0.60 },
        muneca_derecha: { x: 0.82, y: 0.02 },
        cadera_izquierda: { x: 0.43, y: 0.54 },
        cadera_derecha: { x: 0.57, y: 0.54 },
        rodilla_izquierda: { x: 0.43, y: 0.72 },
        rodilla_derecha: { x: 0.57, y: 0.72 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho: { x: 0.57, y: 0.91 },
      },
      imagenKey: 'pose_rayo',

    },
    {
      id: 'biceps',
      nombre: '💪 Bíceps',
      descripcion: '¡Muestra tus músculos!',
      angulos: {
        codo_izquierdo: { a: 'hombro_izquierdo', m: 'codo_izquierdo', b: 'muneca_izquierda', objetivo: 100 },
        codo_derecho: { a: 'hombro_derecho', m: 'codo_derecho', b: 'muneca_derecha', objetivo: 100 },
        rodilla_izquierda: { a: 'cadera_izquierda', m: 'rodilla_izquierda', b: 'tobillo_izquierdo', objetivo: 175 },
        rodilla_derecha: { a: 'cadera_derecha', m: 'rodilla_derecha', b: 'tobillo_derecho', objetivo: 175 },
      },
      silueta: {
        nariz: { x: 0.50, y: 0.11 },
        hombro_izquierdo: { x: 0.35, y: 0.28 },
        hombro_derecho: { x: 0.65, y: 0.28 },
        codo_izquierdo: { x: 0.20, y: 0.28 },
        codo_derecho: { x: 0.80, y: 0.28 },
        muneca_izquierda: { x: 0.20, y: 0.42 },
        muneca_derecha: { x: 0.80, y: 0.42 },
        cadera_izquierda: { x: 0.42, y: 0.54 },
        cadera_derecha: { x: 0.58, y: 0.54 },
        rodilla_izquierda: { x: 0.42, y: 0.72 },
        rodilla_derecha: { x: 0.58, y: 0.72 },
        tobillo_izquierdo: { x: 0.42, y: 0.91 },
        tobillo_derecho: { x: 0.58, y: 0.91 },
      },
      imagenKey: 'pose_biceps',
    },
  ],

  posesDuo: [
    {
      id: 'duo_fusion',
      nombre: '🐉 ¡FUSIÓN!',
      descripcion: '¡Junten los dedos y abran las piernas!',
      imagenKey: 'pose_duo_fusion',
    },
    {
      id: 'duo_brazo',
      nombre: '👉 ¡Apúntense!',
      descripcion: '¡Cada uno extiende el brazo hacia el otro!',
      imagenKey: 'pose_duo_brazo',
      umbralExito: 0.40,
    },
    {
      id: 'duo_superheroes1',
      nombre: '🦸 ¡Superhéroes!',
      descripcion: '¡Pónganse en pose de superhéroe!',
      imagenKey: 'pose_duo_superheroes1',
      umbralExito: 0.40,
    },
    {
      id: 'duo_superheroes2',
      nombre: '🦸 ¡Al rescate!',
      descripcion: '¡Vuelen como superhéroes!',
      imagenKey: 'pose_duo_superheroes2',
      umbralExito: 0.40,
    },
    {
      id: 'duo_disco',
      nombre: '🕺 ¡A bailar!',
      descripcion: '¡Saquen sus mejores pasos de baile!',
      imagenKey: 'pose_duo_disco',
      umbralExito: 0.40,
    },
    {
      id: 'duo_dinos',
      nombre: '🦕 ¡Dinosaurios!',
      descripcion: '¡Rugean como dinosaurios!',
      imagenKey: 'pose_duo_dinos',
      umbralExito: 0.40,
    },
    {
      id: 'duo_corazon',
      nombre: '❤️ ¡Corazón!',
      descripcion: '¡Formen un corazón juntos!',
      imagenKey: 'pose_duo_corazon',
    },
    {
      id: 'duo_cubiertos',
      nombre: '🍴 ¡A comer!',
      descripcion: '¡Uno es la cuchara y el otro el tenedor!',
      imagenKey: 'pose_duo_cubiertos',
    },
  ],
};

const CONEXIONES = [
  // Torso — línea vertical del centro
  ['hombro_izquierdo', 'cadera_izquierda'], // lado izquierdo como referencia del torso

  // Brazos
  ['hombro_izquierdo', 'codo_izquierdo'],
  ['codo_izquierdo', 'muneca_izquierda'],
  ['hombro_derecho', 'codo_derecho'],
  ['codo_derecho', 'muneca_derecha'],

  // Piernas
  ['cadera_izquierda', 'rodilla_izquierda'],
  ['rodilla_izquierda', 'tobillo_izquierdo'],
  ['cadera_derecha', 'rodilla_derecha'],
  ['rodilla_derecha', 'tobillo_derecho'],
];
// Grosor de líneas y radio de puntos del esqueleto en el hueco
const GROSOR_SILUETA = 28;
const RADIO_SILUETA = 22;

export class DuroMuroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DuroMuroScene' });
  }

  create() {
    const { width, height } = this.scale;

    this._debugEsqueleto = false;

    this.rondaActual = 0;
    this.puntaje = 0;
    this.combo = 0;
    this.multiplicador = 1;
    this.esqueleto = null; // legacy, se mantiene por compatibilidad
    this.esq1 = null;
    this.esq2 = null;
    this.juegoActivo = false;
    this.validando = false;
    this.posesRonda = [];
    this._escalaMuro = null;
    this._poseActual = null;
    this._musicaActual = null;

    // Sistema de hold
    this.holdBtn = null;
    this.holdGraphics = this.add.graphics().setDepth(20000);

    // ── Fondo escenario TV ────────────────────────────────────
    this.imgFondo = this.add.image(width / 2, height / 2, 'duro_muro_fondo')
      .setDisplaySize(width * 1.1, height * 1.1)
      .setDepth(0);

    // Efecto Ken Burns — zoom lento infinito
    this.tweens.add({
      targets: this.imgFondo,
      scaleX: this.imgFondo.scaleX * 1.15, // ← Más zoom (era 1.06)
      scaleY: this.imgFondo.scaleY * 1.15,
      duration: 6000,                       // ← Más rápido (era 12000)
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Overlay oscuro sobre el fondo para que el juego se lea bien
    this.add.rectangle(0, 0, width, height, 0x000000, 0.20)
      .setOrigin(0).setDepth(1);


    // ── Luces de estudio parpadeantes ─────────────────────────
    this._crearLucesEstudio(width, height);

    // ── RenderTexture para el muro con hueco ──────────────────
    // Se recrea en cada ronda con _actualizarMuro()
    this.rtMuro = this.add.renderTexture(0, 0, width, height)
      .setDepth(10);

    // Gráficos auxiliares para dibujar dentro del RenderTexture
    this._grafAux = this.add.graphics().setVisible(false).setDepth(99);

    // ── Esqueleto del jugador ─────────────────────────────────
    this.grafEsqueleto = this.add.graphics().setDepth(15);
    this.grafFeedback = this.add.graphics().setDepth(16);

    // ── UI ────────────────────────────────────────────────────
    this._crearUI(width, height);

    // ── WebSocket ─────────────────────────────────────────────
    this._wsHandler = this._onWsMessage.bind(this);
    window.addEventListener('ws-message', this._wsHandler);

    // ── Arrancar ──────────────────────────────────────────────
    this.events.once('shutdown', () => this.shutdown());

    this.sensorButtons = [];
    this._ultimaVoz = 0;
    this._ultimoNivelVoz = null;
    connectWebSocket(8081);
    this._crearParticulasAmbiente();
    this._crearMarcoDecorativo();
    this._mostrarSeleccion();
    this._playMusica();

  }

  _crearParticulasAmbiente() {
    const { width, height } = this.scale;

    // ── Chispas flotantes lentas ──────────────────────────────
    const colores = [C.purpura, C.azul, C.verde, C.amarillo, C.naranja];

    colores.forEach((color, i) => {
      this.add.particles(
        Phaser.Math.Between(0, width),
        height + 10,
        '__DEFAULT',
        {
          speedY: { min: -55, max: -20 },
          speedX: { min: -18, max: 18 },
          scale: { start: 0.28, end: 0 },
          alpha: { start: 0.55, end: 0 },
          tint: color,
          lifespan: { min: 3800, max: 6200 },
          frequency: 320 + i * 90,
          quantity: 1,
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(0, 0, width, 1),
          },
        },
      ).setDepth(3);
    });

    // ── Destellos puntales — aparecen y desaparecen en sitio ──
    const destello = this.add.particles(0, 0, '__DEFAULT', {
      x: { min: width * 0.05, max: width * 0.95 },
      y: { min: height * 0.10, max: height * 0.85 },
      speedX: 0, speedY: 0,
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [C.blanco, C.amarillo, C.azul],
      lifespan: { min: 500, max: 900 },
      frequency: 180,
      quantity: 1,
    }).setDepth(3);
  }

  _crearMarcoDecorativo() {
    const { width, height } = this.scale;
    const g = this.add.graphics().setDepth(90);
    const GROSOR = 3;
    const ESQUINA = 72;   // largo del trazo de esquina
    const PAD = 10;       // separación del borde de pantalla

    const coloresMarco = [C.purpura, C.azul, C.verde, C.naranja];

    // ── Líneas de borde completas muy sutiles ─────────────────
    g.lineStyle(1, C.purpura, 0.18);
    g.strokeRect(PAD, PAD, width - PAD * 2, height - PAD * 2);

    // ── Esquinas en L con triple capa (glow efecto) ───────────
    const esquinas = [
      { x: PAD, y: PAD, sx: 1, sy: 1 },   // top-left
      { x: width - PAD, y: PAD, sx: -1, sy: 1 },   // top-right
      { x: PAD, y: height - PAD, sx: 1, sy: -1 },   // bottom-left
      { x: width - PAD, y: height - PAD, sx: -1, sy: -1 },   // bottom-right
    ];

    const capas = [
      { grosor: 9, alpha: 0.12 },
      { grosor: 5, alpha: 0.30 },
      { grosor: 2, alpha: 1.00 },
    ];

    esquinas.forEach(({ x, y, sx, sy }, ei) => {
      const color = coloresMarco[ei];
      capas.forEach(({ grosor, alpha }) => {
        g.lineStyle(grosor, color, alpha);
        // Trazo horizontal
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + sx * ESQUINA, y);
        g.strokePath();
        // Trazo vertical
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + sy * ESQUINA);
        g.strokePath();
      });

      // Rombo en la punta de cada esquina
      const RD = 5;
      g.fillStyle(color, 0.9);
      g.fillTriangle(
        x, y - RD * sy,
        x - RD * sx, y,
        x + RD * sx, y,
      );
    });

    // ── Marcas de centro en los 4 bordes ─────────────────────
    const centros = [
      { x: width / 2, y: PAD, ax: 1, ay: 0 },   // top
      { x: width / 2, y: height - PAD, ax: 1, ay: 0 },   // bottom
      { x: PAD, y: height / 2, ax: 0, ay: 1 },   // left
      { x: width - PAD, y: height / 2, ax: 0, ay: 1 },   // right
    ];

    centros.forEach(({ x, y, ax, ay }) => {
      g.lineStyle(2, C.amarillo, 0.6);
      g.beginPath();
      g.moveTo(x - ax * 22, y - ay * 22);
      g.lineTo(x + ax * 22, y + ay * 22);
      g.strokePath();
      // Punto central
      g.fillStyle(C.amarillo, 0.8);
      g.fillCircle(x, y, 3);
    });

    // ── Animación: el marco respira sutilmente ────────────────
    this.tweens.add({
      targets: g,
      alpha: { from: 0.65, to: 1 },
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }


  _mostrarCombo() {
    const { width, height } = this.scale;
    const c = this.combo;
    if (c < 2) return;

    const configs = {
      2: { texto: '🔥 x2  COMBO!', color: '#fa804f', escala: 1.0, colorHex: C.naranja },
      3: { texto: '⚡ x3  RACHA!', color: '#fdbf2c', escala: 1.15, colorHex: C.amarillo },
      4: { texto: '💥 x4  ¡BRUTAL!', color: '#9c4eb3', escala: 1.3, colorHex: C.purpura },
    };
    const cfg = configs[Math.min(c, 4)] ?? {
      texto: `🌟 x${c} LEGENDARIO!`, color: '#40c0dd', escala: 1.45, colorHex: C.azul,
    };

    // Texto principal — entra desde abajo, sube y desaparece
    const t = this.add.text(width / 2, height / 2 + 80, cfg.texto, {
      fontSize: '88px',
      fontFamily: 'Fredoka, sans-serif',
      color: cfg.color,
      stroke: '#000000',
      strokeThickness: 14,
    }).setOrigin(0.5).setDepth(50).setScale(0.2).setAlpha(0);

    this.tweens.add({
      targets: t,
      scaleX: cfg.escala, scaleY: cfg.escala,
      alpha: 1,
      y: height / 2 - 20,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Pulso
        this.tweens.add({
          targets: t,
          scaleX: cfg.escala * 1.08, scaleY: cfg.escala * 1.08,
          duration: 180, yoyo: true, repeat: 1,
          onComplete: () => {
            this.tweens.add({
              targets: t,
              alpha: 0, y: height / 2 - 120,
              duration: 380, delay: 300,
              onComplete: () => t.destroy(),
            });
          },
        });
      },
    });

    // Partículas en explosión radial
    const coloresCombo = [C.naranja, C.amarillo, C.purpura, C.azul, C.verde];
    coloresCombo.forEach((color) => {
      const emitter = this.add.particles(width / 2, height / 2, '__DEFAULT', {
        speed: { min: 300, max: 700 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.9, end: 0 },
        tint: color,
        lifespan: 700,
        quantity: c >= 4 ? 10 : 6,
        gravityY: 200,
        emitting: false,
      }).setDepth(49);
      emitter.explode(c >= 4 ? 10 : 6);
      this.time.delayedCall(800, () => emitter.destroy());
    });

    // Flash de pantalla con el color del nivel
    const flash = this.add.rectangle(0, 0, width, height, cfg.colorHex, 0.18)
      .setOrigin(0).setDepth(48);
    this.tweens.add({ targets: flash, alpha: 0, duration: 280, onComplete: () => flash.destroy() });

    // Shake según intensidad
    this.cameras.main.shake(200, 0.004 * Math.min(c, 5));
  }

  _mostrarSeleccion() {
    this.sensorButtons = [];
    const { width: W, height: H } = this.scale;

    this.menuContainer = this.add.container(0, 0).setDepth(200);

    // Overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5);
    this.menuContainer.add(overlay);

    // Título
    const titulo = this.add.text(W / 2, 110, 'DURO CONTRA EL MURO', {
      fontSize: '72px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#9c4eb3',
      strokeThickness: 14,
    }).setOrigin(0.5);
    this.menuContainer.add(titulo);
    this.tweens.add({
      targets: titulo,
      scale: 1.04,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtítulo
    const sub = this.add.text(W / 2, 195, '¿Cuántos jugadores?', {
      fontSize: '34px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff99',
    }).setOrigin(0.5);
    this.menuContainer.add(sub);

    // Tarjetas
    const modos = [
      {
        modo: 'solo',
        x: W / 2 - 320,
        emoji: '🧍',
        nombre: 'SOLO',
        desc: '1 jugador',
        color: C.azul,
      },
      {
        modo: 'duo',
        x: W / 2 + 320,
        emoji: '👫',
        nombre: 'DÚO',
        desc: '2 jugadores',
        color: C.naranja,
      },
    ];

    modos.forEach(({ modo, x, emoji, nombre, desc, color }) => {
      const y = H / 2 + 60;
      const card = this.add.container(x, y);
      this.menuContainer.add(card);

      // Fondo tarjeta
      const bg = this.add.graphics();
      bg.fillStyle(0x0a0a1a, 0.95);
      bg.fillRoundedRect(-210, -190, 420, 380, 32);
      bg.lineStyle(3, color, 0.4);
      bg.strokeRoundedRect(-210, -190, 420, 380, 32);
      card.add(bg);

      // Borde glow
      const glow = this.add.graphics();
      glow.lineStyle(14, color, 0.5);
      glow.strokeRoundedRect(-210, -190, 420, 380, 32);
      glow.lineStyle(4, 0xffffff, 1);
      glow.strokeRoundedRect(-210, -190, 420, 380, 32);
      card.add(glow);

      // Emoji
      const em = this.add.text(0, -80, emoji, { fontSize: '100px' }).setOrigin(0.5);
      card.add(em);

      // Nombre
      const nm = this.add.text(0, 55, nombre, {
        fontSize: '56px',
        fontFamily: 'Fredoka, sans-serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5);
      card.add(nm);

      // Descripción
      const ds = this.add.text(0, 115, desc, {
        fontSize: '26px',
        fontFamily: 'Fredoka, sans-serif',
        color: `#${color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      card.add(ds);

      // Flotación
      this.tweens.add({
        targets: card,
        y: y - 14,
        duration: 2200 + (modo === 'duo' ? 300 : 0),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Área interactiva
      const hit = this.add.rectangle(x, y, 420, 380, 0x000000, 0)
        .setInteractive({ cursor: 'pointer' });
      this.menuContainer.add(hit);

      const onSelect = () => {
        this._sonido('pop');
        this.tweens.add({
          targets: card,
          scale: 0.95,
          duration: 100,
          yoyo: true,
          onComplete: () => this._iniciarConModo(modo),
        });
      };

      hit.on('pointerover', () => {
        glow.clear();
        glow.lineStyle(18, color, 0.9);
        glow.strokeRoundedRect(-210, -190, 420, 380, 32);
        glow.lineStyle(5, 0xffffff, 1);
        glow.strokeRoundedRect(-210, -190, 420, 380, 32);
      });

      hit.on('pointerout', () => {
        glow.clear();
        glow.lineStyle(14, color, 0.5);
        glow.strokeRoundedRect(-210, -190, 420, 380, 32);
        glow.lineStyle(4, 0xffffff, 1);
        glow.strokeRoundedRect(-210, -190, 420, 380, 32);
      });

      hit.on('pointerdown', onSelect);

      // Registrar para LiDAR
      this.sensorButtons.push({
        absX: x, absY: y, w: 420, h: 380,
        callback: onSelect,
      });
    });
  }

  _iniciarConModo(modo) {
    this.modo = modo;
    this.sensorButtons = [];

    this.posesRonda = modo === 'duo'
      ? Phaser.Utils.Array.Shuffle([...CONFIG.posesDuo]).slice(0, CONFIG.totalRondas)
      : Phaser.Utils.Array.Shuffle([...CONFIG.poses]).slice(0, CONFIG.totalRondas);

    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
    }

    const enviar = () => sendMessage({ juego: 'poses', modo }, 8080);
    enviar();
    this.time.delayedCall(500, enviar);
    this.time.delayedCall(1500, enviar);

    this._playMusica();
    this._cuentaRegresiva();
  }

  // ─── Luces de estudio ─────────────────────────────────────────────────────
  _crearLucesEstudio(width, height) {
    const coloresLuz = [C.purpura, C.azul, C.verde, C.amarillo, C.naranja];

    // Focos en la parte superior
    for (let i = 0; i < 8; i++) {
      const x = (width / 9) * (i + 1);
      const color = coloresLuz[i % coloresLuz.length];
      const luz = this.add.ellipse(x, 0, 40, 80, color, 0.15).setDepth(2);

      this.tweens.add({
        targets: luz,
        alpha: { from: 0.05, to: 0.25 },
        duration: Phaser.Math.Between(600, 1800),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Sine.easeInOut',
      });
    }

    // Destellos de esquinas
    const esquinas = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: 0, y: height },
      { x: width, y: height },
    ];

    esquinas.forEach(({ x, y }, i) => {
      const destello = this.add.ellipse(x, y, 200, 200,
        coloresLuz[i], 0.08).setDepth(2);

      this.tweens.add({
        targets: destello,
        alpha: { from: 0.03, to: 0.15 },
        duration: Phaser.Math.Between(1000, 2500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000),
      });
    });
  }

  // ─── UI ───────────────────────────────────────────────────────────────────
  _crearUI(width, height) {

    // ══════════════════════════════════════════════
    //  PANEL DE PUNTAJE — abajo-izquierda, estilo candy
    // ══════════════════════════════════════════════
    const PW = 240, PH = 108;
    const PX = 20, PY = height - PH - 20;

    // Aura suave multicolor
    this._glowPuntaje = this.add.graphics().setDepth(19);
    this._glowPuntaje.fillStyle(0xe8a0f8, 0.18);   // lavanda
    this._glowPuntaje.fillRoundedRect(PX - 12, PY - 12, PW + 24, PH + 24, 28);
    this._glowPuntaje.fillStyle(0xffc8f0, 0.10);   // rosa
    this._glowPuntaje.fillRoundedRect(PX - 20, PY - 20, PW + 40, PH + 40, 34);
    this.tweens.add({
      targets: this._glowPuntaje,
      alpha: { from: 0.55, to: 1 },
      duration: 2000,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Capa base — lavanda suave
    const bgP = this.add.graphics().setDepth(20);
    bgP.fillStyle(0x3b1560, 0.92);
    bgP.fillRoundedRect(PX, PY, PW, PH, 18);

    // Capa de brillo superior — rosa-lila
    bgP.fillStyle(0xc084f5, 0.18);
    bgP.fillRoundedRect(PX, PY, PW, PH / 2, 18);

    // Borde candy: 3 colores superpuestos
    bgP.lineStyle(4, 0xe879f9, 1.0);    // fuchsia
    bgP.strokeRoundedRect(PX, PY, PW, PH, 18);
    bgP.lineStyle(2, 0xfbbf24, 0.7);    // amarillo pastel
    bgP.strokeRoundedRect(PX + 3, PY + 3, PW - 6, PH - 6, 15);
    bgP.lineStyle(1, 0xffffff, 0.20);   // blanco suave interior
    bgP.strokeRoundedRect(PX + 5, PY + 5, PW - 10, PH - 10, 13);

    // Línea de acento arcoíris en el tope
    const gradColors = [0xa78bfa, 0xf472b6, 0xfbbf24, 0x34d399];
    gradColors.forEach((col, i) => {
      const segW = (PW - 40) / gradColors.length;
      bgP.lineStyle(3, col, 1);
      bgP.beginPath();
      bgP.moveTo(PX + 20 + i * segW, PY + 1.5);
      bgP.lineTo(PX + 20 + (i + 1) * segW, PY + 1.5);
      bgP.strokePath();
    });

    // Separador suave
    bgP.lineStyle(1, 0xe879f9, 0.4);
    bgP.beginPath();
    bgP.moveTo(PX + 54, PY + 16);
    bgP.lineTo(PX + 54, PY + PH - 16);
    bgP.strokePath();

    // Icono con sombra de color
    const iconShadow = this.add.text(PX + 29, PY + PH / 2 + 2, '⭐', {
      fontSize: '32px',
      alpha: 0.4,
    }).setOrigin(0.5).setDepth(20);

    this.add.text(PX + 27, PY + PH / 2, '⭐', {
      fontSize: '32px',
    }).setOrigin(0.5).setDepth(21);

    // Etiqueta con color pastel
    this.add.text(PX + 54 + (PW - 54) / 2, PY + 16, 'P U N T O S', {
      fontSize: '13px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#e879f9',
      letterSpacing: 2,
    }).setOrigin(0.5, 0).setDepth(21);

    // Número — amarillo pastel cálido
    this.textoPuntaje = this.add.text(PX + 54 + (PW - 54) / 2, PY + PH - 12, '0', {
      fontSize: '58px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fde68a',
      stroke: '#5b21b6',
      strokeThickness: 5,
    }).setOrigin(0.5, 1).setDepth(21);

    // ══════════════════════════════════════════════
    //  INDICADOR DE RONDAS — dots top-center
    // ══════════════════════════════════════════════
    this._crearIndicadorRondas(width, height);

    // ══════════════════════════════════════════════
    //  TIMER con arco de progreso
    // ══════════════════════════════════════════════
    this._timerArc = this.add.graphics().setDepth(21);
    this._timerArc.setPosition(width / 2, 125);

    this.textoTimer = this.add.text(width / 2, 125, '', {
      fontSize: '82px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 9,
    }).setOrigin(0.5).setDepth(22);

    // ══════════════════════════════════════════════
    //  INSTRUCCIÓN inferior
    // ══════════════════════════════════════════════
    this.textoInstruccion = this.add.text(width / 2, height - 22, '', {
      fontSize: '38px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      backgroundColor: '#00000099',
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5, 1).setDepth(21);

    // Sin jugador
    this.textoSinJugador = this.add.text(width / 2, height / 2,
      '👤 Buscando jugador...', {
      fontSize: '34px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff66',
    }).setOrigin(0.5).setDepth(21).setVisible(false);
  }

  _crearIndicadorRondas(width) {
    const N = CONFIG.totalRondas;
    const R = 11;    // radio dot
    const GAP = 14;    // espacio entre dots
    const totalW = N * R * 2 + (N - 1) * GAP;
    const startX = width / 2 - totalW / 2 + R;
    const Y = 28;

    this._dotsRonda = [];
    this._dotR = R;
    this._dotStartX = startX;
    this._dotY = Y;

    // Fondo pill
    const pillBg = this.add.graphics().setDepth(20);
    pillBg.fillStyle(0x000000, 0.55);
    pillBg.fillRoundedRect(startX - R - 18, Y - R - 8, totalW + 36, R * 2 + 16, 20);
    pillBg.lineStyle(1, 0xffffff, 0.1);
    pillBg.strokeRoundedRect(startX - R - 18, Y - R - 8, totalW + 36, R * 2 + 16, 20);

    for (let i = 0; i < N; i++) {
      const x = startX + i * (R * 2 + GAP);
      const dot = this.add.graphics().setDepth(21);
      dot._ix = x;
      dot._iy = Y;
      this._dotsRonda.push(dot);
      this._pintarDot(dot, x, Y, R, 'pendiente');
    }
  }

  _pintarDot(dot, x, y, r, estado) {
    dot.clear();
    if (estado === 'completado') {
      // Verde sólido con check-like glow
      dot.fillStyle(C.verde, 0.30);
      dot.fillCircle(x, y, r + 4);
      dot.fillStyle(C.verde, 1);
      dot.fillCircle(x, y, r);
      dot.lineStyle(1.5, 0xffffff, 0.7);
      dot.strokeCircle(x, y, r);
    } else if (estado === 'actual') {
      // Amarillo con halo
      dot.fillStyle(C.amarillo, 0.15);
      dot.fillCircle(x, y, r + 8);
      dot.fillStyle(C.amarillo, 0.35);
      dot.fillCircle(x, y, r + 4);
      dot.fillStyle(C.amarillo, 1);
      dot.fillCircle(x, y, r);
      dot.lineStyle(2, 0xffffff, 1);
      dot.strokeCircle(x, y, r);
    } else {
      // Pendiente — translúcido
      dot.fillStyle(0xffffff, 0.10);
      dot.fillCircle(x, y, r);
      dot.lineStyle(1.5, 0xffffff, 0.22);
      dot.strokeCircle(x, y, r);
    }
  }

  _actualizarIndicadorRondas() {
    if (!this._dotsRonda) return;
    const R = this._dotR;

    this._dotsRonda.forEach((dot, i) => {
      this.tweens.killTweensOf(dot);
      dot.setAlpha(1);

      let estado;
      if (i < this.rondaActual - 1) estado = 'completado';
      else if (i === this.rondaActual - 1) estado = 'actual';
      else estado = 'pendiente';

      this._pintarDot(dot, dot._ix, dot._iy, R, estado);

      if (estado === 'actual') {
        this.tweens.add({
          targets: dot,
          alpha: { from: 0.65, to: 1 },
          duration: 550,
          yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });
  }

  // ─── Cuenta regresiva ─────────────────────────────────────────────────────
  _cuentaRegresiva() {
    const { width, height } = this.scale;
    this.juegoActivo = false;
    this.rtMuro.clear();

    const pasos = ['3', '2', '1', '¡YA!'];
    const colores = ['#fa804f', '#fdbf2c', '#3dc9a1', '#ffffff'];
    let i = 0;

    const mostrar = () => {
      const t = this.add.text(width / 2, height / 2, pasos[i], {
        fontSize: '220px',
        fontFamily: 'Fredoka, sans-serif',
        color: colores[i],
        stroke: '#000000',
        strokeThickness: 18,
      }).setOrigin(0.5).setDepth(30).setAlpha(0).setScale(0.3);

      this.tweens.add({
        targets: t,
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 250,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(550, () => {
            this.tweens.add({
              targets: t,
              alpha: 0, scaleX: 1.5, scaleY: 1.5,
              duration: 200,
              onComplete: () => {
                t.destroy();
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
    if (this.rondaActual >= this.posesRonda.length) {
      this._finDePartida();
      return;
    }

    this.validando = false;
    this.tiempoRestante = CONFIG.duracionPorPose;
    this._escalaMuro = { v: 0.12 };
    this._modoQuieto = false;

    const pose = this.posesRonda[this.rondaActual];
    this.rondaActual++;
    this._poseActual = pose;

    this._actualizarIndicadorRondas();
    this.textoInstruccion.setText(pose.descripcion);

    if (!this._btnCambiarModo) {
      this._btnCambiarModo = this.add.text(20, 120, '🔀 Cambiar modo', {
        fontSize: '22px', fontFamily: 'Fredoka, sans-serif',
        color: '#ffffff', backgroundColor: '#00000088',
        padding: { x: 14, y: 8 },
      }).setOrigin(0, 0).setDepth(70).setInteractive({ cursor: 'pointer' });

      this._btnCambiarModo.on('pointerdown', () => {
        this._sonido('pop');
        this.time.delayedCall(50, () => this._volverAlMenu());
      });

      this.sensorButtons.push({
        absX: 110, absY: 132, w: 200, h: 44,
        callback: () => {
          this._sonido('pop');
          this.time.delayedCall(50, () => this._volverAlMenu());
        }
      });
    }

    // Primero el preview, luego arrancar
    this._previewPose(pose, () => {
      if (!this.scene.isActive('DuroMuroScene')) return;

      this.juegoActivo = true;
      this._crearMuro(pose);
      this.textoTimer.setText(`${this.tiempoRestante}`).setColor('#ffffff');

      this._tweenMuro = this.tweens.add({
        targets: this._escalaMuro,
        v: 1.0,
        duration: CONFIG.duracionPorPose * 1000,
        ease: 'Linear',
        onComplete: () => {
          if (!this.validando) this._validarPose(this._poseActual);
        },
      });

      this._timerRonda = this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
          if (!this.juegoActivo) return;
          this.tiempoRestante--;
          this.textoTimer.setText(`${this.tiempoRestante}`);

          // ── Arco de progreso ──────────────────────────────────
          const { width } = this.scale;
          const pct = this.tiempoRestante / CONFIG.duracionPorPose;
          const arc = this._timerArc;
          arc.clear();

          const R_OUT = 58, R_IN = 46;
          const cx = 0, cy = 0;   // el graphics ya está posicionado en width/2, 90

          const colorArc = pct > 0.5 ? C.verde
            : pct > 0.25 ? C.amarillo
              : C.naranja;

          // Track de fondo
          arc.lineStyle(12, 0xffffff, 0.08);
          arc.beginPath();
          arc.arc(cx, cy, R_OUT, 0, Math.PI * 2);
          arc.strokePath();

          // Arco activo — de -90° en sentido horario
          if (pct > 0) {
            arc.lineStyle(12, colorArc, 0.9);
            arc.beginPath();
            arc.arc(cx, cy, R_OUT,
              -Math.PI / 2,
              -Math.PI / 2 + Math.PI * 2 * pct,
              false);
            arc.strokePath();

            // Punto brillante en el extremo
            const angle = -Math.PI / 2 + Math.PI * 2 * pct;
            arc.fillStyle(0xffffff, 1);
            arc.fillCircle(
              cx + Math.cos(angle) * R_OUT,
              cy + Math.sin(angle) * R_OUT,
              5,
            );
          }

          // Color del número según urgencia
          if (this.tiempoRestante <= 3 && this.tiempoRestante > 0) {
            this.textoTimer.setColor('#fa804f');
            this.cameras.main.shake(80, 0.003);
            // Pulso rápido en el número
            this.tweens.add({
              targets: this.textoTimer,
              scaleX: 1.18, scaleY: 1.18,
              duration: 90, yoyo: true,
            });
          } else {
            this.textoTimer.setColor('#ffffff');
          }
        },
      });

      this._timerQuieto = this.time.delayedCall((CONFIG.duracionPorPose - 3) * 1000, () => {
        if (!this.juegoActivo) return;

        this._modoQuieto = true;
        if (this._emojiPose) {
          this._emojiPose.destroy();
          this._emojiPose = null;
        }

        this.tweens.add({
          targets: [this.grafEsqueleto, this.grafFeedback],
          alpha: 0,
          duration: 400,
        });

        const { width, height } = this.scale;
        this._textoQuieto = this.add.text(width / 2, height / 2 - 40, '¡QUIETO!\n¡No te muevas!', {
          fontSize: '72px',
          fontFamily: 'Fredoka, sans-serif',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 10,
          align: 'center',
        }).setOrigin(0.5).setDepth(25).setAlpha(0);

        this.tweens.add({ targets: this._textoQuieto, alpha: 1, duration: 200 });
        this.tweens.add({
          targets: this._textoQuieto,
          alpha: 0.3,
          duration: 300,
          yoyo: true,
          repeat: -1,
          delay: 200,
        });

        this.cameras.main.shake(200, 0.006);
        this._sonido('dm_quieto');
      });
    });
  }

  _mostrarDebugPoses() {
    const { width: W, height: H } = this.scale;

    // Pausar juego actual
    this.juegoActivo = false;
    this._timerRonda?.destroy();
    this._tweenMuro?.stop();
    this._limpiarMuro();
    this._textoQuieto?.destroy();
    this._textoQuieto = null;
    this.grafEsqueleto.clear();
    this.grafFeedback.clear();
    this.textoTimer.setText('');

    const panel = this.add.container(0, 0).setDepth(500);

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92);
    panel.add(bg);

    const titulo = this.add.text(W / 2, 40, '🛠️ DEBUG — Seleccionar Pose', {
      fontSize: '32px', fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
    }).setOrigin(0.5);
    panel.add(titulo);

    const todasPoses = [...CONFIG.poses, ...CONFIG.posesDuo];
    const cols = 4;
    const btnW = 280, btnH = 60, gap = 10;
    const startX = W / 2 - (cols * (btnW + gap)) / 2 + btnW / 2;
    const startY = 100;

    todasPoses.forEach((pose, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (btnW + gap);
      const y = startY + row * (btnH + gap);

      const esDuo = pose.id.startsWith('duo_');
      const btn = this.add.rectangle(x, y, btnW, btnH, esDuo ? C.naranja : C.azul, 1)
        .setInteractive({ cursor: 'pointer' });
      panel.add(btn);

      const txt = this.add.text(x, y, pose.nombre, {
        fontSize: '18px', fontFamily: 'Fredoka, sans-serif',
        color: '#ffffff', stroke: '#000', strokeThickness: 3,
        wordWrap: { width: btnW - 10 }, align: 'center',
      }).setOrigin(0.5);
      panel.add(txt);

      btn.on('pointerdown', () => {
        panel.destroy();
        const modo = esDuo ? 'duo' : 'solo';
        this.modo = modo;
        this.posesRonda = [pose];
        this.rondaActual = 0;
        this.validando = false;
        const enviar = () => sendMessage({ juego: 'poses', modo }, 8080);
        enviar();
        this._cuentaRegresiva();
      });
    });

    const btnCerrar = this.add.text(W / 2, H - 40, 'CERRAR', {
      fontSize: '24px', fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff', backgroundColor: '#ff3344',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    panel.add(btnCerrar);
    btnCerrar.on('pointerdown', () => {
      panel.destroy();
      this._iniciarRonda();
    });
  }

  _playMusica() {
    if (this._musicaActual) {
      this._musicaActual.stop();
      this._musicaActual.removeAllListeners();
    }

    const indice = Phaser.Math.Between(1, 8);
    this._musicaActual = this.sound.add(`duro_muro_music_${indice}`, { volume: 0.5, loop: false });

    this._musicaActual.on('complete', () => {
      if (this.scene.isActive('DuroMuroScene')) {
        this._playMusica();
      }
    });

    this._musicaActual.play();
  }

  // ─── Update ───────────────────────────────────────────────────────────────
  _cancelHold() {
    this.holdBtn = null;
    this.holdGraphics.clear();
  }

  _normalizarEsqueleto(esq) {
    const joints = Object.values(esq).filter(p => p);
    if (joints.length === 0) return esq;

    const minY = Math.min(...joints.map(p => p.y));
    const maxY = Math.max(...joints.map(p => p.y));
    const minX = Math.min(...joints.map(p => p.x));
    const maxX = Math.max(...joints.map(p => p.x));

    const spanY = maxY - minY || 1;
    const centerY = (minY + maxY) / 2;
    const centerX = (minX + maxX) / 2;

    const escala = 0.70 / spanY;

    const result = {};
    Object.entries(esq).forEach(([key, p]) => {
      if (!p) { result[key] = p; return; }
      result[key] = {
        x: 0.50 + (p.x - centerX) * escala,
        y: 0.48 + (p.y - centerY) * escala, // ← 0.48 en vez de 0.50 baja el esqueleto
      };
    });
    return result;
  }

  update(time, delta) {
    if (!this._debugKeys) {
      this._debugKeys = {
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
    if (Phaser.Input.Keyboard.JustDown(this._debugKeys.D)) {
      this._mostrarDebugPoses();
    }

    if (!this.juegoActivo && !this.validando) {
      this.grafEsqueleto.clear();
      this.grafFeedback.clear();
      return;
    }

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

    const { width, height } = this.scale;

    if (this._muroContainer && this._escalaMuro) {
      this._muroContainer.setScale(this._escalaMuro.v);
    }

    this.grafEsqueleto.clear();
    this.grafFeedback.clear();

    if (this.modo === 'duo') {
      const hayAlguien = this.esq1 || this.esq2;
      if (hayAlguien) {
        this.textoSinJugador.setVisible(false);
        if (this._debugEsqueleto) {
          if (this.esq2) {
            const e2 = this._espejearEsqueleto(this._normalizarEsqueleto(this.esq2));
            this._dibujarEsqueleto(this.grafEsqueleto, e2, 0, 0, width / 2, height, C.azul, 48, 36);
            this._dibujarEsqueleto(this.grafEsqueleto, e2, 0, 0, width / 2, height, 0xffffff, 18, 18);
          }
          if (this.esq1) {
            const e1 = this._espejearEsqueleto(this._normalizarEsqueleto(this.esq1));
            this._dibujarEsqueleto(this.grafEsqueleto, e1, width / 2, 0, width / 2, height, C.naranja, 48, 36);
            this._dibujarEsqueleto(this.grafEsqueleto, e1, width / 2, 0, width / 2, height, 0xffffff, 18, 18);
          }
        }
        if (this.juegoActivo && this._poseActual) {
          this._dibujarFeedback(this._poseActual, this.esqueleto);
        }
      } else if (this.juegoActivo) {
        this.textoSinJugador.setText('👥 Esperando jugadores...').setVisible(true);
      }
    } else {
      if (this.esqueleto) {
        this.textoSinJugador.setVisible(false);
        const esqueletoEval = this._normalizarEsqueleto(this.esqueleto);
        const esqueletoNorm = this._espejearEsqueleto(esqueletoEval);
        if (this._debugEsqueleto) {
          this._dibujarEsqueleto(this.grafEsqueleto, esqueletoNorm, 0, 0, width, height, C.azul, 48, 36);
          this._dibujarEsqueleto(this.grafEsqueleto, esqueletoNorm, 0, 0, width, height, 0xffffff, 18, 18);
        }
        if (this.juegoActivo && this._poseActual) {
          this._dibujarFeedback(this._poseActual, esqueletoNorm, esqueletoEval);
        }
      } else if (this.juegoActivo) {
        this.textoSinJugador.setText('👤 Buscando jugador...').setVisible(true);
      }
    }
  }

  // ─── Muro con hueco usando RenderTexture ──────────────────────────────────
  // Así funciona la técnica:
  // 1. Limpiamos el RenderTexture
  // 2. Dibujamos la imagen del muro escalada
  // 3. Dibujamos la silueta encima con blendMode ERASE
  //    → Eso "borra" los píxeles del muro donde está la silueta
  //    → Resultado: un hueco real con la forma del cuerpo
  // ─── Muro con hueco usando GeometryMask ──────────────────────
  _crearMuro(pose) {
    this._limpiarMuro();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this._muroCuadrantes = [];

    const cuadrantes = [
      { ox: -width / 2, oy: -height / 2, w: width / 2, h: height / 2, dir: { x: -1, y: -1 } },
      { ox: 0, oy: -height / 2, w: width / 2, h: height / 2, dir: { x: 1, y: -1 } },
      { ox: -width / 2, oy: 0, w: width / 2, h: height / 2, dir: { x: -1, y: 1 } },
      { ox: 0, oy: 0, w: width / 2, h: height / 2, dir: { x: 1, y: 1 } },
    ];

    const isDuo = this.modo === 'duo';
    const siluetaH = isDuo ? height * 0.72 : height * 0.92;
    const siluetaW = isDuo ? width * 0.82 : siluetaH * 0.65;

    cuadrantes.forEach((q) => {
      const container = this.add.container(cx, cy).setDepth(10);

      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0);
      bg.fillRect(q.ox, q.oy, q.w, q.h);
      container.add(bg);

      const img = this.add.image(0, 0, 'duro_muro_textura').setDisplaySize(width, height);
      container.add(img);

      const maskShape = this.make.graphics({ x: cx, y: cy, add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(cx + q.ox, cy + q.oy, q.w, q.h);
      const mask = maskShape.createGeometryMask();
      container.setMask(mask);

      this._muroCuadrantes.push({ container, dir: q.dir, maskShape });
    });

    this._muroSilueta = this.add.container(cx, cy).setDepth(11);

    const capasGlow = [
      { extra: 1.28, alpha: 0.06, tint: 0x40c0dd },
      { extra: 1.18, alpha: 0.12, tint: 0x40c0dd },
      { extra: 1.10, alpha: 0.25, tint: 0x40c0dd },
      { extra: 1.05, alpha: 0.50, tint: 0x40c0dd },
      { extra: 1.02, alpha: 0.80, tint: 0x40c0dd },
      { extra: 1.00, alpha: 0.60, tint: 0xffffff },
    ];

    capasGlow.forEach(({ extra, alpha, tint }) => {
      const g = this.add.image(0, 0, pose.imagenKey)
        .setDisplaySize(siluetaW * extra, siluetaH * extra)
        .setTint(tint).setAlpha(alpha);
      this._muroSilueta.add(g);
    });

    const silueta = this.add.image(0, 0, pose.imagenKey)
      .setDisplaySize(siluetaW, siluetaH)
      .setTint(0xffffff).setAlpha(1);
    this._muroSilueta.add(silueta);

    this._muroCuadrantes.forEach(({ container }) => container.setScale(0.12));
    this._muroSilueta.setScale(0.12);

    this._muroContainer = {
      setScale: (v) => {
        this._muroCuadrantes.forEach(({ container }) => container.setScale(v));
        this._muroSilueta?.setScale(v);
      }
    };
  }


  _limpiarMuro() {
    if (this._muroCuadrantes) {
      this._muroCuadrantes.forEach(({ container, maskShape }) => {
        maskShape?.destroy();
        container.destroy();
      });
      this._muroCuadrantes = null;
    }
    this._muroSilueta?.destroy();
    this._muroSilueta = null;
    this._muroContainer = null;
  }

  // ─── Dibujar silueta gruesa para el hueco ────────────────────────────────
  // Las líneas y círculos deben ser MUY gruesos para que el hueco
  // sea suficientemente grande para que el niño "entre" visualmente
  _dibujarSiluetaProcedural(g, silueta, ox, oy, areaW, areaH, color, grosor, radio) {
    g.lineStyle(grosor, color, 1);

    CONEXIONES.forEach(([a, b]) => {
      if (!silueta[a] || !silueta[b]) return;
      g.beginPath();
      g.moveTo(ox + silueta[a].x * areaW, oy + silueta[a].y * areaH);
      g.lineTo(ox + silueta[b].x * areaW, oy + silueta[b].y * areaH);
      g.strokePath();
    });

    g.fillStyle(color, 1);
    Object.values(silueta).forEach((p) => {
      if (!p) return;
      g.fillCircle(ox + p.x * areaW, oy + p.y * areaH, radio);
    });

    // Cabeza
    const n = silueta.nariz;
    const hI = silueta.hombro_izquierdo;
    const hD = silueta.hombro_derecho;
    if (n && hI && hD) {
      const anchoH = Math.abs(hD.x - hI.x) * areaW;
      const rHead = Phaser.Math.Clamp(anchoH * 0.42, 16, 50);
      g.fillCircle(ox + n.x * areaW, oy + n.y * areaH, rHead);
    }
  }

  // ─── Esqueleto genérico ───────────────────────────────────────────────────
  // ─── Dibujar esqueleto como muñeco de luz ─────────────────────────────────
  // No dibuja palitos — dibuja un personaje neón con proporciones humanas
  _dibujarEsqueleto(graphics, esqueleto, offsetX, offsetY, areaW, areaH, color, grosor, radio) {
    const hIzq = esqueleto['hombro_izquierdo'];
    const hDer = esqueleto['hombro_derecho'];
    const cIzq = esqueleto['cadera_izquierda'];
    const cDer = esqueleto['cadera_derecha'];
    const nariz = esqueleto['nariz'];

    const cxHombros = hIzq && hDer ? (hIzq.x + hDer.x) / 2 : null;
    const cyHombros = hIzq && hDer ? (hIzq.y + hDer.y) / 2 : null;
    const cxCaderas = cIzq && cDer ? (cIzq.x + cDer.x) / 2 : null;
    const cyCaderas = cIzq && cDer ? (cIzq.y + cDer.y) / 2 : null;

    let cabeza = null;
    if (cxHombros !== null && nariz) {
      const distNH = Math.sqrt(
        Math.pow(nariz.x - cxHombros, 2) +
        Math.pow(nariz.y - cyHombros, 2)
      );
      cabeza = {
        x: cxHombros + (nariz.x - cxHombros) * 0.3,
        y: cyHombros - distNH * 0.4,
      };
    }

    graphics.lineStyle(grosor, color, 1);

    // ── Torso — línea vertical centro ────────────────────────
    if (cxHombros !== null && cxCaderas !== null) {
      graphics.beginPath();
      graphics.moveTo(offsetX + cxHombros * areaW, offsetY + cyHombros * areaH);
      graphics.lineTo(offsetX + cxCaderas * areaW, offsetY + cyCaderas * areaH);
      graphics.strokePath();
    }

    // ── Barra de hombros ──────────────────────────────────────
    if (hIzq && hDer) {
      graphics.beginPath();
      graphics.moveTo(offsetX + hIzq.x * areaW, offsetY + hIzq.y * areaH);
      graphics.lineTo(offsetX + hDer.x * areaW, offsetY + hDer.y * areaH);
      graphics.strokePath();
    }

    // ── Brazos desde hombros reales ───────────────────────────
    const codoIzq = esqueleto['codo_izquierdo'];
    const munecaIzq = esqueleto['muneca_izquierda'];
    const codoDer = esqueleto['codo_derecho'];
    const munecaDer = esqueleto['muneca_derecha'];

    if (hIzq && codoIzq) {
      graphics.beginPath();
      graphics.moveTo(offsetX + hIzq.x * areaW, offsetY + hIzq.y * areaH);
      graphics.lineTo(offsetX + codoIzq.x * areaW, offsetY + codoIzq.y * areaH);
      graphics.strokePath();
    }
    if (codoIzq && munecaIzq) {
      graphics.beginPath();
      graphics.moveTo(offsetX + codoIzq.x * areaW, offsetY + codoIzq.y * areaH);
      graphics.lineTo(offsetX + munecaIzq.x * areaW, offsetY + munecaIzq.y * areaH);
      graphics.strokePath();
    }
    if (hDer && codoDer) {
      graphics.beginPath();
      graphics.moveTo(offsetX + hDer.x * areaW, offsetY + hDer.y * areaH);
      graphics.lineTo(offsetX + codoDer.x * areaW, offsetY + codoDer.y * areaH);
      graphics.strokePath();
    }
    if (codoDer && munecaDer) {
      graphics.beginPath();
      graphics.moveTo(offsetX + codoDer.x * areaW, offsetY + codoDer.y * areaH);
      graphics.lineTo(offsetX + munecaDer.x * areaW, offsetY + munecaDer.y * areaH);
      graphics.strokePath();
    }

    // ── Piernas desde centro de caderas ──────────────────────
    if (cxCaderas !== null) {
      const ox = offsetX + cxCaderas * areaW;
      const oy = offsetY + cyCaderas * areaH;

      const rodIzq = esqueleto['rodilla_izquierda'];
      const tobIzq = esqueleto['tobillo_izquierdo'];
      const rodDer = esqueleto['rodilla_derecha'];
      const tobDer = esqueleto['tobillo_derecho'];

      if (rodIzq) {
        graphics.beginPath();
        graphics.moveTo(ox, oy);
        graphics.lineTo(offsetX + rodIzq.x * areaW, offsetY + rodIzq.y * areaH);
        graphics.strokePath();
      }
      if (rodIzq && tobIzq) {
        graphics.beginPath();
        graphics.moveTo(offsetX + rodIzq.x * areaW, offsetY + rodIzq.y * areaH);
        graphics.lineTo(offsetX + tobIzq.x * areaW, offsetY + tobIzq.y * areaH);
        graphics.strokePath();
      }
      if (rodDer) {
        graphics.beginPath();
        graphics.moveTo(ox, oy);
        graphics.lineTo(offsetX + rodDer.x * areaW, offsetY + rodDer.y * areaH);
        graphics.strokePath();
      }
      if (rodDer && tobDer) {
        graphics.beginPath();
        graphics.moveTo(offsetX + rodDer.x * areaW, offsetY + rodDer.y * areaH);
        graphics.lineTo(offsetX + tobDer.x * areaW, offsetY + tobDer.y * areaH);
        graphics.strokePath();
      }
    }

    // ── Joints — ahora incluye hombros para que no floten ────
    graphics.fillStyle(color, 1);
    [
      'codo_izquierdo', 'codo_derecho',
      'muneca_izquierda', 'muneca_derecha',
      'rodilla_izquierda', 'rodilla_derecha',
      'tobillo_izquierdo', 'tobillo_derecho',
    ].forEach((nombre) => {
      const p = esqueleto[nombre];
      if (!p) return;
      graphics.fillCircle(offsetX + p.x * areaW, offsetY + p.y * areaH, radio);
    });

    // ── Cabeza ────────────────────────────────────────────────
    if (cabeza && hIzq && hDer) {
      const anchoHombros = Math.abs(hDer.x - hIzq.x) * areaW;
      const radioCabeza = Math.min(Math.max(radio * 2, anchoHombros * 0.18), 35);
      const cx = offsetX + cabeza.x * areaW;
      const cy = offsetY + cabeza.y * areaH;

      graphics.fillStyle(color, 0.2);
      graphics.fillCircle(cx, cy, radioCabeza * 1.4);
      graphics.fillStyle(color, 1);
      graphics.fillCircle(cx, cy, radioCabeza);
      graphics.lineStyle(3, 0xffffff, 0.6);
      graphics.strokeCircle(cx, cy, radioCabeza);
    }
  }


  // ─── Feedback en tiempo real ──────────────────────────────────────────────
  _dibujarFeedback(pose, esqueletoNorm, esqueletoEval = esqueletoNorm) {
    if (!esqueletoNorm || !pose) return;
    const { width, height } = this.scale;

    const esq2Norm = this.esq2
      ? this._espejearEsqueleto(this._normalizarEsqueleto(this.esq2))
      : null;
    const { aciertos, total } = this._evaluarPoseCompleta(pose.id, esqueletoEval, esq2Norm);
    const pct = total > 0 ? aciertos / total : 0;

    const bw = width * 0.5;
    const bx = width / 2 - bw / 2;
    const by = height - 130;
    const color = pct >= CONFIG.umbralExito ? C.verde : (pct >= 0.4 ? C.amarillo : C.naranja);

    this.grafFeedback.fillStyle(0x000000, 0.5);
    this.grafFeedback.fillRoundedRect(bx - 2, by - 2, bw + 4, 20, 9);
    this.grafFeedback.fillStyle(color, 1);
    this.grafFeedback.fillRoundedRect(bx, by, Math.max(0, bw * pct), 16, 8);
    this.grafFeedback.lineStyle(2, C.blanco, 0.4);
    this.grafFeedback.strokeRoundedRect(bx, by, bw, 16, 8);

    const xUmbral = bx + bw * CONFIG.umbralExito;
    this.grafFeedback.lineStyle(2, C.blanco, 0.7);
    this.grafFeedback.beginPath();
    this.grafFeedback.moveTo(xUmbral, by - 4);
    this.grafFeedback.lineTo(xUmbral, by + 20);
    this.grafFeedback.strokePath();

    if (!this._modoQuieto) {
      const emojis = [
        { min: 0.75, emoji: '🔥' },
        { min: 0.55, emoji: '😄' },
        { min: 0.35, emoji: '😐' },
        { min: 0, emoji: '😴' },
      ];
      const emojiActual = emojis.find(e => pct >= e.min)?.emoji ?? '😴';
      if (this._emojiPose) this._emojiPose.destroy();
      this._emojiPose = this.add.text(
        bx + bw * pct, by - 50, emojiActual, { fontSize: '48px' }
      ).setOrigin(0.5).setDepth(17);
    }

    const ahora = this.time.now;
    const nivelActual = pct >= CONFIG.umbralExito ? 'bien' : (pct >= 0.4 ? 'medio' : 'mal');

    if (ahora - this._ultimaVoz > 3000 && nivelActual !== this._ultimoNivelVoz) {
      this._ultimaVoz = ahora;
      this._ultimoNivelVoz = nivelActual;
      if (nivelActual === 'bien') {
        const frases = ['dm_quieto', 'dm_eres_mejor', 'dm_vas_excelente'];
        this._sonido(frases[Math.floor(Math.random() * frases.length)], { volume: 1.5 });
      } else if (nivelActual === 'medio') {
        const frases = ['dm_casi', 'dm_poquitin'];
        this._sonido(frases[Math.floor(Math.random() * frases.length)], { volume: 1.5 });
      } else {
        const frases = ['dm_muevete', 'dm_no_perder'];
        this._sonido(frases[Math.floor(Math.random() * frases.length)], { volume: 1.5 });
      }
    }
  }


  _evaluarPoseCompleta(poseId, esq, esq2 = null) {

    // ── Poses dúo ────────────────────────────────────────────
    if (poseId === 'duo_fusion') {
      if (!esq || !esq2) return { aciertos: 0, total: 4, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const distX = (a, b) => a && b ? Math.abs(a.x - b.x) : 0;
      const masArriba = (a, b) => a && b && a.y < b.y;
      const anchoH1 = distX(get1('hombro_izquierdo'), get1('hombro_derecho')) || 0.3;
      const anchoH2 = distX(get2('hombro_izquierdo'), get2('hombro_derecho')) || 0.3;
      const checks = [
        () => distX(get1('tobillo_izquierdo'), get1('tobillo_derecho')) > anchoH1 * 1.2,
        () => distX(get2('tobillo_izquierdo'), get2('tobillo_derecho')) > anchoH2 * 1.2,
        () => masArriba(get1('muneca_derecha'), get1('hombro_derecho')),
        () => masArriba(get2('muneca_izquierda'), get2('hombro_izquierdo')),
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    if (poseId === 'duo_brazo') {
      if (!esq || !esq2) return { aciertos: 0, total: 2, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const distY = (a, b) => a && b ? Math.abs(a.y - b.y) : 0;
      const masAfuera = (a, b, lado) => {
        if (!a || !b) return false;
        return lado === 'izq' ? a.x < b.x : a.x > b.x;
      };
      const checks = [
        () => (masAfuera(get1('muneca_derecha'), get1('hombro_derecho'), 'der') || masAfuera(get1('muneca_izquierda'), get1('hombro_izquierdo'), 'izq')) && distY(get1('muneca_derecha'), get1('hombro_derecho')) < 0.3,
        () => (masAfuera(get2('muneca_derecha'), get2('hombro_derecho'), 'der') || masAfuera(get2('muneca_izquierda'), get2('hombro_izquierdo'), 'izq')) && distY(get2('muneca_izquierda'), get2('hombro_izquierdo')) < 0.3,
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    if (poseId === 'duo_superheroes1') {
      if (!esq || !esq2) return { aciertos: 0, total: 4, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const masArriba = (a, b) => a && b && a.y < b.y;
      const masAfuera = (a, b, lado) => {
        if (!a || !b) return false;
        return lado === 'izq' ? a.x < b.x : a.x > b.x;
      };
      const checks = [
        () => masAfuera(get1('muneca_izquierda'), get1('hombro_izquierdo'), 'izq'),
        () => !masArriba(get1('muneca_derecha'), get1('hombro_derecho')),
        () => masArriba(get2('muneca_derecha'), get2('nariz')),
        () => Math.abs((get2('tobillo_izquierdo')?.x ?? 0) - (get2('tobillo_derecho')?.x ?? 0)) >
          Math.abs((get2('hombro_izquierdo')?.x ?? 0) - (get2('hombro_derecho')?.x ?? 0)) * 0.8,
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    if (poseId === 'duo_superheroes2') {
      if (!esq || !esq2) return { aciertos: 0, total: 2, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const masArriba = (a, b) => a && b && a.y < b.y;
      const checks = [
        () => masArriba(get1('muneca_derecha'), get1('nariz')) || masArriba(get1('muneca_izquierda'), get1('nariz')),
        () => masArriba(get2('muneca_derecha'), get2('nariz')) || masArriba(get2('muneca_izquierda'), get2('nariz')),
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    if (poseId === 'duo_disco') {
      if (!esq || !esq2) return { aciertos: 0, total: 4, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const masArriba = (a, b) => a && b && a.y < b.y;
      const checks = [
        () => masArriba(get1('muneca_derecha'), get1('nariz')) ||
          masArriba(get1('muneca_izquierda'), get1('nariz')),
        () => masArriba(get2('muneca_derecha'), get2('nariz')) ||
          masArriba(get2('muneca_izquierda'), get2('nariz')),
        () => Math.abs((get1('tobillo_izquierdo')?.x ?? 0) - (get1('tobillo_derecho')?.x ?? 0)) >
          Math.abs((get1('hombro_izquierdo')?.x ?? 0) - (get1('hombro_derecho')?.x ?? 0)) * 0.8,
        () => Math.abs((get2('tobillo_izquierdo')?.x ?? 0) - (get2('tobillo_derecho')?.x ?? 0)) >
          Math.abs((get2('hombro_izquierdo')?.x ?? 0) - (get2('hombro_derecho')?.x ?? 0)) * 0.8,
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    if (poseId === 'duo_dinos') {
      if (!esq || !esq2) return { aciertos: 0, total: 4, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const distX = (a, b) => a && b ? Math.abs(a.x - b.x) : 0;
      const masAfuera = (a, b, lado) => {
        if (!a || !b) return false;
        return lado === 'izq' ? a.x < b.x : a.x > b.x;
      };
      const anchoH1 = distX(get1('hombro_izquierdo'), get1('hombro_derecho')) || 0.3;
      const anchoH2 = distX(get2('hombro_izquierdo'), get2('hombro_derecho')) || 0.3;
      const checks = [
        () => distX(get1('tobillo_izquierdo'), get1('tobillo_derecho')) > anchoH1 * 1.2,
        () => distX(get2('tobillo_izquierdo'), get2('tobillo_derecho')) > anchoH2 * 1.2,
        () => masAfuera(get1('muneca_derecha'), get1('hombro_derecho'), 'der'),
        () => masAfuera(get2('muneca_izquierda'), get2('hombro_izquierdo'), 'izq'),
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    if (poseId === 'duo_corazon') {
      if (!esq || !esq2) return { aciertos: 0, total: 4, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const masArriba = (a, b) => a && b && a.y < b.y;
      const distX = (a, b) => a && b ? Math.abs(a.x - b.x) : 0;
      const anchoH1 = distX(get1('hombro_izquierdo'), get1('hombro_derecho')) || 0.3;
      const anchoH2 = distX(get2('hombro_izquierdo'), get2('hombro_derecho')) || 0.3;
      const checks = [
        () => masArriba(get1('muneca_derecha'), get1('nariz')),
        () => masArriba(get2('muneca_izquierda'), get2('nariz')),
        () => distX(get1('tobillo_izquierdo'), get1('tobillo_derecho')) > anchoH1 * 1.0,
        () => distX(get2('tobillo_izquierdo'), get2('tobillo_derecho')) > anchoH2 * 1.0,
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    if (poseId === 'duo_cubiertos') {
      if (!esq || !esq2) return { aciertos: 0, total: 4, porcentaje: 0 };
      const get1 = j => esq[j];
      const get2 = j => esq2[j];
      const masArriba = (a, b) => a && b && a.y < b.y;
      const distX = (a, b) => a && b ? Math.abs(a.x - b.x) : 0;
      const anchoH2 = distX(get2('hombro_izquierdo'), get2('hombro_derecho')) || 0.3;
      const checks = [
        () => masArriba(get1('muneca_izquierda'), get1('nariz')),
        () => masArriba(get1('muneca_derecha'), get1('nariz')),
        () => masArriba(get2('muneca_izquierda'), get2('nariz')),
        () => distX(get2('muneca_izquierda'), get2('muneca_derecha')) > anchoH2 * 1.5,
      ];
      const total = checks.length;
      const aciertos = checks.filter(fn => fn()).length;
      return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
    }

    // ── Poses solo ────────────────────────────────────────────
    const get = (joint) => esq[joint];
    const masArriba = (a, b) => a && b && a.y < b.y;
    const masAbajo = (a, b) => a && b && a.y > b.y;
    const masAfuera = (a, b, lado) => {
      if (!a || !b) return false;
      return lado === 'izq' ? a.x < b.x : a.x > b.x;
    };
    const distX = (a, b) => a && b ? Math.abs(a.x - b.x) : 0;
    const distY = (a, b) => a && b ? Math.abs(a.y - b.y) : 0;
    const anchoHombros = distX(get('hombro_izquierdo'), get('hombro_derecho')) || 0.3;

    const checks = {
      'estrella': [
        () => masArriba(get('muneca_izquierda'), get('hombro_izquierdo')),
        () => masArriba(get('muneca_derecha'), get('hombro_derecho')),
        () => masAfuera(get('muneca_izquierda'), get('codo_izquierdo'), 'izq'),
        () => masAfuera(get('muneca_derecha'), get('codo_derecho'), 'der'),
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) > anchoHombros * 1.2,
      ],
      'manos-cielo': [
        () => masArriba(get('muneca_izquierda'), get('nariz')),
        () => masArriba(get('muneca_derecha'), get('nariz')),
        () => masArriba(get('codo_izquierdo'), get('hombro_izquierdo')),
        () => masArriba(get('codo_derecho'), get('hombro_derecho')),
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) < anchoHombros * 1.0,
      ],
      'cangrejo': [
        () => distY(get('muneca_izquierda'), get('hombro_izquierdo')) < 0.22,
        () => distY(get('muneca_derecha'), get('hombro_derecho')) < 0.22,
        () => masAfuera(get('muneca_izquierda'), get('hombro_izquierdo'), 'izq'),
        () => masAfuera(get('muneca_derecha'), get('hombro_derecho'), 'der'),
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) < anchoHombros * 1.2,
      ],
      'rayo': [
        () => masArriba(get('muneca_derecha'), get('nariz')),
        () => masAbajo(get('muneca_izquierda'), get('cadera_izquierda')),
        () => masAfuera(get('muneca_derecha'), get('codo_derecho'), 'der'),
        () => masAfuera(get('muneca_izquierda'), get('codo_izquierdo'), 'izq'),
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) < anchoHombros * 1.0,
      ],
      'biceps': [
        () => masArriba(get('muneca_izquierda'), get('codo_izquierdo')),
        () => masArriba(get('muneca_derecha'), get('codo_derecho')),
        () => distY(get('codo_izquierdo'), get('hombro_izquierdo')) < 0.12,
        () => distY(get('codo_derecho'), get('hombro_derecho')) < 0.12,
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) < anchoHombros * 1.0,
      ],
      'egipcia': [
        () => masAfuera(get('muneca_izquierda'), get('hombro_izquierdo'), 'izq'),
        () => masAfuera(get('muneca_derecha'), get('hombro_derecho'), 'der'),
        () => masAbajo(get('muneca_derecha'), get('codo_izquierdo')),
        () => masArriba(get('muneca_izquierda'), get('codo_derecho')),
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) > anchoHombros * 0.8,
      ],
      'bicep2': [
        () => masArriba(get('muneca_izquierda'), get('nariz')),
        () => distY(get('muneca_derecha'), get('cadera_derecha')) < 0.15,
        () => masArriba(get('muneca_izquierda'), get('codo_izquierdo')),
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) < anchoHombros * 1.0,
      ],
      'equilibrio': [
        () => distY(get('muneca_izquierda'), get('hombro_izquierdo')) < 0.22,
        () => distY(get('muneca_derecha'), get('hombro_derecho')) < 0.22,
        () => masAfuera(get('muneca_izquierda'), get('hombro_izquierdo'), 'izq'),
        () => masAfuera(get('muneca_derecha'), get('hombro_derecho'), 'der'),
        () => distY(get('rodilla_izquierda'), get('rodilla_derecha')) > 0.08 ||
          distY(get('rodilla_derecha'), get('rodilla_izquierda')) > 0.08,
      ],
    };

    const poseChecks = checks[poseId] ?? [];
    const total = poseChecks.length;
    const aciertos = poseChecks.filter(fn => fn()).length;
    return { aciertos, total, porcentaje: total > 0 ? aciertos / total : 0 };
  }

  _actualizarBadgeMulti() {
    if (!this._badgeMulti) {
      const { width } = this.scale;
      this._badgeMulti = this.add.text(120, 108, '', {
        fontSize: '24px',
        fontFamily: 'Fredoka, sans-serif',
        color: '#fdbf2c',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#00000088',
        padding: { x: 10, y: 4 },
      }).setOrigin(0.5).setDepth(22);
    }
    const emojis = ['', '', '🔥', '⚡', '💥', '🌟'];
    const e = emojis[Math.min(this.multiplicador, 5)] ?? '🌟';
    this._badgeMulti.setText(`${e} x${this.multiplicador}`).setVisible(true);
    this.tweens.add({ targets: this._badgeMulti, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true });
  }

  _ocultarBadgeMulti() {
    this._badgeMulti?.setVisible(false);
  }

  // ─── Validar pose ─────────────────────────────────────────────────────────
  _validarPose(pose) {
    if (this.validando) return;
    this.validando = true;
    this.juegoActivo = false;
    this._timerRonda?.destroy();
    this._tweenMuro?.stop();

    if (!this.esqueleto) {
      this.combo = 0;
      this.multiplicador = 1;
      this._mostrarResultado(false, 0, 5, '¡No te detecté!');
      return;
    }

    const esqNorm = this._espejearEsqueleto(this._normalizarEsqueleto(this.esqueleto));

    const esq2Norm = this.esq2
      ? this._espejearEsqueleto(this._normalizarEsqueleto(this.esq2))
      : null;
    const { aciertos, total, porcentaje } = this._evaluarPoseCompleta(pose.id, esqNorm, esq2Norm);
    const umbral = pose.umbralExito ?? CONFIG.umbralExito;
    const exito = porcentaje >= umbral;

    if (exito) {
      this.combo++;
      this.multiplicador = Math.min(this.combo, 5);
      const puntos = Math.round(porcentaje * 500 * this.multiplicador);
      this.puntaje += puntos;
      this.textoPuntaje.setText(`${this.puntaje}`);
      this.tweens.add({ targets: this.textoPuntaje, scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true });
      if (this.multiplicador > 1) {
        this._mostrarCombo();
        this._actualizarBadgeMulti();
      }
    } else {
      this.combo = 0;
      this.multiplicador = 1;
      this._ocultarBadgeMulti();
    }

    this._mostrarResultado(exito, aciertos, total);
  }

  _previewPose(pose, onDone) {
    const { width, height } = this.scale;

    const panel = this.add.container(0, 0).setDepth(50);

    // Fondo oscuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    panel.add(bg);

    // Nombre de la pose
    const nombre = this.add.text(width / 2, height * 0.12, pose.nombre, {
      fontSize: '72px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);
    panel.add(nombre);

    // Imagen de la pose
    const img = this.add.image(width / 2, height * 0.45, pose.imagenKey)
      .setDisplaySize(height * 0.55, height * 0.55);
    panel.add(img);

    // Descripción
    const desc = this.add.text(width / 2, height * 0.78, pose.descripcion, {
      fontSize: '38px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);
    panel.add(desc);

    // Cuenta regresiva 3, 2, 1
    let cuenta = 3;
    const txtCuenta = this.add.text(width / 2, height * 0.90, `${cuenta}`, {
      fontSize: '58px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    panel.add(txtCuenta);

    // Fade in del panel
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 250 });

    const tick = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        cuenta--;
        if (cuenta > 0) {
          txtCuenta.setText(`${cuenta}`);
          this.tweens.add({
            targets: txtCuenta,
            scaleX: 1.3, scaleY: 1.3,
            duration: 100,
            yoyo: true,
          });
          this._sonido('tick');
        } else {
          // Fade out y arrancar
          this.tweens.add({
            targets: panel,
            alpha: 0,
            duration: 250,
            onComplete: () => {
              panel.destroy();
              onDone();
            },
          });
        }
      },
    });
  }

  // ─── Mostrar resultado ────────────────────────────────────────────────────
  _mostrarResultado(exito, aciertos, total, mensajeExtra = null) {
    // Limpiar texto quieto y restaurar alpha
    this._textoQuieto?.destroy();
    this._textoQuieto = null;
    this.grafEsqueleto.setAlpha(1);
    this.grafFeedback.setAlpha(1);

    const { width, height } = this.scale;

    if (exito) {
      this._sonido('victoria');
      // Muro explota en 4 pedazos volando hacia afuera
      this._muroCuadrantes?.forEach(({ container, dir }) => {
        this.tweens.add({
          targets: container,
          x: container.x + dir.x * width * 0.8,
          y: container.y + dir.y * height * 0.8,
          angle: dir.x * 45,
          alpha: 0,
          duration: 700,
          ease: 'Quad.easeIn',
        });
      });
      this.tweens.add({
        targets: this._muroSilueta,
        scaleX: 1.4, scaleY: 1.4,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeOut',
      });
    } else {
      this._sonido('error_fail');
      // Muro aplasta — crece hasta cubrir toda la pantalla
      this._muroCuadrantes?.forEach(({ container }) => {
        this.tweens.add({
          targets: container,
          scaleX: 1.8, scaleY: 1.8,
          duration: 220,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.cameras.main.shake(500, 0.03);
            this.tweens.add({
              targets: container,
              alpha: 0,
              duration: 280,
              delay: 100,
            });
          },
        });
      });
      this.tweens.add({
        targets: this._muroSilueta,
        scaleX: 1.8, scaleY: 1.8,
        alpha: 0,
        duration: 400,
      });
    }

    // Flash
    const flash = this.add.rectangle(0, 0, width, height,
      exito ? C.verde : C.naranja, 0.3).setOrigin(0).setDepth(25);

    // Texto grande
    const textoGrande = this.add.text(
      width / 2, height / 2 - 70,
      exito ? '🎉 ¡ATRAVESASTE!' : '😅 ¡FALLASTE!', {
      fontSize: '96px',
      fontFamily: 'Fredoka, sans-serif',
      color: exito ? '#3dc9a1' : '#fa804f',
      stroke: '#000000',
      strokeThickness: 12,
    }).setOrigin(0.5).setDepth(26).setAlpha(0).setScale(0.4);

    const detalle = mensajeExtra ?? `${aciertos} de ${total} posiciones correctas`;
    const textoDetalle = this.add.text(width / 2, height / 2 + 60, detalle, {
      fontSize: '38px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(26).setAlpha(0);

    this.tweens.add({
      targets: textoGrande,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 450,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: textoDetalle,
      alpha: 1,
      duration: 300,
      delay: 250,
    });

    this.cameras.main.shake(300, exito ? 0.012 : 0.022);
    if (exito) this._confeti(width, height);

    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: [flash, textoGrande, textoDetalle],
        alpha: 0,
        duration: 350,
        onComplete: () => {
          flash.destroy();
          textoGrande.destroy();
          textoDetalle.destroy();
          this._limpiarMuro();
          this._escalaMuro = null;
          this._poseActual = null;
          this._iniciarRonda();
        },
      });
    });
  }

  // ─── Confeti ──────────────────────────────────────────────────────────────
  _confeti(width, height) {
    const colores = [C.purpura, C.verde, C.naranja, C.amarillo, C.azul, C.blanco];
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 100, () => {
        colores.forEach((color) => {
          const emitter = this.add.particles(
            Phaser.Math.Between(width * 0.15, width * 0.85),
            Phaser.Math.Between(0, height * 0.35),
            '__DEFAULT',
            {
              speed: { min: 200, max: 500 },
              angle: { min: 0, max: 360 },
              scale: { start: 0.7, end: 0 },
              tint: color,
              lifespan: 1000,
              quantity: 6,
              gravityY: 300,
              emitting: false,
            },
          );
          emitter.explode(6);
          this.time.delayedCall(1200, () => emitter.destroy());
        });
      });
    }
  }

  _volverAlMenu() {
    // Detener timers activos
    this._btnCambiarModo?.destroy();
    this._btnCambiarModo = null;
    this._timerRonda?.destroy();
    this._tweenMuro?.stop();
    this._musicaActual?.stop();

    // Limpiar estado de juego
    this.juegoActivo = false;
    this.validando = false;
    this.rondaActual = 0;
    this.puntaje = 0;
    this.combo = 0;
    this.multiplicador = 1;
    this.esqueleto = null;
    this.esq1 = null;
    this.esq2 = null;
    this._poseActual = null;
    this._escalaMuro = null;
    this._ocultarBadgeMulti();

    // Limpiar visuales
    this._limpiarMuro();
    this.grafEsqueleto.clear();
    this.grafFeedback.clear();
    this.rtMuro.clear();
    this._textoQuieto?.destroy();
    this._textoQuieto = null;
    this.textoTimer.setText('');
    this.textoInstruccion.setText('');
    this.textoInstruccion.setVisible(true);
    this.textoTimer.setVisible(true);
    this.textoSinJugador.setVisible(false);

    // Rebarajar poses para la nueva partida
    this.posesRonda = [];

    // Destruir cualquier panel de fin de partida que haya
    // (los GameObjects de _finDePartida están sueltos, no en container,
    //  así que limpiamos toda la escena de depth >= 30 que no sea UI base)
    this.children.list
      .filter(go => go.depth >= 30 && go !== this.holdGraphics)
      .forEach(go => go.destroy());

    this._playMusica();
    this._mostrarSeleccion();
  }

  // ─── Fin de partida ───────────────────────────────────────────────────────
  _finDePartida() {
    this.juegoActivo = false;
    const { width, height } = this.scale;

    this.sensorButtons = [];

    this.rtMuro.clear();
    this.textoInstruccion.setVisible(false);
    this.textoTimer.setVisible(false);

    this._confeti(width, height);
    this._sonido('victoria');

    this.add.rectangle(0, 0, width, height, 0x000000, 0.80)
      .setOrigin(0).setDepth(30);

    const panelW = 580, panelH = 420;
    this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x1a0a2e)
      .setDepth(31).setStrokeStyle(6, C.purpura);
    this.add.rectangle(width / 2, height / 2, panelW - 20, panelH - 20, 0x000000, 0)
      .setDepth(31).setStrokeStyle(2, C.amarillo);

    this.add.text(width / 2, height / 2 - 155, '🏆 ¡Fin del Juego!', {
      fontSize: '54px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000000',
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 - 55, 'Tu puntaje final:', {
      fontSize: '30px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 + 60, `${this.puntaje}`, {
      fontSize: '120px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000000',
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(32);

    // ── Botón Jugar de nuevo ─────────────────────────────────
    const btn = this.add.rectangle(width / 2 - 185, height / 2 + 175, 320, 75, C.purpura)
      .setDepth(32).setInteractive({ cursor: 'pointer' });

    this.add.text(width / 2 - 185, height / 2 + 175, '🔄 Jugar de nuevo', {
      fontSize: '28px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(33);

    const onReiniciar = () => this.scene.restart();
    btn.on('pointerdown', onReiniciar);
    btn.on('pointerover', () => { btn.setFillStyle(0x7a3690); this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 100 }); });
    btn.on('pointerout', () => { btn.setFillStyle(C.purpura); this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 }); });

    // ── Botón Cambiar modo ───────────────────────────────────
    const btn2 = this.add.rectangle(width / 2 + 185, height / 2 + 175, 320, 75, C.azul)
      .setDepth(32).setInteractive({ cursor: 'pointer' });

    this.add.text(width / 2 + 185, height / 2 + 175, '🔀 Cambiar modo', {
      fontSize: '28px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(33);

    const onCambiarModo = () => this._volverAlMenu();
    btn2.on('pointerdown', onCambiarModo);
    btn2.on('pointerover', () => { btn2.setFillStyle(0x2a8fa0); this.tweens.add({ targets: btn2, scaleX: 1.06, scaleY: 1.06, duration: 100 }); });
    btn2.on('pointerout', () => { btn2.setFillStyle(C.azul); this.tweens.add({ targets: btn2, scaleX: 1, scaleY: 1, duration: 100 }); });

    // LiDAR — ambos botones
    this.sensorButtons.push(
      { absX: width / 2 - 185, absY: height / 2 + 175, w: 320, h: 75, callback: onReiniciar },
      { absX: width / 2 + 185, absY: height / 2 + 175, w: 320, h: 75, callback: onCambiarModo },
    );

  }

  // ─── WebSocket ────────────────────────────────────────────────────────────
  _onWsMessage(event) {
    try {
      if (!this.scene?.isActive('DuroMuroScene')) return;
    } catch (_) {
      return;
    }
    const data = event.detail;

    // ── Puerto 8081 — LiDAR ──────────────────────────────────
    if (data.port === 8081) {
      const ahora = Date.now();
      if (ahora - (this._lastSensorHit ?? 0) < 800) return;

      let x, y;
      if (data.touches?.length > 0) { x = data.touches[0].x; y = data.touches[0].y; }
      else if (data.x !== undefined) { x = data.x; y = data.y; }
      else return;

      for (const btn of this.sensorButtons) {
        if (x >= btn.absX - btn.w / 2 && x <= btn.absX + btn.w / 2 &&
          y >= btn.absY - btn.h / 2 && y <= btn.absY + btn.h / 2) {
          this._lastSensorHit = ahora;
          btn.callback();
          return;
        }
      }
      return;
    }

    // ── Puerto 8080 — Cámara ─────────────────────────────────
    if (data.port !== 8080) return;
    if (data.juego_activo !== 'poses') return;

    const numJugadores = data.jugadores_detectados
      ?? (data.jugador_detectado ? 1 : 0);

    if (this.modo === 'duo') {
      this.esq1 = data.poses?.jugador_1?.esqueleto ?? null;
      this.esq2 = data.poses?.jugador_2?.esqueleto ?? null;
      if (!this.esq1 && !this.esq2 && data.poses?.esqueleto) {
        this.esq1 = data.poses.esqueleto;
      }
      if (numJugadores === 0) { this.esq1 = null; this.esq2 = null; }
      this.esqueleto = this.esq1 ?? this.esq2;
    } else {
      if (numJugadores === 0) { this.esqueleto = null; return; }
      this.esqueleto = data.poses?.esqueleto
        ?? data.poses?.jugador_1?.esqueleto
        ?? null;
      this.esq1 = this.esqueleto;
    }
  }

  _espejearEsqueleto(esq) {
    const result = {};
    Object.entries(esq).forEach(([key, p]) => {
      if (!p) { result[key] = p; return; }
      result[key] = { x: 1 - p.x, y: p.y };
    });
    return result;
  }

  _sonido(key, cfg = {}) {
    try {
      if (this.cache?.audio?.has(key)) this.sound.play(key, cfg);
    } catch (_) { }
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  shutdown() {
    window.removeEventListener('ws-message', this._wsHandler);
    this._timerRonda?.destroy();
    this._limpiarMuro();
    this._grafAux?.destroy();
    this.rtMuro?.destroy();
    this._musicaActual?.stop();
  }
}