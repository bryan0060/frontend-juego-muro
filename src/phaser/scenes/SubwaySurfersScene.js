import * as Phaser from 'phaser';

export class SubwaySurfersScene extends Phaser.Scene {
  constructor() {
    super('SubwaySurfersScene');
    this.player = null;
    this.lanes = [-350, 0, 350]; // Ajustados a la perspectiva de la nueva imagen
    this.currentLane = 1;
    this.isJumping = false;
    this.isSliding = false;
    this.gameSpeed = 7;
    this.score = 0;
    this.isGameOver = false;
    this.nextDifficultyScore = 1500;
  }

  preload() {
    // Escenario Base Generado
    this.load.image('background_mall', 'assets/images/subway/scenario_base.png');
    
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
    this.gameSpeed = 7;
    this.currentLane = 1;

    // 1. UI (Siempre al frente)
    this._createUI();

    // 2. Fondo del Mall (Imagen Generada de alta calidad)
    this.add.image(width / 2, height / 2, 'background_mall')
        .setDisplaySize(width, height)
        .setDepth(0);

    // 3. Personaje y Contenedores
    // Ubicado un poco más abajo para que coincida con el inicio de los carriles
    this.playerContainer = this.add.container(width / 2 + this.lanes[this.currentLane], height - 100);
    this.jumpContainer = this.add.container(0, 0);
    this.playerContainer.add(this.jumpContainer);

    this.player = this.add.sprite(0, 0, 'player').setScale(0.45).setOrigin(0.5);
    this.jumpContainer.add(this.player);
    this.playerContainer.setDepth(50);

    // 4. Logo en la esquina
    this.add.image(width - 250, 100, 'logo_game').setScale(0.4).setDepth(100);

    // 5. Timers
    this.spawnTimer = this.time.addEvent({ delay: 1000, callback: () => this._spawnCycle(), loop: true });
    this.timeScoreTimer = this.time.addEvent({ delay: 500, callback: () => this._updateScore(), loop: true });

    // 6. Líneas de movimiento en el suelo (para simular avance)
    this.floorStrips = this.add.group();
    this.time.addEvent({
        delay: 200,
        callback: () => this._spawnFloorStrip(),
        loop: true
    });

    // 7. Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-LEFT', () => this._setLane(Math.max(0, this.currentLane - 1)));
    this.input.keyboard.on('keydown-RIGHT', () => this._setLane(Math.min(2, this.currentLane + 1)));
    this.input.keyboard.on('keydown-UP', () => this._jump());
    this.input.keyboard.on('keydown-DOWN', () => this._slide());
  }

  _updateScore() {
    if (this.isGameOver) return;
    this.score += Math.floor(this.gameSpeed / 2);
    this.scoreText.setText(this.score);
    if (this.score >= this.nextDifficultyScore) {
        this.nextDifficultyScore += 1500;
        this.gameSpeed += 0.8;
        this.cameras.main.flash(400, 255, 255, 255, 0.05);
    }
  }

  _createUI() {
    const { width } = this.scale;
    this.scoreText = this.add.text(width / 2, 80, '0', {
      fontSize: '110px', color: '#ffffff', stroke: '#9c4eb3', strokeThickness: 10
    }).setOrigin(0.5).setDepth(100);
  }

  update() {
    if (this.isGameOver) return;
    
    const horizonY = this.scale.height * 0.45;
    
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
      
      obj.setScale(0.01 + progress * 0.8);
      obj.setAlpha(Phaser.Math.Clamp(progress * 4, 0, 1));

      if (obj.y > this.scale.height + 200) obj.destroy();

      // Colisiones
      const dist = Phaser.Math.Distance.Between(obj.x, obj.y, this.playerContainer.x, this.playerContainer.y);
      if (dist < 80 && obj.lane === this.currentLane) {
        if (this.obstacles && this.obstacles.contains(obj)) {
            if (!this.isJumping) this._gameOver();
        } else {
            this._collectSun(obj);
        }
      }
    });
  }

  _spawnCycle() {
    if (this.isGameOver) return;
    const lane = Phaser.Math.Between(0, 2);
    if (Phaser.Math.Between(0, 10) > 4) this._spawnObstacle(lane);
    else this._spawnCollectible(lane);
  }

  _spawnObstacle(lane) {
    if (!this.obstacles) this.obstacles = this.add.group();
    const type = Phaser.Math.RND.pick(['obs_castle', 'obs_rainbow', 'obs_valla']);
    const obs = this.add.sprite(this.scale.width / 2, this.scale.height * 0.45, type);
    obs.lane = lane;
    this.obstacles.add(obs);
  }

  _spawnCollectible(lane) {
    if (!this.collectibles) this.collectibles = this.add.group();
    const sun = this.add.sprite(this.scale.width / 2, this.scale.height * 0.45, 'sun');
    sun.lane = lane;
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

  _spawnFloorStrip() {
    if (this.isGameOver) return;
    const lane = Phaser.Math.Between(0, 2);
    const horizonY = this.scale.height * 0.45;
    
    const strip = this.add.rectangle(this.scale.width / 2, horizonY, 100, 10, 0xffffff, 0.3);
    strip.lane = lane;
    this.floorStrips.add(strip);
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

    // Botón Reintentar
    const btn = this.add.container(0, 140);
    const btnBg = this.add.rectangle(0, 0, 350, 90, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.restart());
    
    const btnText = this.add.text(0, 0, 'REINTENTAR', { 
        fontSize: '32px', color: '#9c4eb3', fontWeight: 'bold' 
    }).setOrigin(0.5);
    
    btn.add([btnBg, btnText]);
    panel.add(btn);

    // Animación de entrada
    panel.setScale(0);
    this.tweens.add({
        targets: panel,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
    });
  }
}
