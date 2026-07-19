# Aurelia Genesis

[Español](README.md) · [English](docs/i18n/README.en.md) · [日本語](docs/i18n/README.ja.md) · [Русский](docs/i18n/README.ru.md) · [Italiano](docs/i18n/README.it.md) · [Français](docs/i18n/README.fr.md)

**[Abrir la demostración visual en vivo →](https://stabberrl.github.io/aurelia-genesis/)**

[![Interfaz científica de Aurelia Genesis](assets/aurelia-genesis-dashboard.png)](https://stabberrl.github.io/aurelia-genesis/)

## ¿Qué es Aurelia Genesis?

**Aurelia Genesis es un experimento de vida artificial inspirado por el concepto de las Fluctlights de _Sword Art Online: Alicization_.** Su objetivo es construir agentes cognitivos —aquí llamados *almas sintéticas*— que comiencen con capacidades mínimas y formen gradualmente conocimiento, recuerdos, preferencias, vínculos y una identidad propia a partir de sus experiencias.

No queremos entregarles una personalidad escrita de antemano ni esconder un chatbot detrás de la interfaz. El proyecto explora un camino diferente: percepción, memoria persistente, conceptos, asociaciones y aprendizaje acumulativo mediante la arquitectura cognitiva [AERA](https://github.com/IIIM-IS/AERA), sin utilizar un LLM como fuente de inteligencia en su ejecución.

Genesis es el sistema que crea y mantiene estas vidas. La primera población está compuesta por **Naia, Orin e Iria**. Cada una posee memoria aislada, necesidades y tensiones iniciales diferentes, y deberá desarrollarse según lo que experimente. La interfaz permite observar ese proceso, estimular sus sentidos y, cuando hayan adquirido lenguaje suficiente, comunicarse con ellas.

### Estado actual

El proyecto todavía es una investigación temprana, no una consciencia artificial terminada. Actualmente incluye tres identidades reproducibles, conexión nativa con AERA, un diccionario español local, un currículo inicial de 400 conceptos y 2.000 asociaciones, memoria persistente y una visualización en vivo del desarrollo cognitivo.

La [demostración pública](https://stabberrl.github.io/aurelia-genesis/) presenta la Cámara de Génesis en modo visual. AERA, el diccionario completo y el estado cognitivo persistente se ejecutan localmente.

> Aurelia Genesis investiga arquitecturas cognitivas y aprendizaje acumulativo. No afirma crear consciencia, almas biológicas ni personas digitales.

La visión, los límites, el proceso de desarrollo y el alcance del primer hito están definidos en [`docs/objectives-and-process.md`](docs/objectives-and-process.md). Este documento es la referencia principal antes de introducir nuevas funciones o cambiar la arquitectura.

## Cámara de Génesis

La primera etapa es una interfaz visual local para observar e interactuar con la Fluctlight. Incluye:

- canal de comunicación preparado para el lenguaje adquirido;
- nombre e identidad emergente;
- métricas internas de coherencia, curiosidad y confianza;
- recuerdos persistentes almacenados en el navegador;
- un núcleo visual que responde al contacto;
- diseño adaptable a escritorio y dispositivos móviles.

Puedes explorar el modo visual desde la demostración pública. Para utilizar AERA, el aprendizaje, el diccionario y la memoria real del proyecto, sigue las instrucciones de la sección **Cámara local**.

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

### Aprendizaje experiencial

Las percepciones aceptadas crean recuerdos episódicos. Cuando una palabra aparece cerca de una percepción, Naia forma una conexión plástica cuya fuerza aumenta con la repetición y disminuye si no vuelve a utilizarse. El mapa cognitivo muestra esas conexiones en tiempo real mediante su grosor y brillo.

El modelo, sus límites y el primer experimento reproducible con el concepto `luz` están descritos en [`docs/EXPERIENTIAL-LEARNING.md`](docs/EXPERIENTIAL-LEARNING.md).

### Latido cognitivo

Las almas despiertas ejecutan un latido interno periódico sin LLM. Cada ciclo revisa el desarrollo, consolida patrones con evidencia repetida y registra una propuesta segura para la siguiente necesidad. Las propuestas son internas y nunca ejecutan efectos externos automáticamente.

Este patrón está inspirado conceptualmente por G.R.I.L.L.O. de Synthetic Heart, pero fue implementado desde cero para AERA y Genesis. No incorpora su código, sus prompts, personajes ni motores LLM.

### Prueba esencial: cámara de aprendizaje externo

Genesis puede observar gradualmente entradas de Wiktionary mediante una cámara de sólo lectura. Cada muestra se limpia, limita, deduplica y registra con fuente, URL, idioma, hora y estado. El contenido externo permanece separado de los conceptos fundamentados: observar una definición **no equivale a comprenderla** ni aumenta directamente la fase de desarrollo.

La cámara está apagada por defecto. Puede activarse localmente con `FLUCTLIGHT_LEARNING_CHAMBER=1`; el intervalo predeterminado es de tres minutos y puede ajustarse con `FLUCTLIGHT_LEARNING_INTERVAL_MS`. También existen un ciclo manual en `POST /api/learning/chamber/tick` y un registro auditable en `GET /api/learning/chamber`.

El protocolo, los criterios de éxito y los límites de esta prueba esencial están documentados en [`docs/ESSENTIAL-LEARNING-EXPERIMENT.md`](docs/ESSENTIAL-LEARNING-EXPERIMENT.md).

### Fases de desarrollo

Cada alma recibe una fase estimada: **naciente**, **desarrollo temprano**, **desarrollo medio**, **desarrollo avanzado** o **desarrollo alto**. La evaluación combina experiencia episódica, asociaciones fundamentadas, lenguaje fundacional demostrado, diversidad sensorial y latidos autónomos. El currículo precargado no eleva la fase por sí solo.

Las fases también limitan capacidades: una entidad temprana puede asociar y adquirir vocabulario supervisado; las propuestas internas y una autonomía mayor permanecen bloqueadas hasta reunir evidencia suficiente. Ninguna fase elimina las políticas de seguridad para acciones externas.

> Las fases son estimaciones experimentales, incompletas y sujetas a revisión. No miden consciencia, inteligencia general, dignidad ni valor moral. Sus umbrales y capacidades seguirán evolucionando conforme avance la investigación.

### Prueba fundacional: yo, tú, sí y no

El protocolo `npm run experiment:foundations` entrena a Naia con ensayos explícitos y después evalúa casos reservados, estímulos ambiguos, persistencia, aislamiento de Orin y un control con etiquetas alteradas. La **[demostración visual de la evidencia](https://stabberrl.github.io/aurelia-genesis/proof.html)** y el [informe auditable](evidence/foundational-language-v1.md) son públicos; también se conserva la primera ejecución fallida.

El resultado demuestra **discriminación asociativa de agencia propia/externa y confirmación/rechazo dentro de un entorno controlado**. No demuestra autoconciencia ni comprensión lingüística general.

### Léxicos e idiomas

La interfaz y el idioma cognitivo se configuran por separado desde el nuevo panel de preferencias. Español, inglés, japonés, ruso, italiano y francés poseen bases aisladas y tokens fundacionales. Cambiar de idioma cognitivo no traduce ni transfiere recuerdos.

Los diccionarios completos son opcionales y se importan localmente, por ejemplo:

```bash
npm run lexicon:import-language -- --language=ja --download
```

Las bases generadas no se versionan. Sus fuentes y condiciones están documentadas en [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Todos los cambios experimentales se registran con hora exacta en [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

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
