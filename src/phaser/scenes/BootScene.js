/**
 * BootScene — Primera escena que corre siempre.
 * Responsabilidad: precargar assets globales (imágenes, audio, spritesheets).
 * Cuando se añada un juego nuevo, sus assets se precargan aquí.
 */
import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.scale;

    // Imagenes juego Duro contra el Muro
    this.load.image('duro_muro_fondo', 'assets/images/duro-muro/fondo.jpg');
    this.load.image('duro_muro_textura', 'assets/images/duro-muro/muro.jpg');
    this.load.image('pose_estrella', 'assets/images/duro-muro/pose_estrella.png');
    this.load.image('pose_manos_cielo', 'assets/images/duro-muro/pose_manos_cielo.png');
    this.load.image('pose_cangrejo', 'assets/images/duro-muro/pose_cangrejo.png');
    this.load.image('pose_rayo', 'assets/images/duro-muro/pose_rayo.png');
    this.load.image('pose_biceps', 'assets/images/duro-muro/pose_biceps.png');

    // Pantalla de carga
    const loadingText = this.add.text(width / 2, height / 2, 'Cargando...', {
      fontSize: '32px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);


    // Sonidos
    this.load.audio('pop', 'assets/audio/pop.mp3');
    this.load.audio('tick', 'assets/audio/tick.mp3');
    this.load.audio('end', 'assets/audio/end.mp3');
    this.load.audio('victoria', 'assets/audio/victoria.mp3');
    this.load.audio('gol', 'assets/audio/sonidos futbol/gol.mp3');
    this.load.audio('arbitro', 'assets/audio/sonidos futbol/arbitro.mp3');
    for (let i = 1; i <= 14; i++) {
      this.load.audio(`soccer_music_${i}`, `assets/audio/sonidos futbol/cancion${i}.mp3`);
    }
    this.load.audio('champions', 'assets/audio/sonidos futbol/Champions.mp3');
    this.load.audio('europa', 'assets/audio/sonidos futbol/europa.mp3');
    this.load.image('keeper_neutral', 'assets/images/futbol/posicion1.png');
    this.load.image('keeper_side', 'assets/images/futbol/posicion iz.png');
    this.load.image('keeper_kids_neutral', 'assets/images/futbol/porteria1.png');
    this.load.image('keeper_kids_side', 'assets/images/futbol/posicion iz2.png');
    this.load.image('ball', 'assets/images/futbol/Balon.png');
    this.load.image('fans_bg', 'assets/images/futbol/hinchas.png');
    this.load.image('soccer_kids_bg', 'assets/images/futbol/hinchas2.png');
    this.load.image('soccer_adults_bg', 'assets/images/futbol/hinchas.png'); 
    this.load.image('soccer_menu_bg', 'assets/images/futbol/estadio.png');
    this.load.image('juvenil', 'assets/images/futbol/juvenil.png');
    this.load.image('profesional', 'assets/images/futbol/profesional.png');
    this.load.image('neon_stage', 'assets/images/neon_stage.png');

    // Juego Animales (Protege el Hada)
    this.load.image('scenery_bosque', 'assets/images/animales/bosque.png');
    this.load.image('scenery_desierto', 'assets/images/animales/desierto.png');
    this.load.image('scenery_hielo', 'assets/images/animales/hielo.png');
    this.load.image('scenery_pantano', 'assets/images/animales/pantano.png');
    this.load.image('jaula_hada', 'assets/images/animales/jaula_hada.png');
    this.load.image('hada', 'assets/images/animales/hada.png');
    
    // Animales del Bosque
    this.load.image('bosque_lobo', 'assets/images/animales/animales%20para%20el%20bosque/lobo.png');
    this.load.image('bosque_lobo2', 'assets/images/animales/animales%20para%20el%20bosque/lobo%202.png');
    this.load.image('bosque_lobo3', 'assets/images/animales/animales%20para%20el%20bosque/lobo%203.png');
    this.load.image('bosque_oso', 'assets/images/animales/animales%20para%20el%20bosque/oso.png');
    this.load.image('bosque_oso2', 'assets/images/animales/animales%20para%20el%20bosque/oso%202.png');
    this.load.image('bosque_oso3', 'assets/images/animales/animales%20para%20el%20bosque/oso%203.png');
    this.load.image('bosque_serpiente', 'assets/images/animales/animales%20para%20el%20bosque/serpiente.png');
    this.load.image('bosque_cuervo', 'assets/images/animales/animales%20para%20el%20bosque/cuervo.png');
    this.load.image('bosque_aguila', 'assets/images/animales/animales%20para%20el%20bosque/aguila.png');
    this.load.image('bosque_buho', 'assets/images/animales/animales%20para%20el%20bosque/buho.png');
    this.load.image('bosque_cazador', 'assets/images/animales/animales%20para%20el%20bosque/cazador.webp');

    // Animales del Desierto
    this.load.image('desierto_araña', 'assets/images/animales/animales%20para%20el%20desierto/ara%C3%B1a.png');
    this.load.image('desierto_ave', 'assets/images/animales/animales%20para%20el%20desierto/ave.png');
    this.load.image('desierto_buho', 'assets/images/animales/animales%20para%20el%20desierto/buho.png');
    this.load.image('desierto_camello', 'assets/images/animales/animales%20para%20el%20desierto/camello.png');
    this.load.image('desierto_canguro', 'assets/images/animales/animales%20para%20el%20desierto/canguro.png');
    this.load.image('desierto_cobra', 'assets/images/animales/animales%20para%20el%20desierto/cobra.png');
    this.load.image('desierto_cobra2', 'assets/images/animales/animales%20para%20el%20desierto/cobra2.png');
    this.load.image('desierto_cobra3', 'assets/images/animales/animales%20para%20el%20desierto/cobra3.png');
    this.load.image('desierto_cobra4', 'assets/images/animales/animales%20para%20el%20desierto/cobra4.png');
    this.load.image('desierto_coyote', 'assets/images/animales/animales%20para%20el%20desierto/coyote.png');
    this.load.image('desierto_escorpion', 'assets/images/animales/animales%20para%20el%20desierto/escorpion.png');

    // Animales del Hielo
    this.load.image('hielo_buho', 'assets/images/animales/animales%20para%20el%20hielo/buho.png');
    this.load.image('hielo_foca', 'assets/images/animales/animales%20para%20el%20hielo/foca.png');
    this.load.image('hielo_leopardo', 'assets/images/animales/animales%20para%20el%20hielo/leopardo.png');
    this.load.image('hielo_lobo', 'assets/images/animales/animales%20para%20el%20hielo/lobo.png');
    this.load.image('hielo_mamut', 'assets/images/animales/animales%20para%20el%20hielo/m.png');
    this.load.image('hielo_morsa', 'assets/images/animales/animales%20para%20el%20hielo/morsa.png');
    this.load.image('hielo_oso', 'assets/images/animales/animales%20para%20el%20hielo/oso.png');
    this.load.image('hielo_pinguino', 'assets/images/animales/animales%20para%20el%20hielo/pinguino.png');
    this.load.image('hielo_reno', 'assets/images/animales/animales%20para%20el%20hielo/reno.png');
    this.load.image('hielo_zorro', 'assets/images/animales/animales%20para%20el%20hielo/zorro.png');

    // Animales del Pantano
    this.load.image('pantano_capibara', 'assets/images/animales/animales%20para%20el%20pantano/capibara.png');
    this.load.image('pantano_cisne', 'assets/images/animales/animales%20para%20el%20pantano/cisne.png');
    this.load.image('pantano_cocodrilo', 'assets/images/animales/animales%20para%20el%20pantano/cocodrilo.png');
    this.load.image('pantano_garza', 'assets/images/animales/animales%20para%20el%20pantano/garza.png');
    this.load.image('pantano_hipopotamo', 'assets/images/animales/animales%20para%20el%20pantano/hipopotamo.png');
    this.load.image('pantano_murcielago', 'assets/images/animales/animales%20para%20el%20pantano/murcielago.png');
    this.load.image('pantano_nutria', 'assets/images/animales/animales%20para%20el%20pantano/nutria.png');
    this.load.image('pantano_pato_volando', 'assets/images/animales/animales%20para%20el%20pantano/pato%20volando.png');
    this.load.image('pantano_pato', 'assets/images/animales/animales%20para%20el%20pantano/pato.png');
    this.load.image('pantano_sapo', 'assets/images/animales/animales%20para%20el%20pantano/sapo.jpg');
    this.load.image('pantano_sapo2', 'assets/images/animales/animales%20para%20el%20pantano/sapo2.png');
    this.load.image('pantano_sapo3', 'assets/images/animales/animales%20para%20el%20pantano/sapo3.png');
    this.load.image('pantano_sapo4', 'assets/images/animales/animales%20para%20el%20pantano/sapo4.png');
    this.load.image('pantano_sapo5', 'assets/images/animales/animales%20para%20el%20pantano/sapo5.png');
    this.load.image('pantano_tortuga', 'assets/images/animales/animales%20para%20el%20pantano/tortuga.png');

    this.load.audio('sonido_bosque', 'assets/audio/sonidos%20de%20animales/bosque.mp3');
    this.load.audio('sonido_desierto', 'assets/audio/sonidos%20de%20animales/desierto.mp3');
    this.load.audio('sonido_hielo', 'assets/audio/sonidos%20de%20animales/hielo.mp3');
    this.load.audio('sonido_pantano', 'assets/audio/sonidos%20de%20animales/pantano.mp3');
  }

  create() {
    // Leer la escena inicial definida desde React
    const escenaInicial = this.registry.get('escenaInicial') || 'SoccerScene';

    this.scene.start(escenaInicial);
  }
}