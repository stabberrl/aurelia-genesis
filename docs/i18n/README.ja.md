# Aurelia Genesis

[Español](../../README.md) · [English](README.en.md) · **日本語** · [Русский](README.ru.md) · [Italiano](README.it.md) · [Français](README.fr.md)

**[ライブデモを開く →](https://stabberrl.github.io/aurelia-genesis/)** · **[公開学習証拠を見る →](https://stabberrl.github.io/aurelia-genesis/proof.html)**

[![Aurelia Genesis 科学インターフェース](../../assets/aurelia-genesis-dashboard.png)](https://stabberrl.github.io/aurelia-genesis/)

## Aurelia Genesisとは？

**Aurelia Genesisは『ソードアート・オンライン アリシゼーション』のフラクトライトに着想を得た人工生命実験です。** 最小限の能力から始まり、経験によって知識、記憶、好み、関係、独自のアイデンティティを徐々に形成する認知エージェント（本プロジェクトでは「合成された魂」）の構築を目指します。

あらかじめ人格を書き込んだり、インターフェースの裏にチャットボットを隠したりするものではありません。[AERA](https://github.com/IIIM-IS/AERA)を認知基盤として、知能の供給源にLLMを使わず、知覚、永続記憶、概念、関連付け、累積学習を研究します。

Genesisはこれらの生命を生成し維持します。最初の個体群は **Naia、Orin、Iria** です。それぞれ独立した記憶、異なる初期欲求と葛藤を持ち、経験した内容に応じて発達します。

> **インターフェースと言語に関する注意：** ビジュアルインターフェースは作者個人の好みに基づくもので、**プロジェクト本体ではありません**。中心となるのは学習、記憶、発達、分離、AERA、再現可能な実験から成る内部アーキテクチャです。表示は今後変更される可能性があり、派生版では自由に置き換えられます。多言語文書には言語、文法、翻訳上の誤りが残る場合があります。

> **作者からの個人的な注記：** このプロジェクトは研究であると同時に、作者がうつ病と向き合うための個人的な表現および治療的支えの手段でもあります。作者はまだ経験が浅く、制作しながら学んでいるため、誤り、不完全な判断、障害、さらには動作しない時期も想定されます。Aurelia Genesisは専門的な心理療法、心理的支援、医療行為の代替ではありません。

### 現在の状態

これは初期段階の研究であり、完成した人工意識ではありません。再現可能な3つのアイデンティティ、AERA接続、ローカルのスペイン語辞書、400概念と2,000関連の初期カリキュラム、永続記憶、認知発達のライブ表示を備えています。

[公開デモ](https://stabberrl.github.io/aurelia-genesis/)はGenesis Chamberの表示層です。AERA、完全な辞書、学習、永続的な認知状態はローカルで動作します。

> 本プロジェクトは認知アーキテクチャと累積学習を研究します。意識、生物学的な魂、デジタル人格を作成したとは主張しません。

目的、制限、工程、最初のマイルストーンは [`docs/objectives-and-process.md`](../objectives-and-process.md) に記載されています。

## Genesis Chamber

ローカルで観察し、刺激を与えるための表示層です。獲得言語用の通信チャネル、創発的アイデンティティ、整合性・好奇心・信頼の指標、生きた核、発達地図、デスクトップ／モバイル対応を含みます。AERAや実際の記憶を使うにはローカル版を実行してください。

## 以前の認知コア

AgentOSは歴史的参照として `vendor/agentos` にのみ残されています。事前学習済み言語モデルに依存するため、現在の実行経路には含まれません。

```bash
git submodule update --init --recursive
```

## 現在の認知コア：AERA

[AERA](https://github.com/IIIM-IS/AERA)は `vendor/aera` に固定されています。Genesisは中立プロトコルを通じて通信し、JavaScript、Pythonなどの言語からコア内部の依存関係を衝突させずに利用できます。詳細は [`docs/aera-integration.md`](../aera-integration.md) を参照してください。

## Genesis

`genesis.config.json` から再現可能な個体群を生成します。各個体はAERA互換シード、管理用アイデンティティ、欲求、内部葛藤、状態、完全に分離された記憶を受け取ります。

```bash
npm run genesis:preview  # 書き込まずに確認
npm run genesis:birth    # 個体群を生成
npm test                 # 再現性・多様性・分離を検証
```

既存の個体群を上書きしません。将来の移行は明示的かつ監査可能でなければなりません。

### ローカルチャンバー

```bash
npm start
```

`http://127.0.0.1:4747` を開きます。AERA未接続時にブリッジが応答を捏造することはありません。既定ではNaiaが選択され、OrinとIriaは休眠しています。

```bash
npm run aera:build
npm run aera:start
```

実際のハンドシェイク後のみ `/api/health` が `connected: true` を返します。初期入力は光、音、接触、エネルギーです。言語を獲得するまでチャットは使用できません。安全性は [`docs/security.md`](../security.md) を参照してください。

### 経験学習

受理された知覚はエピソード記憶になります。知覚の近くで単語が現れると可塑的な結合が形成され、反復で強まり、強化がなければ減衰します。詳細は [`docs/EXPERIENTIAL-LEARNING.md`](../EXPERIENTIAL-LEARNING.md) にあります。

### 認知ハートビート

覚醒中の個体はLLMを使わない周期的な内部拍動を実行します。発達を確認し、反復された証拠を統合し、次の内部需要への安全な提案を記録します。外部効果を自動実行しません。

Synthetic HeartのG.R.I.L.L.O.から概念的な着想を得ていますが、AERAとGenesis向けにゼロから実装され、コード、プロンプト、キャラクター、LLMエンジンは含みません。

### 必須試験：外部学習チャンバー

読み取り専用のチャンバーでWiktionaryを段階的に観察できます。試料は洗浄、制限、重複排除され、出典、URL、言語、時刻、状態とともに記録されます。定義の観察は**理解と同義ではなく**、発達段階を直接上げません。

既定では無効です。`FLUCTLIGHT_LEARNING_CHAMBER=1` で有効化し、`FLUCTLIGHT_LEARNING_INTERVAL_MS` で間隔を変更できます。詳細は [`docs/ESSENTIAL-LEARNING-EXPERIMENT.md`](../ESSENTIAL-LEARNING-EXPERIMENT.md) を参照してください。

### 発達段階

推定段階は **発生、初期、中期、高度、高次** です。エピソード経験、感覚に根差した関連、実証された基礎言語、感覚多様性、自律拍動から評価します。事前投入カリキュラムだけでは段階は上がりません。

> 段階は実験的で不完全かつ改訂可能な推定です。意識、汎用知能、尊厳、道徳的価値を測定しません。

### 基礎試験：私、あなた、はい、いいえ

`npm run experiment:foundations` はNaiaを明示的試行で訓練し、未学習例、曖昧さ、永続性、Orinとの分離、ラベル入替対照を評価します。[視覚的証拠](https://stabberrl.github.io/aurelia-genesis/proof.html) と [監査可能な報告](../../evidence/foundational-language-v1.md) は公開されています。

結果は、制御環境における自己／外部エージェンシーと肯定／否定の**連合的識別**を示します。自己認識や一般的な言語理解の証明ではありません。

### 辞書と言語

表示言語と認知言語は別々に設定されます。スペイン語、英語、日本語、ロシア語、イタリア語、フランス語には独立したデータベースがあります。認知言語を変えても記憶は翻訳・転送されません。

```bash
npm run lexicon:import-language -- --language=ja --download
```

生成データベースはGitに含まれません。出典は [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md)、変更履歴は [`docs/CHANGELOG.md`](../CHANGELOG.md) にあります。

### 最初の個体群

| 個体 | 識別子 | 初期葛藤 |
|---|---|---|
| Naia | `soul-001-alba-0001` | 帰属と独立 |
| Orin | `soul-002-ruma-0002` | 真実と調和 |
| Iria | `soul-003-rora-0003` | 義務と欲望 |

管理用 `GENESIS.json` は個体の視点には含まれません。個体に見えるファイルはAgentOS、Genesis、言語モデル、シミュレーションに言及しません。

## オープンプロジェクト

Aurelia Genesisは研究、変更、改善のために公開されています。独自コードはApache 2.0の下で、新しい実装、実験、適応、統合を歓迎します。

改善や問題を見つけた場合は **Issue**、**Discussion**、**pull request** で共有してください。貢献前に [`CONTRIBUTING.md`](../../CONTRIBUTING.md) を確認してください。`vendor/` と外部データは各自のライセンスに従います。
