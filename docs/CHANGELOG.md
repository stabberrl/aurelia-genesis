# Diario técnico de cambios

Registro cronológico append-only. Las horas utilizan `America/Santiago` (`UTC-04:00`). Una entrada describe el momento en que el bloque fue verificado; no pretende reconstruir una hora anterior.

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
