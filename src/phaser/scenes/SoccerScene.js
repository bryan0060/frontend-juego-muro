import * as Phaser from 'phaser';

export class SoccerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SoccerScene' });
  }

  static MAX_SHOTS = 5; // define el imite de tiros

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W;
    this.H = H;

    this.score = 0;
    this.shots = 0;
    this.phase = 'aim';

    this._buildGraphics();
    this._buildHUD();
    this._buildInput();

    this._impactHandler = this.handleImpact.bind(this);
    window.addEventListener('laser-impact', this._impactHandler);
  }
  //Construcción de gráficos
  _buildGraphics() {
    const W = this.W, H = this.H;

    // Fondo oscuro del estadio (arriba del horizonte)
    this.add.rectangle(W / 2, 140, W, 280, 0x0a0a0a);

    // Cielo (gradiente simple con 2 rectángulos)
    this.add.rectangle(W / 2, 40, W, 80, 0x1a1a2e);

    // Vallas Publicitarias (detrás de la portería)
    this._drawAdBoards();

    // Césped con PERSPECTIVA (Franjas horizontales)
    const horizonY = 280;
    const fieldHeight = H - horizonY;
    const numStripes = 14;
    
    let lastY = horizonY;
    for (let i = 1; i <= numStripes; i++) {
      // Proporción cuadrática para simular perspectiva
      const ratio = Math.pow(i / numStripes, 1.8);
      const currentY = horizonY + ratio * fieldHeight;
      const stripeHeight = currentY - lastY;
      
      const color = i % 2 === 0 ? 0x2e7d32 : 0x388e3c;
      this.add.rectangle(W / 2, lastY + stripeHeight / 2, W, stripeHeight, color);
      lastY = currentY;
    }

    // Portería
    this._drawGoal();

    // Punto de penalti
    this.add.circle(W / 2, H - 60, 3, 0xffffff);

    // Área (rectángulos de líneas)
    this._drawPenaltyArea();

    // Portero (Base en los pies para evitar "flotado")
    this.keeperContainer = this.add.container(W / 2, 320);
    this._buildKeeper();

    // Sombra del balón
    this.ballShadow = this.add.ellipse(W / 2, H - 50 + 12, 26, 8, 0x000000, 0.18);

    // Balón en punto de penalti
    this.ballSprite = this._createBall(W / 2, H - 50);

    // Partículas de gol
    this.particles = this.add.particles(0, 0, '__DEFAULT', {
      speed: { min: 80, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      tint: [0xffd700, 0xff6600, 0xffffff],
      blendMode: 'ADD',
      lifespan: 700,
      quantity: 30,
      emitting: false,
    });

    // Cursor de puntería
    this.aimGraphics = this.add.graphics();
    this.aimX = W / 2;
    this.aimY = 180;
  }

  _drawAdBoards() {
    const W = this.W;
    const y = 280;
    const boardHeight = 45;
    
    // Base de las vallas
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.8);
    g.fillRect(0, y - boardHeight, W, boardHeight);
    
    // Línea blanca decorativa simple
    g.lineStyle(2, 0xffffff, 0.2);
    g.strokeRect(0, y - boardHeight, W, boardHeight);
  }


  _drawGoal() {
    const g = this.add.graphics();
    const cx = this.W / 2;
    const top = 55;
    const bottom = 280; // Muy alta
    const width = 330;  // Ancho total 660

    // Red
    g.lineStyle(1, 0xffffff, 0.2);
    for (let x = cx - width + 10; x <= cx + width; x += 30) {
      g.strokeLineShape(new Phaser.Geom.Line(x, top, x, bottom));
    }
    for (let y = top + 20; y < bottom; y += 25) {
      g.strokeLineShape(new Phaser.Geom.Line(cx - width, y, cx + width, y));
    }
    // Postes y travesaño (Más gruesos)
    g.lineStyle(8, 0xf5f5f5, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - width, top, cx - width, bottom));
    g.strokeLineShape(new Phaser.Geom.Line(cx + width, top, cx + width, bottom));
    g.strokeLineShape(new Phaser.Geom.Line(cx - width, top, cx + width, top));
  }

  _drawPenaltyArea() {
    const g = this.add.graphics();
    const cx = this.W / 2;
    const goalBottom = 280;
    g.lineStyle(3, 0xffffff, 0.4);
    // Área grande (Cubre casi toda la pantalla)
    g.strokeRect(cx - 400, goalBottom - 5, 800, 160);
    // Área chica
    g.strokeRect(cx - 220, goalBottom - 5, 440, 65);
  }

  _buildKeeper() {
    // Iniciamos con la pose neutral
    const sp = this.add.sprite(0, 0, 'keeper_neutral');

    // Escala y Origen (1 = Pies en el suelo)
    sp.setScale(0.15);
    sp.setOrigin(0.5, 1);

    this.keeperContainer.add(sp);
    this.keeperSprite = sp;
  }

  _createBall(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0xffffff);
    g.fillCircle(0, 0, 10);
    g.lineStyle(1, 0x222222);
    g.strokeCircle(0, 0, 10);
    g.fillStyle(0x222222);
    g.fillTriangle(0, -5, -4, 1, 4, 1);
    g.x = x;
    g.y = y;
    return g;
  }

  _buildHUD() {
    const W = this.W;
    
    // Marcador TV (Top Left)
    const hudGroup = this.add.container(40, 40).setDepth(100);
    
    // Fondo estilizado (FC26 style)
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(0, 0, 220, 60, 4);
    bg.lineStyle(2, 0xffffff, 0.1);
    bg.strokeRoundedRect(0, 0, 220, 60, 4);
    
    // Franja azul viva
    bg.fillStyle(0x0072ce, 1);
    bg.fillRect(0, 0, 6, 60);
    
    hudGroup.add(bg);

    // Textos del marcador
    this.teamText = this.add.text(20, 15, 'MCI   0 - 0   PSG', {
      fontSize: '18px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    
    this.matchInfoText = this.add.text(20, 40, 'PENALTY SHOOTOUT', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
      letterSpacing: 2
    }).setOrigin(0, 0.5);

    hudGroup.add([this.teamText, this.matchInfoText]);
    
    this.scoreText = this.teamText; // Alias para compatibilidad

    // Contador de tiros (Esquina inferior derecha de la pantalla, pequeño)
    this.shotsInfo = this.add.text(this.W - 20, this.H - 20, '', {
      fontSize: '14px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 1).setDepth(100);
    
    this._updateHUDStats();

    // Mensaje central
    this.messageText = this.add.text(W / 2, this.H / 2 - 10, '', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(120).setAlpha(0);

    // Instrucción
    this.hintText = this.add.text(W / 2, this.H - 80, 'APUNTA Y DISPARA', {
      fontSize: '14px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5).setDepth(100);
  }

  _updateHUDStats() {
    this.teamText.setText(`JUG   ${this.score} - 0   CPU`);
    this.shotsInfo.setText(`TIROS: ${this.shots} / ${SoccerScene.MAX_SHOTS}`);
  }

  // ─── Input ──────────────────────────────────────────────────────
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

  // ─── Lógica de disparo ──────────────────────────────────────────
  _shoot(tx, ty) {
    this.phase = 'shoot';
    this.shots++;
    this._updateHUDStats();
    this.hintText.setAlpha(0);

    // Portero se lanza al azar (rango mucho más amplio)
    const dir = Math.random() > 0.5 ? 1 : -1;
    const keeperDest = this.W / 2 + dir * 250;

    // CAMBIO DE POSE:
    this.keeperSprite.setTexture('keeper_side');
    if (dir === 1) {
      this.keeperSprite.setFlipX(true);  // Derecha (espejo)
    } else {
      this.keeperSprite.setFlipX(false); // Izquierda (original)
    }

    this.tweens.add({
      targets: this.keeperContainer,
      x: keeperDest,
      y: 320 - 70, // Altura media de salto
      angle: dir * 40,
      duration: 450,
      ease: 'Quad.easeOut',
    });

    // Balón vuela hacia el destino
    this.tweens.add({
      targets: [this.ballSprite, this.ballShadow],
      x: tx,
      y: ty,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => this._evaluateShot(tx, ty, keeperDest),
    });
  }

  _evaluateShot(tx, ty, keeperDest) {
    const cx = this.W / 2;
    // Hitbox afinada para la escala 0.15
    const kLeft = keeperDest - 88;
    const kRight = keeperDest + 88;
    const kTop = this.keeperContainer.y - 100;
    const kBot = this.keeperContainer.y + 20;

    const inGoal = tx > cx - 320 && tx < cx + 320 && ty > 55 && ty < 285;
    const blocked = tx > kLeft && tx < kRight && ty > kTop && ty < kBot;

    if (inGoal && !blocked) {
      this._showResult('GOL!', '#4CAF50');
      this.score++;
      this.cameras.main.shake(250, 0.012);
      this.particles.setPosition(tx, ty);
      this.particles.explode(40);
    } else {
      this._showResult('ATAJADO', '#f44336');
    }

    this._updateHUDStats();

    // Evento externo (compatibilidad con laser-impact)
    window.dispatchEvent(new CustomEvent('laser-impact', { detail: { x: tx, y: ty } }));
  }

  _showResult(text, color) {
    this.phase = 'result';
    this.messageText
      .setText(text)
      .setColor(color)
      .setAlpha(1);

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
    // Reponer balón y portero inmediatamente
    this.keeperSprite.setTexture('keeper_neutral').setFlipX(false).setAngle(0);

    this.tweens.add({
      targets: this.keeperContainer,
      x: this.W / 2,
      y: 320,
      angle: 0,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: [this.ballSprite, this.ballShadow],
      x: this.W / 2,
      y: this.H - 50,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
    });
    this.ballShadow.y = this.H - 50 + 12;
    this.hintText.setAlpha(1);
    this.phase = 'aim';
  }

  _gameOver() {
    this.phase = 'gameover';

    // Regresar al centro y pose neutral al terminar
    this.keeperSprite.setTexture('keeper_neutral').setFlipX(false).setAngle(0);
    this.tweens.add({
      targets: this.keeperContainer,
      x: this.W / 2,
      y: 320,
      angle: 0,
      duration: 500,
      ease: 'Power2'
    });

    const won = this.score >= 3;
    const text = won ? `GANASTE\n${this.score}/${SoccerScene.MAX_SHOTS} GOLES` : `PERDISTE\n${this.score}/${SoccerScene.MAX_SHOTS} GOLES`;
    const color = won ? '#ffd700' : '#f44336';
    this.messageText.setText(text).setColor(color).setAlpha(1).setFontSize('28px');
    this.hintText.setText('Clic para jugar de nuevo').setAlpha(1);

    if (won) {
      this.sound.play('victoria');
    }
  }

  _resetGame() {
    this.score = 0;
    this.shots = 0;
    this._updateHUDStats();
    this.messageText.setAlpha(0).setFontSize('48px');
    this.hintText.setText('APUNTA Y DISPARA').setAlpha(1);
    this.keeperContainer.setPosition(this.W / 2, 320).setAngle(0);
    this.keeperSprite.setTexture('keeper_neutral').setFlipX(false).setAngle(0);
    this.ballSprite.setPosition(this.W / 2, this.H - 50).setScale(1);
    this.ballShadow.setPosition(this.W / 2, this.H - 50 + 12).setScale(1);
    this.phase = 'aim';
  }

  // ─── Compatibilidad con laser-impact externo ────────────────────
  handleImpact(event) {
    const { x, y } = event.detail;
    this.particles.setPosition(x, y);
    this.particles.explode(20);
  }

  update() {
    this.aimGraphics.clear();
    if (this.phase !== 'aim') return;
    const ax = this.aimX, ay = this.aimY;
    this.aimGraphics.lineStyle(2, 0xffdd00, 0.85);
    this.aimGraphics.strokeCircle(ax, ay, 8);
    this.aimGraphics.strokeLineShape(new Phaser.Geom.Line(ax - 14, ay, ax + 14, ay));
    this.aimGraphics.strokeLineShape(new Phaser.Geom.Line(ax, ay - 14, ax, ay + 14));
  }

  shutdown() {
    window.removeEventListener('laser-impact', this._impactHandler);
  }
}