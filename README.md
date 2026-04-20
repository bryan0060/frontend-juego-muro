# 🎮 Master UI — Parke Tr3s

Proyecto desarrollado por **Noah Technology Solutions** para **Parke Tr3s**.
Una Master UI que aloja 6 minijuegos controlados por 2 tipos de sensores físicos,
proyectada en una pared en Kiosk Mode.

---

## 👥 Equipo

| Rol | Nombre | Responsabilidad |
|---|---|---|
| Tech Lead | Bryan Arias Rios | Arquitectura, integración, revisión |
| Phaser Dev | David Herrera Carvajal | Escenas de juego en Phaser |
| Frontend Dev | Tomás | Escenas de juego en Phaser + apoyo UI |

---

## 🧱 Stack

- **React + Vite** — Menús y navegación entre juegos
- **Phaser 4** — Motor de cada minijuego
- **WebSocket** — Comunicación en tiempo real con los sensores

---

## 🎮 Los 6 juegos

Hay 2 tipos de sensores. Cada sensor tiene su propio puerto WebSocket:

### 📷 Cámara de reconocimiento corporal → Puerto 8080
El sensor detecta el cuerpo del jugador (poses, movimiento, impactos).

| Juego | Escena Phaser | Estado |
|---|---|---|
| Just Dance | `JustDanceScene` | 🔴 Pendiente |
| Subway Surfers | `SubwaySurfersScene` | 🔴 Pendiente |
| Animales | `AnimalesScene` | 🔴 Pendiente |
| Duro contra el Muro | `DuroMuroScene` | 🔴 Pendiente |

### 🔴 Sensor RPLiDAR → Puerto 8081
El sensor detecta coordenadas (X, Y) de impactos físicos en la pared.

| Juego | Escena Phaser | Estado |
|---|---|---|
| Pizarra Mágica | `MagicBoardScene` | 🔴 Pendiente |
| Penaltis | `SoccerScene` | 🟡 Base lista |

---

## 📁 Estructura del proyecto

```
src/
├── config/
│   └── games.config.js        ← Catálogo de los 6 juegos (ÚNICA FUENTE DE VERDAD)
├── components/
│   ├── StartScreen/           ← Pantalla de bienvenida
│   ├── GameMenu/              ← Menú de selección
│   └── PhaserGame/            ← Puente entre React y Phaser
├── phaser/
│   ├── PhaserConfig.js        ← Configuración global de Phaser
│   └── scenes/                ← AQUÍ van todas las escenas de juego
│       ├── BootScene.js       ← Precarga de assets (no tocar)
│       └── SoccerScene.js     ← Ejemplo de escena funcional
├── services/
│   └── websocket/
│       ├── WebSocketClient.js ← Cliente WS dinámico (no tocar)
│       └── MockWebSocket.js   ← Simulador para desarrollo (no tocar)
└── styles/
    └── global.css
```

---

## 🚀 Cómo correr el proyecto

```bash
# 1. Clonar el repositorio
git clone https://github.com/bryan0060/frontend-juego-muro.git
cd frontend-juego-muro

# 2. Instalar dependencias
npm install

# 3. Correr en desarrollo
npm run dev
```

> En desarrollo los clics del mouse simulan impactos del sensor.
> No necesitas ningún sensor físico para desarrollar.

---

## 🌿 Git Flow

| Rama | Uso |
|---|---|
| `main` | Versión final para el Mini PC. **No tocar.** |
| `develop` | Rama de trabajo. Hacer push aquí siempre. |

```bash
# Antes de empezar a trabajar — siempre
git pull origin develop

# Cuando algo funciona
git add .
git commit -m "feat(escena): descripción de lo que hiciste"
git push origin develop
```

---

## 👨‍💻 Guía para David y Tomás

### ¿Cómo crear una escena nueva?

Toda la lógica de cada juego vive en un archivo dentro de `src/phaser/scenes/`.
Miren `SoccerScene.js` como ejemplo funcional.

**Paso 1 — Crear el archivo de la escena**

Crear `src/phaser/scenes/NombreScene.js`:

```javascript
import * as Phaser from 'phaser';

export class NombreScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NombreScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Tu lógica de juego aquí

    // Escuchar impactos del sensor
    this._impactHandler = this.handleImpact.bind(this);
    window.addEventListener('ws-message', this._impactHandler);
  }

  handleImpact(event) {
    const { x, y, tipo_evento } = event.detail;
    // x, y → coordenadas del impacto en pantalla
    // tipo_evento → tipo de evento que mandó el sensor
  }

  shutdown() {
    // OBLIGATORIO — evita memory leaks
    window.removeEventListener('ws-message', this._impactHandler);
  }
}
```

**Paso 2 — Registrar la escena en PhaserConfig.js**

```javascript
// Agregar el import
import { NombreScene } from './scenes/NombreScene';

// Agregar al array scene
scene: [BootScene, SoccerScene, NombreScene],
```

**Paso 3 — Activar el juego en games.config.js**

```javascript
{
  id: 'nombre-juego',
  nombre: 'Nombre del Juego',
  emoji: '🎮',
  escena: 'NombreScene',   // ← Debe coincidir con el key del constructor
  wsPort: 8080,             // ← 8080 cámara / 8081 RPLiDAR
  disponible: true,         // ← Cambiar a true cuando esté listo
},
```

> ⚠️ El nombre en `escena` debe ser exactamente igual al `key` del constructor de la escena.

### Reglas importantes

- **Nunca** modificar `WebSocketClient.js`, `MockWebSocket.js` ni `PhaserGame.jsx`
- **Nunca** hacer push directo a `main`
- **Siempre** hacer `git pull origin develop` antes de empezar
- Si algo se rompe, avisar a Bryan antes de hacer push

---

## ✅ Estado del proyecto

| Fase | Estado | Descripción |
|---|---|---|
| Arquitectura base | ✅ Completa | React + Phaser + WebSocket dinámico |
| Menú con 6 juegos | ✅ Completa | Config central, disponibilidad |
| SoccerScene (Penaltis) | 🟡 En progreso | Base funcional, falta lógica real |
| 5 escenas restantes | 🔴 Pendiente | |
| WebSocket real | 🔴 Pendiente | Depende del backend |
| Build para Mini PC | 🔴 Pendiente | |

---

## 🎨 Identidad visual — Parke Tr3s

```
Púrpura:    #9c4eb3  ← Color principal
Verde agua: #3dc9a1
Naranja:    #fa804f
Amarillo:   #fdbf2c
Azul:       #40c0dd

Tipografía principal:      Fredoka
Tipografía complementaria: Gotham Rounded
```

---