import * as Phaser from 'phaser';
import { sendMessage } from '../../services/websocket/WebSocketClient.js';

export class MagicBoardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MagicBoardScene' });
  }

  create() {
    sendMessage({ event: "set_mode", mode: "pizarra" }, 8081)
    const { width, height } = this.scale;

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

    this.bg = this.add.graphics().setDepth(0);
    this.nebulaGraphics = this.add.graphics().setDepth(0.5);
    this.starGraphics = this.add.graphics().setDepth(1);
    this.moonGraphics = this.add.graphics().setDepth(1.5);
    this.planetGraphics = this.add.graphics().setDepth(2);
    this.planetCenter = { x: width / 2, y: height / 2, radius: 300 };
    this._updatePlanetGraphics();

    this.canvasTexture = this.textures.createCanvas('drawingCanvas', width, height);
    this.canvasImage = this.add.image(0, 0, 'drawingCanvas').setOrigin(0).setDepth(5);
    this.bocetoImage = null;

    this.plantillaImg = this.add.image(width / 2, height / 2, 'plantilla').setDepth(1).setVisible(false);
    const scaleX = width / this.plantillaImg.width;
    const scaleY = height / this.plantillaImg.height;
    this.plantillaImg.setScale(Math.max(scaleX, scaleY));

    this.ctx = this.canvasTexture.context;
    this.history = [];
    this.isDrawing = false;

    this.brushStyle = 'shootingStar';
    this.brushSize = 16;
    this.eraserSize = 60;
    this.availableColors = [
      { id: 'white', hex: 0xffffff, str: '255, 255, 255' },
      { id: 'black', hex: 0x111111, str: '10, 10, 10' },
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

    this.pressedBtn = null;
    this.holdGraphics = this.add.graphics().setDepth(1500);

    this.particles = this.add.particles(0, 0, '__DEFAULT', {
      scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
      speed: { min: 60, max: 200 }, lifespan: 400, blendMode: 'ADD'
    }).setDepth(10);

    this.buttons = [];
    // Derecha
    this._createElegantButton(width - 100, height / 2 - 120, '🧽', 'BORRADOR', () => this._toggleEraserMenu(), 2000);
    this._createElegantButton(width - 100, height / 2, '🌌', 'VIAJAR', () => this._warpTravel(), 2000);
    this._createElegantButton(width - 100, height / 2 + 120, '✨', 'BORRAR TODO', () => this._supernovaClear(), 2000);
    // Izquierda
    this._createElegantButton(100, height / 2 - 180, '✏️', 'ESTILO', () => this._toggleStyleMenu(), 2000);
    this._createElegantButton(100, height / 2 - 60, '🎨', 'COLOR', () => this._toggleColorMenu(), 2000);
    this._createElegantButton(100, height / 2 + 60, '🖼️', 'BOCETO', () => this._toggleBocetoMenu(), 2000);
    this._createElegantButton(100, height / 2 + 180, '🖌️', 'PINCEL', () => this._toggleBrushMenu(), 2000);

    this._createStyleMenu();
    this._createColorMenu();
    this._createBocetoMenu();
    this._createEraserMenu();
    this._createBrushMenu();

    this._activeTraces = [];
    this._setupInputs();
    this._impactHandler = (e) => {
      if (e.detail.port !== 8081) return;
      const touches = e.detail.touches;
      if (!touches || touches.length === 0) return;
      const MAX_CONNECT_DIST = 150;
      const now = this.time.now;

      for (const touch of touches) {
        const { x, y } = touch;
        const btn = this._getButtonAt(x, y);
        if (btn) {
          if (this.pressedBtn && this.pressedBtn !== btn) this._cancelHold();
          if (!this.pressedBtn) {
            this.pressedBtn = btn;
            this.pressedBtn.holdTime = 0;
          }
          this.isDrawing = false;
          clearTimeout(this._holdCancelTimer);
          this._holdCancelTimer = setTimeout(() => this._cancelHold(), 1200);
          continue;
        }

        let closestTrace = null;
        let closestDist = MAX_CONNECT_DIST;
        for (const trace of this._activeTraces) {
          if (trace.usedThisFrame) continue;
          if (trace.lastX === null) continue;
          const dist = Math.sqrt(Math.pow(x - trace.lastX, 2) + Math.pow(y - trace.lastY, 2));
          if (dist < closestDist) { closestDist = dist; closestTrace = trace; }
        }

        if (closestTrace) {
          const prevX = closestTrace.lastX;
          const prevY = closestTrace.lastY;
          const dist = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));

          if (dist > 50) {
            const steps = Math.floor(dist / 30);
            for (let s = 1; s <= steps; s++) {
              const t = s / (steps + 1);
              const ix = prevX + (x - prevX) * t;
              const iy = prevY + (y - prevY) * t;
              this.lastX = prevX + (x - prevX) * (s - 1) / (steps + 1);
              this.lastY = prevY + (y - prevY) * (s - 1) / (steps + 1);
              if (this.brushStyle === 'eraser') this._drawEraser(ix, iy);
              else if (this.brushStyle === 'shootingStar') this._drawShootingStar(ix, iy);
              else if (this.brushStyle === 'neon') this._drawNeon(ix, iy);
              else if (this.brushStyle === 'comet') this._drawComet(ix, iy);
            }
          }

          this.lastX = prevX;
          this.lastY = prevY;
          closestTrace.lastX = x;
          closestTrace.lastY = y;
          closestTrace.lastSeen = now;
          closestTrace.usedThisFrame = true;
        } else {
          this.lastX = null;
          this.lastY = null;
          this._saveHistory();
          this._activeTraces.push({ lastX: x, lastY: y, lastSeen: now, usedThisFrame: true });
        }

        if (this.time.now % 6 === 0) this.sound.play('tick', { volume: 0.15 });
        if (this.brushStyle === 'eraser') this._drawEraser(x, y);
        else if (this.brushStyle === 'shootingStar') this._drawShootingStar(x, y);
        else if (this.brushStyle === 'neon') this._drawNeon(x, y);
        else if (this.brushStyle === 'comet') this._drawComet(x, y);
      }

      for (const trace of this._activeTraces) trace.usedThisFrame = false;
      this._activeTraces = this._activeTraces.filter(t => now - t.lastSeen < 600);
      this.lastActionTime = now;
    };
    window.addEventListener('ws-message', this._impactHandler);

    this.dynamicStars = [];
    this._createDynamicStars(width, height);

    this.time.addEvent({ delay: 2000, callback: () => this._spawnShootingStar(width, height), loop: true });

    this.add.text(width / 2, 60, '✨ PIZARRA GALÁCTICA ✨', {
      fontSize: '52px', fontFamily: 'Luckiest Guy', color: '#ffffff',
      stroke: '#9c4eb3', strokeThickness: 10,
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 8 }
    }).setOrigin(0.5).setDepth(1000);

    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.time.now - this.lastActionTime > 600 && !this.pressedBtn) {
          this.isDrawing = false;
          this.lastX = null;
          this.lastY = null;
          this._activeTraces = [];
        }
      },
      loop: true
    });
    this.lastActionTime = 0;
  }

  _createDynamicStars(w, h) {
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), Phaser.Math.FloatBetween(1, 3), 0xffffff, 0.8).setDepth(1);
      this.tweens.add({ targets: star, alpha: 0.1, duration: Phaser.Math.Between(1000, 3000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) });
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
    this.tweens.add({ targets: line, x: x + 800, y: y + 200, alpha: 0, duration: 800, onComplete: () => line.destroy() });
  }

  _updatePlanetGraphics() {
    const { width, height } = this.scale;
    const theme = this.planets[this.bgIndex];
    const cx = width / 2;
    const cy = height / 2;

    this.bg.clear();
    this.bg.fillGradientStyle(...theme.colors, 1);
    this.bg.fillRect(0, 0, width, height);

    this.nebulaGraphics.clear();
    const nebulaColors = [theme.accent, 0x9c4eb3, 0x4e1a4e];
    for (let i = 0; i < 4; i++) {
      const nx = Phaser.Math.Between(0, width);
      const ny = Phaser.Math.Between(0, height);
      const nr = Phaser.Math.Between(300, 700);
      this.nebulaGraphics.fillStyle(nebulaColors[i % 3], 0.05);
      this.nebulaGraphics.fillCircle(nx, ny, nr);
    }

    this._createStaticStars(width, height);

    this.moonGraphics.clear();
    const moonCount = Phaser.Math.Between(1, 3);
    for (let i = 0; i < moonCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = 450 + (i * 80);
      const mx = cx + Math.cos(angle) * dist;
      const my = cy + Math.sin(angle) * dist;
      const mr = Phaser.Math.Between(15, 30);
      this.moonGraphics.fillStyle(0xffffff, 0.2);
      this.moonGraphics.fillCircle(mx, my, mr + 5);
      this.moonGraphics.fillStyle(0xcccccc, 1);
      this.moonGraphics.fillCircle(mx, my, mr);
      this.moonGraphics.fillStyle(0x000000, 0.3);
      this.moonGraphics.beginPath();
      this.moonGraphics.arc(mx, my, mr, -Math.PI / 4, Math.PI * 0.75);
      this.moonGraphics.fillPath();
    }

    this.planetGraphics.clear();
    const radius = this.planetCenter.radius;
    for (let i = 0; i < 8; i++) {
      this.planetGraphics.lineStyle(15 - i, theme.accent, 0.12 - (i * 0.015));
      this.planetGraphics.strokeCircle(cx, cy, radius + (i * 5));
    }
    this.planetGraphics.fillStyle(theme.planetColor, 0.4);
    this.planetGraphics.fillCircle(cx, cy, radius);

    switch (theme.type) {
      case 'sun':
        for (let i = 0; i < 32; i++) {
          const ang = (i / 32) * Math.PI * 2 + (this.time.now / 1000);
          const r1 = radius + 20;
          const r2 = radius + 80 + Math.sin(this.time.now / 200 + i) * 30;
          this.planetGraphics.lineStyle(10, theme.accent, 0.4);
          this.planetGraphics.lineBetween(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1, cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        }
        break;
      case 'earth':
        this.planetGraphics.fillStyle(0x44aa44, 0.4);
        for (let i = 0; i < 5; i++) {
          this.planetGraphics.fillEllipse(cx + Phaser.Math.Between(-radius * 0.6, radius * 0.6), cy + Phaser.Math.Between(-radius * 0.6, radius * 0.6), 150, 80);
        }
        this.planetGraphics.fillStyle(0xffffff, 0.2);
        for (let i = 0; i < 4; i++) {
          this.planetGraphics.fillEllipse(cx + Math.cos(this.time.now / 2000 + i) * radius * 0.5, cy + Math.sin(i) * radius * 0.3, 120, 40);
        }
        break;
      case 'magma':
        this.planetGraphics.lineStyle(8, theme.accent, 0.6);
        for (let i = 0; i < 8; i++) {
          const ang = i * 0.8;
          this.planetGraphics.beginPath();
          this.planetGraphics.moveTo(cx + Math.cos(ang) * radius * 0.2, cy + Math.sin(ang) * radius * 0.2);
          this.planetGraphics.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
          this.planetGraphics.strokePath();
        }
        break;
      case 'striped':
      case 'ringed':
        for (let i = 0; i < 8; i++) {
          const yOff = -radius * 0.7 + (i * radius * 0.2);
          const alpha = i % 2 === 0 ? 0.08 : 0.12;
          this.planetGraphics.fillStyle(i % 2 === 0 ? 0xffffff : theme.accent, alpha);
          const sliceWidth = radius * 2 * Math.sqrt(1 - Math.pow(yOff / radius, 2));
          if (sliceWidth > 0) this.planetGraphics.fillEllipse(cx, cy + yOff, sliceWidth, 25);
        }
        break;
      case 'volcanic':
        for (let i = 0; i < 12; i++) {
          const px = cx + Phaser.Math.Between(-radius * 0.7, radius * 0.7);
          const py = cy + Phaser.Math.Between(-radius * 0.7, radius * 0.7);
          this.planetGraphics.fillStyle(0x000000, 0.3);
          this.planetGraphics.fillCircle(px, py, 25);
          this.planetGraphics.fillStyle(theme.accent, 0.3);
          this.planetGraphics.fillCircle(px, py, 10);
        }
        break;
      case 'craters':
        for (let i = 0; i < 15; i++) {
          const d = Phaser.Math.FloatBetween(0, radius * 0.85);
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
          this.planetGraphics.fillStyle(0x000000, 0.15);
          this.planetGraphics.fillCircle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Phaser.Math.Between(15, 45));
        }
        break;
      case 'gas':
        for (let i = 0; i < 5; i++) {
          this.planetGraphics.lineStyle(20, theme.accent, 0.1);
          this.planetGraphics.strokeEllipse(cx, cy, radius * (0.4 + i * 0.3), radius * (0.2 + i * 0.1));
        }
        break;
      case 'rocky':
        for (let i = 0; i < 10; i++) {
          this.planetGraphics.fillStyle(0x000000, 0.1);
          this.planetGraphics.fillCircle(cx + Phaser.Math.Between(-radius * 0.7, radius * 0.7), cy + Phaser.Math.Between(-radius * 0.7, radius * 0.7), Phaser.Math.Between(40, 90));
        }
        break;
    }

    if (theme.type === 'ringed' || theme.type === 'gas') {
      const ringCount = theme.name === 'SATURNO' ? 5 : 2;
      for (let i = 0; i < ringCount; i++) {
        const alpha = 0.3 - (i * 0.04);
        this.planetGraphics.lineStyle(theme.type === 'sun' ? 20 : 6, i % 2 === 0 ? 0xffffff : theme.accent, alpha);
        this.planetGraphics.strokeEllipse(cx, cy, radius * (2.4 + i * 0.2), radius * (0.4 + i * 0.1));
      }
    }

    if (theme.type !== 'sun') {
      this.planetGraphics.fillStyle(0x000000, 0.5);
      this.planetGraphics.beginPath();
      this.planetGraphics.arc(cx, cy, radius, -Math.PI / 4, Math.PI * 0.75);
      this.planetGraphics.fillPath();
    }

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
      if (btn) { this.pressedBtn = btn; this.pressedBtn.holdTime = 0; this.isDrawing = false; }
      else { this.isDrawing = false; this._handleAction(p.x, p.y); }
    });
    this.input.on('pointermove', (p) => {
      if (p.isDown) {
        if (this.pressedBtn) {
          const dist = Phaser.Math.Distance.Between(p.x, p.y, this.pressedBtn.x, this.pressedBtn.y);
          if (dist > 80) this._cancelHold();
        } else { this._handleAction(p.x, p.y); }
      }
    });
    this.input.on('pointerup', () => { this._cancelHold(); this.isDrawing = false; this.lastX = null; this.lastY = null; });
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

  _cancelHold() { this.pressedBtn = null; this.holdGraphics.clear(); }

  update(time, delta) {
    if (this.isClearing) {
      if (!this._clearingStartTime) this._clearingStartTime = time;
      if (time - this._clearingStartTime > 3000) {
        this.isClearing = false;
        this._clearingStartTime = null;
        this.children.list.filter(c => c.type === 'Rectangle' && c.depth === 200).forEach(c => c.destroy());
      }
    } else { this._clearingStartTime = null; }

    if (this.pressedBtn) {
      this.pressedBtn.holdTime += delta;
      const progress = Math.min(this.pressedBtn.holdTime / this.pressedBtn.holdDuration, 1);
      this.holdGraphics.clear();
      this.holdGraphics.lineStyle(8, 0x00ff00, 0.8);
      this.holdGraphics.beginPath();
      this.holdGraphics.arc(this.pressedBtn.x, this.pressedBtn.y, 65, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
      this.holdGraphics.strokePath();
      if (progress >= 1) { const cb = this.pressedBtn.callback; this._cancelHold(); cb(); }
    }
  }

  _saveHistory() {
    if (this.history.length > 20) this.history.shift();
    this.history.push(this.ctx.getImageData(0, 0, this.scale.width, this.scale.height));
  }

  _handleAction(x, y) {
    if (this.time.now % 6 === 0) this.sound.play('tick', { volume: 0.15 });
    if (this.brushStyle === 'eraser') this._drawEraser(x, y);
    else if (this.brushStyle === 'shootingStar') this._drawShootingStar(x, y);
    else if (this.brushStyle === 'neon') this._drawNeon(x, y);
    else if (this.brushStyle === 'comet') this._drawComet(x, y);
    this.lastX = x;
    this.lastY = y;
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
    if (this.selectedColor.id === 'rainbow') { const hue = (this.time.now / 5) % 360; colorStr = `hsl(${hue}, 100%, 50%)`; }
    this.ctx.strokeStyle = colorStr;
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = this.brushSize;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = colorStr;
    this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    else { this.ctx.arc(x, y, 8, 0, Math.PI * 2); }
    this.ctx.stroke();
    if (this.selectedColor.id !== 'rainbow') {
      this.ctx.lineWidth = Math.max(2, this.brushSize * 0.25);
      this.ctx.strokeStyle = 'white';
      this.ctx.beginPath();
      if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
      this.ctx.stroke();
    }
    this.canvasTexture.update();
  }

  _drawNeon(x, y) {
    let colorStr = `rgba(${this.selectedColor.str}, 0.8)`;
    if (this.selectedColor.id === 'rainbow') { const hue = (this.time.now / 5) % 360; colorStr = `hsla(${hue}, 100%, 50%, 0.8)`; }
    this.ctx.strokeStyle = colorStr; this.ctx.lineWidth = this.brushSize * 2; this.ctx.shadowBlur = this.brushSize * 1.5; this.ctx.shadowColor = colorStr;
    this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    else { this.ctx.arc(x, y, 16, 0, Math.PI * 2); }
    this.ctx.stroke();
    this.canvasTexture.update();
  }

  _drawComet(x, y) {
    let colorStr = `rgba(${this.selectedColor.str}, 0.6)`;
    if (this.selectedColor.id === 'rainbow') { const hue = (this.time.now / 5) % 360; colorStr = `hsla(${hue}, 100%, 50%, 0.6)`; }
    this.ctx.fillStyle = colorStr; this.ctx.shadowBlur = 10; this.ctx.shadowColor = colorStr;
    for (let i = 0; i < 6; i++) {
      const ox = Phaser.Math.Between(-15, 15); const oy = Phaser.Math.Between(-15, 15);
      this.ctx.beginPath(); this.ctx.arc(x + ox, y + oy, Phaser.Math.FloatBetween(1, 5), 0, Math.PI * 2); this.ctx.fill();
    }
    this.particles.emitParticleAt(x, y, 2);
    this.canvasTexture.update();
  }

  _createElegantButton(x, y, iconStr, labelStr, callback, holdDuration = 2000) {
    const btn = this.add.container(x, y).setDepth(1000);
    const aura = this.add.circle(0, 0, 65, 0x9c4eb3, 0.1).setStrokeStyle(3, 0xffffff, 0.1);
    const glow = this.add.circle(0, 0, 50, 0x40c0dd, 0.05);
    const core = this.add.circle(0, 0, 45, 0x000000, 0.8).setStrokeStyle(2, 0xffffff, 0.6);
    const icon = this.add.text(0, -6, iconStr, { fontSize: '36px' }).setOrigin(0.5);
    const label = this.add.text(0, 32, labelStr, { fontSize: '14px', fontFamily: 'Luckiest Guy', color: '#ffffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    btn.add([aura, glow, core, icon, label]);
    this.buttons.push({ x, y, cont: btn, callback, isPressed: false, holdDuration, holdTime: 0 });
    this.tweens.add({ targets: [aura, glow], scale: 1.15, alpha: 0.2, duration: 1500 + Math.random() * 500, yoyo: true, loop: -1 });
  }

  _createStyleMenu() {
    const { height } = this.scale;
    const btnY = height / 2 - 180;
    this.styleMenuCont = this.add.container(100, btnY).setDepth(1000).setVisible(false);
    const styles = [{ id: 'shootingStar', icon: '✨' }, { id: 'neon', icon: '🔦' }, { id: 'comet', icon: '☄️' }];
    styles.forEach((s, i) => {
      const xOffset = (i + 1) * 110;
      const subBtn = this.add.container(xOffset, 0);
      const glow = this.add.circle(0, 0, 45, 0x9c4eb3, 0.2).setDepth(-1);
      const bg = this.add.circle(0, 0, 40, 0x000000).setStrokeStyle(2, 0xffffff, 0.8);
      const txt = this.add.text(0, 0, s.icon, { fontSize: '28px' }).setOrigin(0.5);
      subBtn.add([glow, bg, txt]);
      this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.4, duration: 1000 + i * 200, yoyo: true, loop: -1 });
      this.styleMenuCont.add(subBtn);
      this.buttons.push({ x: 100 + xOffset, y: btnY, cont: subBtn, holdDuration: 1500, holdTime: 0, callback: () => { this.brushStyle = s.id; this.styleMenuCont.setVisible(false); } });
    });
  }

  _createColorMenu() {
    const { height } = this.scale;
    const btnY = height / 2 - 60;
    this.colorMenuCont = this.add.container(100, btnY).setDepth(1000).setVisible(false);
    this.availableColors.forEach((c, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const xOffset = (col + 1) * 110;
      const yOffset = row === 0 ? -55 : 55;
      const subBtn = this.add.container(xOffset, yOffset);
      const glow = this.add.circle(0, 0, 40, c.hex, 0.2).setDepth(-1);
      const bg = c.id === 'rainbow' ? this.add.circle(0, 0, 35, 0xffffff).setStrokeStyle(3, 0xffffff) : this.add.circle(0, 0, 35, c.hex).setStrokeStyle(3, 0xffffff, 0.8);
      if (c.id === 'rainbow') { const txt = this.add.text(0, 0, '🌈', { fontSize: '24px' }).setOrigin(0.5); subBtn.add([glow, bg, txt]); }
      else { subBtn.add([glow, bg]); }
      this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.5, duration: 1200 + i * 100, yoyo: true, loop: -1 });
      this.colorMenuCont.add(subBtn);
      this.buttons.push({
        x: 100 + xOffset, y: btnY + yOffset, cont: subBtn, holdDuration: 1500, holdTime: 0,
        callback: () => { this.selectedColor = c; if (this.brushStyle === 'eraser') this.brushStyle = 'shootingStar'; this.colorMenuCont.setVisible(false); }
      });
    });
  }

  _createBocetoMenu() {
    const { height } = this.scale;
    const btnY = height / 2 + 60;
    this.bocetoMenuCont = this.add.container(100, btnY).setDepth(1000).setVisible(false);
    const bocetos = [
      { id: 'boceto_arcoiris', icon: '🌈' }, { id: 'boceto_carro', icon: '🚗' },
      { id: 'boceto_castillo', icon: '🏰' }, { id: 'boceto_oso', icon: '🐻' },
      { id: 'boceto_parke', icon: '🎪' }, { id: 'boceto_sol', icon: '☀️' },
      { id: 'cohete', icon: '🚀' }, { id: 'clear', icon: '❌' }
    ];
    bocetos.forEach((b, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const xOffset = (col + 1) * 110;
      const yOffset = row === 0 ? -55 : 55;
      const subBtn = this.add.container(xOffset, yOffset);
      const glow = this.add.circle(0, 0, 40, 0x40c0dd, 0.15).setDepth(-1);
      const bg = this.add.circle(0, 0, 35, 0x000000).setStrokeStyle(2, 0xffffff, 0.7);
      const txt = this.add.text(0, 0, b.icon, { fontSize: '24px' }).setOrigin(0.5);
      subBtn.add([glow, bg, txt]);
      this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.3, duration: 1500, yoyo: true, loop: -1 });
      this.bocetoMenuCont.add(subBtn);
      this.buttons.push({
        x: 100 + xOffset, y: btnY + yOffset, cont: subBtn, holdDuration: 1500, holdTime: 0,
        callback: () => {
          if (b.id === 'clear') {
            if (this.bocetoImage) { this.bocetoImage.destroy(); this.bocetoImage = null; }
            this.plantillaImg.setVisible(false);
            this.bg.setVisible(true); this.nebulaGraphics.setVisible(true); this.starGraphics.setVisible(true); this.moonGraphics.setVisible(true); this.planetGraphics.setVisible(true);
          } else {
            if (this.bocetoImage) { this.bocetoImage.destroy(); this.bocetoImage = null; }
            this.bocetoImage = this.add.image(this.scale.width / 2, this.scale.height / 2, b.id).setDepth(900).setAlpha(0.85).setDisplaySize(this.scale.width * 0.70, this.scale.height * 0.70);
            this.plantillaImg.setVisible(true).setDepth(1);
            this.bg.setVisible(false); this.nebulaGraphics.setVisible(false); this.starGraphics.setVisible(false); this.moonGraphics.setVisible(false); this.planetGraphics.setVisible(false);
          }
          this.bocetoMenuCont.setVisible(false);
        }
      });
    });
  }

  _createEraserMenu() {
    const { width, height } = this.scale;
    const btnY = height / 2 - 120;
    this.eraserMenuCont = this.add.container(width - 100, btnY).setDepth(1000).setVisible(false);
    const sizes = [{ size: 20, dotR: 6 }, { size: 80, dotR: 14 }, { size: 180, dotR: 22 }];
    sizes.forEach((s, i) => {
      const xOffset = -(i + 1) * 110;
      const subBtn = this.add.container(xOffset, 0);
      const glow = this.add.circle(0, 0, 45, 0x40c0dd, 0.15).setDepth(-1);
      const bg = this.add.circle(0, 0, 40, 0x000000).setStrokeStyle(2, 0xffffff, 0.7);
      const dot = this.add.circle(0, 0, s.dotR, 0xffffff, 1);
      subBtn.add([glow, bg, dot]);
      this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.3, duration: 1500, yoyo: true, loop: -1 });
      this.eraserMenuCont.add(subBtn);
      this.buttons.push({
        x: width - 100 + xOffset, y: btnY, cont: subBtn, holdDuration: 1500, holdTime: 0,
        callback: () => { this.eraserSize = s.size; this.brushStyle = 'eraser'; this.eraserMenuCont.setVisible(false); this.sound.play('pop'); }
      });
    });
  }

  _createBrushMenu() {
    const { height } = this.scale;
    const btnY = height / 2 + 180;
    this.brushMenuCont = this.add.container(100, btnY).setDepth(1000).setVisible(false);
    const sizes = [{ size: 6, dotR: 4 }, { size: 16, dotR: 10 }, { size: 40, dotR: 18 }];
    sizes.forEach((s, i) => {
      const xOffset = (i + 1) * 110;
      const subBtn = this.add.container(xOffset, 0);
      const glow = this.add.circle(0, 0, 45, 0x9c4eb3, 0.2).setDepth(-1);
      const bg = this.add.circle(0, 0, 40, 0x000000).setStrokeStyle(2, 0xffffff, 0.8);
      const dot = this.add.circle(0, 0, s.dotR, 0xffffff, 1);
      subBtn.add([glow, bg, dot]);
      this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.4, duration: 1000 + i * 200, yoyo: true, loop: -1 });
      this.brushMenuCont.add(subBtn);
      this.buttons.push({
        x: 100 + xOffset, y: btnY, cont: subBtn, holdDuration: 1500, holdTime: 0,
        callback: () => { this.brushSize = s.size; if (this.brushStyle === 'eraser') this.brushStyle = 'shootingStar'; this.brushMenuCont.setVisible(false); this.sound.play('pop'); }
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

  _toggleEraserMenu() {
    this.eraserMenuCont.setVisible(!this.eraserMenuCont.visible);
    if (this.styleMenuCont) this.styleMenuCont.setVisible(false);
    if (this.colorMenuCont) this.colorMenuCont.setVisible(false);
    if (this.bocetoMenuCont) this.bocetoMenuCont.setVisible(false);
    if (this.brushMenuCont) this.brushMenuCont.setVisible(false);
    this.sound.play('pop');
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
    this._clearingStartTime = null;
    const { width, height } = this.scale;
    const warpLine = this.add.rectangle(-width / 2, height / 2, width, height, 0xffffff, 0.95).setDepth(200);
    this.sound.play('pop', { volume: 0.5 });
    this.tweens.add({
      targets: warpLine, x: width / 2, duration: 500, ease: 'Cubic.easeIn',
      onComplete: () => {
        if (this.bocetoImage) { this.bocetoImage.destroy(); this.bocetoImage = null; }
        this.plantillaImg.setVisible(false);
        this.bg.setVisible(true); this.nebulaGraphics.setVisible(true); this.starGraphics.setVisible(true); this.moonGraphics.setVisible(true); this.planetGraphics.setVisible(true);
        try { this.bgIndex = (this.bgIndex + 1) % this.planets.length; this._updatePlanetGraphics(); }
        catch (e) { console.warn('Error al actualizar planeta:', e); this.bgIndex = (this.bgIndex + 1) % this.planets.length; }
        this.tweens.add({ targets: warpLine, x: width * 1.5, duration: 500, ease: 'Cubic.easeOut', onComplete: () => { warpLine.destroy(); this.isClearing = false; } });
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
      onStart: () => { this.time.delayedCall(300, () => { this.ctx.clearRect(0, 0, this.scale.width, this.scale.height); this.canvasTexture.update(); }); },
      onComplete: () => { flash.destroy(); this.isClearing = false; }
    });
    this.time.delayedCall(2000, () => { if (flash && flash.active) { flash.destroy(); this.isClearing = false; } });
  }

  shutdown() {
    this.isDrawing = false;
    this.lastX = null;
    this.lastY = null;
    window.removeEventListener('ws-message', this._impactHandler);
    if (this.canvasTexture) this.canvasTexture.destroy();
  }
}