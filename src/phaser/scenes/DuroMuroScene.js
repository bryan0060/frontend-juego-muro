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

    this.rondaActual = 0;
    this.puntaje = 0;
    this.esqueleto = null; // legacy, se mantiene por compatibilidad
    this.esq1 = null;
    this.esq2 = null;
    this.juegoActivo = false;
    this.validando = false;
    this.posesRonda = Phaser.Utils.Array.Shuffle([...CONFIG.poses])
      .slice(0, CONFIG.totalRondas);
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
    this._mostrarSeleccion();
    this._playMusica();

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

    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
    }

    // Notificar al backend
    const enviar = () => sendMessage({ juego: 'poses', modo }, 8080);
    enviar();
    this.time.delayedCall(500, enviar);
    this.time.delayedCall(1500, enviar);

    this._playMusica();
    // Arrancar el juego
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
    // Panel puntaje
    this.add.rectangle(30, 30, 180, 80, 0x000000, 0.55)
      .setOrigin(0).setDepth(20)
      .setStrokeStyle(2, C.amarillo);

    this.add.text(120, 38, 'PUNTOS', {
      fontSize: '18px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff88',
    }).setOrigin(0.5, 0).setDepth(21);

    this.textoPuntaje = this.add.text(120, 68, '0', {
      fontSize: '46px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setDepth(21);

    // Panel ronda
    this.add.rectangle(width - 30, 30, 180, 80, 0x000000, 0.55)
      .setOrigin(1, 0).setDepth(20)
      .setStrokeStyle(2, C.verde);

    this.add.text(width - 120, 38, 'RONDA', {
      fontSize: '18px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff88',
    }).setOrigin(0.5, 0).setDepth(21);

    this.textoRonda = this.add.text(width - 120, 68,
      `1/${CONFIG.totalRondas}`, {
      fontSize: '46px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setDepth(21);

    // Timer central
    this.textoTimer = this.add.text(width / 2, 40, '', {
      fontSize: '72px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5, 0).setDepth(21);

    // Instrucción abajo
    this.textoInstruccion = this.add.text(width / 2, height - 30, '', {
      fontSize: '40px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      backgroundColor: '#00000099',
      padding: { x: 28, y: 14 },
    }).setOrigin(0.5, 1).setDepth(21);

    // Sin jugador
    this.textoSinJugador = this.add.text(width / 2, height / 2,
      '👤 Buscando jugador...', {
      fontSize: '34px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff66',
    }).setOrigin(0.5).setDepth(21).setVisible(false);
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
    if (this.rondaActual >= CONFIG.totalRondas) {
      this._finDePartida();
      return;
    }

    this.validando = false;
    this.tiempoRestante = CONFIG.duracionPorPose;
    this._escalaMuro = { v: 0.12 };

    const pose = this.posesRonda[this.rondaActual];
    this.rondaActual++;
    this._poseActual = pose;

    this.textoRonda.setText(`${this.rondaActual}/${CONFIG.totalRondas}`);
    this.textoInstruccion.setText(pose.descripcion);

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
          if (this.tiempoRestante <= 3 && this.tiempoRestante > 0) {
            this.textoTimer.setColor('#fa804f');
            this.cameras.main.shake(80, 0.003);
          }
        },
      });

      this._timerQuieto = this.time.delayedCall((CONFIG.duracionPorPose - 3) * 1000, () => {
        if (!this.juegoActivo) return;

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

    if (!this.juegoActivo && !this.validando) {
      this.grafEsqueleto.clear();
      this.grafFeedback.clear();
      return;
    }

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
    const { width, height } = this.scale;

    // Redibujar muro
    if (this._muroContainer && this._escalaMuro) {
      this._muroContainer.setScale(this._escalaMuro.v);
    }

    // Redibujar esqueleto
    this.grafEsqueleto.clear();
    this.grafFeedback.clear();

    if (this.modo === 'duo') {
      const hayAlguien = this.esq1 || this.esq2;
      if (hayAlguien) {
        this.textoSinJugador.setVisible(false);
        if (this.esq1) {
          const n1 = this._normalizarEsqueleto(this.esq1);
          this._dibujarEsqueleto(this.grafEsqueleto, n1, 0, 0, width, height, C.azul, 48, 36);
          this._dibujarEsqueleto(this.grafEsqueleto, n1, 0, 0, width, height, 0xffffff, 18, 18);
        }
        if (this.esq2) {
          const n2 = this._normalizarEsqueleto(this.esq2);
          this._dibujarEsqueleto(this.grafEsqueleto, n2, 0, 0, width, height, C.naranja, 48, 36);
          this._dibujarEsqueleto(this.grafEsqueleto, n2, 0, 0, width, height, 0xffffff, 18, 18);
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
        this._dibujarEsqueleto(this.grafEsqueleto, esqueletoNorm, 0, 0, width, height, C.azul, 48, 36);
        this._dibujarEsqueleto(this.grafEsqueleto, esqueletoNorm, 0, 0, width, height, 0xffffff, 18, 18);
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

    // Crear 4 cuadrantes — cada uno es la mitad del muro en su dirección
    const cuadrantes = [
      { ox: -width / 2, oy: -height / 2, w: width / 2, h: height / 2, dir: { x: -1, y: -1 } }, // top-left
      { ox: 0, oy: -height / 2, w: width / 2, h: height / 2, dir: { x: 1, y: -1 } }, // top-right
      { ox: -width / 2, oy: 0, w: width / 2, h: height / 2, dir: { x: -1, y: 1 } }, // bottom-left
      { ox: 0, oy: 0, w: width / 2, h: height / 2, dir: { x: 1, y: 1 } }, // bottom-right
    ];

    const siluetaH = height * 0.92;
    const siluetaW = siluetaH * 0.65;

    cuadrantes.forEach((q) => {
      const container = this.add.container(cx, cy).setDepth(10);

      // Fondo del cuadrante
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0); // transparente — la imagen cubre todo
      bg.fillRect(q.ox, q.oy, q.w, q.h);
      container.add(bg);

      // Imagen del muro — cada cuadrante muestra la misma imagen completa
      // La máscara recorta solo su cuadrante
      const img = this.add.image(0, 0, 'duro_muro_textura').setDisplaySize(width, height);
      container.add(img);

      // Máscara para recortar el cuadrante
      const maskShape = this.make.graphics({ x: cx, y: cy, add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(cx + q.ox, cy + q.oy, q.w, q.h);
      const mask = maskShape.createGeometryMask();
      container.setMask(mask);
      container._mask = maskShape; // guardar referencia para destruir

      this._muroCuadrantes.push({ container, dir: q.dir, maskShape });
    });

    // Silueta y glow — en un container separado encima de todo
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

    // Escalar todo al inicio
    this._muroCuadrantes.forEach(({ container }) => container.setScale(0.12));
    this._muroSilueta.setScale(0.12);

    // Referencia unificada para el setScale en update
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

    const { aciertos, total } = this._evaluarPoseCompleta(pose.id, esqueletoEval);
    const pct = total > 0 ? aciertos / total : 0;

    // ── Barra de progreso ─────────────────────────────────────
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

    // Marca del umbral
    const xUmbral = bx + bw * CONFIG.umbralExito;
    this.grafFeedback.lineStyle(2, C.blanco, 0.7);
    this.grafFeedback.beginPath();
    this.grafFeedback.moveTo(xUmbral, by - 4);
    this.grafFeedback.lineTo(xUmbral, by + 20);
    this.grafFeedback.strokePath();

    // ── Voces según nivel — máximo una vez cada 3 segundos ────
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


  _evaluarPoseCompleta(poseId, esq) {
    const get = (joint) => esq[joint];

    const masArriba = (a, b) => a && b && a.y < b.y;           // menor Y = más arriba
    const masAbajo = (a, b) => a && b && a.y > b.y;
    const masAfuera = (a, b, lado) => {                         // más afuera en X
      if (!a || !b) return false;
      return lado === 'izq' ? a.x < b.x : a.x > b.x;
    };
    const distX = (a, b) => a && b ? Math.abs(a.x - b.x) : 0;
    const distY = (a, b) => a && b ? Math.abs(a.y - b.y) : 0;
    const anchoHombros = distX(get('hombro_izquierdo'), get('hombro_derecho')) || 0.3;

    const checks = {
      'estrella': [
        // Brazos
        () => masArriba(get('muneca_izquierda'), get('hombro_izquierdo')),
        () => masArriba(get('muneca_derecha'), get('hombro_derecho')),
        () => masAfuera(get('muneca_izquierda'), get('codo_izquierdo'), 'izq'),
        () => masAfuera(get('muneca_derecha'), get('codo_derecho'), 'der'),
        // Piernas abiertas
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) > anchoHombros * 1.2,
      ],
      'manos-cielo': [
        () => masArriba(get('muneca_izquierda'), get('nariz')),
        () => masArriba(get('muneca_derecha'), get('nariz')),
        () => masArriba(get('codo_izquierdo'), get('hombro_izquierdo')),
        () => masArriba(get('codo_derecho'), get('hombro_derecho')),
        // Piernas juntas
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
        // Una muñeca arriba de la cabeza
        () => masArriba(get('muneca_derecha'), get('nariz')),
        // La otra muñeca abajo de la cadera
        () => masAbajo(get('muneca_izquierda'), get('cadera_izquierda')),
        // Brazos extendidos
        () => masAfuera(get('muneca_derecha'), get('codo_derecho'), 'der'),
        () => masAfuera(get('muneca_izquierda'), get('codo_izquierdo'), 'izq'),
        // Piernas juntas
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) < anchoHombros * 1.0,
      ],
      'biceps': [
        // Codos doblados — muñecas por encima de los codos
        () => masArriba(get('muneca_izquierda'), get('codo_izquierdo')),
        () => masArriba(get('muneca_derecha'), get('codo_derecho')),
        // Codos al nivel de los hombros
        () => distY(get('codo_izquierdo'), get('hombro_izquierdo')) < 0.12,
        () => distY(get('codo_derecho'), get('hombro_derecho')) < 0.12,
        // Piernas juntas
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) < anchoHombros * 1.0,
      ],
      'egipcia': [
        () => distY(get('muneca_izquierda'), get('hombro_izquierdo')) < 0.22,
        () => distY(get('muneca_derecha'), get('hombro_derecho')) < 0.22,
        () => masAfuera(get('muneca_izquierda'), get('hombro_izquierdo'), 'izq'),
        () => masAfuera(get('muneca_derecha'), get('hombro_derecho'), 'der'),
        () => distX(get('tobillo_izquierdo'), get('tobillo_derecho')) > anchoHombros * 0.8,
      ],
      'bicep2': [
        // Una muñeca arriba de la cabeza
        () => masArriba(get('muneca_izquierda'), get('nariz')),
        // La otra a la altura de la cadera
        () => distY(get('muneca_derecha'), get('cadera_derecha')) < 0.15,
        // Codo izquierdo doblado
        () => masArriba(get('muneca_izquierda'), get('codo_izquierdo')),
        // Piernas juntas
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

  // ─── Validar pose ─────────────────────────────────────────────────────────
  _validarPose(pose) {
    if (this.validando) return;
    this.validando = true;
    this.juegoActivo = false;
    this._timerRonda?.destroy();
    this._tweenMuro?.stop();

    if (!this.esqueleto) {
      this._mostrarResultado(false, 0, 5, '¡No te detecté!');
      return;
    }

    const esqNorm = this._normalizarEsqueleto(this.esqueleto);
    const { aciertos, total, porcentaje } = this._evaluarPoseCompleta(pose.id, esqNorm);
    const exito = porcentaje >= CONFIG.umbralExito;

    if (exito) {
      this.puntaje += Math.round(porcentaje * 500);
      this.textoPuntaje.setText(`${this.puntaje}`);
      this.tweens.add({
        targets: this.textoPuntaje,
        scaleX: 1.4, scaleY: 1.4,
        duration: 150, yoyo: true,
      });
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

  // ─── Fin de partida ───────────────────────────────────────────────────────
  _finDePartida() {
    this.juegoActivo = false;
    const { width, height } = this.scale;

    this.sensorButtons = [];

    this.rtMuro.clear();
    this.textoInstruccion.setVisible(false);
    this.textoTimer.setVisible(false);

    this._confeti(width, height);

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

    const btn = this.add.rectangle(width / 2, height / 2 + 175, 340, 75, C.purpura)
      .setDepth(32).setInteractive({ cursor: 'pointer' });

    this.add.text(width / 2, height / 2 + 175, '🔄 Jugar de nuevo', {
      fontSize: '30px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(33);

    const onReiniciar = () => this.scene.restart();

    btn.on('pointerdown', onReiniciar);
    btn.on('pointerover', () => {
      btn.setFillColor(0x7a3690);
      this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 100 });
    });
    btn.on('pointerout', () => {
      btn.setFillColor(C.purpura);
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
    });

    // Registrar para LiDAR
    this.sensorButtons.push({
      absX: width / 2,
      absY: height / 2 + 175,
      w: 340,
      h: 75,
      callback: onReiniciar,
    });
  }

  // ─── WebSocket ────────────────────────────────────────────────────────────
  _onWsMessage(event) {
    const data = event.detail;

    // ── Puerto 8081 — LiDAR ──────────────────────────────────
    if (data.port === 8081) {
      let x, y;
      if (data.touches?.length > 0) {
        x = data.touches[0].x;
        y = data.touches[0].y;
      } else if (data.x !== undefined) {
        x = data.x;
        y = data.y;
      } else return;

      for (const btn of this.sensorButtons) {
        if (
          x >= btn.absX - btn.w / 2 &&
          x <= btn.absX + btn.w / 2 &&
          y >= btn.absY - btn.h / 2 &&
          y <= btn.absY + btn.h / 2
        ) {
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