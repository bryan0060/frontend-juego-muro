import * as Phaser from 'phaser';

export class MagicBoardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MagicBoardScene' });
  }

  create() {
    const { width, height } = this.scale;

    // --- 1. CONFIGURACIÓN DE PLANETAS ---
    this.bgIndex = 0;
    this.planets = [
      { name: 'SOL', colors: [0x1a0a00, 0x3a1a00, 0x5a2a00, 0x8a3a00], accent: 0xffaa00, planetColor: 0xff4400, type: 'sun' },
      { name: 'TIERRA', colors: [0x020208, 0x050515, 0x0a1a3a, 0x1a2a4a], accent: 0x40c0dd, planetColor: 0x224488, type: 'earth' },
      { name: 'MAGMA', colors: [0x050000, 0x1a0505, 0x3a0a05, 0x5a1a05], accent: 0xff3300, planetColor: 0x220000, type: 'magma' },
      { name: 'JUPITER', colors: [0x1a0f05, 0x2a1a0f, 0x3a2a1a, 0x5a3a2a], accent: 0xfa804f, planetColor: 0x6e4a2e, type: 'striped' },
      { name: 'SATURNO', colors: [0x1a1505, 0x2a250f, 0x4e4a1e, 0x6e6a3e], accent: 0xfdbf2c, planetColor: 0x6e5a1e, type: 'ringed' },
      { name: 'URANO', colors: [0x051a1a, 0x0a3a3a, 0x1a5a5a, 0x2a8a8a], accent: 0x33ffff, planetColor: 0x2a8a8a, type: 'gas' },
      { name: 'VOLCAN', colors: [0x0a050f, 0x1a0a2a, 0x2a1a4a, 0x3a2a6a], accent: 0x9c4eb3, planetColor: 0x4e2a6e, type: 'volcanic' },
      { name: 'LUNA', colors: [0x050505, 0x1a1a1a, 0x2a2a2a, 0x3a3a3a], accent: 0xffffff, planetColor: 0x666666, type: 'craters' },
      { name: 'DESIERTO', colors: [0x1a1005, 0x3a2a15, 0x5a4a25, 0x7a6a35], accent: 0xfa804f, planetColor: 0x8a6a3a, type: 'rocky' },
      { name: 'NEPTUNO', colors: [0x050515, 0x0a0a25, 0x1a1a4a, 0x2a2a6a], accent: 0x40c0dd, planetColor: 0x1a1a4a, type: 'gas' }
    ];

    // --- 2. ELEMENTOS DE FONDO ---
    this.bg = this.add.graphics().setDepth(0);
    this.nebulaGraphics = this.add.graphics().setDepth(0.5);
    this.starGraphics = this.add.graphics().setDepth(1);
    this.moonGraphics = this.add.graphics().setDepth(1.5);
    this.planetGraphics = this.add.graphics().setDepth(2);
    this.planetCenter = { x: width / 2, y: height / 2, radius: 300 };
    this._updatePlanetGraphics();

    // --- 3. LIENZO Y HISTORIAL ---
    this.canvasTexture = this.textures.createCanvas('drawingCanvas', width, height);
    this.canvasImage = this.add.image(0, 0, 'drawingCanvas').setOrigin(0).setDepth(5);
    
    // Se crea dinámicamente al seleccionar un boceto
    this.bocetoImage = null;
    
    // --- 4. PLANTILLA DE FONDO ---
    this.plantillaImg = this.add.image(width / 2, height / 2, 'plantilla').setDepth(1).setVisible(false);
    // Escalar plantilla para que cubra toda la pantalla o el área principal
    const scaleX = width / this.plantillaImg.width;
    const scaleY = height / this.plantillaImg.height;
    this.plantillaImg.setScale(Math.max(scaleX, scaleY));

    this.ctx = this.canvasTexture.context;
    
    // --- 4. PLANTILLA DE FONDO ---
    // Eliminado el bloque duplicado que causaba conflictos
    this.history = [];
    this.isDrawing = false;

    this.brushStyle = 'shootingStar';
    this.brushSize = 16;
    this.eraserSize = 60;
    this.availableColors = [
      { id: 'white', hex: 0xffffff, str: '255, 255, 255' },
      { id: 'red', hex: 0xff3333, str: '255, 51, 51' },
      { id: 'green', hex: 0x33ff33, str: '51, 255, 51' },
      { id: 'blue', hex: 0x3399ff, str: '51, 153, 255' },
      { id: 'yellow', hex: 0xffff33, str: '255, 255, 51' },
      { id: 'purple', hex: 0xff33ff, str: '255, 51, 255' },
      { id: 'rainbow', hex: 0xffffff, str: 'rainbow', icon: '🌈' }
    ];
    this.selectedColor = this.availableColors[0];
    this.lastX = null;
    this.lastY = null;
    
    // Para el sistema de hold
    this.pressedBtn = null;
    this.holdGraphics = this.add.graphics().setDepth(1500);

    // --- 4. PARTÍCULAS ---
    this.particles = this.add.particles(0, 0, '__DEFAULT', {
      scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
      speed: { min: 60, max: 200 }, lifespan: 400, blendMode: 'ADD'
    }).setDepth(10);

    // --- 5. BOTONES PRINCIPALES ---
    this.buttons = [];
    // Arriba Derecha
    this._createElegantButton(width - 100, 100, '🌌', 'VIAJAR', () => this._warpTravel(), 2000);
    // Abajo Derecha
    this._createElegantButton(width - 100, height - 100, '✨', 'BORRAR TODO', () => this._supernovaClear(), 2000);
    this._createElegantButton(width - 240, height - 100, '↩️', 'ATRÁS', () => this._undo(), 2000);
    this._createElegantButton(width - 380, height - 100, '🧽', 'BORRADOR', () => this._toggleEraserMenu(), 2000);
    
    // Abajo Izquierda
    this._createElegantButton(100, height - 100, '✏️', 'ESTILO', () => this._toggleStyleMenu(), 2000);
    this._createElegantButton(240, height - 100, '🎨', 'COLOR', () => this._toggleColorMenu(), 2000);
    this._createElegantButton(380, height - 100, '🖼️', 'BOCETO', () => this._toggleBocetoMenu(), 2000);
    this._createElegantButton(520, height - 100, '🖌️', 'PINCEL', () => this._toggleBrushMenu(), 2000);

    // --- 6. MENÚS DESPLEGABLES ---
    this._createStyleMenu();
    this._createColorMenu();
    this._createBocetoMenu();
    this._createEraserMenu();
    this._createBrushMenu();

    // --- 7. INPUTS Y SENSOR ---
    this._setupInputs();
    this._impactHandler = (e) => {
      if (e.detail.port === 8081) this._handleAction(e.detail.x, e.detail.y);
    };
    window.addEventListener('ws-message', this._impactHandler);

    // --- 8. ELEMENTOS DINÁMICOS ---
    this.dynamicStars = [];
    this._createDynamicStars(width, height);
    
    this.time.addEvent({
      delay: 2000,
      callback: () => this._spawnShootingStar(width, height),
      loop: true
    });

    this.add.text(width / 2, 60, '✨ PIZARRA GALÁCTICA ✨', {
      fontSize: '52px', fontFamily: 'Luckiest Guy', color: '#ffffff',
      stroke: '#9c4eb3', strokeThickness: 10,
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 8 }
    }).setOrigin(0.5).setDepth(1000);

    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.time.now - this.lastActionTime > 150) {
          this.isDrawing = false; this.lastX = null; this.lastY = null;
        }
      },
      loop: true
    });
    this.lastActionTime = 0;
  }

  _createDynamicStars(w, h) {
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), Phaser.Math.FloatBetween(1, 3), 0xffffff, 0.8).setDepth(1);
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
      this.dynamicStars.push(star);
    }
  }

  _spawnShootingStar(w, h) {
    const x = Phaser.Math.Between(0, w);
    const y = Phaser.Math.Between(0, h / 2);
    const line = this.add.graphics().setDepth(1);
    line.lineStyle(2, 0xffffff, 0.8);
    line.strokeLineShape(new Phaser.Geom.Line(0, 0, 150, -5));
    line.setPosition(x, y);

    this.tweens.add({
      targets: line,
      x: x + 800,
      y: y + 200,
      alpha: 0,
      duration: 800,
      onComplete: () => line.destroy()
    });
  }

  _updatePlanetGraphics() {
    const { width, height } = this.scale;
    const theme = this.planets[this.bgIndex];
    const cx = width / 2;
    const cy = height / 2;

    // 1. Espacio profundo
    this.bg.clear();
    this.bg.fillGradientStyle(...theme.colors, 1);
    this.bg.fillRect(0, 0, width, height);

    // 2. Nebulosas
    this.nebulaGraphics.clear();
    const nebulaColors = [theme.accent, 0x9c4eb3, 0x4e1a4e];
    for (let i = 0; i < 4; i++) {
      const nx = Phaser.Math.Between(0, width);
      const ny = Phaser.Math.Between(0, height);
      const nr = Phaser.Math.Between(300, 700);
      this.nebulaGraphics.fillStyle(nebulaColors[i % 3], 0.05);
      this.nebulaGraphics.fillCircle(nx, ny, nr);
    }

    // 3. Estrellas
    this._createStaticStars(width, height);

    // 4. LUNAS (Novedad)
    this.moonGraphics.clear();
    const moonCount = Phaser.Math.Between(1, 3);
    for (let i = 0; i < moonCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = 450 + (i * 80);
      const mx = cx + Math.cos(angle) * dist;
      const my = cy + Math.sin(angle) * dist;
      const mr = Phaser.Math.Between(15, 30);
      
      // Brillo de la luna
      this.moonGraphics.fillStyle(0xffffff, 0.2);
      this.moonGraphics.fillCircle(mx, my, mr + 5);
      this.moonGraphics.fillStyle(0xcccccc, 1);
      this.moonGraphics.fillCircle(mx, my, mr);
      // Sombra de la luna
      this.moonGraphics.fillStyle(0x000000, 0.3);
      this.moonGraphics.beginPath();
      this.moonGraphics.arc(mx, my, mr, -Math.PI/4, Math.PI*0.75);
      this.moonGraphics.fillPath();
    }

    // 5. EL PLANETA (Pizarra)
    this.planetGraphics.clear();
    const radius = this.planetCenter.radius;

    // Resplandor atmosférico
    for (let i = 0; i < 8; i++) {
      this.planetGraphics.lineStyle(15 - i, theme.accent, 0.12 - (i * 0.015));
      this.planetGraphics.strokeCircle(cx, cy, radius + (i * 5));
    }

    this.planetGraphics.fillStyle(theme.planetColor, 0.4);
    this.planetGraphics.fillCircle(cx, cy, radius);
    
    // DIBUJO ESPECÍFICO SEGÚN TIPO (Inspirado en la imagen)
    switch(theme.type) {
      case 'sun':
        // Rayos solares
        for (let i = 0; i < 32; i++) {
          const ang = (i / 32) * Math.PI * 2 + (this.time.now / 1000);
          const r1 = radius + 20;
          const r2 = radius + 80 + Math.sin(this.time.now / 200 + i) * 30;
          this.planetGraphics.lineStyle(10, theme.accent, 0.4);
          this.planetGraphics.lineBetween(cx + Math.cos(ang)*r1, cy + Math.sin(ang)*r1, cx + Math.cos(ang)*r2, cy + Math.sin(ang)*r2);
        }
        break;
      case 'earth':
        // Continentes verdes
        this.planetGraphics.fillStyle(0x44aa44, 0.4);
        for (let i = 0; i < 5; i++) {
          this.planetGraphics.fillEllipse(cx + Phaser.Math.Between(-radius*0.6, radius*0.6), cy + Phaser.Math.Between(-radius*0.6, radius*0.6), 150, 80);
        }
        // Nubes blancas
        this.planetGraphics.fillStyle(0xffffff, 0.2);
        for (let i = 0; i < 4; i++) {
          this.planetGraphics.fillEllipse(cx + Math.cos(this.time.now/2000 + i)*radius*0.5, cy + Math.sin(i)*radius*0.3, 120, 40);
        }
        break;
      case 'magma':
        // Venas de lava
        this.planetGraphics.lineStyle(8, theme.accent, 0.6);
        for (let i = 0; i < 8; i++) {
          const ang = i * 0.8;
          this.planetGraphics.beginPath();
          this.planetGraphics.moveTo(cx + Math.cos(ang)*radius*0.2, cy + Math.sin(ang)*radius*0.2);
          this.planetGraphics.lineTo(cx + Math.cos(ang)*radius, cy + Math.sin(ang)*radius);
          this.planetGraphics.strokePath();
        }
        break;
      case 'striped':
      case 'ringed':
        // Franjas curvas (Júpiter/Saturno) - Usamos elipses para que sigan la curvatura
        for (let i = 0; i < 8; i++) {
          const yOff = -radius * 0.7 + (i * radius * 0.2);
          const alpha = i % 2 === 0 ? 0.08 : 0.12;
          this.planetGraphics.fillStyle(i % 2 === 0 ? 0xffffff : theme.accent, alpha);
          
          // Calculamos el ancho de la elipse en esa altura para que no sobresalga
          const sliceWidth = radius * 2 * Math.sqrt(1 - Math.pow(yOff/radius, 2));
          if (sliceWidth > 0) {
            this.planetGraphics.fillEllipse(cx, cy + yOff, sliceWidth, 25);
          }
        }
        break;
      case 'volcanic':
        // Volcanes (Puntos oscuros con brillo)
        for (let i = 0; i < 12; i++) {
          const px = cx + Phaser.Math.Between(-radius*0.7, radius*0.7);
          const py = cy + Phaser.Math.Between(-radius*0.7, radius*0.7);
          this.planetGraphics.fillStyle(0x000000, 0.3);
          this.planetGraphics.fillCircle(px, py, 25);
          this.planetGraphics.fillStyle(theme.accent, 0.3);
          this.planetGraphics.fillCircle(px, py, 10);
        }
        break;
      case 'craters':
        // Cráteres estilo Luna
        for (let i = 0; i < 15; i++) {
          const d = Phaser.Math.FloatBetween(0, radius * 0.85);
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
          this.planetGraphics.fillStyle(0x000000, 0.15);
          this.planetGraphics.fillCircle(cx + Math.cos(a)*d, cy + Math.sin(a)*d, Phaser.Math.Between(15, 45));
        }
        break;
      case 'gas':
        // Remolinos de gas
        for (let i = 0; i < 5; i++) {
          this.planetGraphics.lineStyle(20, theme.accent, 0.1);
          this.planetGraphics.strokeEllipse(cx, cy, radius * (0.4 + i*0.3), radius * (0.2 + i*0.1));
        }
        break;
      case 'rocky':
        // Manchas irregulares
        for (let i = 0; i < 10; i++) {
          this.planetGraphics.fillStyle(0x000000, 0.1);
          this.planetGraphics.fillCircle(cx + Phaser.Math.Between(-radius*0.7, radius*0.7), cy + Phaser.Math.Between(-radius*0.7, radius*0.7), Phaser.Math.Between(40, 90));
        }
        break;
    }

    // LOS ANILLOS
    if (theme.type === 'ringed' || theme.type === 'gas') {
      const ringCount = theme.name === 'SATURNO' ? 5 : 2;
      for (let i = 0; i < ringCount; i++) {
        const alpha = 0.3 - (i * 0.04);
        this.planetGraphics.lineStyle(theme.type === 'sun' ? 20 : 6, i % 2 === 0 ? 0xffffff : theme.accent, alpha);
        const ringW = radius * (2.4 + i * 0.2);
        const ringH = radius * (0.4 + i * 0.1);
        this.planetGraphics.strokeEllipse(cx, cy, ringW, ringH);
      }
    }

    // Sombra interna 3D (Solo si no es un Sol)
    if (theme.type !== 'sun') {
      this.planetGraphics.fillStyle(0x000000, 0.5);
      this.planetGraphics.beginPath();
      this.planetGraphics.arc(cx, cy, radius, -Math.PI / 4, Math.PI * 0.75);
      this.planetGraphics.fillPath();
    }

    // Borde de cristal
    this.planetGraphics.lineStyle(6, theme.accent, 0.7);
    this.planetGraphics.strokeCircle(cx, cy, radius);
  }

  _createStaticStars(w, h) {
    this.starGraphics.clear();
    for (let i = 0; i < 400; i++) {
      this.starGraphics.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      this.starGraphics.fillCircle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), Phaser.Math.FloatBetween(0.3, 2));
    }
  }

  _setupInputs() {
    this.input.on('pointerdown', (p) => {
      const btn = this._getButtonAt(p.x, p.y);
      if (btn) {
        this.pressedBtn = btn;
        this.pressedBtn.holdTime = 0;
        this.isDrawing = false;
      } else if (!this.isSliderDragging && !this.isBrushSliderDragging) {
        this.isDrawing = false;
        this._handleAction(p.x, p.y);
      }
    });

    this.input.on('pointermove', (p) => {
      if (p.isDown) {
        if (this.pressedBtn) {
          const dist = Phaser.Math.Distance.Between(p.x, p.y, this.pressedBtn.x, this.pressedBtn.y);
          if (dist > 80) this._cancelHold();
        } else if (!this.isSliderDragging && !this.isBrushSliderDragging) {
          this._handleAction(p.x, p.y);
        }
      }
    });

    this.input.on('pointerup', () => {
      this._cancelHold();
      this.isDrawing = false;
      this.lastX = null;
      this.lastY = null;
    });
  }

  _getButtonAt(x, y) {
    for (let btn of this.buttons) {
      let isVisible = btn.cont.visible;
      if (btn.cont.parentContainer && !btn.cont.parentContainer.visible) isVisible = false;
      if (!isVisible) continue;
      if (Phaser.Math.Distance.Between(x, y, btn.x, btn.y) < 70) return btn;
    }
    return null;
  }

  _cancelHold() {
    this.pressedBtn = null;
    this.holdGraphics.clear();
  }

  update(time, delta) {
    // Watchdog: si isClearing lleva más de 3 segundos, se resetea automáticamente
    if (this.isClearing) {
      if (!this._clearingStartTime) this._clearingStartTime = time;
      if (time - this._clearingStartTime > 3000) {
        this.isClearing = false;
        this._clearingStartTime = null;
        // Limpiar cualquier objeto que pueda estar bloqueando la pantalla
        this.children.list
          .filter(c => c.type === 'Rectangle' && c.depth === 200)
          .forEach(c => c.destroy());
      }
    } else {
      this._clearingStartTime = null;
    }

    if (this.pressedBtn) {
      this.pressedBtn.holdTime += delta;
      const progress = Math.min(this.pressedBtn.holdTime / this.pressedBtn.holdDuration, 1);
      
      this.holdGraphics.clear();
      this.holdGraphics.lineStyle(8, 0x00ff00, 0.8);
      this.holdGraphics.beginPath();
      this.holdGraphics.arc(this.pressedBtn.x, this.pressedBtn.y, 65, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
      this.holdGraphics.strokePath();

      if (progress >= 1) {
        const cb = this.pressedBtn.callback;
        this._cancelHold();
        cb();
      }
    }
  }

  _saveHistory() {
    if (this.history.length > 20) this.history.shift();
    this.history.push(this.ctx.getImageData(0, 0, this.scale.width, this.scale.height));
  }

  _undo() {
    if (this.history.length > 0) {
      const lastState = this.history.pop();
      this.ctx.putImageData(lastState, 0, 0);
      this.canvasTexture.update();
      this.sound.play('pop');
    }
  }

  _handleAction(x, y) {
    this.lastActionTime = this.time.now;
    // El manejo de botones ahora se hace en _setupInputs con el sistema de hold
    if (!this.isDrawing) { this._saveHistory(); this.isDrawing = true; this.lastX = null; this.lastY = null; }
    if (this.time.now % 6 === 0) this.sound.play('tick', { volume: 0.15 });

    if (this.brushStyle === 'eraser') this._drawEraser(x, y);
    else if (this.brushStyle === 'shootingStar') this._drawShootingStar(x, y);
    else if (this.brushStyle === 'neon') this._drawNeon(x, y);
    else if (this.brushStyle === 'comet') this._drawComet(x, y);

    this.lastX = x; this.lastY = y;
  }

  _drawEraser(x, y) {
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.lineWidth = this.eraserSize;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    else { this.ctx.arc(x, y, this.eraserSize / 2, 0, Math.PI * 2); }
    this.ctx.stroke();
    this.ctx.globalCompositeOperation = 'source-over';
    this.canvasTexture.update();
  }

  _drawShootingStar(x, y) {
    let colorStr = `rgb(${this.selectedColor.str})`;
    if (this.selectedColor.id === 'rainbow') {
      const hue = (this.time.now / 5) % 360;
      colorStr = `hsl(${hue}, 100%, 50%)`;
    }
    this.ctx.strokeStyle = colorStr; this.ctx.lineCap = 'round'; this.ctx.lineWidth = this.brushSize;
    this.ctx.shadowBlur = 15; this.ctx.shadowColor = colorStr;
    this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    else { this.ctx.arc(x, y, 8, 0, Math.PI * 2); }
    this.ctx.stroke();
    this.ctx.lineWidth = Math.max(2, this.brushSize * 0.25); this.ctx.strokeStyle = 'white'; this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    this.ctx.stroke();
    this.canvasTexture.update();
  }

  _drawNeon(x, y) {
    let colorStr = `rgba(${this.selectedColor.str}, 0.8)`;
    if (this.selectedColor.id === 'rainbow') {
      const hue = (this.time.now / 5) % 360;
      colorStr = `hsla(${hue}, 100%, 50%, 0.8)`;
    }
    this.ctx.strokeStyle = colorStr; this.ctx.lineWidth = this.brushSize * 2; this.ctx.shadowBlur = this.brushSize * 1.5; this.ctx.shadowColor = colorStr;
    this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    else { this.ctx.arc(x, y, 16, 0, Math.PI * 2); }
    this.ctx.stroke();
    this.canvasTexture.update();
  }

  _drawComet(x, y) {
    let colorStr = `rgba(${this.selectedColor.str}, 0.6)`;
    if (this.selectedColor.id === 'rainbow') {
      const hue = (this.time.now / 5) % 360;
      colorStr = `hsla(${hue}, 100%, 50%, 0.6)`;
    }
    this.ctx.fillStyle = colorStr; this.ctx.shadowBlur = 10; this.ctx.shadowColor = colorStr;
    for (let i = 0; i < 6; i++) {
      const ox = Phaser.Math.Between(-15, 15); const oy = Phaser.Math.Between(-15, 15);
      this.ctx.beginPath(); this.ctx.arc(x + ox, y + oy, Phaser.Math.FloatBetween(1, 5), 0, Math.PI * 2); this.ctx.fill();
    }
    this.particles.emitParticleAt(x, y, 2);
    this.canvasTexture.update();
  }

  _createElegantButton(x, y, iconStr, labelStr, callback, holdDuration = 2000) {
    const { width, height } = this.scale;
    const btn = this.add.container(x, y).setDepth(1000);
    
    // Aura Galáctica (Glow más intenso)
    const aura = this.add.circle(0, 0, 65, 0x9c4eb3, 0.1).setStrokeStyle(3, 0xffffff, 0.1);
    const glow = this.add.circle(0, 0, 50, 0x40c0dd, 0.05);
    
    const core = this.add.circle(0, 0, 45, 0x000000, 0.8).setStrokeStyle(2, 0xffffff, 0.6);
    const icon = this.add.text(0, -6, iconStr, { fontSize: '36px' }).setOrigin(0.5);
    const label = this.add.text(0, 32, labelStr, { 
      fontSize: '14px', fontFamily: 'Luckiest Guy', color: '#ffffff',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    
    btn.add([aura, glow, core, icon, label]);
    this.buttons.push({ x, y, cont: btn, callback, isPressed: false, holdDuration, holdTime: 0 });
    
    // Animación de respiración galáctica
    this.tweens.add({ targets: [aura, glow], scale: 1.15, alpha: 0.2, duration: 1500 + Math.random() * 500, yoyo: true, loop: -1 });
  }

  _createStyleMenu() {
    const { height } = this.scale;
    this.styleMenuCont = this.add.container(100, height - 200).setDepth(1000).setVisible(false);
    const styles = [{ id: 'shootingStar', icon: '✨' }, { id: 'neon', icon: '🔦' }, { id: 'comet', icon: '☄️' }];
    styles.forEach((s, i) => {
      const spacing = 90;
      const subBtn = this.add.container(0, -i * spacing);
      const glow = this.add.circle(0, 0, 45, 0x9c4eb3, 0.2).setDepth(-1);
      const bg = this.add.circle(0, 0, 40, 0x000000).setStrokeStyle(2, 0xffffff, 0.8);
      const txt = this.add.text(0, 0, s.icon, { fontSize: '28px' }).setOrigin(0.5);
      subBtn.add([glow, bg, txt]);
      
      this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.4, duration: 1000 + i * 200, yoyo: true, loop: -1 });
      this.styleMenuCont.add(subBtn);
      this.buttons.push({
        x: 100, y: height - 200 - i * spacing, cont: subBtn,
        holdDuration: 1500, holdTime: 0,
        callback: () => { this.brushStyle = s.id; this.styleMenuCont.setVisible(false); }
      });
    });
  }

  _createColorMenu() {
    const { height } = this.scale;
    this.colorMenuCont = this.add.container(240, height - 200).setDepth(1000).setVisible(false);
    this.availableColors.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xOffset = col === 0 ? -45 : 45;
      const yOffset = -row * 90;
      
      const subBtn = this.add.container(xOffset, yOffset);
      const glow = this.add.circle(0, 0, 40, c.hex, 0.2).setDepth(-1);
      const bg = c.id === 'rainbow' 
        ? this.add.circle(0, 0, 35, 0xffffff).setStrokeStyle(3, 0xffffff)
        : this.add.circle(0, 0, 35, c.hex).setStrokeStyle(3, 0xffffff, 0.8);
      
      if (c.id === 'rainbow') {
        const txt = this.add.text(0, 0, '🌈', { fontSize: '24px' }).setOrigin(0.5);
        subBtn.add([glow, bg, txt]);
      } else {
        subBtn.add([glow, bg]);
      }
      
      this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.5, duration: 1200 + i * 100, yoyo: true, loop: -1 });

      this.colorMenuCont.add(subBtn);
      this.buttons.push({
        x: 240 + xOffset, y: height - 200 + yOffset, cont: subBtn,
        holdDuration: 1500, holdTime: 0,
        callback: () => { this.selectedColor = c; this.colorMenuCont.setVisible(false); }
      });
    });
  }

  _createBocetoMenu() {
    const { height } = this.scale;
    this.bocetoMenuCont = this.add.container(380, height - 200).setDepth(1000).setVisible(false);
    
    const bocetos = [
      { id: 'boceto_arcoiris', icon: '🌈' },
      { id: 'boceto_carro', icon: '🚗' },
      { id: 'boceto_castillo', icon: '🏰' },
      { id: 'boceto_oso', icon: '🐻' },
      { id: 'boceto_parke', icon: '🎪' },
      { id: 'boceto_sol', icon: '☀️' },
      { id: 'cohete', icon: '🚀' },
      { id: 'clear', icon: '❌' }
    ];

    bocetos.forEach((b, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xOffset = col === 0 ? -45 : 45;
      const yOffset = -row * 90;

      const subBtn = this.add.container(xOffset, yOffset);
      const glow = this.add.circle(0, 0, 40, 0x40c0dd, 0.15).setDepth(-1);
      const bg = this.add.circle(0, 0, 35, 0x000000).setStrokeStyle(2, 0xffffff, 0.7);
      const txt = this.add.text(0, 0, b.icon, { fontSize: '24px' }).setOrigin(0.5);
      subBtn.add([glow, bg, txt]);
      
      this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.3, duration: 1500, yoyo: true, loop: -1 });
      this.bocetoMenuCont.add(subBtn);
      this.buttons.push({
        x: 380 + xOffset, y: height - 200 + yOffset, cont: subBtn,
        holdDuration: 1500, holdTime: 0,
        callback: () => { 
          if (b.id === 'clear') {
            if (this.bocetoImage) { this.bocetoImage.destroy(); this.bocetoImage = null; }
            this.plantillaImg.setVisible(false);
            this.bg.setVisible(true);
            this.nebulaGraphics.setVisible(true);
            this.starGraphics.setVisible(true);
            this.moonGraphics.setVisible(true);
            this.planetGraphics.setVisible(true);
          } else {
            // Destruir boceto anterior y crear uno nuevo fresco
            if (this.bocetoImage) { this.bocetoImage.destroy(); this.bocetoImage = null; }
            this.bocetoImage = this.add.image(this.scale.width / 2, this.scale.height / 2, b.id)
              .setDepth(900)
              .setAlpha(0.85)
              .setDisplaySize(this.scale.width * 0.70, this.scale.height * 0.70);

            this.plantillaImg.setVisible(true).setDepth(1);
            this.bg.setVisible(false);
            this.nebulaGraphics.setVisible(false);
            this.starGraphics.setVisible(false);
            this.moonGraphics.setVisible(false);
            this.planetGraphics.setVisible(false);
          }
          this.bocetoMenuCont.setVisible(false); 
        }
      });
    });
  }

  _toggleStyleMenu() {
    this.styleMenuCont.setVisible(!this.styleMenuCont.visible);
    if (this.colorMenuCont) this.colorMenuCont.setVisible(false);
    if (this.bocetoMenuCont) this.bocetoMenuCont.setVisible(false);
    this.sound.play('pop');
  }

  _toggleColorMenu() {
    this.colorMenuCont.setVisible(!this.colorMenuCont.visible);
    if (this.styleMenuCont) this.styleMenuCont.setVisible(false);
    if (this.bocetoMenuCont) this.bocetoMenuCont.setVisible(false);
    this.sound.play('pop');
  }

  _toggleBocetoMenu() {
    this.bocetoMenuCont.setVisible(!this.bocetoMenuCont.visible);
    if (this.styleMenuCont) this.styleMenuCont.setVisible(false);
    if (this.colorMenuCont) this.colorMenuCont.setVisible(false);
    if (this.eraserMenuCont) this.eraserMenuCont.setVisible(false);
    this.sound.play('pop');
  }

  _createEraserMenu() {
    const { width, height } = this.scale;
    // Posicionado encima del botón BORRADOR (esquina inf. derecha)
    const btnX = width - 380;
    const btnY = height - 100;
    this.eraserMenuCont = this.add.container(btnX, btnY - 90).setDepth(1000).setVisible(false);

    // Slider horizontal
    const trackW = 300;
    const trackH = 8;

    // Fondo de la barra
    const trackBg = this.add.rectangle(0, 0, trackW, trackH, 0xffffff, 0.2)
      .setStrokeStyle(1, 0xffffff, 0.4);

    // Relleno activo (crece desde la izquierda)
    const fillBar = this.add.rectangle(-trackW / 2, 0, 0, trackH, 0x40c0dd, 0.9).setOrigin(0, 0.5);

    // Thumb (círculo deslizante)
    const thumb = this.add.container(-trackW / 2, 0);
    const thumbGlow = this.add.circle(0, 0, 20, 0x40c0dd, 0.4);
    const thumbCore = this.add.circle(0, 0, 12, 0xffffff).setStrokeStyle(3, 0x9c4eb3);
    thumb.add([thumbGlow, thumbCore]);

    // Etiqueta de tamaño
    const sizeVal = this.add.text(0, -35, '60', {
      fontSize: '22px', fontFamily: 'Luckiest Guy', color: '#ffffff',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // Labels min/max
    const lblMin = this.add.text(-trackW / 2, 20, 'S', { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5);
    const lblMax = this.add.text(trackW / 2, 20, 'XL', { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5);

    this.eraserMenuCont.add([trackBg, fillBar, thumb, sizeVal, lblMin, lblMax]);

    // Área interactiva transparente sobre la barra
    const area = this.add.rectangle(0, 0, trackW + 40, 60, 0x000000, 0).setInteractive({ cursor: 'pointer' });
    this.eraserMenuCont.add(area);

    const updateSlider = (pointerX) => {
      const localX = pointerX - this.eraserMenuCont.x;
      const clampedX = Phaser.Math.Clamp(localX, -trackW / 2, trackW / 2);
      thumb.x = clampedX;
      fillBar.width = clampedX + trackW / 2;
      const pct = (clampedX + trackW / 2) / trackW;
      this.eraserSize = 20 + (pct * 230);
      sizeVal.x = clampedX;
      sizeVal.setText(Math.round(this.eraserSize));
      this.brushStyle = 'eraser';
    };

    area.on('pointerdown', (p) => { this.isSliderDragging = true; updateSlider(p.x); });
    this.input.on('pointermove', (p) => { if (this.isSliderDragging) updateSlider(p.x); });
    this.input.on('pointerup', () => { this.isSliderDragging = false; });
  }

  _toggleEraserMenu() {
    this.eraserMenuCont.setVisible(!this.eraserMenuCont.visible);
    if (this.styleMenuCont) this.styleMenuCont.setVisible(false);
    if (this.colorMenuCont) this.colorMenuCont.setVisible(false);
    if (this.bocetoMenuCont) this.bocetoMenuCont.setVisible(false);
    if (this.brushMenuCont) this.brushMenuCont.setVisible(false);
    this.sound.play('pop');
  }

  _createBrushMenu() {
    const { width, height } = this.scale;
    const btnX = 520;
    const btnY = height - 100;
    this.brushMenuCont = this.add.container(btnX, btnY - 90).setDepth(1000).setVisible(false);

    const trackW = 300;
    const trackH = 8;

    const trackBg = this.add.rectangle(0, 0, trackW, trackH, 0xffffff, 0.2)
      .setStrokeStyle(1, 0xffffff, 0.4);

    const fillBar = this.add.rectangle(-trackW / 2, 0, 0, trackH, 0x9c4eb3, 0.9).setOrigin(0, 0.5);

    const thumb = this.add.container(-trackW / 2, 0);
    const thumbGlow = this.add.circle(0, 0, 20, 0x9c4eb3, 0.4);
    const thumbCore = this.add.circle(0, 0, 12, 0xffffff).setStrokeStyle(3, 0xfa804f);
    thumb.add([thumbGlow, thumbCore]);

    const sizeVal = this.add.text(0, -35, '16', {
      fontSize: '22px', fontFamily: 'Luckiest Guy', color: '#ffffff',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    const lblMin = this.add.text(-trackW / 2, 20, 'Fino', { fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);
    const lblMax = this.add.text(trackW / 2, 20, 'Grueso', { fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);

    this.brushMenuCont.add([trackBg, fillBar, thumb, sizeVal, lblMin, lblMax]);

    const area = this.add.rectangle(0, 0, trackW + 40, 60, 0x000000, 0).setInteractive({ cursor: 'pointer' });
    this.brushMenuCont.add(area);

    const updateSlider = (pointerX) => {
      const localX = pointerX - this.brushMenuCont.x;
      const clampedX = Phaser.Math.Clamp(localX, -trackW / 2, trackW / 2);
      thumb.x = clampedX;
      fillBar.width = clampedX + trackW / 2;
      const pct = (clampedX + trackW / 2) / trackW;
      this.brushSize = 4 + (pct * 60);
      sizeVal.x = clampedX;
      sizeVal.setText(Math.round(this.brushSize));
    };

    area.on('pointerdown', (p) => { this.isBrushSliderDragging = true; updateSlider(p.x); });
    this.input.on('pointermove', (p) => { if (this.isBrushSliderDragging) updateSlider(p.x); });
    this.input.on('pointerup', () => { this.isBrushSliderDragging = false; });
  }

  _toggleBrushMenu() {
    this.brushMenuCont.setVisible(!this.brushMenuCont.visible);
    if (this.styleMenuCont) this.styleMenuCont.setVisible(false);
    if (this.colorMenuCont) this.colorMenuCont.setVisible(false);
    if (this.bocetoMenuCont) this.bocetoMenuCont.setVisible(false);
    if (this.eraserMenuCont) this.eraserMenuCont.setVisible(false);
    this.sound.play('pop');
  }

  _warpTravel() {
    if (this.isClearing) return;
    this.isClearing = true;
    this._clearingStartTime = null; // El watchdog tomará el tiempo en update()
    const { width, height } = this.scale;
    
    const warpLine = this.add.rectangle(-width / 2, height / 2, width, height, 0xffffff, 0.95).setDepth(200);
    this.sound.play('pop', { volume: 0.5 });

    // Fase 1: cubrir pantalla
    this.tweens.add({
      targets: warpLine,
      x: width / 2,
      duration: 500,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Ocultar boceto y plantilla al viajar
        if (this.bocetoImage) {
          this.bocetoImage.destroy();
          this.bocetoImage = null;
        }
        this.plantillaImg.setVisible(false);
        // Mostrar el planeta
        this.bg.setVisible(true);
        this.nebulaGraphics.setVisible(true);
        this.starGraphics.setVisible(true);
        this.moonGraphics.setVisible(true);
        this.planetGraphics.setVisible(true);

        // Cambiar planeta con protección contra errores
        try {
          this.bgIndex = (this.bgIndex + 1) % this.planets.length;
          this._updatePlanetGraphics();
        } catch(e) {
          console.warn('Error al actualizar planeta, saltando:', e);
          this.bgIndex = (this.bgIndex + 1) % this.planets.length;
        }
        
        // Fase 2: descubrir pantalla
        this.tweens.add({
          targets: warpLine,
          x: width * 1.5,
          duration: 500,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            warpLine.destroy();
            this.isClearing = false;
          }
        });
      }
    });
  }

  _supernovaClear() {
    if (this.isClearing) return;
    this.isClearing = true;
    this._saveHistory();
    const flash = this.add.circle(this.scale.width - 100, this.scale.height - 100, 10, 0xffffff, 1).setDepth(100);
    this.tweens.add({
      targets: flash, radius: this.scale.width * 1.5, alpha: 0, duration: 1000,
      onStart: () => {
        this.time.delayedCall(300, () => {
          this.ctx.clearRect(0, 0, this.scale.width, this.scale.height);
          this.canvasTexture.update();
        });
      },
      onComplete: () => { flash.destroy(); this.isClearing = false; }
    });

    // Seguridad
    this.time.delayedCall(2000, () => {
      if (flash && flash.active) {
        flash.destroy();
        this.isClearing = false;
      }
    });
  }

  shutdown() {
    window.removeEventListener('ws-message', this._impactHandler);
    if (this.canvasTexture) this.canvasTexture.destroy();
  }
}
