# Fase 0 — planificación aislada con Fast Downward

## Estado

**Completada, con resultado positivo limitado. Fase 1 queda habilitada, no integrada aún.**

La Fase 0 evalúa Fast Downward fuera de AERA, Global Workspace y el runtime. El criterio de avance es obtener un plan medible para el mismo objetivo que resuelve el controlador de exploración: alcanzar y consumir una fuente de energía.

## Caso reproducible

Se extrajo la semilla determinista `AURELIA-WORLD-0001`. Naia comienza en `(1,3)` y la fuente de energía está en `(7,3)`. La pared en `(4,2)`, `(4,3)` y `(4,4)` impide la ruta directa. El dominio y problema usados están en [`experiments/fast-downward-phase0`](../../experiments/fast-downward-phase0).

La línea base se ejecutó con `EmbodiedInfancyController`: alcanzó y consumió la fuente en **32 decisiones**, con recompensa energética `0.37955`.

## Ejecución

Fast Downward, revisión `6230635ccff53e1df38ead53b057a2a0e9160275`, ejecutó `astar(lmcut())` sobre el dominio PDDL. La búsqueda terminó correctamente en **0.000601 s** (`0.047645 s` total), evaluó y expandió 12 estados y devolvió un plan de coste unitario **11**:

1. Diez movimientos rodean la pared desde `c2-4` hasta `c8-4`.
2. `consume c8-4` completa el mismo objetivo de consumo de la línea base.

La comparación del escenario concreto es **11 acciones planificadas frente a 32 decisiones exploratorias**: 21 acciones menos, o una reducción del **65.625 %**. El detalle estructurado, la traza y las huellas SHA-256 están en [fast-downward-phase0.json](../../evidence/fast-downward-phase0.json).

## Decisión de fase

El resultado muestra una ventaja clara para hallar una ruta en un mundo ya conocido. Por ello se puede iniciar la **Fase 1**: diseñar un traductor controlado de estado de `GenesisWorld` a PDDL y un puente opcional de planificación. Fast Downward no se incorpora aún al runtime, no sustituye a AERA y no recibe autoridad sobre acciones.

## Límites

El experimento no mide descubrimiento, percepción parcial ni aprendizaje: el mapa, las transiciones y la fuente energética se entregan al planificador de antemano. Además, PDDL abstrae orientación y costes corporales. Por eso este resultado sólo sustenta una investigación de planificación de trayectorias; no es evidencia de inteligencia general, identidad ni consciencia.
