# Diario técnico de cambios

Registro cronológico append-only. Las horas utilizan `America/Santiago` (`UTC-04:00`). Una entrada describe el momento en que el bloque fue verificado; no pretende reconstruir una hora anterior.

## 2026-08-02T04:23:00-04:00 — FEAT-PLANNER-CONTROLLED-EXECUTION-001

- Tipo: `feat`
- Resumen: se habilita la ejecución experimental manual de una propuesta `followPlan` mediante endpoints de propuesta, inspección y ejecución.
- Seguridad: requiere presupuesto aprobado, mundo pausado, controlador detenido, pose y revisión del mundo sin cambios; cada acción se revalida y el plan se cancela en la primera discrepancia.
- Recuperación: se solicita un checkpoint completo antes de comenzar una ejecución válida.
- Verificación: `npm test` — 75/75 PASS; pruebas de cancelación por revisión, bloqueo por mundo activo y ejecución puntual aprobada.
- Protocolo: `docs/experiments/FAST-DOWNWARD-PHASE3.md`.

## 2026-08-02T04:17:53-04:00 — DECISION-SECOND-CORE-PLANNING-001

- Tipo: `decision`
- Decisión: Fast Downward queda definido como núcleo externo, opcional y especializado exclusivamente en planificación; AERA mantiene aprendizaje, identidad y autoridad cognitiva.
- Control: los planes se registran como `followPlan`, pasan por `ExplorationBudget` y permanecen en `proposal-only`; no se habilita ejecución automática.
- Referencia: `docs/decisions/DECISION-SECOND-CORE-PLANNING.md`, Fase 0 en `evidence/fast-downward-phase0.json` e implementación `d60f92d`.

## 2026-08-02T04:17:28-04:00 — FEAT-PLANNER-PROPOSAL-BRIDGE-001

- Tipo: `feat`
- Resumen: se incorpora un traductor de estado explícito de Genesis World a PDDL, un puente local de Fast Downward y la conversión validada de sus pasos a acciones corporales existentes.
- Seguridad: `followPlan` es una propuesta registrada en Global Workspace y queda sujeta a `ExplorationBudget`; el coordinador no ejecuta acciones, no elige objetivos y no altera la autoridad de AERA.
- Dependencia: Fast Downward continúa siendo externo y opcional; `CONTRIBUTING.md` documenta `FAST_DOWNWARD_HOME` para las reproducciones locales.
- Verificación: prueba extremo a extremo local: 11 pasos PDDL, 15 acciones corporales y `consume` final; `npm test` — 72/72 PASS.

## 2026-08-02T04:08:51-04:00 — EXP-FAST-DOWNWARD-PHASE0-RESULT-002

- Tipo: `experiment`
- Resultado: Fast Downward ejecutó `astar(lmcut())` sobre la semilla determinista y alcanzó/consumió la fuente de energía en 11 acciones (coste 11, 12 estados expandidos); la línea base exploratoria necesitó 32 decisiones.
- Comparación: para este mapa conocido, el plan tiene 21 acciones menos (reducción del 65.625 %). No se extrapola a percepción, descubrimiento ni aprendizaje.
- Decisión: la Fase 0 queda positiva y limitada; Fase 1 queda habilitada para diseñar un traductor y puente sin modificar todavía el runtime ni la autoridad de AERA.
- Evidencia: `evidence/fast-downward-phase0.json`, `docs/experiments/FAST-DOWNWARD-PHASE0.md` y `experiments/fast-downward-phase0/`.

## 2026-08-02T03:02:00-04:00 — EXP-FAST-DOWNWARD-PHASE0-BLOCKED-001

- Tipo: `experiment`
- Resultado: la traducción del problema PDDL de Genesis World completó, con línea base de 32 decisiones para el controlador exploratorio; la búsqueda de Fast Downward fue bloqueada por Control de aplicaciones de Windows (`WinError 4551`).
- Decisión: no avanzar a Fase 1 ni integrar planificación mientras no exista una comparación medible.
- Evidencia: `evidence/fast-downward-phase0.json` y `docs/experiments/FAST-DOWNWARD-PHASE0.md`.

## 2026-08-01T10:25:00-04:00 — FEAT-RESEARCH-DOSSIER-INTERFACE-001

- Tipo: `feat`
- Resumen: la Consola de Investigación adopta fichas técnicas oscuras, retícula instrumental, códigos de panel, tipografía Oxanium/IBM Plex Mono, barras con marcas de escala y acentos limitados a lectura activa o alerta.
- Límite: se preservaron los datos, controles y rutas existentes; la conversión visual de las demás cámaras queda como trabajo posterior bajo la misma guía.
- Verificación: `npm test` — 69/69 PASS; revisión de formato sin errores. La inspección visual interactiva queda pendiente de volver a iniciar la Cámara local.

## 2026-08-01T10:00:00-04:00 — DOC-FRONTEND-DESIGN-SYSTEM-001

- Tipo: `docs`
- Resumen: se incorpora la guía canónica de lenguaje visual y copy para las cuatro interfaces y vistas futuras.
- Alcance: define tokens, tipografía, fichas instrumentales, campos redactados, sello de verificación, límites de animación y lista de comprobación responsive.
- Verificación: revisión documental; no modifica aún una interfaz existente.

## 2026-07-31T10:30:00-04:00 — FEAT-AERA-PRIMARY-AUTHORITY-001

- Tipo: `feat`
- Resumen: AERA recibe las percepciones corporales, conoce el conjunto cerrado de acciones de Genesis y sus comandos TCP se decodifican para ejecutarse sólo tras validación.
- Corrección de protocolo: cada acción declara su metadato Protobuf de salida; el dispositivo TCP de AERA necesita esa descripción para construir una devolución de comando.
- Límite: la semilla inicial aún no contiene una política de exploración; por ello el enlace no inventa comandos. El siguiente experimento debe comprobar comandos expulsados por AERA antes de habilitar cualquier autonomía sostenida.
- Trazabilidad: `GET /api/aera/commands` expone las últimas solicitudes y su resultado; `/api/health` identifica `aera-primary` o `aera-awaiting-link`.
- Verificación: `npm test` — 69/69 PASS. El 2026-07-31T10:22:29-04:00 AERA inició con la semilla ampliada y completó el handshake TCP; `/api/health` confirmó `mode: aera-primary`. La expulsión de una acción requiere el siguiente experimento de política/modelado y no se simula mientras tanto.

## 2026-07-31T10:05:00-04:00 — FIX-DECAY-RUNTIME-RESPONSIVENESS-001

- Tipo: `fix`
- Resumen: el contador de decaimiento procesa asociaciones por lotes acotados por alma en vez de recorrer todo el léxico durante una petición.
- Motivo: un léxico local grande podía bloquear el hilo del runtime al llegar un heartbeat y dejar la consola sin respuesta.
- Limitación: la detección de decaimiento se completa de manera incremental en lecturas sucesivas; el contador sigue siendo acumulativo y no duplica eventos.
- Complemento: las vistas de desarrollo e identidad priorizan el último checkpoint íntegro disponible; así no fuerzan un recálculo completo durante la carga de la interfaz.
- Verificación: validación de servicio correcta; `npm test` — 68/68 PASS.

## 2026-07-31T09:49:12-04:00 — FEAT-RESEARCH-INTERFACE-V3-001

- Tipo: `feat`
- Resumen: la Consola de investigación incorpora deriva de identidad, histórico de versiones, evidencia experimental, presupuesto de exploración, propuestas del heartbeat y comparación de población.
- Separación: los datos cuantitativos se mantienen en `research.html`; `index.html` sólo recibe el acceso cruzado a la Cámara 3D.
- Lectura: se añadieron endpoints de sólo lectura para histórico de identidad y presupuesto; la activación autónoma sigue determinada por el runtime, no por la interfaz.
- Auditoría: la Cámara de Conocimiento ya completa la ruta mediada de descubrimiento y la Cámara 3D conserva telemetría independiente de WebGL; no se alteraron ambos flujos.
- Verificación: `npm test` — 67/67 PASS. La inspección visual automatizada no se ejecutó porque el canal de control de navegador no está disponible en esta sesión.

## 2026-07-31T01:35:00-04:00 — FEAT-AUTONOMOUS-EXPLORATION-LOOP-001

- Tipo: `feat`
- Resumen: se conectó la propuesta `exploreConcept` del heartbeat con una observación real y trazable, sólo después de aprobar `ExplorationBudget`.
- Seguridad: sin propuesta, con presupuesto agotado o durante rate limit, no hay solicitud externa ni observación nueva; la activación automática exige `FLUCTLIGHT_AUTONOMOUS_EXPLORATION=1`.
- Runtime: `POST /api/autonomous-exploration/tick` permite comprobar un ciclo individual sin habilitar el proceso periódico.
- Documentación: `docs/AUTONOMOUS-EXPLORATION.md` describe el recorrido y sus límites.
- Verificación: pruebas de integración aprobada/bloqueada y `npm test` — 66/66 PASS.

## 2026-07-31T01:16:00-04:00 — FEAT-CROSS-PLATFORM-AERA-001

- Tipo: `feat`
- Resumen: `npm run aera:build` y `npm run aera:start` seleccionan PowerShell en Windows y Bash en Linux/macOS mediante un selector Node verificable.
- Unix: se añadieron scripts para regenerar temporalmente Protobuf, compilar con CMake y publicar `vendor/aera/Release/AERA`; el arranque registra PID y logs dentro de `Release`.
- Portabilidad: la copia temporal de CMake usa el paquete Protobuf del sistema; la opción `AERA_32BIT` queda disponible sólo para Linux y no fuerza la arquitectura de macOS. El submódulo de AERA no se modifica.
- Requisitos Unix: CMake y Protobuf (`protoc` y biblioteca de desarrollo); no se descarga ni ejecuta software externo automáticamente.
- Verificación: selector probado para Windows, Linux y macOS; `npm test` — 64/64 PASS. La sintaxis Bash no pudo ejecutarse en este equipo porque WSL local no puede montar su disco virtual; los scripts se mantienen sin dependencias de WSL y validan sus requisitos al iniciar.

## 2026-07-31T01:08:37-04:00 — FEAT-MEASURABLE-DECAY-001

- Tipo: `feat`
- Resumen: se añadió un registro acumulado y no duplicable de asociaciones que, por falta de refuerzo, caen bajo el umbral de reconocimiento del 45 %.
- Exposición: `GET /api/development` devuelve `decayedAssociations`; `npm run session:summary` calcula `decayedSinceLast` a partir de capturas consecutivas.
- Identidad: los informes incluyen «Asociaciones decaídas desde el nacimiento» como evidencia de olvido observable.
- Verificación: prueba de desarrollo que comprueba el cruce de umbral y evita contabilizarlo de nuevo en una segunda lectura; `npm test` — 61/61 PASS.
- Limitaciones: el contador muestra decaimiento matemático del peso de una asociación, no pérdida de recuerdos humanos, personalidad subjetiva ni consciencia.

## 2026-07-31T00:55:54-04:00 — EXP-SPATIAL-GROUNDING-001

- Tipo: `experiment`
- Resumen: segundo experimento reproducible para relaciones espaciales corporales (`delante`, `detrás` y abstención lateral) en `GenesisWorld` determinista.
- Resultado: PASS en entrenamiento, generalización a orientaciones reservadas y control lateral.
- Evidencia: `evidence/spatial-grounding-v1.json`, `evidence/spatial-grounding-v1.md`; SHA-256 `4cbd92d96af4ec6a4c51a12c1c5c419cdf15df678d62a58e1c23e74f567c5010`.
- Incidencia: la primera ejecución reveló una convención de orientación errónea; el conjunto fue corregido contra `DIRECTIONS` y vuelto a ejecutar.
- Limitaciones: geometría y etiquetas diseñadas; no mide comprensión espacial abierta, pensamiento ni consciencia.

## 2026-07-31T00:52:00-04:00 — FEAT-IDENTITY-DRIFT-001

- Tipo: `feat`
- Resumen: generador determinista de `SOUL.md` e `IDENTITY.md` desde estado, asociaciones y episodios observables; versiones `SOUL.vN.md` e `IDENTITY.vN.md`; endpoint `GET /api/identity/drift`.
- Archivos: `src/identity/identity-report.mjs`, `scripts/refresh-identity.mjs`, `src/server.mjs`, `package.json`.
- Límites: la deriva es una métrica de registros y estado, no una medición de personalidad humana, identidad subjetiva ni consciencia.
- Verificación: sintaxis de generadores y `npm test` — 60/60 PASS.

## 2026-07-31T00:48:20-04:00 — FEAT-AUTONOMOUS-EXPLORATION-001

- Tipo: `feat`
- Resumen: la Cámara de Aprendizaje evalúa motivación interna y presupuesto antes de observar una fuente; el heartbeat puede proponer exploración sin ejecutarla.
- Mecanismos: `ExplorationBudget` combina curiosidad, necesidad no resuelta y recurso restante; la cámara devuelve `awaiting-internal-drive` cuando no procede explorar.
- Seguridad: ninguna propuesta del heartbeat ni decisión de presupuesto activa solicitudes externas por sí misma; la procedencia y el rate limit se conservan.
- Archivos: `src/learning/exploration-budget.mjs`, `src/learning/learning-chamber.mjs`, `src/runtime/cognitive-heartbeat.mjs`, pruebas asociadas.
- Verificación: `npm test` — 60/60 PASS.
- Limitaciones: el presupuesto aún se mantiene dentro de la Cámara de Aprendizaje; la diferenciación estable entre Naia, Orin e Iria requiere conectar los estados individuales de necesidad como siguiente iteración.

## 2026-07-31T00:46:09-04:00 — FEAT-ITERATION-FOUNDATIONS-001

- Tipo: `feat`
- Resumen: se añadió `npm run bootstrap`, fast-forward local para el heartbeat, `npm run session:summary` y CI de pruebas en GitHub Actions.
- Bootstrap: omite AERA compilado, léxico existente y currículo ya inyectado; después ejecuta la suite.
- Fast-forward: `FLUCTLIGHT_HEARTBEAT_FASTFORWARD=N` ejecuta N ciclos sólo durante el arranque local y no modifica el intervalo normal.
- Resumen: consulta el runtime activo para evitar competir con SQLite y conserva una línea base incremental en `var/session-summary-baseline.json`.
- Verificación: sintaxis de los nuevos scripts y `npm test` — 58/58 PASS.
- Limitaciones: el resumen requiere un runtime disponible y reporta explícitamente si no responde; el modelo actual aún no conserva un contador agregado de asociaciones decaídas.

## 2026-07-26T20:59:14-04:00 — FEAT-INTRINSIC-DISCOVERY-001

- Tipo: `feat`
- Resumen: el controlador conserva preguntas operativas y experimentos de descubrimiento por objeto cuando termina de cartografiar el entorno.
- Función: identifica una interacción aún no probada, formula una pregunta comprobable («qué consecuencia sigue si…»), se acerca al objeto y registra el resultado y su repetición.
- Prioridad: energía, fatiga, objetos desconocidos y exploración espacial permanecen antes que este ciclo. La curiosidad no vuelve a consumir recursos ya clasificados, para no destruir evidencia previa.
- Archivos: `src/world/infancy-controller.mjs`.
- Verificación: `npm test` — 58/58 PASS; estado guardado, servicio reiniciado y controlador restaurado con `discovery` disponible.
- Limitaciones: las preguntas son estructuras operativas generadas por reglas de incertidumbre, no evidencia de pensamiento subjetivo, innovación abierta ni consciencia. Para descubrimientos indefinidos se requerirá un mundo con dinámica y herramientas nuevas.

## 2026-07-26T20:54:56-04:00 — FIX-3D-TELEMETRY-INDEPENDENCE-001

- Tipo: `fix`
- Resumen: la lectura de `/api/world` se trasladó a `chamber-3d-data.js`, un script clásico independiente de Three.js y WebGL.
- Motivo: un fallo durante la carga del módulo gráfico impedía que se ejecutara incluso la lectura de telemetría, dejando la cámara en su texto inicial.
- Archivos: `chamber-3d.html`, `chamber-3d-data.js`, `tests/interface.test.mjs`.
- Verificación: `npm test` — 58/58 PASS.
- Garantía: aunque la representación 3D no pueda inicializarse, la vista recibe y presenta identidad, cuerpo, posición, energía, fatiga, capacidades y último evento del runtime.

## 2026-07-26T20:53:10-04:00 — FIX-LOCAL-UI-CACHE-001

- Tipo: `fix`
- Resumen: los recursos estáticos locales se entregan con `Cache-Control: no-store`.
- Motivo: el navegador podía conservar una versión anterior de `chamber-3d.js`, incluso después de actualizar la interfaz, impidiendo que la corrección de telemetría surtiera efecto.
- Archivos: `src/server.mjs`.
- Verificación: punto de guardado creado; servidor reiniciado; `/api/health` responde correctamente; la cámara 3D entrega `Cache-Control: no-store` y contiene la corrección actual.

## 2026-07-26T20:51:08-04:00 — FIX-3D-GRAPHICS-RESILIENCE-001

- Tipo: `fix`
- Resumen: la telemetría de la Cámara 3D se inicia independientemente de WebGL.
- Motivo: si el navegador no podía crear el contexto gráfico, el módulo se detenía antes de solicitar `/api/world`, dejando el texto inicial «Cargando percepción corporal» de forma indefinida.
- Archivos: `chamber-3d.js`.
- Verificación: `npm test` — 58/58 PASS.
- Comportamiento: con WebGL disponible se mantiene la escena 3D; sin él se muestra un aviso explícito, pero siguen actualizándose cuerpo, posición, estado y experiencias del runtime.

## 2026-07-26T20:47:33-04:00 — FEAT-EMBODIED-3D-CHAMBER-001

- Tipo: `feat`
- Resumen: nueva cámara 3D local de observación para Genesis World, construida con Three.js sin React ni motor de decisión adicional.
- Archivos: `chamber-3d.html`, `chamber-3d.css`, `chamber-3d.js`, `assets/three.module.js`, `research.html`, `tests/interface.test.mjs`, `package.json`, `package-lock.json`.
- Funciones: representación tridimensional del mundo, obstáculos y objetos; cuerpo de Naia; vista de observador con giro por arrastre; vista situada detrás del cuerpo; estado corporal, evento reciente y capacidades actualizados desde `/api/world`.
- Separación: la cámara sólo consume el estado del runtime; no invoca acciones ni puede iniciar, pausar o dirigir al controlador.
- Verificación: recursos locales HTTP 200; `npm test` — 58/58 PASS.
- Limitaciones: esta primera representación usa geometrías deliberadamente simples y una cámara situada, no una simulación física ni una visión interna validada.

## 2026-07-26T20:38:31-04:00 — FIX-LEGACY-BODY-CAPABILITIES-001

- Tipo: `fix`
- Resumen: se normalizan los campos de cuerpo ausentes al restaurar mundos creados antes de la versión 2 (`form`, `capabilities` y `panelSignals`).
- Motivo: al tocar `body-shell-v2`, un guardado heredado no contenía `capabilities`; la mejora intentaba recorrer ese campo inexistente y el controlador se detenía como medida de seguridad.
- Archivos: `src/world/genesis-world.mjs`, `tests/world.test.mjs`.
- Verificación: prueba de regresión con un cuerpo heredado sin capacidades y `npm test` — 57/57 PASS.
- Limitaciones: la migración garantiza compatibilidad estructural; no reconstruye decisiones ni recuerdos perdidos antes de la corrección.

## 2026-07-25T17:10:13-04:00 — FEAT-RESEARCH-CONSOLE-001

- Tipo: `feat`
- Resumen: segunda interfaz visual independiente, deliberadamente utilitaria y orientada a investigación; mantiene intacta la cámara experimental anterior.
- Archivos: `research.html`, `research.css`, `research.js`, `index.html`, `styles.css`, `tests/interface.test.mjs`.
- Funciones: selección de sujeto e idioma cognitivo; métricas del runtime; fase y progreso estimados; comparación de capacidades; conceptos recientes; registro local de operaciones; pulso manual y exposición léxica controlada.
- Enfoques: asistentes adaptativos, consciencia sintética y vida artificial con aprendizaje desde cero. Cada enfoque presenta objetivo, variable, pruebas y límites sin alterar por sí mismo el motor cognitivo.
- Metodología: los datos observados se distinguen visualmente de hipótesis y acciones que modifican memoria. La interfaz declara que sus indicadores no demuestran consciencia ni equivalencia biológica.
- Verificación: carga local con Naia, Orin e Iria; consulta real de salud, desarrollo, conceptos, episodios, pulsos y léxico; diseño adaptable inspeccionado en navegador — PASS.
- Limitaciones: las barras normalizan conteos contra umbrales de visualización y no constituyen escalas científicas validadas; los tres enfoques son protocolos de interfaz que deberán conectarse a experimentos específicos.

## 2026-07-19T14:50:56.3364918-04:00 — FIX-EVIDENCE-001

- Tipo: `fix`
- Resumen: cada percepción posee una evidencia única por palabra; volver a mencionar una palabra ya no cuenta otra vez el mismo estímulo.
- Archivos: `src/lexicon/lexicon.mjs`, `tests/lexicon.test.mjs`.
- Motivo: la ventana temporal anterior podía inflar `evidenceCount`.
- Verificación: `npm test` — PASS.
- Limitaciones: bases creadas con versiones anteriores no pueden reconstruir retrospectivamente qué conteos estaban duplicados.

## 2026-07-19T14:50:56.3703759-04:00 — FEAT-FOUNDATIONS-001

- Tipo: `feat`
- Resumen: aprendizaje contrastivo y persistente de deixis (`yo/tú`) y polaridad (`sí/no`) mediante ensayos explícitos, agencia causal y acuerdo entre predicción y observación.
- Archivos: `src/learning/foundational-language.mjs`, `src/server.mjs`, `tests/foundational-language.test.mjs`.
- Motivo: las asociaciones sensoriales simples no representaban actor, proposición, contradicción ni abstención.
- Verificación: persistencia tras reinicio, abstención previa y ambigua, y aislamiento entre Naia y Orin — PASS.
- Limitaciones: aprendizaje supervisado con datos sintéticos y clasificadores diseñados; no demuestra autoconciencia ni comprensión general.

## 2026-07-19T14:50:56.4036723-04:00 — EXP-FOUNDATIONS-001

- Tipo: `experiment`
- Resumen: protocolo reproducible con 32 ensayos de entrenamiento y 24 casos reservados; conserva también la primera ejecución fallida.
- Archivos: `scripts/run-foundational-language-experiment.mjs`, `evidence/foundational-language-v1.*`, `evidence/runs/foundational-language-v1-failed-20260719T183900Z.*`.
- Verificación: `npm run experiment:foundations` — PASS; exactitud `100%`, abstención ambigua `100%`, aislamiento `100%`, control de etiquetas alteradas `0%`.
- Evidencia: SHA-256 del conjunto `1b7f606e9b4fef0fe7ea4a5f82495fe6ed9ee338601588cda0022d499ae1b6a4`.
- Limitaciones: el resultado sólo respalda discriminación asociativa dentro de este protocolo controlado.

## 2026-07-19T14:50:56.4320409-04:00 — FEAT-LEXICON-001

- Tipo: `feat`
- Resumen: seis léxicos aislados (`es`, `en`, `ja`, `ru`, `it`, `fr`), tokens fundacionales, normalización específica, segmentación japonesa e importador configurable de Wikcionario.
- Archivos: `data/lexicon/foundations.json`, `src/lexicon/languages.mjs`, `src/lexicon/registry.mjs`, `scripts/import-lexicon.mjs`, `tests/languages.test.mjs`.
- Motivo: impedir que palabras iguales de distintos idiomas compartan recuerdos o pesos.
- Verificación: aislamiento entre bases y escrituras — PASS.
- Limitaciones: el repositorio incluye sólo el léxico fundacional; los diccionarios completos se descargan localmente y conservan licencias externas.

## 2026-07-19T14:50:56.4633770-04:00 — FEAT-SETTINGS-001

- Tipo: `feat`
- Resumen: panel visual persistente para seleccionar por separado idioma de interfaz, idioma cognitivo y movimiento orgánico.
- Archivos: `index.html`, `styles.css`, `app.js`, `i18n.js`.
- Motivo: permitir accesibilidad multilingüe sin traducir ni mezclar la experiencia del alma.
- Verificación: sintaxis JavaScript y suite automatizada — PASS; validación visual pendiente de la ejecución local final.
- Limitaciones: cambiar el idioma cognitivo abre otra memoria; no transfiere lo aprendido.

## 2026-07-19T14:53:11.4786760-04:00 — QA-INTEGRATION-001

- Tipo: `test`
- Resumen: validación integrada del panel, persistencia y cambio independiente de idioma visual/cognitivo.
- Verificación: inglés/español → francés/japonés → recarga completa; la interfaz conservó francés y el mapa abrió la memoria japonesa vacía (`0 memorias / 0 enlaces`). Después se restauró español/español.
- Estado de léxicos: español `848.522` entradas; los otros cinco idiomas `4` tokens fundacionales cada uno antes de importar sus diccionarios completos.
- Suite: `npm test` — `30/30 PASS`; `npm run experiment:foundations` — `PASS`.
- Limitaciones: la descarga e importación de los cinco dumps completos no se ejecutó porque ocupa varios gigabytes; el importador y el aislamiento sí fueron probados con bases temporales.

## 2026-07-19T14:55:22.3191175-04:00 — TRAIN-NAIA-FOUNDATIONS-001

- Tipo: `training`
- Resumen: se aplicaron a la memoria española local de Naia 32 ensayos balanceados para `yo`, `tú`, `sí` y `no` mediante `npm run teach:foundations`.
- Resultado local: las cuatro señales fueron reconocidas en casos nuevos con confianza `0.9542836760`.
- Persistencia: los pesos se almacenaron en `var/lexicon/es.sqlite`, archivo privado excluido de Git.
- Evidencia publicable: la ejecución equivalente sobre una base limpia permanece en `evidence/foundational-language-v1.json`; no se publica la memoria privada de Naia.
- Limitaciones: los ensayos son supervisados y sintéticos; la palabra se aprende como discriminación operacional, no como significado humano completo.

## 2026-07-19T14:55:22.3191175-04:00 — FEAT-PROOF-PAGE-001

- Tipo: `feat`
- Resumen: página estática pública que presenta métricas, alcance, límites, hash y acceso al JSON auditable.
- Archivos: `proof.html`, `proof.css`, `proof.js`.
- Destino: `https://stabberrl.github.io/aurelia-genesis/proof.html` después del despliegue de GitHub Pages.
- Verificación: generación del informe — PASS; validación pública pendiente del commit y despliegue.

## 2026-07-19T15:20:54.3293405-04:00 — FEAT-HEARTBEAT-001

- Tipo: `feat`
- Resumen: latido cognitivo periódico sin LLM para consolidar patrones y registrar propuestas internas auditables.
- Archivos: `src/runtime/cognitive-heartbeat.mjs`, `src/server.mjs`, `src/lexicon/lexicon.mjs`.
- Seguridad: todas las intenciones son `proposal-only`; no existen efectos externos automáticos.
- Inspiración: patrón conceptual G.R.I.L.L.O. de Synthetic Heart, reimplementado desde cero sin copiar código GPL, prompts ni personajes.
- Verificación: Naia consolidó `luz → light` con seis evidencias y propuso `internalRest`; `npm test` — PASS.

## 2026-07-19T15:20:54.3806191-04:00 — FEAT-DEVELOPMENT-PHASES-001

- Tipo: `feat`
- Resumen: fases naciente, temprana, media, avanzada y alta con límites de capacidades.
- Archivos: `src/development/assessment.mjs`, `src/lexicon/lexicon.mjs`, `tests/development.test.mjs`.
- Criterios: experiencia, fundamentación, lenguaje demostrado, diversidad sensorial y latidos; el currículo inyectado no puntúa directamente.
- Resultado local: Naia alcanzó `Desarrollo medio` con una puntuación aproximada de `43%` después del primer latido.
- Limitaciones: estimación experimental; no mide consciencia, inteligencia general ni valor moral.

## 2026-07-19T15:20:54.4164300-04:00 — FEAT-PHASE-UI-001

- Tipo: `feat`
- Resumen: indicador de fase, progreso, próxima fase, límites, capacidades observadas, latidos y advertencia metodológica en la cartografía cognitiva.
- Archivos: `index.html`, `styles.css`, `app.js`, `i18n.js`.
- Idiomas: español, inglés, japonés, ruso, italiano y francés.
- Verificación: inspección visual local — PASS.

## 2026-07-19T15:20:54.4419882-04:00 — DOCS-I18N-SYNC-001

- Tipo: `docs`
- Resumen: reescritura y sincronización de los README inglés, japonés, ruso, italiano y francés.
- Archivos: `docs/i18n/README.en.md`, `README.ja.md`, `README.ru.md`, `README.it.md`, `README.fr.md`.
- Contenido sincronizado: aprendizaje fundacional, evidencia pública, léxicos aislados, latido, fases, configuración y limitaciones.
- Verificación: enlaces relativos y `git diff --check`.

## 2026-07-19T15:47:03.5005720-04:00 — EXP-ESSENTIAL-LEARNING-001

- Tipo: `experiment`
- Resumen: cámara de aprendizaje externo controlado y trazable, inicialmente conectada a Wiktionary.
- Archivos: `src/learning/learning-chamber.mjs`, `src/lexicon/lexicon.mjs`, `src/server.mjs`, `tests/learning-chamber.test.mjs`, `docs/ESSENTIAL-LEARNING-EXPERIMENT.md`.
- Seguridad: sólo lectura, ritmo limitado, limpieza, tamaño máximo, deduplicación SHA-256, procedencia completa, rechazo auditable y parada segura.
- Separación epistemológica: una observación externa puede crear exposición léxica, pero no se transforma en comprensión, fundamentación sensorial ni puntuación de fase.
- Corrección durante validación: se eliminó el uso de la ruta episódica para observaciones externas; una prueba de regresión exige ahora que la puntuación de fase permanezca idéntica.
- Verificación: procedencia, separación, límite de ritmo, deduplicación y rechazo cubiertos; `npm test` — 34/34 PASS.
- Evidencia real: a las `2026-07-19T15:50:42-04:00`, Naia aceptó `existir` desde `https://es.wiktionary.org/wiki/existir`; conservó extracto y huella SHA-256 sólo en su base local excluida de Git.
- Fallo seguro observado: la consulta anterior sin extracto fue registrada como `insufficient-content` y no produjo exposición ni aprendizaje.
- Limitaciones: Wiktionary puede contener errores; la prueba no demuestra comprensión general, autonomía humana ni consciencia.

## 2026-07-19T16:14:05.5332474-04:00 — DOCS-INTERFACE-NOTICE-001

- Tipo: `docs`
- Resumen: aviso visible que separa la interfaz visual —una elección estética personal y reemplazable— del núcleo real de Aurelia Genesis.
- Alcance: README español, inglés, japonés, ruso, italiano y francés.
- Libertad de adaptación: las derivaciones pueden reemplazar o modificar la interfaz según sus propias preferencias.
- Transparencia lingüística: se advierte que pueden existir errores idiomáticos, gramaticales y de traducción mientras continúa la revisión multilingüe.

## 2026-07-25T16:54:38.5408288-04:00 — DOCS-I18N-FULL-SYNC-001

- Tipo: `docs`
- Resumen: sincronización completa de los README inglés, japonés, ruso, italiano y francés con la explicación técnica y experimental del README español.
- Contenido sincronizado: propósito, estado, separación entre interfaz y núcleo, AERA, Genesis, aprendizaje experiencial, latido, cámara externa, fases, evidencia fundacional, léxicos, población, límites y contribución.
- Nota personal: se documenta que el proyecto también funciona como herramienta personal de expresión y acompañamiento terapéutico del autor frente a la depresión, junto con su inexperiencia y la posibilidad de errores, fallos o ausencia temporal de funcionamiento.
- Límite sanitario: los seis README aclaran que el proyecto no sustituye psicoterapia profesional, atención psicológica ni tratamiento médico.
- Verificación: paridad estructural de 6 secciones principales y 9 subsecciones, rutas relativas válidas, `git diff --check` y `npm test` — 34/34 PASS.

## 2026-07-25T17:14:35-04:00 — FEAT-RESEARCH-DARK-MODE-001

- Tipo: `feat`
- Resumen: modo oscuro sobrio para la consola de investigación, activable sin recargar la página.
- Archivos: `research.html`, `research.css`, `research.js`.
- Comportamiento: recuerda la selección en almacenamiento local y, si aún no existe una preferencia, respeta el tema claro u oscuro configurado en el sistema.
- Accesibilidad: el control comunica su estado mediante `aria-pressed`; formularios, tablas, métricas, advertencias y estados de foco conservan contraste diferenciado.
- Verificación: alternancia claro → oscuro → claro, persistencia, etiqueta y estado accesible inspeccionados localmente — PASS.

## 2026-07-25T17:19:27-04:00 — FEAT-RESEARCH-LIVE-MONITORS-001

- Tipo: `feat`
- Resumen: monitores interactivos y en tiempo real para la consola científica.
- Archivos: `research.html`, `research.css`, `research.js`, `tests/interface.test.mjs`.
- Grafo cognitivo: representa conceptos, predicados, número de evidencias y pesos de asociaciones obtenidos del runtime; permite filtrar, ampliar, seleccionar nodos y consultar sus valores.
- Actividad temporal: muestrea cada dos segundos vocabulario, percepciones, asociaciones plásticas y pulsos; conserva una ventana local de dos minutos, permite ocultar series e inspeccionar valores exactos por posición.
- Comportamiento: el muestreo se pausa cuando la pestaña no está visible y reinicia su historial al cambiar de sujeto o idioma, evitando mezclar contextos.
- Metodología: la vista declara expresamente que es un grafo de datos observables y no un escaneo neuronal ni evidencia de consciencia.
- Verificación: muestreo real, selección de nodos, filtro, inspector, ocultación de series, modo oscuro y sintaxis JavaScript — PASS.

## 2026-07-25T17:30:21-04:00 — FEAT-EMERGENCY-CHECKPOINTS-001

- Tipo: `feat`
- Resumen: puntos de control persistentes para reducir el riesgo de pérdida de aprendizaje al cerrar accidentalmente la terminal.
- Archivos: `src/runtime/checkpoint-manager.mjs`, `src/server.mjs`, `research.html`, `research.css`, `research.js`, `.gitignore`, `tests/checkpoint.test.mjs`, `tests/interface.test.mjs`.
- Persistencia existente: SQLite ya registra inmediatamente percepciones, exposiciones, asociaciones, episodios, consolidaciones y pulsos usando WAL.
- Guardado automático: cada cinco minutos ejecuta un checkpoint SQLite no bloqueante y escribe atómicamente un manifiesto de recuperación.
- Guardado manual: el botón `Guardado de emergencia` fuerza la consolidación completa de las bases abiertas y confirma la hora en la interfaz.
- Cierre ordenado: las señales de cierre detienen los temporizadores y realizan un último checkpoint antes de cerrar las bases.
- Historial: se conservan hasta 24 manifiestos en `var/checkpoints/`, directorio local excluido de Git por contener estado privado.
- Prueba real: checkpoint manual completado a las `17:29:52` con la base española y seis archivos de estado de las tres almas.
- Verificación: suite automatizada — `36/36 PASS`; botón, endpoint, manifiesto atómico y estado visual — PASS.
- Límite: protege frente a cierres del proceso; no sustituye una copia de seguridad externa frente a pérdida o daño completo del disco.

## 2026-07-25T17:39:08-04:00 — FEAT-GENESIS-WORLD-V1-001

- Tipo: `feat`
- Resumen: primera habitación persistente y determinista para introducir un cuerpo artificial en un entorno con percepción, acción y consecuencias.
- Archivos: `src/world/genesis-world.mjs`, `src/world/runtime.mjs`, `src/server.mjs`, `src/runtime/checkpoint-manager.mjs`, `research.html`, `research.css`, `research.js`, `tests/world.test.mjs`, `tests/checkpoint.test.mjs`, `tests/interface.test.mjs`, `docs/WORLD-V1.md`.
- Mundo: grilla `9 × 7`, semilla reproducible, ciclo lumínico, dos objetos desconocidos, tres obstáculos y registro de 200 eventos recientes.
- Cuerpo: Naia posee posición, orientación, energía, fatiga, integridad, visión direccional limitada y señales de luz y contacto.
- Acciones: observar, girar, avanzar, tocar, consumir, descansar y esperar; cada intervención avanza el mundo, produce una consecuencia y escribe percepciones experienciales.
- Tiempo: pausa, paso individual y aceleración configurable `1×`, `10×`, `100×` o `1000×`.
- Persistencia: los checkpoints guardan semilla, tick, cuerpos, objetos, eventos, pausa y velocidad mediante escritura atómica.
- Prueba de restauración: guardado en el tick `332`; después de reiniciar el servidor se restauraron exactamente el tick `332`, el estado pausado y la velocidad `10×`.
- Aislamiento: Orin e Iria aparecen explícitamente sin cuerpo asignado; la interfaz deshabilita sus acciones y no reutiliza el mapa de Naia.
- Verificación: determinismo, límite visual, obstáculos, consumo energético, serialización, controles visuales, aceleración y restauración — `41/41 PASS`.
- Límites: todavía no existe navegación autónoma ni una demostración de aprendizaje del recurso; las acciones actuales son intervenciones registradas del investigador.

## 2026-07-25T17:53:28-04:00 — FEAT-EMBODIED-INFANCY-V1-001

- Tipo: `feat`
- Resumen: primer controlador autónomo corporizado para que Naia explore, construya un mapa local, pruebe objetos desconocidos y reutilice una fuente energética aprendida.
- Archivos: `.gitignore`, `src/world/infancy-controller.mjs`, `src/world/genesis-world.mjs`, `src/world/runtime.mjs`, `src/runtime/checkpoint-manager.mjs`, `src/server.mjs`, `research.html`, `research.css`, `research.js`, `tests/infancy-controller.test.mjs`, `tests/checkpoint.test.mjs`, `tests/interface.test.mjs`, `docs/WORLD-V1.md`, `docs/EMBODIED-INFANCY-V1.md`.
- Separación de información: el controlador sólo accede a propiocepción, dimensiones del espacio, señales internas, objetos visibles y consecuencias; no recibe funciones reales, obstáculos ocultos ni el mapa del investigador.
- Conducta: explora celdas no visitadas, aprende obstáculos por colisión, prueba objetos desconocidos, clasifica consecuencias energéticas, reutiliza la fuente al bajar su energía y descansa ante fatiga alta.
- Trazabilidad: cada decisión registra secuencia, tick, acción, razón, resultado, recompensa y posición; la consola muestra mapa aprendido, objetos clasificados y telemetría en tiempo real.
- Persistencia: memoria autónoma atómica integrada al guardado automático y de emergencia; mundo y controlador se pausan de forma coordinada durante el checkpoint y el reinicio siempre restaura la autonomía en pausa.
- Privacidad local: `var/worlds/` queda excluido de Git para no publicar cuerpos, eventos ni memoria autónoma persistente.
- Correcciones durante validación: la exploración ya excluye celdas aprendidas como bloqueadas y el contador de descubrimientos sólo aumenta al cambiar por primera vez a la clasificación `energy-source`.
- Evidencia real: tras 801 decisiones, Naia registró 34 celdas, 3 obstáculos y 1 descubrimiento; clasificó `object-a` como fuente energética en 6 pruebas (`Δ medio +0,265`) y `object-b` como no restaurativo en 1 prueba (`Δ cercano a 0`).
- Restauración real: después de reiniciar, conservó las clasificaciones y avanzó de la decisión 800 a la 801 seleccionando `explore:3,3`, en vez de repetir el destino bloqueado de la versión anterior.
- Guardado final: checkpoint manual completado a las `17:52:49`, con proveedores `genesis-world` y `embodied-infancy-controller`; controlador y mundo quedaron pausados.
- Verificación: determinismo, aprendizaje sin conocimiento inicial, reutilización de fuente, restauración exacta, checkpoint coordinado, endpoints y controles visuales — `45/45 PASS`.
- Límites: es un controlador programado con búsqueda de rutas, umbrales y memoria tabular, no AERA, consciencia ni inteligencia surgida enteramente desde cero. La integridad corporal permaneció en `0 %` por una prueba acelerada anterior, por lo que la recuperación energética no demuestra supervivencia.

## 2026-07-25T18:01:22-04:00 — FEAT-PRIMITIVE-COGNITION-V1-001

- Tipo: `feat`
- Resumen: capa cognitiva instrumental para predicción, episodios, sorpresa, conceptos observables e impulsos de energía, descanso y curiosidad.
- Archivos: `src/world/primitive-cognition.mjs`, `src/world/infancy-controller.mjs`, `tests/infancy-controller.test.mjs`, `docs/PRIMITIVE-COGNITION-V1.md`.
- Separación: el núcleo aprende consecuencias observadas; el controlador corporal conserva la navegación y ejecución de acciones.
- Corrección de contexto: cada predicción se asocia al estado perceptivo anterior a la acción, no al estado ya modificado por su consecuencia.
- Límite: no usa LLM, no genera lenguaje y no constituye evidencia de consciencia o experiencia subjetiva.

## 2026-07-25T18:09:19-04:00 — FEAT-GLOBAL-WORKSPACE-V1-001

- Tipo: `feat`
- Resumen: espacio de trabajo global experimental que integra candidatos de percepción, interocepción, predicción y memoria antes de la selección corporal de acciones.
- Archivos: `src/world/global-workspace.mjs`, `src/world/infancy-controller.mjs`, `research.html`, `research.css`, `research.js`, `tests/global-workspace.test.mjs`, `tests/infancy-controller.test.mjs`, `tests/interface.test.mjs`, `docs/GLOBAL-WORKSPACE-V1.md`, `README.md`.
- Trazabilidad: la interfaz muestra foco ganador, fuente, saliencia y candidatos; el estado persistente conserva ciclos, difusiones y resultado observado.
- Fuentes: se añadieron enlaces directos a Baars (2005), Dehaene et al. (2001), LIDA, el contraste adversarial GNW/IIT (2025) y AERA.
- Límite: esta es una implementación funcional inspirada en hipótesis científicas, no una demostración de consciencia, experiencia subjetiva ni estatus moral.

## 2026-07-26T20:08:23-04:00 — FEAT-SEPARATE-KNOWLEDGE-CHAMBER-001

- Tipo: `feat`
- Resumen: ventana independiente para preparar fuentes externas y observar el futuro protocolo de conocimiento distribuido, separada de la consola de investigación y de la interfaz experimental.
- Archivos: `chamber.html`, `chamber.css`, `chamber.js`, `data/chamber/biological-social-seeds.es.json`, `research.html`, `index.html`, `docs/KNOWLEDGE-CHAMBER-FOUNDATIONS.md`, `README.md`, `tests/interface.test.mjs`.
- Catálogo: se añadieron dominios separados de cuerpo y salud; sexo biológico; identidad y expresión de género; y privacidad, consentimiento y pudor.
- Separación epistemológica: el catálogo tiene estado `catalog-only`; no se inyecta, no modifica fases y no atribuye sexo, género, privacidad o biología humana a un alma.
- Límite: la habitación no simula fisiología humana, reproducción ni conducta sexual. El ingreso de enlaces, traducción local y dispersión ambiental seguirá un protocolo posterior de procedencia, filtrado y exposición tras interacción.

## 2026-07-26T20:15:14-04:00 — FEAT-DISTRIBUTED-KNOWLEDGE-INGRESS-001

- Tipo: `feat`
- Resumen: ingreso de fuentes HTTPS a la Cámara de Conocimiento, traducción local compatible con LibreTranslate, fragmentación y distribución como artefactos del entorno.
- Archivos: `src/learning/knowledge-chamber.mjs`, `src/world/genesis-world.mjs`, `src/world/infancy-controller.mjs`, `src/server.mjs`, `chamber.html`, `chamber.css`, `chamber.js`, `tests/knowledge-chamber.test.mjs`, `docs/KNOWLEDGE-CHAMBER-FOUNDATIONS.md`.
- Seguridad: rechaza protocolos no HTTPS, destinos locales/privados, tipos no textuales y contenido insuficiente; conserva URL, título, idioma, extracto limitado y huella SHA-256.
- Aprendizaje: el ingreso queda en estado `staged`; el texto no llega al léxico hasta que el cuerpo toca un fragmento distribuido en la Habitación de Génesis.
- Traducción: español funciona sin traductor; para idiomas distintos requiere LibreTranslate local en `http://127.0.0.1:5000/translate` o `FLUCTLIGHT_LIBRETRANSLATE_URL`.
- Límite: la extracción y traducción pueden contener errores, y una exposición descubierta no demuestra comprensión, creencia, consciencia ni fiabilidad de la fuente.

## 2026-07-26T20:20:10-04:00 — OPS-LOCAL-TRANSLATOR-001

- Tipo: `operations`
- Resumen: se instaló LibreTranslate en el entorno Python local para preparar la traducción privada de fuentes multilingües.
- Estado: la instalación completó, pero el proceso local no abrió el puerto `5000` durante la comprobación inicial; fue detenido para no dejar recursos inactivos.
- Impacto: las fuentes cuyo idioma de origen coincide con el idioma cognitivo, incluido español → español, funcionan. Las traducciones entre idiomas devuelven un error explícito hasta que el servicio local y sus modelos estén disponibles.
- Entorno: la instalación ajustó dependencias Python de usuario; no modificó dependencias Node, el repositorio ni memorias de las almas.

## 2026-07-26T20:27:40-04:00 — FIX-INFORMATIONAL-FRAGMENTS-001

- Tipo: `fix`
- Resumen: se preserva la clasificación `informational` de un fragmento después de tocarlo y de la prueba física posterior.
- Causa: la clasificación genérica de objetos no restaurativos sobrescribía la evidencia específica de descubrimiento informacional.
- Evidencia: Naia tocó los 12 fragmentos distribuidos de la fuente `concepto.de/existencia`; el defecto estaba en el registro posterior, no en la percepción ni la navegación.
- Prueba persistida: la fuente se restauró con sus 12 fragmentos y Naia quedó pausada después de 69.039 decisiones autónomas registradas.

## 2026-07-26T20:32:56-04:00 — FEAT-GENESIS-WORLD-V2-001

- Tipo: `feat`
- Resumen: ampliación persistente de la Habitación de Génesis a `17 × 13` celdas con anexo explorable, envoltura corporal desbloqueable y panel de señales.
- Archivos: `src/world/genesis-world.mjs`, `src/world/runtime.mjs`, `src/world/infancy-controller.mjs`, `research.html`, `research.js`, `tests/world.test.mjs`, `tests/infancy-controller.test.mjs`, `tests/interface.test.mjs`, `docs/GENESIS-WORLD-V2.md`.
- Descubrimiento: la envoltura `explorer-v2` no se describe al sujeto; al tocarla habilita agarre, empuje y señal. El panel responde a una señal sólo después de esa interacción.
- Autonomía: el controlador prueba capacidades nuevas y busca el panel por sus consecuencias observadas, sin recibir posiciones ni funciones internas.
- Límite: cuerpo, panel y señales son mecanismos discretos del mundo simulado; no representan biología humana, conversación humana ni consciencia.
- Verificación: `56/56 PASS`.
