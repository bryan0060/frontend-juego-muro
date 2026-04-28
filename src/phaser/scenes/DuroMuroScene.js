/**
 * DuroMuroScene.js — "Duro contra el Muro"
 *
 * Juego tipo "Hole in the Wall":
 * Un muro con la silueta de una pose se acerca al jugador.
 * El jugador tiene que adoptar esa pose antes de que el muro llegue.
 * 5 rondas. Puerto 8080 (cámara de reconocimiento corporal).
 */

import * as Phaser from 'phaser';

// ─── Configuración fácil de ajustar ──────────────────────────────────────────
const CONFIG = {
  totalRondas: 5,
  duracionPorPose: 10,  // segundos por ronda
  tolerancia: 0.18,     // margen de error para validar poses (en coords normalizadas 0-1)
  poses: [
    {
      id: 'estrella',
      nombre: 'Estrella',
      emoji: '⭐',
      descripcion: '¡Abre los brazos y las piernas!',
      esqueleto: {
        nariz:             { x: 0.50, y: 0.12 },
        hombro_izquierdo:  { x: 0.35, y: 0.28 },
        hombro_derecho:    { x: 0.65, y: 0.28 },
        codo_izquierdo:    { x: 0.20, y: 0.18 },
        codo_derecho:      { x: 0.80, y: 0.18 },
        muneca_izquierda:  { x: 0.08, y: 0.10 },
        muneca_derecha:    { x: 0.92, y: 0.10 },
        cadera_izquierda:  { x: 0.42, y: 0.55 },
        cadera_derecha:    { x: 0.58, y: 0.55 },
        rodilla_izquierda: { x: 0.35, y: 0.73 },
        rodilla_derecha:   { x: 0.65, y: 0.73 },
        tobillo_izquierdo: { x: 0.28, y: 0.91 },
        tobillo_derecho:   { x: 0.72, y: 0.91 },
      },
    },
    {
      id: 'manos-cielo',
      nombre: 'Manos al Cielo',
      emoji: '🙌',
      descripcion: '¡Levanta ambas manos!',
      esqueleto: {
        nariz:             { x: 0.50, y: 0.15 },
        hombro_izquierdo:  { x: 0.40, y: 0.30 },
        hombro_derecho:    { x: 0.60, y: 0.30 },
        codo_izquierdo:    { x: 0.38, y: 0.18 },
        codo_derecho:      { x: 0.62, y: 0.18 },
        muneca_izquierda:  { x: 0.36, y: 0.05 },
        muneca_derecha:    { x: 0.64, y: 0.05 },
        cadera_izquierda:  { x: 0.43, y: 0.55 },
        cadera_derecha:    { x: 0.57, y: 0.55 },
        rodilla_izquierda: { x: 0.43, y: 0.73 },
        rodilla_derecha:   { x: 0.57, y: 0.73 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho:   { x: 0.57, y: 0.91 },
      },
    },
    {
      id: 'cangrejo',
      nombre: 'Cangrejo',
      emoji: '🦀',
      descripcion: '¡Abre los brazos a los lados!',
      esqueleto: {
        nariz:             { x: 0.50, y: 0.12 },
        hombro_izquierdo:  { x: 0.35, y: 0.28 },
        hombro_derecho:    { x: 0.65, y: 0.28 },
        codo_izquierdo:    { x: 0.18, y: 0.28 },
        codo_derecho:      { x: 0.82, y: 0.28 },
        muneca_izquierda:  { x: 0.05, y: 0.28 },
        muneca_derecha:    { x: 0.95, y: 0.28 },
        cadera_izquierda:  { x: 0.42, y: 0.55 },
        cadera_derecha:    { x: 0.58, y: 0.55 },
        rodilla_izquierda: { x: 0.42, y: 0.73 },
        rodilla_derecha:   { x: 0.58, y: 0.73 },
        tobillo_izquierdo: { x: 0.42, y: 0.91 },
        tobillo_derecho:   { x: 0.58, y: 0.91 },
      },
    },
    {
      id: 'rayo',
      nombre: 'Rayo',
      emoji: '⚡',
      descripcion: '¡Brazo derecho arriba, izquierdo abajo!',
      esqueleto: {
        nariz:             { x: 0.50, y: 0.12 },
        hombro_izquierdo:  { x: 0.40, y: 0.28 },
        hombro_derecho:    { x: 0.60, y: 0.28 },
        codo_izquierdo:    { x: 0.38, y: 0.45 },
        codo_derecho:      { x: 0.70, y: 0.15 },
        muneca_izquierda:  { x: 0.36, y: 0.62 },
        muneca_derecha:    { x: 0.78, y: 0.03 },
        cadera_izquierda:  { x: 0.43, y: 0.55 },
        cadera_derecha:    { x: 0.57, y: 0.55 },
        rodilla_izquierda: { x: 0.43, y: 0.73 },
        rodilla_derecha:   { x: 0.57, y: 0.73 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho:   { x: 0.57, y: 0.91 },
      },
    },
    {
      id: 'victoria',
      nombre: 'Victoria',
      emoji: '🧘',
      descripcion: '¡Forma una V con los brazos!',
      esqueleto: {
        nariz:             { x: 0.50, y: 0.12 },
        hombro_izquierdo:  { x: 0.40, y: 0.28 },
        hombro_derecho:    { x: 0.60, y: 0.28 },
        codo_izquierdo:    { x: 0.28, y: 0.18 },
        codo_derecho:      { x: 0.72, y: 0.18 },
        muneca_izquierda:  { x: 0.18, y: 0.08 },
        muneca_derecha:    { x: 0.82, y: 0.08 },
        cadera_izquierda:  { x: 0.43, y: 0.55 },
        cadera_derecha:    { x: 0.57, y: 0.55 },
        rodilla_izquierda: { x: 0.43, y: 0.73 },
        rodilla_derecha:   { x: 0.57, y: 0.73 },
        tobillo_izquierdo: { x: 0.43, y: 0.91 },
        tobillo_derecho:   { x: 0.57, y: 0.91 },
      },
    },
  ],
};

// Qué joints conectar con líneas al dibujar el esqueleto
const CONEXIONES = [
  ['nariz', 'hombro_izquierdo'],
  ['nariz', 'hombro_derecho'],
  ['hombro_izquierdo', 'hombro_derecho'],
  ['hombro_izquierdo', 'codo_izquierdo'],
  ['codo_izquierdo', 'muneca_izquierda'],
  ['hombro_derecho', 'codo_derecho'],
  ['codo_derecho', 'muneca_derecha'],
  ['hombro_izquierdo', 'cadera_izquierda'],
  ['hombro_derecho', 'cadera_derecha'],
  ['cadera_izquierda', 'cadera_derecha'],
  ['cadera_izquierda', 'rodilla_izquierda'],
  ['rodilla_izquierda', 'tobillo_izquierdo'],
  ['cadera_derecha', 'rodilla_derecha'],
  ['rodilla_derecha', 'tobillo_derecho'],
];

export class DuroMuroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DuroMuroScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Estado del juego
    this.rondaActual = 0;
    this.puntaje = 0;
    this.esqueletoActual = null; // Último esqueleto recibido del backend
    this.juegoActivo = false;
    this.validando = false;      // Evita validar dos veces por ronda

    // Mezclar poses aleatoriamente para cada partida
    this.posesRonda = Phaser.Utils.Array.Shuffle([...CONFIG.poses])
      .slice(0, CONFIG.totalRondas);

    // ── Fondo ──────────────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0);

    // ── Gráficos del esqueleto del jugador (se redibuja cada frame) ──
    // Depth 5 → detrás del muro para que el muro se vea encima
    this.graficosEsqueleto = this.add.graphics().setDepth(5);

    // ── Gráficos del muro (se redibuja en cada frame del tween) ──
    // Depth 10 → encima del esqueleto
    this.graficosMuro = this.add.graphics().setDepth(10);

    // ── UI — Puntaje (esquina superior izquierda) ──────────────
    this.textoPuntaje = this.add.text(30, 30, 'Puntos: 0', {
      fontSize: '32px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000',
      strokeThickness: 4,
    }).setDepth(20);

    // ── UI — Ronda (esquina superior derecha) ──────────────────
    this.textoRonda = this.add.text(width - 30, 30, `Ronda 0/${CONFIG.totalRondas}`, {
      fontSize: '32px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(20);

    // ── UI — Timer (centro arriba) ─────────────────────────────
    this.textoTimer = this.add.text(width / 2, 30, '', {
      fontSize: '52px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(20);

    // ── UI — Instrucción de pose (abajo al centro) ─────────────
    this.textoInstruccion = this.add.text(width / 2, height - 40, '', {
      fontSize: '36px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 5,
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 1).setDepth(20);

    // ── UI — Aviso sin jugador ─────────────────────────────────
    this.textoSinJugador = this.add.text(width / 2, height - 120, '👤 Buscando jugador...', {
      fontSize: '28px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff88',
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // ── Escuchar mensajes del sensor ───────────────────────────
    this._wsHandler = this._onWsMessage.bind(this);
    window.addEventListener('ws-message', this._wsHandler);

    // ── Arrancar con cuenta regresiva ──────────────────────────
    this._mostrarCuentaRegresiva();
  }

  // ─── Cuenta regresiva antes de empezar ───────────────────────────────────
  _mostrarCuentaRegresiva() {
    const { width, height } = this.scale;
    const numeros = ['3', '2', '1', '¡YA!'];
    let i = 0;

    const mostrar = () => {
      const texto = this.add.text(width / 2, height / 2, numeros[i], {
        fontSize: '180px',
        fontFamily: 'Fredoka, sans-serif',
        color: '#ffffff',
        stroke: '#9c4eb3',
        strokeThickness: 14,
      }).setOrigin(0.5).setDepth(30).setAlpha(0);

      this.tweens.add({
        targets: texto,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.3, to: 1 },
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
                  this._iniciarRonda();
                }
              },
            });
          });
        },
      });
    };

    mostrar();
  }

  // ─── Iniciar una ronda ────────────────────────────────────────────────────
  _iniciarRonda() {
    if (this.rondaActual >= CONFIG.totalRondas) {
      this._finDePartida();
      return;
    }

    const { width, height } = this.scale;

    this.validando = false;
    this.juegoActivo = true;
    this.tiempoRestante = CONFIG.duracionPorPose;

    const pose = this.posesRonda[this.rondaActual];
    this.rondaActual++;

    // Actualizar UI
    this.textoRonda.setText(`Ronda ${this.rondaActual}/${CONFIG.totalRondas}`);
    this.textoTimer.setText(`${this.tiempoRestante}`).setColor('#ffffff');
    this.textoInstruccion.setText(`${pose.emoji}  ${pose.descripcion}`);

    // Limpiar muro anterior y dibujarlo pequeño (lejos)
    this.graficosMuro.clear();
    this._dibujarMuro(pose, 0.15);

    // Animar el muro acercándose — de escala 0.15 a 1.0 en duracionPorPose segundos
    // Usamos un objeto auxiliar porque Phaser solo tween-ea propiedades de objetos
    this._tweenMuro = { escala: 0.15 };
    this.tweens.add({
      targets: this._tweenMuro,
      escala: 1.0,
      duration: CONFIG.duracionPorPose * 1000,
      ease: 'Linear',
      onUpdate: () => {
        this.graficosMuro.clear();
        this._dibujarMuro(pose, this._tweenMuro.escala);
      },
      onComplete: () => {
        // El muro llegó — validar si el jugador encajó
        if (!this.validando) this._validarPose(pose);
      },
    });

    // Timer de cuenta regresiva (1 tick por segundo)
    this._timerRonda = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.juegoActivo) return;
        this.tiempoRestante--;
        this.textoTimer.setText(`${this.tiempoRestante}`);

        // Últimos 3 segundos → color rojo y shake
        if (this.tiempoRestante <= 3 && this.tiempoRestante > 0) {
          this.textoTimer.setColor('#fa804f');
          this.cameras.main.shake(60, 0.002);
        }
      },
      loop: true,
    });
  }

  // ─── Dibujar el muro con la silueta de la pose ───────────────────────────
  // escala va de 0 (lejos/pequeño) a 1 (cerca/ocupa toda la pantalla)
  _dibujarMuro(pose, escala) {
    const { width, height } = this.scale;

    const cx = width / 2;
    const cy = height / 2;
    const muroW = width * escala;
    const muroH = height * escala;

    // Fondo del muro
    this.graficosMuro.fillStyle(0x9c4eb3, 0.88);
    this.graficosMuro.fillRect(cx - muroW / 2, cy - muroH / 2, muroW, muroH);

    // Borde del muro
    this.graficosMuro.lineStyle(Math.max(2, 4 * escala), 0xfdbf2c, 1);
    this.graficosMuro.strokeRect(cx - muroW / 2, cy - muroH / 2, muroW, muroH);

    // Silueta de la pose dentro del muro (blanca)
    this._dibujarEsqueleto(
      this.graficosMuro,
      pose.esqueleto,
      cx - muroW / 2,  // origen X del área del muro
      cy - muroH / 2,  // origen Y del área del muro
      muroW,
      muroH,
      0xffffff,                   // color blanco
      Math.max(1, 3 * escala),    // grosor de línea escalado
      Math.max(2, 8 * escala),    // radio de los puntos escalado
    );
  }

  // ─── Dibujar un esqueleto con líneas y puntos ─────────────────────────────
  // Reutilizable tanto para la silueta del muro como para el jugador real
  _dibujarEsqueleto(graphics, esqueleto, offsetX, offsetY, areaW, areaH, color, grosor, radio) {
    // Dibujar líneas entre joints conectados
    graphics.lineStyle(grosor, color, 0.9);
    CONEXIONES.forEach(([a, b]) => {
      if (!esqueleto[a] || !esqueleto[b]) return;
      const x1 = offsetX + esqueleto[a].x * areaW;
      const y1 = offsetY + esqueleto[a].y * areaH;
      const x2 = offsetX + esqueleto[b].x * areaW;
      const y2 = offsetY + esqueleto[b].y * areaH;
      graphics.beginPath();
      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
      graphics.strokePath();
    });

    // Dibujar círculo en cada joint
    graphics.fillStyle(color, 1);
    Object.values(esqueleto).forEach((punto) => {
      const x = offsetX + punto.x * areaW;
      const y = offsetY + punto.y * areaH;
      graphics.fillCircle(x, y, radio);
    });
  }

  // ─── Update — se llama cada frame ────────────────────────────────────────
  // Aquí redibujamos el esqueleto del jugador con los datos más recientes
  update() {
    this.graficosEsqueleto.clear();
    if (!this.esqueletoActual) return;

    const { width, height } = this.scale;

    // El esqueleto del jugador ocupa toda la pantalla (offsetX=0, offsetY=0)
    this._dibujarEsqueleto(
      this.graficosEsqueleto,
      this.esqueletoActual,
      0, 0,
      width, height,
      0x3dc9a1,  // verde agua
      4,
      10,
    );
  }

  // ─── Recibir datos del WebSocket ──────────────────────────────────────────
  _onWsMessage(event) {
    const data = event.detail;

    // Solo procesar mensajes del puerto 8080 (cámara)
    if (data.port !== 8080) return;
    // Solo procesar si el backend está en modo "poses"
    if (data.juego_activo !== 'poses') return;

    if (!data.jugador_detectado) {
      // No hay nadie frente a la cámara
      this.esqueletoActual = null;
      this.textoSinJugador.setVisible(true);
      return;
    }

    this.textoSinJugador.setVisible(false);

    // Guardar el esqueleto más reciente para compararlo al final
    if (data.poses?.esqueleto) {
      this.esqueletoActual = data.poses.esqueleto;
    }
  }

  // ─── Validar si el jugador adoptó la pose al llegar el muro ─────────────
  _validarPose(pose) {
    if (this.validando) return;
    this.validando = true;
    this.juegoActivo = false;

    // Detener timer y animación del muro
    this._timerRonda?.destroy();
    this.tweens.killAll();

    if (!this.esqueletoActual) {
      this._mostrarResultado(false, 'No se detectó ningún jugador');
      return;
    }

    // Los joints más representativos para detectar la pose
    // (muñecas y codos definen la posición de los brazos,
    //  tobillos definen la posición de las piernas)
    const jointsImportantes = [
      'muneca_izquierda',
      'muneca_derecha',
      'codo_izquierdo',
      'codo_derecho',
      'tobillo_izquierdo',
      'tobillo_derecho',
    ];

    let aciertos = 0;

    jointsImportantes.forEach((joint) => {
      const objetivo = pose.esqueleto[joint];
      const jugador  = this.esqueletoActual[joint];
      if (!objetivo || !jugador) return;

      // Distancia euclidiana entre la posición del jugador y la posición objetivo
      // Como las coords son normalizadas (0-1), la distancia máxima posible es ~1.41
      const distancia = Math.sqrt(
        Math.pow(jugador.x - objetivo.x, 2) +
        Math.pow(jugador.y - objetivo.y, 2)
      );

      if (distancia <= CONFIG.tolerancia) aciertos++;
    });

    // Necesita acertar al menos el 60% de los joints importantes
    const umbral = Math.ceil(jointsImportantes.length * 0.6);
    const exito  = aciertos >= umbral;

    if (exito) {
      // Más aciertos = más puntos
      this.puntaje += 100 + aciertos * 20;
      this.textoPuntaje.setText(`Puntos: ${this.puntaje}`);
    }

    this._mostrarResultado(
      exito,
      exito
        ? `¡${aciertos}/${jointsImportantes.length} joints encajaron!`
        : `Solo ${aciertos}/${jointsImportantes.length} joints — ¡la próxima!`,
    );
  }

  // ─── Mostrar resultado de la ronda ───────────────────────────────────────
  _mostrarResultado(exito, mensaje) {
    const { width, height } = this.scale;

    // Flash de color en toda la pantalla
    const flash = this.add.rectangle(0, 0, width, height, exito ? 0x3dc9a1 : 0xff4444, 0.4)
      .setOrigin(0).setDepth(25);

    const textoResultado = this.add.text(
      width / 2, height / 2 - 50,
      exito ? '✅ ¡ENCAJASTE!' : '❌ ¡FALLASTE!',
      {
        fontSize: '80px',
        fontFamily: 'Fredoka, sans-serif',
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 8,
      }
    ).setOrigin(0.5).setDepth(26).setAlpha(0);

    const textoDetalle = this.add.text(width / 2, height / 2 + 60, mensaje, {
      fontSize: '34px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(26).setAlpha(0);

    this.tweens.add({
      targets: [textoResultado, textoDetalle],
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.cameras.main.shake(200, exito ? 0.008 : 0.015);

        // Esperar 2 segundos y pasar a la siguiente ronda
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: [flash, textoResultado, textoDetalle],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              flash.destroy();
              textoResultado.destroy();
              textoDetalle.destroy();
              this.graficosMuro.clear();
              this._iniciarRonda();
            },
          });
        });
      },
    });
  }

  // ─── Pantalla de fin de partida ───────────────────────────────────────────
  _finDePartida() {
    this.juegoActivo = false;
    const { width, height } = this.scale;

    this.graficosMuro.clear();
    this.textoInstruccion.setVisible(false);
    this.textoTimer.setVisible(false);

    // Overlay oscuro
    this.add.rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0).setDepth(30);

    // Panel central
    this.add.rectangle(width / 2, height / 2, 520, 360, 0x1a0a2e)
      .setDepth(31).setStrokeStyle(4, 0x9c4eb3);

    this.add.text(width / 2, height / 2 - 120, '🎉 ¡Fin del juego!', {
      fontSize: '48px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#fdbf2c',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 - 30, 'Tu puntaje:', {
      fontSize: '28px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 + 60, `${this.puntaje}`, {
      fontSize: '96px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#3dc9a1',
      stroke: '#000',
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(32);

    const btn = this.add.rectangle(width / 2, height / 2 + 155, 300, 65, 0x9c4eb3)
      .setDepth(32).setInteractive({ cursor: 'pointer' });

    this.add.text(width / 2, height / 2 + 155, '🔄 Jugar de nuevo', {
      fontSize: '26px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(33);

    btn.on('pointerdown', () => this.scene.restart());
    btn.on('pointerover',  () => btn.setFillColor(0x7a3690));
    btn.on('pointerout',   () => btn.setFillColor(0x9c4eb3));
  }

  // ─── Limpieza al salir de la escena ──────────────────────────────────────
  shutdown() {
    window.removeEventListener('ws-message', this._wsHandler);
    this._timerRonda?.destroy();
  }
}