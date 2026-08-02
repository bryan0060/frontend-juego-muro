import * as Phaser from 'phaser';
import { sendMessage } from '../../services/websocket/WebSocketClient.js';

const C = { purple: 0x9c4eb3, green: 0x3dc9a1, orange: 0xfa804f, yellow: 0xfdbf2c, blue: 0x40c0dd };

const CONEXIONES = [
  ['nariz', 'hombro_izquierdo'], ['nariz', 'hombro_derecho'],
  ['hombro_izquierdo', 'hombro_derecho'],
  ['hombro_izquierdo', 'codo_izquierdo'], ['codo_izquierdo', 'muneca_izquierda'],
  ['hombro_derecho', 'codo_derecho'], ['codo_derecho', 'muneca_derecha'],
  ['hombro_izquierdo', 'cadera_izquierda'], ['hombro_derecho', 'cadera_derecha'],
  ['cadera_izquierda', 'cadera_derecha'],
  ['cadera_izquierda', 'rodilla_izquierda'], ['rodilla_izquierda', 'tobillo_izquierdo'],
  ['cadera_derecha', 'rodilla_derecha'], ['rodilla_derecha', 'tobillo_derecho'],
];


const CANCIONES = {
  grandes: [
    { id: 'asereje', titulo: 'Aserejé', artista: 'Las Ketchup', videoKey: 'just_dance_asereje', bgKey: 'just_dance_bg_grandes', evalsKey: 'evals_asereje', strictness: 4.5 },
    { id: 'yamal', titulo: 'Pase de Yamal', artista: '', videoKey: 'just_dance_lamine', bgKey: 'just_dance_bg_grandes', evalsKey: 'evals_yamal', strictness: 5.0, joints: ['muneca_izquierda', 'muneca_derecha'] },
    { id: 'dale_pa_ve', titulo: "Dale Pa' Ve", artista: '', videoKey: 'just_dance_dalepave', bgKey: 'just_dance_bg_grandes', evalsKey: 'evals_dale_pa_ve', strictness: 4.5 },
    { id: 'la_bomba', titulo: 'La Bomba', artista: '', videoKey: 'just_dance_bomba', bgKey: 'just_dance_bg_grandes', evalsKey: 'evals_la_bomba', strictness: 4.5 },
  ],
  ninos: [
    { id: 'cuerpo', titulo: 'El Baile del Cuerpo', artista: '', videoKey: 'just_dance_cuerpo', bgKey: 'just_dance_bg_ninos', evalsKey: 'evals_cuerpo', strictness: 3.7 },
    { id: 'macarena', titulo: 'Macarena', artista: 'Los del Río', videoKey: 'just_dance_macarena', bgKey: 'just_dance_bg_ninos', evalsKey: 'evals_macarena', strictness: 6.0 },
    { id: 'taza', titulo: 'Soy una Taza', artista: '', videoKey: 'just_dance_taza', bgKey: 'just_dance_bg_ninos', evalsKey: 'evals_taza', strictness: 6.8 },
  ],
};

const GRADES = [
  { label: '¡PERFECT!', min: 0.75, color: 0xfdbf2c, pts: 500 },
  { label: '¡GENIAL!', min: 0.55, color: 0x3dc9a1, pts: 300 },
  { label: '¡BIEN!', min: 0.35, color: 0x40c0dd, pts: 150 },
  { label: '¡MUÉVETE!', min: 0, color: 0xfa804f, pts: 0 },
];

const ST = { SELECT: 'SELECT', COUNTDOWN: 'COUNTDOWN', PLAYING: 'PLAYING', PREVIEW: 'PREVIEW', EVAL: 'EVAL', RESULTS: 'RESULTS' };

function poseSim(a, b, strictness = 2.5, joints = null) {
  const keys = joints
    ? joints.filter(k => a[k] && b[k])
    : Object.keys(b).filter(k => a[k] && b[k]);
  if (keys.length === 0) return 0;
  const totalDist = keys.reduce((sum, k) => {
    const dx = a[k].x - b[k].x;
    const dy = a[k].y - b[k].y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  const avgDist = totalDist / keys.length;
  return Math.max(0, 1 - avgDist * strictness);
}

function getGrade(sim) {
  return GRADES.find(g => sim >= g.min) ?? GRADES[GRADES.length - 1];
}

// ══════════════════════════════════════════════════════════════════════════════
export class JustDanceScene extends Phaser.Scene {
  constructor() { super({ key: 'JustDanceScene' }); }

  init(data) {
    this.modo = data?.modo ?? 'grandes';
    this._debugEsqueleto = false;
    this.state = ST.SELECT;
    this.esqueletoActual = null;
    this.cancion = null;
    this.score = 0;
    this.combo = 0;
    this.groove = 50;
    this.resultados = [];
    this.sensorButtons = [];
    this.holdBtn = null;
    this._evalIdx = 0;
    this._evalTimer = null;
    this._previewTimer = null;
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;

    this._wsHandler = this._onWsMessage.bind(this);
    window.addEventListener('ws-message', this._wsHandler);

    this.grafEsqueleto = this.add.graphics().setDepth(15);

    this.holdGraphics = this.add.graphics().setDepth(99999);
    this.gfxSilueta = this.add.graphics().setDepth(50);
    this.gfxHUD = this.add.graphics().setDepth(60);

    this._mostrarSongSelect();
  }

  _normalizarEsqueleto(esq) {
    const joints = Object.values(esq).filter(p => p);
    if (joints.length === 0) return esq;

    const minY = Math.min(...joints.map(p => p.y));
    const maxY = Math.max(...joints.map(p => p.y));
    const minX = Math.min(...joints.map(p => p.x));
    const maxX = Math.max(...joints.map(p => p.x));

    const spanY = maxY - minY || 1;
    const centerY = (minY + maxY) / 2;
    const centerX = (minX + maxX) / 2;
    const escala = 0.70 / spanY;

    const result = {};
    Object.entries(esq).forEach(([key, p]) => {
      if (!p) { result[key] = p; return; }
      result[key] = {
        x: 0.50 + (p.x - centerX) * escala,
        y: 0.48 + (p.y - centerY) * escala,
      };
    });
    return result;
  }

  // ── WebSocket ────────────────────────────────────────────────────────────────
  _onWsMessage(e) {
    try {
      if (!this.scene?.isActive('JustDanceScene')) return;
    } catch (_) {
      return;
    }
    const d = e.detail;

    if (d.port === 8081) {
      const x = d.touches?.[0]?.x ?? d.x;
      const y = d.touches?.[0]?.y ?? d.y;
      if (x !== undefined) this._hitTest(x, y);
      return;
    }

    if (d.port === 8080 && d.juego_activo === 'poses') {
      this.esqueletoActual = d.poses?.esqueleto ?? null;
    }
  }

  _hitTest(x, y) {
    const ahora = Date.now();
    if (ahora - (this._lastHit ?? 0) < 800) return;

    for (const btn of this.sensorButtons) {
      if (x >= btn.absX - btn.w / 2 && x <= btn.absX + btn.w / 2 &&
        y >= btn.absY - btn.h / 2 && y <= btn.absY + btn.h / 2) {
        this._lastHit = ahora;
        btn.callback();
        return;
      }
    }
  }

  // ── SONG SELECT ──────────────────────────────────────────────────────────────
  _mostrarSongSelect() {
    const { W, H } = this;
    this.state = ST.SELECT;
    this.sensorButtons = [];
    this._limpiarEscena();

    const canciones = CANCIONES[this.modo];
    const bgKey = this.modo === 'grandes' ? 'just_dance_bg_grandes' : 'just_dance_bg_ninos';
    const esModo = this.modo === 'grandes';
    const otroModo = this.modo === 'grandes' ? 'ninos' : 'grandes';

    this.add.image(W / 2, H / 2, bgKey).setDisplaySize(W, H).setDepth(0);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(1);

    // Título
    this.add.text(W / 2, 48, 'JUST DANCE', {
      fontSize: '52px', fontFamily: 'Arial Black',
      color: '#ffffff', stroke: '#9c4eb3', strokeThickness: 10,
    }).setOrigin(0.5).setDepth(2);

    // Badge modo actual
    this.add.text(W / 2, 95, esModo ? '🔥 MODO GRANDES' : '⭐ MODO NIÑOS', {
      fontSize: '22px', fontFamily: 'Arial Black',
      color: '#000000', backgroundColor: esModo ? '#fa804f' : '#fdbf2c',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setDepth(2);

    // Botón cambiar modo
    const btnW = 220, btnH = 48;
    const btnX = W - btnW - 20, btnY = 20;

    const switchGfx = this.add.graphics().setDepth(2);
    const drawSwitch = (color) => {
      switchGfx.clear();
      switchGfx.fillStyle(color, 1);
      switchGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 14);
      switchGfx.lineStyle(2, C.green, 1);
      switchGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 14);
    };
    drawSwitch(C.purple);

    this.add.text(btnX + btnW / 2, btnY + btnH / 2, '🔄 CAMBIAR MODO', {
      fontSize: '18px', fontFamily: 'Arial Black',
      color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
      .setDepth(4).setInteractive()
      .on('pointerover', () => drawSwitch(C.blue))
      .on('pointerout', () => drawSwitch(C.purple))
      .on('pointerdown', () => { this.sound.play('pop'); this.scene.restart({ modo: otroModo }); });

    this.sensorButtons.push({
      absX: btnX + btnW / 2, absY: btnY + btnH / 2, w: btnW + 60, h: btnH + 40,
      callback: () => {
        this.sound.play('pop');
        this._limpiarEscena();
        this.scene.restart({ modo: otroModo });
      },
    });

    // Cards
    const cols = 2;
    const cardW = 440, cardH = 180;
    const gapX = 40, gapY = 24;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = W / 2 - totalW / 2 + cardW / 2;
    const startY = 360;

    canciones.forEach((cancion, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);
      const disponible = !!cancion.videoKey;

      const gfx = this.add.graphics().setDepth(2);

      // Sombra
      gfx.fillStyle(0x000000, 0.4);
      gfx.fillRoundedRect(cx - cardW / 2 + 5, cy - cardH / 2 + 5, cardW, cardH, 18);

      // Fondo
      gfx.fillStyle(disponible ? 0x1a0a2e : 0x111111, 0.96);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 18);

      if (disponible) {
        [[C.purple, 0.15, 10], [C.purple, 0.4, 4], [C.green, 1, 2]].forEach(([c, a, t]) => {
          gfx.lineStyle(t, c, a);
          gfx.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 18);
        });
        gfx.fillStyle(C.purple, 1);
        gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, 6, { tl: 18, tr: 18, bl: 0, br: 0 });
      } else {
        gfx.lineStyle(1, 0x333333, 1);
        gfx.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 18);
      }

      this.add.text(cx, cy - 35, cancion.titulo, {
        fontSize: '32px', fontFamily: 'Arial Black',
        color: disponible ? '#ffffff' : '#555555',
        stroke: '#000', strokeThickness: 5,
        wordWrap: { width: cardW - 40 }, align: 'center',
      }).setOrigin(0.5).setDepth(3);

      if (cancion.artista) {
        this.add.text(cx, cy + 8, cancion.artista, {
          fontSize: '18px', fontFamily: 'Arial',
          color: disponible ? '#aaaaaa' : '#444444',
        }).setOrigin(0.5).setDepth(3);
      }

      this.add.text(cx, cy + cardH / 2 - 28, disponible ? '▶  JUGAR' : 'PRÓXIMAMENTE', {
        fontSize: '18px', fontFamily: 'Arial Black',
        color: disponible ? '#fdbf2c' : '#444444',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(3);

      if (disponible) {
        const zone = this.add.zone(cx, cy, cardW, cardH).setDepth(4).setInteractive();
        zone.on('pointerover', () => this.tweens.add({ targets: gfx, alpha: 1.1, duration: 120 }));
        zone.on('pointerout', () => this.tweens.add({ targets: gfx, alpha: 1, duration: 120 }));
        zone.on('pointerdown', () => { this.sound.play('pop'); this._seleccionarCancion(cancion); });

        this.sensorButtons.push({
          absX: cx, absY: cy, w: cardW, h: cardH,
          callback: () => { this.sound.play('pop'); this._seleccionarCancion(cancion); },
        });
      }
    });
    if (!this.registry.get('jd_music_playing')) {
      this._menuMusic = this.sound.add('jd_menu_music', { loop: true, volume: 0.5 });
      this._menuMusic.play();
      this.registry.set('jd_music_playing', true);
    }
  }

  _seleccionarCancion(cancion) {
    if (this._menuMusic) {
      this._menuMusic.stop();
      this._menuMusic.destroy();
      this._menuMusic = null;
      this.registry.set('jd_music_playing', false);
    }
    this.cancion = cancion;
    this._limpiarEscena();
    this._mostrarCountdown();
  }

  // ── COUNTDOWN ────────────────────────────────────────────────────────────────
  _mostrarCountdown() {
    const { W, H } = this;
    this.state = ST.COUNTDOWN;
    this.sensorButtons = [];

    this.add.image(W / 2, H / 2, this.cancion.bgKey).setDisplaySize(W, H).setDepth(0);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(1);

    this.add.text(W / 2, H / 2 - 120, this.cancion.titulo.toUpperCase(), {
      fontSize: '60px', fontFamily: 'Arial Black', color: '#fdbf2c',
      stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(2);

    let count = 3;
    const txt = this.add.text(W / 2, H / 2 + 20, '3', {
      fontSize: '200px', fontFamily: 'Arial Black', color: '#ffffff',
      stroke: '#9c4eb3', strokeThickness: 16,
    }).setOrigin(0.5).setDepth(2);

    const tick = () => {
      this.tweens.add({ targets: txt, scale: { from: 1.4, to: 1 }, duration: 400, ease: 'Bounce.easeOut' });
      this.sound.play('tick', { volume: 0.7 });
    };
    tick();

    this.time.addEvent({
      delay: 1000, repeat: 3, callback: () => {
        count--;
        if (count > 0) { txt.setText(String(count)); tick(); }
        else if (count === 0) { txt.setText('¡YA!'); txt.setColor('#3dc9a1'); tick(); }
        else { this._iniciarJuego(); }
      }
    });
  }

  // ── JUEGO ────────────────────────────────────────────────────────────────────
  _iniciarJuego() {
    const { W, H } = this;
    this.state = ST.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.groove = 50;
    this.resultados = [];
    this._evalIdx = 0;
    this.sensorButtons = [];
    this._limpiarEscena();

    // Video fullscreen — ya tiene el fondo integrado
    this._video = this.add.video(W / 2, H / 2, this.cancion.videoKey).setDepth(2);
    this._video.play(false);
    this._video.setVolume(0.8);
    this._video.on('play', () => {
      const scaleX = W / this._video.width;
      const scaleY = H / this._video.height;
      this._video.setScale(Math.max(scaleX, scaleY));
    });


    sendMessage({ juego: 'poses', modo: 'solo' }, 8080);
    this.time.delayedCall(500, () => sendMessage({ juego: 'poses', modo: 'solo' }, 8080));
    this.time.delayedCall(1500, () => sendMessage({ juego: 'poses', modo: 'solo' }, 8080));

    this._buildHUD();
    const btnCambiar = this.add.text(20, 120, '🎵 Cambiar canción', {
      fontSize: '22px', fontFamily: 'Arial Black',
      color: '#ffffff', backgroundColor: '#00000088',
      padding: { x: 14, y: 8 },
    }).setOrigin(0, 0).setDepth(70).setInteractive({ cursor: 'pointer' });

    btnCambiar.on('pointerdown', () => {
      this.sound.play('pop');
      if (this._video) { this._video.stop(); this._video.destroy(); this._video = null; }
      this._mostrarSongSelect();
    });

    this.sensorButtons.push({
      absX: 110, absY: 132, w: 200, h: 44,
      callback: () => {
        this.sound.play('pop');
        if (this._video) { this._video.stop(); this._video.destroy(); this._video = null; }
        this._mostrarSongSelect();
      }
    });
    this._programarEvaluaciones();
    this._video.on('complete', () => this._mostrarResultados());
  }

  _programarEvaluaciones() {
    const evals = this.cache.json.get(this.cancion.evalsKey) ?? [];

    if (!evals || evals.length === 0) {
      this.time.delayedCall(10000, () => this._mostrarResultados());
      return;
    }

    evals.forEach((ev) => {
      const previewT = ev.t - 2;

      if (previewT > 0) {
        this.time.delayedCall(previewT * 1000, () => {
          if (this.state === ST.PLAYING || this.state === ST.PREVIEW || this.state === ST.EVAL) {
            this._mostrarPreview(ev.esqueleto);
          }
        });
      }

      this.time.delayedCall((ev.t + 1) * 1000, () => {
        if (this.state !== ST.RESULTS) {
          this._evaluarPose(ev.esqueleto);
        }
      });
    });
  }

  _normalizarPosePreview(pose) {
    const joints = Object.values(pose).filter(p => p);
    if (joints.length === 0) return pose;

    const minX = Math.min(...joints.map(p => p.x));
    const maxX = Math.max(...joints.map(p => p.x));
    const minY = Math.min(...joints.map(p => p.y));
    const maxY = Math.max(...joints.map(p => p.y));

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    const result = {};
    Object.entries(pose).forEach(([key, p]) => {
      if (!p) { result[key] = p; return; }
      result[key] = {
        x: 0.25 + ((p.x - minX) / spanX) * 0.5,
        y: 0.05 + ((p.y - minY) / spanY) * 0.9,
      };
    });
    return result;
  }

  // ── PREVIEW DE SILUETA ───────────────────────────────────────────────────────
  _mostrarPreview(pose) {
    this.state = ST.PREVIEW;
    const { W, H } = this;

    // Panel más grande, esquina inferior derecha, como Just Dance
    const pW = 280, pH = 380;
    const px = W - pW / 2 - 20;
    const py = H - pH / 2 - 20;

    this.gfxSilueta.clear();

    // Fondo oscuro semitransparente
    this.gfxSilueta.fillStyle(0x000000, 0.82);
    this.gfxSilueta.fillRoundedRect(px - pW / 2, py - pH / 2, pW, pH, 20);

    // Borde neón multicapa
    [
      [C.yellow, 0.08, 18],
      [C.yellow, 0.25, 10],
      [C.yellow, 0.7, 4],
      [C.yellow, 1, 2],
    ].forEach(([col, alpha, thick]) => {
      this.gfxSilueta.lineStyle(thick, col, alpha);
      this.gfxSilueta.strokeRoundedRect(px - pW / 2, py - pH / 2, pW, pH, 20);
    });

    // Stickman
    this._dibujarStickman(
      this.gfxSilueta,
      this._normalizarPosePreview(pose),
      px - pW / 2 + 30, py - pH / 2 + 50,
      pW - 60, pH - 100
    );

    // Label arriba
    if (this._txtPreview) this._txtPreview.destroy();
    this._txtPreview = this.add.text(px, py - pH / 2 + 22, '¡PREPÁRATE!', {
      fontSize: '18px', fontFamily: 'Arial Black',
      color: '#000000', backgroundColor: '#fdbf2c',
      padding: { x: 14, y: 5 },
    }).setOrigin(0.5).setDepth(55);

    // Cuenta regresiva abajo
    let c = 3;
    if (this._cuentaPreview) this._cuentaPreview.destroy();
    this._cuentaPreview = this.add.text(px, py + pH / 2 - 24, '3', {
      fontSize: '38px', fontFamily: 'Arial Black',
      color: '#fdbf2c', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(55);

    this.time.addEvent({
      delay: 1000, repeat: 2, callback: () => {
        c--;
        if (this._cuentaPreview) {
          this._cuentaPreview.setText(c > 0 ? String(c) : '¡YA!');
          this.tweens.add({ targets: this._cuentaPreview, scale: { from: 1.4, to: 1 }, duration: 200, ease: 'Back.easeOut' });
        }
      }
    });

    // Pulso del panel
    this.tweens.add({
      targets: this.gfxSilueta,
      alpha: { from: 0.8, to: 1 },
      duration: 350, yoyo: true, repeat: 4,
    });
  }

  // Stickman sólido con glow — llámalo desde _mostrarPreview
  _dibujarStickman(gfx, pose, offX, offY, areaW, areaH) {
    const p = (key) => {
      if (!pose[key]) return null;
      return {
        x: offX + pose[key].x * areaW,
        y: offY + pose[key].y * areaH,
      };
    };

    const hI = p('hombro_izquierdo'), hD = p('hombro_derecho');
    const cI = p('cadera_izquierda'), cD = p('cadera_derecha');
    const nariz = p('nariz');
    const codoI = p('codo_izquierdo'), munI = p('muneca_izquierda');
    const codoD = p('codo_derecho'), munD = p('muneca_derecha');
    const rodI = p('rodilla_izquierda'), tobI = p('tobillo_izquierdo');
    const rodD = p('rodilla_derecha'), tobD = p('tobillo_derecho');

    const cxH = hI && hD ? (hI.x + hD.x) / 2 : null;
    const cyH = hI && hD ? (hI.y + hD.y) / 2 : null;
    const cxC = cI && cD ? (cI.x + cD.x) / 2 : null;
    const cyC = cI && cD ? (cI.y + cD.y) / 2 : null;

    let cabeza = null;
    if (cxH !== null && nariz) {
      const distNH = Math.sqrt((nariz.x - cxH) ** 2 + (nariz.y - cyH) ** 2);
      cabeza = {
        x: cxH + (nariz.x - cxH) * 0.3,
        y: cyH - distNH * 0.4,
      };
    }

    const huesos = [
      // Torso
      cxH !== null && cxC !== null ? [{ x: cxH, y: cyH }, { x: cxC, y: cyC }] : null,
      // Hombros
      hI && hD ? [hI, hD] : null,
      // Brazos
      hI && codoI ? [hI, codoI] : null,
      codoI && munI ? [codoI, munI] : null,
      hD && codoD ? [hD, codoD] : null,
      codoD && munD ? [codoD, munD] : null,
      // Piernas desde centro cadera
      cxC !== null && rodI ? [{ x: cxC, y: cyC }, rodI] : null,
      rodI && tobI ? [rodI, tobI] : null,
      cxC !== null && rodD ? [{ x: cxC, y: cyC }, rodD] : null,
      rodD && tobD ? [rodD, tobD] : null,
    ].filter(Boolean);

    const dibujarHuesos = (grosor, color, alpha) => {
      gfx.lineStyle(grosor, color, alpha);
      huesos.forEach(([a, b]) => {
        gfx.beginPath();
        gfx.moveTo(a.x, a.y);
        gfx.lineTo(b.x, b.y);
        gfx.strokePath();
      });
    };

    // Capa amarilla gruesa
    dibujarHuesos(20, C.yellow, 1);
    // Capa blanca fina encima
    dibujarHuesos(5, 0xffffff, 0.7);

    // Joints
    const joints = ['codo_izquierdo', 'codo_derecho', 'muneca_izquierda', 'muneca_derecha',
      'rodilla_izquierda', 'rodilla_derecha', 'tobillo_izquierdo', 'tobillo_derecho'];

    joints.forEach(k => {
      const pt = p(k);
      if (!pt) return;
      gfx.fillStyle(C.yellow, 1);
      gfx.fillCircle(pt.x, pt.y, 13);
      gfx.fillStyle(0xffffff, 0.7);
      gfx.fillCircle(pt.x, pt.y, 5);
    });

    // Cabeza
    if (cabeza && hI && hD) {
      const anchoH = Math.abs(hD.x - hI.x);
      const r = Math.min(Math.max(22, anchoH * 0.4), 32);
      gfx.fillStyle(C.yellow, 0.2);
      gfx.fillCircle(cabeza.x, cabeza.y, r * 1.4);
      gfx.fillStyle(C.yellow, 1);
      gfx.fillCircle(cabeza.x, cabeza.y, r);
      gfx.lineStyle(3, 0xffffff, 0.7);
      gfx.strokeCircle(cabeza.x, cabeza.y, r);
    }
  }

  // ── EVALUACIÓN ───────────────────────────────────────────────────────────────
  _evaluarPose(poseObjetivo) {
    if (this.state === ST.RESULTS) return;
    this.state = ST.EVAL;


    this.gfxSilueta.clear();
    if (this._txtPreview) { this._txtPreview.destroy(); this._txtPreview = null; }
    if (this._cuentaPreview) { this._cuentaPreview.destroy(); this._cuentaPreview = null; }
    if (this._stickCanvas) { this._stickCanvas.remove(); this._stickCanvas = null; }

    const esquNorm = this.esqueletoActual ? this._normalizarEsqueleto(this.esqueletoActual) : null;
    const sim = esquNorm ? poseSim(esquNorm, poseObjetivo, this.cancion.strictness ?? 2.5, this.cancion.joints ?? null) : 0;
    const grade = getGrade(sim);


    if (grade.label !== '¡MUÉVETE!') {
      this.combo++;
      const multi = Math.min(4, 1 + Math.floor(this.combo / 3));
      this.score += grade.pts * multi;
      this.groove = Math.min(100, this.groove + 12);
    } else {
      this.combo = 0;
      this.groove = Math.max(0, this.groove - 18);
    }

    this.resultados.push({ grade, sim });
    this._actualizarHUD();
    this._mostrarFeedback(grade);

    this.time.delayedCall(800, () => {
      if (this.state !== ST.RESULTS) this.state = ST.PLAYING;
    });
  }

  // ── FEEDBACK VISUAL ──────────────────────────────────────────────────────────
  _mostrarFeedback(grade) {
    const { W, H } = this;

    const colHex = `#${grade.color.toString(16).padStart(6, '0')}`;
    const { r, g, b } = this._hexToRGB(grade.color);

    this.cameras.main.flash(180, r, g, b, 0.22);
    if (grade.label === 'PERFECT') this.cameras.main.shake(130, 0.009);

    // Texto feedback
    const txt = this.add.text(W / 2, H / 2 - 80, grade.label, {
      fontSize: '120px', fontFamily: 'Arial Black',
      color: colHex, stroke: '#000000', strokeThickness: 16,
    }).setOrigin(0.5).setDepth(80).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: txt, alpha: 1, scale: 1,
      duration: 220, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({
        targets: txt, alpha: 0, y: txt.y - 90,
        duration: 550, delay: 350,
        onComplete: () => txt.destroy(),
      }),
    });

    // Partículas — crear y destruir, no reusar
    const emitter = this.add.particles(W / 2, H / 2, '__DEFAULT', {
      speed: { min: 100, max: 380 },
      scale: { start: 0.6, end: 0 },
      lifespan: 700,
      tint: grade.color,
      blendMode: 'ADD',
      quantity: grade.label === 'PERFECT' ? 60 : grade.label === 'GREAT' ? 35 : 15,
      emitting: false,
    }).setDepth(80);

    emitter.explode();
    this.time.delayedCall(800, () => emitter.destroy());

    // Combo
    if (this.combo > 1) {
      const multi = Math.min(4, 1 + Math.floor(this.combo / 3));
      const cm = this.add.text(W / 2, H / 2 + 70, `🔥 ×${multi} COMBO`, {
        fontSize: '54px', fontFamily: 'Arial Black',
        color: '#fa804f', stroke: '#000', strokeThickness: 8,
      }).setOrigin(0.5).setDepth(80).setAlpha(0);
      this.tweens.add({
        targets: cm, alpha: 1, y: cm.y - 30, duration: 300,
        onComplete: () => this.tweens.add({
          targets: cm, alpha: 0, duration: 500, delay: 400,
          onComplete: () => cm.destroy(),
        }),
      });
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  _buildHUD() {
    const { W, H } = this;

    // ── Score — esquina superior izquierda ──
    const scoreBg = this.add.graphics().setDepth(60);
    scoreBg.fillStyle(0x000000, 0.6);
    scoreBg.fillRoundedRect(W - 216, 16, 200, 90, 14);
    scoreBg.lineStyle(2, C.purple, 0.8);
    scoreBg.strokeRoundedRect(W - 216, 16, 200, 90, 14);

    this.add.text(W - 116, 24, 'SCORE', {
      fontSize: '16px', fontFamily: 'Arial Black',
      color: '#9c4eb3', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(61);

    this._txtScore = this.add.text(W - 116, 64, '0', {
      fontSize: '42px', fontFamily: 'Arial Black',
      color: '#ffffff', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(61);

    // Combo — debajo del score
    this._txtCombo = this.add.text(W - 116, 115, '', {
      fontSize: '26px', fontFamily: 'Arial Black',
      color: '#fa804f', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(61);

    // ── Nombre canción — top center ──
    const songBg = this.add.graphics().setDepth(60);
    songBg.fillStyle(0x000000, 0.55);
    songBg.fillRoundedRect(W / 2 - 240, 12, 480, 46, 12);
    this.add.text(W / 2, 35, `${this.cancion.titulo}  ·  ${this.cancion.artista}`, {
      fontSize: '22px', fontFamily: 'Arial Black',
      color: '#ffffff', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(61);

    // ── Groove bar — esquina superior derecha ──
    const gbX = W - 260, gbY = 20, gbW = 28, gbH = 220;

    const gbBg = this.add.graphics().setDepth(60);
    gbBg.fillStyle(0x000000, 0.6);
    gbBg.fillRoundedRect(gbX - gbW / 2 - 10, gbY - 10, gbW + 20, gbH + 50, 14);
    gbBg.lineStyle(2, C.blue, 0.6);
    gbBg.strokeRoundedRect(gbX - gbW / 2 - 10, gbY - 10, gbW + 20, gbH + 50, 14);

    this.add.text(gbX, gbY + gbH + 28, 'RITMO', {
      fontSize: '14px', fontFamily: 'Arial Black',
      color: '#40c0dd', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(61);

    this._grooveBarX = gbX;
    this._grooveBarY = gbY;
    this._grooveBarW = gbW;
    this._grooveBarH = gbH;
    this._gfxGroove = this.add.graphics().setDepth(61);
    this._drawGrooveBar();
  }

  _actualizarHUD() {
    this._txtScore.setText(`SCORE\n${this.score.toLocaleString()}`);
    this._txtCombo.setText(this.combo > 1 ? `🔥 ×${Math.min(4, 1 + Math.floor(this.combo / 3))}` : '');
    this._drawGrooveBar();
  }

  _drawGrooveBar() {
    const g = this._gfxGroove;
    if (!g) return;
    g.clear();

    const { _grooveBarX: x, _grooveBarY: y, _grooveBarW: bW, _grooveBarH: bH } = this;
    const fill = (bH * this.groove) / 100;

    // Fondo
    g.fillStyle(0x111111, 0.9);
    g.fillRoundedRect(x - bW / 2, y, bW, bH, 8);

    // Relleno con color dinámico
    const col = this.groove > 70 ? C.green : this.groove > 40 ? C.yellow : C.orange;

    // Glow
    g.fillStyle(col, 0.2);
    g.fillRoundedRect(x - bW / 2 - 4, y + bH - fill - 4, bW + 8, fill + 8, 8);

    // Barra principal
    g.fillStyle(col, 1);
    g.fillRoundedRect(x - bW / 2, y + bH - fill, bW, fill, 8);

    // Brillo superior
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(x - bW / 2, y + bH - fill, bW / 2, fill, { tl: 8, tr: 0, bl: 8, br: 0 });

    // Borde
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeRoundedRect(x - bW / 2, y, bW, bH, 8);

    // Marcas de nivel
    [0.25, 0.5, 0.75].forEach(pct => {
      const markY = y + bH - bH * pct;
      g.lineStyle(1, 0xffffff, 0.2);
      g.beginPath();
      g.moveTo(x - bW / 2, markY);
      g.lineTo(x + bW / 2, markY);
      g.strokePath();
    });
  }

  // ── DIBUJAR ESQUELETO ────────────────────────────────────────────────────────
  _dibujarEsqueleto(graphics, esqueleto, offsetX, offsetY, areaW, areaH, color, grosor, radio) {
    const hIzq = esqueleto['hombro_izquierdo'];
    const hDer = esqueleto['hombro_derecho'];
    const cIzq = esqueleto['cadera_izquierda'];
    const cDer = esqueleto['cadera_derecha'];
    const nariz = esqueleto['nariz'];

    const cxH = hIzq && hDer ? (hIzq.x + hDer.x) / 2 : null;
    const cyH = hIzq && hDer ? (hIzq.y + hDer.y) / 2 : null;
    const cxC = cIzq && cDer ? (cIzq.x + cDer.x) / 2 : null;
    const cyC = cIzq && cDer ? (cIzq.y + cDer.y) / 2 : null;

    let cabeza = null;
    if (cxH !== null && nariz) {
      const distNH = Math.sqrt((nariz.x - cxH) ** 2 + (nariz.y - cyH) ** 2);
      cabeza = {
        x: cxH + (nariz.x - cxH) * 0.3,
        y: cyH - distNH * 0.4,
      };
    }

    graphics.lineStyle(grosor, color, 1);

    // Torso
    if (cxH !== null && cxC !== null) {
      graphics.beginPath();
      graphics.moveTo(offsetX + cxH * areaW, offsetY + cyH * areaH);
      graphics.lineTo(offsetX + cxC * areaW, offsetY + cyC * areaH);
      graphics.strokePath();
    }

    // Hombros
    if (hIzq && hDer) {
      graphics.beginPath();
      graphics.moveTo(offsetX + hIzq.x * areaW, offsetY + hIzq.y * areaH);
      graphics.lineTo(offsetX + hDer.x * areaW, offsetY + hDer.y * areaH);
      graphics.strokePath();
    }

    // Brazos
    const codoIzq = esqueleto['codo_izquierdo'];
    const munecaIzq = esqueleto['muneca_izquierda'];
    const codoDer = esqueleto['codo_derecho'];
    const munecaDer = esqueleto['muneca_derecha'];

    [[hIzq, codoIzq], [codoIzq, munecaIzq], [hDer, codoDer], [codoDer, munecaDer]].forEach(([a, b]) => {
      if (!a || !b) return;
      graphics.beginPath();
      graphics.moveTo(offsetX + a.x * areaW, offsetY + a.y * areaH);
      graphics.lineTo(offsetX + b.x * areaW, offsetY + b.y * areaH);
      graphics.strokePath();
    });

    // Piernas desde centro cadera
    if (cxC !== null) {
      const ox = offsetX + cxC * areaW;
      const oy = offsetY + cyC * areaH;
      const rodIzq = esqueleto['rodilla_izquierda'];
      const tobIzq = esqueleto['tobillo_izquierdo'];
      const rodDer = esqueleto['rodilla_derecha'];
      const tobDer = esqueleto['tobillo_derecho'];

      [[{ x: cxC, y: cyC }, rodIzq], [rodIzq, tobIzq], [{ x: cxC, y: cyC }, rodDer], [rodDer, tobDer]].forEach(([a, b]) => {
        if (!a || !b) return;
        graphics.beginPath();
        graphics.moveTo(offsetX + a.x * areaW, offsetY + a.y * areaH);
        graphics.lineTo(offsetX + b.x * areaW, offsetY + b.y * areaH);
        graphics.strokePath();
      });
    }

    // Joints
    graphics.fillStyle(color, 1);
    ['codo_izquierdo', 'codo_derecho', 'muneca_izquierda', 'muneca_derecha',
      'rodilla_izquierda', 'rodilla_derecha', 'tobillo_izquierdo', 'tobillo_derecho'].forEach(nombre => {
        const p = esqueleto[nombre];
        if (!p) return;
        graphics.fillCircle(offsetX + p.x * areaW, offsetY + p.y * areaH, radio);
      });

    // Cabeza
    if (cabeza && hIzq && hDer) {
      const anchoHombros = Math.abs(hDer.x - hIzq.x) * areaW;
      const radioCabeza = Math.min(Math.max(radio * 2, anchoHombros * 0.18), 35);
      const cx = offsetX + cabeza.x * areaW;
      const cy = offsetY + cabeza.y * areaH;
      graphics.fillStyle(color, 0.2);
      graphics.fillCircle(cx, cy, radioCabeza * 1.4);
      graphics.fillStyle(color, 1);
      graphics.fillCircle(cx, cy, radioCabeza);
      graphics.lineStyle(3, 0xffffff, 0.6);
      graphics.strokeCircle(cx, cy, radioCabeza);
    }
  }

  // ── RESULTADOS ───────────────────────────────────────────────────────────────
  _mostrarResultados() {
    if (this.state === ST.RESULTS) return;
    this.state = ST.RESULTS;
    this.sensorButtons = [];

    if (this._video) { this._video.stop(); this._video.destroy(); this._video = null; }
    this.gfxSilueta.clear();
    this.gfxHUD.clear();
    this._limpiarEscena();

    const { W, H } = this;

    this.add.image(W / 2, H / 2, this.cancion.bgKey).setDisplaySize(W, H).setDepth(0);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82).setDepth(1);

    // Panel central
    const pW = 700, pH = 580;
    const panelGfx = this.add.graphics().setDepth(2);
    panelGfx.fillStyle(0x0d0720, 0.97);
    panelGfx.fillRoundedRect(W / 2 - pW / 2, H / 2 - pH / 2, pW, pH, 28);
    [[C.purple, 0.2, 14], [C.purple, 0.5, 5], [C.green, 1, 2]].forEach(([c, a, t]) => {
      panelGfx.lineStyle(t, c, a);
      panelGfx.strokeRoundedRect(W / 2 - pW / 2, H / 2 - pH / 2, pW, pH, 28);
    });
    // Barra top
    panelGfx.fillStyle(C.purple, 1);
    panelGfx.fillRoundedRect(W / 2 - pW / 2, H / 2 - pH / 2, pW, 8, { tl: 28, tr: 28, bl: 0, br: 0 });

    // Título
    this.add.text(W / 2, H / 2 - pH / 2 + 50, '¡FIN DE LA CANCIÓN!', {
      fontSize: '52px', fontFamily: 'Arial Black',
      color: '#fdbf2c', stroke: '#000', strokeThickness: 10,
    }).setOrigin(0.5).setDepth(3);

    // Nombre canción
    this.add.text(W / 2, H / 2 - pH / 2 + 105, this.cancion.titulo, {
      fontSize: '26px', fontFamily: 'Arial Black',
      color: '#aaaaaa', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    // Estrellas
    const estrellas = this.groove >= 80 ? 3 : this.groove >= 50 ? 2 : 1;
    this.add.text(W / 2, H / 2 - pH / 2 + 165, '⭐'.repeat(estrellas) + '☆'.repeat(3 - estrellas), {
      fontSize: '58px',
    }).setOrigin(0.5).setDepth(3);

    // Score
    this.add.text(W / 2, H / 2 - pH / 2 + 230, `${this.score.toLocaleString()}`, {
      fontSize: '72px', fontFamily: 'Arial Black',
      color: '#ffffff', stroke: '#9c4eb3', strokeThickness: 12,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(W / 2, H / 2 - pH / 2 + 285, 'PUNTOS', {
      fontSize: '20px', fontFamily: 'Arial Black',
      color: '#9c4eb3', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    // Breakdown
    if (this.resultados.length > 0) {
      const counts = { '¡PERFECT!': 0, '¡GENIAL!': 0, '¡BIEN!': 0, '¡MUÉVETE!': 0 };
      this.resultados.forEach(r => {
        if (r?.grade?.label && counts[r.grade.label] !== undefined)
          counts[r.grade.label]++;
      });

      const startY = H / 2 - pH / 2 + 330;
      const colW = pW / 4;

      GRADES.forEach((g, i) => {
        const cnt = counts[g.label] ?? 0;
        const cx = W / 2 - pW / 2 + colW * i + colW / 2;
        const col = `#${g.color.toString(16).padStart(6, '0')}`;

        // Pill
        const pill = this.add.graphics().setDepth(3);
        pill.fillStyle(g.color, 0.15);
        pill.fillRoundedRect(cx - 70, startY - 10, 140, 70, 12);
        pill.lineStyle(2, g.color, 0.6);
        pill.strokeRoundedRect(cx - 70, startY - 10, 140, 70, 12);

        this.add.text(cx, startY + 14, String(cnt), {
          fontSize: '36px', fontFamily: 'Arial Black',
          color: col, stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(4);

        this.add.text(cx, startY + 48, g.label, {
          fontSize: '13px', fontFamily: 'Arial Black',
          color: col,
        }).setOrigin(0.5).setDepth(4);
      });
    }

    // Partículas
    if (estrellas >= 2) {
      this.sound.play('victoria', { volume: 0.8 });
      this.add.particles(W / 2, -10, '__DEFAULT', {
        x: { min: 0, max: W }, y: -10,
        quantity: 2, frequency: 80, lifespan: 3500,
        speedY: { min: 100, max: 250 }, speedX: { min: -40, max: 40 },
        scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
        tint: [C.yellow, C.green, C.blue, C.orange, C.purple],
        blendMode: 'ADD',
      }).setDepth(5);
    } else {
      this.sound.play('end', { volume: 0.6 });
    }

    // Botones
    const makBtn = (cx, cy, bW, bH, label, color, cb) => {
      const gfx = this.add.graphics().setDepth(3);
      const draw = (c) => {
        gfx.clear();
        gfx.fillStyle(c, 1);
        gfx.fillRoundedRect(cx - bW / 2, cy - bH / 2, bW, bH, 14);
        gfx.lineStyle(2, 0xffffff, 0.3);
        gfx.strokeRoundedRect(cx - bW / 2, cy - bH / 2, bW, bH, 14);
      };
      draw(color);

      this.add.text(cx, cy, label, {
        fontSize: '22px', fontFamily: 'Arial Black',
        color: '#ffffff', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(4);

      this.add.zone(cx, cy, bW, bH).setDepth(5).setInteractive()
        .on('pointerover', () => draw(Phaser.Display.Color.IntegerToColor(color).brighten(30).color))
        .on('pointerout', () => draw(color))
        .on('pointerdown', () => { this.sound.play('pop'); cb(); });

      this.sensorButtons.push({ absX: cx, absY: cy, w: bW, h: bH, callback: cb });
    };

    const btnY = H / 2 + pH / 2 - 55;
    makBtn(W / 2 - 180, btnY, 300, 56, '🔄 JUGAR DE NUEVO', C.purple, () => this._seleccionarCancion(this.cancion));
    makBtn(W / 2 + 180, btnY, 300, 56, '🏠 CAMBIAR CANCIÓN', C.blue, () => this._mostrarSongSelect());
  }
  _espejearEsqueleto(esq) {
    const result = {};
    Object.entries(esq).forEach(([key, p]) => {
      if (!p) { result[key] = p; return; }
      result[key] = { x: 1 - p.x, y: p.y };
    });
    return result;
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────────
  update() {
    if (this.holdBtn) {
      this.holdBtn.time += this.game.loop.delta;
      const p = Math.min(this.holdBtn.time / this.holdBtn.duration, 1);
      this.holdGraphics.clear();
      this.holdGraphics.lineStyle(8, C.green, 0.8);
      this.holdGraphics.beginPath();
      this.holdGraphics.arc(this.holdBtn.x, this.holdBtn.y, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
      this.holdGraphics.strokePath();
      if (p >= 1) { const cb = this.holdBtn.callback; this.holdBtn = null; this.holdGraphics.clear(); cb(); }
    }

    if (!this.grafEsqueleto) return;
    this.grafEsqueleto.clear();

    if (this._debugEsqueleto && this.esqueletoActual && (this.state === ST.PLAYING || this.state === ST.PREVIEW || this.state === ST.EVAL)) {
      const esqNorm = this._normalizarEsqueleto(this.esqueletoActual);
      const esqEsp = this._espejearEsqueleto(esqNorm);
      this._dibujarEsqueleto(this.grafEsqueleto, esqEsp, 0, 0, this.W, this.H, C.blue, 48, 36);
      this._dibujarEsqueleto(this.grafEsqueleto, esqEsp, 0, 0, this.W, this.H, 0xffffff, 18, 18);
    }
  }

  // ── UTILS ────────────────────────────────────────────────────────────────────
  _limpiarEscena() {
    if (this.grafEsqueleto) this.grafEsqueleto.clear();
    if (this._video) { this._video.stop(); this._video.destroy(); this._video = null; }
    if (this._txtPreview) { this._txtPreview.destroy(); this._txtPreview = null; }
    if (this._cuentaPreview) { this._cuentaPreview.destroy(); this._cuentaPreview = null; }
    if (this._gfxGroove) { this._gfxGroove.destroy(); this._gfxGroove = null; }
    if (this._txtScore) { this._txtScore.destroy(); this._txtScore = null; }
    if (this._txtCombo) { this._txtCombo.destroy(); this._txtCombo = null; }
    if (this.gfxSilueta) { this.gfxSilueta.clear(); }
    if (this.gfxHUD) { this.gfxHUD.clear(); }

    [...this.children.list]
      .filter(c => c !== this.holdGraphics && c !== this.gfxSilueta && c !== this.gfxHUD && c !== this.grafEsqueleto)
      .forEach(c => { if (c && c.destroy) c.destroy(); });

    this.tweens.killAll();
    this.time.removeAllEvents();
    this.sensorButtons = [];
  }

  _hexToRGB(hex) {
    return { r: (hex >> 16) & 0xff, g: (hex >> 8) & 0xff, b: hex & 0xff };
  }

  shutdown() {
    window.removeEventListener('ws-message', this._wsHandler);
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this._video) { this._video.stop(); this._video.destroy(); this._video = null; }
    this.sound.stopAll();
  }
}