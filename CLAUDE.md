# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

このプロジェクトは、OpenAI の Codex CLI 用の MCP（Model Context Protocol）サーバーラッパーです。AI アシスタントが非インタラクティブな exec モードでのみ、MCP を通じて Codex のコーディング機能を使用できる単一の `chat` ツールを提供します。

## アーキテクチャ

### コアコンポーネント

- **index.ts**: MCP サーバーと単一の `chat` ツールを含むメイン実装
- **decideCodexCliCommand()**: Codex CLI の検出と自動インストールロジック
- **executeCodexCli()**: プロセス管理による Codex CLI コマンド実行
- **ChatParametersSchema**: パラメータ検証用の Zod スキーマ

### ツールアーキテクチャ

`chat` ツールは以下のパターンに従います：
1. Zod スキーマでパラメータ検証（prompt, approvalLevel, model, workingDir）
2. exec モードと適切なフラグで Codex CLI コマンド構築
3. Codex CLI で子プロセス実行
4. 結果を MCP フォーマットで返却

**重要な実装詳細:**
- 常に `exec` モード（非インタラクティブ）を使用
- デフォルト承認レベル: `auto-edit`
- デフォルトモデル: `gpt-5`
- `process.chdir()` による作業ディレクトリ変更をサポート

### MCP サーバー統合

- StdioServerTransport で `@modelcontextprotocol/sdk` を使用
- すべてのコーディングタスク用に単一の `chat` ツールを登録
- 自然言語プロンプトを通じてコード生成、リファクタリング、解析、デバッグを処理

## 開発コマンド

### ビルド・実行
```bash
npm run build        # shebang 注入付き開発ビルド
npm run build:prod   # プロダクションビルド
npm run dev          # tsx によるウォッチモード
npm start           # 通常実行
```

### 品質・テスト
```bash
npm run lint        # Biome リンター
npm run lint:fix    # リントエラーの自動修正
npm run format      # コードフォーマット
npm run test        # 全テスト実行（unit + integration）
npm run test:unit   # 高速スキーマ検証テストのみ
npm run test:integration  # Codex CLI 統合テスト
```

### 開発テスト
```bash
node --import tsx test-dev.js  # chat 関数の直接テスト
codex -m gpt-5 exec "task"     # Codex CLI の直接テスト
```

## 技術スタック

- **ランタイム**: Node.js 22+（Codex CLI 要件）
- **言語**: ES2022 ターゲットの TypeScript
- **検証**: Zod スキーマ
- **リント・フォーマット**: Biome
- **テスト**: Node.js 内蔵テストランナー
- **トランスポート**: MCP Stdio
- **ビルド**: shebang 注入付き TypeScript コンパイラー

## 重要な実装ノート

### 非インタラクティブモードのみ
以下の理由でインタラクティブモードのサポートを削除するようにリファクタリングされました：
- MCP ツールは TTY アクセスのないバックグラウンドプロセスとして実行される
- LLM は CLI プロンプトとリアルタイムで対話できない
- MCP ツール実行には exec モードのみが実行可能

### テスト戦略
- **ユニットテスト**: 高速な Zod スキーマ検証（約 0.2 秒）
- **統合テスト**: 実際の Codex CLI 実行（約 3-18 秒）
- **開発テスト**: 直接関数テスト用の `test-dev.js`

### GitHub Actions
重複公開を防ぐバージョンチェック付きで、main ブランチプッシュ時の自動 npm 公開。