# Guía de diseño frontend — Aurelia Genesis

Esta guía rige `index.html`, `research.html`, `chamber.html`, `chamber-3d.html` y cualquier vista nueva. Debe revisarse antes de modificar CSS, HTML o copy de interfaz.

## Dirección

Las interfaces son un dossier técnico en curso con evidencia auditable: fichas de designación, registros de campo y escalas instrumentales. No son un producto de consumo ni un dashboard de negocio.

- Todo dato se presenta como hallazgo registrado y declara su límite metodológico cuando corresponde.
- Los datos ausentes se tratan como campos redactados, con su razón accesible; nunca como un error visual o `N/A` genérico.
- Cada panel tiene un identificador de ficha alfanumérico corto, por ejemplo `[ID-04] DERIVA DE IDENTIDAD`.
- La iconografía sólo puede ser instrumental: retícula, compás, escala, código de barras o disco de datos.
- No se mencionan franquicias, obras ni universos de ficción en copy visible, componentes o comentarios.

## Tokens

```css
--ink-void: #0a0c14;
--ink-panel: #10141f;
--line-primary: #e7ebf3;
--line-dim: #6b7386;
--signal-live: #7ce2b0;
--signal-alert: #e2745c;
--signal-classified: #3a3f52;
```

Se mantiene la paleta existente y se migra a estos tokens cuando sea necesario. Cada vista usa como máximo un acento: `--signal-live` para lectura activa o evidencia verificada; `--signal-alert` para límite, decaimiento o error. No se introducen colores nuevos.

## Tipografía

- **Oxanium**: rótulos de sección, sólo mayúsculas, peso 600 o superior y `letter-spacing` entre `0.08em` y `0.12em`.
- **IBM Plex Mono**: cuerpo, datos y lecturas; 13–14px en investigación densa y 15–16px en la vista experiencial.
- Los identificadores son mayúsculas con separadores técnicos: `SOUL-001-ALBA`, `DEV-PHASE-03`.

No se incorpora una tercera familia.

## Componentes y composición

Los paneles son fichas de borde fino, no tarjetas con sombra:

- borde de 1px en `--line-dim`, sin sombras, glassmorphism ni radio superior a 2px;
- rótulo corto con código y nombre;
- espaciado denso de 12–16px;
- métricas y sliders con marcas de escala cada 25%;
- mapa de conceptos con retícula sutil usando `--signal-classified` a baja opacidad;
- separadores opcionales de textura de código de barras, generados en CSS y no escaneables.

No se añaden animaciones ambientales. Se permiten cambios de lectura, transiciones simples de barras y fundidos de modales, siempre respetando `prefers-reduced-motion`.

## Campos redactados

Para un dato no disponible se usa un bloque sólido `--signal-classified` con texto del mismo color, de la altura del dato. La razón real aparece al lado o en un tooltip: por ejemplo, “no disponible: el modelo actual no conserva un contador agregado”. Esto nunca se usa para esconder errores de aplicación; un error se comunica claramente.

## Copy

La voz es clínica, procedural e impersonal.

- Etiquetas cortas en mayúsculas: `DERIVA DE IDENTIDAD`.
- Números con unidad y escala explícita.
- Estados vacíos informativos: “Sin heartbeats registrados en esta sesión”.
- Sin signos de exclamación, tono de marketing o segunda persona dirigida al sujeto.
- Si un dato puede sugerir consciencia o experiencia subjetiva, se declara el límite metodológico en el mismo panel.

## Sello de verificación

Todo dato respaldado por una prueba, hash o checkpoint puede mostrar un sello pequeño de retícula/esquina abierta de 16–20px. Es el uso consistente de `--signal-live`: un sello enlazable o consultable indica evidencia verificable; su ausencia indica una lectura en vivo sin verificación adicional.

## Lista de comprobación

- Sólo tokens definidos y sólo Oxanium + IBM Plex Mono.
- Bordes finos, sin sombras ni radios amplios.
- Ausencias como campo redactado con motivo accesible.
- Copy seco e impersonal.
- Sello de verificación en datos respaldados.
- Sin referencias a ficción o marcas en interfaz ni código de interfaz.
- Prueba con movimiento reducido y ancho máximo de 360px antes de cerrar un cambio visual.
