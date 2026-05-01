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

        // 1. Jaula y Hada (Ocultos hasta empezar)
        this.jaula = this.add.image(W / 2, H / 2 + 50, 'jaula_hada').setScale(0.8).setDepth(5).setVisible(false);
        
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
                const sy = Phaser.Math.Between(0, H/2);
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

                if (esc.id === 'scenery_bosque') {
                    this.sound.play('sonido_bosque', { volume: 1 });
                }
            });

            hitArea.on('pointerout', () => {
                this.tweens.add({ targets: cardContainer, scale: 1, duration: 100, ease: 'Linear' });
                
                // Detener el sonido del bosque al salir
                if (esc.id === 'scenery_bosque') {
                    this.sound.stopByKey('sonido_bosque');
                }

                glow.clear();
                glow.lineStyle(8, esc.color, 0.3);
                glow.strokeRoundedRect(-210, -110, 420, 220, 15);
                glow.lineStyle(4, esc.color, 1);
                glow.strokeRoundedRect(-205, -105, 410, 210, 12);
            });

            hitArea.on('pointerdown', () => this._iniciarJuego(esc.id));
            cardContainer.add([glow, img, labelBg, txt]);
        });
    }

    _iniciarJuego(escenarioId) {
        this.menuContainer.destroy();
        this.estado = 'jugando';
        this.juegoActivo = true;

        const { width: W, height: H } = this.scale;

        // Fondo seleccionado
        this.add.image(W / 2, H / 2, escenarioId).setDisplaySize(W, H).setDepth(-1);

        // Mostrar elementos de juego
        this.jaula.setVisible(true);
        this.textoPuntaje.setVisible(true);
        this.barraEnergiaBg.setVisible(true);
        this.barraEnergia.setVisible(true);
        this.textoInstruccion.setVisible(true).setText('¡PREPÁRATE!');
        
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
        this.textoPuntaje = this.add.text(30, 30, 'PUNTOS: 0', {
            fontSize: '32px', fontFamily: 'Bangers', color: '#ffffff', stroke: '#000', strokeThickness: 4
        });

        this.barraEnergiaBg = this.add.rectangle(this.W - 220, 50, 200, 30, 0x000000).setOrigin(0, 0.5);
        this.barraEnergia = this.add.rectangle(this.W - 220, 50, 200, 30, 0x00ff00).setOrigin(0, 0.5);
        this.add.text(this.W - 220, 20, 'ENERGÍA DEL HADA', { fontSize: '18px', fontFamily: 'Bangers', color: '#ffffff' });

        this.textoInstruccion = this.add.text(this.W / 2, this.H - 80, '¡PREPÁRATE!', {
            fontSize: '40px', fontFamily: 'Luckiest Guy', color: '#ffffff', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);
    }

    _spawnEnemigo() {
        if (!this.juegoActivo) return;

        const tipos = [
            { key: 'lobo', pose: 'agachado', speed: 1.2 },
            { key: 'lobo', pose: 'manos-cielo', speed: 1.5 } // Usaré el lobo para ambos por ahora
        ];
        const tipo = Phaser.Utils.Array.GetRandom(tipos);

        // Aparecer desde los lados
        const side = Math.random() > 0.5 ? -100 : this.W + 100;
        const x = side;
        const y = this.H / 2 + 150; // A la altura del suelo

        const enemigo = this.add.sprite(x, y, tipo.key).setScale(0.4).setDepth(4);
        enemigo.poseRequerida = tipo.pose;
        enemigo.speed = tipo.speed;
        
        // Icono de pose sobre el enemigo
        const poseIcon = this.add.text(0, -100, CONFIG.poses[tipo.pose].emoji, { fontSize: '60px' }).setOrigin(0.5).setDepth(10);
        enemigo.icon = poseIcon;

        this.enemigos.add(enemigo);
    }

    update() {
        if (!this.juegoActivo) return;

        // Mover enemigos hacia la jaula
        this.enemigos.getChildren().forEach(enemigo => {
            const dx = this.W / 2 - enemigo.x;
            const dy = (this.H / 2 + 50) - enemigo.y;
            const angle = Math.atan2(dy, dx);

            enemigo.x += Math.cos(angle) * enemigo.speed;
            enemigo.y += Math.sin(angle) * enemigo.speed;
            
            enemigo.icon.x = enemigo.x;
            enemigo.icon.y = enemigo.y - 120;

            // Flip según dirección
            enemigo.setFlipX(dx < 0);

            // Colisión con la jaula
            const dist = Phaser.Math.Distance.Between(enemigo.x, enemigo.y, this.W / 2, this.H / 2 + 50);
            if (dist < 80) {
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
        this.barraEnergia.width = (this.energia / CONFIG.totalEnergia) * 200;
        
        this.cameras.main.shake(200, 0.02);
        this.jaula.setTint(0xff0000);
        this.time.delayedCall(200, () => this.jaula.clearTint());

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

    _gameOver() {
        this.juegoActivo = false;
        this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.7).setDepth(100);
        this.add.text(this.W / 2, this.H / 2 - 50, 'EL HADA SE QUEDÓ SIN ENERGÍA', {
            fontSize: '48px', color: '#ff0000', fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(101);
        
        const btn = this.add.text(this.W / 2, this.H / 2 + 50, 'REINTENTAR', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#9c4eb3', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(101).setInteractive({ cursor: 'pointer' });

        btn.on('pointerdown', () => this.scene.restart());
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
    }
}
