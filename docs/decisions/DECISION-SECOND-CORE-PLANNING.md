# DECISION — Segundo núcleo especializado: planificación PDDL

- Estado: aceptada con alcance limitado
- Fecha: 2026-08-02
- Implementación de referencia: commit `d60f92d` (`feat: add Fast Downward planning proposal bridge`)

## 1. Contexto

El controlador corporal actual alcanza objetivos de varios pasos mediante exploración, memoria de celdas bloqueadas y decisiones locales. Este enfoque permite descubrir consecuencias, pero no calcula de antemano una secuencia corta cuando el mapa y el objetivo ya son explícitos. En la semilla de prueba, el controlador necesitó 32 decisiones para alcanzar y consumir una fuente detrás de una pared.

El problema delimitado es únicamente de planificación: dada una posición, transiciones conocidas, obstáculos y un objetivo activo, obtener una secuencia válida. No se introduce una segunda arquitectura general para aprendizaje, memoria o identidad.

## 2. Escenario ilustrativo

**Escenario ilustrativo construido para este documento; no es un registro de ejecución real.** Naia se encuentra en `(1,3)`. El espacio de trabajo ya contiene una fuente energética conocida en `(7,3)` y la necesidad energética supera el umbral interno. La pared en `(4,2)`, `(4,3)` y `(4,4)` bloquea la línea directa. El sistema traduce ese estado explícito a PDDL y produce una propuesta `followPlan` para bordear la pared y terminar en `consume`. El presupuesto puede aceptarla o rechazarla; ninguna acción se despacha por el mero hecho de que exista el plan.

## 3. Alternativas consideradas

### Soar

Soar es una arquitectura cognitiva general con memoria, reglas y resolución de subobjetivos. Para este caso añade una superficie de integración amplia que se superpone con AERA, sin una ventaja demostrada sobre un planificador dedicado para una grilla discreta.

### OpenCog

OpenCog es un ecosistema cognitivo general con representaciones y mecanismos de razonamiento de mayor alcance. Requeriría traducir y sincronizar más estado con AERA para resolver un problema que aquí se limita a secuenciar movimientos conocidos.

### Permanecer sólo con exploración local

La exploración se conserva para adquirir información y comprobar consecuencias. No se descarta; la Fase 0 mostró, sin embargo, una diferencia medible para la ruta conocida de prueba.

## 4. Decisión

Se adopta Fast Downward como un segundo núcleo **especializado y opcional** de planificación clásica. Usa PDDL, encaja con la grilla discreta de Genesis World y cuenta con una licencia GNU GPL v3 o posterior. La integración se limita a:

1. Traducir un estado explícito de Genesis World a un problema PDDL.
2. Pedir una secuencia al planificador externo local.
3. Convertir pasos permitidos a acciones corporales existentes.
4. Registrar `followPlan` como propuesta en Global Workspace y someterla a `ExplorationBudget`.

## 5. Límites declarados

Fast Downward no aprende asociaciones, no forma identidad, no decide qué objetivo importa, no observa el mundo por sí mismo y no ejecuta acciones. AERA, Global Workspace y los mecanismos de presupuesto siguen determinando prioridad, significado y autorización. Un plan sólo describe una ruta bajo las condiciones que recibió; deja de ser fiable cuando cambian esas condiciones.

## 6. Resultado de Fase 0

La prueba aislada de la semilla `AURELIA-WORLD-0001` produjo 11 acciones para llegar y consumir energía, frente a 32 decisiones exploratorias: reducción de 65.625 % en ese mapa conocido. La evidencia, límites y huellas de los archivos están en [FAST-DOWNWARD-PHASE0.md](../experiments/FAST-DOWNWARD-PHASE0.md) y [fast-downward-phase0.json](../../evidence/fast-downward-phase0.json). Este resultado no se interpreta como evidencia de aprendizaje general ni consciencia.

## 7. Trazabilidad

La implementación inicial corresponde al commit `d60f92d`. La entrada `FEAT-PLANNER-PROPOSAL-BRIDGE-001` en [`docs/CHANGELOG.md`](../CHANGELOG.md) registra el bloque, su dependencia externa y su verificación. Esta decisión se incorpora en el commit posterior que la documenta.
