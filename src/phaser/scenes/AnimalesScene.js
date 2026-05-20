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

const SONG_NAMES = {
    'menu_reyleon': 'Canción 1',
    'menu_monsters': 'Canción 2',
    'menu_aladdin': 'Canción 3',
    'menu_cancion1': 'Canción 4',
    'menu_cars': 'Canción 5',
    'menu_cars2': 'Canción 6',
    'menu_libro': 'Canción 7',
    'menu_rio': 'Canción 8',
    'menu_sing': 'Canción 9',
    'menu_sing2': 'Canción 10',
    'menu_sheck': 'Canción 11',
    'menu_shek': 'Canción 12',
    'menu_zotopia': 'Canción 13'
};

const ANIMAL_POOLS = {
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
        { key: 'bosque_abeja', scale: 0.15, tipo: 'flying', reverseFlip: true },
        { key: 'bosque_carpintero', scale: 0.2, tipo: 'flying' },
        { key: 'bosque_conejo', scale: 0.2, tipo: 'ground', reverseFlip: true },
        { key: 'bosque_elefante', scale: 0.45, tipo: 'ground' },
        { key: 'bosque_gorilla', scale: 0.35, tipo: 'ground' },
        { key: 'bosque_mariposa', scale: 0.15, tipo: 'flying' },
        { key: 'bosque_zorrillo', scale: 0.2, tipo: 'ground', reverseFlip: true },
        { key: 'bosque_zorro', scale: 0.25, tipo: 'ground' },
        { key: 'bosque_mapache', scale: 0.2, tipo: 'ground' }
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
        { key: 'desierto_escorpion', scale: 0.22, tipo: 'ground' },
        { key: 'desierto_armadillo', scale: 0.2, tipo: 'ground' },
        { key: 'desierto_buitre', scale: 0.3, tipo: 'flying' },
        { key: 'desierto_correcamino', scale: 0.25, tipo: 'ground' },
        { key: 'desierto_dragondecomodo', scale: 0.3, tipo: 'ground', reverseFlip: true },
        { key: 'desierto_suricata', scale: 0.2, tipo: 'ground' }
    ],
    'scenery_hielo': [
        { key: 'hielo_buho', scale: 0.25, tipo: 'flying' },
        { key: 'hielo_foca', scale: 0.35, tipo: 'ground' },
        { key: 'hielo_leopardo', scale: 0.3, tipo: 'ground' },
        { key: 'hielo_lobo', scale: 0.3, tipo: 'ground' },
        { key: 'hielo_mamut', scale: 0.4, tipo: 'ground' },
        { key: 'hielo_morsa', scale: 0.35, tipo: 'ground' },
        { key: 'hielo_oso', scale: 0.2, tipo: 'ground' },
        { key: 'hielo_pinguino', scale: 0.25, tipo: 'ground', reverseFlip: true },
        { key: 'hielo_reno', scale: 0.35, tipo: 'ground', reverseFlip: true },
        { key: 'hielo_zorro', scale: 0.25, tipo: 'ground' },
        { key: 'hielo_frailecillo', scale: 0.2, tipo: 'flying' }
    ],
    'scenery_pantano': [
        { key: 'pantano_capibara', scale: 0.25, tipo: 'ground', reverseFlip: true },
        { key: 'pantano_cisne', scale: 0.35, tipo: 'ground' },
        { key: 'pantano_cocodrilo', scale: 0.3, tipo: 'ground', reverseFlip: true },
        { key: 'pantano_garza', scale: 0.3, tipo: 'flying' },
        { key: 'pantano_hipopotamo', scale: 0.4, tipo: 'ground', reverseFlip: true },
        { key: 'pantano_murcielago', scale: 0.25, tipo: 'flying' },
        { key: 'pantano_nutria', scale: 0.25, tipo: 'ground' },
        { key: 'pantano_pato_volando', scale: 0.25, tipo: 'flying' },
        { key: 'pantano_pato', scale: 0.2, tipo: 'ground' },
        { key: 'pantano_sapo2', scale: 0.15, tipo: 'ground' },
        { key: 'pantano_sapo3', scale: 0.15, tipo: 'ground' },
        { key: 'pantano_sapo4', scale: 0.15, tipo: 'ground' },
        { key: 'pantano_sapo5', scale: 0.15, tipo: 'ground' },
        { key: 'pantano_tortuga', scale: 0.25, tipo: 'ground' },
        { key: 'pantano_castor', scale: 0.25, tipo: 'ground' },
        { key: 'pantano_flamenco', scale: 0.35, tipo: 'ground' },
        { key: 'pantano_libelula', scale: 0.15, tipo: 'flying' }
    ]
};

const SCENARIO_SPAWN_CONFIGS = {
    'scenery_bosque': {
        back: {
            flying: { minX: 300, maxX: 380, minY: 150, maxY: 250 },
            ground: [
                // Zona Izquierda (en el fondo, entre los árboles de la izquierda)
                { minXPercent: 0.15, maxXPercent: 0.30, minYPercent: 0.65, maxYPercent: 0.82 },
                // Zona Derecha (en el sendero/círculo amarillo)
                { minXPercent: 0.58, maxXPercent: 0.82, minYPercent: 0.65, maxYPercent: 0.82 }
            ]
        },
        left: {
            flying: { minX: 100, maxX: 300, minY: 80, maxY: 300 },
            ground: { minX: 50, maxX: 250, minYOffset: 60, maxYOffset: 150 }
        },
        right: {
            flying: { minXOffset: 300, maxXOffset: 100, minY: 80, maxY: 300 },
            ground: { minXOffset: 250, maxXOffset: 50, minYOffset: 60, maxYOffset: 150 }
        },
        minBackgroundScale: 0.5
    },
    'scenery_desierto': {
        back: {
            flying: { minX: 300, maxX: 380, minY: 150, maxY: 250 },
            ground: { minX: 320, maxX: 360, minY: 330, maxY: 350 }
        },
        left: {
            flying: { minX: 100, maxX: 300, minY: 80, maxY: 300 },
            ground: { minX: 50, maxX: 250, minYOffset: 60, maxYOffset: 150 }
        },
        right: {
            flying: { minXOffset: 300, maxXOffset: 100, minY: 80, maxY: 300 },
            ground: { minXOffset: 250, maxXOffset: 50, minYOffset: 60, maxYOffset: 150 }
        },
        minBackgroundScale: 0.5
    },
    'scenery_hielo': {
        back: {
            flying: { minX: 300, maxX: 380, minY: 150, maxY: 250 },
            ground: { minX: 320, maxX: 360, minY: 330, maxY: 350 }
        },
        left: {
            flying: { minX: 100, maxX: 300, minY: 80, maxY: 300 },
            ground: { minX: 50, maxX: 250, minYOffset: 60, maxYOffset: 150 }
        },
        right: {
            flying: { minXOffset: 300, maxXOffset: 100, minY: 80, maxY: 300 },
            ground: { minXOffset: 250, maxXOffset: 50, minYOffset: 60, maxYOffset: 150 }
        },
        minBackgroundScale: 0.5
    },
    'scenery_pantano': {
        back: {
            flying: { minX: 300, maxX: 380, minY: 150, maxY: 250 },
            ground: { minX: 320, maxX: 360, minY: 330, maxY: 350 }
        },
        left: {
            flying: { minX: 100, maxX: 300, minY: 80, maxY: 300 },
            ground: { minX: 50, maxX: 250, minYOffset: 60, maxYOffset: 150 }
        },
        right: {
            flying: { minXOffset: 300, maxXOffset: 100, minY: 80, maxY: 300 },
            ground: { minXOffset: 250, maxXOffset: 50, minYOffset: 60, maxYOffset: 150 }
        },
        minBackgroundScale: 0.5
    }
};

export class AnimalesScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AnimalesScene' });
    }

    init(data) {
        this.reintentarEscenario = data && data.reintentarEscenario ? data.reintentarEscenario : null;

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

        // Inicializar redes como null — se crean cuando el WS envía posición
        this.redIzquierda = null;
        this.redDerecha = null;

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

        if (this.reintentarEscenario) {
            this._iniciarJuego(this.reintentarEscenario);
        } else {
            // 6. Mostrar Menú
            this._mostrarMenuEscenarios();

            // 7. Play Menu Music
            this._playMenuMusic();
        }
    }

    _playMenuMusic(songKey = null) {
        const menuSongs = [
            'menu_reyleon',
            'menu_monsters',
            'menu_aladdin',
            'menu_cancion1',
            'menu_cars',
            'menu_cars2',
            'menu_libro',
            'menu_rio',
            'menu_sing',
            'menu_sing2',
            'menu_sheck',
            'menu_shek',
            'menu_zotopia'
        ];

        if (this.menuMusic) {
            this.menuMusic.stop();
        } else {
            // Limpiar cualquier otra cancion de menu que pudiera estar sonando
            menuSongs.forEach(song => this.sound.stopByKey(song));
        }

        let nextSong = songKey;
        if (!nextSong) {
            nextSong = Phaser.Utils.Array.GetRandom(menuSongs);
        }
        this.currentMenuSongKey = nextSong;

        const playConfig = { loop: true, volume: 0.5 };
        if (nextSong === 'menu_cancion1') {
            playConfig.seek = 24;
        } else if (nextSong === 'menu_cars' || nextSong === 'menu_cars2') {
            playConfig.seek = 26;
        } else if (nextSong === 'menu_rio') {
            playConfig.seek = 7;
        } else if (nextSong === 'menu_shek') {
            playConfig.seek = 7;
        } else if (nextSong === 'menu_sheck') {
            playConfig.seek = 3;
        }

        this.menuMusic = this.sound.add(nextSong, playConfig);
        this.menuMusic.play();

        // Actualizar el texto del botón si existe
        if (this.btnMusicText && this.btnMusicText.scene) {
            const friendlyName = SONG_NAMES[nextSong] || 'Canción 1';
            this.btnMusicText.setText(friendlyName.toUpperCase());
        }
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

            // Imagen (sin máscara: createGeometryMask no es compatible con WebGL en Phaser 4)
            const img = this.add.image(0, -20, esc.id).setDisplaySize(400, 170);

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

                if (this.menuMusic && this.menuMusic.isPlaying) {
                    this.menuMusic.pause();
                }

                const soundKey = esc.id.replace('scenery_', 'sonido_');
                this.sound.play(soundKey, { volume: 1 });
            });

            hitArea.on('pointerout', () => {
                this.tweens.add({ targets: cardContainer, scale: 1, duration: 100, ease: 'Linear' });

                const soundKey = esc.id.replace('scenery_', 'sonido_');
                this.sound.stopByKey(soundKey);

                if (this.menuMusic && this.menuMusic.isPaused) {
                    this.menuMusic.resume();
                }

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

        // Botón Cambiar Canción (Glassmorphism Púrpura, en la esquina inferior derecha)
        const songBtnContainer = this.add.container(W - 140, H - 45);
        this.menuContainer.add(songBtnContainer);

        const songBtnBg = this.add.graphics();
        songBtnBg.fillStyle(0x9c4eb3, 0.9); // Color púrpura vibrante
        songBtnBg.fillRoundedRect(-100, -20, 200, 40, 10);
        songBtnBg.lineStyle(2, 0xffffff, 0.5);
        songBtnBg.strokeRoundedRect(-100, -20, 200, 40, 10);
        songBtnContainer.add(songBtnBg);

        const friendlyName = SONG_NAMES[this.currentMenuSongKey] || 'Canción 1';
        this.btnMusicText = this.add.text(0, 0, friendlyName.toUpperCase(), {
            fontSize: '18px',
            fontFamily: 'Luckiest Guy',
            color: '#ffffff'
        }).setOrigin(0.5).setShadow(2, 2, '#000000', 4);
        songBtnContainer.add(this.btnMusicText);

        const songBtnArea = this.add.rectangle(0, 0, 200, 40, 0x000000, 0)
            .setInteractive({ cursor: 'pointer' });
        songBtnContainer.add(songBtnArea);

        songBtnArea.on('pointerover', () => {
            this.tweens.add({ targets: songBtnContainer, scale: 1.08, duration: 100 });
            songBtnBg.clear();
            songBtnBg.fillStyle(0x40c0dd, 1); // Cambia a cian en hover
            songBtnBg.fillRoundedRect(-100, -20, 200, 40, 10);
            songBtnBg.lineStyle(2, 0xffffff, 1);
            songBtnBg.strokeRoundedRect(-100, -20, 200, 40, 10);
        });

        songBtnArea.on('pointerout', () => {
            this.tweens.add({ targets: songBtnContainer, scale: 1.0, duration: 100 });
            songBtnBg.clear();
            songBtnBg.fillStyle(0x9c4eb3, 0.9);
            songBtnBg.fillRoundedRect(-100, -20, 200, 40, 10);
            songBtnBg.lineStyle(2, 0xffffff, 0.5);
            songBtnBg.strokeRoundedRect(-100, -20, 200, 40, 10);
        });

        songBtnArea.on('pointerdown', () => {
            this.sound.play('pop');
            const menuSongs = [
                'menu_reyleon',
                'menu_monsters',
                'menu_aladdin',
                'menu_cancion1',
                'menu_cars',
                'menu_cars2',
                'menu_libro',
                'menu_rio',
                'menu_sing',
                'menu_sing2',
                'menu_sheck',
                'menu_shek',
                'menu_zotopia'
            ];
            let currentIndex = menuSongs.indexOf(this.currentMenuSongKey);
            let nextIndex = (currentIndex + 1) % menuSongs.length;
            this._playMenuMusic(menuSongs[nextIndex]);
        });
    }

    _iniciarJuego(escenarioId) {
        this.menuContainer.destroy();
        this.escenarioActual = escenarioId;
        this.estado = 'jugando';
        this.juegoActivo = false;

        const { width: W, height: H } = this.scale;

        // Fondo seleccionado
        this.add.image(W / 2, H / 2, escenarioId).setDisplaySize(W, H).setDepth(-1);

        // Detener sonidos de menú
        this.sound.stopAll();

        // Crear elementos de juego pero mantenerlos ocultos temporalmente durante la presentación
        this.jaula.setVisible(false);
        this.hada.setVisible(false);
        this.hudGroup.setVisible(false);

        // 🎥 REPRODUCIR VIDEO DE PRESENTACIÓN (Cubre toda la pantalla)
        const videoPresentacion = this.add.video(W / 2, H / 2, 'presentacion');
        videoPresentacion.setDepth(300);
        videoPresentacion.play();

        // Escalar manteniendo la relación de aspecto original (sin estirar) y cubriendo la pantalla
        videoPresentacion.on('play', () => {
            if (videoPresentacion.width > 0 && videoPresentacion.height > 0) {
                const scaleX = W / videoPresentacion.width;
                const scaleY = H / videoPresentacion.height;
                const scale = Math.max(scaleX, scaleY);
                videoPresentacion.setScale(scale);

                // Ajuste milimétrico perfecto: ligeramente por debajo de la mitad.
                // Esto desplaza el video exactamente para que el rostro y la capucha
                // se encuadren con una armonía de pantalla insuperable.
                videoPresentacion.y = H / 2 + 10;
            }
        });

        // Botón elegante para Saltar el video (Glassmorphic look)
        const skipText = this.add.text(W - 40, 40, 'SALTAR ⏭', {
            fontSize: '22px',
            fontFamily: 'Luckiest Guy',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 20, y: 10 }
        }).setOrigin(1, 0.5).setDepth(301).setInteractive({ cursor: 'pointer' });

        // Bordes redondeados y sombra para el botón de saltar
        skipText.setShadow(2, 2, '#000000', 4);

        let videoFinalizado = false;
        const terminarIntro = () => {
            if (videoFinalizado) return;
            videoFinalizado = true;

            // Limpieza del video e indicador
            videoPresentacion.stop();
            videoPresentacion.destroy();
            skipText.destroy();

            // Activar y mostrar los elementos del juego
            this.jaula.setVisible(true);
            this.hada.setVisible(true);
            this.hudGroup.setVisible(true);

            // Empezar música ambiental en loop
            const soundKey = escenarioId.replace('scenery_', 'sonido_');
            this.bgMusic = this.sound.add(soundKey, { loop: true, volume: 0.6 });
            this.bgMusic.play();

            // Luciérnagas
            this._createFireflies();

            // Iniciar el contador de cuenta regresiva
            this._iniciarContador();
        };

        // Si el video termina solo, continuar el juego
        videoPresentacion.on('complete', terminarIntro);

        // Si el usuario/niño hace clic en Saltar, continuar el juego
        skipText.on('pointerdown', () => {
            this.sound.play('pop');
            terminarIntro();
        });
    }

    _iniciarContador() {
        const { width: W, height: H } = this.scale;
        let conteo = 3;

        const rect = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(200);
        const textoContador = this.add.text(W / 2, H / 2, conteo.toString(), {
            fontSize: '150px', fontFamily: 'Luckiest Guy', color: '#ffcc00', stroke: '#000', strokeThickness: 15
        }).setOrigin(0.5).setDepth(201);

        this.sound.play('tick');
        this.tweens.add({
            targets: textoContador,
            scale: { start: 1.5, end: 1 },
            duration: 300,
            ease: 'Bounce.easeOut'
        });

        this.time.addEvent({
            delay: 1000,
            repeat: 3,
            callback: () => {
                conteo--;
                if (conteo > 0) {
                    textoContador.setText(conteo.toString());
                    this.sound.play('tick');
                    this.tweens.add({
                        targets: textoContador,
                        scale: { start: 1.5, end: 1 },
                        duration: 300,
                        ease: 'Bounce.easeOut'
                    });
                } else if (conteo === 0) {
                    textoContador.setText('¡YA!');
                    textoContador.setColor('#00ff00');
                    this.sound.play('pop');
                    this.tweens.add({
                        targets: textoContador,
                        scale: { start: 2, end: 1 },
                        duration: 300,
                        ease: 'Bounce.easeOut'
                    });
                } else {
                    textoContador.destroy();
                    rect.destroy();
                    this.juegoActivo = true;

                    // Spawn de enemigos
                    this.time.addEvent({
                        delay: CONFIG.spawnRate,
                        callback: this._spawnEnemigo,
                        callbackScope: this,
                        loop: true
                    });
                }
            }
        });
    }

    _buildHUD() {
        this.hudGroup = this.add.group();
        const hudY = 40;

        // 1. Puntaje
        this.textoPuntaje = this.add.text(40, this.H - 60, 'PUNTOS: 0', {
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

        // 3. Botón para abrir panel de animales
        const btnSpawnX = this.W / 2;
        const btnSpawnY = hudY + 10;
        const btnSpawnBg = this.add.graphics();
        btnSpawnBg.fillStyle(0x40c0dd, 1);
        btnSpawnBg.fillRoundedRect(btnSpawnX - 100, btnSpawnY - 20, 200, 40, 10);
        btnSpawnBg.lineStyle(2, 0xffffff, 1);
        btnSpawnBg.strokeRoundedRect(btnSpawnX - 100, btnSpawnY - 20, 200, 40, 10);

        const btnSpawnText = this.add.text(btnSpawnX, btnSpawnY, 'ELEGIR ANIMALES', {
            fontSize: '20px', fontFamily: 'Luckiest Guy', color: '#ffffff'
        }).setOrigin(0.5).setShadow(2, 2, '#000000', 4);

        const btnSpawnArea = this.add.rectangle(btnSpawnX, btnSpawnY, 200, 40, 0x000000, 0)
            .setInteractive({ cursor: 'pointer' });

        btnSpawnArea.on('pointerdown', () => {
            this.sound.play('pop');
            this._toggleMenuAnimales();
        });

        this.hudGroup.add(btnSpawnBg);
        this.hudGroup.add(btnSpawnText);
        this.hudGroup.add(btnSpawnArea);

        // Ocultar HUD inicialmente
        this.hudGroup.setVisible(false);
    }

    _toggleMenuAnimales() {
        if (this.menuAnimalesContainer) {
            this.menuAnimalesContainer.destroy();
            this.menuAnimalesContainer = null;
            return;
        }

        this.menuAnimalesContainer = this.add.container(this.W / 2, this.H / 2).setDepth(1000);

        // Fondo semi-transparente para cerrar
        const overlay = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.6)
            .setInteractive()
            .on('pointerdown', () => this._toggleMenuAnimales());
        this.menuAnimalesContainer.add(overlay);

        const panelW = 800;
        const panelH = 500;
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2e1a4e, 0.95);
        panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);
        panelBg.lineStyle(4, 0x40c0dd, 1);
        panelBg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);
        this.menuAnimalesContainer.add(panelBg);

        const titulo = this.add.text(0, -panelH / 2 + 40, 'SELECCIONA UN ANIMAL PARA ENVIARLO', {
            fontSize: '32px', fontFamily: 'Bubblegum Sans', color: '#ffffff'
        }).setOrigin(0.5);
        this.menuAnimalesContainer.add(titulo);

        const pool = ANIMAL_POOLS[this.escenarioActual] || ANIMAL_POOLS['scenery_bosque'];
        const cols = 5;
        const cellW = 140;
        const cellH = 100;
        const startX = -panelW / 2 + (panelW - (cols * cellW)) / 2 + cellW / 2;
        const startY = -panelH / 2 + 120;

        pool.forEach((anim, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * cellW;
            const y = startY + row * cellH;

            const card = this.add.container(x, y);

            const cardBg = this.add.graphics();
            cardBg.fillStyle(0x000000, 0.5);
            cardBg.fillRoundedRect(-50, -40, 100, 80, 10);
            cardBg.lineStyle(2, 0xffffff, 0.5);
            cardBg.strokeRoundedRect(-50, -40, 100, 80, 10);

            // Icono del animal (escalado para caber en el recuadro)
            const icon = this.add.image(0, 0, anim.key);
            // Asegurarse de que cabe en 80x60
            const scale = Math.min(80 / icon.width, 60 / icon.height);
            icon.setScale(scale);

            const hitArea = this.add.rectangle(0, 0, 100, 80, 0x000000, 0).setInteractive({ cursor: 'pointer' });
            hitArea.on('pointerdown', () => {
                this.sound.play('pop');
                this._spawnEnemigo(anim);
                this._toggleMenuAnimales(); // Cierra el menú al seleccionar
            });

            card.add([cardBg, icon, hitArea]);
            this.menuAnimalesContainer.add(card);
        });

        // Botón cerrar
        const btnCerrar = this.add.text(0, panelH / 2 - 40, 'CERRAR', {
            fontSize: '24px', fontFamily: 'Bangers', color: '#ffffff', backgroundColor: '#ff3344', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
        btnCerrar.on('pointerdown', () => {
            this.sound.play('pop');
            this._toggleMenuAnimales();
        });
        this.menuAnimalesContainer.add(btnCerrar);
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

    _spawnEnemigo(specificAnim = null) {
        if (!this.juegoActivo) return;

        const pool = ANIMAL_POOLS[this.escenarioActual] || ANIMAL_POOLS['scenery_bosque'];
        // Ensure specificAnim is an animal object and not a TimerEvent or similar argument
        const anim = (specificAnim && specificAnim.key) ? specificAnim : Phaser.Utils.Array.GetRandom(pool);

        const sides = ['left', 'right', 'back'];
        const side = Phaser.Utils.Array.GetRandom(sides);

        const config = SCENARIO_SPAWN_CONFIGS[this.escenarioActual] || SCENARIO_SPAWN_CONFIGS['scenery_bosque'];
        const spawnConfig = config[side];
        let zoneConfig = spawnConfig[anim.tipo];

        if (Array.isArray(zoneConfig)) {
            zoneConfig = Phaser.Utils.Array.GetRandom(zoneConfig);
        }

        let x, y;
        
        // Helper inline to calculate the coordinates
        const resolveCoordinate = (cfg) => {
            let minX = 0, maxX = 0, minY = 0, maxY = 0;

            // X calculation
            if (cfg.minXPercent !== undefined) {
                minX = cfg.minXPercent * this.W;
                maxX = cfg.maxXPercent * this.W;
            } else if (cfg.minXOffset !== undefined) {
                minX = this.W - cfg.minXOffset;
                maxX = this.W - (cfg.maxXOffset !== undefined ? cfg.maxXOffset : 0);
            } else if (cfg.minX !== undefined) {
                if (side === 'back') {
                    minX = (cfg.minX / 800) * this.W;
                    maxX = (cfg.maxX / 800) * this.W;
                } else {
                    minX = cfg.minX;
                    maxX = cfg.maxX;
                }
            }

            // Y calculation
            if (cfg.minYPercent !== undefined) {
                minY = cfg.minYPercent * this.H;
                maxY = cfg.maxYPercent * this.H;
            } else if (cfg.minYOffset !== undefined) {
                minY = this.H - cfg.minYOffset;
                maxY = this.H - (cfg.maxYOffset !== undefined ? cfg.maxYOffset : 0);
            } else if (cfg.minY !== undefined) {
                if (side === 'back') {
                    minY = (cfg.minY / 600) * this.H;
                    maxY = (cfg.maxY / 600) * this.H;
                } else {
                    minY = cfg.minY;
                    maxY = cfg.maxY;
                }
            }

            const finalMinX = Math.min(minX, maxX);
            const finalMaxX = Math.max(minX, maxX);
            const finalMinY = Math.min(minY, maxY);
            const finalMaxY = Math.max(minY, maxY);

            return {
                x: Phaser.Math.Between(finalMinX, finalMaxX),
                y: Phaser.Math.Between(finalMinY, finalMaxY)
            };
        };

        const coord = resolveCoordinate(zoneConfig);
        x = coord.x;
        y = coord.y;

        const enemigo = this.add.sprite(x, y, anim.key).setScale(0).setDepth(4);

        // ESCALA INDIVIDUAL: Ahora cada animal usa exactamente su valor de la pool
        enemigo.baseScale = anim.scale;

        if (anim.tipo === 'ground') {
            enemigo.setOrigin(0.5, 1);
        }

        enemigo.entryScaleMultiplier = 0;

        this.tweens.add({
            targets: enemigo,
            entryScaleMultiplier: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        enemigo.speed = 2.0;
        enemigo.targetY = this.H - 120;
        enemigo.spawnY = y;
        enemigo.spawnX = x;
        enemigo.spawnSide = side;
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
            if (!red || !red.visible || red.targetX === undefined) return;

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
                    enemigo.escalaAtaque = 1.0;
                    this.tweens.add({
                        targets: enemigo,
                        escalaAtaque: 1.3,
                        duration: 100,
                        yoyo: true,
                        onComplete: () => { enemigo.escalaAtaque = 1.0; }
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
            let currentScale;
            if (enemigo.spawnSide === 'back') {
                // Si aparece desde el fondo (horizonte), empieza con minBackgroundScale y se agranda hasta su tamaño base
                const totalDistY = enemigo.targetY - enemigo.spawnY;
                const currentDistY = enemigo.y - enemigo.spawnY;
                const progress = totalDistY > 0 ? Phaser.Math.Clamp(currentDistY / totalDistY, 0, 1) : 1;

                const config = SCENARIO_SPAWN_CONFIGS[this.escenarioActual] || SCENARIO_SPAWN_CONFIGS['scenery_bosque'];
                const minScaleMult = config.minBackgroundScale !== undefined ? config.minBackgroundScale : 0.5;
                const scaleMultiplier = minScaleMult + progress * (1 - minScaleMult);
                currentScale = enemigo.baseScale * scaleMultiplier;
            } else {
                // Spawns normales de izquierda/derecha
                const factorY = (enemigo.y / this.H);
                currentScale = enemigo.baseScale * (0.8 + factorY * 0.4);
            }

            // Aplicar el multiplicador de escala de la animación de entrada
            if (enemigo.entryScaleMultiplier !== undefined) {
                currentScale *= enemigo.entryScaleMultiplier;
            }

            // Para mantener el efecto del tween de aviso de ataque
            if (enemigo.escalaAtaque) {
                currentScale *= enemigo.escalaAtaque;
            }

            enemigo.setScale(currentScale);

            if (enemigo.timerText) {
                enemigo.timerText.x = enemigo.x;
                enemigo.timerText.y = enemigo.y - (enemigo.displayHeight / 2 + 30);

                // Escalar el texto del temporizador según el tamaño del enemigo (legibilidad mínima de 0.5)
                const textScale = Math.max(0.5, currentScale / enemigo.baseScale);
                enemigo.timerText.setScale(textScale);
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

        // Ahora escuchamos al puerto 8081 (LiDAR)
        if (data.port !== 8081) return;

        if (data.touches && data.touches.length > 0) {
            data.touches.forEach(touch => {
                this._checkHit(touch.x, touch.y);
            });
        } else if (data.x !== undefined && data.y !== undefined) {
            this._checkHit(data.x, data.y);
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
        // Reiniciar la escena limpiando explícitamente el escenario a reintentar
        // de esta manera Phaser 3 no mantiene la data del reintento anterior
        this.scene.restart({ reintentarEscenario: null });
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
        this.sound.stopAll();

        const { width: W, height: H } = this.scale;

        // 🎥 REPRODUCIR VIDEO FINAL (Cubre toda la pantalla)
        const videoFinal = this.add.video(W / 2, H / 2, 'final');
        videoFinal.setDepth(300);
        videoFinal.play();

        // Escalar manteniendo la relación de aspecto original (sin estirar) y cubriendo la pantalla
        videoFinal.on('play', () => {
            if (videoFinal.width > 0 && videoFinal.height > 0) {
                const scaleX = W / videoFinal.width;
                const scaleY = H / videoFinal.height;
                const scale = Math.max(scaleX, scaleY);
                videoFinal.setScale(scale);

                // Ajuste milimétrico perfecto: ligeramente por debajo de la mitad.
                // Esto desplaza el video exactamente para que el rostro y la capucha
                // se encuadren con una armonía de pantalla insuperable.
                videoFinal.y = H / 2 + 10;
            }
        });

        // Botón elegante para Saltar el video final (Glassmorphic look)
        const skipText = this.add.text(W - 40, 40, 'SALTAR ⏭', {
            fontSize: '22px',
            fontFamily: 'Luckiest Guy',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 20, y: 10 }
        }).setOrigin(1, 0.5).setDepth(301).setInteractive({ cursor: 'pointer' });

        skipText.setShadow(2, 2, '#000000', 4);

        let videoFinalizado = false;
        const terminarVideoFinal = () => {
            if (videoFinalizado) return;
            videoFinalizado = true;

            // Limpieza del video e indicador
            videoFinal.stop();
            videoFinal.destroy();
            skipText.destroy();

            // ─── MOSTRAR PANTALLA DE GAME OVER ORIGINAL ───
            this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(100);
            this.add.text(W / 2, H / 2 - 80, 'EL HADA SE QUEDÓ SIN ENERGÍA', {
                fontSize: '48px', color: '#ff0000', fontFamily: 'Arial Black'
            }).setOrigin(0.5).setDepth(101);

            const btn = this.add.text(W / 2, H / 2 + 20, 'REINTENTAR', {
                fontSize: '32px', color: '#ffffff', backgroundColor: '#9c4eb3', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setDepth(101).setInteractive({ cursor: 'pointer' });
            btn.on('pointerdown', () => {
                this.sound.play('pop');
                this.sound.stopAll();
                this.scene.restart({ reintentarEscenario: this.escenarioActual });
            });

            const btnMenuGO = this.add.text(W / 2, H / 2 + 90, '☰ VOLVER AL MENÚ', {
                fontSize: '28px', color: '#ffffff', backgroundColor: '#2e1a4e', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setDepth(101).setInteractive({ cursor: 'pointer' });
            btnMenuGO.on('pointerdown', () => {
                this.sound.play('pop');
                this._volverAlMenu();
            });

            this.sound.play('end');
        };

        // Si el video termina solo, mostrar Game Over
        videoFinal.on('complete', terminarVideoFinal);

        // Si hacen clic en Saltar, mostrar Game Over
        skipText.on('pointerdown', () => {
            this.sound.play('pop');
            terminarVideoFinal();
        });
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
