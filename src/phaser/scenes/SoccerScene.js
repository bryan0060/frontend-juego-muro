import * as Phaser from 'phaser';

export class SoccerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SoccerScene' });

    this.hitbox = {
      showDebug: true,

      boxesSide: [
        // 🟩 CAJA CENTRAL (Punto de partida - Torso)
        { ox: -50, oy: -50, w: 300, h: 150 },
        // 🟥 CAJA PARTE DE ARRIBA (Cabeza y brazos)
        { ox: -250, oy: -130, w: 200, h: 150 }
      ],

      boxesNeutral: [
        { ox: -40, oy: -170, w: 80, h: 240 }
      ],

      goalTop: 40,
      goalWidthRatio: 0.45,
      goalBottomRatio: 0.95
    };
  }

  init(data) {
    this.escenarioPreseleccionado = (data && data.escenarioId) ? data.escenarioId : null;
    this.precisionPersistente = (data && data.precisionExtra) ? data.precisionExtra : 0;
    // Cargar fuentes dinámicamente
    if (!document.getElementById('soccer-fonts-loader')) {
      const link = document.createElement('link');
      link.id = 'soccer-fonts-loader';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Bangers&family=Bubblegum+Sans&family=Fredoka:wght@700&display=swap';
      document.head.appendChild(link);
    }
    // Generar textura de destello para partículas
    if (!this.textures.exists('sparkle')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture('sparkle', 8, 8);
    }
  }

  static MAX_SHOTS = 5;

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W;
    this.H = H;

    this.score = 0;
    this.cpuScore = 0;
    this.shots = 0;
    this.shotResults = [];

    this.currentMusicIndex = Phaser.Math.Between(1, 8);
    this.currentMusicJIndex = Phaser.Math.Between(1, 7);
    this.menuMusic = null;
    this.gameMusic = null;
    this.hoverSound = null;
    this.precisionExtra = this.precisionPersistente || 0; // 0 = Normal, 0.35 = Alta

    this.estado = 'seleccion';
    this.phase = 'aim';

    if (this.escenarioPreseleccionado) {
      this._iniciarJuego(this.escenarioPreseleccionado);
    } else {
      this._mostrarMenuEscenarios();
    }

    this._impactHandler = this.handleImpact.bind(this);
    window.addEventListener('ws-message', this._impactHandler);

    // Fuegos artificiales al hacer clic en el menú
    this.input.on('pointerdown', (ptr) => {
      if (this.estado === 'seleccion') {
        this._launchSingleFirework(ptr.x, ptr.y);
      }
    });
  }

  _mostrarMenuEscenarios() {
    const { width: W, height: H } = this.scale;
    this.menuContainer = this.add.container(0, 0).setDepth(200);

    const bg = this.add.image(W / 2, H / 2, 'soccer_menu_bg').setDisplaySize(W, H);
    this.menuContainer.add(bg);

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.4);
    this.menuContainer.add(overlay);

    const stars = this.add.graphics();
    for (let i = 0; i < 200; i++) {
      stars.fillStyle(0xffffff, Math.random());
      stars.fillCircle(Math.random() * W, Math.random() * H, Math.random() * 2);
    }
    this.menuContainer.add(stars);

    const titulo = this.add.text(W / 2, 100, 'ELIGE TU TORNEO', {
      fontSize: '84px',
      fontFamily: 'Luckiest Guy',
      fill: '#ffffff',
      stroke: '#40c0dd',
      strokeThickness: 14,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: titulo,
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.menuContainer.add(titulo);

    const escenarios = [
      { id: 'soccer_kids_bg', thumbnail: 'juvenil', nombre: 'LIGA JUVENIL', color: 0xff8000, desc: 'Nivel: Principiante' },
      { id: 'soccer_adults_bg', thumbnail: 'profesional', nombre: 'HINCHADA MUNDIAL', color: 0x0044ff, desc: 'Nivel: Profesional' }
    ];

    escenarios.forEach((esc, i) => {
      const x = W / 2 + (i === 0 ? -360 : 360);
      const y = H / 2 + 60;

      // Contenedor principal
      const card = this.add.container(x, y);
      this.menuContainer.add(card);

      // 1. Base de la tarjeta (Vidrio oscuro profundo)
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0a0a0a, 0.95);
      cardBg.fillRoundedRect(-240, -200, 480, 400, 40);
      cardBg.lineStyle(2, 0xffffff, 0.15);
      cardBg.strokeRoundedRect(-240, -200, 480, 400, 40);
      card.add(cardBg);

      // 2. Imagen principal (Sin máscara compleja, usaremos el borde grueso como marco)
      const img = this.add.image(0, -50, esc.thumbnail).setDisplaySize(460, 270);
      card.add(img);

      // 3. Degradado inferior
      const overlay = this.add.graphics();
      overlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8);
      overlay.fillRect(-230, 20, 460, 100);
      card.add(overlay);

      // 4. Brillo y Marco decorativo (MUY GRUESO para tapar esquinas)
      const glow = this.add.graphics();
      this._drawCardGlow(glow, esc.color);
      card.add(glow); // Se agrega al final para estar encima de la imagen

      // 5. Títulos con estilo premium
      const txt = this.add.text(0, 105, esc.nombre, {
        fontSize: '46px',
        fontFamily: 'Luckiest Guy',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
        shadow: { color: '#000000', fill: true, offsetX: 3, offsetY: 3, blur: 5 }
      }).setOrigin(0.5);
      card.add(txt);

      // Badge de Nivel
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(esc.color, 1);
      badgeBg.fillRoundedRect(-130, 150, 260, 42, 21);
      card.add(badgeBg);

      const levelTxt = this.add.text(0, 171, esc.desc.toUpperCase(), {
        fontSize: '18px',
        fontFamily: 'Fredoka',
        color: '#ffffff',
        fontStyle: 'bold',
        letterSpacing: 3
      }).setOrigin(0.5);
      card.add(levelTxt);

      // 6. Animación de flotación sutil
      this.tweens.add({
        targets: card,
        y: y - 15,
        duration: 2500 + (i * 300),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // 7. Área interactiva
      const hitArea = this.add.rectangle(x, y, 480, 400, 0x000000, 0).setInteractive({ cursor: 'pointer' });
      this.menuContainer.add(hitArea);

      hitArea.on('pointerover', () => {
        glow.clear();
        this._drawCardGlow(glow, 0xffffff, 1.2);

        // Sonido
        if (this.hoverSound) this.hoverSound.stop();
        const soundKey = esc.id === 'soccer_adults_bg' ? 'champions' : 'europa';
        this.hoverSound = this.sound.add(soundKey, { volume: 0.5, loop: true });
        this.hoverSound.play();
        if (this.menuMusic) this.menuMusic.setVolume(0.1);
      });

      hitArea.on('pointerout', () => {
        glow.clear();
        this._drawCardGlow(glow, esc.color);

        if (this.hoverSound) {
          this.hoverSound.stop();
          this.hoverSound = null;
        }
        if (this.menuMusic) this.menuMusic.setVolume(0.4);
      });

      hitArea.on('pointerdown', () => {
        this.sound.play('pop');
        this.tweens.add({
          targets: card,
          scale: 0.95,
          duration: 100,
          yoyo: true,
          onComplete: () => this._iniciarJuego(esc.id)
        });
      });
    });

    this._playMenuMusic();
    this._createMusicSelector();
  }

  _createPrecisionSelector() {
    const { width: W } = this.scale;
    // Posición muy pegada a la esquina superior derecha, casi invisible
    const btn = this.add.container(W - 40, 40).setDepth(2000);

    const bg = this.add.graphics();
    const drawBg = (color, alpha = 0.05) => {
      bg.clear();
      bg.fillStyle(0x000000, alpha);
      bg.fillCircle(0, 0, 25);
      bg.lineStyle(1, color, alpha);
      bg.strokeCircle(0, 0, 25);
    };
    
    const currentColor = this.precisionExtra > 0 ? 0xff4400 : 0x40c0dd;
    drawBg(currentColor, 0.03); // Muy tenue
    btn.add(bg);

    // Icono casi invisible
    const icon = this.add.text(0, 0, '🎯', { fontSize: '16px' }).setOrigin(0.5).setAlpha(0.1);
    btn.add(icon);

    // Etiqueta invisible a menos que se pase el mouse
    this.precisionLabel = this.add.text(-60, 0, '', {
      fontSize: '12px', fontFamily: 'Luckiest Guy', color: '#ffffff'
    }).setOrigin(1, 0.5).setAlpha(0);
    btn.add(this.precisionLabel);

    const hit = this.add.circle(0, 0, 25, 0x000000, 0).setInteractive({ cursor: 'pointer' });
    btn.add(hit);

    // Guardar referencia para el chequeo de disparo
    this.precisionHitArea = hit;

    hit.on('pointerover', () => {
      drawBg(this.precisionExtra > 0 ? 0xff4400 : 0x40c0dd, 0.2);
      icon.setAlpha(0.5);
      this.precisionLabel.setText(this.precisionExtra > 0 ? 'PRECISIÓN: ALTA' : 'PRECISIÓN: NORMAL').setAlpha(0.8);
    });

    hit.on('pointerout', () => {
      drawBg(this.precisionExtra > 0 ? 0xff4400 : 0x40c0dd, 0.03);
      icon.setAlpha(0.1);
      this.precisionLabel.setAlpha(0);
    });

    hit.on('pointerdown', (ptr, localX, localY, event) => {
      // Importante: No disparamos aquí, el chequeo se hace en _buildInput
      if (this.precisionExtra === 0) {
        this.precisionExtra = 0.35;
        drawBg(0xff4400, 0.2);
      } else {
        this.precisionExtra = 0;
        drawBg(0x40c0dd, 0.2);
      }
      this.precisionLabel.setText(this.precisionExtra > 0 ? 'PRECISIÓN: ALTA' : 'PRECISIÓN: NORMAL');
      this.sound.play('pop', { volume: 0.2 });
    });
  }

  _drawCardGlow(graphics, color, mult = 1) {
    // Brillo exterior muy grueso para tapar cualquier esquina
    graphics.lineStyle(16 * mult, color, 0.6);
    graphics.strokeRoundedRect(-240, -200, 480, 400, 40);

    // Borde blanco interno más sólido (Marco real)
    graphics.lineStyle(10 * mult, 0xffffff, 1);
    graphics.strokeRoundedRect(-240, -200, 480, 400, 40);
  }

  _playMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.stop();
      this.menuMusic.removeAllListeners();
    }
    this.menuMusic = this.sound.add(`soccer_music_${this.currentMusicIndex}`, { loop: false, volume: 0.4 });

    this.menuMusic.on('complete', () => {
      if (this.estado === 'seleccion') {
        this.currentMusicIndex = Phaser.Math.Between(1, 8);
        if (this.musicLabel) this.musicLabel.setText(`CANCIÓN ${this.currentMusicIndex}`);
        this._playMenuMusic();
      }
    });

    this.menuMusic.play();
  }

  _createMusicSelector() {
    const { width: W, height: H } = this.scale;
    const btn = this.add.container(W - 140, H - 50);
    this.menuContainer.add(btn);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-110, -25, 220, 50, 15);
    bg.lineStyle(3, 0x40c0dd, 1);
    bg.strokeRoundedRect(-110, -25, 220, 50, 15);
    btn.add(bg);

    const musicIcon = this.add.text(-85, 0, '🎵', { fontSize: '20px' }).setOrigin(0.5);
    btn.add(musicIcon);

    this.musicLabel = this.add.text(10, 0, `CANCIÓN ${this.currentMusicIndex}`, {
      fontSize: '20px', fontFamily: 'Luckiest Guy', color: '#ffffff'
    }).setOrigin(0.5);
    btn.add(this.musicLabel);

    const hit = this.add.rectangle(0, 0, 220, 50, 0x000000, 0).setInteractive({ cursor: 'pointer' });
    btn.add(hit);

    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x40c0dd, 0.3);
      bg.fillRoundedRect(-110, -25, 220, 50, 15);
      bg.lineStyle(3, 0xffffff, 1);
      bg.strokeRoundedRect(-110, -25, 220, 50, 15);
    });

    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.7);
      bg.fillRoundedRect(-110, -25, 220, 50, 15);
      bg.lineStyle(3, 0x40c0dd, 1);
      bg.strokeRoundedRect(-110, -25, 220, 50, 15);
    });

    hit.on('pointerdown', () => {
      this.currentMusicIndex = (this.currentMusicIndex % 8) + 1;
      this.registry.set('soccer_music_idx', this.currentMusicIndex);
      this.musicLabel.setText(`CANCIÓN ${this.currentMusicIndex}`);
      this._playMenuMusic();
      this.sound.play('pop');
    });
  }

  _iniciarJuego(escenarioId) {
    if (this.menuMusic) this.menuMusic.stop();
    if (this.hoverSound) this.hoverSound.stop();
    if (this.menuContainer) this.menuContainer.destroy();

    this.escenarioActual = escenarioId;
    this.estado = 'jugando';

    if (escenarioId === 'soccer_kids_bg') {
      this.hitbox.goalWidthRatio = 0.55;
      this.keeperKeys = { neutral: 'keeper_kids_neutral', side: 'keeper_kids_side' };
    } else {
      this.hitbox.goalWidthRatio = 0.45;
      this.keeperKeys = { neutral: 'keeper_neutral', side: 'keeper_side' };
    }

    this._buildGraphics();
    this._buildHUD();
    this._buildInput();
    this._playGameMusic();
    this._iniciarCuentaRegresiva();
  }

  _playGameMusic() {
    if (this.gameMusic) {
      this.gameMusic.stop();
      this.gameMusic.removeAllListeners();
    }

    const isJuvenil = this.escenarioActual === 'soccer_kids_bg';
    const prefix = isJuvenil ? 'soccer_music_j_' : 'soccer_music_';
    const max = isJuvenil ? 7 : 8;

    // Si es aleatorio, elegimos uno nuevo
    const randomIndex = Phaser.Math.Between(1, max);
    this.gameMusic = this.sound.add(`${prefix}${randomIndex}`, { loop: false, volume: 0.3 });

    this.gameMusic.on('complete', () => {
      if (this.estado === 'jugando' || this.estado === 'countdown') {
        this._playGameMusic();
      }
    });

    this.gameMusic.play();
  }

  _iniciarCuentaRegresiva() {
    this.estado = 'countdown';
    this.phase = 'countdown';

    const { width: W, height: H } = this.scale;
    const countText = this.add.text(W / 2, H / 2, '3', {
      fontSize: '220px',
      fontFamily: 'Luckiest Guy',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 15
    }).setOrigin(0.5).setDepth(500);

    let count = 3;

    const updateCount = () => {
      this.tweens.add({
        targets: countText,
        scale: { start: 0.5, to: 1.2 },
        alpha: { start: 0, to: 1 },
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(600, () => {
            this.tweens.add({
              targets: countText,
              scale: 2,
              alpha: 0,
              duration: 200,
              onComplete: () => {
                count--;
                if (count > 0) {
                  countText.setText(count);
                  this.sound.play('tick');
                  updateCount();
                } else if (count === 0) {
                  countText.setText('¡GO!');
                  countText.setColor('#00ff00');
                  this.sound.play('pop');
                  this.sound.play('arbitro');
                  updateCount();
                } else {
                  countText.destroy();
                  this.estado = 'jugando';
                  this.phase = 'aim';
                }
              }
            });
          });
        }
      });
    };

    this.sound.play('tick');
    updateCount();
  }

  // ─── Construcción de gráficos ────────────────────────────────────
  _buildGraphics() {
    const W = this.W, H = this.H;

    const bgKey = this.escenarioActual || 'soccer_adults_bg';
    this.add.image(W / 2, H / 2, bgKey).setDisplaySize(W, H).setDepth(0);

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.2).setDepth(1);

    const vignette = this.add.graphics().setDepth(2);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x080808, 0x080808, 1, 1, 0, 0);
    vignette.fillRect(0, 0, W, H * 0.4);
    vignette.fillGradientStyle(0x080808, 0x080808, 0x000000, 0x000000, 0, 0, 1, 1);
    vignette.fillRect(0, H * 0.6, W, H * 0.4);

    this._drawAdBoards();
    this._drawGoal();

    this.keeperShadow = this.add.ellipse(W / 2, H * 0.75 + 50, 140, 35, 0x000000, 0.5)
      .setDepth(4);

    this.keeperContainer = this.add.container(W / 2, H * 0.75).setDepth(5);
    this._buildKeeper();

    this.ballShadow = this.add.ellipse(W / 2, H - 35 + 15, 60, 15, 0x000000, 0.4).setDepth(6);
    this.ballSprite = this._createBall(W / 2, H - 35).setDepth(7);

    this.particles = this.add.particles(0, 0, '__DEFAULT', {
      speed: { min: 100, max: 350 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      tint: [0xffd700, 0xff6600, 0xffffff],
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 40,
      emitting: false,
    });

    if (!this.textures.exists('sparkle')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff);
      g.fillCircle(4, 4, 4);
      g.generateTexture('sparkle', 8, 8);
    }

    this.debugGraphics = this.add.graphics().setDepth(1000);
  }

  _drawAdBoards() {
    const W = this.W, H = this.H;
    const y = H * 0.75;
    const boardHeight = 60;
    const g = this.add.graphics().setDepth(3);

    g.fillStyle(0x111111, 0.8);
    g.fillRect(0, y, W, boardHeight);

    g.lineStyle(2, 0xffffff, 0.1);
    g.strokeLineShape(new Phaser.Geom.Line(0, y, W, y));
  }

  _drawGoal() {
    const g = this.add.graphics().setDepth(4);
    const cx = this.W / 2;
    const H = this.H;

    const fTop = 40;
    const fBot = H * 0.95;
    const fWid = this.W * 0.45;

    const bTop = fTop + 70;
    const bBot = fBot - 30;
    const bWid = fWid - 120;

    // 1. Red de Portería (Patrón de Diamante Profesional - Dibujo Acotado)
    const netG = this.add.graphics().setDepth(4);

    const drawDiamondNet = (color, alpha, offset = 0) => {
      netG.lineStyle(1, color, alpha);
      const step = 28;
      const netHeight = bBot - bTop;

      // Diagonales \ (Acotadas al ancho bWid)
      for (let i = -bWid - netHeight; i <= bWid + netHeight; i += step) {
        const x1 = cx + i + offset;
        const x2 = cx + i - netHeight + offset;

        if ((x1 >= cx - bWid && x1 <= cx + bWid) || (x2 >= cx - bWid && x2 <= cx + bWid)) {
          let rx1 = x1, ry1 = bTop, rx2 = x2, ry2 = bBot;
          if (rx1 < cx - bWid) { ry1 = bTop + (bBot - bTop) * ((cx - bWid - x1) / (x2 - x1)); rx1 = cx - bWid; }
          if (rx1 > cx + bWid) { ry1 = bTop + (bBot - bTop) * ((cx + bWid - x1) / (x2 - x1)); rx1 = cx + bWid; }
          if (rx2 < cx - bWid) { ry2 = bBot - (bBot - bTop) * ((x2 - (cx - bWid)) / (x2 - x1)); rx2 = cx - bWid; }
          if (rx2 > cx + bWid) { ry2 = bBot - (bBot - bTop) * ((x2 - (cx + bWid)) / (x2 - x1)); rx2 = cx + bWid; }

          if (ry1 >= bTop && ry1 <= bBot && ry2 >= bTop && ry2 <= bBot) {
            netG.strokeLineShape(new Phaser.Geom.Line(rx1, ry1, rx2, ry2));
          }
        }
      }

      // Diagonales / (Acotadas al ancho bWid)
      for (let i = -bWid - netHeight; i <= bWid + netHeight; i += step) {
        const x1 = cx + i + offset;
        const x2 = cx + i + netHeight + offset;
        if ((x1 >= cx - bWid && x1 <= cx + bWid) || (x2 >= cx - bWid && x2 <= cx + bWid)) {
          let rx1 = x1, ry1 = bTop, rx2 = x2, ry2 = bBot;
          if (rx1 < cx - bWid) { ry1 = bTop + (bBot - bTop) * ((cx - bWid - x1) / (x2 - x1)); rx1 = cx - bWid; }
          if (rx1 > cx + bWid) { ry1 = bTop + (bBot - bTop) * ((cx + bWid - x1) / (x2 - x1)); rx1 = cx + bWid; }
          if (rx2 < cx - bWid) { ry2 = bBot - (bBot - bTop) * ((x2 - (cx - bWid)) / (x2 - x1)); rx2 = cx - bWid; }
          if (rx2 > cx + bWid) { ry2 = bBot - (bBot - bTop) * ((x2 - (cx + bWid)) / (x2 - x1)); rx2 = cx + bWid; }

          if (ry1 >= bTop && ry1 <= bBot && ry2 >= bTop && ry2 <= bBot) {
            netG.strokeLineShape(new Phaser.Geom.Line(rx1, ry1, rx2, ry2));
          }
        }
      }
    };

    drawDiamondNet(0x000000, 0.2, 1);
    drawDiamondNet(0xffffff, 0.15);

    // Conexiones de perspectiva
    netG.lineStyle(1, 0xffffff, 0.15);
    for (let x = cx - bWid; x <= cx + bWid; x += 40) {
      const ratio = (x - (cx - bWid)) / (bWid * 2);
      const fx = (cx - fWid) + (fWid * 2) * ratio;
      netG.strokeLineShape(new Phaser.Geom.Line(x, bTop, fx, fTop));
      if (x === cx - bWid || x === cx + bWid) {
        netG.strokeLineShape(new Phaser.Geom.Line(x, bBot, x === cx - bWid ? cx - fWid : cx + fWid, fBot));
      }
    }

    // 2. Postes Principales (El "Arco")
    // Sombras primero
    g.lineStyle(24, 0x000000, 0.2);
    g.beginPath();
    g.moveTo(cx - fWid, fBot);
    g.lineTo(cx - fWid, fTop);
    g.lineTo(cx + fWid, fTop);
    g.lineTo(cx + fWid, fBot);
    g.strokePath();

    // El poste blanco real (Sin huecos usando Path)
    g.lineStyle(20, 0xffffff, 1);
    g.beginPath();
    g.moveTo(cx - fWid, fBot);
    g.lineTo(cx - fWid, fTop);
    g.lineTo(cx + fWid, fTop);
    g.lineTo(cx + fWid, fBot);
    g.strokePath();

    // Brillo/Highlight central para efecto cilíndrico
    g.lineStyle(4, 0xffffff, 0.4);
    g.beginPath();
    g.moveTo(cx - fWid + 4, fBot);
    g.lineTo(cx - fWid + 4, fTop + 4);
    g.lineTo(cx + fWid - 4, fTop + 4);
    g.lineTo(cx + fWid - 4, fBot);
    g.strokePath();

    // 4. Tapas redondeadas en las esquinas (Uniones perfectas)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - fWid, fTop, 10);
    g.fillCircle(cx + fWid, fTop, 10);

    // Base de los postes (Suelo)
    g.lineStyle(8, 0x000000, 0.3);
    g.strokeLineShape(new Phaser.Geom.Line(cx - fWid, fBot, cx - bWid, bBot));
    g.strokeLineShape(new Phaser.Geom.Line(cx + fWid, fBot, cx + bWid, bBot));
  }

  _buildKeeper() {
    this.scaleNeutral = 0.95;
    this.scaleSide = 0.95;

    const sp = this.add.sprite(0, 0, this.keeperKeys?.neutral || 'keeper_neutral');
    sp.setScale(this.scaleNeutral);
    sp.setOrigin(0.5, 0.5);

    this.keeperContainer.add(sp);
    this.keeperSprite = sp;
  }

  _createBall(x, y) {
    const ball = this.add.sprite(x, y, 'ball');
    ball.setScale(0.032);
    return ball;
  }

  // ─── HUD ─────────────────────────────────────────────────────────
  _buildHUD() {
    const { width: W, height: H } = this.scale;

    const hudGroup = this.add.container(40, 40).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(0, 0, 220, 60, 4);
    this._createBroadcastScoreboard();
    this._createPrecisionSelector();

    this.messageText = this.add.text(W / 2, H / 2 - 10, '', {
      fontSize: '48px',
      fontFamily: 'Luckiest Guy',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(120).setAlpha(0);

    this.hintText = this.add.text(W / 2, this.H - 85, 'APUNTA Y DISPARA', {
      fontSize: '16px',
      fontFamily: 'Fredoka',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: this.hintText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  _createBroadcastScoreboard() {
    const W = this.W;
    const cx = W / 2;
    const cy = 50;

    this.scoreboardGraphics = this.add.graphics().setDepth(100);
    this.isSerious = (this.escenarioActual === 'soccer_adults_bg');

    if (this.isSerious) {
      this.teamJUG = this.add.text(cx - 85, cy - 8, 'LOCAL', {
        fontSize: '22px', fontFamily: 'Luckiest Guy', color: '#ffffff'
      }).setOrigin(0.5).setDepth(102);

      this.shotsCounterText = this.add.text(cx, cy - 8, '0/5', {
        fontSize: '24px', fontFamily: 'Fredoka', color: '#00ff00'
      }).setOrigin(0.5).setDepth(102);

      this.teamCPU = this.add.text(cx + 85, cy - 8, 'RIVAL', {
        fontSize: '22px', fontFamily: 'Luckiest Guy', color: '#ffffff'
      }).setOrigin(0.5).setDepth(102);

      this.scoreJUG = this.add.text(cx - 160, cy, '0', {
        fontSize: '44px', fontFamily: 'Fredoka', color: '#ffffff'
      }).setOrigin(0.5).setDepth(102);

      this.scoreCPU = this.add.text(cx + 160, cy, '0', {
        fontSize: '44px', fontFamily: 'Fredoka', color: '#ffffff'
      }).setOrigin(0.5).setDepth(102);

      this.goalLabel = this.add.text(cx - 245, cy + 10, 'GOAL', {
        fontSize: '12px', fontFamily: 'Luckiest Guy', color: '#ffffff'
      }).setOrigin(0.5).setDepth(102);

      this.cpuLabel = { setVisible: () => { } };
    } else {
      this.teamJUG = this.add.text(cx - 100, cy - 10, 'JUGADOR', {
        fontSize: '24px', fontFamily: 'Bubblegum Sans', color: '#ffffff',
        stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(102);

      this.shotsCounterText = this.add.text(cx, cy + 25, '0/5', {
        fontSize: '28px', fontFamily: 'Luckiest Guy', color: '#ffff00',
        stroke: '#000000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(102);

      this.teamCPU = this.add.text(cx + 100, cy - 10, 'EQUIPO RIVAL', {
        fontSize: '24px', fontFamily: 'Bubblegum Sans', color: '#ffffff',
        stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(102);

      this.scoreJUG = this.add.text(cx - 200, cy, '0', {
        fontSize: '60px', fontFamily: 'Luckiest Guy', color: '#ffffff',
        stroke: '#ff00ff', strokeThickness: 8
      }).setOrigin(0.5).setDepth(102);

      this.scoreCPU = this.add.text(cx + 200, cy, '0', {
        fontSize: '60px', fontFamily: 'Luckiest Guy', color: '#ffffff',
        stroke: '#00ffff', strokeThickness: 8
      }).setOrigin(0.5).setDepth(102);

      this.goalLabel = this.add.text(cx - 200, cy - 45, 'GOLES', {
        fontSize: '14px', fontFamily: 'Luckiest Guy', color: '#ffffff'
      }).setOrigin(0.5).setDepth(102);

      this.cpuLabel = this.add.text(cx + 200, cy - 45, 'GOLES', {
        fontSize: '14px', fontFamily: 'Luckiest Guy', color: '#ffffff'
      }).setOrigin(0.5).setDepth(102);
    }

    // Indicadores de balones
    this.shotIndicators = [];
    const spacing = 35;
    const startX = cx - (spacing * (SoccerScene.MAX_SHOTS - 1)) / 2;
    const indicatorY = this.isSerious ? cy + 45 : cy + 65;

    for (let i = 0; i < SoccerScene.MAX_SHOTS; i++) {
      const ball = this.add.sprite(startX + i * spacing, indicatorY, 'ball')
        .setScale(this.isSerious ? 0.018 : 0.022)
        .setDepth(102)
        .setAlpha(0.2);
      this.shotIndicators.push(ball);
    }

    this._drawScoreboardGraphics();
  }

  _drawScoreboardGraphics() {
    const g = this.scoreboardGraphics;
    g.clear();
    const cx = this.W / 2;
    const cy = 50;

    if (this.isSerious) {
      g.fillStyle(0x111111, 0.95);
      g.fillRect(cx - 120, cy - 25, 240, 40);

      g.fillPoints([
        { x: cx - 110, y: cy + 15 },
        { x: cx + 110, y: cy + 15 },
        { x: cx + 90, y: cy + 75 },
        { x: cx - 90, y: cy + 75 }
      ], true);

      g.fillStyle(0x0d47a1, 1);
      g.fillRect(cx - 195, cy - 25, 70, 60);
      g.fillStyle(0x616161, 1);
      g.fillRect(cx + 125, cy - 25, 70, 60);

      g.fillStyle(0x1a237e, 1);
      g.fillPoints([
        { x: cx - 290, y: cy - 25 }, { x: cx - 195, y: cy - 25 },
        { x: cx - 195, y: cy + 35 }, { x: cx - 260, y: cy + 35 }
      ], true);
      g.fillPoints([
        { x: cx + 195, y: cy - 25 }, { x: cx + 290, y: cy - 25 },
        { x: cx + 260, y: cy + 35 }, { x: cx + 195, y: cy + 35 }
      ], true);

      g.fillStyle(0x3f51b5, 1);
      g.fillRect(cx - 50, cy - 35, 100, 8);
      g.fillStyle(0xffd700, 1);
      this._drawStar(g, cx - 245, cy - 5, 5, 18, 8);
      g.lineStyle(2, 0xffffff, 0.2);
      g.strokeRect(cx - 120, cy - 25, 240, 40);

    } else {
      g.fillStyle(0x000000, 0.7);
      g.fillRoundedRect(cx - 150, cy - 30, 300, 110, 20);
      g.lineStyle(4, 0xffffff, 0.5);
      g.strokeRoundedRect(cx - 150, cy - 30, 300, 110, 20);

      g.fillStyle(0xff00ff, 1);
      g.fillCircle(cx - 200, cy, 50);
      g.lineStyle(6, 0xffffff, 1);
      g.strokeCircle(cx - 200, cy, 50);

      g.fillStyle(0x00ffff, 1);
      g.fillCircle(cx + 200, cy, 50);
      g.lineStyle(6, 0xffffff, 1);
      g.strokeCircle(cx + 200, cy, 50);

      g.fillStyle(0xffff00, 1);
      g.fillCircle(cx - 140, cy - 20, 8);
      g.fillCircle(cx + 140, cy - 20, 8);
      g.fillCircle(cx, cy - 40, 6);
    }
  }

  _drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    graphics.beginPath();
    graphics.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      graphics.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      graphics.lineTo(x, y);
      rot += step;
    }
    graphics.lineTo(cx, cy - outerRadius);
    graphics.closePath();
    graphics.fillPath();
  }

  _updateHUDStats() {
    if (this.scoreJUG) this.scoreJUG.setText(this.score);
    if (this.scoreCPU) this.scoreCPU.setText(this.cpuScore);
    if (this.shotsCounterText) this.shotsCounterText.setText(`${this.shots}/${SoccerScene.MAX_SHOTS}`);

    this.shotIndicators.forEach((indicator, i) => {
      if (i < this.shotResults.length) {
        const isGoal = this.shotResults[i];
        indicator.setAlpha(1);

        if (isGoal) {
          indicator.setTint(0x00ff00);
          if (!indicator.getData('glowing')) {
            indicator.setData('glowing', true);
            this.tweens.add({
              targets: indicator,
              alpha: 0.6,
              duration: 400,
              yoyo: true,
              repeat: -1
            });
          }
        } else {
          indicator.setTint(0x444444);
        }

        if (i === this.shotResults.length - 1 && !indicator.getData('animated')) {
          indicator.setData('animated', true);
          this.tweens.add({
            targets: indicator,
            scale: 0.024,
            duration: 250,
            yoyo: true,
            ease: 'Back.easeOut'
          });
        }
      } else {
        indicator.setAlpha(0.2);
        indicator.clearTint();
        indicator.setData('animated', false);
        indicator.setData('glowing', false);
      }
    });
  }

  // ─── Input ───────────────────────────────────────────────────────
  _buildInput() {
    this.input.on('pointermove', (ptr) => {
      if (this.phase !== 'aim') return;
      this.aimX = ptr.x;
      this.aimY = ptr.y;
    });

    this.input.on('pointerdown', (ptr) => {
      if (this.phase === 'gameover') return;
      if (this.phase !== 'aim') return;

      // Evitar disparo si se hace clic en el botón camuflado
      const hits = this.input.hitTestPointer(ptr);
      const isPrecisionClick = hits.some(h => h === this.precisionHitArea);
      if (isPrecisionClick) return;

      this._shoot(ptr.x, ptr.y);
    });
  }

  // ─── Lógica de disparo ───────────────────────────────────────────
  _shoot(tx, ty) {
    this.phase = 'shoot';
    this.shots++;
    this._updateHUDStats();
    this.hintText.setAlpha(0);

    const intelligence = Math.min(this.precisionExtra + (this.score * 0.22), 0.95);
    const randomDir = Math.random() > 0.5 ? 1 : -1;
    const randomDestX = this.W / 2 + randomDir * 280;

    let keeperDestX = randomDestX * (1 - intelligence) + tx * intelligence;
    keeperDestX = Phaser.Math.Clamp(
      keeperDestX,
      this.W / 2 - this.W * 0.5,
      this.W / 2 + this.W * 0.5
    );

    const isLowShot = ty > this.H * 0.7;

    const jumpPower = isLowShot
      ? Phaser.Math.Between(0, 50)
      : Phaser.Math.Clamp(Math.max(120, (this.H * 0.75 - ty) * 0.9), 0, 350);

    const reactionTime = Math.max(240, 380 - (this.score * 40));

    this.keeperSprite.setTexture(this.keeperKeys.side);
    this.keeperSprite.setScale(this.scaleSide);
    this.keeperSprite.setFlipX(keeperDestX > this.W / 2);

    this.tweens.add({
      targets: [this.keeperContainer, this.keeperShadow],
      x: keeperDestX,
      y: (targets) => targets === this.keeperShadow ? this.H * 0.75 + 50 : this.H * 0.75 - jumpPower,
      angle: (keeperDestX > this.W / 2 ? 1 : -1) * 35,
      duration: reactionTime,
      ease: 'Quad.easeOut',
    });

    this.tweens.add({
      targets: [this.ballSprite, this.ballShadow],
      x: tx,
      y: ty,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => this._evaluateShot(tx, ty, keeperDestX),
    });
  }

  // ─── Evaluación del disparo con hitboxes horizontales ────────────
  _evaluateShot(tx, ty, keeperDest) {
    const cx = this.W / 2;
    const isFlipped = this.keeperSprite.flipX;
    const isNeutral = this.keeperSprite.texture.key === (this.keeperKeys?.neutral || 'keeper_neutral');
    const isLowShot = ty > this.H * 0.7;

    const activeBoxes = isNeutral
      ? this.hitbox.boxesNeutral
      : this.hitbox.boxesSide;

    const sortedBoxes = [...activeBoxes];
    // El guante (menor ox) siempre primero
    sortedBoxes.sort((a, b) => a.ox - b.ox);

    const blocked = sortedBoxes.some(box => {
      let ox = box.ox;
      if (isFlipped && !isNeutral) {
        ox = -(box.ox + box.w);
      }

      // Convertimos la posición del balón al espacio local del portero (deshaciendo la rotación)
      const dx = tx - keeperDest;
      const dy = ty - this.keeperContainer.y;
      const angleRad = -this.keeperContainer.rotation;
      const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

      const bLeft = ox;
      const bRight = ox + box.w;
      const bTop = box.oy;
      const bBot = box.oy + box.h + (isLowShot ? 15 : 0);

      return localX > bLeft && localX < bRight && localY > bTop && localY < bBot;
    });

    const gWidth = this.W * this.hitbox.goalWidthRatio;
    const gTop = this.hitbox.goalTop;
    const gBot = this.H * this.hitbox.goalBottomRatio;
    const postMargin = 10;

    const hitPost = (
      (Math.abs(tx - (cx - gWidth)) < postMargin && ty > gTop && ty < gBot) ||
      (Math.abs(tx - (cx + gWidth)) < postMargin && ty > gTop && ty < gBot) ||
      (Math.abs(ty - gTop) < postMargin && tx > cx - gWidth && tx < cx + gWidth)
    );

    const strictlyInGoal =
      tx > (cx - gWidth + postMargin) &&
      tx < (cx + gWidth - postMargin) &&
      ty > (gTop + postMargin) &&
      ty < gBot;

    if (strictlyInGoal && !blocked && !hitPost) {
      const msg = this._getRandomMessage([
        '¡GOLAZO!', '¡GOL!', '¡QUÉ TIRO!', '¡INCREÍBLE!', '¡ADENTRO!',
        '¡GENIAL!', '¡FENOMENAL!', '¡ESTRELLA!', '¡MAGNÍFICO!',
        '¡POTENCIA PURA!', '¡IMPARABLE!', '¡GOOOOL!', '¡CRACK!'
      ]);
      this._showResult(msg, '#4CAF50');
      this.score++;
      this.shotResults.push(true);
      this.sound.play('gol');
      this.cameras.main.shake(250, 0.012);
      this.particles.setPosition(tx, ty);
      this.particles.explode(40);
      this._launchFireworks();
    } else if (blocked) {
      const msg = this._getRandomMessage([
        'ATAJADO', '¡QUÉ REFLEJOS!', '¡MURALLA!', '¡ATAJADÓN!',
        '¡NO PASAS!', '¡MANO SALVADORA!', '¡IMPEDIDO!', '¡BLOQUEADO!'
      ]);
      this._showResult(msg, '#f44336');
      this.cpuScore++;
      this.shotResults.push(false);
    } else if (hitPost) {
      const msg = this._getRandomMessage([
        '¡CASI!', '¡UYYY!', '¡POSTE!', '¡PALO!', '¡POR UN PELO!',
        '¡METAL!', '¡A NADA!', '¡NO PUEDE SER!'
      ]);
      this._showResult(msg, '#FF9800');
      this.cpuScore++;
      this.shotResults.push(false);
      this.sound.play('tick');
    } else {
      const msg = this._getRandomMessage([
        'MUY FUERTE', '¡AHHH!', '¡AFUERA!', '¡POR POCO!',
        '¡AL CIELO!', '¡FUERA!', '¡TE PASASTE!', '¡OTRA VEZ SERÁ!'
      ]);
      this._showResult(msg, '#757575');
      this.cpuScore++;
      this.shotResults.push(false);
    }

    this._updateHUDStats();
  }

  // ─── Loop de actualización (debug de hitboxes) ───────────────────
  update() {
    if (this.estado !== 'jugando') return;

    if (!this.hitbox.showDebug) {
      if (this.debugGraphics) this.debugGraphics.clear();
      return;
    }

    if (this.debugGraphics) this.debugGraphics.clear();

    const kx = this.keeperContainer.x;
    const ky = this.keeperContainer.y;
    const isFlipped = this.keeperSprite.flipX;
    const isNeutral = this.keeperSprite.texture.key === (this.keeperKeys?.neutral || 'keeper_neutral');
    const activeBoxes = isNeutral
      ? this.hitbox.boxesNeutral
      : this.hitbox.boxesSide;

    // Verde = cuerpo, Rojo = guante, Azul = pies, Amarillo = neutral
    const debugColors = [0x00ff00, 0xff4400, 0x0088ff, 0xffff00];

    activeBoxes.forEach((box, i) => {
      let ox = box.ox;
      if (isFlipped && !isNeutral) ox = -(box.ox + box.w);

      // Calculamos los 4 puntos rotados para dibujar la hitbox real
      const angleRad = this.keeperContainer.rotation;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      const getRotated = (x, y) => ({
        x: kx + x * cosA - y * sinA,
        y: ky + x * sinA + y * cosA
      });

      const p1 = getRotated(ox, box.oy);
      const p2 = getRotated(ox + box.w, box.oy);
      const p3 = getRotated(ox + box.w, box.oy + box.h);
      const p4 = getRotated(ox, box.oy + box.h);

      this.debugGraphics.lineStyle(2, debugColors[i % debugColors.length], 0.9);
      this.debugGraphics.strokePoints([p1, p2, p3, p4, p1]);

      // Punto de esquina para identificar cada caja
      this.debugGraphics.fillStyle(debugColors[i % debugColors.length], 1);
      this.debugGraphics.fillCircle(p1.x, p1.y, 5);
    });

    // Origen del portero (punto blanco central)
    this.debugGraphics.fillStyle(0xffffff, 1);
    this.debugGraphics.fillCircle(kx, ky, 5);

    // Portería (amarillo semitransparente)
    const goalCx = this.W / 2;
    const gWidth = this.W * this.hitbox.goalWidthRatio;
    const gTop = this.hitbox.goalTop;
    const gBot = this.H * this.hitbox.goalBottomRatio;

    this.debugGraphics.lineStyle(2, 0xffff00, 0.5);
    this.debugGraphics.strokeRect(goalCx - gWidth, gTop, gWidth * 2, gBot - gTop);
  }

  // ─── Resultados y estados ─────────────────────────────────────────
  _showResult(text, color) {
    this.phase = 'result';
    this.messageText.setText(text).setColor(color).setAlpha(1);

    this.time.delayedCall(1100, () => {
      this.messageText.setAlpha(0);
      this._resetRound();
    });
  }

  _resetRound() {
    if (this.shots >= SoccerScene.MAX_SHOTS) {
      this._gameOver();
      return;
    }

    this.keeperSprite
      .setTexture(this.keeperKeys.neutral)
      .setScale(this.scaleNeutral)
      .setFlipX(false)
      .setAngle(0);

    this.tweens.add({
      targets: [this.keeperContainer, this.keeperShadow],
      x: this.W / 2,
      y: (targets) => targets === this.keeperShadow ? this.H * 0.75 + 50 : this.H * 0.75,
      angle: 0,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: [this.ballSprite, this.ballShadow],
      x: this.W / 2,
      y: this.H - 35,
      scaleX: 0.032,
      scaleY: 0.032,
      duration: 300,
    });

    this.ballShadow.y = this.H - 35 + 15;
    this.hintText.setAlpha(1);
    this.phase = 'aim';
  }

  _gameOver() {
    this.phase = 'gameover';
    if (this.gameMusic) this.gameMusic.stop();
    this.sound.play('victoria');

    const { width: W, height: H } = this.scale;
    const won = this.score >= 3;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(300);

    const modal = this.add.container(W / 2, H / 2).setDepth(301);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a20, 0.95);
    bg.lineStyle(6, won ? 0xffd700 : 0x3b82f6, 1);
    bg.fillRoundedRect(-280, -230, 560, 460, 25);
    bg.strokeRoundedRect(-280, -230, 560, 460, 25);
    modal.add(bg);

    const title = this.add.text(0, -140, won ? '¡VICTORIA!' : 'FIN DEL JUEGO', {
      fontSize: '60px', fontFamily: 'Luckiest Guy', color: won ? '#ffd700' : '#ffffff',
      stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5);
    modal.add(title);

    const scoreLabel = this.add.text(0, -50, 'RESULTADO FINAL', {
      fontSize: '20px', fontFamily: 'Fredoka', color: '#aaaaaa'
    }).setOrigin(0.5);
    modal.add(scoreLabel);

    const scoreValue = this.add.text(0, 0, `${this.score} - ${this.cpuScore}`, {
      fontSize: '80px', fontFamily: 'Luckiest Guy', color: '#ffffff'
    }).setOrigin(0.5);
    modal.add(scoreValue);

    const btnRetry = this._createModalButton(0, 100, 'REINTENTAR', 0x2e7d32, () => {
      this.scene.restart({ escenarioId: this.escenarioActual, precisionExtra: this.precisionExtra });
    });
    modal.add(btnRetry);

    const btnMenu = this._createModalButton(0, 185, 'CAMBIAR TORNEO', 0x1565c0, () => {
      this.sound.stopAll();
      this.scene.start('SoccerScene');
    });
    modal.add(btnMenu);
  }

  _createModalButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-200, -35, 400, 70, 15);
    btn.add(bg);

    const txt = this.add.text(0, 0, label, {
      fontSize: '28px', fontFamily: 'Luckiest Guy', color: '#ffffff'
    }).setOrigin(0.5);
    btn.add(txt);

    const hit = this.add.rectangle(0, 0, 400, 70, 0x000000, 0).setInteractive({ cursor: 'pointer' });
    btn.add(hit);

    hit.on('pointerover', () => {
      this.tweens.add({ targets: btn, scale: 1.05, duration: 100 });
      bg.clear();
      bg.fillStyle(0xffffff, 0.2);
      bg.fillRoundedRect(-200, -35, 400, 70, 15);
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-200, -35, 400, 70, 15);
    });

    hit.on('pointerout', () => {
      this.tweens.add({ targets: btn, scale: 1, duration: 100 });
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-200, -35, 400, 70, 15);
    });

    hit.on('pointerdown', () => {
      this.sound.play('pop');
      callback();
    });

    return btn;
  }

  _resetGame() {
    this.scene.restart();
  }

  // ─── Compatibilidad con laser-impact externo ─────────────────────
  handleImpact(event) {
    const { x, y } = event.detail;
    this.particles.setPosition(x, y);
    this.particles.explode(25);
  }

  _getRandomMessage(options) {
    return options[Math.floor(Math.random() * options.length)];
  }

  _launchFireworks() {
    const W = this.W, H = this.H;
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff];

    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 350, () => {
        const x = Phaser.Math.Between(W * 0.15, W * 0.85);
        const y = Phaser.Math.Between(H * 0.15, H * 0.45);
        const color = colors[Phaser.Math.Between(0, colors.length - 1)];

        const burst = this.add.particles(x, y, 'sparkle', {
          speed: { min: 100, max: 600 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.5, end: 0 },
          tint: color,
          blendMode: 'ADD',
          lifespan: 1500,
          gravityY: 250,
          quantity: 50,
          emitting: false,
        }).setDepth(200);

        burst.explode(50);
        this.sound.play('pop', { volume: 0.4, detune: Phaser.Math.Between(-600, 600) });

        this.time.delayedCall(2000, () => {
          if (burst && burst.destroy) burst.destroy();
        });
      });
    }
  }

  _launchSingleFirework(x, y) {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff];
    const color = Phaser.Utils.Array.GetRandom(colors);

    const burst = this.add.particles(x, y, 'sparkle', {
      speed: { min: 150, max: 500 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      tint: color,
      blendMode: 'ADD',
      lifespan: 1200,
      gravityY: 350,
      quantity: 40,
      emitting: false,
    }).setDepth(600);

    burst.explode(40);
    this.sound.play('pop', { volume: 0.5, detune: Phaser.Math.Between(-600, 600) });

    this.time.delayedCall(1500, () => {
      if (burst) burst.destroy();
    });
  }

  shutdown() {
    window.removeEventListener('ws-message', this._impactHandler);
  }
}