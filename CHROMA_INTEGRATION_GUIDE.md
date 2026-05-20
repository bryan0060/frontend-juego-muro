# 📖 GUÍA DE INTEGRACIÓN DE VIDEOS CROMA (JUMP / SLIDE)
### *Subway Surfers Phaser Game Integration Playbook*

Esta guía paso a paso detalla el proceso técnico para integrar nuevos videos MP4 de **Salto (Jump)** y **Deslizamiento (Slide)** para cualquiera de los personajes restantes del juego (`NB2`, `NB3`, `NB4`). Sigue estos pasos exactos para garantizar que la alineación, el rendimiento a **60 FPS**, el croma en tiempo real y la sincronización sean píxel-perfectos y sin tirones.

---

## 🛠️ PASO 1: Configurar las Rutas en `CHARACTER_VIDEOS` y Coordenadas
Al inicio de [SubwaySurfersScene.js](file:///c:/Users/ASUS/OneDrive/Escritorio/frontend-juego-muro/src/phaser/scenes/SubwaySurfersScene.js), localiza el mapeo consolidado `CHARACTER_VIDEOS` y asigna las rutas exactas de los videos de tu nuevo personaje. Ya no necesitas tocar el método `preload()`, ya que este carga los videos de forma 100% automatizada.

```javascript
const CHARACTER_VIDEOS = {
  NB1: {
    run: 'assets/images/subway/Personaje/NB1.webm',
    jump: 'assets/images/subway/Personaje/niño blanco/0519 (1).mp4',
    slide: 'assets/images/subway/Personaje/niño blanco/N-B-D.mp4'
  },
  NB2: {
    run: 'assets/images/subway/Personaje/NB2.webm',
    jump: 'assets/images/subway/Personaje/niña blanca/NUEVO_VIDEO_DE_SALTO.mp4', // <-- ¡Pega tu ruta aquí!
    slide: 'assets/images/subway/Personaje/niña blanca/niña blanca deslizando.mp4'
  },
  // ...
};
```

---

## 📦 PASO 2: Confirmar las Coordenadas Calibradas
Las coordenadas y offsets de escala y posición en `SLIDE_CONFIGS` y `JUMP_CONFIGS` ya vienen preconfiguradas con los valores ideales (escala, xOffset, yOffset y umbral de croma `threshold` en 45 para el fondo negro). Al compartir las mismas dimensiones de video, **no es necesario que vuelvas a calibrar los nuevos personajes**:

```javascript
const SLIDE_CONFIGS = {
  NB1: { scale: 0.204, xOffset: -74, yOffset: 42, threshold: 45 },
  NB2: { scale: 0.204, xOffset: -74, yOffset: 42, threshold: 45 }, // <-- ¡Mismo offset calibrado y listo!
  NB3: { scale: 0.204, xOffset: -74, yOffset: 42, threshold: 45 },
  NB4: { scale: 0.204, xOffset: -74, yOffset: 42, threshold: 45 }
};
```

---

## 🏗️ PASO 3: Inicialización en `create()`
Asegúrate de que la lógica en `create()` maneje correctamente la inicialización de los videos de fondo y los objetos `CanvasTexture` correspondientes para croma en tiempo real. 

*(Nota: Esto ya está automatizado y diseñado de forma genérica en el código actual, detectando la existencia del caché del video, por lo que NO requiere modificaciones manuales para nuevos personajes).*
- Crea un canvas dinámico (`slide_chroma_texture` y `jump_chroma_texture`).
- Agrega los objetos `playerSlideImg` y `playerJumpImg` al contenedor del jugador (`jumpContainer`).

---

## ⚡ PASO 4: Inicialización Perfecta de las Acciones (`_jump` / `_slide`)
Para evitar el "destello" o "pop" de tamaño en el primer frame, la acción debe inicializar la escala de inmediato usando la matemática de resolución constante `DOWNSCALE_FACTOR = 4`.

```javascript
if (this.playerSlideImg) {
  let scaleMultiplier = DOWNSCALE_FACTOR;
  if (this.playerSlide.video) {
    const video = this.playerSlide.video;
    const rawWidth = video.videoWidth || 300;
    const rawHeight = video.videoHeight || 300;
    if (rawWidth > 0 && rawHeight > 0) {
      const width = Math.round(rawWidth / DOWNSCALE_FACTOR);
      const height = Math.round(rawHeight / DOWNSCALE_FACTOR);
      
      // Forzar dimensiones del canvas inmediatamente antes de dibujar
      if (this.slideCanvas.width !== width || this.slideCanvas.height !== height) {
        this.slideCanvas.setSize(width, height);
      }
      scaleMultiplier = rawWidth / width;
    }
  }
  this.playerSlideImg.setSizeToFrame();
  this.playerSlideImg.setScale(config.scale * scaleMultiplier);
  this.playerSlideImg.x = config.xOffset || 0;
  this.playerSlideImg.y = config.yOffset;
  this.playerSlideImg.setVisible(true);
}
```

---

## 🏎️ PASO 5: Bucle de Croma a 60 FPS en `update()`
El método `update()` procesa el video frame a frame en tiempo real para remover el fondo negro.
- Multiplica la escala por `scaleMultiplier = rawWidth / width` para compensar la compresión.
- **Muy Importante**: Actualiza `playerSlideImg.x = config.xOffset || 0` y `playerSlideImg.y = config.yOffset` en cada frame del bucle normal para bloquear la alineación contra tirones visuales.

---

## 🛠️ PASO 6: Calibración y Depuración con Inmunidad
El juego cuenta con un panel interactivo integrado. Para calibrar el personaje en vivo:
1. **Activar calibrador**: Presiona **`P`** para calibrar deslizamiento o **`Z`** para calibrar salto.
2. **Inmunidad total**: Durante la depuración, **los obstáculos pasarán de largo sin matarte**.
3. **Controles**:
   - **`I` / `K`**: Mover el personaje hacia Arriba / Abajo.
   - **`U` / `J`**: Mover el personaje hacia la Izquierda / Derecha.
   - **`O` / `L`**: Agrandar / Achicar escala general.
4. **Guardar**: Copia las coordenadas que aparezcan en el panel verde en pantalla y pégalas directamente en `SLIDE_CONFIGS` o `JUMP_CONFIGS` al inicio del archivo.

---

## 📝 RESUMEN DE COORDENADAS CONFIGURADAS (NB1)
Para Niño Blanco (`NB1`), las coordenadas perfectas que calibraste son:
* **Deslizar (Slide)**: `scale: 0.204`, `xOffset: -74`, `yOffset: 42`
* **Saltar (Jump)**: `scale: 0.228`, `xOffset: -39`, `yOffset: -14`
