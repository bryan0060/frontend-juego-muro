import * as Phaser from 'phaser';

const CONFIG = {
    totalEnergia: 100,
    rangoImpacto: 0.15, // Tolerancia para las poses
    velocidadEnemigo: 1.5,
    spawnRate: 3000, // ms entre enemigos
    poses: {
        'manos-cielo': {
            id: 'manos-cielo',
            emoji: '🙌',
            descripcion: '¡Manos arriba!',
            esqueleto: {
                muneca_izquierda: { y: 0.2 },
                muneca_derecha: { y: 0.2 }
            }
        },
        'agachado': {
            id: 'agachado',
            emoji: '🧘',
            descripcion: '¡Agáchate!',
            esqueleto: {
                nariz: { y: 0.6 } // Si la nariz baja de 0.6 se considera agachado
            }
        },
        'estrella': {
            id: 'estrella',
            emoji: '⭐',
            descripcion: '¡Abre los brazos!',
            esqueleto: {
                muneca_izquierda: { x: 0.1 },
                muneca_derecha: { x: 0.9 }
            }
        }
    }
};

export class AnimalesScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AnimalesScene' });
    }

    init() {
        // Cargar fuentes dinámicamente sin tocar archivos de configuración global
        if (!document.getElementById('animales-fonts-loader')) {
            const link = document.createElement('link');
            link.id = 'animales-fonts-loader';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Cinzel+Decorative:wght@400;700&family=Bangers&family=Bubblegum+Sans&display=swap';
            document.head.appendChild(link);
        }

        // Crear una textura de estrella brillante por si acaso
        if (!this.textures.exists('estrella_magica')) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture('estrella_magica', 16, 16);
        }

        // Fallback para la jaula si no existe el asset
        if (!this.textures.exists('jaula_hada') && !this.textures.exists('jaula_fallback')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.lineStyle(4, 0x00ffff, 1);
            g.strokeRoundedRect(0, 0, 60, 100, 10);
            g.fillStyle(0x00ffff, 0.2);
            g.fillRoundedRect(0, 0, 60, 100, 10);
            g.generateTexture('jaula_fallback', 60, 100);
        }
    }

    create() {
        const { width: W, height: H } = this.scale;
        this.W = W;
        this.H = H;

        // Estado inicial
        this.estado = 'seleccion';
        this.juegoActivo = false;
        this.energia = CONFIG.totalEnergia;
        this.puntaje = 0;
        this.esqueletoActual = null;
        this.enemigos = this.add.group();
        // ── Redes de caza ──
        this.redIzquierda = this.add.image(-200, this.H * 0.6, 'red').setScale(0.3).setDepth(20).setVisible(false);
        this.redIzquierda.targetX = -200;
        this.redIzquierda.targetY = this.H * 0.6;

        this.redDerecha = this.add.image(-200, this.H * 0.6, 'red').setScale(0.3).setDepth(20).setVisible(false);
        this.redDerecha.targetX = -200;
        this.redDerecha.targetY = this.H * 0.6;

        // Sistema de hold
        this.holdBtn = null;
        this.holdGraphics = this.add.graphics().setDepth(10000);

        // 1. Jaula y Hada (Más abajo, en el suelo)
        // Verificamos si la textura existe y es válida
        let jaulaKey = 'jaula_fallback';
        if (this.textures.exists('jaula_hada')) {
            const tex = this.textures.get('jaula_hada');
            if (tex.key !== '__MISSING' && tex.getSourceImage()) {
                jaulaKey = 'jaula_hada';
            }
        }
        this.jaula = this.add.image(W / 2, H - 120, jaulaKey).setScale(0.8).setDepth(5).setVisible(false);

        // Hada dentro de la jaula
        this.hada = this.add.image(W / 2, H - 150, 'hada').setScale(0.45).setDepth(4).setVisible(false);

        // Animación suave para el hada
        this.tweens.add({
            targets: this.hada,
            y: H - 165,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. Aura de poder
        this.aura = this.add.graphics().setDepth(10);

        // 3. Sensor
        this._wsHandler = this._onWsMessage.bind(this);
        window.addEventListener('ws-message', this._wsHandler);

        // 4. Partículas de impacto
        this.particles = this.add.particles(0, 0, '__DEFAULT', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.6, end: 0 },
            tint: 0x00ffff,
            lifespan: 600,
            blendMode: 'ADD',
            emitting: false
        });

        // 5. HUD
        this._buildHUD();

        // 6. Mostrar Menú
        this._mostrarMenuEscenarios();
    }

    _mostrarMenuEscenarios() {
        this.sensorButtons = [];
        const { width: W, height: H } = this.scale;

        this.menuContainer = this.add.container(0, 0).setDepth(200);

        // 1. Fondo Estilo Pizarra Mágica Pro (Nebulosas y Profundidad)
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x020208, 0x020208, 0x0a0515, 0x1a0a4a, 1);
        bgGraphics.fillRect(0, 0, W, H);
        this.menuContainer.add(bgGraphics);

        // Capa de Nebulosas (Círculos grandes con transparencia y blur)
        for (let i = 0; i < 5; i++) {
            const neb = this.add.circle(
                Phaser.Math.Between(0, W),
                Phaser.Math.Between(0, H),
                Phaser.Math.Between(300, 600),
                i % 2 === 0 ? 0x4a2a6e : 0x0a4a6e,
                0.15
            );
            neb.setBlendMode('ADD');
            this.menuContainer.add(neb);

            // Animación de deriva lenta para las nebulosas
            this.tweens.add({
                targets: neb,
                x: neb.x + Phaser.Math.Between(-100, 100),
                y: neb.y + Phaser.Math.Between(-100, 100),
                alpha: 0.05,
                duration: Phaser.Math.Between(10000, 20000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Estrellas estáticas en capas (Paralaje)
        const starLayers = [
            { count: 200, size: 0.8, alpha: 0.3 },
            { count: 100, size: 1.5, alpha: 0.6 },
            { count: 50, size: 2.5, alpha: 0.8 }
        ];

        starLayers.forEach(layer => {
            const g = this.add.graphics();
            for (let i = 0; i < layer.count; i++) {
                g.fillStyle(0xffffff, layer.alpha);
                g.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), layer.size);
            }
            this.menuContainer.add(g);

            // Movimiento muy lento para efecto de profundidad
            this.tweens.add({
                targets: g,
                x: Phaser.Math.Between(-20, 20),
                y: Phaser.Math.Between(-20, 20),
                duration: Phaser.Math.Between(3000, 6000),
                yoyo: true,
                repeat: -1
            });
        });

        // 2. Sistema de estrellas fugaces
        this.time.addEvent({
            delay: 4000,
            callback: () => {
                if (!this.menuContainer || !this.menuContainer.visible) return;
                const sx = Phaser.Math.Between(0, W);
                const sy = Phaser.Math.Between(0, H / 2);
                const line = this.add.graphics();
                line.lineStyle(2, 0xffffff, 1);
                line.strokeLineShape(new Phaser.Geom.Line(0, 0, 50, -5));
                line.setPosition(sx, sy);
                this.menuContainer.add(line);

                this.tweens.add({
                    targets: line,
                    x: sx + 800,
                    y: sy + 150,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => line.destroy()
                });
            },
            loop: true
        });

        // 3. Sistema de partículas para el clic (Configuración corregida)
        this.clickParticles = this.add.particles(0, 0, 'estrella_magica', {
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 100, max: 450 },
            lifespan: 700,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(500);

        // Evento de clic global para las estrellas
        const clickArea = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setInteractive().setDepth(-2);
        this.menuContainer.add(clickArea);

        this.input.on('pointerdown', (pointer) => {
            if (this.menuContainer && this.menuContainer.visible) {
                this.clickParticles.setPosition(pointer.x, pointer.y);
                this.clickParticles.explode(40);
                this.sound.play('pop', { volume: 0.5, detune: Phaser.Math.Between(-500, 500) });
            }
        });

        // 3. Título Estilo Burbuja 3D (Capa de Sombra Profunda)
        const tituloSombra = this.add.text(W / 2, 88, 'ELIJE TU ESCENARIO', {
            fontSize: '84px',
            fontFamily: 'Bubblegum Sans',
            fill: '#2e1a4e',
            stroke: '#2e1a4e',
            strokeThickness: 20,
        }).setOrigin(0.5);

        const titulo = this.add.text(W / 2, 80, 'ELIJE TU ESCENARIO', {
            fontSize: '84px',
            fontFamily: 'Bubblegum Sans',
            fill: '#ffffff',
            stroke: '#40c0dd',
            strokeThickness: 14,
        }).setOrigin(0.5);

        // Crear degradado en el texto superior
        const gradient = titulo.context.createLinearGradient(0, 0, 0, 70);
        gradient.addColorStop(0, '#40c0dd');
        gradient.addColorStop(1, '#9c4eb3');
        titulo.setFill(gradient);

        this.tweens.add({
            targets: [titulo, tituloSombra],
            scale: 1.04,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.menuContainer.add([tituloSombra, titulo]);

        const escenarios = [
            { id: 'scenery_bosque', nombre: 'BOSQUE', color: 0xff00ff },
            { id: 'scenery_desierto', nombre: 'DESIERTO', color: 0x00ffff },
            { id: 'scenery_hielo', nombre: 'HIELO', color: 0x00ffff },
            { id: 'scenery_pantano', nombre: 'PANTANO', color: 0xff00ff }
        ];

        escenarios.forEach((esc, i) => {
            const x = W / 2 + (i % 2 === 0 ? -280 : 280);
            const y = H / 2 + (i < 2 ? -80 : 180);

            const cardContainer = this.add.container(x, y);
            this.menuContainer.add(cardContainer);

            // Borde Neón
            const glow = this.add.graphics();
            glow.lineStyle(8, esc.color, 0.3);
            glow.strokeRoundedRect(-210, -110, 420, 220, 15);
            glow.lineStyle(4, esc.color, 1);
            glow.strokeRoundedRect(-205, -105, 410, 210, 12);

            // Imagen
            const img = this.add.image(0, -20, esc.id).setDisplaySize(400, 170);
            const maskShape = this.add.graphics();
            maskShape.fillStyle(0xffffff);
            maskShape.fillRoundedRect(-200, -105, 400, 170, 12);
            maskShape.setVisible(false);
            cardContainer.add(maskShape);

            const mask = maskShape.createGeometryMask();
            img.setMask(mask);

            // Barra inferior para el nombre
            const labelBg = this.add.graphics();
            labelBg.fillStyle(0x000000, 0.8);
            labelBg.fillRoundedRect(-200, 65, 400, 45, { bl: 12, br: 12 });
            labelBg.lineStyle(2, esc.color, 0.5);
            labelBg.strokeRoundedRect(-200, 65, 400, 45, { bl: 12, br: 12 });

            const txt = this.add.text(0, 87, esc.nombre, {
                fontSize: '28px',
                fontFamily: 'Cinzel Decorative',
                color: '#ffffff',
                letterSpacing: 4
            }).setOrigin(0.5);

            // Área interactiva fija (fuera del cardContainer para que no se pegue al escalar)
            const hitArea = this.add.rectangle(x, y, 420, 220, 0x000000, 0).setInteractive({ cursor: 'pointer' });
            this.menuContainer.add(hitArea);

            hitArea.on('pointerover', () => {
                this.tweens.add({ targets: cardContainer, scale: 1.1, duration: 100, ease: 'Back.easeOut' });

                glow.clear();
                glow.lineStyle(10, 0xffffff, 1);
                glow.strokeRoundedRect(-210, -110, 420, 220, 15);
                glow.lineStyle(4, esc.color, 1);
                glow.strokeRoundedRect(-205, -105, 410, 210, 12);

                const soundKey = esc.id.replace('scenery_', 'sonido_');
                this.sound.play(soundKey, { volume: 1 });
            });

            hitArea.on('pointerout', () => {
                this.tweens.add({ targets: cardContainer, scale: 1, duration: 100, ease: 'Linear' });

                const soundKey = esc.id.replace('scenery_', 'sonido_');
                this.sound.stopByKey(soundKey);

                glow.clear();
                glow.lineStyle(8, esc.color, 0.3);
                glow.strokeRoundedRect(-210, -110, 420, 220, 15);
                glow.lineStyle(4, esc.color, 1);
                glow.strokeRoundedRect(-205, -105, 410, 210, 12);
            });

            hitArea.on('pointerdown', (ptr) => {
                // Acción inmediata para selección de escenarios
                this.sound.play('pop');
                this.tweens.add({
                    targets: cardContainer,
                    scale: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => this._iniciarJuego(esc.id)
                });
            });
            hitArea.on('pointerup', () => this._cancelHold());
            // Registrar para LiDAR
            this.sensorButtons.push({
                absX: x,
                absY: y,
                w: 420,
                h: 220,
                callback: () => {
                    this.sound.play('pop');
                    this.tweens.add({
                        targets: cardContainer,
                        scale: 0.95,
                        duration: 100,
                        yoyo: true,
                        onComplete: () => this._iniciarJuego(esc.id)
                    });
                }
            });
            cardContainer.add([glow, img, labelBg, txt]);
        });
    }

    _iniciarJuego(escenarioId) {
        this.sensorButtons = [];
        this.menuContainer.destroy();
        this.escenarioActual = escenarioId;
        this.estado = 'jugando';
        this.juegoActivo = true;

        const { width: W, height: H } = this.scale;

        // Fondo seleccionado
        this.add.image(W / 2, H / 2, escenarioId).setDisplaySize(W, H).setDepth(-1);

        // Mostrar elementos de juego
        this.jaula.setVisible(true);
        this.hada.setVisible(true);
        this.hudGroup.setVisible(true);

        // Detener sonidos de menú y empezar música ambiental en loop
        this.sound.stopAll();
        const soundKey = escenarioId.replace('scenery_', 'sonido_');
        this.bgMusic = this.sound.add(soundKey, { loop: true, volume: 0.6 });
        this.bgMusic.play();

        // Luciérnagas
        this._createFireflies();

        // Spawn de enemigos
        this.time.addEvent({
            delay: CONFIG.spawnRate,
            callback: this._spawnEnemigo,
            callbackScope: this,
            loop: true
        });
    }

    _buildHUD() {
        this.hudGroup = this.add.group();
        const hudY = 40;

        // 1. Puntaje
        this.textoPuntaje = this.add.text(40, hudY, 'PUNTOS: 0', {
            fontSize: '32px', fontFamily: 'Luckiest Guy', color: '#ffffff'
        }).setShadow(2, 2, '#000000', 4, true, true);
        this.hudGroup.add(this.textoPuntaje);

        // 2. Barra de energía mágica
        const energyX = this.W - 300;
        const barWidth = 240;
        const barHeight = 24;

        // Fondo de la barra (Glassmorphism)
        const hudBg = this.add.graphics()
            .fillStyle(0x000000, 0.4)
            .fillRoundedRect(energyX - 10, hudY - 15, barWidth + 60, 50, 15)
            .lineStyle(2, 0xffffff, 0.2)
            .strokeRoundedRect(energyX - 10, hudY - 15, barWidth + 60, 50, 15);
        this.hudGroup.add(hudBg);

        this.barraEnergiaBg = this.add.graphics();
        this.barraEnergiaBg.fillStyle(0x2d1b4e, 1);
        this.barraEnergiaBg.fillRoundedRect(energyX + 40, hudY - 2, barWidth, barHeight, 8);
        this.hudGroup.add(this.barraEnergiaBg);

        this.barraEnergia = this.add.graphics();
        this.hudGroup.add(this.barraEnergia);
        this._updateBarraEnergia();

        const heart = this.add.text(energyX + 15, hudY + 10, '💖', { fontSize: '28px' }).setOrigin(0.5);
        this.tweens.add({
            targets: heart,
            scale: 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.hudGroup.add(heart);

        const energyLabel = this.add.text(energyX + 40, hudY - 25, 'VITALIDAD DEL HADA', {
            fontSize: '14px', fontFamily: 'Bangers', color: '#ffccff', letterSpacing: 2
        }).setShadow(1, 1, '#000', 2);
        this.hudGroup.add(energyLabel);

        // Botón Menú
        this.btnMenu = this.add.text(this.W - 30, this.H - 30, '☰', {
            fontSize: '32px', color: '#ffffff', alpha: 0.2
        }).setOrigin(1).setInteractive({ cursor: 'pointer' });
        this.btnMenu.on('pointerover', () => this.btnMenu.setAlpha(1));
        this.btnMenu.on('pointerout', () => this.btnMenu.setAlpha(0.2));
        this.btnMenu.on('pointerdown', () => {
            this.sound.play('pop');
            this._volverAlMenu();
        });
        this.hudGroup.add(this.btnMenu);

        // Ocultar HUD inicialmente
        this.hudGroup.setVisible(false);
    }

    _updateBarraEnergia() {
        const energyX = this.W - 300 + 40;
        const hudY = 40 - 2;
        const barWidth = 240;
        const barHeight = 24;
        const pct = this.energia / CONFIG.totalEnergia;

        this.barraEnergia.clear();

        if (pct <= 0) return;

        // Color dinámico (Verde -> Amarillo -> Rojo)
        const color = pct > 0.6 ? 0x00ffcc : pct > 0.3 ? 0xffcc00 : 0xff3344;

        // Dibujar la barra con gradiente simulado
        this.barraEnergia.fillStyle(color, 1);
        this.barraEnergia.fillRoundedRect(energyX, hudY, barWidth * pct, barHeight, 8);

        // Brillo superior (Efecto cristal)
        this.barraEnergia.fillStyle(0xffffff, 0.3);
        this.barraEnergia.fillRoundedRect(energyX, hudY, barWidth * pct, barHeight / 2, { tl: 8, tr: 8, bl: 0, br: 0 });
    }

    _spawnEnemigo() {
        if (!this.juegoActivo) return;

        const pools = {
            'scenery_bosque': [
                { key: 'bosque_lobo', scale: 0.25, tipo: 'ground', reverseFlip: true },
                { key: 'bosque_lobo2', scale: 0.25, tipo: 'ground', reverseFlip: true },
                { key: 'bosque_lobo3', scale: 0.25, tipo: 'ground', reverseFlip: true },
                { key: 'bosque_oso', scale: 0.35, tipo: 'ground' },
                { key: 'bosque_oso2', scale: 0.35, tipo: 'ground' },
                { key: 'bosque_oso3', scale: 0.35, tipo: 'ground' },
                { key: 'bosque_serpiente', scale: 0.35, tipo: 'ground' },
                { key: 'bosque_cuervo', scale: 0.08, tipo: 'flying', reverseFlip: true },
                { key: 'bosque_aguila', scale: 0.25, tipo: 'flying' },
                { key: 'bosque_buho', scale: 0.25, tipo: 'flying' },
                { key: 'bosque_cazador', scale: 0.15, tipo: 'ground', reverseFlip: true }
            ],
            'scenery_desierto': [
                { key: 'desierto_araña', scale: 0.25, tipo: 'ground' },
                { key: 'desierto_ave', scale: 0.25, tipo: 'flying' },
                { key: 'desierto_buho', scale: 0.25, tipo: 'flying' },
                { key: 'desierto_camello', scale: 0.45, tipo: 'ground' },
                { key: 'desierto_canguro', scale: 0.35, tipo: 'ground' },
                { key: 'desierto_cobra', scale: 0.3, tipo: 'ground' },
                { key: 'desierto_cobra2', scale: 0.3, tipo: 'ground' },
                { key: 'desierto_cobra3', scale: 0.3, tipo: 'ground' },
                { key: 'desierto_cobra4', scale: 0.3, tipo: 'ground' },
                { key: 'desierto_coyote', scale: 0.25, tipo: 'ground' },
                { key: 'desierto_escorpion', scale: 0.1, tipo: 'ground' }
            ],
            'scenery_hielo': [
                { key: 'hielo_buho', scale: 0.25, tipo: 'flying' },
                { key: 'hielo_foca', scale: 0.35, tipo: 'ground' },
                { key: 'hielo_leopardo', scale: 0.3, tipo: 'ground' },
                { key: 'hielo_lobo', scale: 0.3, tipo: 'ground' },
                { key: 'hielo_mamut', scale: 0.4, tipo: 'ground' },
                { key: 'hielo_morsa', scale: 0.35, tipo: 'ground' },
                { key: 'hielo_oso', scale: 0.35, tipo: 'ground' },
                { key: 'hielo_pinguino', scale: 0.25, tipo: 'ground' },
                { key: 'hielo_reno', scale: 0.35, tipo: 'ground' },
                { key: 'hielo_zorro', scale: 0.25, tipo: 'ground' }
            ],
            'scenery_pantano': [
                { key: 'pantano_capibara', scale: 0.25, tipo: 'ground' },
                { key: 'pantano_cisne', scale: 0.35, tipo: 'ground' },
                { key: 'pantano_cocodrilo', scale: 0.45, tipo: 'ground' },
                { key: 'pantano_garza', scale: 0.3, tipo: 'flying' },
                { key: 'pantano_hipopotamo', scale: 0.45, tipo: 'ground' },
                { key: 'pantano_murcielago', scale: 0.25, tipo: 'flying' },
                { key: 'pantano_nutria', scale: 0.25, tipo: 'ground' },
                { key: 'pantano_pato_volando', scale: 0.25, tipo: 'flying' },
                { key: 'pantano_pato', scale: 0.2, tipo: 'ground' },
                { key: 'pantano_sapo', scale: 0.15, tipo: 'ground' },
                { key: 'pantano_sapo2', scale: 0.15, tipo: 'ground' },
                { key: 'pantano_sapo3', scale: 0.15, tipo: 'ground' },
                { key: 'pantano_sapo4', scale: 0.15, tipo: 'ground' },
                { key: 'pantano_sapo5', scale: 0.15, tipo: 'ground' },
                { key: 'pantano_tortuga', scale: 0.25, tipo: 'ground' }
            ]
        };

        const pool = pools[this.escenarioActual] || pools['scenery_bosque'];
        const anim = Phaser.Utils.Array.GetRandom(pool);

        let x, y;
        const side = Math.random() > 0.5 ? 'left' : 'right';

        if (anim.tipo === 'flying') {
            x = side === 'left' ? Phaser.Math.Between(100, 300) : Phaser.Math.Between(this.W - 300, this.W - 100);
            y = Phaser.Math.Between(80, 300);
        } else {
            x = side === 'left' ? Phaser.Math.Between(50, 250) : Phaser.Math.Between(this.W - 250, this.W - 50);
            y = this.H - Phaser.Math.Between(60, 150);
        }

        const enemigo = this.add.sprite(x, y, anim.key).setScale(0).setDepth(4);

        // ESCALA INDIVIDUAL: Ahora cada animal usa exactamente su valor de la pool
        enemigo.baseScale = anim.scale;

        if (anim.tipo === 'ground') {
            enemigo.setOrigin(0.5, 1);
        }

        this.tweens.add({
            targets: enemigo,
            scale: enemigo.baseScale,
            duration: 300,
            ease: 'Back.easeOut'
        });

        enemigo.speed = 2.0;
        enemigo.targetY = this.H - 120;
        enemigo.spawnY = y;
        enemigo.spawnX = x;
        enemigo.estado = 'esperando';
        enemigo.timer = 5000;

        const timerY = anim.tipo === 'ground' ? y - (180 * enemigo.baseScale) : y - (100 * enemigo.baseScale);
        enemigo.timerText = this.add.text(x, timerY, '5', {
            fontSize: '48px', fontFamily: 'Bangers', color: '#ff0000', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);

        // ORIENTACIÓN INDIVIDUAL: Solo invertimos los que tengan 'reverseFlip'
        const shouldReverse = anim.reverseFlip || false;
        const shouldFlip = (x < this.W / 2);
        enemigo.setFlipX(shouldReverse ? !shouldFlip : shouldFlip);

        this.enemigos.add(enemigo);
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

        if (!this.juegoActivo) return;

        // ── Mover redes con lerp y rotación ──
        [this.redIzquierda, this.redDerecha].forEach(red => {
            if (!red.visible || red.targetX === undefined) return;

            const prevX = red.x;
            const prevY = red.y;

            // Lerp — 0.35 = fluido pero responsivo
            red.x = Phaser.Math.Linear(red.x, red.targetX, 0.35);
            red.y = Phaser.Math.Linear(red.y, red.targetY, 0.35);

            // Rotación según dirección del movimiento
            const dx = red.x - prevX;
            const dy = red.y - prevY;
            const velocidad = Math.sqrt(dx * dx + dy * dy);

            if (velocidad > 0.5) {
                red.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
            }

            // Detectar colisión desde la nueva posición
            this._checkHit(red.x, red.y);
        });

        // Mover enemigos hacia la jaula
        this.enemigos.getChildren().forEach(enemigo => {
            if (enemigo.estado === 'esperando') {
                enemigo.timer -= delta;
                const segundos = Math.ceil(enemigo.timer / 1000);
                enemigo.timerText.setText(segundos > 0 ? segundos : '!');

                if (enemigo.timer <= 0) {
                    enemigo.estado = 'atacando';
                    enemigo.timerText.setVisible(false);
                    // Efecto de aviso antes de atacar
                    this.tweens.add({
                        targets: enemigo,
                        scale: enemigo.baseScale * 1.3,
                        duration: 100,
                        yoyo: true
                    });
                }
            } else {
                const dx = this.W / 2 - enemigo.x;
                const dy = (enemigo.targetY || (this.H - 120)) - enemigo.y;
                const angle = Math.atan2(dy, dx);

                // Velocidad de ataque rápida
                enemigo.x += Math.cos(angle) * enemigo.speed * 4;
                enemigo.y += Math.sin(angle) * enemigo.speed * 4;

                // Colisión con la jaula
                const dist = Phaser.Math.Distance.Between(enemigo.x, enemigo.y, this.W / 2, this.H - 120);
                if (dist < 100) {
                    this._danoJaula();
                    this._eliminarEnemigo(enemigo);
                }
            }

            // Escala basada en la profundidad (Y) para efecto 3D
            const factorY = (enemigo.y / this.H);
            const currentScale = enemigo.baseScale * (0.8 + factorY * 0.4);
            enemigo.setScale(currentScale);

            if (enemigo.timerText) {
                enemigo.timerText.x = enemigo.x;
                enemigo.timerText.y = enemigo.y - (enemigo.displayHeight / 2 + 30);
            }
        });
    }

    _eliminarEnemigo(enemigo, porToque = false) {
        if (porToque) {
            this.puntaje += 100;
            this.textoPuntaje.setText(`PUNTOS: ${this.puntaje}`);
            this.particles.setPosition(enemigo.x, enemigo.y);
            this.particles.explode(20);
            this.sound.play('pop');
        }
        if (enemigo.timerText) enemigo.timerText.destroy();
        enemigo.destroy();
    }

    _danoJaula() {
        this.energia -= 10;
        this._updateBarraEnergia();

        this.cameras.main.shake(200, 0.02);
        this.jaula.setTint(0xff0000);
        this.hada.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            this.jaula.clearTint();
            this.hada.clearTint();
        });

        if (this.energia <= 0) {
            this._gameOver();
        }
    }

    _onWsMessage(event) {
        const data = event.detail;

        // ── Puerto 8081 — LiDAR ──
        if (data.port === 8081) {
            let x, y;
            if (data.touches?.length > 0) {
                x = data.touches[0].x;
                y = data.touches[0].y;
            } else if (data.x !== undefined) {
                x = data.x;
                y = data.y;
            } else return;

            // Botones del menú de escenarios
            if (this.sensorButtons?.length > 0) {
                for (const btn of this.sensorButtons) {
                    if (
                        x >= btn.absX - btn.w / 2 &&
                        x <= btn.absX + btn.w / 2 &&
                        y >= btn.absY - btn.h / 2 &&
                        y <= btn.absY + btn.h / 2
                    ) {
                        btn.callback();
                        return;
                    }
                }
            }

            // Golpear enemigos con LiDAR si el juego está activo
            if (this.juegoActivo) this._checkHit(x, y);
            return;
        }

        // ── Puerto 8080 — Cámara ──
        if (data.port !== 8080) return;
        if (data.juego_activo !== 'impacto') return;
        if (!data.impacto) return;
        if (!this.juegoActivo) return;

        const { mano_izquierda, mano_derecha } = data.impacto;

        const remapX = (x) => {
            const xMin = parseFloat(import.meta.env.VITE_REMAP_X_MIN ?? 0.1);
            const xMax = parseFloat(import.meta.env.VITE_REMAP_X_MAX ?? 0.9);
            return Math.max(0, Math.min(1, (x - xMin) / (xMax - xMin)));
        };

        const remapY = (y) => {
            const yMin = parseFloat(import.meta.env.VITE_REMAP_Y_MIN ?? 0.1);
            const yMax = parseFloat(import.meta.env.VITE_REMAP_Y_MAX ?? 0.8);
            return Math.max(0, Math.min(1, (y - yMin) / (yMax - yMin)));
        };

        if (mano_izquierda?.visible) {
            this.redIzquierda.targetX = (1 - remapX(mano_izquierda.x)) * this.W;
            this.redIzquierda.targetY = remapY(mano_izquierda.y) * this.H;
            this.redIzquierda.setVisible(true);
        } else {
            this.redIzquierda.setVisible(false);
        }

        if (mano_derecha?.visible) {
            this.redDerecha.targetX = (1 - remapX(mano_derecha.x)) * this.W;
            this.redDerecha.targetY = remapY(mano_derecha.y) * this.H;
            this.redDerecha.setVisible(true);
        } else {
            this.redDerecha.setVisible(false);
        }
    }

    _checkHit(x, y) {
        if (!this.juegoActivo) return;

        this.enemigos.getChildren().forEach(enemigo => {
            const dist = Phaser.Math.Distance.Between(x, y, enemigo.x, enemigo.y);
            const hitRadius = Math.max(120, 200 * enemigo.scale);
            if (dist < hitRadius) {
                this._eliminarEnemigo(enemigo, true);
            }
        });
    }

    _volverAlMenu() {
        this.juegoActivo = false;
        this.sound.stopAll();
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.enemigos.getChildren().forEach(e => {
            if (e.timerText) e.timerText.destroy();
            e.destroy();
        });
        this.scene.restart();
    }

    returnToMenu() {
        if (this.estado === 'seleccion') {
            return false;
        }
        this._volverAlMenu();
        return true;
    }

    _gameOver() {
        this.juegoActivo = false;
        this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.7).setDepth(100);
        this.add.text(this.W / 2, this.H / 2 - 80, 'EL HADA SE QUEDÓ SIN ENERGÍA', {
            fontSize: '48px', color: '#ff0000', fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(101);

        const btn = this.add.text(this.W / 2, this.H / 2 + 20, 'REINTENTAR', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#9c4eb3', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(101).setInteractive({ cursor: 'pointer' });
        btn.on('pointerdown', () => {
            this.sound.play('pop');
            this.scene.restart();
        });

        const btnMenuGO = this.add.text(this.W / 2, this.H / 2 + 90, '☰ VOLVER AL MENÚ', {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#2e1a4e', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(101).setInteractive({ cursor: 'pointer' });
        btnMenuGO.on('pointerdown', () => {
            this.sound.play('pop');
            this._volverAlMenu();
        });

        this.sound.play('end');
    }

    _createFireflies() {
        this.add.particles(0, 0, '__DEFAULT', {
            x: { min: 0, max: this.W },
            y: { min: 0, max: this.H },
            quantity: 1,
            frequency: 100,
            lifespan: 4000,
            speed: { min: 10, max: 30 },
            scale: { start: 0.1, end: 0.5 },
            alpha: { start: 0, end: 0.8, steps: 20 },
            tint: [0xffff00, 0x00ffff, 0xff00ff],
            blendMode: 'ADD',
            gravityY: -5,
        });
    }

    shutdown() {
        window.removeEventListener('ws-message', this._wsHandler);
        this.sound.stopAll();
    }
}
