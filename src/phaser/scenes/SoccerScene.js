import * as Phaser from 'phaser';

export class SoccerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SoccerScene' });

    // --- CONFIGURACIÓN DE HITBOX (Ajusta aquí) ---
    this.hitbox = {
      showDebug: false,

      // 4 cajas para cubrir toda la diagonal del portero en salto lateral
      boxesSide: [
        { ox: -320, oy: 0, w: 115, h: 130 }, 
        { ox: -175, oy: -90, w: 145, h: 210 }, 
        { ox: -35, oy: -70, w: 135, h: 150 }, 
        { ox: 110, oy: -140, w: 130, h: 175 }, 
      ],

      boxesNeutral: [
        { ox: -50, oy: -140, w: 100, h: 280 }
      ],

      goalTop: 40,
      goalWidthRatio: 0.45,
      goalBottomRatio: 0.95
    };
  }

  static MAX_SHOTS = 5;

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W;
    this.H = H;

    this.score = 0;
    this.cpuScore = 0;
    this.shots = 0;

    // El fondo se construye en _buildGraphics para mayor control de capas
    this.phase = 'aim';

    this._buildGraphics();
    this._buildHUD();
    this._buildInput();

    this._impactHandler = this.handleImpact.bind(this);
    window.addEventListener('ws-message', this._impactHandler);
  }

  // ─── Construcción de gráficos ────────────────────────────────────
  _buildGraphics() {
    const W = this.W, H = this.H;

    // 1. Fondo Negro Profundo
    this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0);

    // 2. Gradas / Hinchas (Integrados con sutileza en el fondo)
    const fans = this.add.image(W / 2, H * 0.5, 'fans_bg')
      .setDisplaySize(W, H)
      .setAlpha(0.2)
      .setDepth(1);
    
    // 3. Degradados para enfoque (Efecto Viñeta)
    const vignette = this.add.graphics().setDepth(2);
    // Degradado superior a negro
    vignette.fillGradientStyle(0x000000, 0x000000, 0x080808, 0x080808, 1, 1, 0, 0);
    vignette.fillRect(0, 0, W, H * 0.4);
    // Degradado inferior para el suelo
    vignette.fillGradientStyle(0x080808, 0x080808, 0x000000, 0x000000, 0, 0, 1, 1);
    vignette.fillRect(0, H * 0.6, W, H * 0.4);

    // 4. Vallas publicitarias (Minimalistas en negro)
    this._drawAdBoards();

    // 5. Portería
    this._drawGoal();

    // 6. Portero y Sombra sutil
    this.keeperShadow = this.add.ellipse(W / 2, H * 0.75 + 50, 140, 35, 0x000000, 0.5)
      .setDepth(4);
    
    this.keeperContainer = this.add.container(W / 2, H * 0.75).setDepth(5);
    this._buildKeeper();

    // 7. Balón y su sombra
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

    this.debugGraphics = this.add.graphics().setDepth(1000);
  }

  // Eliminado _drawPitch por petición del usuario

  _drawAdBoards() {
    const W = this.W, H = this.H;
    const y = H * 0.75; // Alineado con los pies del portero
    const boardHeight = 60;
    const g = this.add.graphics().setDepth(3);

    // Fondo de la valla (Gris casi negro)
    g.fillStyle(0x111111, 0.8);
    g.fillRect(0, y, W, boardHeight);

    // Borde superior sutil
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

    // Red (Hilos finos)
    g.lineStyle(1, 0xffffff, 0.1);

    for (let x = cx - bWid; x <= cx + bWid; x += 40) {
      g.strokeLineShape(new Phaser.Geom.Line(x, bTop, x, bBot));
    }
    for (let y = bTop; y <= bBot; y += 30) {
      g.strokeLineShape(new Phaser.Geom.Line(cx - bWid, y, cx + bWid, y));
    }

    // Estructura trasera
    g.lineStyle(4, 0x888888, 0.5);
    g.strokeLineShape(new Phaser.Geom.Line(cx - bWid, bTop, cx + bWid, bTop));
    g.strokeLineShape(new Phaser.Geom.Line(cx - bWid, bBot, cx + bWid, bBot));
    g.strokeLineShape(new Phaser.Geom.Line(cx - bWid, bTop, cx - bWid, bBot));
    g.strokeLineShape(new Phaser.Geom.Line(cx + bWid, bTop, cx + bWid, bBot));

    // Postes frontales (Principales) - Con brillo
    g.lineStyle(20, 0xffffff, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - fWid, fTop, cx + fWid, fTop));
    g.strokeLineShape(new Phaser.Geom.Line(cx - fWid, fTop, cx - fWid, fBot));
    g.strokeLineShape(new Phaser.Geom.Line(cx + fWid, fTop, cx + fWid, fBot));

    // Base lateral
    g.lineStyle(8, 0xcccccc, 0.3);
    g.strokeLineShape(new Phaser.Geom.Line(cx - fWid, fBot, cx - bWid, bBot));
    g.strokeLineShape(new Phaser.Geom.Line(cx + fWid, fBot, cx + bWid, bBot));
  }

  _drawPenaltyArea() {
    const g = this.add.graphics();
    const cx = this.W / 2;
    const H = this.H;
    const goalBottom = H * 0.95;

    g.lineStyle(5, 0xffffff, 0.6);

    const topW = this.W * 0.48;
    const botW = this.W * 0.9;
    const depth = H * 0.15;

    g.beginPath();
    g.moveTo(cx - topW, goalBottom);
    g.lineTo(cx + topW, goalBottom);
    g.lineTo(cx + botW, goalBottom + depth);
    g.lineTo(cx - botW, goalBottom + depth);
    g.closePath();
    g.strokePath();

    const cTopW = this.W * 0.25;
    const cBotW = this.W * 0.4;
    const cDepth = H * 0.05;

    g.beginPath();
    g.moveTo(cx - cTopW, goalBottom);
    g.lineTo(cx + cTopW, goalBottom);
    g.lineTo(cx + cBotW, goalBottom + cDepth);
    g.lineTo(cx - cBotW, goalBottom + cDepth);
    g.closePath();
    g.strokePath();
  }

  _buildKeeper() {
    this.scaleNeutral = 0.95;
    this.scaleSide = 0.95;

    const sp = this.add.sprite(0, 0, 'keeper_neutral');
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

    // ── UI — Mensajes centrales ────────────────────────────────
    this.messageText = this.add.text(W / 2, H / 2 - 10, '', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(120).setAlpha(0);

    this.hintText = this.add.text(W / 2, this.H - 85, 'APUNTA Y DISPARA', {
      fontSize: '16px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(100);

    // Animación de respiración para el texto
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
    const cy = 60; // Altura del marcador

    this.scoreboardGraphics = this.add.graphics().setDepth(100);
    
    // Texto de equipos y puntajes
    this.scoreJUG = this.add.text(cx - 150, cy, '0', {
      fontSize: '38px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5).setDepth(101);

    this.scoreCPU = this.add.text(cx + 150, cy, '0', {
      fontSize: '38px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5).setDepth(101);

    this.teamJUG = this.add.text(cx - 75, cy, 'JUG', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5).setDepth(101);

    this.teamCPU = this.add.text(cx + 75, cy, 'CPU', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5).setDepth(101);

    this.shotsCounterText = this.add.text(cx, cy + 5, '0/5', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#00ff00'
    }).setOrigin(0.5).setDepth(101);

    this._drawScoreboardGraphics();
  }

  _drawScoreboardGraphics() {
    const g = this.scoreboardGraphics;
    g.clear();
    const cx = this.W / 2;
    const cy = 60;

    // 1. Barra central negra (fondo de nombres y tiempo)
    g.fillStyle(0x1a1a1a, 0.9);
    // x1, y1, x2, y2, x3, y3, x4, y4 (Trapecio central)
    g.fillPoints([
      { x: cx - 180, y: cy - 25 },
      { x: cx + 180, y: cy - 25 },
      { x: cx + 200, y: cy + 25 },
      { x: cx - 200, y: cy + 25 }
    ], true);

    // 2. Bloque Score Izquierdo (Verde)
    g.fillStyle(0x2e7d32, 1);
    g.fillPoints([
      { x: cx - 240, y: cy - 25 },
      { x: cx - 180, y: cy - 25 },
      { x: cx - 200, y: cy + 25 },
      { x: cx - 260, y: cy + 25 }
    ], true);

    // 3. Bloque Score Derecho (Verde)
    g.fillStyle(0x2e7d32, 1);
    g.fillPoints([
      { x: cx + 180, y: cy - 25 },
      { x: cx + 240, y: cy - 25 },
      { x: cx + 260, y: cy + 25 },
      { x: cx + 200, y: cy + 25 }
    ], true);

    // 4. Detalle superior (decoración verde)
    g.fillStyle(0x4caf50, 1);
    g.fillRect(cx - 60, cy - 35, 120, 10);
    
    // Bordes
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeRect(cx - 60, cy - 35, 120, 10);
  }

  _updateHUDStats() {
    if (this.scoreJUG) this.scoreJUG.setText(this.score);
    if (this.scoreCPU) this.scoreCPU.setText(this.cpuScore);
    if (this.shotsCounterText) this.shotsCounterText.setText(`${this.shots}/${SoccerScene.MAX_SHOTS}`);
  }

  // ─── Input ───────────────────────────────────────────────────────
  _buildInput() {
    this.input.on('pointermove', (ptr) => {
      if (this.phase !== 'aim') return;
      this.aimX = ptr.x;
      this.aimY = ptr.y;
    });

    this.input.on('pointerdown', (ptr) => {
      if (this.phase === 'gameover') {
        this._resetGame();
        return;
      }
      if (this.phase !== 'aim') return;
      this._shoot(ptr.x, ptr.y);
    });
  }

  // ─── Lógica de disparo ───────────────────────────────────────────
  _shoot(tx, ty) {
    this.phase = 'shoot';
    this.shots++;
    this._updateHUDStats();
    this.hintText.setAlpha(0);

    const intelligence = Math.min(this.score * 0.22, 0.95);
    const randomDir = Math.random() > 0.5 ? 1 : -1;
    const randomDestX = this.W / 2 + randomDir * 280;

    let keeperDestX = randomDestX * (1 - intelligence) + tx * intelligence;
    keeperDestX = Phaser.Math.Clamp(
      keeperDestX,
      this.W / 2 - this.W * 0.5,
      this.W / 2 + this.W * 0.5
    );

    const jumpPower = Phaser.Math.Clamp(
      Math.max(120, (this.H * 0.75 - ty) * 0.9),
      0,
      350
    );

    const reactionTime = Math.max(240, 380 - (this.score * 40));

    this.keeperSprite.setTexture('keeper_side');
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
      scaleX: 0.015,
      scaleY: 0.015,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => this._evaluateShot(tx, ty, keeperDestX),
    });
  }

  _evaluateShot(tx, ty, keeperDest) {
    const cx = this.W / 2;
    const isFlipped = this.keeperSprite.flipX;
    const isNeutral = this.keeperSprite.texture.key === 'keeper_neutral';
    const activeBoxes = isNeutral
      ? this.hitbox.boxesNeutral
      : this.hitbox.boxesSide;

    const blocked = activeBoxes.some(box => {
      let ox = box.ox;
      if (isFlipped && !isNeutral) ox = -box.ox - box.w;

      const bLeft = keeperDest + ox;
      const bRight = bLeft + box.w;
      const bTop = this.keeperContainer.y + box.oy;
      const bBot = bTop + box.h;

      return tx > bLeft && tx < bRight && ty > bTop && ty < bBot;
    });

    const inGoal =
      tx > cx - this.W * this.hitbox.goalWidthRatio &&
      tx < cx + this.W * this.hitbox.goalWidthRatio &&
      ty > this.hitbox.goalTop &&
      ty < this.H * this.hitbox.goalBottomRatio;

    if (inGoal && !blocked) {
      this._showResult('GOL!', '#4CAF50');
      this.score++;
      this.sound.play('gol'); // Sonido de gol
      this.cameras.main.shake(250, 0.012);
      this.particles.setPosition(tx, ty);
      this.particles.explode(40);
    } else {
      this._showResult('ATAJADO', '#f44336');
      this.cpuScore++;
    }

    this._updateHUDStats();

    window.dispatchEvent(new CustomEvent('laser-impact', { detail: { x: tx, y: ty } }));
  }

  // ─── Loop de actualización (debug) ───────────────────────────────
  update() {
    if (!this.hitbox.showDebug) {
      this.debugGraphics.clear();
      return;
    }

    this.debugGraphics.clear();

    const kx = this.keeperContainer.x;
    const ky = this.keeperContainer.y;
    const isFlipped = this.keeperSprite.flipX;
    const isNeutral = this.keeperSprite.texture.key === 'keeper_neutral';
    const activeBoxes = isNeutral
      ? this.hitbox.boxesNeutral
      : this.hitbox.boxesSide;

    // Color distinto por caja para identificar fácilmente cuál ajustar
    const debugColors = [0x00ff00, 0x00ffaa, 0x00aaff, 0xffff00];

    activeBoxes.forEach((box, i) => {
      let ox = box.ox;
      if (isFlipped && !isNeutral) ox = -box.ox - box.w;

      this.debugGraphics.lineStyle(2, debugColors[i % debugColors.length], 0.9);
      this.debugGraphics.strokeRect(kx + ox, ky + box.oy, box.w, box.h);

      // Punto en esquina superior izquierda para identificar caja
      this.debugGraphics.fillStyle(debugColors[i % debugColors.length], 1);
      this.debugGraphics.fillCircle(kx + ox + 8, ky + box.oy + 10, 5);
    });

    // Origen del portero
    this.debugGraphics.fillStyle(0xffffff, 1);
    this.debugGraphics.fillCircle(kx, ky, 5);

    // Portería (amarillo)
    const cx = this.W / 2;
    const gWidth = this.W * this.hitbox.goalWidthRatio;
    const gTop = this.hitbox.goalTop;
    const gBot = this.H * this.hitbox.goalBottomRatio;

    this.debugGraphics.lineStyle(2, 0xffff00, 0.5);
    this.debugGraphics.strokeRect(cx - gWidth, gTop, gWidth * 2, gBot - gTop);
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
      .setTexture('keeper_neutral')
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

    this.keeperSprite
      .setTexture('keeper_neutral')
      .setScale(this.scaleNeutral)
      .setFlipX(false)
      .setAngle(0);

    this.tweens.add({
      targets: this.keeperContainer,
      x: this.W / 2,
      y: this.H * 0.75,
      angle: 0,
      duration: 500,
      ease: 'Power2'
    });

    const won = this.score >= 3;
    const text = won
      ? `GANASTE\n${this.score}/${SoccerScene.MAX_SHOTS} GOLES`
      : `VUELVE A INTENTAR\n${this.score}/${SoccerScene.MAX_SHOTS} GOLES`;
    const color = won ? '#ffd700' : '#f44336';

    this.messageText
      .setText(text)
      .setColor(color)
      .setAlpha(1)
      .setFontSize('28px');

    this.hintText.setText('Clic para jugar de nuevo').setAlpha(1);

    // El sonido de victoria suena siempre al final
    this.sound.play('victoria');
  }

  _resetGame() {
    this.score = 0;
    this.cpuScore = 0;
    this.shots = 0;
    this._updateHUDStats();
    this.messageText.setAlpha(0).setFontSize('48px');
    this.hintText.setText('APUNTA Y DISPARA').setAlpha(1);
    this.keeperContainer.setPosition(this.W / 2, this.H * 0.75).setAngle(0);
    this.keeperSprite
      .setTexture('keeper_neutral')
      .setScale(this.scaleNeutral)
      .setFlipX(false)
      .setAngle(0);
    this.ballSprite.setPosition(this.W / 2, this.H - 35).setScale(0.032);
    this.ballShadow.setPosition(this.W / 2, this.H - 35 + 15).setScale(1.5);
    this.phase = 'aim';
  }

  // ─── Compatibilidad con laser-impact externo ─────────────────────
  handleImpact(event) {
    const { x, y } = event.detail;
    this.particles.setPosition(x, y);
    this.particles.explode(25);
  }

  shutdown() {
    window.removeEventListener('ws-message', this._impactHandler);
  }
}