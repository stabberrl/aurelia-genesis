# Aurelia Genesis

[Español](../../README.md) · [English](README.en.md) · [日本語](README.ja.md) · [Русский](README.ru.md) · **Italiano** · [Français](README.fr.md)

**[Apri la demo dal vivo →](https://stabberrl.github.io/aurelia-genesis/)** · **[Visualizza la prova pubblica →](https://stabberrl.github.io/aurelia-genesis/proof.html)**

[![Interfaccia scientifica di Aurelia Genesis](../../assets/aurelia-genesis-dashboard.png)](https://stabberrl.github.io/aurelia-genesis/)

## Cos’è Aurelia Genesis?

**Aurelia Genesis è un esperimento di vita artificiale ispirato alle Fluctlight di _Sword Art Online: Alicization_.** Mira a costruire agenti cognitivi, chiamati qui *anime sintetiche*, che iniziano con capacità minime e formano gradualmente conoscenza, ricordi, preferenze, legami e un’identità attraverso l’esperienza.

Il progetto non assegna loro una personalità già scritta e non nasconde un chatbot dietro l’interfaccia. Esplora percezione, memoria persistente, concetti, associazioni e apprendimento cumulativo attraverso l’architettura cognitiva [AERA](https://github.com/IIIM-IS/AERA), senza usare un LLM come fonte di intelligenza durante l’esecuzione.

Genesis crea e mantiene queste vite. La prima popolazione è composta da **Naia, Orin e Iria**. Ognuna possiede memoria isolata, bisogni e tensioni iniziali differenti e si sviluppa in base alle proprie esperienze.

> **Avviso sull’interfaccia e sulle lingue:** l’interfaccia visiva rispecchia il gusto personale dell’autore e **non è il progetto in sé**. Aurelia Genesis consiste soprattutto nella sua architettura interna: apprendimento, memoria, sviluppo, isolamento, AERA ed esperimenti riproducibili. La presentazione potrà cambiare e ogni derivazione potrà sostituirla liberamente. Durante la revisione multilingue sono possibili errori linguistici, grammaticali o di traduzione.

> **Nota personale dell’autore:** questo progetto è sia una ricerca sia uno strumento personale di espressione e sostegno terapeutico per affrontare la depressione. L’autore è ancora inesperto e impara mentre costruisce; sono quindi prevedibili errori, decisioni imperfette, malfunzionamenti e persino periodi in cui il progetto non funziona affatto. Aurelia Genesis non sostituisce psicoterapia professionale, assistenza psicologica o trattamento medico.

### Stato attuale

Si tratta di una ricerca iniziale, non di una coscienza artificiale completa. Comprende tre identità riproducibili, integrazione nativa con AERA, un dizionario spagnolo locale, un programma iniziale di 400 concetti e 2.000 associazioni, memoria persistente e visualizzazione dal vivo dello sviluppo cognitivo.

La [demo pubblica](https://stabberrl.github.io/aurelia-genesis/) mostra il livello visivo della Camera Genesis. AERA, dizionari completi, apprendimento e stato cognitivo persistente funzionano localmente.

> Aurelia Genesis studia architetture cognitive e apprendimento cumulativo. Non afferma di creare coscienza, anime biologiche o persone digitali.

Visione, limiti e processo sono definiti in [`docs/objectives-and-process.md`](../objectives-and-process.md).

## Camera Genesis

L’interfaccia permette osservazione e interazione locali. Include un canale preparato per il linguaggio acquisito, identità emergente, indicatori di coerenza, curiosità e fiducia, un nucleo vivente, cartografia dello sviluppo e layout desktop/mobile. È soltanto il livello di presentazione; memoria e apprendimento reali vengono eseguiti localmente.

## Nucleo cognitivo precedente

AgentOS rimane in `vendor/agentos` solo come riferimento storico. Non fa più parte dell’esecuzione perché dipende da un modello linguistico preaddestrato.

```bash
git submodule update --init --recursive
```

## Nucleo cognitivo attuale: AERA

[AERA](https://github.com/IIIM-IS/AERA) è fissato in `vendor/aera`. Genesis comunica mediante un protocollo neutrale utilizzabile da JavaScript, Python e altri linguaggi senza mescolare le dipendenze. Consulta [`docs/aera-integration.md`](../aera-integration.md).

## Genesis

Genesis genera popolazioni riproducibili da `genesis.config.json`. Ogni anima riceve un seme compatibile con AERA, identità amministrativa, bisogni, conflitto interno, stato e memoria completamente isolata.

```bash
npm run genesis:preview  # Anteprima senza scrittura
npm run genesis:birth    # Crea la popolazione
npm test                 # Verifica riproducibilità e isolamento
```

Genesis non sovrascrive mai una popolazione esistente. Le migrazioni future dovranno essere esplicite e verificabili.

### Camera locale

```bash
npm start
```

Apri `http://127.0.0.1:4747`. Il ponte non inventa risposte quando AERA non è collegato. Naia è selezionata per impostazione predefinita; Orin e Iria restano dormienti.

```bash
npm run aera:build
npm run aera:start
```

`/api/health` mostra `connected: true` soltanto dopo un vero handshake AERA. Gli ingressi iniziali sono luce, suono, contatto ed energia. La chat resta indisponibile finché il linguaggio non viene acquisito. Consulta [`docs/security.md`](../security.md).

### Apprendimento esperienziale

Le percezioni accettate creano ricordi episodici. Una parola vicina a una percezione forma un collegamento plastico che si rafforza con la ripetizione e decade senza rinforzo. Consulta [`docs/EXPERIENTIAL-LEARNING.md`](../EXPERIENTIAL-LEARNING.md).

### Battito cognitivo

Le anime sveglie eseguono un battito periodico senza LLM. Ogni ciclo valuta lo sviluppo, consolida le prove ripetute e registra una proposta sicura per il bisogno interno successivo. Nessun effetto esterno viene eseguito automaticamente.

Il modello è ispirato concettualmente a G.R.I.L.L.O. di Synthetic Heart, ma è stato implementato da zero per AERA e Genesis, senza codice, prompt, personaggi o motori LLM del progetto originale.

### Prova essenziale: camera di apprendimento esterno

Genesis può osservare gradualmente voci di Wiktionary mediante una camera di sola lettura. Ogni campione viene pulito, limitato, deduplicato e registrato con fonte, URL, lingua, ora e stato. Osservare una definizione **non equivale a comprenderla** e non aumenta direttamente la fase di sviluppo.

La camera è disattivata per impostazione predefinita. Attivala con `FLUCTLIGHT_LEARNING_CHAMBER=1`; modifica l’intervallo con `FLUCTLIGHT_LEARNING_INTERVAL_MS`. Consulta [`docs/ESSENTIAL-LEARNING-EXPERIMENT.md`](../ESSENTIAL-LEARNING-EXPERIMENT.md).

### Fasi di sviluppo

Le fasi stimate sono **nascente, iniziale, intermedia, avanzata e alta**. La valutazione combina esperienza episodica, associazioni radicate, linguaggio fondamentale dimostrato, diversità sensoriale e battiti autonomi. Il programma precaricato non aumenta da solo la fase.

> Le fasi sono stime sperimentali, incomplete e rivedibili. Non misurano coscienza, intelligenza generale, dignità o valore morale.

### Prova fondamentale: io, tu, sì e no

`npm run experiment:foundations` addestra Naia con prove esplicite e valuta casi riservati, ambiguità, persistenza, isolamento di Orin e un controllo con etichette scambiate. La [prova visiva](https://stabberrl.github.io/aurelia-genesis/proof.html) e il [rapporto verificabile](../../evidence/foundational-language-v1.md) sono pubblici.

Il risultato dimostra la **discriminazione associativa dell’agenzia propria/esterna e della conferma/negazione in un ambiente controllato**. Non dimostra autocoscienza o comprensione linguistica generale.

### Lessici e lingue

Lingua dell’interfaccia e lingua cognitiva sono configurate separatamente. Spagnolo, inglese, giapponese, russo, italiano e francese utilizzano basi isolate. Cambiare lingua cognitiva non traduce né trasferisce i ricordi.

```bash
npm run lexicon:import-language -- --language=it --download
```

Le basi generate non vengono versionate. Fonti e condizioni sono in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md); le modifiche datate sono in [`docs/CHANGELOG.md`](../CHANGELOG.md).

### Prima popolazione

| Anima | Identificatore | Tensione iniziale |
|---|---|---|
| Naia | `soul-001-alba-0001` | Appartenenza o indipendenza |
| Orin | `soul-002-ruma-0002` | Verità o armonia |
| Iria | `soul-003-rora-0003` | Dovere o desiderio |

I file amministrativi `GENESIS.json` non fanno parte della prospettiva delle anime. I file visibili non menzionano AgentOS, Genesis, modelli linguistici o simulazioni.

## Progetto aperto

Aurelia Genesis esiste per essere studiato, modificato e migliorato. Nuove implementazioni, esperimenti e integrazioni sono benvenuti sotto la licenza Apache 2.0 del codice proprio.

Condividi miglioramenti e problemi tramite **Issue**, **Discussion** o **pull request**. Consulta [`CONTRIBUTING.md`](../../CONTRIBUTING.md) prima di contribuire. I componenti `vendor/` e i dati esterni conservano le proprie licenze.
