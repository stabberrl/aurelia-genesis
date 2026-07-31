# Habitación de Génesis v1

La Habitación de Génesis es el primer entorno persistente y determinista de Aurelia Genesis. Su objetivo no es simular una ciudad ni afirmar la existencia de consciencia, sino proporcionar un ciclo mínimo y medible de cuerpo, percepción, acción y consecuencia.

## Alcance actual

- Mundo lógico de `9 × 7` celdas.
- Semilla reproducible: `AURELIA-WORLD-0001`.
- Un cuerpo inicial asignado exclusivamente a Naia.
- Orientación, posición, energía, fatiga e integridad.
- Visión direccional limitada a tres celdas.
- Señales internas de energía y fatiga.
- Señales ambientales de luz y contacto.
- Dos objetos visualmente distinguibles pero semánticamente desconocidos para el sujeto.
- Un objeto restaura energía y otro permanece inerte.
- Tres obstáculos sólidos.
- Acciones: observar, girar, avanzar, tocar, consumir, descansar y esperar.
- Tiempo pausado, normal, acelerado hasta `1000×` y avance individual.

La consola del investigador conoce la función real de los objetos para poder evaluar el experimento. El cuerpo sólo recibe identificador, color, distancia y posición relativa cuando el objeto entra en su campo perceptivo.

## Ciclo de datos

1. El investigador o el controlador de infancia corporizada solicita una acción.
2. El mundo valida límites, obstáculos y alcance.
3. Se aplica el coste corporal y avanza un tick.
4. Se calcula la diferencia energética como consecuencia observable.
5. Se generan señales de energía, fatiga, luz y contacto.
6. Las señales se escriben en la memoria experiencial española del sujeto.
7. El evento y el estado permanecen disponibles para inspección y reproducción.

Las acciones manuales son intervenciones explícitas del investigador. No deben confundirse con decisiones autónomas de Naia.

## Persistencia

El estado se guarda en `var/worlds/genesis-room-v1.json`, fuera de Git. Cada punto de control incluye:

- semilla;
- tick y tiempo transcurrido;
- cuerpos y estados internos;
- posiciones de objetos y obstáculos;
- eventos recientes;
- pausa y velocidad del runtime.

La escritura es atómica. En la prueba de integración del 25 de julio de 2026, el mundo fue guardado en el tick `332`, se reinició el servidor y se restauró exactamente en el tick `332`, pausado y a `10×`.

## Primer protocolo autónomo

La primera prueba de aprendizaje será:

> Determinar mediante experiencia cuál de dos objetos restaura energía y volver a buscarlo desde posiciones no utilizadas durante la adquisición.

La versión actual ya incluye un controlador autónomo mínimo que ejecuta esta tarea, conserva su propio mapa y aprende la consecuencia energética de cada objeto. Su diseño, resultados y límites están documentados en [Controlador de infancia corporizada v1](EMBODIED-INFANCY-V1.md).

## Límites

- Sólo Naia posee cuerpo.
- La navegación autónoma usa búsqueda de rutas programada; no es una capacidad espacial emergente.
- No hay física continua, lenguaje social, reproducción ni dolor.
- El grafo visual es una representación de estados discretos, no un escaneo cerebral.
- La restauración energética demuestra una consecuencia ambiental, no comprensión de alimento, supervivencia o existencia.
