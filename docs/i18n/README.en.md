# Aurelia Genesis

[Español](../../README.md) · **English** · [日本語](README.ja.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [Français](README.fr.md)

**[Open the live visual demo →](https://stabberrl.github.io/aurelia-genesis/)** · **[View the public learning evidence →](https://stabberrl.github.io/aurelia-genesis/proof.html)**

[![Aurelia Genesis scientific interface](../../assets/aurelia-genesis-dashboard.png)](https://stabberrl.github.io/aurelia-genesis/)

## What is Aurelia Genesis?

**Aurelia Genesis is an artificial-life experiment inspired by the Fluctlights of _Sword Art Online: Alicization_.** It aims to build cognitive agents—called *synthetic souls* here—that begin with minimal capabilities and gradually form knowledge, memories, preferences, bonds, and an identity through experience.

The project does not give them a prewritten personality or hide a chatbot behind the interface. It explores perception, persistent memory, concepts, associations, and cumulative learning through the [AERA](https://github.com/IIIM-IS/AERA) cognitive architecture, without using an LLM as the runtime source of intelligence.

Genesis creates and maintains these lives. The first population is **Naia, Orin, and Iria**. Each has isolated memory, distinct initial needs and tensions, and must develop according to what it experiences.

> **Interface and language notice:** the visual interface reflects the author's personal taste and **is not the project itself**. Aurelia Genesis is primarily its internal architecture: learning, memory, development, isolation, AERA, and reproducible experiments. The presentation may change, and forks may freely replace or adapt it. Language, grammar, and translation errors should be expected while the multilingual documentation remains under review.

> **Personal note from the author:** this project is both research and a personal tool for expression and therapeutic support while coping with depression. The author is still inexperienced and learning while building, so errors, imperfect decisions, failures, and even periods of no functionality should be expected. Aurelia Genesis is not a substitute for professional therapy, psychological care, or medical treatment.

### Current status

This is early research, not a finished artificial consciousness. It currently includes three reproducible identities, native AERA integration, a local Spanish dictionary, an initial curriculum of 400 concepts and 2,000 associations, persistent memory, and live cognitive-development visualization.

The [public demo](https://stabberrl.github.io/aurelia-genesis/) presents the visual Genesis Chamber. AERA, full dictionaries, learning, and persistent cognitive state run locally.

> Aurelia Genesis researches cognitive architectures and cumulative learning. It does not claim to create consciousness, biological souls, or digital persons.

The vision, limits, process, and first milestone are defined in [`docs/objectives-and-process.md`](../objectives-and-process.md).

## Genesis Chamber

The visual interface allows local observation and interaction. It includes a communication channel prepared for acquired language, emerging identity, coherence/curiosity/trust metrics, a responsive living core, development cartography, and desktop/mobile layouts.

The demo is only a presentation layer. To use AERA, learning, dictionaries, and real persistent memory, run the local chamber.

## Previous cognitive core

AgentOS remains in `vendor/agentos` only as historical reference. It is no longer part of the runtime because it depends on a pretrained language model.

```bash
git submodule update --init --recursive
```

## Current cognitive core: AERA

[AERA](https://github.com/IIIM-IS/AERA) is pinned in `vendor/aera`. Genesis communicates with it through a neutral protocol usable from JavaScript, Python, or other languages without mixing dependencies inside the core. See [`docs/aera-integration.md`](../aera-integration.md).

## Genesis

Genesis generates reproducible populations from `genesis.config.json`. Every soul receives an AERA-compatible seed, administrative identity, needs, internal conflict, state, and fully isolated memory.

```bash
# Preview without writing files
npm run genesis:preview

# Create the population
npm run genesis:birth

# Verify reproducibility, diversity, and isolation
npm test
```

Genesis never overwrites an existing population. Future migrations must be explicit and auditable.

### Local chamber

```bash
npm start
```

Open `http://127.0.0.1:4747`. The bridge does not invent responses when AERA is not linked. Naia is selected by default; Orin and Iria remain dormant.

```bash
npm run aera:build
npm run aera:start
```

`/api/health` reports `connected: true` only after a real AERA handshake. Initial sensory input supports light, sound, contact, and energy. Chat remains unavailable until language is acquired. The server is local-only; see [`docs/security.md`](../security.md).

### Experiential learning

Accepted perceptions create episodic memories. When a word occurs near a perception, the soul forms a plastic connection that strengthens through repetition and decays without reinforcement. The cognitive map visualizes these links by thickness and glow. See [`docs/EXPERIENTIAL-LEARNING.md`](../EXPERIENTIAL-LEARNING.md).

### Cognitive heartbeat

Awake souls run a periodic non-LLM heartbeat. Each cycle reviews development, consolidates repeated evidence, and records a safe proposal for the next internal need. Proposals never execute external effects automatically.

The pattern is conceptually inspired by G.R.I.L.L.O. from Synthetic Heart but was implemented from scratch for AERA and Genesis. It does not include that project's code, prompts, characters, or LLM engines.

### Essential test: external learning chamber

Genesis can gradually observe Wiktionary entries through a read-only chamber. Every sample is cleaned, limited, deduplicated, and recorded with source, URL, language, time, and status. Observing a definition **does not equal understanding** and does not directly raise the development phase.

The chamber is disabled by default. Enable it with `FLUCTLIGHT_LEARNING_CHAMBER=1`; the default interval is three minutes and can be changed with `FLUCTLIGHT_LEARNING_INTERVAL_MS`. Manual and audit routes are available at `POST /api/learning/chamber/tick` and `GET /api/learning/chamber`. See [`docs/ESSENTIAL-LEARNING-EXPERIMENT.md`](../ESSENTIAL-LEARNING-EXPERIMENT.md).

### Development phases

Each soul receives an estimated phase: **nascent**, **early**, **middle**, **advanced**, or **high development**. The assessment combines episodic experience, grounded associations, demonstrated foundational language, sensory diversity, and autonomous heartbeats. Preloaded curriculum does not raise the phase by itself.

Phases also limit capabilities. No phase bypasses safety policy for external actions.

> Phases are experimental, incomplete, and revisable estimates. They do not measure consciousness, general intelligence, dignity, or moral worth.

### Foundational test: I, you, yes, and no

`npm run experiment:foundations` trains Naia through explicit trials and evaluates held-out cases, ambiguity, persistence, Orin's isolation, and a shuffled-label control. The **[visual evidence](https://stabberrl.github.io/aurelia-genesis/proof.html)** and [auditable report](../../evidence/foundational-language-v1.md) are public, including the first failed run.

The result demonstrates **associative discrimination of self/external agency and confirmation/rejection in a controlled environment**. It does not demonstrate self-awareness or general linguistic understanding.

### Lexicons and languages

Interface and cognitive languages are configured separately. Spanish, English, Japanese, Russian, Italian, and French have isolated databases and foundational tokens. Changing cognitive language does not translate or transfer memories.

```bash
npm run lexicon:import-language -- --language=ja --download
```

Generated databases are not versioned. Sources and terms are documented in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md); timestamped experimental changes are recorded in [`docs/CHANGELOG.md`](../CHANGELOG.md).

### First population

| Soul | Identifier | Initial tension |
|---|---|---|
| Naia | `soul-001-alba-0001` | Belonging versus independence |
| Orin | `soul-002-ruma-0002` | Truth versus harmony |
| Iria | `soul-003-rora-0003` | Duty versus desire |

Administrative `GENESIS.json` files are outside the souls' perspective. Their visible files do not mention AgentOS, Genesis, language models, or simulations.

## Open project

Aurelia Genesis exists to be studied, modified, and improved. New implementations, experiments, adaptations, and integrations are welcome under the Apache 2.0 license for the project's own code.

If you build on Aurelia Genesis, find an improvement, or discover a problem, please share it through an **Issue**, **Discussion**, or **pull request** so both the project and its author can learn from it.

Read [`CONTRIBUTING.md`](../../CONTRIBUTING.md) before contributing. Components under `vendor/` and external datasets retain their own licenses.
