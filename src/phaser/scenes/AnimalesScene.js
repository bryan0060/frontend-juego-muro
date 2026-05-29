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
    'menu_fox': 'Canción 4',
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
        { key: 'bosque_cuervo', scale: 0.10, tipo: 'flying', reverseFlip: true },
        { key: 'bosque_aguila', scale: 0.27, tipo: 'flying' },
        { key: 'bosque_buho', scale: 0.27, tipo: 'flying' },
        { key: 'bosque_abeja', scale: 0.16, tipo: 'flying', reverseFlip: true },
        { key: 'bosque_carpintero', scale: 0.22, tipo: 'flying' },
        { key: 'bosque_conejo', scale: 0.2, tipo: 'ground', reverseFlip: true },
        { key: 'bosque_elefante', scale: 0.45, tipo: 'ground' },
        { key: 'bosque_gorilla', scale: 0.35, tipo: 'ground' },
        { key: 'bosque_mariposa', scale: 0.16, tipo: 'flying' },
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
            flying: [
                // Cielo Izquierdo
                { minXPercent: 0.15, maxXPercent: 0.40, minYPercent: 0.10, maxYPercent: 0.28 },
                // Cielo Derecho
                { minXPercent: 0.60, maxXPercent: 0.85, minYPercent: 0.10, maxYPercent: 0.28 },
                // Cielo Central
                { minXPercent: 0.40, maxXPercent: 0.60, minYPercent: 0.08, maxYPercent: 0.22 }
            ],
            ground: [
                // Zona Izquierda lejana (entre los árboles de la izquierda)
                { minXPercent: 0.15, maxXPercent: 0.28, minYPercent: 0.65, maxYPercent: 0.78 },
                // Zona Izquierda profunda (más al borde)
                { minXPercent: 0.08, maxXPercent: 0.18, minYPercent: 0.62, maxYPercent: 0.72 },
                // Zona Derecha lejana (en el sendero/círculo amarillo)
                { minXPercent: 0.58, maxXPercent: 0.75, minYPercent: 0.65, maxYPercent: 0.78 },
                // Zona Derecha profunda (más al borde)
                { minXPercent: 0.76, maxXPercent: 0.88, minYPercent: 0.62, maxYPercent: 0.72 }
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
        minBackgroundScale: 0.65
    },
    'scenery_desierto': {
        back: {
            flying: [
                // Cielo Alto Izquierdo
                { minXPercent: 0.10, maxXPercent: 0.35, minYPercent: 0.10, maxYPercent: 0.30 },
                // Cielo Alto Derecho
                { minXPercent: 0.65, maxXPercent: 0.90, minYPercent: 0.10, maxYPercent: 0.30 },
                // Vuelo bajo planeando sobre dunas
                { minXPercent: 0.35, maxXPercent: 0.65, minYPercent: 0.25, maxYPercent: 0.45 }
            ],
            ground: [
                // Zona Dunas Izquierda
                { minXPercent: 0.10, maxXPercent: 0.32, minYPercent: 0.52, maxYPercent: 0.65 },
                // Zona Dunas Izquierda-Media (separada del centro)
                { minXPercent: 0.20, maxXPercent: 0.38, minYPercent: 0.55, maxYPercent: 0.68 },
                // Zona Dunas Derecha
                { minXPercent: 0.68, maxXPercent: 0.88, minYPercent: 0.52, maxYPercent: 0.65 },
                // Zona Dunas Derecha-Media (separada del centro)
                { minXPercent: 0.60, maxXPercent: 0.78, minYPercent: 0.55, maxYPercent: 0.68 }
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
        minBackgroundScale: 0.65
    },
    'scenery_hielo': {
        back: {
            flying: [
                // Cielo Ártico Izquierdo
                { minXPercent: 0.10, maxXPercent: 0.40, minYPercent: 0.10, maxYPercent: 0.30 },
                // Cielo Ártico Derecho
                { minXPercent: 0.60, maxXPercent: 0.90, minYPercent: 0.10, maxYPercent: 0.30 },
                // Horizonte del Cielo
                { minXPercent: 0.35, maxXPercent: 0.65, minYPercent: 0.18, maxYPercent: 0.38 }
            ],
            ground: [
                // Glaciar Izquierdo Lejano
                { minXPercent: 0.10, maxXPercent: 0.25, minYPercent: 0.55, maxYPercent: 0.68 },
                // Glaciar Izquierdo Cercano (separado del centro)
                { minXPercent: 0.20, maxXPercent: 0.38, minYPercent: 0.60, maxYPercent: 0.72 },
                // Glaciar Derecho Lejano
                { minXPercent: 0.72, maxXPercent: 0.88, minYPercent: 0.55, maxYPercent: 0.68 },
                // Glaciar Derecho Cercano (separado del centro)
                { minXPercent: 0.60, maxXPercent: 0.78, minYPercent: 0.60, maxYPercent: 0.72 }
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
        minBackgroundScale: 0.65
    },
    'scenery_pantano': {
        back: {
            flying: [
                // Sobre el agua (Bajo)
                { minXPercent: 0.20, maxXPercent: 0.80, minYPercent: 0.28, maxYPercent: 0.48 },
                // Copa de Árboles Izquierda
                { minXPercent: 0.10, maxXPercent: 0.35, minYPercent: 0.10, maxYPercent: 0.26 },
                // Copa de Árboles Derecha
                { minXPercent: 0.65, maxXPercent: 0.90, minYPercent: 0.10, maxYPercent: 0.26 }
            ],
            ground: [
                // Orilla Izquierda Lejana
                { minXPercent: 0.08, maxXPercent: 0.22, minYPercent: 0.55, maxYPercent: 0.68 },
                // Orilla Izquierda Cercana (separada del centro)
                { minXPercent: 0.18, maxXPercent: 0.36, minYPercent: 0.60, maxYPercent: 0.74 },
                // Manglar Derecho Lejano
                { minXPercent: 0.74, maxXPercent: 0.88, minYPercent: 0.55, maxYPercent: 0.68 },
                // Manglar Derecho Cercano (separado del centro)
                { minXPercent: 0.62, maxXPercent: 0.78, minYPercent: 0.60, maxYPercent: 0.74 }
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
        minBackgroundScale: 0.65
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

        this.redDerecha = this.add.image(-200, -200, 'red').setScale(0.3).setDepth(20).setVisible(false);
        this.redDerecha.targetX = -200;
        this.redDerecha.targetY = -200;

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
            'menu_fox',
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
            this.menuMusic.removeAllListeners();
        } else {
            // Limpiar cualquier otra cancion de menu que pudiera estar sonando
            menuSongs.forEach(song => this.sound.stopByKey(song));
        }

        let nextSong = songKey;
        if (!nextSong) {
            let songsPool = menuSongs;
            if (this.currentMenuSongKey) {
                songsPool = menuSongs.filter(s => s !== this.currentMenuSongKey);
            }
            nextSong = Phaser.Utils.Array.GetRandom(songsPool);
        }
        this.currentMenuSongKey = nextSong;

        const playConfig = { loop: false, volume: 0.5 };
        if (nextSong === 'menu_reyleon') {
            playConfig.seek = 0;
        } else if (nextSong === 'menu_cars' || nextSong === 'menu_cars2') {
            playConfig.seek = 29;
        } else if (nextSong === 'menu_rio') {
            playConfig.seek = 7;
        } else if (nextSong === 'menu_shek') {
            playConfig.seek = 7;
        } else if (nextSong === 'menu_sheck') {
            playConfig.seek = 3;
        }
        else if (nextSong === 'menu_fox') {
            playConfig.seek = 24;
        }

        this.menuMusic = this.sound.add(nextSong, playConfig);
        this.menuMusic.play(playConfig);

        // Al finalizar la canción, reproducir otra aleatoria si seguimos en el menú
        this.menuMusic.once('complete', () => {
            if (this.menuContainer && this.menuContainer.active !== false) {
                this._playMenuMusic();
            }
        });

        // Actualizar el texto del botón si existe
        if (this.btnMusicText && this.btnMusicText.scene) {
            const friendlyName = SONG_NAMES[nextSong] || 'Canción 1';
            this.btnMusicText.setText(`🎵 ${friendlyName.toUpperCase()}`);
        }
    }

    _mostrarMenuEscenarios() {
        this.sensorButtons = [];
        const { width: W, height: H } = this.scale;

        this.menuContainer = this.add.container(0, 0).setDepth(200);

        // Fondo de Video en Bucle Mudo con Transición Suave (Cross-fade)
        const bgVideo1 = this.add.video(W / 2, H / 2, 'animales_menu_video').setMute(true);
        const bgVideo2 = this.add.video(W / 2, H / 2, 'animales_menu_video').setMute(true);
        this.bgVideo1 = bgVideo1;
        this.bgVideo2 = bgVideo2;

        this.menuContainer.add(bgVideo1);
        this.menuContainer.add(bgVideo2);

        // Video 1 empieza visible, Video 2 invisible
        bgVideo1.setAlpha(1);
        bgVideo2.setAlpha(0);

        // Escalar video proporcionalmente para cubrir toda la pantalla sin distorsión
        const scaleVideo = (videoObj) => {
            if (videoObj && videoObj.width > 0 && videoObj.height > 0) {
                const scaleX = W / videoObj.width;
                const scaleY = H / videoObj.height;
                const scale = Math.max(scaleX, scaleY);
                videoObj.setScale(scale);
            }
        };

        bgVideo1.on('play', () => scaleVideo(bgVideo1));
        bgVideo2.on('play', () => scaleVideo(bgVideo2));

        bgVideo1.play();

        let activeVideo = bgVideo1;
        let standbyVideo = bgVideo2;
        let isTransitioning = false;

        // Monitorear constantemente el tiempo de reproducción cada 100ms
        this.menuVideoLoopTimer = this.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (!activeVideo || !activeVideo.video || isTransitioning) return;

                const rawVid = activeVideo.video;
                const duration = rawVid.duration;
                const currentTime = rawVid.currentTime;

                // Si queda menos de 1 segundo para que acabe el video activo
                if (duration > 0 && (duration - currentTime) < 1.0) {
                    isTransitioning = true;

                    // Iniciamos el video en espera
                    standbyVideo.setAlpha(0);
                    standbyVideo.play();

                    // Hacemos el fundido cruzado (cross-fade)
                    this.tweens.add({
                        targets: activeVideo,
                        alpha: 0,
                        duration: 800,
                        ease: 'Linear',
                        onComplete: () => {
                            if (activeVideo) activeVideo.stop();
                        }
                    });

                    this.tweens.add({
                        targets: standbyVideo,
                        alpha: 1,
                        duration: 800,
                        ease: 'Linear',
                        onComplete: () => {
                            // Intercambiamos los roles
                            const temp = activeVideo;
                            activeVideo = standbyVideo;
                            standbyVideo = temp;
                            isTransitioning = false;
                        }
                    });
                }
            }
        });

        // Sistema de partículas para el clic (Estrellas mágicas)
        this.clickParticles = this.add.particles(0, 0, 'estrella_magica', {
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 100, max: 450 },
            lifespan: 700,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(500);

        // Evento de clic global para las estrellas y para INICIAR el juego al tocar cualquier parte de la pantalla
        this.input.on('pointerdown', (pointer) => {
            if (this.menuContainer && this.menuContainer.visible) {
                // Evitar iniciar el juego si se hace clic en el botón de cambiar canción
                if (this.btnMusicArea && this.btnMusicArea.getBounds().contains(pointer.x, pointer.y)) {
                    return;
                }

                this.clickParticles.setPosition(pointer.x, pointer.y);
                this.clickParticles.explode(40);
                this.sound.play('pop', { volume: 0.5, detune: Phaser.Math.Between(-500, 500) });

                // Efecto de transición e inicio del juego inmediato
                this.cameras.main.flash(400, 255, 255, 255);
                this._iniciarJuego('scenery_bosque');
            } else if (this.juegoActivo) {
                this._checkHit(pointer.x, pointer.y);
                // Feedback visual al hacer clic en el juego
                this.particles.setPosition(pointer.x, pointer.y);
                this.particles.explode(15);
            }
        });

        // Título Estilo Fantasía Mágico con Delineado de Madera Profundo
        const tituloSombra = this.add.text(W / 2, 104, 'DESCUBRE EL SECRETO\nDE LA HADA', {
            fontSize: '64px',
            fontFamily: 'Cinzel Decorative',
            fontWeight: 'bold',
            align: 'center',
            fill: '#15240c', // Sombra verde musgo oscura
            stroke: '#0d1706',
            strokeThickness: 16,
        }).setOrigin(0.5);
        tituloSombra.setShadow(0, 8, 'rgba(0, 0, 0, 0.8)', 10, true, true);

        const titulo = this.add.text(W / 2, 100, 'DESCUBRE EL SECRETO\nDE LA HADA', {
            fontSize: '64px',
            fontFamily: 'Cinzel Decorative',
            fontWeight: 'bold',
            align: 'center',
            stroke: '#1b1207', // Borde de corteza de madera oscura
            strokeThickness: 8,
        }).setOrigin(0.5);

        // Crear un hermoso gradiente vertical metálico-mágico (Oro -> Bronce -> Musgo)
        const gradient = titulo.context.createLinearGradient(0, 0, 0, 90);
        gradient.addColorStop(0, '#fdf7cd'); // Oro resplandeciente
        gradient.addColorStop(0.3, '#d4af37'); // Oro puro
        gradient.addColorStop(0.65, '#8b7325'); // Bronce antiguo
        gradient.addColorStop(1, '#3b5118'); // Verde bosque profundo
        titulo.setFill(gradient);

        this.menuContainer.add([tituloSombra, titulo]);

        // Botón Estático "COMIENZA TU AVENTURA MÁGICA AQUÍ" con estilo fantasía
        const startTextSombra = this.add.text(W / 2, H - 110, 'COMIENZA TU AVENTURA MÁGICA AQUÍ', {
            fontSize: '26px',
            fontFamily: 'Cinzel Decorative',
            fontWeight: 'bold',
            color: '#15240c',
            stroke: '#0d1706',
            strokeThickness: 8
        }).setOrigin(0.5);
        startTextSombra.setShadow(0, 4, 'rgba(0, 0, 0, 0.8)', 6, true, true);

        const startText = this.add.text(W / 2, H - 112, 'COMIENZA TU AVENTURA MÁGICA AQUÍ', {
            fontSize: '26px',
            fontFamily: 'Cinzel Decorative',
            fontWeight: 'bold',
            stroke: '#1b1207',
            strokeThickness: 4
        }).setOrigin(0.5);

        const startGradient = startText.context.createLinearGradient(0, 0, 0, 30);
        startGradient.addColorStop(0, '#ffefa8'); // Oro claro
        startGradient.addColorStop(0.5, '#e0a32e'); // Oro cálido
        startGradient.addColorStop(1, '#825310'); // Bronce/Madera
        startText.setFill(startGradient);

        // Animación suave de pulsación (respiración mágica)
        this.tweens.add({
            targets: [startText, startTextSombra],
            scale: 1.04,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.menuContainer.add([startTextSombra, startText]);

        // Botón elegante "Cambiar Canción" (Glassmorphism en la parte inferior derecha)
        const btnMusicX = W - 140;
        const btnMusicY = H - 45;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x1a0f05, 0.75); // Fondo bark marrón translúcido
        btnBg.fillRoundedRect(btnMusicX - 110, btnMusicY - 20, 220, 40, 12);
        btnBg.lineStyle(2, 0xd4af37, 1); // Borde de oro brillante
        btnBg.strokeRoundedRect(btnMusicX - 110, btnMusicY - 20, 220, 40, 12);

        const currentSongName = SONG_NAMES[this.currentMenuSongKey] || 'Canción 1';
        this.btnMusicText = this.add.text(btnMusicX, btnMusicY, `🎵 ${currentSongName.toUpperCase()}`, {
            fontSize: '13px',
            fontFamily: 'Luckiest Guy',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.btnMusicArea = this.add.rectangle(btnMusicX, btnMusicY, 220, 40, 0x000000, 0)
            .setInteractive({ cursor: 'pointer' });

        this.btnMusicArea.on('pointerdown', () => {
            this.sound.play('pop', { volume: 0.5 });
            this._playMenuMusic();
        });

        // Micro-animación en hover
        this.btnMusicArea.on('pointerover', () => {
            this.tweens.add({
                targets: [this.btnMusicText],
                scale: 1.08,
                duration: 150
            });
        });
        this.btnMusicArea.on('pointerout', () => {
            this.tweens.add({
                targets: [this.btnMusicText],
                scale: 1.0,
                duration: 150
            });
        });

        this.menuContainer.add([btnBg, this.btnMusicText, this.btnMusicArea]);

        // Registrar un botón virtual gigante para compatibilidad con LiDAR
        this.sensorButtons.push({
            absX: W / 2,
            absY: H / 2,
            w: W,
            h: H,
            callback: () => {
                this.sound.play('pop');
                this.cameras.main.flash(400, 255, 255, 255);
                this._iniciarJuego('scenery_bosque');
            }
        });
    }

    _iniciarJuego(escenarioId) {
        if (this.menuVideoLoopTimer) {
            this.menuVideoLoopTimer.destroy();
            this.menuVideoLoopTimer = null;
        }

        // Detener los videos del menú explícitamente para liberar decodificadores de hardware
        if (this.bgVideo1) {
            this.bgVideo1.stop();
        }
        if (this.bgVideo2) {
            this.bgVideo2.stop();
        }

        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = null;
        }

        this.bgVideo1 = null;
        this.bgVideo2 = null;

        // Crear la playlist circular con los 4 escenarios
        const todosEscenarios = ['scenery_bosque', 'scenery_desierto', 'scenery_hielo', 'scenery_pantano'];
        const idx = todosEscenarios.indexOf(escenarioId) !== -1 ? todosEscenarios.indexOf(escenarioId) : 0;

        this.playlistEscenarios = [];
        for (let i = 0; i < 4; i++) {
            this.playlistEscenarios.push(todosEscenarios[(idx + i) % 4]);
        }

        this.playlistIndex = 0;
        this.escenarioActual = this.playlistEscenarios[0];
        this.enTransicion = false;

        this.estado = 'jugando';
        this.juegoActivo = false;

        const { width: W, height: H } = this.scale;

        // Fondo seleccionado guardando referencia
        this.backgroundImg = this.add.image(W / 2, H / 2, this.escenarioActual).setDisplaySize(W, H).setDepth(-1);

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

        this.sensorButtons = [];
        this.sensorButtons.push({
            absX: W - 40, absY: 40, w: 200, h: 50,
            callback: () => {
                this.sound.play('pop');
                terminarIntro();
            }
        });

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
            this.jaula.setVisible(false);
            this.hada.setVisible(true);
            this.hudGroup.setVisible(true);

            // Empezar música ambiental en loop
            const soundKey = this.escenarioActual.replace('scenery_', 'sonido_');
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

                    // Spawn de enemigos con dificultad progresiva
                    if (this.spawnTimerEvent) {
                        this.spawnTimerEvent.destroy();
                    }
                    this.spawnTimerEvent = this.time.addEvent({
                        delay: Math.max(1200, CONFIG.spawnRate - (this.playlistIndex * 600)),
                        callback: this._spawnEnemigo,
                        callbackScope: this,
                        loop: true
                    });
                }
            }
        });
    }

    _transicionSiguienteEscenario() {
        if (this.enTransicion) return;
        this.enTransicion = true;
        this.juegoActivo = false;

        // Limpiar el temporizador de spawneo actual
        if (this.spawnTimerEvent) {
            this.spawnTimerEvent.destroy();
            this.spawnTimerEvent = null;
        }

        const { width: W, height: H } = this.scale;

        // 1. Eliminar limpia y exhaustivamente todos los enemigos en pantalla
        const arrayEnemigos = [...this.enemigos.getChildren()];
        arrayEnemigos.forEach(e => {
            if (e.timerText) e.timerText.destroy();
            e.destroy();
        });
        this.enemigos.clear(true, true);

        // 2. Incrementar índice y cambiar escenario
        this.playlistIndex++;
        this.escenarioActual = this.playlistEscenarios[this.playlistIndex];

        // 3. Efectos visuales de transición (Destello blanco)
        this.cameras.main.flash(500, 255, 255, 255);

        // 4. Cambiar fondo
        if (this.backgroundImg) {
            this.backgroundImg.setTexture(this.escenarioActual);
        }

        // 5. Cambiar música ambiental
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic.destroy();
        }
        const soundKey = this.escenarioActual.replace('scenery_', 'sonido_');
        this.bgMusic = this.sound.add(soundKey, { loop: true, volume: 0.6 });
        this.bgMusic.play();

        // 6. Mostrar anuncio espectacular en pantalla
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setDepth(200);

        const nombresMap = {
            'scenery_bosque': 'BOSQUE',
            'scenery_desierto': 'DESIERTO',
            'scenery_hielo': 'HIELO',
            'scenery_pantano': 'PANTANO'
        };
        const sgteNombre = nombresMap[this.escenarioActual] || 'SIGUIENTE';

        // Título de completado con sombra
        const textCompletadoSombra = this.add.text(W / 2, H / 2 - 47, '¡ESCENARIO COMPLETADO!', {
            fontSize: '64px',
            fontFamily: 'Luckiest Guy',
            color: '#1a052e',
            stroke: '#1a052e',
            strokeThickness: 12
        }).setOrigin(0.5).setDepth(201);

        const textCompletado = this.add.text(W / 2, H / 2 - 50, '¡ESCENARIO COMPLETADO!', {
            fontSize: '64px',
            fontFamily: 'Luckiest Guy',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 10
        }).setOrigin(0.5).setDepth(202);

        // Título siguiente escenario
        const textSiguienteSombra = this.add.text(W / 2, H / 2 + 32, `PREPÁRATE PARA EL ${sgteNombre}`, {
            fontSize: '38px',
            fontFamily: 'Bubblegum Sans',
            color: '#1a052e',
            stroke: '#1a052e',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(201);

        const textSiguiente = this.add.text(W / 2, H / 2 + 30, `PREPÁRATE PARA EL ${sgteNombre}`, {
            fontSize: '38px',
            fontFamily: 'Bubblegum Sans',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(202);

        // Crear degradado en el texto de completado
        const gradient = textCompletado.context.createLinearGradient(0, 0, 0, 50);
        gradient.addColorStop(0, '#ffeb3b');
        gradient.addColorStop(1, '#ff9800');
        textCompletado.setFill(gradient);

        this.sound.play('victoria', { volume: 0.7 });

        this.tweens.add({
            targets: [textCompletado, textCompletadoSombra, textSiguiente, textSiguienteSombra],
            scale: { start: 0.8, end: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });

        // 7. Reanudar juego tras 2.5 segundos con cuenta regresiva automática
        this.time.delayedCall(2500, () => {
            textCompletado.destroy();
            textCompletadoSombra.destroy();
            textSiguiente.destroy();
            textSiguienteSombra.destroy();
            overlay.destroy();
            this.enTransicion = false;

            // Iniciar cuenta regresiva para el siguiente escenario
            this._iniciarContador();
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
        if (!this.juegoActivo || this.enTransicion) return;

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

        // ESCALA INDIVIDUAL: Ahora cada animal usa exactamente su valor de la pool (con un factor de 1.5 para hacerlos más grandes)
        enemigo.baseScale = anim.scale * 1.5;

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

        enemigo.speed = 2.0 + (this.playlistIndex * 0.8);
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
            red.x = Phaser.Math.Linear(red.x, red.targetX, 0.7);
            red.y = Phaser.Math.Linear(red.y, red.targetY, 0.7);

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

            // Verificar si alcanzamos la meta del escenario actual
            const scoreGoal = (this.playlistIndex + 1) * 1000;
            if (this.puntaje >= scoreGoal) {
                if (this.playlistIndex < 3) {
                    this._transicionSiguienteEscenario();
                } else {
                    this._gameWin();
                }
            }
        }
        if (enemigo.timerText) enemigo.timerText.destroy();
        enemigo.destroy();
    }

    _danoJaula() {
        this.energia -= 10;
        this._updateBarraEnergia();

        // Reproducir sonido de impacto aleatorio en la jaula
        const golpeSounds = ['animal_golpe1', 'animal_golpe2', 'animal_golpe3', 'animal_golpe4'];
        const randomGolpe = Phaser.Utils.Array.GetRandom(golpeSounds);
        this.sound.play(randomGolpe, { volume: 0.8 });

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
        try {
            if (!this.scene?.isActive('AnimalesScene')) return;
        } catch (_) {
            return;
        }
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

            // Verificar sensorButtons primero
            if (this.sensorButtons?.length > 0) {
                for (const btn of this.sensorButtons) {
                    if (x >= btn.absX - btn.w / 2 && x <= btn.absX + btn.w / 2 &&
                        y >= btn.absY - btn.h / 2 && y <= btn.absY + btn.h / 2) {
                        btn.callback();
                        return;
                    }
                }
            }

            if (this.estado === 'seleccion') {
                this.sound.play('pop');
                this.cameras.main.flash(400, 255, 255, 255);
                this._iniciarJuego('scenery_bosque');
                return;
            }

            if (data.touches?.length > 0) {
                data.touches.forEach(touch => this._checkHit(touch.x, touch.y));
            } else if (x !== undefined) {
                this._checkHit(x, y);
            }
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

        if (mano_derecha?.visible) {
            this.redDerecha.targetX = (1 - remapX(mano_derecha.x)) * this.W;
            this.redDerecha.targetY = remapY(mano_derecha.y) * this.H;
            if (this.redDerecha) this.redDerecha.setVisible(true);
        } else {
            if (this.redDerecha) this.redDerecha.setVisible(false);
        }

        if (this.redIzquierda) this.redIzquierda.setVisible(false);
    }

    _checkHit(x, y) {
        if (!this.juegoActivo) return;

        this.enemigos.getChildren().forEach(enemigo => {
            const dist = Phaser.Math.Distance.Between(x, y, enemigo.x, enemigo.y);
            // Usar la dimensión real visual en pantalla (displayWidth/displayHeight)
            // de esta manera el radio de colisión escala perfectamente con el tamaño del animal
            const halfWidth = (enemigo.displayWidth || 0) / 2;
            const halfHeight = (enemigo.displayHeight || 0) / 2;
            const sizeRadius = Math.max(halfWidth, halfHeight) * 1.6;
            const hitRadius = Math.max(160, sizeRadius);

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
        this.juegoActivo = false;
        this.sound.stopAll();
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.enemigos.getChildren().forEach(e => {
            if (e.timerText) e.timerText.destroy();
            e.destroy();
        });
        return false; // ← Siempre devuelve false para que PhaserGame llame onBack()
    }

    _gameOver() {
        this.juegoActivo = false;
        this.sound.stopAll();

        const { width: W, height: H } = this.scale;

        // 🎥 REPRODUCIR VIDEO DE DERROTA (Cubre toda la pantalla)
        const videoDerrota = this.add.video(W / 2, H / 2, 'perdio');
        videoDerrota.setDepth(300);
        videoDerrota.play();

        // Escalar manteniendo la relación de aspecto original (sin estirar) y cubriendo la pantalla
        videoDerrota.on('play', () => {
            if (videoDerrota.width > 0 && videoDerrota.height > 0) {
                const scaleX = W / videoDerrota.width;
                const scaleY = H / videoDerrota.height;
                const scale = Math.max(scaleX, scaleY);
                videoDerrota.setScale(scale);

                // Ajuste milimétrico perfecto: ligeramente por debajo de la mitad.
                videoDerrota.y = H / 2 + 10;
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



        skipText.setShadow(2, 2, '#000000', 4);

        this.sensorButtons = [];
        this.sensorButtons.push({
            absX: W - 40, absY: 40, w: 200, h: 50,
            callback: () => { this.sound.play('pop'); terminarVideoDerrota(); }
        });

        let videoFinalizado = false;
        const terminarVideoDerrota = () => {
            if (videoFinalizado) return;
            videoFinalizado = true;

            // Limpieza del video e indicador
            videoDerrota.stop();
            videoDerrota.destroy();
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
                this.scene.restart({ reintentarEscenario: this.playlistEscenarios[0] });
            });

            this.sensorButtons = [];
            this.sensorButtons.push(
                {
                    absX: W / 2, absY: H / 2 + 20, w: 200, h: 60, callback: () => {
                        this.sound.play('pop');
                        this.sound.stopAll();
                        this.scene.restart({ reintentarEscenario: this.playlistEscenarios[0] });
                    }
                },
            );

            this.sound.play('end');
        };

        // Si el video termina solo, mostrar Game Over
        videoDerrota.on('complete', terminarVideoDerrota);

        // Si hacen clic en Saltar, mostrar Game Over
        skipText.on('pointerdown', () => {
            this.sound.play('pop');
            terminarVideoDerrota();
        });
    }

    _gameWin() {
        this.juegoActivo = false;
        this.sound.stopAll();

        const { width: W, height: H } = this.scale;

        // 🎥 REPRODUCIR VIDEO DE VICTORIA (Cubre toda la pantalla)
        const videoVictoria = this.add.video(W / 2, H / 2, 'final');
        videoVictoria.setDepth(300);
        videoVictoria.play();

        // Escalar manteniendo la relación de aspecto original (sin estirar) y cubriendo la pantalla
        videoVictoria.on('play', () => {
            if (videoVictoria.width > 0 && videoVictoria.height > 0) {
                const scaleX = W / videoVictoria.width;
                const scaleY = H / videoVictoria.height;
                const scale = Math.max(scaleX, scaleY);
                videoVictoria.setScale(scale);

                // Ajuste milimétrico perfecto
                videoVictoria.y = H / 2 + 10;
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

        skipText.setShadow(2, 2, '#000000', 4);

        this.sensorButtons = [];
        this.sensorButtons.push({
            absX: W - 40, absY: 40, w: 200, h: 50,
            callback: () => { this.sound.play('pop'); terminarVideoVictoria(); }
        });

        let videoFinalizado = false;
        const terminarVideoVictoria = () => {
            if (videoFinalizado) return;
            videoFinalizado = true;

            // Limpieza del video e indicador
            videoVictoria.stop();
            videoVictoria.destroy();
            skipText.destroy();

            // ─── MOSTRAR PANTALLA DE VICTORIA ESPECTACULAR ───
            this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setDepth(100);

            // Generador de partículas doradas cayendo como confeti
            const winParticles = this.add.particles(0, 0, 'estrella_magica', {
                x: { min: 0, max: W },
                y: -10,
                quantity: 2,
                frequency: 80,
                lifespan: 3500,
                speedY: { min: 80, max: 220 },
                speedX: { min: -40, max: 40 },
                scale: { start: 0.8, end: 0.1 },
                alpha: { start: 1, end: 0 },
                tint: [0xffd700, 0xffaa00, 0xffff00, 0x00ffff, 0xff00ff],
                blendMode: 'ADD'
            }).setDepth(101);

            // Título de victoria con sombra profunda
            const textWinSombra = this.add.text(W / 2, H / 2 - 103, '¡HAS SALVADO AL HADA!', {
                fontSize: '64px',
                fontFamily: 'Luckiest Guy',
                color: '#1a052e',
                stroke: '#1a052e',
                strokeThickness: 15
            }).setOrigin(0.5).setDepth(102);

            const textWin = this.add.text(W / 2, H / 2 - 100, '¡HAS SALVADO AL HADA!', {
                fontSize: '64px',
                fontFamily: 'Luckiest Guy',
                color: '#ffcc00',
                stroke: '#000000',
                strokeThickness: 12
            }).setOrigin(0.5).setDepth(103);

            // Crear degradado en el texto de victoria
            const gradient = textWin.context.createLinearGradient(0, 0, 0, 50);
            gradient.addColorStop(0, '#fff176');
            gradient.addColorStop(1, '#ff9800');
            textWin.setFill(gradient);

            // Mostrar el puntaje final obtenido
            const textScore = this.add.text(W / 2, H / 2 - 10, `PUNTOS TOTALES: ${this.puntaje}`, {
                fontSize: '38px',
                fontFamily: 'Bubblegum Sans',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5).setDepth(103);

            // Botón para jugar de nuevo
            const btnJugarDeNuevo = this.add.text(W / 2, H / 2 + 65, '🔄 JUGAR DE NUEVO', {
                fontSize: '28px',
                fontFamily: 'Luckiest Guy',
                color: '#ffffff',
                backgroundColor: '#2e1a4e',
                padding: { x: 25, y: 12 }
            }).setOrigin(0.5).setDepth(103).setInteractive({ cursor: 'pointer' });

            btnJugarDeNuevo.on('pointerover', () => {
                this.tweens.add({ targets: btnJugarDeNuevo, scale: 1.05, duration: 100 });
                btnJugarDeNuevo.setBackgroundColor('#40c0dd');
            });

            btnJugarDeNuevo.on('pointerout', () => {
                this.tweens.add({ targets: btnJugarDeNuevo, scale: 1, duration: 100 });
                btnJugarDeNuevo.setBackgroundColor('#2e1a4e');
            });

            btnJugarDeNuevo.on('pointerdown', () => {
                this.sound.play('pop');
                winParticles.destroy();
                this.sound.stopAll();
                this.scene.restart({ reintentarEscenario: 'scenery_bosque' });
            });

            // Botón para volver al menú principal
            const btnMenu = this.add.text(W / 2, H / 2 + 135, '☰ VOLVER AL MENÚ', {
                fontSize: '28px',
                fontFamily: 'Luckiest Guy',
                color: '#ffffff',
                backgroundColor: '#9c4eb3',
                padding: { x: 25, y: 12 }
            }).setOrigin(0.5).setDepth(103).setInteractive({ cursor: 'pointer' });

            this.sensorButtons = [];
            this.sensorButtons.push(
                {
                    absX: W / 2, absY: H / 2 + 65, w: 260, h: 60, callback: () => {
                        this.sound.play('pop');
                        winParticles.destroy();
                        this.sound.stopAll();
                        this.scene.restart({ reintentarEscenario: 'scenery_bosque' });
                    }
                },
                {
                    absX: W / 2, absY: H / 2 + 135, w: 260, h: 60, callback: () => {
                        this.sound.play('pop');
                        winParticles.destroy();
                        this._volverAlMenu();
                    }
                }
            );

            btnMenu.on('pointerover', () => {
                this.tweens.add({ targets: btnMenu, scale: 1.05, duration: 100 });
                btnMenu.setBackgroundColor('#40c0dd');
            });

            btnMenu.on('pointerout', () => {
                this.tweens.add({ targets: btnMenu, scale: 1, duration: 100 });
                btnMenu.setBackgroundColor('#9c4eb3');
            });

            btnMenu.on('pointerdown', () => {
                this.sound.play('pop');
                winParticles.destroy();
                this._volverAlMenu();
            });

            // Animación suave del texto de victoria
            this.tweens.add({
                targets: [textWin, textWinSombra],
                scale: 1.05,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.sound.play('victoria', { volume: 0.8 });
        };

        // Si el video termina solo, mostrar Victoria
        videoVictoria.on('complete', terminarVideoVictoria);

        // Si hacen clic en Saltar, mostrar Victoria
        skipText.on('pointerdown', () => {
            this.sound.play('pop');
            terminarVideoVictoria();
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
