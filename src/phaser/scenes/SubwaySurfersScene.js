import * as Phaser from 'phaser';

const SCENARIOS = [
  {
    id: 'calle',
    intro: 'intro_calle',
    loop: 'loop_calle',
    threshold: 0
  },
  {
    id: 'piso1',
    intro: 'intro_piso1',
    loop: 'loop_piso1',
    threshold: 1000
  },
  {
    id: 'piso2',
    intro: null,
    loop: null,
    threshold: 2500
  },
  {
    id: 'piso3',
    intro: null,
    loop: null,
    threshold: 4000
  }
];

export class SubwaySurfersScene extends Phaser.Scene {
  constructor() {
    super('SubwaySurfersScene');
    this.player = null;
    this.lanes = [-300, 0, 300]; // Alineados con la nueva pista visual
    this.currentLane = 1;
    this.isJumping = false;
    this.isSliding = false;
    this.gameSpeed = 2.0; // Velocidad equilibrada
    this.score = 0;
    this.isGameOver = false;
    this.nextDifficultyScore = 500;
    this.spawnDelay = 2000; // Un obstáculo cada 2 segundos
  }

  preload() {
    // Escenario Base Generado
    this.load.image('background_mall', 'assets/images/subway/scenario_base.png');

    // Videos de Escenarios
    this.load.video('intro_calle', 'assets/images/subway/INTRO CALLE.mp4');
    this.load.video('loop_calle', 'assets/images/subway/ESCENARIO CALLE.mp4');
    this.load.video('intro_piso1', 'assets/images/subway/INTRO PRIMER PISO CC.mp4');
    this.load.video('loop_piso1', 'assets/images/subway/ESCENARIO PRIMER PISO CC.mp4');

    // Assets de marca
    this.load.image('player', 'assets/images/subway/ada.jpeg');
    this.load.image('logo_game', 'assets/images/subway/image26.png');
    this.load.image('obs_castle', 'assets/images/subway/image74.png');
    this.load.image('obs_rainbow', 'assets/images/subway/image27.png');
    this.load.image('obs_valla', 'assets/images/subway/image73.png');
    this.load.image('sun', 'assets/images/subway/image64.png');
    this.load.image('fire', 'https://labs.phaser.io/assets/particles/muzzleflash3.png');
  }

  create() {
    const { width, height } = this.scale;
    this.isGameOver = false;
    this.score = 0;
    this.gameSpeed = 2.0;
    this.currentLane = 1;
    this.spawnDelay = 2000;
    this._isRestarting = false; // MUY IMPORTANTE: reiniciar esta bandera

    // Estado de Escenarios
    this.currentScenarioIndex = 0;
    this.isIntroPlaying = true;
    this.introCountdown = 7;

    // Resetear estados críticos
    this.isJumping = false;
    this.isSliding = false;
    this.obstacles = null;
    this.collectibles = null;

    // 1. Efecto de entrada y UI (Siempre al frente)
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this._createUI();

    // 2. Fondo de Video (Escenarios dinámicos)
    this.bgVideo = this.add.video(width / 2, height / 2, SCENARIOS[this.currentScenarioIndex].intro)
      .setDepth(0);
    this.bgVideo.setMute(true); // Evitar bloqueo de autoplay por el navegador

    // Ajustar escala para cubrir la pantalla (estilo object-fit: cover)
    // Se ejecuta al reproducir para asegurar que el video ya tiene dimensiones
    this.bgVideo.on('play', () => {
      if (this.bgVideo.width > 0 && this.bgVideo.height > 0) {
        const scaleX = width / this.bgVideo.width;
        const scaleY = height / this.bgVideo.height;
        const scale = Math.max(scaleX, scaleY);
        this.bgVideo.setScale(scale);
      }
    });

    this.bgVideo.play();

    // Forzar el final de la intro a los 7 segundos exactos
    if (this.introTimerEvent) this.introTimerEvent.destroy();
    this.introTimerEvent = this.time.delayedCall(7000, () => {
      this._finishIntro();
    });

    // Contador Visual
    this.countdownText = this.add.text(width / 2, height / 2, '7', {
      fontSize: '180px', color: '#ffffff', stroke: '#fa804f', strokeThickness: 18, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(200);

    // Mensaje de Nivel Superado
    this.levelCompleteText = this.add.text(width / 2, height / 2 - 200, '¡NIVEL SUPERADO!\n¡Pasemos al siguiente nivel!', {
      fontSize: '60px', color: '#ffffff', stroke: '#3dc9a1', strokeThickness: 10, fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setDepth(200);
    this.levelCompleteText.setVisible(false);

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



    // Mantener la referencia anterior por si la necesitamos como fallback
    this.background = this.add.image(width / 2, height / 2, 'background_mall')
      .setDisplaySize(width, height)
      .setDepth(-1);
    this.background.setVisible(false);

    // 3. Pista de Carreras (Perspectiva)
    this.trackGraphics = this.add.graphics().setDepth(1);
    this._drawStaticTrack();

    // 3. Personaje y Contenedores
    // Ubicado un poco más abajo para que coincida con el inicio de los carriles
    this.playerContainer = this.add.container(width / 2 + this.lanes[this.currentLane], height - 100);
    this.jumpContainer = this.add.container(0, 0);
    this.playerContainer.add(this.jumpContainer);

    this.player = this.add.sprite(0, 0, 'player').setScale(0.45).setOrigin(0.5, 1);
    this.jumpContainer.add(this.player);
    this.playerContainer.setDepth(50);

    // Animación de correr (bounce)
    this.tweens.add({
      targets: this.player,
      y: -10,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 4. Logo en la esquina
    this.add.image(width - 250, 100, 'logo_game').setScale(0.4).setDepth(100);

    // 5. Decoraciones laterales (Paredes/Edificios que se mueven)
    this.sideDecorations = this.add.group();
    this.time.addEvent({
      delay: 1500, // Menos frecuente aún para no saturar
      callback: () => this._spawnSideDecoration(),
      loop: true
    });

    // 6. Líneas de velocidad
    this.speedLines = this.add.group();
    this.time.addEvent({
      delay: 100,
      callback: () => this._spawnSpeedLine(),
      loop: true
    });

    // 7. Timers
    this._startSpawnTimer();
    this.timeScoreTimer = this.time.addEvent({ delay: 500, callback: () => this._updateScore(), loop: true });

    // 6. Líneas de movimiento en el suelo (para simular avance)
    this.floorStrips = this.add.group();
    this.time.addEvent({
      delay: 200,
      callback: () => this._spawnFloorStrip(),
      loop: true
    });

    // 7. Controles (Máxima compatibilidad)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture([37, 38, 39, 40]); // Prevenir scroll del navegador

    // Sistema de hold
    this.holdBtn = null;
    this.holdGraphics = this.add.graphics().setDepth(20000);

    // 8. Evento de apagado para limpiar
    this.events.once('shutdown', () => this._cleanup());
  }

  _updateScore() {
    if (this.isGameOver || this.isIntroPlaying) return;
    this.score += 5; // Puntaje fijo para asegurar que siempre suba
    this.scoreText.setText(this.score);

    // Transiciones de Escenario
    const nextScenarioIndex = this.currentScenarioIndex + 1;
    if (nextScenarioIndex < SCENARIOS.length) {
      const nextScenario = SCENARIOS[nextScenarioIndex];
      if (nextScenario.intro && this.score >= nextScenario.threshold) {
        this._transitionToNextScenario();
      }
    }

    if (this.score >= this.nextDifficultyScore) {
      this.nextDifficultyScore += 1000; // Aumento de dificultad más lento
      this.gameSpeed += 0.1; // Casi no aumenta la velocidad
      this.spawnDelay = Math.max(2000, this.spawnDelay - 100); // Mínimo 2s entre obstáculos
      this._startSpawnTimer();
      this.cameras.main.flash(400, 255, 255, 255, 0.05);
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
      // Fallback a imagen si no hay video
      this.bgVideo.stop();
      this.bgVideo.setVisible(false);
      if (this.background) {
        this.background.setVisible(true);
      }
    }
    this.isIntroPlaying = false;

    if (this.levelCompleteText) {
      this.levelCompleteText.setVisible(false);
    }

    if (this.countdownText) {
      this.countdownText.setText('¡GO!');
      this.time.delayedCall(1000, () => {
        this.countdownText.setVisible(false);
      });
    }
  }

  _transitionToNextScenario() {
    this.currentScenarioIndex++;
    const currentScenario = SCENARIOS[this.currentScenarioIndex];
    this.isIntroPlaying = true;
    this.introCountdown = 7;

    // Mostrar y resetear el texto del contador
    this.countdownText.setText(this.introCountdown);
    this.countdownText.setVisible(true);

    // Mostrar el mensaje de Nivel Superado
    if (this.levelCompleteText) {
      this.levelCompleteText.setVisible(true);
      this.levelCompleteText.setScale(0);
      this.tweens.add({
        targets: this.levelCompleteText,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });
    }

    // Cambiar video a la nueva intro
    if (currentScenario.intro) {
      if (this.background) this.background.setVisible(false);
      this.bgVideo.setVisible(true);
      this.bgVideo.changeSource(currentScenario.intro);
      this.bgVideo.setMute(true);
      this.bgVideo.play();
    }

    // Forzar transición de la intro a los 7 segundos exactos
    if (this.introTimerEvent) this.introTimerEvent.destroy();
    this.introTimerEvent = this.time.delayedCall(7000, () => {
      this._finishIntro();
    });

    // Limpiar obstáculos actuales de la pantalla para una pausa limpia
    if (this.obstacles) {
      this.obstacles.clear(true, true);
    }
    if (this.collectibles) {
      this.collectibles.clear(true, true);
    }

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
    if (this.isGameOver) return;

    // Leer controles en update (más fiable)
    if (!this.isIntroPlaying) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this._setLane(Math.max(0, this.currentLane - 1));
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this._setLane(Math.min(2, this.currentLane + 1));
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this._jump();
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this._slide();
      }
    }

    const horizonY = this.scale.height * 0.45;

    // Efecto de movimiento en el fondo (escenario vivo)
    const floatY = (this.scale.height / 2) + Math.sin(this.time.now * 0.01) * 2;
    this.bgVideo.y = floatY;
    if (this.background && this.background.visible) {
      this.background.y = floatY;
    }

    // Redibujar la pista con un ligero desfase para simular movimiento
    this._drawDynamicTrack();

    // Actualizar líneas de reflejo en el suelo (Sensación de avance)
    this.floorStrips.getChildren().forEach(strip => {
      strip.y += this.gameSpeed * 1.5;
      const progress = (strip.y - horizonY) / (this.scale.height - horizonY);
      const targetX = this.scale.width / 2 + this.lanes[strip.lane];
      const startX = this.scale.width / 2 + (this.lanes[strip.lane] * 0.02);
      strip.x = Phaser.Math.Linear(startX, targetX, progress);

      strip.scaleX = 0.1 + progress * 2;
      strip.alpha = Phaser.Math.Clamp(progress * 2, 0, 0.4);

      if (strip.y > this.scale.height + 100) strip.destroy();
    });

    // Actualizar decoraciones laterales
    this.sideDecorations.getChildren().forEach(dec => {
      dec.y += this.gameSpeed * 1.5;
      const progress = (dec.y - horizonY) / (this.scale.height - horizonY);
      const sideFactor = dec.side === 'left' ? -1 : 1;

      // Movimiento desde el punto de fuga hacia los extremos
      const startX = this.scale.width / 2 + (sideFactor * 20);
      const targetX = this.scale.width / 2 + (sideFactor * 800);
      dec.x = Phaser.Math.Linear(startX, targetX, progress);

      dec.setScale(0.01 + progress * 1.5); // Escala moderada
      dec.alpha = Phaser.Math.Clamp(progress * 4, 0, 1);

      if (dec.y > this.scale.height + 200) dec.destroy();
    });

    // Actualizar líneas de velocidad
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
      // Interpolación basada en el punto de fuga de la imagen
      const progress = (obj.y - horizonY) / (this.scale.height - horizonY);

      // Perspectiva corregida para la imagen de fondo
      const startX = this.scale.width / 2 + (this.lanes[obj.lane] * 0.02);
      const targetX = this.scale.width / 2 + this.lanes[obj.lane];
      obj.x = Phaser.Math.Linear(startX, targetX, progress);

      // Aumentamos el tamaño máximo para que se vean bien
      const targetSize = 250 * progress;
      obj.setDisplaySize(targetSize, targetSize);

      obj.setAlpha(Phaser.Math.Clamp(progress * 4, 0, 1));
      obj.setDepth(20); // Asegurar que estén sobre la pista (depth 1)

      if (obj.y > this.scale.height + 200) obj.destroy();

      // Colisiones (Basadas en pies y carril)
      const playerY = this.playerContainer.y;
      const verticalDist = Math.abs(obj.y - playerY);

      if (verticalDist < 50 && obj.lane === this.currentLane) {
        if (this.obstacles && this.obstacles.contains(obj)) {
          if (!this.isJumping) this._gameOver();
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
    // Usamos solo 'obs_valla' para garantizar que visualmente sean 100% idénticos
    const type = 'obs_valla';
    const obs = this.add.sprite(this.scale.width / 2, this.scale.height * 0.45, type);
    obs.lane = lane;
    obs.setOrigin(0.5, 1);
    this.obstacles.add(obs);
  }

  _spawnCollectible(lane) {
    if (!this.collectibles) this.collectibles = this.add.group();
    const sun = this.add.sprite(this.scale.width / 2, this.scale.height * 0.45, 'sun');
    sun.lane = lane;
    sun.setOrigin(0.5, 1); // Base en el suelo
    this.collectibles.add(sun);
  }

  _setLane(lane) {
    if (this.currentLane === lane) return;
    this.currentLane = lane;
    this.tweens.add({
      targets: this.playerContainer,
      x: this.scale.width / 2 + this.lanes[lane],
      duration: 150,
      ease: 'Power2'
    });
  }

  _jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.tweens.add({
      targets: this.jumpContainer,
      y: -280,
      duration: 400,
      yoyo: true,
      ease: 'Cubic.easeOut',
      onComplete: () => { this.isJumping = false; this.jumpContainer.y = 0; }
    });
  }

  _slide() {
    if (this.isSliding) return;
    this.isSliding = true;
    this.tweens.add({
      targets: this.player,
      scaleY: 0.15,
      duration: 150,
      yoyo: true,
      hold: 600,
      onComplete: () => { this.isSliding = false; this.player.scaleY = 0.45; }
    });
  }

  _collectSun(sun) {
    sun.destroy();
    this.score += 50;
    this.scoreText.setText(this.score);
    this.tweens.add({ targets: this.scoreText, scale: 1.2, duration: 100, yoyo: true });
  }

  _setupControls() {
    this._handleKeyDown = (event) => {
      if (this.isGameOver || this.isIntroPlaying) return;
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.LEFT:
          this._setLane(Math.max(0, this.currentLane - 1));
          break;
        case Phaser.Input.Keyboard.KeyCodes.RIGHT:
          this._setLane(Math.min(2, this.currentLane + 1));
          break;
        case Phaser.Input.Keyboard.KeyCodes.UP:
          this._jump();
          break;
        case Phaser.Input.Keyboard.KeyCodes.DOWN:
          this._slide();
          break;
      }
    };
    this.input.keyboard.on('keydown', this._handleKeyDown);
  }

  _cleanup() {
    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.timeScoreTimer) this.timeScoreTimer.destroy();
    if (this.countdownTimer) this.countdownTimer.destroy();
    if (this.introTimerEvent) this.introTimerEvent.destroy();
  }

  _drawStaticTrack() {
    // Solo para inicializar si fuera necesario
  }

  _drawDynamicTrack() {
    // La pista y los carriles ahora están en los videos de fondo
    // por lo que ya no es necesario dibujarlos con código.
    const g = this.trackGraphics;
    if (g) g.clear();
  }

  _spawnFloorStrip() {
    // Desactivado para no tapar el video de fondo
    return;
  }

  _spawnSideDecoration() {
    // Desactivado para no tapar el video de fondo
    return;
  }

  _spawnSpeedLine() {
    // Desactivado para no tapar el video de fondo
    return;
  }

  _gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.cameras.main.shake(600, 0.03);
    const { width, height } = this.scale;

    // Panel de Game Over estilizado
    const panel = this.add.container(width / 2, height / 2).setDepth(200);

    const bg = this.add.rectangle(0, 0, 700, 500, 0x9c4eb3, 0.95)
      .setStrokeStyle(4, 0xffffff);
    panel.add(bg);

    const title = this.add.text(0, -120, '¡FIN DEL JUEGO!', {
      fontSize: '75px', color: '#ffffff', fontWeight: 'bold'
    }).setOrigin(0.5);
    panel.add(title);

    const scoreFinal = this.add.text(0, 10, `PUNTUACIÓN: ${this.score}`, {
      fontSize: '45px', color: '#ffffff'
    }).setOrigin(0.5);
    panel.add(scoreFinal);

    // Botón Reintentar (Color de alto contraste Naranja Brandbook)
    const btn = this.add.text(0, 140, ' REINTENTAR ', {
      fontSize: '40px',
      color: '#ffffff',
      backgroundColor: '#fa804f', // Naranja brillante
      padding: { x: 40, y: 20 },
      fontWeight: 'bold'
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

    // Fallback GLOBAL e INFALIBLE: Cualquier clic en la pantalla reinicia el juego
    this.time.delayedCall(500, () => {
      if (!this._isRestarting) {
        this.input.on('pointerdown', restartAction);
      }
    });


    // Animación de entrada del panel
    panel.setScale(0);
    this.tweens.add({
      targets: panel,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }
}
