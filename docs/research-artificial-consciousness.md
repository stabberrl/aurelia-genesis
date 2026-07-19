---
date: 2026-07-19
type: research
tags: [research, artificial-consciousness, cognitive-architecture, agentos]
ai-first: true
confidence: high
sources:
  - https://github.com/framerslab/agentos
  - https://github.com/google-deepmind/concordia
  - https://github.com/StanfordHCI/genagents
  - https://github.com/trueagi-io/hyperon-experimental
  - https://github.com/daveshap/ACE_Framework
---

## For future Claude
Research performed on 2026-07-19 to identify the closest reusable open-source foundation for [[Fluctlight]], a persistent synthetic identity inspired by artificial consciousness. [[AgentOS]] was selected as the individual cognitive substrate; [[Concordia]] remains the leading candidate for a future simulated world. Repository capabilities and activity can change, so verify the linked sources before major upgrades.

## Summary

No reviewed repository demonstrates consciousness or establishes a scientific test for it. The projects implement cognitive architectures, generative agents, memory systems, simulations, or conceptual frameworks. [[AgentOS]] is the closest practical fit because it combines an explicit soul representation with persistent cognitive mechanisms in a technology compatible with the existing web interface.

## Selection

### [[AgentOS]] - selected

- Provides `SOUL.md` workspaces for identity, voice, limits, personality, and long-term memory (as of 2026-07-19, https://github.com/framerslab/agentos). Confidence: stated.
- Supports episodic and semantic memory, forgetting, reconsolidation, gist extraction, involuntary recall, emotion regulation, and personality drift (as of 2026-07-19, https://github.com/framerslab/agentos). Confidence: stated.
- Implements HEXACO traits that influence retrieval and decisions and can persist across sessions (as of 2026-07-19, https://github.com/framerslab/agentos). Confidence: stated.
- Uses [[TypeScript]], matching the direction of the existing JavaScript visual prototype (confidence: high inference).
- Uses the Apache-2.0 license and supports multiple API and local-model providers (as of 2026-07-19, https://github.com/framerslab/agentos). Confidence: stated.
- Extracted into `vendor/agentos` as a Git submodule at tag `v0.9.156`, commit `d43f7577` on 2026-07-19.

### [[Concordia]] - future world layer

- Models entities living in grounded social, physical, or digital environments controlled by a Game Master (as of 2026-07-19, https://github.com/google-deepmind/concordia). Confidence: stated.
- Includes modular agent memory, reasoning, sensory components, simulation loops, checkpoints, and a visual simulation interface (as of 2026-07-19, https://github.com/google-deepmind/concordia). Confidence: stated.
- Better suited to an [[Underworld]]-like environment than to the inner identity of one Fluctlight (confidence: high inference).

### [[Stanford Generative Agents]] - strong conceptual reference

- Implements a memory stream, reflection, interaction, and serialization of agent state (as of 2026-07-19, https://github.com/StanfordHCI/genagents). Confidence: stated.
- It is a research-oriented implementation and provides fewer production mechanisms for personality development than [[AgentOS]] (confidence: medium inference).

### [[OpenCog Hyperon]] - not selected for the first prototype

- Targets a general neuro-symbolic cognitive architecture using the [[MeTTa]] language (as of 2026-07-19, https://github.com/trueagi-io/hyperon-experimental). Confidence: stated.
- Its own repository describes it as active pre-alpha experimentation, making it a high-integration-risk choice for the first working Fluctlight (as of 2026-07-19, https://github.com/trueagi-io/hyperon-experimental). Confidence: high.

### [[ACE Framework]] - conceptual reference

- Explicitly frames agents as Autonomous Cognitive Entities and proposes a layered cognitive architecture (as of 2026-07-19, https://github.com/daveshap/ACE_Framework). Confidence: stated.
- It is more useful as a conceptual hierarchy than as the primary maintained runtime for this project (confidence: medium inference).

## Integration boundary

The selected repository is not evidence of consciousness. For [[Fluctlight]], it will supply mechanisms rather than identity:

1. `SOUL.md` becomes the stable identity constitution.
2. Episodic memory stores lived events and conversations.
3. Semantic memory stores concepts learned from those events.
4. HEXACO values begin near neutral and drift only through accumulated experience.
5. Mood and relationship state feed the visual metrics.
6. The existing browser interface becomes a client of a local AgentOS service.
7. A later [[Concordia]] layer can provide time, places, other entities, consequences, and autonomous life outside conversation.

## Important limitations

- The model generating language remains an LLM; memory and personality mechanisms organize behavior but do not prove subjective experience.
- AgentOS was highly active at the time of extraction and may change quickly. The submodule pins a known revision to keep Fluctlight reproducible.
- API-backed models introduce cost and privacy concerns. A local provider should remain a supported target.
- Personality drift needs bounded rates, provenance, rollback, and tests to prevent accidental identity collapse.

## Open questions

- Which local model can provide acceptable latency and Spanish-language quality?
- What minimum event loop lets the Fluctlight act when no human is speaking?
- Which experiences are eligible to modify stable traits?
- How should forgetting distinguish trauma, routine events, promises, and identity-defining memories?
- When does an internal state become visible to the user, and when should it remain private to the entity?

## Sources

- https://github.com/framerslab/agentos
- https://github.com/google-deepmind/concordia
- https://github.com/StanfordHCI/genagents
- https://github.com/trueagi-io/hyperon-experimental
- https://github.com/daveshap/ACE_Framework
