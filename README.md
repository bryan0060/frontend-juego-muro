# 🎮 Muro Interactivo — Parke Tr3s

Proyecto desarrollado por **Noah Technology Solutions** para **Parke Tr3s**.  
Un muro interactivo proyectado en pared, controlado por un sensor láser RPlidar C1,
con juegos diseñados para niños.

---

## 🧱 Tecnologías

- **React + Vite** — Interfaz de usuario (menús, pantallas, puntajes)
- **Phaser 3** — Motor de juegos (físicas, animaciones, partículas)
- **WebSocket** — Comunicación en tiempo real con el sensor láser

---

## 👥 Equipo

| Rol | Nombre | Responsabilidad |
|---|---|---|
| Tech Lead | Bryan | Arquitectura, WebSocket, integración final |
| Frontend Dev | David Herrera Carvajal | Componentes React, escenas Phaser, estilos |
| Backend Dev | Jean Pierr Suaza Novoa | Servidor WebSocket, procesamiento del sensor |

---

## 🚀 Cómo correr el proyecto por primera vez

### 1. Clona el repositorio
```bash
git clone https://github.com/bryan0060/frontend-juego-muro.git
cd frontend-juego-muro
```

### 2. Instala las dependencias
```bash
npm install
```

### 3. Corre el proyecto en modo desarrollo
```bash
npm run dev
```

Abre el navegador en `http://localhost:5173`

> **En desarrollo:** los clics del mouse simulan impactos del sensor láser.
> Verás partículas explotar donde hagas clic — así es como funciona el mock.

---

## 📁 Estructura del proyecto
src/
├── components/
│   └── PhaserGame/       # Puente entre React y Phaser
├── phaser/
│   ├── PhaserConfig.js   # Configuración global de Phaser
│   └── scenes/           # Cada juego es una escena aquí
├── services/
│   └── websocket/        # Cliente WebSocket real y mock
└── styles/               # Estilos globales

---

## 🌿 Ramas del repositorio

| Rama | Para qué sirve |
|---|---|
| `main` | Versión final lista para instalar en el Mini PC. **No tocar.** |
| `develop` | Aquí trabajamos todos. Hacer push aquí siempre. |

### Flujo de trabajo diario

```bash
# ANTES de empezar a trabajar — siempre
git pull origin develop

# CUANDO algo funciona y está estable
git add .
git commit -m "feat: descripción de lo que hiciste"
git push origin develop
```

### ⚠️ Reglas importantes
- **Siempre** hacer `git pull` antes de empezar a trabajar
- **Nunca** hacer push directo a `main`
- Los commits deben describir claramente qué se hizo
- Si algo se rompe, avisar al equipo antes de hacer push

---

## ✅ Fases del proyecto

| Fase | Estado | Descripción |
|---|---|---|
| 0 — Base | ✅ Completa | Estructura, puente React/Phaser, mock WebSocket |
| 1 — UI React | 🔄 En progreso | StartScreen, GameMenu, navegación |
| 2 — Juego Core | ⬜ Pendiente | Física de pelota, detección de colisiones |
| 3 — WebSocket Real | ⬜ Pendiente | Conexión con sensor RPlidar C1 |
| 4 — Efectos | ⬜ Pendiente | Partículas avanzadas, sonidos, animaciones |
| 5 — Producción | ⬜ Pendiente | Build final, configuración del Mini PC |

---

## 🎨 Identidad visual — Parke Tr3s
Colores:
Púrpura:    #9c4eb3  ← Color principal
Verde agua: #3dc9a1
Naranja:    #fa804f
Amarillo:   #fdbf2c
Azul:       #40c0dd
Tipografía principal:      Playthings
Tipografía complementaria: Gotham Rounded

---

## 📞 Contacto

¿Dudas sobre el proyecto? Escribirle directamente a Bryan (Tech Lead).