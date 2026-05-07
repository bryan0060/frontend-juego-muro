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
        
        // Sistema de hold
        this.holdBtn = null;
        this.holdGraphics = this.add.graphics().setDepth(10000);

        // 1. Jaula y Hada (Más abajo, en el suelo)
        // Forzamos el fallback por ahora si el usuario no tiene el archivo
        const jaulaKey = this.textures.exists('jaula_hada') && this.textures.get('jaula_hada').key !== '__MISSING' ? 'jaula_hada' : 'jaula_fallback';
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
        this.textoPuntaje.setVisible(false);
        this.barraEnergiaBg.setVisible(false);
        this.barraEnergia.setVisible(false);
        this.textoInstruccion.setVisible(false);

        // 6. Mostrar Menú
        this._mostrarMenuEscenarios();
    }

    _mostrarMenuEscenarios() {
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
            const maskShape = this.add.graphics().fillRoundedRect(-200, -105, 400, 170, 12);
            img.setMask(maskShape.createGeometryMask());

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
            cardContainer.add([glow, img, labelBg, txt]);
        });
    }

    _iniciarJuego(escenarioId) {
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
        this.textoPuntaje.setVisible(true);
        this.barraEnergiaBg.setVisible(true);
        this.barraEnergia.setVisible(true);
        this.textoInstruccion.setVisible(true).setText('¡PREPÁRATE!');
        this.btnMenu.setVisible(true);

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
        // Puntaje
        this.textoPuntaje = this.add.text(30, 30, 'PUNTOS: 0', {
            fontSize: '32px', fontFamily: 'Bangers', color: '#ffffff', stroke: '#000', strokeThickness: 4
        });

        // Barra de energía mejorada
        const energyX = this.W - 240;
        const energyY = 55;
        // Sombra y fondo de la barra
        this.add.rectangle(energyX + 1, energyY + 1, 210, 28, 0x000000, 0.6).setOrigin(0, 0.5);
        this.barraEnergiaBg = this.add.rectangle(energyX, energyY, 210, 28, 0x1a0a2e).setOrigin(0, 0.5);
        // Borde de la barra
        const barBorder = this.add.graphics();
        barBorder.lineStyle(2, 0xa855f7, 1);
        barBorder.strokeRoundedRect(energyX - 1, energyY - 15, 212, 30, 6);
        // Barra de energía con color vibrante
        this.barraEnergia = this.add.rectangle(energyX, energyY, 210, 28, 0x00ff88).setOrigin(0, 0.5);
        // Icono + label
        this.add.text(energyX, energyY - 28, '✨ ENERGÍA DEL HADA', {
            fontSize: '15px', fontFamily: 'Bangers', color: '#e0aaff', stroke: '#000', strokeThickness: 3
        });

        // Texto de instrucción - centro superior (más abajo)
        this.textoInstruccion = this.add.text(this.W / 2, 130, '¡PREPÁRATE!', {
            fontSize: '40px', fontFamily: 'Luckiest Guy', color: '#ffffff', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);
    }

    _spawnEnemigo() {
        if (!this.juegoActivo) return;

        const pools = {
            'scenery_bosque': [
                { key: 'bosque_lobo', pose: 'agachado', speed: 1.2, origin: 'side', scale: 0.45 },
                { key: 'bosque_lobo2', pose: 'agachado', speed: 1.3, origin: 'side', scale: 0.45 },
                { key: 'bosque_lobo3', pose: 'agachado', speed: 1.4, origin: 'side', scale: 0.45 },
                { key: 'bosque_oso', pose: 'manos-cielo', speed: 0.8, origin: 'side', scale: 0.65, reverse: true },
                { key: 'bosque_oso2', pose: 'manos-cielo', speed: 0.9, origin: 'side', scale: 0.65, reverse: true },
                { key: 'bosque_oso3', pose: 'manos-cielo', speed: 0.7, origin: 'side', scale: 0.65, reverse: true },
                { key: 'bosque_serpiente', pose: 'agachado', speed: 1.8, origin: 'side', scale: 0.45, reverse: true },
                { key: 'bosque_cuervo', pose: 'manos-cielo', speed: 1.4, origin: 'sky', scale: 0.08 },
                { key: 'bosque_aguila', pose: 'estrella', speed: 1.6, origin: 'sky', scale: 0.35, reverse: true },
                { key: 'bosque_buho', pose: 'estrella', speed: 1.2, origin: 'sky', scale: 0.35, reverse: true },
                { key: 'bosque_cazador', pose: 'estrella', speed: 1.0, origin: 'side', scale: 0.2, reverse: true }
            ],
            'scenery_desierto': [
                { key: 'desierto_araña', pose: 'agachado', speed: 1.5, origin: 'side', scale: 0.45, reverse: true },
                { key: 'desierto_ave', pose: 'estrella', speed: 1.8, origin: 'sky', scale: 0.4, reverse: true },
                { key: 'desierto_buho', pose: 'estrella', speed: 1.4, origin: 'sky', scale: 0.45, reverse: true },
                { key: 'desierto_camello', pose: 'manos-cielo', speed: 0.9, origin: 'side', scale: 0.8, reverse: true },
                { key: 'desierto_canguro', pose: 'manos-cielo', speed: 1.3, origin: 'side', scale: 0.5, reverse: true },
                { key: 'desierto_cobra', pose: 'agachado', speed: 1.6, origin: 'side', scale: 0.55, reverse: true },
                { key: 'desierto_cobra2', pose: 'agachado', speed: 1.7, origin: 'side', scale: 0.55, reverse: true },
                { key: 'desierto_cobra3', pose: 'agachado', speed: 1.6, origin: 'side', scale: 0.55, reverse: true },
                { key: 'desierto_cobra4', pose: 'agachado', speed: 1.5, origin: 'side', scale: 0.55, reverse: true },
                { key: 'desierto_coyote', pose: 'agachado', speed: 1.8, origin: 'side', scale: 0.3, reverse: true },
                { key: 'desierto_escorpion', pose: 'agachado', speed: 2.0, origin: 'side', scale: 0.15, reverse: true }
            ],
            'scenery_hielo': [
                { key: 'hielo_buho', pose: 'estrella', speed: 1.4, origin: 'sky', scale: 0.45, reverse: true },
                { key: 'hielo_foca', pose: 'agachado', speed: 1.0, origin: 'side', scale: 0.55, reverse: true },
                { key: 'hielo_leopardo', pose: 'agachado', speed: 1.6, origin: 'side', scale: 0.5, reverse: true },
                { key: 'hielo_lobo', pose: 'agachado', speed: 1.5, origin: 'side', scale: 0.5, reverse: true },
                { key: 'hielo_mamut', pose: 'manos-cielo', speed: 0.7, origin: 'side', scale: 0.65, reverse: true },
                { key: 'hielo_morsa', pose: 'manos-cielo', speed: 0.8, origin: 'side', scale: 0.6, reverse: true },
                { key: 'hielo_oso', pose: 'manos-cielo', speed: 0.9, origin: 'side', scale: 0.5, reverse: true },
                { key: 'hielo_pinguino', pose: 'agachado', speed: 1.2, origin: 'side', scale: 0.4 },
                { key: 'hielo_reno', pose: 'manos-cielo', speed: 1.1, origin: 'side', scale: 0.5 },
                { key: 'hielo_zorro', pose: 'agachado', speed: 1.4, origin: 'side', scale: 0.35, reverse: true }
            ],
            'scenery_pantano': [
                { key: 'pantano_capibara', pose: 'agachado', speed: 1.1, origin: 'side', scale: 0.45, reverse: true },
                { key: 'pantano_cisne', pose: 'manos-cielo', speed: 1.2, origin: 'side', scale: 0.5, reverse: true },
                { key: 'pantano_cocodrilo', pose: 'agachado', speed: 1.4, origin: 'side', scale: 0.6, reverse: true },
                { key: 'pantano_garza', pose: 'estrella', speed: 1.5, origin: 'sky', scale: 0.45, reverse: true },
                { key: 'pantano_hipopotamo', pose: 'manos-cielo', speed: 0.8, origin: 'side', scale: 0.65, reverse: true },
                { key: 'pantano_murcielago', pose: 'estrella', speed: 1.8, origin: 'sky', scale: 0.4, reverse: true },
                { key: 'pantano_nutria', pose: 'agachado', speed: 1.3, origin: 'side', scale: 0.45, reverse: true },
                { key: 'pantano_pato_volando', pose: 'estrella', speed: 1.6, origin: 'sky', scale: 0.4, reverse: true },
                { key: 'pantano_pato', pose: 'agachado', speed: 1.2, origin: 'side', scale: 0.3, reverse: true },
                { key: 'pantano_sapo', pose: 'agachado', speed: 1.8, origin: 'side', scale: 0.25, reverse: true },
                { key: 'pantano_sapo2', pose: 'agachado', speed: 1.7, origin: 'side', scale: 0.25, reverse: true },
                { key: 'pantano_sapo3', pose: 'agachado', speed: 1.9, origin: 'side', scale: 0.25, reverse: true },
                { key: 'pantano_sapo4', pose: 'agachado', speed: 1.6, origin: 'side', scale: 0.25, reverse: true },
                { key: 'pantano_sapo5', pose: 'agachado', speed: 2.0, origin: 'side', scale: 0.25, reverse: true },
                { key: 'pantano_tortuga', pose: 'agachado', speed: 0.9, origin: 'side', scale: 0.35, reverse: true }
            ]
        };

        const pool = pools[this.escenarioActual] || pools['scenery_bosque'];
        const tipo = Phaser.Utils.Array.GetRandom(pool);

        let x, y;
        const horizonY = this.H / 2 + 50;

        if (tipo.origin === 'sky') {
            const desdeIzquierda = Math.random() > 0.5;
            x = desdeIzquierda ? -300 : this.W + 300;
            y = Phaser.Math.Between(-150, 0); // Vienen desde más arriba
        } else {
            const desdeIzquierda = Math.random() > 0.5;
            x = desdeIzquierda ? -300 : this.W + 300;
            y = horizonY + Phaser.Math.Between(-30, 30);
        }

        const enemigo = this.add.sprite(x, y, tipo.key).setScale(0.01).setDepth(4);
        enemigo.poseRequerida = tipo.pose;
        enemigo.baseScale = tipo.scale;
        enemigo.speed = tipo.speed;
        enemigo.originType = tipo.origin;
        // Los voladores atacan la parte superior de la jaula, los terrestres la base
        enemigo.targetY = (tipo.origin === 'sky') ? this.H - 280 : this.H - 120;
        enemigo.spawnY = y;
        enemigo.spawnX = x;

        // Lógica de orientación individualizada
        const haciaDerecha = x < this.W / 2;
        const flip = tipo.reverse ? haciaDerecha : !haciaDerecha;
        enemigo.setFlipX(flip);

        // Icono de pose sobre el enemigo
        const poseIcon = this.add.text(0, -100, CONFIG.poses[tipo.pose].emoji, { fontSize: '60px' }).setOrigin(0.5).setDepth(10);
        enemigo.icon = poseIcon;

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
            this.holdGraphics.arc(this.holdBtn.x, this.holdBtn.y, 70, -Math.PI/2, -Math.PI/2 + (Math.PI*2*progress));
            this.holdGraphics.strokePath();
            if (progress >= 1) {
                const cb = this.holdBtn.callback;
                this._cancelHold();
                cb();
            }
        }

        if (!this.juegoActivo) return;

        // Mover enemigos hacia la jaula
        this.enemigos.getChildren().forEach(enemigo => {
            const dx = this.W / 2 - enemigo.x;
            const dy = (enemigo.targetY || (this.H - 120)) - enemigo.y;
            const angle = Math.atan2(dy, dx);

            enemigo.x += Math.cos(angle) * enemigo.speed;
            enemigo.y += Math.sin(angle) * enemigo.speed;

            // Perspectiva: crecen a medida que se acercan (progresión hacia el centro)
            const distActual = Phaser.Math.Distance.Between(enemigo.x, enemigo.y, this.W / 2, enemigo.targetY);
            const distTotal = Phaser.Math.Distance.Between(enemigo.spawnX || 0, enemigo.spawnY || 0, this.W / 2, enemigo.targetY);
            const progreso = Phaser.Math.Clamp(1 - (distActual / distTotal), 0, 1);

            const currentScale = Phaser.Math.Linear(0.01, enemigo.baseScale || 0.1, progreso);
            enemigo.setScale(currentScale);

            // Efecto de caminata (bobbing) ajustado a la escala
            if (enemigo.originType !== 'sky') {
                const hop = Math.abs(Math.sin(this.time.now / 150)) * (8 * progreso);
                enemigo.displayOriginY = enemigo.height / 2 + hop;
            }

            enemigo.icon.x = enemigo.x;
            enemigo.icon.y = enemigo.y - (enemigo.displayHeight / 2 + 60 * currentScale);
            enemigo.icon.setScale(currentScale + 0.5);

            // Colisión con la jaula (ajustado al nuevo centro)
            const dist = Phaser.Math.Distance.Between(enemigo.x, enemigo.y, this.W / 2, this.H - 120);
            if (dist < 130) {
                this._danoJaula();
                this._eliminarEnemigo(enemigo);
            }

            // Detección de pose
            if (this.esqueletoActual) {
                if (this._checkPose(enemigo.poseRequerida)) {
                    // Si el enemigo está "cerca" (en rango de visión/ataque) y hacemos la pose
                    if (Math.abs(enemigo.x - this.W / 2) < 400) {
                        this._eliminarEnemigo(enemigo, true);
                    }
                }
            }
        });
    }

    _checkPose(poseId) {
        if (!this.esqueletoActual) return false;
        const sk = this.esqueletoActual;

        if (poseId === 'manos-cielo') {
            return sk.muneca_izquierda?.y < 0.3 && sk.muneca_derecha?.y < 0.3;
        }
        if (poseId === 'agachado') {
            return sk.nariz?.y > 0.6;
        }
        if (poseId === 'estrella') {
            return sk.muneca_izquierda?.x < 0.2 && sk.muneca_derecha?.x > 0.8;
        }
        return false;
    }

    _eliminarEnemigo(enemigo, porPose = false) {
        if (porPose) {
            this.puntaje += 100;
            this.textoPuntaje.setText(`PUNTOS: ${this.puntaje}`);
            this.particles.setPosition(enemigo.x, enemigo.y);
            this.particles.explode(20);
            this.sound.play('pop');
        }
        enemigo.icon.destroy();
        enemigo.destroy();
    }

    _danoJaula() {
        this.energia -= 10;
        const pct = this.energia / CONFIG.totalEnergia;
        this.barraEnergia.width = pct * 210;
        // Color dinámico: verde → amarillo → rojo
        const color = pct > 0.6 ? 0x00ff88 : pct > 0.3 ? 0xffcc00 : 0xff3344;
        this.barraEnergia.setFillStyle(color);

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
        if (data.port !== 8080) return;
        if (data.jugador_detectado && data.poses?.esqueleto) {
            this.esqueletoActual = data.poses.esqueleto;
            this._updateInstruccion();
        } else {
            this.esqueletoActual = null;
        }
    }

    _updateInstruccion() {
        let poseDetectada = "NINGUNA";
        if (this._checkPose('manos-cielo')) poseDetectada = "¡MANOS ARRIBA! 🙌";
        else if (this._checkPose('agachado')) poseDetectada = "¡AGACHADO! 🧘";
        else if (this._checkPose('estrella')) poseDetectada = "¡ESTRELLA! ⭐";

        this.textoInstruccion.setText(poseDetectada);
    }

    _volverAlMenu() {
        this.juegoActivo = false;
        this.sound.stopAll();
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.enemigos.getChildren().forEach(e => {
            if (e.icon) e.icon.destroy();
            e.destroy();
        });
        this.scene.restart();
    }

    returnToMenu() {
        if (this.estado === 'seleccion') {
            return false; // Ya estamos en el menú de escenarios, salir al menú principal de React
        }
        
        // Si estamos jugando o en game over, volver al menú de escenarios (biomas)
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
        btn.on('pointerdown', (ptr) => {
            this.holdBtn = {
                x: ptr.x, y: ptr.y, duration: 2000, time: 0,
                callback: () => this.scene.restart()
            };
        });
        btn.on('pointerup', () => this._cancelHold());

        const btnMenuGO = this.add.text(this.W / 2, this.H / 2 + 90, '☰ VOLVER AL MENÚ', {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#2e1a4e', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(101).setInteractive({ cursor: 'pointer' });
        btnMenuGO.on('pointerdown', (ptr) => {
            this.holdBtn = {
                x: ptr.x, y: ptr.y, duration: 2000, time: 0,
                callback: () => this._volverAlMenu()
            };
        });
        btnMenuGO.on('pointerup', () => this._cancelHold());

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
