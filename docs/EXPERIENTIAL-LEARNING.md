# Aprendizaje experiencial

El primer ciclo de aprendizaje de Aurelia Genesis convierte percepciones y encuentros léxicos en memoria episódica y asociaciones plásticas. Se mantiene separado del currículo inyectado: conocer una definición no cuenta como haberla vivido.

## Ciclo

1. Un estímulo aceptado por AERA se registra como episodio sensorial.
2. Una palabra encontrada durante los 30 segundos siguientes se registra como episodio léxico.
3. La proximidad temporal refuerza una conexión entre la palabra, la entidad y el canal sensorial.
4. Las repeticiones aumentan el peso con rendimientos decrecientes; los estímulos más intensos tienen mayor saliencia.
5. Una conexión sin refuerzo pierde la mitad de su fuerza cada 14 días.
6. El reconocimiento requiere al menos dos evidencias y una confianza mínima de `0.45`.

La confianza combina la fuerza de la asociación y la semejanza entre el valor observado y la media vivida. Por tanto, una palabra no se considera comprendida tras una coincidencia aislada.

## Observación

`GET /api/development?soulId=<id>` expone el número de memorias episódicas, conexiones plásticas y las asociaciones más fuertes. La Cámara las representa mediante conexiones cuyo grosor y brillo corresponden a su fuerza actual.

`GET /api/memory/episodes?soulId=<id>` devuelve los episodios recientes del alma indicada.

`POST /api/learning/recognize` permite ejecutar una prueba controlada:

```json
{
  "soulId": "soul-001-alba-0001",
  "cue": "luz",
  "subject": "garden",
  "predicate": "light",
  "value": 0.55
}
```

## Primer experimento

Naia recibió tres ciclos de una percepción de luz con valor `0.50`, seguidos por la palabra `luz`. Después reconoció una percepción no idéntica de `0.55` con seis evidencias acumuladas. Este resultado valida el mecanismo técnico; todavía no demuestra comprensión lingüística general ni consciencia.

