# Fase 0 — planificación aislada con Fast Downward

## Estado

**Bloqueada. No se avanza a integración.**

La Fase 0 evalúa Fast Downward fuera de AERA, Global Workspace y el runtime. Su único criterio de avance era obtener un plan medible para el mismo objetivo que resuelve hoy el controlador de exploración.

## Caso

Se extrajo la semilla determinista `AURELIA-WORLD-0001`. Naia comienza en `(1,3)` y la fuente de energía está en `(7,3)`. La pared en `(4,2)`, `(4,3)` y `(4,4)` impide la ruta directa. El dominio y problema usados están en [`experiments/fast-downward-phase0`](../../experiments/fast-downward-phase0).

La línea base fue ejecutada con `EmbodiedInfancyController`: alcanzó y consumió la fuente en **32 decisiones**, con recompensa energética `0.37955`.

## Ejecución

Fast Downward fue obtenido desde su repositorio oficial y compilado localmente. La traducción PDDL finalizó: 20 operadores necesarios y un objetivo alcanzable. Al iniciar la búsqueda `astar(lmcut())`, Windows bloqueó `downward.exe` mediante una directiva de Control de aplicaciones (`WinError 4551`). Por tanto, no existe plan, coste ni tiempo del planificador.

El artefacto estructurado es [fast-downward-phase0.json](../../evidence/fast-downward-phase0.json).

## Decisión de fase

No hay resultado positivo que justifique Fase 1. No se añade Fast Downward al runtime, no se crea `planner-bridge`, y no se modifica la autoridad de AERA ni el presupuesto de exploración. El experimento puede repetirse en un equipo donde la directiva permita ejecutar el binario compilado.

## Límites

Este resultado es de infraestructura, no una evaluación de calidad del planificador. Tampoco constituye evidencia sobre aprendizaje, identidad o consciencia.
