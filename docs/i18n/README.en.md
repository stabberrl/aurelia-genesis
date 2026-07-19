# Aurelia Genesis

[Español](../../README.md) · **English** · [日本語](README.ja.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [Français](README.fr.md)

**[Open the live visual demo →](https://stabberrl.github.io/aurelia-genesis/)**

[![Aurelia Genesis scientific interface](../../assets/aurelia-genesis-dashboard.png)](https://stabberrl.github.io/aurelia-genesis/)

## What is Aurelia Genesis?

**Aurelia Genesis is an artificial-life experiment inspired by the Fluctlights of _Sword Art Online: Alicization_.** It aims to build cognitive agents—called *synthetic souls* within the project—that begin with minimal capabilities and gradually form knowledge, memories, preferences, relationships, and an identity through experience.

The goal is not to prescribe a complete personality or hide a chatbot behind the interface. Aurelia explores perception, persistent memory, concepts, associations, and cumulative learning through the [AERA](https://github.com/IIIM-IS/AERA) cognitive architecture, without using an LLM as the source of intelligence at runtime.

Genesis creates and maintains the first population: **Naia, Orin, and Iria**. Each has isolated memory and different initial needs and internal tensions. The interface lets observers follow their development, provide sensory stimuli, and—once they have acquired enough language—communicate with them.

### Current status

This is early-stage research, not a finished artificial consciousness. The project currently provides three reproducible identities, a native AERA bridge, a local Spanish dictionary, an initial curriculum of 400 concepts and 2,000 associations, persistent memory, and a live cognitive-development visualization.

The [public demo](https://stabberrl.github.io/aurelia-genesis/) presents the Genesis Chamber in visual mode. AERA, the complete local dictionary, and persistent cognitive state require running the project locally.

> Aurelia Genesis researches cognitive architectures and cumulative learning. It does not claim to create consciousness, biological souls, or digital persons.

## Current capabilities

- Three reproducible and isolated identities: Naia, Orin, and Iria.
- Native AERA bridge without an LLM in the execution path.
- Local Spanish lexicon, gradual lexical exposure, and sensory grounding.
- A 400-concept basic curriculum with 2,000 semantic associations for Naia.
- Live scientific interface and observable cognitive development map.
- Interface localization for Spanish, English, Japanese, Russian, Italian, and French.

The souls' cognitive lexicon is currently Spanish-only. Interface localization does not imply multilingual cognition.

```bash
git submodule update --init --recursive
npm install
npm test
npm start
```

Open `http://127.0.0.1:4747`. AERA build instructions are in [the integration guide](../aera-integration.md).

## Contributing

You are welcome to study, modify, fork, and extend Aurelia Genesis under Apache 2.0. Please share meaningful discoveries through GitHub Issues, Discussions, or pull requests so they can also improve the original project. See [CONTRIBUTING.md](../../CONTRIBUTING.md).
