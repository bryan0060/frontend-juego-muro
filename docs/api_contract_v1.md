# Contrato API v1 — Sistema Cámara Puerto 8080
**Noah Technology Solutions — Parke Tr3s**
Última actualización: Semana 1

Este documento define el JSON exacto que el Backend emite por WebSocket
al Frontend. David y Tomás deben usar esta estructura para construir su Mock.

---

## Estructura general

Todo mensaje tiene una capa común y una capa específica del juego activo:

```json
{
  "timestamp": 1719500000.123,
  "juego_activo": "esquive",
  "jugador_detectado": true,
  "fps_actual": 58.4,

  "esquive": {
     ...campos específicos de este juego...
  }
}
```

La capa específica solo existe cuando `juego_activo` coincide con ese juego.

---

## Juego 1 — Ritmo

```json
{
  "timestamp": 1719500000.123,
  "juego_activo": "ritmo",
  "jugador_detectado": true,
  "fps_actual": 59.1,

  "ritmo": {
    "muneca_izquierda":  { "x": 0.42, "y": 0.61, "confidence": 0.97 },
    "muneca_derecha":    { "x": 0.71, "y": 0.58, "confidence": 0.95 },
    "tobillo_izquierdo": { "x": 0.38, "y": 0.91, "confidence": 0.88 },
    "tobillo_derecho":   { "x": 0.63, "y": 0.90, "confidence": 0.91 }
  }
}
```

## Juego 2 — Esquive

```json
{
  "timestamp": 1719500000.123,
  "juego_activo": "esquive",
  "jugador_detectado": true,
  "fps_actual": 60.0,

  "esquive": {
    "carril": "CENTER",
    "angulo_torso": -12.4
  }
}
```

## Juego 3 — Impacto

```json
{
  "timestamp": 1719500000.123,
  "juego_activo": "impacto",
  "jugador_detectado": true,
  "fps_actual": 60.0,

  "impacto": {
    "mano_izquierda":  { "x": 0.38, "y": 0.45, "velocidad": 2.1,  "aceleracion": 15.7,  "golpe_detectado": false },
    "mano_derecha":    { "x": 0.71, "y": 0.42, "velocidad": 18.9, "aceleracion": 210.3, "golpe_detectado": true  },
    "pie_izquierdo":   { "x": 0.39, "y": 0.89, "velocidad": 0.3,  "aceleracion": 1.1,   "golpe_detectado": false },
    "pie_derecho":     { "x": 0.62, "y": 0.88, "velocidad": 0.5,  "aceleracion": 2.0,   "golpe_detectado": false }
  }
}
```

## Juego 4 — Poses

```json
{
  "timestamp": 1719500000.123,
  "juego_activo": "poses",
  "jugador_detectado": true,
  "fps_actual": 59.8,

  "poses": {
    "esqueleto": {
      "nariz":             { "x": 0.50, "y": 0.12, "confidence": 0.99 },
      "hombro_izquierdo":  { "x": 0.38, "y": 0.28, "confidence": 0.97 },
      "hombro_derecho":    { "x": 0.62, "y": 0.27, "confidence": 0.96 },
      "codo_izquierdo":    { "x": 0.30, "y": 0.42, "confidence": 0.94 },
      "codo_derecho":      { "x": 0.70, "y": 0.41, "confidence": 0.93 },
      "muneca_izquierda":  { "x": 0.22, "y": 0.55, "confidence": 0.91 },
      "muneca_derecha":    { "x": 0.78, "y": 0.54, "confidence": 0.90 },
      "cadera_izquierda":  { "x": 0.41, "y": 0.55, "confidence": 0.98 },
      "cadera_derecha":    { "x": 0.59, "y": 0.55, "confidence": 0.97 },
      "rodilla_izquierda": { "x": 0.39, "y": 0.73, "confidence": 0.95 },
      "rodilla_derecha":   { "x": 0.61, "y": 0.72, "confidence": 0.94 },
      "tobillo_izquierdo": { "x": 0.38, "y": 0.91, "confidence": 0.92 },
      "tobillo_derecho":   { "x": 0.62, "y": 0.90, "confidence": 0.91 }
    }
  }
}
```