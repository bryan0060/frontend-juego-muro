import * as Phaser from 'phaser';

const SCENARIOS = [
  { id: 'calle', intro: 'intro_calle', loop: 'loop_calle', threshold: 0 },
  { id: 'piso1', intro: 'intro_piso1', loop: 'loop_piso1', threshold: 1000 },
  { id: 'piso2', intro: 'intro_piso2', loop: 'loop_piso2', threshold: 2500 },
  { id: 'piso3', intro: 'intro_piso3', loop: 'loop_piso3', threshold: 4000 }
];

// Mapeo de carril backend → índice de lane Phaser
const CARRIL_A_LANE = { LEFT: 2, CENTER: 1, RIGHT: 0 };

// Configuración de calibración de la pista (desplazamiento, espacio de carriles y punto de fuga)
const TRACK_CONFIG = {
  centerXOffset: -80,         // Desplazamiento horizontal del centro de la pista en el suelo
  laneSpacing: 350,           // Distancia entre carriles en el suelo
  vanishingPointXOffset: -20, // Desplazamiento horizontal del punto de fuga (horizonte)
  horizonYFactor: 0.58        // Altura del horizonte/punto de fuga (de 0.0 a 1.0)
};

// Factor de reducción constante para optimizar rendimiento de croma sin alterar aspecto original
const DOWNSCALE_FACTOR = 4;

// Configuración de escala, posición (offset vertical) y croma para el deslizamiento de cada personaje
const SLIDE_CONFIGS = {
  NB1: { scale: 0.204, xOffset: -43, yOffset: 42, threshold: 45 }, // Niño Blanco (N-B-D.mp4 ajustado en tamaño y alineado al suelo)
  NB2: { scale: 0.204, xOffset: -24, yOffset: 42, threshold: 4 }, // Niño Moreno (Valores iniciales para 1080p, listos para calibración del nuevo video)
  NB3: { scale: 0.182, xOffset: -9, yOffset: 42, threshold: 60, chromaColor: 'white' }, // Niña Blanca (valores calibrados con fondo blanco)
  NB4: { scale: 0.230, xOffset: 23, yOffset: 147, threshold: 26 }, // Niña Morena (video PNG updated), valores calibrados)
};

// Configuración de escala, posición (offset) y croma para el salto de cada personaje
const JUMP_CONFIGS = {
  NB1: { scale: 0.228, xOffset: -6, yOffset: -14, threshold: 45 }, // Niño Blanco (0519 (1).mp4 precargado con coordenadas perfectas del usuario)
  NB2: { scale: 0.228, xOffset: -12, yOffset: -14, threshold: 4 }, // Niño Moreno (Umbral calibrado a 4 para recuperar el cabello al 100%)
  NB3: { scale: 0.268, xOffset: 26, yOffset: 137, threshold: 24 }, // Niña Blanca (valores calibrados)
  NB4: { scale: 0.450, xOffset: 139, yOffset: 296, threshold: 34 }
};

// Configuración de escala, posición y croma para correr/idle de cada personaje
const RUN_CONFIGS = {
  NB1: { scale: 0.34, xOffset: 47, yOffset: 0, threshold: 45 },
  NB2: { scale: 0.38, xOffset: 37, yOffset: 0, threshold: 45 },
  NB3: { scale: 0.440, xOffset: 127, yOffset: 323, threshold: 31 }, // Niña Blanca (Video MP4 con fondo negro, valores calibrados)
  NB4: { scale: 0.390, xOffset: 134, yOffset: 266, threshold: 27 }  // Niña Morena (Video MP4 con fondo negro)
};

// Rutas de los videos de cada personaje (correr/idle, saltar y deslizarse)
// Para configurar nuevos personajes o cambiar sus videos, solo debes editar las rutas aquí.
const CHARACTER_VIDEOS = {
  NB1: { // Personaje 1 (Niño Blanco)
    run: 'assets/images/subway/Personaje/NB1.webm',
    jump: 'assets/images/subway/Personaje/niño blanco/0519 (1).mp4',
    slide: 'assets/images/subway/Personaje/niño blanco/N-B-D.mp4'
  },
  NB2: { // Personaje 2 (Niño Moreno)
    run: 'assets/images/subway/Personaje/NB2.webm',
    jump: 'assets/images/subway/Personaje/niño moreno/niño moreno saltando.mp4',
    slide: 'assets/images/subway/Personaje/niño moreno/verdadero saltando.mp4'
  },
  NB3: { // Personaje 3 (Niña Blanca)
    run: 'assets/images/subway/Personaje/niña blanca/niña blanca corriendo.mp4',
    jump: 'assets/images/subway/Personaje/niña blanca/Niña blanca saltando.png', // <-- Imagen PNG
    slide: 'assets/images/subway/Personaje/niña blanca/nIña delizando verdadero.mp4'
  },
  NB4: { // Personaje 4 (Niña Morena)
    run: 'assets/images/subway/Personaje/nina_morena/nina_morena_corriendo.mp4',
    jump: 'assets/images/subway/Personaje/nina_morena/nina_morena_saltando.mp4',
    slide: 'assets/images/subway/Personaje/nina_morena/nina_morena_deslizandose.png' // <-- Imagen PNG
  }
};

export class SubwaySurfersScene extends Phaser.Scene {
  constructor() {
    super('SubwaySurfersScene');
    this.player = null;
    this.lanes = [-TRACK_CONFIG.laneSpacing, 0, TRACK_CONFIG.laneSpacing];
    this.currentLane = 1;
    this.isJumping = false;
    this.isSliding = false;
    this.gameSpeed = 2.0;
    this.score = 0;
    this.isGameOver = false;
    this.nextDifficultyScore = 500;
    this.spawnDelay = 2000;

    // ── Estado anterior del backend ──
    // Solo actuamos cuando el estado CAMBIA, no cada frame
    this._lastCarril = 'CENTER';
    this._lastAccion = 'IDLE';

    this._lastLaneChange = 0;
    this._laneCooldown = 400; //Cooldown para camios entre carriles

    // Referencia al listener para poder quitarlo en cleanup
    this._wsHandler = null;
  }

  preload() {
    this.load.image('background_mall', 'assets/images/subway/Escenarios/scenario_base.png');
    this.load.video('intro_calle', 'assets/images/subway/Escenarios/INTRO CALLE.mp4', 'loadeddata', false, true);
    this.load.video('loop_calle', 'assets/images/subway/Escenarios/ESCENARIO CALLE.mp4', 'loadeddata', false, true);
    this.load.video('intro_piso1', 'assets/images/subway/Escenarios/INTRO PRIMER PISO CC.mp4', 'loadeddata', false, true);
    this.load.video('loop_piso1', 'assets/images/subway/Escenarios/ESCENARIO PRIMER PISO CC.mp4', 'loadeddata', false, true);
    this.load.video('intro_piso2', 'assets/images/subway/Escenarios/INTRO SEGUNDO PISO CC.mp4', 'loadeddata', false, true);
    this.load.video('loop_piso2', 'assets/images/subway/Escenarios/ESCENARIO SEGUNDO PISO CC.mp4', 'loadeddata', false, true);
    this.load.video('intro_piso3', 'assets/images/subway/Escenarios/INTRO TERCER PISO CC.mp4', 'loadeddata', false, true);
    this.load.video('loop_piso3', 'assets/images/subway/Escenarios/ESCENARIO TERCER PISO CC.mp4', 'loadeddata', false, true);

    const selectedChar = this.registry.get('personajeId') || 'NB1';
    const videos = CHARACTER_VIDEOS[selectedChar] || CHARACTER_VIDEOS.NB1;

    // Video para correr / idle
    if (videos.run) {
      this.load.video('player', `${videos.run}?v=${Date.now()}`);
    }

    // Video o Imagen de salto (condicional según disponibilidad)
    if (videos.jump) {
      if (videos.jump.endsWith('.png') || videos.jump.endsWith('.jpg') || videos.jump.endsWith('.jpeg')) {
        this.load.image('player_jump_img', `${videos.jump}?v=${Date.now()}`);
      } else {
        this.load.video('player_jump', `${videos.jump}?v=${Date.now()}`);
      }
    }

    // Video o Imagen de deslizamiento (condicional según disponibilidad)
    if (videos.slide) {
      if (videos.slide.endsWith('.png') || videos.slide.endsWith('.jpg') || videos.slide.endsWith('.jpeg')) {
        this.load.image('player_slide_img', `${videos.slide}?v=${Date.now()}`);
      } else {
        this.load.video('player_slide', `${videos.slide}?v=${Date.now()}`);
      }
    }

    this.load.image('logo_game', 'assets/images/subway/image26.png');
    this.load.image('obs_castle', 'assets/images/subway/image74.png');
    this.load.image('obs_rainbow', 'assets/images/subway/image27.png');
    this.load.image('obs_valla', 'assets/images/subway/Obstaculos/image73.png');
    this.load.image('sun', 'assets/images/subway/Potenciadores/image64.png');
    this.load.image('potenciador_60', 'assets/images/subway/Potenciadores/image60.png');
    this.load.image('potenciador_75', 'assets/images/subway/Potenciadores/image75.png');
    this.load.image('fire', 'https://labs.phaser.io/assets/particles/muzzleflash3.png');
  }

  create() {
    const { width, height } = this.scale;
    this.isGameOver = false;
    this.score = 0;
    this.gameSpeed = 2.0;
    this.currentLane = 1;
    this.spawnDelay = 2000;
    this._isRestarting = false;
    this.isInvincible = false;
    this.isDoublePoints = false;
    this.isJumping = false;
    this.isSliding = false;
    this.obstacles = null;
    this.collectibles = null;
    this._lastLaneChange = 0;

    // ── Resetear estado del backend al reiniciar ──
    this._lastCarril = 'CENTER';
    this._lastAccion = 'IDLE';

    // ── Escuchar mensajes del backend ──
    this._wsHandler = this._handleWS.bind(this);
    window.addEventListener('ws-message', this._wsHandler);

    // Estado de Escenarios
    this.currentScenarioIndex = 0;
    this.isIntroPlaying = true;
    this.introCountdown = 3;

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this._createUI();

    this.bgVideo = this.add.video(width / 2, height / 2, SCENARIOS[this.currentScenarioIndex].intro)
      .setDepth(0);
    this.bgVideo.setMute(true);
    this.bgVideo.on('play', () => {
      if (this.bgVideo.width > 0 && this.bgVideo.height > 0) {
        const scaleX = width / this.bgVideo.width;
        const scaleY = height / this.bgVideo.height;
        this.bgVideo.setScale(Math.max(scaleX, scaleY));
      }
    });
    this.bgVideo.play();

    if (this.introTimerEvent) this.introTimerEvent.destroy();
    this.introTimerEvent = this.time.delayedCall(3000, () => this._finishIntro());

    this.countdownText = this.add.text(width / 2, height / 2, '3', {
      fontSize: '180px', color: '#ffffff', stroke: '#fa804f',
      strokeThickness: 18, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(200);

    this.levelCompleteText = this.add.text(width / 2, height / 2 - 200,
      '¡NIVEL SUPERADO!\n¡Pasemos al siguiente nivel!', {
      fontSize: '60px', color: '#ffffff', stroke: '#3dc9a1',
      strokeThickness: 10, fontStyle: 'bold', align: 'center'
    }
    ).setOrigin(0.5).setDepth(200).setVisible(false);

    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isIntroPlaying && this.introCountdown > 1) {
          this.introCountdown--;
          this.countdownText.setText(this.introCountdown);
        }
      },
      loop: true
    });

    this.background = this.add.image(width / 2, height / 2, 'background_mall')
      .setDisplaySize(width, height).setDepth(-1).setVisible(false);

    this.trackGraphics = this.add.graphics().setDepth(1);
    this._drawStaticTrack();

    // Guardar referencia al personaje seleccionado para su uso posterior
    const selectedChar = this.registry.get('personajeId') || 'NB1';
    this.selectedChar = selectedChar;
    const runConfig = RUN_CONFIGS[selectedChar] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };

    const initialPlayerX = this._getPlayerXForLane(this.currentLane);
    this.playerContainer = this.add.container(initialPlayerX, height - 100);
    this.jumpContainer = this.add.container(0, 0);
    this.playerContainer.add(this.jumpContainer);

    this.player = this.add.video(0, 0, 'player').setOrigin(0.5, 1);
    this.player.setMute(true);
    this.player.addMarker('run', 1, 5);
    this.player.playMarker('run', true);
    this.jumpContainer.add(this.player);

    const videos = CHARACTER_VIDEOS[selectedChar] || CHARACTER_VIDEOS.NB1;
    const needsRunChroma = videos.run && videos.run.endsWith('.mp4');

    if (needsRunChroma) {
      if (this.textures.exists('run_chroma_texture')) {
        this.textures.remove('run_chroma_texture');
      }
      this.runCanvas = this.textures.createCanvas('run_chroma_texture', 300, 300);
      this.playerRunImg = this.add.image(runConfig.xOffset || 0, runConfig.yOffset || 0, 'run_chroma_texture').setOrigin(0.5, 1);
      this.jumpContainer.add(this.playerRunImg);
      this.player.setVisible(false);
    } else {
      this.runCanvas = null;
      this.playerRunImg = null;
      this.player.setScale(runConfig.scale);
      this.player.x = runConfig.xOffset || 0;
      this.player.y = runConfig.yOffset || 0;
      this.player.setVisible(true);
    }

    // Inicializar video de salto si se precargó (se mantiene invisible de fondo)
    if (this.cache.video.exists('player_jump')) {
      this.playerJump = this.add.video(0, 0, 'player_jump');
      this.playerJump.setMute(true);
      this.playerJump.setVisible(false);
    } else {
      this.playerJump = null;
    }

    // Crear canvas texture para croma en tiempo real y el objeto de imagen correspondiente para deslizamiento
    if (this.textures.exists('slide_chroma_texture')) {
      this.textures.remove('slide_chroma_texture');
    }
    this.slideCanvas = this.textures.createCanvas('slide_chroma_texture', 300, 300);
    this.playerSlideImg = this.add.image(0, 0, 'slide_chroma_texture').setOrigin(0.5, 1);
    this.playerSlideImg.setVisible(false);
    this.jumpContainer.add(this.playerSlideImg);

    // Crear canvas texture para croma en tiempo real y el objeto de imagen correspondiente para salto
    if (this.textures.exists('jump_chroma_texture')) {
      this.textures.remove('jump_chroma_texture');
    }
    this.jumpCanvas = this.textures.createCanvas('jump_chroma_texture', 300, 300);
    this.playerJumpImg = this.add.image(0, 0, 'jump_chroma_texture').setOrigin(0.5, 1);
    this.playerJumpImg.setVisible(false);
    this.jumpContainer.add(this.playerJumpImg);

    // Inicializar video de deslizamiento si se precargó (se mantiene invisible de fondo)
    if (this.cache.video.exists('player_slide')) {
      this.playerSlide = this.add.video(0, 0, 'player_slide');
      this.playerSlide.setMute(true);
      this.playerSlide.setVisible(false);
    } else {
      this.playerSlide = null;
    }

    this.playerContainer.setDepth(50);
    this.playerContainer.setVisible(false);

    const bounceTarget = this.playerRunImg || this.player;
    this.runBounceTween = this.tweens.add({
      targets: bounceTarget, y: (runConfig.yOffset || 0) - 10, duration: 200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.image(width - 250, 100, 'logo_game').setScale(0.4).setDepth(100);

    this.sideDecorations = this.add.group();
    this.time.addEvent({ delay: 1500, callback: () => this._spawnSideDecoration(), loop: true });

    this.speedLines = this.add.group();
    this.time.addEvent({ delay: 100, callback: () => this._spawnSpeedLine(), loop: true });

    this._startSpawnTimer();
    this.timeScoreTimer = this.time.addEvent({ delay: 500, callback: () => this._updateScore(), loop: true });

    this.floorStrips = this.add.group();
    this.time.addEvent({ delay: 200, callback: () => this._spawnFloorStrip(), loop: true });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture([37, 38, 39, 40]);

    this.holdBtn = null;
    this.holdGraphics = this.add.graphics().setDepth(20000);

    this.events.once('shutdown', () => this._cleanup());
  }

  // ─────────────────────────────────────────
  // WEBSOCKET → ACCIONES DEL JUEGO
  // ─────────────────────────────────────────

  _handleWS(event) {
    const data = event.detail;

    if (data.port !== 8080) return;
    if (data.juego_activo !== 'esquive') return;
    if (!data.esquive) return;
    if (this.isIntroPlaying || this.isGameOver) return;

    const { carril, accion } = data.esquive;

    // ── Carril: solo actuar si cambió Y pasó el cooldown ──
    if (carril && carril !== this._lastCarril) {
      const ahora = Date.now();
      const laneIndex = CARRIL_A_LANE[carril];

      if (
        laneIndex !== undefined &&
        ahora - this._lastLaneChange > this._laneCooldown
      ) {
        this._setLane(laneIndex);
        this._lastLaneChange = ahora;
      }
      this._lastCarril = carril;
    }

    // ── Acción: solo actuar en el flanco de subida ──
    if (accion && accion !== this._lastAccion) {
      if (accion === 'JUMP') this._jump();
      if (accion === 'CROUCH') this._slide();
      this._lastAccion = accion;
    }
  }

  // ─────────────────────────────────────────
  // RESTO DE LA ESCENA — sin cambios
  // ─────────────────────────────────────────

  _updateScore() {
    if (this.isGameOver || this.isIntroPlaying) return;
    this.score += this.isDoublePoints ? 10 : 5;
    this.scoreText.setText(this.score);

    const nextScenarioIndex = this.currentScenarioIndex + 1;
    if (nextScenarioIndex < SCENARIOS.length) {
      const nextScenario = SCENARIOS[nextScenarioIndex];
      if (nextScenario.intro && this.score >= nextScenario.threshold) {
        this._transitionToNextScenario();
      }
    }

    if (this.score >= this.nextDifficultyScore) {
      this.nextDifficultyScore += 1000;
      this.gameSpeed += 0.1;
      this.spawnDelay = Math.max(2000, this.spawnDelay - 100);
      this._startSpawnTimer();
      // this.cameras.main.flash(400, 255, 255, 255, 0.05);
    }
  }

  _finishIntro() {
    if (!this.isIntroPlaying) return;
    const currentScenario = SCENARIOS[this.currentScenarioIndex];
    if (currentScenario.loop) {
      this.bgVideo.changeSource(currentScenario.loop);
      this.bgVideo.setMute(true);
      this.bgVideo.setLoop(true);
      this.bgVideo.play();
    } else {
      this.bgVideo.stop();
      this.bgVideo.setVisible(false);
      if (this.background) this.background.setVisible(true);
    }
    this.isIntroPlaying = false;
    if (this.playerContainer) this.playerContainer.setVisible(true);
    if (this.levelCompleteText) this.levelCompleteText.setVisible(false);
    if (this.countdownText) {
      this.countdownText.setText('¡GO!');
      this.time.delayedCall(1000, () => this.countdownText.setVisible(false));
    }
  }

  _transitionToNextScenario() {
    this.currentScenarioIndex++;
    const currentScenario = SCENARIOS[this.currentScenarioIndex];
    this.isIntroPlaying = true;
    this.introCountdown = 3;
    if (this.playerContainer) this.playerContainer.setVisible(false);

    this.countdownText.setText(this.introCountdown);
    this.countdownText.setVisible(true);

    if (this.levelCompleteText) {
      this.levelCompleteText.setVisible(true).setScale(0);
      this.tweens.add({ targets: this.levelCompleteText, scale: 1, duration: 500, ease: 'Back.easeOut' });
    }

    if (currentScenario.intro) {
      if (this.background) this.background.setVisible(false);
      this.bgVideo.setVisible(true);
      this.bgVideo.changeSource(currentScenario.intro);
      this.bgVideo.setMute(true);
      this.bgVideo.play();
    }

    if (this.introTimerEvent) this.introTimerEvent.destroy();
    this.introTimerEvent = this.time.delayedCall(3000, () => this._finishIntro());

    if (this.obstacles) this.obstacles.clear(true, true);
    if (this.collectibles) this.collectibles.clear(true, true);

    this.cameras.main.flash(500, 255, 255, 255);
  }

  _startSpawnTimer() {
    if (this.spawnTimer) this.spawnTimer.destroy();
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: () => this._spawnCycle(),
      loop: true
    });
  }

  _createUI() {
    const { width } = this.scale;
    this.scoreText = this.add.text(width / 2, 80, '0', {
      fontSize: '110px', color: '#ffffff', stroke: '#9c4eb3', strokeThickness: 10
    }).setOrigin(0.5).setDepth(100);
  }

  _cancelHold() {
    this.holdBtn = null;
    this.holdGraphics.clear();
  }

  update(time, delta) {
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
    if (this.isGameOver) return;

    // Croma en tiempo real para correr/idle del jugador (remueve el fondo negro de la imagen o del video MP4)
    if (!this.isSliding && !this.isJumping && !this._slideDebugMode && !this._jumpDebugMode && this.runCanvas) {
      try {
        let source = null;
        let rawWidth = 300;
        let rawHeight = 300;

        if (this.player && this.player.video) {
          const video = this.player.video;
          if (!video.paused && !video.ended) {
            source = video;
            rawWidth = video.videoWidth || 300;
            rawHeight = video.videoHeight || 300;
          }
        }

        if (source && rawWidth > 0 && rawHeight > 0) {
          // Downscale by DOWNSCALE_FACTOR to avoid CPU bottleneck / performance drops
          const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
          const height = Math.round(rawHeight / DOWNSCALE_FACTOR);

          if (this.runCanvas.width !== width || this.runCanvas.height !== height) {
            this.runCanvas.setSize(width, height);
            if (this.playerRunImg) {
              this.playerRunImg.setSizeToFrame();
            }
          }
          
          const ctx = this.runCanvas.context;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(source, 0, 0, width, height);
          
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          
          const charId = this.selectedChar || 'NB1';
          const config = RUN_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };
          const threshold = config.threshold !== undefined ? config.threshold : 45;
          
          // Eliminar fondo (negro por defecto, o blanco si está configurado)
          if (config.chromaColor === 'white') {
            const minColorVal = 255 - threshold;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              if (r > minColorVal && g > minColorVal && b > minColorVal) {
                data[i+3] = 0; // Hacer transparente
              }
            }
          } else {
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              if (r < threshold && g < threshold && b < threshold) {
                data[i+3] = 0; // Hacer transparente
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          this.runCanvas.update();

          // Compensar la escala por el downscaling del canvas
          const scaleMultiplier = rawWidth / width;
          if (this.playerRunImg) {
            this.playerRunImg.setSizeToFrame();
            this.playerRunImg.setScale(config.scale * scaleMultiplier);
            this.playerRunImg.x = config.xOffset || 0;
            // Solo pisamos la Y si estamos en modo depuración (de lo contrario el bounce tween la controla)
            if (this._runDebugMode) {
              this.playerRunImg.y = config.yOffset;
            }
          }
        }
      } catch (err) {
        console.error('Error al procesar croma de correr en update:', err);
      }
    }

    // Croma en tiempo real para el deslizamiento del jugador (remueve el fondo negro de la imagen o del video MP4)
    if (this.isSliding && this.slideCanvas) {
      try {
        let source = null;
        let rawWidth = 300;
        let rawHeight = 300;

        if (this.playerSlide && this.playerSlide.video) {
          const video = this.playerSlide.video;
          if (!video.paused && !video.ended) {
            source = video;
            rawWidth = video.videoWidth || 300;
            rawHeight = video.videoHeight || 300;
          }
        } else if (this.textures.exists('player_slide_img')) {
          const imgTex = this.textures.get('player_slide_img');
          source = imgTex.getSourceImage();
          rawWidth = source.width || 300;
          rawHeight = source.height || 300;
        }

        if (source && rawWidth > 0 && rawHeight > 0) {
          // Downscale by DOWNSCALE_FACTOR to avoid CPU bottleneck / performance drops
          const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
          const height = Math.round(rawHeight / DOWNSCALE_FACTOR);

          if (this.slideCanvas.width !== width || this.slideCanvas.height !== height) {
            this.slideCanvas.setSize(width, height);
            if (this.playerSlideImg) {
              this.playerSlideImg.setSizeToFrame();
            }
          }
          
          const ctx = this.slideCanvas.context;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(source, 0, 0, width, height);
          
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          
          const charId = this.selectedChar || 'NB1';
          const config = SLIDE_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };
          const threshold = config.threshold !== undefined ? config.threshold : 45;
          
          // Eliminar fondo (negro por defecto, o blanco si está configurado)
          if (config.chromaColor === 'white') {
            const minColorVal = 255 - threshold;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              if (r > minColorVal && g > minColorVal && b > minColorVal) {
                data[i+3] = 0; // Hacer transparente
              }
            }
          } else {
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              if (r < threshold && g < threshold && b < threshold) {
                data[i+3] = 0; // Hacer transparente
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          this.slideCanvas.update();

          // Compensar la escala por el downscaling del canvas
          const scaleMultiplier = rawWidth / width;
          if (this.playerSlideImg) {
            this.playerSlideImg.setSizeToFrame();
            this.playerSlideImg.setScale(config.scale * scaleMultiplier);
            this.playerSlideImg.x = config.xOffset || 0;
            this.playerSlideImg.y = config.yOffset;
          }
        }
      } catch (err) {
        console.error('Error al procesar croma en update:', err);
      }
    }

    // Croma en tiempo real para el salto del jugador (remueve el fondo negro de la imagen o del video MP4)
    if (this.isJumping && this.jumpCanvas) {
      try {
        let source = null;
        let rawWidth = 300;
        let rawHeight = 300;

        if (this.playerJump && this.playerJump.video) {
          const video = this.playerJump.video;
          if (!video.paused && !video.ended) {
            source = video;
            rawWidth = video.videoWidth || 300;
            rawHeight = video.videoHeight || 300;
          }
        } else if (this.textures.exists('player_jump_img')) {
          const imgTex = this.textures.get('player_jump_img');
          source = imgTex.getSourceImage();
          rawWidth = source.width || 300;
          rawHeight = source.height || 300;
        }

        if (source && rawWidth > 0 && rawHeight > 0) {
          // Downscale by DOWNSCALE_FACTOR to avoid CPU bottleneck / performance drops
          const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
          const height = Math.round(rawHeight / DOWNSCALE_FACTOR);

          if (this.jumpCanvas.width !== width || this.jumpCanvas.height !== height) {
            this.jumpCanvas.setSize(width, height);
            if (this.playerJumpImg) {
              this.playerJumpImg.setSizeToFrame();
            }
          }
          
          const ctx = this.jumpCanvas.context;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(source, 0, 0, width, height);
          
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          
          const charId = this.selectedChar || 'NB1';
          const config = JUMP_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };
          const threshold = config.threshold !== undefined ? config.threshold : 45;
          
          // Eliminar fondo (negro por defecto, o blanco si está configurado)
          if (config.chromaColor === 'white') {
            const minColorVal = 255 - threshold;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              if (r > minColorVal && g > minColorVal && b > minColorVal) {
                data[i+3] = 0; // Hacer transparente
              }
            }
          } else {
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              if (r < threshold && g < threshold && b < threshold) {
                data[i+3] = 0; // Hacer transparente
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          this.jumpCanvas.update();

          // Compensar la escala por el downscaling del canvas
          const scaleMultiplier = rawWidth / width;
          if (this.playerJumpImg) {
            this.playerJumpImg.setSizeToFrame();
            this.playerJumpImg.setScale(config.scale * scaleMultiplier);
            this.playerJumpImg.x = config.xOffset || 0;
            this.playerJumpImg.y = config.yOffset;
          }
        }
      } catch (err) {
        console.error('Error al procesar croma de salto en update:', err);
      }
    }

    // Teclas de Depuración interactiva para Ajustar el Correr/Deslizamiento/Salto en tiempo real
    if (!this._debugKeys) {
      this._debugKeys = {
        P: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
        Z: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
        X: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
        C: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
        I: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
        K: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
        O: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
        L: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
        U: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
        J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
        T: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T),
        G: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
      };
    }

    // Toggle modo depura correr (X)
    if (Phaser.Input.Keyboard.JustDown(this._debugKeys.X)) {
      if (this._trackDebugMode) {
        this._trackDebugMode = false;
        if (this.trackGraphics) this.trackGraphics.clear();
      }
      if (this._slideDebugMode) {
        this._slideDebugMode = false;
        if (this.playerSlide) this.playerSlide.stop();
        if (this.playerSlideImg) this.playerSlideImg.setVisible(false);
      }
      if (this._jumpDebugMode) {
        this._jumpDebugMode = false;
        if (this.playerJump) this.playerJump.stop();
        if (this.playerJumpImg) this.playerJumpImg.setVisible(false);
      }
      this._runDebugMode = !this._runDebugMode;
      if (this._runDebugMode) {
        // Pausar bounce tween para calibración exacta
        if (this.runBounceTween) this.runBounceTween.pause();
        this.isSliding = false;
        this.isJumping = false;
        this.player.setVisible(false);
        if (this.playerRunImg) {
          this.playerRunImg.setVisible(true);
        } else {
          this.player.setVisible(true);
        }
        this.player.playMarker('run', true);
        // Pausar temporizador de spawn de obstáculos
        if (this.spawnTimer) this.spawnTimer.paused = true;
      } else {
        if (this.spawnTimer) this.spawnTimer.paused = false;
        if (this._debugText) this._debugText.setVisible(false);

        // Reanudar bounce tween actualizando los offsets del target
        const activeTarget = this.playerRunImg || this.player;
        const charId = this.selectedChar || 'NB1';
        const config = RUN_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };
        if (this.runBounceTween) {
          this.runBounceTween.stop();
          this.runBounceTween = this.tweens.add({
            targets: activeTarget,
            y: (config.yOffset || 0) - 10,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
    }

    // Toggle modo depura deslizamiento (P)
    if (Phaser.Input.Keyboard.JustDown(this._debugKeys.P)) {
      if (this._trackDebugMode) {
        this._trackDebugMode = false;
        if (this.trackGraphics) this.trackGraphics.clear();
      }
      if (this._runDebugMode) {
        this._runDebugMode = false;
        if (this.runBounceTween) {
          const activeTarget = this.playerRunImg || this.player;
          const charId = this.selectedChar || 'NB1';
          const config = RUN_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0 };
          this.runBounceTween.stop();
          this.runBounceTween = this.tweens.add({
            targets: activeTarget,
            y: (config.yOffset || 0) - 10,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
      if (this._jumpDebugMode) {
        this._jumpDebugMode = false;
        if (this.playerJump) this.playerJump.stop();
        if (this.playerJumpImg) this.playerJumpImg.setVisible(false);
      }
      this._slideDebugMode = !this._slideDebugMode;
      if (this._slideDebugMode) {
        this.isSliding = true;
        this.player.setVisible(false);
        if (this.playerRunImg) this.playerRunImg.setVisible(false);
        this.player.stop();
        if (this.playerSlide) {
          this.playerSlide.setLoop(true);
          this.playerSlide.play(true);
        }
        if (this.playerSlideImg) {
          this.playerSlideImg.setVisible(true);
        }
        // Pausar temporizador de spawn de obstáculos
        if (this.spawnTimer) this.spawnTimer.paused = true;
      } else {
        this.isSliding = false;
        if (this.playerSlide) {
          this.playerSlide.stop();
        }
        if (this.playerSlideImg) {
          this.playerSlideImg.setVisible(false);
        }
        if (this.playerRunImg) {
          this.playerRunImg.setVisible(true);
        } else {
          this.player.setVisible(true);
        }
        this.player.playMarker('run', true);
        if (this.spawnTimer) this.spawnTimer.paused = false;
        if (this._debugText) this._debugText.setVisible(false);
      }
    }

    // Toggle modo depura salto (Z)
    if (Phaser.Input.Keyboard.JustDown(this._debugKeys.Z)) {
      if (this._trackDebugMode) {
        this._trackDebugMode = false;
        if (this.trackGraphics) this.trackGraphics.clear();
      }
      if (this._runDebugMode) {
        this._runDebugMode = false;
        if (this.runBounceTween) {
          const activeTarget = this.playerRunImg || this.player;
          const charId = this.selectedChar || 'NB1';
          const config = RUN_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0 };
          this.runBounceTween.stop();
          this.runBounceTween = this.tweens.add({
            targets: activeTarget,
            y: (config.yOffset || 0) - 10,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
      if (this._slideDebugMode) {
        this._slideDebugMode = false;
        if (this.playerSlide) this.playerSlide.stop();
        if (this.playerSlideImg) this.playerSlideImg.setVisible(false);
      }
      this._jumpDebugMode = !this._jumpDebugMode;
      if (this._jumpDebugMode) {
        this.isJumping = true;
        this.player.setVisible(false);
        if (this.playerRunImg) this.playerRunImg.setVisible(false);
        this.player.stop();
        if (this.playerJump) {
          this.playerJump.setLoop(true);
          this.playerJump.play(true);
        }
        if (this.playerJumpImg) {
          this.playerJumpImg.setVisible(true);
        }
        // Pausar temporizador de spawn de obstáculos
        if (this.spawnTimer) this.spawnTimer.paused = true;
      } else {
        this.isJumping = false;
        if (this.playerJump) {
          this.playerJump.stop();
        }
        if (this.playerJumpImg) {
          this.playerJumpImg.setVisible(false);
        }
        if (this.playerRunImg) {
          this.playerRunImg.setVisible(true);
        } else {
          this.player.setVisible(true);
        }
        this.player.playMarker('run', true);
        if (this.spawnTimer) this.spawnTimer.paused = false;
        if (this._debugText) this._debugText.setVisible(false);
      }
    }

    if (this._runDebugMode) {
      const charId = this.selectedChar || 'NB1';
      const config = RUN_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };

      if (this._debugKeys.I.isDown) {
        config.yOffset -= 1;
      }
      if (this._debugKeys.K.isDown) {
        config.yOffset += 1;
      }
      if (this._debugKeys.O.isDown) {
        config.scale += 0.002;
      }
      if (this._debugKeys.L.isDown) {
        config.scale -= 0.002;
      }
      if (this._debugKeys.U.isDown) {
        config.xOffset = (config.xOffset || 0) - 1;
      }
      if (this._debugKeys.J.isDown) {
        config.xOffset = (config.xOffset || 0) + 1;
      }
      if (this._debugKeys.T.isDown) {
        config.threshold = Math.min(255, (config.threshold || 0) + 1);
      }
      if (this._debugKeys.G.isDown) {
        config.threshold = Math.max(0, (config.threshold || 0) - 1);
      }

      if (this.playerRunImg) {
        let scaleMultiplier = DOWNSCALE_FACTOR;
        if (this.player && this.player.video) {
          const video = this.player.video;
          const rawWidth = video.videoWidth || 300;
          const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
          scaleMultiplier = rawWidth / width;
        }
        this.playerRunImg.setSizeToFrame();
        this.playerRunImg.setScale(config.scale * scaleMultiplier);
        this.playerRunImg.x = config.xOffset || 0;
        this.playerRunImg.y = config.yOffset;
      } else {
        this.player.setScale(config.scale);
        this.player.x = config.xOffset || 0;
        this.player.y = config.yOffset;
      }

      if (!this._debugText) {
        this._debugText = this.add.text(this.scale.width / 2, 250, '', {
          fontSize: '24px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.85)',
          padding: { x: 15, y: 10 }, align: 'center', stroke: '#ffff00', strokeThickness: 2,
          fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(3000);
      }
      this._debugText.setVisible(true);
      this._debugText.setText(
        `🛠️ MODO DEPURA CORRER 🛠️\n\n` +
        `Mantén presionadas las teclas:\n` +
        `• I / K : Subir / Bajar (yOffset: ${config.yOffset.toFixed(0)})\n` +
        `• U / J : Izquierda / Derecha (xOffset: ${(config.xOffset || 0).toFixed(0)})\n` +
        `• O / L : Agrandar / Achicar (scale: ${config.scale.toFixed(3)})\n` +
        `• T / G : Umbral Croma (threshold: ${(config.threshold || 0).toFixed(0)})\n\n` +
        `Copia y pega esto en RUN_CONFIGS.${charId}:\n` +
        `{ scale: ${config.scale.toFixed(3)}, xOffset: ${config.xOffset.toFixed(0)}, yOffset: ${config.yOffset.toFixed(0)}, threshold: ${config.threshold.toFixed(0)} }\n\n` +
        `Presiona 'X' para salir del modo depuración`
      );
    }

    if (this._slideDebugMode) {
      const charId = this.selectedChar || 'NB1';
      const config = SLIDE_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };

      if (this._debugKeys.I.isDown) {
        config.yOffset -= 1;
      }
      if (this._debugKeys.K.isDown) {
        config.yOffset += 1;
      }
      if (this._debugKeys.O.isDown) {
        config.scale += 0.002;
      }
      if (this._debugKeys.L.isDown) {
        config.scale -= 0.002;
      }
      if (this._debugKeys.U.isDown) {
        config.xOffset = (config.xOffset || 0) - 1;
      }
      if (this._debugKeys.J.isDown) {
        config.xOffset = (config.xOffset || 0) + 1;
      }
      if (this._debugKeys.T.isDown) {
        config.threshold = Math.min(255, (config.threshold || 0) + 1);
      }
      if (this._debugKeys.G.isDown) {
        config.threshold = Math.max(0, (config.threshold || 0) - 1);
      }

      if (this.playerSlideImg) {
        let scaleMultiplier = DOWNSCALE_FACTOR;
        if (this.playerSlide && this.playerSlide.video) {
          const video = this.playerSlide.video;
          const rawWidth = video.videoWidth || 300;
          const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
          scaleMultiplier = rawWidth / width;
        } else if (this.textures.exists('player_slide_img')) {
          const imgTex = this.textures.get('player_slide_img');
          const source = imgTex.getSourceImage();
          if (source) {
            const rawWidth = source.width || 300;
            const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
            scaleMultiplier = rawWidth / width;
          }
        }
        this.playerSlideImg.setSizeToFrame();
        this.playerSlideImg.setScale(config.scale * scaleMultiplier);
        this.playerSlideImg.x = config.xOffset || 0;
        this.playerSlideImg.y = config.yOffset;
      }

      if (!this._debugText) {
        this._debugText = this.add.text(this.scale.width / 2, 250, '', {
          fontSize: '24px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.85)',
          padding: { x: 15, y: 10 }, align: 'center', stroke: '#00ff00', strokeThickness: 2,
          fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(3000);
      }
      this._debugText.setVisible(true);
      this._debugText.setText(
        `🛠️ MODO DEPURA DESLIZAMIENTO 🛠️\n\n` +
        `Mantén presionadas las teclas:\n` +
        `• I / K : Subir / Bajar (yOffset: ${config.yOffset.toFixed(0)})\n` +
        `• U / J : Izquierda / Derecha (xOffset: ${(config.xOffset || 0).toFixed(0)})\n` +
        `• O / L : Agrandar / Achicar (scale: ${config.scale.toFixed(3)})\n` +
        `• T / G : Umbral Croma (threshold: ${(config.threshold || 0).toFixed(0)})\n\n` +
        `Copia y pega esto en SLIDE_CONFIGS.${charId}:\n` +
        `{ scale: ${config.scale.toFixed(3)}, xOffset: ${config.xOffset.toFixed(0)}, yOffset: ${config.yOffset.toFixed(0)}, threshold: ${config.threshold.toFixed(0)} }\n\n` +
        `Presiona 'P' para salir del modo depuración`
      );
    }

    if (this._jumpDebugMode) {
      const charId = this.selectedChar || 'NB1';
      const config = JUMP_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0, threshold: 45 };

      if (this._debugKeys.I.isDown) {
        config.yOffset -= 1;
      }
      if (this._debugKeys.K.isDown) {
        config.yOffset += 1;
      }
      if (this._debugKeys.O.isDown) {
        config.scale += 0.002;
      }
      if (this._debugKeys.L.isDown) {
        config.scale -= 0.002;
      }
      if (this._debugKeys.U.isDown) {
        config.xOffset = (config.xOffset || 0) - 1;
      }
      if (this._debugKeys.J.isDown) {
        config.xOffset = (config.xOffset || 0) + 1;
      }
      if (this._debugKeys.T.isDown) {
        config.threshold = Math.min(255, (config.threshold || 0) + 1);
      }
      if (this._debugKeys.G.isDown) {
        config.threshold = Math.max(0, (config.threshold || 0) - 1);
      }

      if (this.playerJumpImg) {
        let scaleMultiplier = DOWNSCALE_FACTOR;
        if (this.playerJump && this.playerJump.video) {
          const video = this.playerJump.video;
          const rawWidth = video.videoWidth || 300;
          const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
          scaleMultiplier = rawWidth / width;
        } else if (this.textures.exists('player_jump_img')) {
          const imgTex = this.textures.get('player_jump_img');
          const source = imgTex.getSourceImage();
          if (source) {
            const rawWidth = source.width || 300;
            const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
            scaleMultiplier = rawWidth / width;
          }
        }
        this.playerJumpImg.setSizeToFrame();
        this.playerJumpImg.setScale(config.scale * scaleMultiplier);
        this.playerJumpImg.x = config.xOffset || 0;
        this.playerJumpImg.y = config.yOffset;
      }

      if (!this._debugText) {
        this._debugText = this.add.text(this.scale.width / 2, 250, '', {
          fontSize: '24px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.85)',
          padding: { x: 15, y: 10 }, align: 'center', stroke: '#00ffff', strokeThickness: 2,
          fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(3000);
      }
      this._debugText.setVisible(true);
      this._debugText.setText(
        `🛠️ MODO DEPURA SALTO 🛠️\n\n` +
        `Mantén presionadas las teclas:\n` +
        `• I / K : Subir / Bajar (yOffset: ${config.yOffset.toFixed(0)})\n` +
        `• U / J : Izquierda / Derecha (xOffset: ${(config.xOffset || 0).toFixed(0)})\n` +
        `• O / L : Agrandar / Achicar (scale: ${config.scale.toFixed(3)})\n` +
        `• T / G : Umbral Croma (threshold: ${(config.threshold || 0).toFixed(0)})\n\n` +
        `Copia y pega esto en JUMP_CONFIGS.${charId}:\n` +
        `{ scale: ${config.scale.toFixed(3)}, xOffset: ${config.xOffset.toFixed(0)}, yOffset: ${config.yOffset.toFixed(0)}, threshold: ${config.threshold.toFixed(0)} }\n\n` +
        `Presiona 'Z' para salir del modo depuración`
      );
    }

    // Toggle modo depura pista (C)
    if (Phaser.Input.Keyboard.JustDown(this._debugKeys.C)) {
      if (this._runDebugMode) {
        this._runDebugMode = false;
        if (this.runBounceTween) this.runBounceTween.play();
      }
      if (this._slideDebugMode) {
        this._slideDebugMode = false;
        if (this.playerSlide) this.playerSlide.stop();
        if (this.playerSlideImg) this.playerSlideImg.setVisible(false);
      }
      if (this._jumpDebugMode) {
        this._jumpDebugMode = false;
        if (this.playerJump) this.playerJump.stop();
        if (this.playerJumpImg) this.playerJumpImg.setVisible(false);
      }
      this._trackDebugMode = !this._trackDebugMode;
      if (this._trackDebugMode) {
        if (this.spawnTimer) this.spawnTimer.paused = true;
      } else {
        if (this.spawnTimer) this.spawnTimer.paused = false;
        if (this._debugText) this._debugText.setVisible(false);
        if (this.trackGraphics) this.trackGraphics.clear();
      }
    }

    if (this._trackDebugMode) {
      if (this._debugKeys.U.isDown) {
        TRACK_CONFIG.centerXOffset -= 1;
      }
      if (this._debugKeys.J.isDown) {
        TRACK_CONFIG.centerXOffset += 1;
      }
      if (this._debugKeys.I.isDown) {
        TRACK_CONFIG.vanishingPointXOffset -= 1;
      }
      if (this._debugKeys.K.isDown) {
        TRACK_CONFIG.vanishingPointXOffset += 1;
      }
      if (this._debugKeys.O.isDown) {
        TRACK_CONFIG.laneSpacing += 1;
      }
      if (this._debugKeys.L.isDown) {
        TRACK_CONFIG.laneSpacing = Math.max(50, TRACK_CONFIG.laneSpacing - 1);
      }
      if (this._debugKeys.T.isDown) {
        TRACK_CONFIG.horizonYFactor = Math.min(1.0, TRACK_CONFIG.horizonYFactor + 0.002);
      }
      if (this._debugKeys.G.isDown) {
        TRACK_CONFIG.horizonYFactor = Math.max(0.2, TRACK_CONFIG.horizonYFactor - 0.002);
      }

      // Sincronizar this.lanes
      this.lanes = [-TRACK_CONFIG.laneSpacing, 0, TRACK_CONFIG.laneSpacing];

      // Actualizar posición del playerContainer inmediatamente
      if (this.playerContainer) {
        this.playerContainer.x = this._getPlayerXForLane(this.currentLane);
      }

      if (!this._debugText) {
        this._debugText = this.add.text(this.scale.width / 2, 250, '', {
          fontSize: '24px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.85)',
          padding: { x: 15, y: 10 }, align: 'center', stroke: '#ff00ff', strokeThickness: 2,
          fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(3000);
      }
      this._debugText.setVisible(true);
      this._debugText.setText(
        `🛠️ MODO DEPURA PISTA / CARRILES 🛠️\n\n` +
        `Mantén presionadas las teclas:\n` +
        `• U / J : Mover Centro de Pista (centerXOffset: ${TRACK_CONFIG.centerXOffset.toFixed(0)})\n` +
        `• I / K : Mover Punto de Fuga / Horizonte (vanishingPointXOffset: ${TRACK_CONFIG.vanishingPointXOffset.toFixed(0)})\n` +
        `• O / L : Ajustar Ancho de Carriles (laneSpacing: ${TRACK_CONFIG.laneSpacing.toFixed(0)})\n` +
        `• T / G : Mover Altura del Horizonte (horizonYFactor: ${TRACK_CONFIG.horizonYFactor.toFixed(3)})\n\n` +
        `Copia y pega esto al inicio de SubwaySurfersScene.js en TRACK_CONFIG:\n` +
        `const TRACK_CONFIG = {\n` +
        `  centerXOffset: ${TRACK_CONFIG.centerXOffset.toFixed(0)},\n` +
        `  laneSpacing: ${TRACK_CONFIG.laneSpacing.toFixed(0)},\n` +
        `  vanishingPointXOffset: ${TRACK_CONFIG.vanishingPointXOffset.toFixed(0)},\n` +
        `  horizonYFactor: ${TRACK_CONFIG.horizonYFactor.toFixed(3)}\n` +
        `};\n\n` +
        `Presiona 'C' para salir del modo depuración`
      );
    }

    // Teclado — sigue funcionando en paralelo al backend
    if (!this.isIntroPlaying && !this._slideDebugMode && !this._jumpDebugMode && !this._runDebugMode && !this._trackDebugMode) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this._setLane(Math.max(0, this.currentLane - 1));
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this._setLane(Math.min(2, this.currentLane + 1));
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this._jump();
      if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this._slide();
    }

    const horizonY = this.scale.height * TRACK_CONFIG.horizonYFactor;
    const floatY = (this.scale.height / 2) + Math.sin(this.time.now * 0.01) * 2;
    this.bgVideo.y = floatY;
    if (this.background && this.background.visible) this.background.y = floatY;

    this._drawDynamicTrack();

    this.floorStrips.getChildren().forEach(strip => {
      strip.y += this.gameSpeed * 1.5;
      const progress = (strip.y - horizonY) / (this.scale.height - horizonY);
      
      const relativeOffset = (strip.lane - 1) * TRACK_CONFIG.laneSpacing;
      const startX = this.scale.width / 2 + TRACK_CONFIG.vanishingPointXOffset;
      const targetX = this.scale.width / 2 + TRACK_CONFIG.centerXOffset + relativeOffset;
      
      strip.x = Phaser.Math.Linear(startX, targetX, progress);
      strip.scaleX = 0.1 + progress * 2;
      strip.alpha = Phaser.Math.Clamp(progress * 2, 0, 0.4);
      if (strip.y > this.scale.height + 100) strip.destroy();
    });

    this.sideDecorations.getChildren().forEach(dec => {
      dec.y += this.gameSpeed * 1.5;
      const progress = (dec.y - horizonY) / (this.scale.height - horizonY);
      const sideFactor = dec.side === 'left' ? -1 : 1;
      const startX = this.scale.width / 2 + (sideFactor * 20);
      const targetX = this.scale.width / 2 + (sideFactor * 800);
      dec.x = Phaser.Math.Linear(startX, targetX, progress);
      dec.setScale(0.01 + progress * 1.5);
      dec.alpha = Phaser.Math.Clamp(progress * 4, 0, 1);
      if (dec.y > this.scale.height + 200) dec.destroy();
    });

    this.speedLines.getChildren().forEach(line => {
      line.y += this.gameSpeed * 2;
      line.alpha -= 0.02;
      if (line.y > this.scale.height || line.alpha <= 0) line.destroy();
    });

    const objs = [];
    if (this.obstacles) objs.push(...this.obstacles.getChildren());
    if (this.collectibles) objs.push(...this.collectibles.getChildren());

    objs.forEach(obj => {
      obj.y += this.gameSpeed;
      const progress = (obj.y - horizonY) / (this.scale.height - horizonY);
      
      const relativeOffset = (obj.lane - 1) * TRACK_CONFIG.laneSpacing;
      const startX = this.scale.width / 2 + TRACK_CONFIG.vanishingPointXOffset;
      const targetX = this.scale.width / 2 + TRACK_CONFIG.centerXOffset + relativeOffset;
      
      obj.x = Phaser.Math.Linear(startX, targetX, progress);
      obj.setDisplaySize(200 * progress, 200 * progress);
      obj.setAlpha(Phaser.Math.Clamp(progress * 4, 0, 1));
      obj.setDepth(20);
      if (obj.y > this.scale.height + 200) obj.destroy();

      const playerY = this.playerContainer.y;
      const verticalDist = Math.abs(obj.y - playerY);
      if (verticalDist < 50 && obj.lane === this.currentLane) {
        if (this.obstacles && this.obstacles.contains(obj)) {
          if (!this.isJumping && !this._slideDebugMode && !this._jumpDebugMode && !this.isInvincible) this._gameOver();
        } else {
          this._collectSun(obj);
        }
      }
    });
  }

  _spawnCycle() {
    if (this.isGameOver || this.isIntroPlaying) return;
    const lane = Phaser.Math.Between(0, 2);
    if (Phaser.Math.Between(0, 10) > 4) this._spawnObstacle(lane);
    else this._spawnCollectible(lane);
  }

  _spawnObstacle(lane) {
    if (!this.obstacles) this.obstacles = this.add.group();
    const obs = this.add.sprite(this.scale.width / 2, this.scale.height * 0.45, 'obs_valla');
    obs.lane = lane;
    obs.setOrigin(0.5, 1);
    this.obstacles.add(obs);
  }

  _spawnCollectible(lane) {
    if (!this.collectibles) this.collectibles = this.add.group();
    
    // Probabilidades
    const rand = Phaser.Math.Between(1, 100);
    let key = 'sun';
    if (rand <= 15) { // 15% Estrella (invencibilidad) - medio frecuente
      key = 'potenciador_75';
    } else if (rand <= 45) { // 30% Arcoiris (puntos x2) - frecuente
      key = 'potenciador_60';
    }

    const item = this.add.sprite(this.scale.width / 2, this.scale.height * 0.45, key);
    item.lane = lane;
    item.setOrigin(0.5, 1);
    this.collectibles.add(item);
  }

  _getPlayerXForLane(lane) {
    const horizonY = this.scale.height * TRACK_CONFIG.horizonYFactor;
    const playerY = this.scale.height - 100;
    const progress = (playerY - horizonY) / (this.scale.height - horizonY);
    
    const relativeOffset = (lane - 1) * TRACK_CONFIG.laneSpacing;
    const startX = this.scale.width / 2 + TRACK_CONFIG.vanishingPointXOffset;
    const targetX = this.scale.width / 2 + TRACK_CONFIG.centerXOffset + relativeOffset;
    
    return Phaser.Math.Linear(startX, targetX, progress);
  }

  _setLane(lane) {
    if (this.currentLane === lane) return;
    this.currentLane = lane;
    this.tweens.add({
      targets: this.playerContainer,
      x: this._getPlayerXForLane(lane),
      duration: 150,
      ease: 'Power2'
    });
  }

  _jump() {
    if (this.isJumping || this.isSliding) return;
    this.isJumping = true;

    // Configurar imagen del salto según el personaje
    const charId = this.selectedChar || 'NB1';
    const config = JUMP_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0 };

    // Si tiene video de salto o imagen de salto, pausar video de correr y mostrar/reproducir salto
    if (this.playerJump || this.textures.exists('player_jump_img')) {
      this.player.setVisible(false);
      if (this.playerRunImg) this.playerRunImg.setVisible(false);
      this.player.stop();
      
      if (this.playerJumpImg) {
        let scaleMultiplier = DOWNSCALE_FACTOR;
        let source = null;
        if (this.playerJump && this.playerJump.video) {
          source = this.playerJump.video;
        } else if (this.textures.exists('player_jump_img')) {
          source = this.textures.get('player_jump_img').getSourceImage();
        }
        if (source) {
          const rawWidth = source.videoWidth || source.width || 300;
          if (rawWidth > 0) {
            const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
            scaleMultiplier = rawWidth / width;
          }
        }
        this.playerJumpImg.setSizeToFrame();
        this.playerJumpImg.setScale(config.scale * scaleMultiplier);
        this.playerJumpImg.x = config.xOffset || 0;
        this.playerJumpImg.y = config.yOffset;
        this.playerJumpImg.setVisible(true);
      }

      if (this.playerJump) {
        this.playerJump.play(false);
      }
    }

    this.tweens.add({
      targets: this.jumpContainer,
      y: -280,
      duration: 400,
      yoyo: true,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isJumping = false;
        this.jumpContainer.y = 0;

        if (this.playerJump) {
          this.playerJump.stop();
        }
        if (this.playerJumpImg) {
          this.playerJumpImg.setVisible(false);
        }

        // Volver a mostrar y reproducir el video de correr
        if (this.playerRunImg) {
          this.playerRunImg.setVisible(true);
        } else {
          this.player.setVisible(true);
        }
        this.player.playMarker('run', true);
      }
    });
  }

  _slide() {
    if (this.isSliding || this.isJumping) return;
    this.isSliding = true;

    // Configurar imagen del deslizamiento según el personaje
    const charId = this.selectedChar || 'NB1';
    const config = SLIDE_CONFIGS[charId] || { scale: 0.38, xOffset: 0, yOffset: 0 };

    // Si tiene video de deslizamiento o imagen de deslizamiento, pausar video de correr y mostrar/reproducir deslizamiento
    if (this.playerSlide || this.textures.exists('player_slide_img')) {
      this.player.setVisible(false);
      if (this.playerRunImg) this.playerRunImg.setVisible(false);
      this.player.stop();
      
      if (this.playerSlideImg) {
        let scaleMultiplier = DOWNSCALE_FACTOR;
        let source = null;
        if (this.playerSlide && this.playerSlide.video) {
          source = this.playerSlide.video;
        } else if (this.textures.exists('player_slide_img')) {
          source = this.textures.get('player_slide_img').getSourceImage();
        }
        if (source) {
          const rawWidth = source.videoWidth || source.width || 300;
          if (rawWidth > 0) {
            const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
            scaleMultiplier = rawWidth / width;
          }
        }
        this.playerSlideImg.setSizeToFrame();
        this.playerSlideImg.setScale(config.scale * scaleMultiplier);
        this.playerSlideImg.x = config.xOffset || 0;
        this.playerSlideImg.y = config.yOffset;
        this.playerSlideImg.setVisible(true);
      }

      if (this.playerSlide) {
        this.playerSlide.play(false);
      }

      // Duración del video de deslizamiento (aprox 900ms)
      this.time.delayedCall(900, () => {
        this.isSliding = false;
        if (this.playerSlide) {
          this.playerSlide.stop();
        }
        if (this.playerSlideImg) {
          this.playerSlideImg.setVisible(false);
        }
        // Volver a mostrar y reproducir el video de correr
        if (this.playerRunImg) {
          this.playerRunImg.setVisible(true);
        } else {
          this.player.setVisible(true);
        }
        this.player.playMarker('run', true);
      });
    } else {
      // Comportamiento de respaldo (squish del video de correr)
      const targetObj = this.playerRunImg || this.player;
      const originalScaleY = targetObj.scaleY;
      this.tweens.add({
        targets: targetObj,
        scaleY: originalScaleY * 0.15,
        duration: 150,
        yoyo: true,
        hold: 600,
        onComplete: () => {
          this.isSliding = false;
          targetObj.scaleY = originalScaleY;
        }
      });
    }
  }

  _collectSun(obj) {
    obj.destroy();
    
    if (obj.texture.key === 'potenciador_75') {
      // Estrella: Invencibilidad 5 seg
      this.isInvincible = true;
      if (this.invincibleTimer) this.invincibleTimer.destroy();
      this.invincibleTimer = this.time.delayedCall(5000, () => {
        this.isInvincible = false;
      });
      this.scoreText.setText("¡ESCUDO!");
      this.time.delayedCall(1000, () => this.scoreText.setText(this.score));
      
    } else if (obj.texture.key === 'potenciador_60') {
      // Arcoiris: Puntos x2 45 seg
      this.isDoublePoints = true;
      if (this.doublePointsTimer) this.doublePointsTimer.destroy();
      this.doublePointsTimer = this.time.delayedCall(45000, () => {
        this.isDoublePoints = false;
      });
      this.scoreText.setText("¡PUNTOS x2!");
      this.time.delayedCall(1000, () => this.scoreText.setText(this.score));
      
    } else {
      // Sol u otro
      this.score += this.isDoublePoints ? 100 : 50;
      this.scoreText.setText(this.score);
      this.tweens.add({ targets: this.scoreText, scale: 1.2, duration: 100, yoyo: true });
    }
  }

  _cleanup() {
    // Quitar el listener del WebSocket — crítico para evitar memory leaks
    if (this._wsHandler) {
      window.removeEventListener('ws-message', this._wsHandler);
      this._wsHandler = null;
    }
    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.timeScoreTimer) this.timeScoreTimer.destroy();
    if (this.countdownTimer) this.countdownTimer.destroy();
    if (this.introTimerEvent) this.introTimerEvent.destroy();

    // Remover la textura del canvas de croma para evitar colisiones en futuros reinicios
    if (this.textures.exists('slide_chroma_texture')) {
      this.textures.remove('slide_chroma_texture');
    }
    if (this.textures.exists('jump_chroma_texture')) {
      this.textures.remove('jump_chroma_texture');
    }
    if (this.textures.exists('run_chroma_texture')) {
      this.textures.remove('run_chroma_texture');
    }
  }

  _drawStaticTrack() { }
  _drawDynamicTrack() {
    if (!this.trackGraphics) return;
    this.trackGraphics.clear();
    
    // Solo dibujar si estamos en el modo depuración de pista
    if (this._trackDebugMode) {
      const horizonY = this.scale.height * 0.45;
      const bottomY = this.scale.height;
      
      // Dibujar las 3 líneas de los carriles
      for (let lane = 0; lane < 3; lane++) {
        const relativeOffset = (lane - 1) * TRACK_CONFIG.laneSpacing;
        
        // Punto inicial (punto de fuga en horizonte)
        const startX = this.scale.width / 2 + TRACK_CONFIG.vanishingPointXOffset + (relativeOffset * 0.02);
        // Punto final (suelo)
        const targetX = this.scale.width / 2 + TRACK_CONFIG.centerXOffset + relativeOffset;
        
        // Línea central verde, laterales magenta
        this.trackGraphics.lineStyle(6, lane === 1 ? 0x00ff00 : 0xff00ff, 0.8);
        this.trackGraphics.beginPath();
        this.trackGraphics.moveTo(startX, horizonY);
        this.trackGraphics.lineTo(targetX, bottomY);
        this.trackGraphics.strokePath();
        
        // Dibujar un círculo en la posición del jugador para este carril
        const playerY = this.scale.height - 100;
        const progress = (playerY - horizonY) / (this.scale.height - horizonY);
        const playerX = Phaser.Math.Linear(startX, targetX, progress);
        
        this.trackGraphics.fillStyle(lane === this.currentLane ? 0x00ff00 : 0xffff00, 0.7);
        this.trackGraphics.fillCircle(playerX, playerY, 15);
      }
    }
  }
  _spawnFloorStrip() { return; }
  _spawnSideDecoration() { return; }
  _spawnSpeedLine() { return; }

  _gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.cameras.main.shake(600, 0.03);
    const { width, height } = this.scale;

    const panel = this.add.container(width / 2, height / 2).setDepth(200);
    const bg = this.add.rectangle(0, 0, 700, 500, 0x9c4eb3, 0.95).setStrokeStyle(4, 0xffffff);
    panel.add(bg);

    const title = this.add.text(0, -120, '¡FIN DEL JUEGO!', {
      fontSize: '75px', color: '#ffffff', fontWeight: 'bold'
    }).setOrigin(0.5);
    panel.add(title);

    const scoreFinal = this.add.text(0, 10, `PUNTUACIÓN: ${this.score}`, {
      fontSize: '45px', color: '#ffffff'
    }).setOrigin(0.5);
    panel.add(scoreFinal);

    const btn = this.add.text(0, 140, ' REINTENTAR ', {
      fontSize: '40px', color: '#ffffff',
      backgroundColor: '#fa804f',
      padding: { x: 40, y: 20 }, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    panel.add(btn);

    const restartAction = () => {
      if (!this.isGameOver || this._isRestarting) return;
      this._isRestarting = true;
      this.input.off('pointerdown', restartAction);
      this.scene.restart();
    };

    btn.on('pointerdown', (ptr) => {
      this.holdBtn = {
        x: ptr.x, y: ptr.y, duration: 2000, time: 0,
        callback: () => restartAction()
      };
    });
    btn.on('pointerup', () => this._cancelHold());
    btn.on('pointerout', () => this._cancelHold());

    this.time.delayedCall(500, () => {
      if (!this._isRestarting) this.input.on('pointerdown', restartAction);
    });

    panel.setScale(0);
    this.tweens.add({ targets: panel, scale: 1, duration: 500, ease: 'Back.easeOut' });
  }
}