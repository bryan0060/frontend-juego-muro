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

    // ==================================================
    // PANTALLA DE CARGA PERSONALIZADA "PARKE TR3S"
    // ==================================================
    
    // 1. Cargar el fondo inmediatamente y dibujarlo al completarse
    this.load.image('carga_bg', 'assets/images/carga.png');
    this.load.once('filecomplete-image-carga_bg', () => {
      this.bgImage = this.add.image(width / 2, height / 2, 'carga_bg');
      const scaleX = width / this.bgImage.width;
      const scaleY = height / this.bgImage.height;
      const scale = Math.max(scaleX, scaleY);
      this.bgImage.setScale(scale);
      this.bgImage.setDepth(-1);
    });

    // 2. Crear cabezal brillante con forma de estrella amarilla neón (Canvas Sprite)
    const starCanvas = this.textures.createCanvas('star_handle', 44, 44);
    const sCtx = starCanvas.getContext();
    
    // Sombra para dar efecto premium de elevación
    sCtx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    sCtx.shadowBlur = 6;
    sCtx.shadowOffsetX = 0;
    sCtx.shadowOffsetY = 3;

    // Círculo blanco con borde amarillo grueso
    sCtx.fillStyle = '#ffffff';
    sCtx.strokeStyle = '#f9b800';
    sCtx.lineWidth = 4;
    sCtx.beginPath();
    sCtx.arc(22, 22, 16, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.stroke();
    
    // Desactivar sombra para que la estrella interna quede limpia
    sCtx.shadowColor = 'transparent';
    sCtx.shadowBlur = 0;
    sCtx.shadowOffsetX = 0;
    sCtx.shadowOffsetY = 0;

    // Estrella amarilla en el centro
    sCtx.fillStyle = '#f9b800';
    sCtx.beginPath();
    let rot = Math.PI / 2 * 3;
    let spikes = 5;
    let outerRadius = 9;
    let innerRadius = 4.5;
    let step = Math.PI / spikes;
    sCtx.moveTo(22, 22 - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let sx = 22 + Math.cos(rot) * outerRadius;
      let sy = 22 + Math.sin(rot) * outerRadius;
      sCtx.lineTo(sx, sy);
      rot += step;
      
      sx = 22 + Math.cos(rot) * innerRadius;
      sy = 22 + Math.sin(rot) * innerRadius;
      sCtx.lineTo(sx, sy);
      rot += step;
    }
    sCtx.closePath();
    sCtx.fill();
    starCanvas.refresh();

    // 3. Textos y Tipografías Estilizadas
    this.loadingTitle = this.add.text(width / 2, height * 0.73, 'PREPARANDO LA EXPERIENCIA', {
      fontSize: '22px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#8d39a3',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    this.percentText = this.add.text(width / 2, height * 0.78, '0%', {
      fontSize: '32px', // Tamaño amigable y no gigante ni invasivo
      fontFamily: 'Fredoka, sans-serif',
      color: '#1ab29e',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    this.assetText = this.add.text(width / 2, height * 0.88, 'Cargando imágenes mágicas... ✨', {
      fontSize: '16px',
      fontFamily: 'Fredoka, sans-serif',
      color: '#7c2e9b',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    // 4. Barra de Progreso a Medida
    this.barWidth = Math.min(width * 0.7, 500); // Proporcional al ancho de la pantalla y no invasivo
    this.barHeight = 20; // Altura estilizada
    this.barX = width / 2 - this.barWidth / 2;
    this.barY = height * 0.83 - this.barHeight / 2; // Posicionado más abajo para no tapar el logo de la pantalla de carga

    // Fondo de barra sólido color lila/gris pastel suave
    this.progressBg = this.add.graphics();
    this.progressBg.fillStyle(0xeae6f3, 1);
    this.progressBg.fillRoundedRect(this.barX, this.barY, this.barWidth, this.barHeight, 10);

    this.progressBar = this.add.graphics();

    // Estrella de progreso
    this.glowHead = this.add.image(this.barX, this.barY + this.barHeight / 2, 'star_handle');
    this.glowHead.setOrigin(0.5);
    this.glowHead.setVisible(false);

    // Frases mágicas y divertidas para la pantalla de carga
    const loadingPhrases = [
      "Cargando imágenes mágicas... ✨",
      "Invocando risas y diversión... 🎈",
      "Coloreando las estrellas del parque... 🌟",
      "Afinando los motores de la alegría... 🚀",
      "Preparando sorpresas increíbles... 🎁",
      "Desplegando toboganes invisibles... 🛝",
      "Reuniendo a los duendes del juego... 🧚",
      "Encendiendo las luces de la diversión... 💡",
      "Dibujando sonrisas digitales... 😊",
      "Buscando los tesoros escondidos... 💎",
      "Mezclando pociones de pura felicidad... 🧪",
      "Ajustando los trampolines virtuales... 🤸",
      "Llenando el parque de magia y color... 🎨",
      "Sembrando semillas de fantasía... 🌱"
    ];

    this.lastPhraseUpdate = 0;
    this.currentPhraseIndex = 0;

    // 5. Suscribirse a los Eventos de Carga
    this.load.on('progress', (value) => {
      this.percentText.setText(Math.round(value * 100) + '%');
      
      this.progressBar.clear();
      if (value > 0) {
        this.progressBar.fillStyle(0x1cbca3, 1); // Turquesa sólido del mockup
        const currentBarWidth = Math.max(20, this.barWidth * value);
        this.progressBar.fillRoundedRect(this.barX, this.barY, currentBarWidth, this.barHeight, 10);
        
        // Mover la estrella
        this.glowHead.x = this.barX + currentBarWidth;
        this.glowHead.setVisible(true);
      } else {
        this.glowHead.setVisible(false);
      }
    });

    this.load.on('fileprogress', (file) => {
      const now = Date.now();
      // Solo actualizar la frase divertida cada 1200ms para evitar parpadeos molestos
      if (!this.lastPhraseUpdate || now - this.lastPhraseUpdate > 1200) {
        this.lastPhraseUpdate = now;
        const nextPhrase = loadingPhrases[this.currentPhraseIndex];
        this.assetText.setText(nextPhrase);
        this.currentPhraseIndex = (this.currentPhraseIndex + 1) % loadingPhrases.length;
      }
    });

    // Just Dance
    this.load.json('evals_asereje', 'assets/jsons/asereje_poses.json');
    this.load.json('evals_dale_pa_ve', 'assets/jsons/dalepave_poses.json');
    this.load.json('evals_yamal', 'assets/jsons/lamine_poses.json');
    this.load.json('evals_taza', 'assets/jsons/taza_poses.json');
    this.load.json('evals_macarena', 'assets/jsons/macarena_poses.json');
    this.load.json('evals_cuerpo',       'assets/jsons/cuerpo_poses.json');
    this.load.json('evals_la_bomba',    'assets/jsons/bomba_poses.json');

    this.load.audio('jd_menu_music', 'assets/audio/sonidos-just-dance/fondo-musica-dance.mp3');

    this.load.video('just_dance_asereje', 'assets/images/just-dance/asereje.mp4');
    this.load.video('just_dance_bomba', 'assets/images/just-dance/bomba.mp4');
    this.load.video('just_dance_lamine', 'assets/images/just-dance/lamine.mp4');
    this.load.video('just_dance_dalepave', 'assets/images/just-dance/dalepave.mp4');
    this.load.video('just_dance_taza', 'assets/images/just-dance/taza.mp4');
    this.load.video('just_dance_cuerpo', 'assets/images/just-dance/cuerpo.mp4');
    this.load.video('just_dance_macarena', 'assets/images/just-dance/macarena.mp4');


    this.load.image('just_dance_bg_grandes', 'assets/images/just-dance/just_dance_bg_grandes.jpeg');
    this.load.image('just_dance_bg_ninos', 'assets/images/just-dance/just_dance_bg_ninos.jpeg');

    // Imagenes juego Duro contra el Muro
    this.load.image('duro_muro_fondo', 'assets/images/duro-muro/fondo.jpg');
    this.load.image('duro_muro_textura', 'assets/images/duro-muro/muro.jpg');
    this.load.image('pose_estrella', 'assets/images/duro-muro/pose_estrella.png');
    this.load.image('pose_manos_cielo', 'assets/images/duro-muro/pose_manos_cielo.png');
    this.load.image('pose_cangrejo', 'assets/images/duro-muro/pose_cangrejo.png');
    this.load.image('pose_rayo', 'assets/images/duro-muro/pose_rayo.png');
    this.load.image('pose_biceps', 'assets/images/duro-muro/pose_biceps.png');
    this.load.image('pose_egipcia', 'assets/images/duro-muro/pose_egipcia.png');
    this.load.image('pose_bicep2', 'assets/images/duro-muro/pose_bicep2.png');
    this.load.image('pose_equilibrio', 'assets/images/duro-muro/pose_equilibrio.png');

    //POSES PARA DUO
    this.load.image('pose_duo_fusion', 'assets/images/duro-muro/pose_duo_fusion.png');
    this.load.image('pose_duo_brazo', 'assets/images/duro-muro/pose_duo_brazo.png');
    this.load.image('pose_duo_fusion', 'assets/images/duro-muro/pose_duo_fusion.png');
    this.load.image('pose_duo_brazo', 'assets/images/duro-muro/pose_duo_brazo.png');
    this.load.image('pose_duo_superheroes1', 'assets/images/duro-muro/pose_duo_superheroes1.png');
    this.load.image('pose_duo_superheroes2', 'assets/images/duro-muro/pose_duo_superheroes2.png');
    this.load.image('pose_duo_disco', 'assets/images/duro-muro/pose_duo_disco.png');
    this.load.image('pose_duo_dinos', 'assets/images/duro-muro/pose_duo_dinos.png');
    this.load.image('pose_duo_corazon', 'assets/images/duro-muro/pose_duo_corazon.png');
    this.load.image('pose_duo_cubiertos', 'assets/images/duro-muro/pose_duo_cubiertos.png');





    //Sonidos duro muro
    this.load.audio('dm_quieto', 'assets/audio/sonidos-duro-muro/Quieto.mp3');
    this.load.audio('dm_eres_mejor', 'assets/audio/sonidos-duro-muro/Eres_el_mejor.mp3');
    this.load.audio('dm_vas_excelente', 'assets/audio/sonidos-duro-muro/Vas_excelente.mp3');
    this.load.audio('dm_casi', 'assets/audio/sonidos-duro-muro/Casi_perfecto.mp3');
    this.load.audio('dm_poquitin', 'assets/audio/sonidos-duro-muro/Poquititin_mas.mp3');
    this.load.audio('dm_muevete', 'assets/audio/sonidos-duro-muro/Muevete_poco.mp3');
    this.load.audio('dm_no_perder', 'assets/audio/sonidos-duro-muro/No_perder.mp3');
    for (let i = 1; i <= 8; i++) {
      this.load.audio(`duro_muro_music_${i}`, `assets/audio/sonidos-duro-muro/duro_muro_music_${i}.mp3`);
    }

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
    this.load.image('keeper_corner', 'assets/images/futbol/atajada 4.png');
    this.load.image('keeper_top_corner', 'assets/images/futbol/atajada 3.png');
    this.load.image('keeper_top_center', 'assets/images/futbol/atajada6.png');
    this.load.image('keeper_high', 'assets/images/futbol/atajada2.png');
    this.load.image('keeper_low', 'assets/images/futbol/atajada5.png');
    this.load.image('keeper_kids_neutral', 'assets/images/futbol/porteria1.png');
    this.load.image('keeper_kids_side', 'assets/images/futbol/posicion iz2.png');
    this.load.image('keeper_kids_corner', 'assets/images/futbol/atajada4-2.png');
    this.load.image('keeper_kids_top_center', 'assets/images/futbol/atajada6-2.png');
    this.load.image('keeper_kids_high', 'assets/images/futbol/atajada2-2.png');
    this.load.image('keeper_kids_low', 'assets/images/futbol/atajada5-2.png');
    this.load.image('ball', 'assets/images/futbol/Balon.png');
    this.load.image('fans_bg', 'assets/images/futbol/hinchas.png');
    this.load.image('soccer_kids_bg', 'assets/images/futbol/hinchas2.png');
    this.load.image('soccer_adults_bg', 'assets/images/futbol/hinchas.png');
    this.load.image('soccer_menu_bg', 'assets/images/futbol/estadio.png');
    this.load.image('juvenil', 'assets/images/futbol/juvenil.png');
    this.load.image('profesional', 'assets/images/futbol/profesional.png');
    this.load.image('neon_stage', 'assets/images/neon_stage.png');
    this.load.audio('publico_decepcionado', 'assets/audio/sonidos futbol/publico-decepcionado.mp3');
    this.load.audio('error_fail', 'assets/audio/sonidos futbol/sonido-error-fail.mp3');

    // Imágenes Pizarra Mágica (Bocetos)
    this.load.image('plantilla', 'assets/images/PizarraMagica/plantilla.png');
    this.load.image('boceto_arcoiris', 'assets/images/PizarraMagica/arcoiris.png');
    this.load.image('boceto_carro', 'assets/images/PizarraMagica/Carro.png');
    this.load.image('boceto_castillo', 'assets/images/PizarraMagica/castillo.png');
    this.load.image('boceto_oso', 'assets/images/PizarraMagica/Oso (2).png');
    this.load.image('boceto_parke', 'assets/images/PizarraMagica/ParkeTr3s.png');
    this.load.image('boceto_sol', 'assets/images/PizarraMagica/sol.png');
    this.load.image('cohete', 'assets/images/PizarraMagica/Cohete.png');

    // Juego Animales (Protege el Hada)
    this.load.image('scenery_bosque', 'assets/images/animales/bosque.png');
    this.load.image('scenery_desierto', 'assets/images/animales/desierto.png');
    this.load.image('scenery_hielo', 'assets/images/animales/hielo.png');
    this.load.image('scenery_pantano', 'assets/images/animales/pantano.png');
    this.load.image('hada', 'assets/images/animales/hada.png');
    this.load.image('red', 'assets/images/animales/red.png');
    // Nota: jaula_hada.png no existe en assets — AnimalesScene genera un fallback programático
    this.load.video('presentacion', 'assets/images/animales/videos/presentacion.mp4');
    this.load.video('final', 'assets/images/animales/videos/final.mp4');
    this.load.video('perdio', 'assets/images/animales/videos/perdio.mp4');
    this.load.video('animales_menu_video', 'assets/images/animales/menu.mp4');

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
    this.load.image('bosque_abeja', 'assets/images/animales/animales%20para%20el%20bosque/abeja.png');
    this.load.image('bosque_carpintero', 'assets/images/animales/animales%20para%20el%20bosque/carpintero.png');
    this.load.image('bosque_conejo', 'assets/images/animales/animales%20para%20el%20bosque/conejo.png');
    this.load.image('bosque_elefante', 'assets/images/animales/animales%20para%20el%20bosque/elefante.png');
    this.load.image('bosque_gorilla', 'assets/images/animales/animales%20para%20el%20bosque/gorilla.png');
    this.load.image('bosque_mariposa', 'assets/images/animales/animales%20para%20el%20bosque/mariposa.png');
    this.load.image('bosque_zorrillo', 'assets/images/animales/animales%20para%20el%20bosque/zorrillo.png');
    this.load.image('bosque_zorro', 'assets/images/animales/animales%20para%20el%20bosque/zorro.png');
    this.load.image('bosque_mapache', 'assets/images/animales/animales%20para%20el%20bosque/mapache.png');

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
    this.load.image('desierto_armadillo', 'assets/images/animales/animales%20para%20el%20desierto/armadillo.png');
    this.load.image('desierto_buitre', 'assets/images/animales/animales%20para%20el%20desierto/buitre.png');
    this.load.image('desierto_correcamino', 'assets/images/animales/animales%20para%20el%20desierto/correcamino.png');
    this.load.image('desierto_dragondecomodo', 'assets/images/animales/animales%20para%20el%20desierto/dragondecomodo.png');
    this.load.image('desierto_suricata', 'assets/images/animales/animales%20para%20el%20desierto/suricata.png');

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
    this.load.image('hielo_ardilla', 'assets/images/animales/animales%20para%20el%20bosque/ardilla.png');
    this.load.image('hielo_frailecillo', 'assets/images/animales/animales%20para%20el%20hielo/frailecillo.png');

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
    this.load.image('pantano_sapo', 'assets/images/animales/animales%20para%20el%20pantano/sapo.png');
    this.load.image('pantano_sapo2', 'assets/images/animales/animales%20para%20el%20pantano/sapo2.png');
    this.load.image('pantano_sapo3', 'assets/images/animales/animales%20para%20el%20pantano/sapo3.png');
    this.load.image('pantano_sapo4', 'assets/images/animales/animales%20para%20el%20pantano/sapo4.png');
    this.load.image('pantano_sapo5', 'assets/images/animales/animales%20para%20el%20pantano/sapo5.png');
    this.load.image('pantano_tortuga', 'assets/images/animales/animales%20para%20el%20pantano/tortuga.png');
    this.load.image('pantano_castor', 'assets/images/animales/animales%20para%20el%20pantano/castor.png');
    this.load.image('pantano_flamenco', 'assets/images/animales/animales%20para%20el%20pantano/flamenco.png');
    this.load.image('pantano_libelula', 'assets/images/animales/animales%20para%20el%20pantano/libelula.png');

    this.load.audio('sonido_bosque', 'assets/audio/sonidos%20de%20animales/bosque.mp3');
    this.load.audio('sonido_desierto', 'assets/audio/sonidos%20de%20animales/desierto.mp3');
    this.load.audio('sonido_hielo', 'assets/audio/sonidos%20de%20animales/hielo.mp3');
    this.load.audio('sonido_pantano', 'assets/audio/sonidos%20de%20animales/pantano.mp3');
    this.load.audio('animal_golpe1', 'assets/audio/sonidos%20de%20animales/golpes/golpe1.mp3');
    this.load.audio('animal_golpe2', 'assets/audio/sonidos%20de%20animales/golpes/golpe2.mp3');
    this.load.audio('animal_golpe3', 'assets/audio/sonidos%20de%20animales/golpes/golpe3.mp3');
    this.load.audio('animal_golpe4', 'assets/audio/sonidos%20de%20animales/golpes/golpe4.mp3');
    this.load.audio('menu_reyleon', 'assets/audio/sonidos%20de%20animales/esenarios/reyleon.mp3');
    this.load.audio('menu_monsters', 'assets/audio/sonidos%20de%20animales/esenarios/Monsters,%20Inc..mp3');
    this.load.audio('menu_aladdin', 'assets/audio/sonidos%20de%20animales/esenarios/Un%20Mundo%20Ideal%20%20Aladdín.mp3');
    this.load.audio('menu_fox', 'assets/audio/sonidos%20de%20animales/esenarios/fox.mp3');
    this.load.audio('menu_cars', 'assets/audio/sonidos%20de%20animales/esenarios/cars.mp3');
    this.load.audio('menu_cars2', 'assets/audio/sonidos%20de%20animales/esenarios/cars2.mp3');
    this.load.audio('menu_libro', 'assets/audio/sonidos%20de%20animales/esenarios/libro.mp3');
    this.load.audio('menu_rio', 'assets/audio/sonidos%20de%20animales/esenarios/Rio.mp3');
    this.load.audio('menu_sing', 'assets/audio/sonidos%20de%20animales/esenarios/Sing.mp3');
    this.load.audio('menu_sing2', 'assets/audio/sonidos%20de%20animales/esenarios/Sing2.mp3');
    this.load.audio('menu_sheck', 'assets/audio/sonidos%20de%20animales/esenarios/sheck.mp3');
    this.load.audio('menu_shek', 'assets/audio/sonidos%20de%20animales/esenarios/shek.mp3');
    this.load.audio('menu_zotopia', 'assets/audio/sonidos%20de%20animales/esenarios/zotopia.mp3');
  }

  create() {
    // Leer la escena inicial definida desde React
    const escenaInicial = this.registry.get('escenaInicial') || 'SoccerScene';

    // Asegurar valores al 100%
    if (this.percentText) this.percentText.setText('100%');
    if (this.assetText) this.assetText.setText('¡Listo! Iniciando... 💜');
    if (this.progressBar) {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x1cbca3, 1);
      this.progressBar.fillRoundedRect(this.barX, this.barY, this.barWidth, this.barHeight, 10);
    }
    if (this.glowHead) {
      this.glowHead.x = this.barX + this.barWidth;
      this.glowHead.setVisible(true);
    }

    // Desvanecimiento suave y transición a la escena de juego
    const targets = [
      this.bgImage,
      this.loadingTitle,
      this.percentText,
      this.assetText,
      this.progressBg,
      this.progressBar,
      this.glowHead
    ].filter(Boolean);

    this.tweens.add({
      targets: targets,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.scene.start(escenaInicial);
      }
    });
  }

  update(time, delta) {
    // Sin partículas flotantes en el diseño final con fondo carga.png
  }
}