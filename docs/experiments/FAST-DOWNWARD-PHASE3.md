# Fase 3 — ejecución experimental controlada

## Propósito

Esta fase permite probar una propuesta `followPlan` en Genesis World sin convertir el planificador en un agente autónomo. La ejecución es manual, puntual y exige que el mundo y el controlador corporal estén detenidos.

## Recorrido

1. `POST /api/planning/propose` recibe un alma, un objeto objetivo y motivaciones explícitas.
2. El puente traduce el estado actual, solicita el plan externo y pasa la propuesta por `ExplorationBudget`.
3. Si se aprueba, la API devuelve un identificador de plan; el plan sigue en estado `ready` y no cambia el mundo.
4. `POST /api/planning/execute` usa ese identificador de forma explícita.
5. Antes de cada acción, el ejecutor comprueba que el mundo sigue pausado, que la revisión del mundo y la pose inicial no cambiaron, y que la acción aún es válida.
6. Ante una revisión distinta, una pose modificada, una acción inválida o un resultado rechazado, el plan se cancela y no continúa.

## Condiciones locales

El servidor debe iniciarse con `FAST_DOWNWARD_HOME` apuntando a la carpeta externa que contiene `fast-downward.py`. Fast Downward no se descarga, instala ni inicia automáticamente. `GET /api/planning` muestra si está configurado y el historial de propuestas de la sesión.

## Límites

La propuesta no crea objetivos, no descubre el mapa y no habilita ciclos automáticos. El presupuesto local limita la propuesta; AERA conserva las funciones cognitivas ya declaradas. La ejecución sólo usa las acciones corporales permitidas `turnLeft`, `turnRight`, `moveForward`, `touch` y `consume`.
