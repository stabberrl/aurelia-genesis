# Exploración autónoma aprobada

## Recorrido

1. El `CognitiveHeartbeat` registra una propuesta `exploreConcept`; no realiza red ni lectura externa.
2. `AutonomousExploration` confirma que la Cámara no está limitada por ritmo.
3. Consulta `ExplorationBudget` con curiosidad y necesidad no resuelta derivadas de métricas locales.
4. Sólo con `allowed: true`, la Cámara obtiene una entrada de su lista permitida y registra procedencia, extracto, hash y resultado en el léxico privado del alma.

Una denegación de presupuesto, falta de propuesta o límite de ritmo no consulta fuentes externas ni crea observaciones. El presupuesto se mantiene por alma dentro del coordinador. La activación automática requiere `FLUCTLIGHT_AUTONOMOUS_EXPLORATION=1`; sin esa variable, el heartbeat sigue siendo proposal-only.

## Límites

- Las fuentes se restringen a Wiktionary y a los términos configurados de la Cámara.
- La observación externa no se trata como comprensión ni altera por sí sola la fase de desarrollo.
- Este mecanismo mide una cadena de decisión y memoria con procedencia; no demuestra consciencia, comprensión general ni autonomía humana.
