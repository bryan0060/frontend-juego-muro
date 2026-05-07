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
      { name: 'TIERRA', colors: [0x020208, 0x020208, 0x050515, 0x1a2a4a], accent: 0x40c0dd, planetColor: 0x224488 },
      { name: 'MARTE', colors: [0x1a0a05, 0x1a0a05, 0x3a1a05, 0x5a1a05], accent: 0xfa804f, planetColor: 0x8a2a05 },
      { name: 'NEPTUNO', colors: [0x050515, 0x050515, 0x0a0a25, 0x1a1a4a], accent: 0x40c0dd, planetColor: 0x1a1a4a },
      { name: 'SATURNO', colors: [0x1a1505, 0x1a1505, 0x2a2505, 0x4e4a1e], accent: 0xfdbf2c, planetColor: 0x6e5a1e }
    ];

    // --- 2. ELEMENTOS DE FONDO ---
    this.bg = this.add.graphics().setDepth(0);
    this.starGraphics = this.add.graphics().setDepth(1);
    this.planet = this.add.circle(width / 2, height / 2, 250, 0xffffff, 0.1).setDepth(2);
    this._updatePlanetGraphics();

    // --- 3. LIENZO Y HISTORIAL ---
    this.canvasTexture = this.textures.createCanvas('drawingCanvas', width, height);
    this.canvasImage = this.add.image(0, 0, 'drawingCanvas').setOrigin(0).setDepth(5);
    
    // Imagen base para el boceto a dibujar (debajo del lienzo)
    this.bocetoImage = this.add.image(width / 2, height / 2 + 50, '').setDepth(4).setAlpha(0.25).setVisible(false);
    // Escalar la imagen de boceto por defecto
    this.bocetoImage.setScale(0.8);

    this.ctx = this.canvasTexture.context;
    this.history = [];
    this.isDrawing = false;

    this.brushStyle = 'shootingStar';
    this.availableColors = [
      { id: 'white', hex: 0xffffff, str: '255, 255, 255' },
      { id: 'red', hex: 0xff3333, str: '255, 51, 51' },
      { id: 'green', hex: 0x33ff33, str: '51, 255, 51' },
      { id: 'blue', hex: 0x3399ff, str: '51, 153, 255' },
      { id: 'yellow', hex: 0xffff33, str: '255, 255, 51' },
      { id: 'purple', hex: 0xff33ff, str: '255, 51, 255' }
    ];
    this.selectedColor = this.availableColors[0];
    this.lastX = null;
    this.lastY = null;

    // --- 4. PARTÍCULAS ---
    this.particles = this.add.particles(0, 0, '__DEFAULT', {
      scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
      speed: { min: 60, max: 200 }, lifespan: 400, blendMode: 'ADD'
    }).setDepth(10);

    // --- 5. BOTONES PRINCIPALES ---
    this.buttons = [];
    // Abajo Derecha
    this._createElegantButton(width - 100, height - 100, '✨', 'BORRAR', () => this._supernovaClear());
    this._createElegantButton(width - 240, height - 100, '↩️', 'ATRÁS', () => this._undo());
    // Arriba
    this._createElegantButton(100, 100, '🌌', 'VIAJAR', () => this._warpTravel());
    this._createElegantButton(width - 100, 100, '✏️', 'ESTILO', () => this._toggleStyleMenu());
    this._createElegantButton(width - 240, 100, '🎨', 'COLOR', () => this._toggleColorMenu());
    this._createElegantButton(width - 380, 100, '🖼️', 'BOCETO', () => this._toggleBocetoMenu());

    // --- 6. MENÚS DESPLEGABLES ---
    this._createStyleMenu();
    this._createColorMenu();
    this._createBocetoMenu();

    // --- 7. INPUTS Y SENSOR ---
    this._setupInputs();
    this._impactHandler = (e) => {
      if (e.detail.port !== 8081) return;
      this.isDrawing = true;
      this._handleAction(e.detail.x, e.detail.y);
    };
    window.addEventListener('ws-message', this._impactHandler);

    this.add.text(width / 2, 60, '✨ PIZARRA GALÁCTICA ✨', {
      fontSize: '42px', fontFamily: 'Fredoka', color: '#fdbf2c',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(20);

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

  _updatePlanetGraphics() {
    const { width, height } = this.scale;
    const theme = this.planets[this.bgIndex];
    this.bg.clear();
    this.bg.fillGradientStyle(...theme.colors, 1);
    this.bg.fillRect(0, 0, width, height);
    this.planet.setFillStyle(theme.planetColor, 0.2);
    this.planet.setStrokeStyle(4, theme.accent, 0.4);
    this._createStaticStars(width, height);
  }

  _createStaticStars(w, h) {
    this.starGraphics.clear();
    for (let i = 0; i < 400; i++) {
      this.starGraphics.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      this.starGraphics.fillCircle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), Phaser.Math.FloatBetween(0.3, 2));
    }
  }

  _setupInputs() {
    this.input.on('pointerdown', (p) => { this.isDrawing = false; this._handleAction(p.x, p.y); });
    this.input.on('pointermove', (p) => { if (p.isDown) this._handleAction(p.x, p.y); });
    this.input.on('pointerup', () => { this.isDrawing = false; this.lastX = null; this.lastY = null; });
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
    if (this.isClearing) return;
    this.lastActionTime = this.time.now;

    for (let btn of this.buttons) {
      let isVisible = btn.cont.visible;
      if (btn.cont.parentContainer && !btn.cont.parentContainer.visible) {
        isVisible = false;
      }
      if (!isVisible) continue;

      if (Phaser.Math.Distance.Between(x, y, btn.x, btn.y) < 70) {
        if (!btn.isPressed) {
          btn.isPressed = true;
          this.tweens.add({ targets: btn.cont, scale: 0.8, duration: 100, yoyo: true, onComplete: () => btn.isPressed = false });
          
          if (btn.requiresDoubleClick) {
            const now = this.time.now;
            if (btn.lastClickTime && (now - btn.lastClickTime < 1000)) {
               btn.callback();
               btn.lastClickTime = 0;
            } else {
               btn.lastClickTime = now;
               // Indicador visual de que se requiere otro click
               const indicator = this.add.circle(btn.x, btn.y, 70).setStrokeStyle(4, 0xff0000, 0.8).setDepth(100);
               this.tweens.add({ targets: indicator, scale: 1.5, alpha: 0, duration: 400, onComplete: () => indicator.destroy() });
            }
          } else {
            btn.callback();
          }
        }
        return;
      }
    }

    if (!this.isDrawing) { this._saveHistory(); this.isDrawing = true; this.lastX = null; this.lastY = null; }

    if (this.time.now % 6 === 0) this.sound.play('tick', { volume: 0.15 });

    if (this.brushStyle === 'shootingStar') this._drawShootingStar(x, y);
    else if (this.brushStyle === 'neon') this._drawNeon(x, y);
    else if (this.brushStyle === 'comet') this._drawComet(x, y);

    this.lastX = x; this.lastY = y;
  }

  _drawShootingStar(x, y) {
    const colorStr = `rgb(${this.selectedColor.str})`;
    this.ctx.strokeStyle = colorStr; this.ctx.lineCap = 'round'; this.ctx.lineWidth = 16;
    this.ctx.shadowBlur = 15; this.ctx.shadowColor = colorStr;
    this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    else { this.ctx.arc(x, y, 8, 0, Math.PI * 2); }
    this.ctx.stroke();
    this.ctx.lineWidth = 4; this.ctx.strokeStyle = 'white'; this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    this.ctx.stroke();
    this.canvasTexture.update();
  }

  _drawNeon(x, y) {
    const colorStr = `rgba(${this.selectedColor.str}, 0.8)`;
    this.ctx.strokeStyle = colorStr; this.ctx.lineWidth = 35; this.ctx.shadowBlur = 30; this.ctx.shadowColor = colorStr;
    this.ctx.beginPath();
    if (this.lastX !== null && this.lastY !== null) { this.ctx.moveTo(this.lastX, this.lastY); this.ctx.lineTo(x, y); }
    else { this.ctx.arc(x, y, 16, 0, Math.PI * 2); }
    this.ctx.stroke();
    this.canvasTexture.update();
  }

  _drawComet(x, y) {
    const colorStr = `rgba(${this.selectedColor.str}, 0.6)`;
    this.ctx.fillStyle = colorStr; this.ctx.shadowBlur = 10; this.ctx.shadowColor = colorStr;
    for (let i = 0; i < 6; i++) {
      const ox = Phaser.Math.Between(-15, 15); const oy = Phaser.Math.Between(-15, 15);
      this.ctx.beginPath(); this.ctx.arc(x + ox, y + oy, Phaser.Math.FloatBetween(1, 5), 0, Math.PI * 2); this.ctx.fill();
    }
    this.particles.emitParticleAt(x, y, 2);
    this.canvasTexture.update();
  }

  _createElegantButton(x, y, iconStr, labelStr, callback, requiresDoubleClick = true) {
    const cont = this.add.container(x, y).setDepth(30);
    const aura = this.add.circle(0, 0, 60, 0xffffff, 0.05).setStrokeStyle(2, 0xffffff, 0.2);
    const core = this.add.circle(0, 0, 40, 0x000000).setStrokeStyle(2, 0xffffff, 0.5);
    const icon = this.add.text(0, -6, iconStr, { fontSize: '32px' }).setOrigin(0.5);
    const label = this.add.text(0, 30, labelStr, { fontSize: '13px', fontFamily: 'Fredoka', color: '#ffffff' }).setOrigin(0.5);
    cont.add([aura, core, icon, label]);
    this.buttons.push({ x, y, cont, callback, isPressed: false, requiresDoubleClick, lastClickTime: 0 });
    this.tweens.add({ targets: aura, scale: 1.2, alpha: 0.2, duration: 1500, yoyo: true, loop: -1 });
  }

  _createStyleMenu() {
    const { width } = this.scale;
    this.styleMenuCont = this.add.container(width - 100, 200).setDepth(40).setVisible(false);
    const styles = [{ id: 'shootingStar', icon: '✨' }, { id: 'neon', icon: '🔦' }, { id: 'comet', icon: '☄️' }];
    styles.forEach((s, i) => {
      const spacing = 100;
      const subBtn = this.add.container(0, i * spacing);
      const bg = this.add.circle(0, 0, 40, 0x000000).setStrokeStyle(2, 0xfdbf2c);
      const txt = this.add.text(0, 0, s.icon, { fontSize: '28px' }).setOrigin(0.5);
      subBtn.add([bg, txt]);
      this.styleMenuCont.add(subBtn);
      this.buttons.push({
        x: width - 100, y: 200 + i * spacing, cont: subBtn,
        requiresDoubleClick: false,
        callback: () => { this.brushStyle = s.id; this.styleMenuCont.setVisible(false); }
      });
    });
  }

  _createColorMenu() {
    const { width } = this.scale;
    this.colorMenuCont = this.add.container(width - 240, 200).setDepth(40).setVisible(false);
    this.availableColors.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xOffset = col === 0 ? -45 : 45;
      const yOffset = row * 90;
      
      const subBtn = this.add.container(xOffset, yOffset);
      const bg = this.add.circle(0, 0, 35, c.hex).setStrokeStyle(3, 0xffffff);
      subBtn.add([bg]);
      this.colorMenuCont.add(subBtn);
      this.buttons.push({
        x: width - 240 + xOffset, y: 200 + yOffset, cont: subBtn,
        requiresDoubleClick: false,
        callback: () => { this.selectedColor = c; this.colorMenuCont.setVisible(false); }
      });
    });
  }

  _createBocetoMenu() {
    const { width } = this.scale;
    this.bocetoMenuCont = this.add.container(width - 380, 200).setDepth(40).setVisible(false);
    
    const bocetos = [
      { id: 'boceto_arcoiris', icon: '🌈' },
      { id: 'boceto_carro', icon: '🚗' },
      { id: 'boceto_castillo', icon: '🏰' },
      { id: 'boceto_oso', icon: '🐻' },
      { id: 'boceto_parke', icon: '🎪' },
      { id: 'boceto_sol', icon: '☀️' },
      { id: 'clear', icon: '❌' }
    ];

    bocetos.forEach((b, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xOffset = col === 0 ? -45 : 45;
      const yOffset = row * 90;

      const subBtn = this.add.container(xOffset, yOffset);
      const bg = this.add.circle(0, 0, 35, 0x000000).setStrokeStyle(2, 0x40c0dd);
      const txt = this.add.text(0, 0, b.icon, { fontSize: '24px' }).setOrigin(0.5);
      subBtn.add([bg, txt]);
      this.bocetoMenuCont.add(subBtn);
      this.buttons.push({
        x: width - 380 + xOffset, y: 200 + yOffset, cont: subBtn,
        requiresDoubleClick: false,
        callback: () => { 
          if (b.id === 'clear') {
            this.bocetoImage.setVisible(false);
          } else {
            this.bocetoImage.setTexture(b.id);
            this.bocetoImage.setVisible(true);
            
            // Ajustar el tamaño si es muy grande
            const maxW = 800;
            const maxH = 800;
            let scale = 0.8;
            if (this.bocetoImage.width > maxW) scale = maxW / this.bocetoImage.width;
            if (this.bocetoImage.height * scale > maxH) scale = maxH / this.bocetoImage.height;
            this.bocetoImage.setScale(scale);
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
    this.sound.play('pop');
  }

  _warpTravel() {
    if (this.isClearing) return;
    this.isClearing = true;
    const { width, height } = this.scale;
    const warpLine = this.add.rectangle(-300, height / 2, 600, height, 0xffffff, 0.9).setDepth(100);
    this.tweens.add({
      targets: warpLine, x: width + 600, duration: 1000, ease: 'Cubic.easeInOut',
      onUpdate: () => {
        if (warpLine.x > width / 2 && this.isClearing) {
          this.bgIndex = (this.bgIndex + 1) % this.planets.length;
          this._updatePlanetGraphics();
          this.isClearing = false;
        }
      },
      onComplete: () => { warpLine.destroy(); this.isClearing = false; }
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
  }

  shutdown() {
  this.isDrawing = false;
  this.lastX = null;
  this.lastY = null;
  window.removeEventListener('ws-message', this._impactHandler);
  if (this.canvasTexture) this.canvasTexture.destroy();
}
}
