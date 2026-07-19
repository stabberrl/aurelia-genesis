# Aurelia Genesis

[Español](README.md) · [English](docs/i18n/README.en.md) · [日本語](docs/i18n/README.ja.md) · [Русский](docs/i18n/README.ru.md) · [Italiano](docs/i18n/README.it.md) · [Français](docs/i18n/README.fr.md)

**[Abrir la demostración visual en vivo →](https://stabberrl.github.io/aurelia-genesis/)**

[![Interfaz científica de Aurelia Genesis](assets/aurelia-genesis-dashboard.png)](https://stabberrl.github.io/aurelia-genesis/)

La versión pública demuestra la interfaz y la visualización orgánica. AERA, el diccionario local y la memoria cognitiva persistente requieren ejecutar el proyecto localmente.

Entorno experimental para desarrollar agentes cognitivos sintéticos persistentes y fundamentados en experiencia mediante AERA.

> Aurelia Genesis investiga arquitecturas cognitivas y aprendizaje acumulativo. No afirma crear consciencia, almas biológicas ni personas digitales.

La visión, los límites, el proceso de desarrollo y el alcance del primer hito están definidos en [`docs/objectives-and-process.md`](docs/objectives-and-process.md). Este documento es la referencia principal antes de introducir nuevas funciones o cambiar la arquitectura.

## Cámara de Génesis

La primera etapa es una interfaz visual local para observar e interactuar con la Fluctlight. Incluye:

- diálogo interactivo;
- nombre e identidad emergente;
- métricas internas de coherencia, curiosidad y confianza;
- recuerdos persistentes almacenados en el navegador;
- un núcleo visual que responde al contacto;
- diseño adaptable a escritorio y dispositivos móviles.

Para probarla, abre `index.html` en un navegador moderno. No requiere instalación ni servidor.

> Este prototipo utiliza respuestas locales sencillas. Su objetivo es validar la experiencia y el modelo de interacción antes de conectar un núcleo cognitivo real.

## Núcleo cognitivo anterior

AgentOS se conserva en `vendor/agentos` únicamente como referencia histórica. Ya
no forma parte del camino de ejecución porque depende de un modelo lingüístico
preentrenado.

Para recuperar la dependencia después de clonar Fluctlight:

```bash
git submodule update --init --recursive
```

## Núcleo cognitivo actual: AERA

[AERA](https://github.com/IIIM-IS/AERA) está fijado en `vendor/aera`. Genesis se
comunica con él mediante un protocolo neutral que puede ser utilizado desde
JavaScript, Python u otros lenguajes sin cargar sus dependencias dentro del
núcleo. La arquitectura y el estado de compilación están en
`docs/aera-integration.md`.

## Genesis

Genesis genera poblaciones reproducibles a partir de `genesis.config.json`. Cada alma recibe una semilla compatible con AERA, identidad administrativa, necesidades, conflicto interno, estado y memoria completamente aislada.

```bash
# Ver quién nacería sin escribir archivos
npm run genesis:preview

# Ejecutar un nacimiento real
npm run genesis:birth

# Comprobar reproducibilidad, diversidad y aislamiento
npm test
```

Genesis nunca sobrescribe una población existente. Para preservar una vida, cualquier migración futura deberá hacerse con una herramienta explícita y auditable.

### Cámara local

Inicia la Cámara y el traductor cognitivo con:

```bash
npm start
```

Después abre `http://127.0.0.1:4747`. El puente no inventa respuestas si AERA no
está enlazado. Naia está seleccionada por defecto; Orin e Iria permanecen dormidos.

Para construir e iniciar el núcleo nativo:

```bash
npm run aera:build
npm run aera:start
```

El estado `/api/health` muestra `connected: true` únicamente después de completar
el handshake real con AERA. La entrada inicial admite luz, sonido, contacto y
energía como magnitudes; el chat permanece desactivado hasta que exista lenguaje
adquirido.

El servidor está limitado al equipo local. Los riesgos conocidos de dependencias
y sus mitigaciones están documentados en `docs/security.md`.

### Primera población

| Alma | Identificador | Tensión inicial |
|---|---|---|
| Naia | `soul-001-alba-0001` | Pertenencia frente a independencia |
| Orin | `soul-002-ruma-0002` | Verdad frente a armonía |
| Iria | `soul-003-rora-0003` | Deber frente a deseo |

Los archivos administrativos `GENESIS.json` no forman parte de la perspectiva de las almas. Los archivos que sí reciben no mencionan AgentOS, Genesis, modelos de lenguaje ni simulaciones.

## Proyecto abierto

Aurelia Genesis existe para ser estudiado, modificado y mejorado. Se permiten nuevas implementaciones, experimentos, adaptaciones e integraciones conforme a la licencia Apache 2.0 del código propio del proyecto.

Si construyes algo a partir de Aurelia Genesis, encuentras una mejora o descubres un problema, por favor comunícalo mediante un **Issue**, una **Discussion** o un **pull request** en GitHub. La intención no es controlar las derivaciones, sino aprender de ellas y permitir que sus avances puedan beneficiar también al proyecto original y a su creador.

Consulta [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de proponer cambios. Los componentes bajo `vendor/` y los conjuntos de datos externos conservan sus propias licencias; la licencia de Aurelia Genesis no las sustituye.
