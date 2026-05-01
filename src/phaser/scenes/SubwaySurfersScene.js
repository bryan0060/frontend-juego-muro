import * as Phaser from 'phaser';

export class SubwaySurfersScene extends Phaser.Scene {
  constructor() {
    super('SubwaySurfersScene');
    this.player = null;
    this.lanes = [-240, 0, 240]; 
    this.currentLane = 1;
    this.isJumping = false;
    this.isSliding = false;
    this.gameSpeed = 10;
    this.score = 0;
    this.isGameOver = false;
    this.stars = [];
    this.speedLines = [];
  }

  preload() {
    this.load.image('ship', 'https://labs.phaser.io/assets/sprites/shmup-ship.png');
    this.load.image('mine', 'https://labs.phaser.io/assets/sprites/spin-wheel.png');
    this.load.image('debris', 'https://labs.phaser.io/assets/sprites/asteroid.png');
    this.load.image('gem', 'https://labs.phaser.io/assets/sprites/diamond.png');
    this.load.image('fire', 'https://labs.phaser.io/assets/particles/muzzleflash3.png');
    this.load.image('line', 'https://labs.phaser.io/assets/sprites/white_pixel.png');
  }

  create() {
    const { width, height } = this.scale;
    this.isGameOver = false;
    this.score = 0;
    this.gameSpeed = 10;
    this.currentLane = 1;

    // --- 1. FONDO DINÁMICO ---
    this.add.rectangle(0, 0, width, height, 0x010105).setOrigin(0);
    
    // Campo de estrellas (Parallax)
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const s = this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
      this.stars.push({ obj: s, speed: Phaser.Math.FloatBetween(2, 12) });
    }

    // Líneas de velocidad en los bordes
    for (let i = 0; i < 20; i++) {
        const line = this.add.rectangle(
            Phaser.Math.Between(0, width), 
            Phaser.Math.Between(0, height), 
            2, Phaser.Math.Between(50, 150), 0x00ffff, 0.2
        );
        this.speedLines.push(line);
    }

    // --- 2. CARRILES DE ENERGÍA ---
    this.laneGraphics = this.add.graphics();
    this._drawEnergyLanes();

    // --- 3. NAVE ESPACIAL (CORREGIDA) ---
    this.playerContainer = this.add.container(width / 2 + this.lanes[this.currentLane], height - 180);
    
    this.thruster = this.add.particles(0, 40, 'fire', { // Ajustado a la base de la nave
      speed: { min: 100, max: 200 },
      angle: { min: 85, max: 95 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      blendMode: 'ADD'
    });
    this.playerContainer.add(this.thruster);

    this.player = this.add.sprite(0, 0, 'ship')
      .setScale(2)
      .setAngle(0); // Ahora está orientada correctamente (arriba)
    this.playerContainer.add(this.player);
    this.playerContainer.setDepth(20);

    // --- 4. GRUPOS ---
    this.obstacles = this.add.group();
    this.collectibles = this.add.group();

    // --- 5. UI ---
    this._createUI();

    // --- 6. CICLO ---
    this.spawnTimer = this.time.addEvent({ delay: 900, callback: () => this._spawnCycle(), loop: true });
    
    this.input.on('pointerdown', (p) => this._handleInput(p.x, p.y));
    window.addEventListener('ws-message', (e) => {
        if (!this.isGameOver) this._handleInput(e.detail.x, e.detail.y);
    });
  }

  update() {
    if (this.isGameOver) return;

    // Movimiento estrellas y líneas
    this.stars.forEach(s => {
      s.obj.y += s.speed;
      if (s.obj.y > this.scale.height) s.obj.y = 0;
    });

    this.speedLines.forEach(l => {
        l.y += this.gameSpeed * 2;
        if (l.y > this.scale.height) {
            l.y = -200;
            l.x = Phaser.Math.Between(0, this.scale.width);
        }
    });

    this._updateObjects(this.obstacles, true);
    this._updateObjects(this.collectibles, false);

    this.gameSpeed += 0.003;
  }

  _drawEnergyLanes() {
    const { width, height } = this.scale;
    const horizonY = height * 0.2;
    const centerX = width / 2;
    this.laneGraphics.clear();
    [-480, -160, 160, 480].forEach(xOff => {
      this.laneGraphics.lineStyle(15, 0x00ffff, 0.1);
      this.laneGraphics.beginPath();
      this.laneGraphics.moveTo(centerX + (xOff * 0.01), horizonY);
      this.laneGraphics.lineTo(centerX + xOff, height);
      this.laneGraphics.strokePath();
      this.laneGraphics.lineStyle(3, 0x00ffff, 0.4);
      this.laneGraphics.beginPath();
      this.laneGraphics.moveTo(centerX + (xOff * 0.01), horizonY);
      this.laneGraphics.lineTo(centerX + xOff, height);
      this.laneGraphics.strokePath();
    });
  }

  _createUI() {
    const { width, height } = this.scale;
    this.scoreText = this.add.text(width / 2, 100, '0', {
      fontSize: '100px', fontFamily: 'Orbitron', color: '#00ffff',
      stroke: '#004488', strokeThickness: 10
    }).setOrigin(0.5).setDepth(100);
  }

  _updateObjects(group, isObstacle) {
    group.getChildren().forEach(obj => {
      obj.y += this.gameSpeed;
      const horizonY = this.scale.height * 0.2;
      const progress = (obj.y - horizonY) / (this.scale.height - horizonY);
      const targetX = this.scale.width / 2 + this.lanes[obj.lane];
      const startX = this.scale.width / 2 + (this.lanes[obj.lane] * 0.01);
      obj.x = Phaser.Math.Linear(startX, targetX, progress);
      
      obj.setScale(0.1 + progress * 3.5);
      obj.setAlpha(Phaser.Math.Clamp(progress * 4, 0, 1));
      
      if (isObstacle) {
          obj.angle += obj.rotSpeed || 2;
          // Brillo pulsante para minas
          if (obj.texture.key === 'mine') {
              obj.setAlpha(0.6 + Math.sin(this.time.now / 100) * 0.4);
          }
      }

      if (obj.y > this.scale.height + 150) {
        obj.destroy();
        if (isObstacle) { this.score += 10; this.scoreText.setText(this.score); }
      }

      const dist = Phaser.Math.Distance.Between(obj.x, obj.y, this.playerContainer.x, this.playerContainer.y);
      if (dist < 85 && obj.lane === this.currentLane) {
        if (isObstacle) { if (!this.isJumping) this._gameOver(); }
        else { this._collectGem(obj); }
      }
    });
  }

  _spawnCycle() {
    const lane = Phaser.Math.Between(0, 2);
    if (Phaser.Math.Between(0, 10) > 3) this._spawnObstacle(lane);
    else this._spawnCollectible(lane);
  }

  _spawnObstacle(lane) {
    const type = Phaser.Math.Between(0, 1) === 0 ? 'mine' : 'debris';
    const obs = this.add.sprite(this.scale.width / 2, this.scale.height * 0.2, type);
    obs.lane = lane;
    obs.rotSpeed = Phaser.Math.FloatBetween(1, 5);
    if (type === 'mine') obs.setTint(0xff0000);
    else obs.setTint(0x888888);
    this.obstacles.add(obs);
  }

  _spawnCollectible(lane) {
    const gem = this.add.sprite(this.scale.width / 2, this.scale.height * 0.2, 'gem');
    gem.lane = lane;
    gem.setTint(0xFCBE2C);
    this.collectibles.add(gem);
  }

  _handleInput(x, y) {
    if (this.isGameOver) return;
    const { width, height } = this.scale;
    if (y < height * 0.3) this._jump();
    else if (y > height * 0.7) this._slide();
    else {
      if (x < width * 0.35) this._moveLane(-1);
      else if (x > width * 0.65) this._moveLane(1);
      else this.currentLane = 1;
    }
  }

  _moveLane(dir) {
    let next = this.currentLane + dir;
    if (next >= 0 && next <= 2) {
      this.currentLane = next;
      this.tweens.add({
        targets: this.playerContainer,
        x: this.scale.width / 2 + this.lanes[this.currentLane],
        duration: 150,
        ease: 'Back.easeOut'
      });
    }
  }

  _jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.tweens.add({
      targets: this.playerContainer,
      y: this.playerContainer.y - 220,
      duration: 400, yoyo: true, ease: 'Cubic.easeOut',
      onComplete: () => this.isJumping = false
    });
  }

  _slide() {
    if (this.isSliding) return;
    this.isSliding = true;
    this.tweens.add({
      targets: this.player,
      scaleX: 1, scaleY: 3,
      duration: 150, yoyo: true, hold: 400,
      onComplete: () => this.isSliding = false
    });
  }

  _collectGem(gem) {
    gem.destroy();
    this.score += 500;
    this.scoreText.setText(this.score);
    this.cameras.main.flash(100, 252, 190, 44, 0.2);
  }

  _gameOver() {
    this.isGameOver = true;
    this.thruster.stop();
    this.spawnTimer.remove();
    this.cameras.main.shake(600, 0.05);

    const { width, height } = this.scale;
    
    // Panel de Game Over
    const panel = this.add.container(width / 2, height / 2).setDepth(200);
    
    const bg = this.add.rectangle(0, 0, 600, 400, 0x000000, 0.8)
        .setStrokeStyle(4, 0x00ffff);
    panel.add(bg);

    const title = this.add.text(0, -100, 'SISTEMA CRÍTICO', {
        fontSize: '60px', fontFamily: 'Orbitron', color: '#ff0044'
    }).setOrigin(0.5);
    panel.add(title);

    const scoreFinal = this.add.text(0, -20, `SCORE: ${this.score}`, {
        fontSize: '40px', fontFamily: 'Orbitron', color: '#ffffff'
    }).setOrigin(0.5);
    panel.add(scoreFinal);

    // Botón Reiniciar
    const btn = this.add.container(0, 100);
    const btnBg = this.add.rectangle(0, 0, 300, 80, 0x00ffff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.restart());
    
    const btnText = this.add.text(0, 0, 'REINTENTAR', {
        fontSize: '32px', fontFamily: 'Orbitron', color: '#000000', fontWeight: 'bold'
    }).setOrigin(0.5);
    
    btn.add([btnBg, btnText]);
    panel.add(btn);

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
