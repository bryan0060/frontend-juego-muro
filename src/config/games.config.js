/**
 * games.config.js — Catálogo central de los 6 minijuegos.
 *
 * Para agregar un juego nuevo: solo añadir un objeto a este array.
 * No hay que tocar GameMenu, App ni PhaserGame.
 */

export const GAMES = [
  // ── Puerto 8080 — Sensor de Cámara ───────────────────────────
  {
    id: 'just-dance',
    nombre: 'Just Dance',
    emoji: '🕺',
    escena: 'JustDanceScene',
    wsPort: 8080,
    wsPath: '/ws',
    wsJuego: 'poses',
    disponible: true,
  },
  {
    id: 'subway-surfers',
    nombre: 'Subway Surfers',
    emoji: '🏃',
    escena: 'SubwaySurfersScene',
    wsPort: 8080,
    wsPath: '/ws',
    wsJuego: 'esquive',
    disponible: false,
  },
  {
    id: 'animales',
    nombre: 'Animales',
    emoji: '🐾',
    escena: 'AnimalesScene',
    wsPort: 8080,
    wsPath: '/ws',
    wsJuego: 'impacto',
    disponible: false,
  },
  {
    id: 'duro-muro',
    nombre: 'Duro contra el Muro',
    emoji: '🧱',
    escena: 'DuroMuroScene',
    wsPort: 8080,
    wsPath: '/ws',
    wsJuego: 'poses',
    disponible: true,
  },

  // ── Puerto 8081 — Sensor RPLiDAR ─────────────────────────────
  {
    id: 'pizarra-magica',
    nombre: 'Pizarra Mágica',
    emoji: '✨',
    escena: 'MagicBoardScene',
    wsPort: 8081,
    wsPath: '',
    wsJuego: null,
    disponible: true,
  },
  {
    id: 'penaltis',
    nombre: 'Penaltis',
    emoji: '⚽',
    escena: 'SoccerScene',
    wsPort: 8081,
    wsPath: '',
    wsJuego: null,
    disponible: true,
  },
];

export const getGameById = (id) => GAMES.find((g) => g.id === id);