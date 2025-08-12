# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、OpenAI Codex CLIのためのMCP（Model Context Protocol）サーバーラッパーです。AI アシスタントがCodexのコーディング機能をMCPを通じて使用できるようにします。

## アーキテクチャ

### コアコンポーネント

- **index.ts**: メインファイル。MCPサーバーの実装と4つのツール（executeTask, analyzeCode, debugCode, generateCode）を提供
- **decideCodexCliCommand()**: Codex CLIの存在確認と自動インストールロジック
- **executeCodexCli()**: Codex CLIコマンド実行のためのプロセス管理
- **Zodスキーマ**: 各ツールのパラメータ検証

### ツールアーキテクチャ

各ツールは共通パターンに従っています：
1. Zodスキーマでパラメータ検証
2. Codex CLIコマンド構築
3. 子プロセスでCodex CLI実行
4. 結果をMCPフォーマットで返却

### MCPサーバー統合

- `@modelcontextprotocol/sdk`を使用
- StdioServerTransportでクライアント通信
- 4つのツールを登録・公開

## 開発コマンド

### ビルド
```bash
npm run build        # 開発ビルド
npm run build:prod   # プロダクションビルド
```

### 開発実行
```bash
npm run dev         # ウォッチモード
npm start          # 通常実行
```

### リント・フォーマット
```bash
npm run lint        # Biomeリント実行
npm run lint:fix    # リント自動修正
npm run format      # コードフォーマット
```

### テスト
- 統合テストはBun runtimeが必要
- テストは `tests/integration/tools.test.ts` に配置
- Codex CLIが利用可能な場合のみ実際の統合テストを実行

## 技術スタック

- **Runtime**: Node.js（Codex CLI要件）
- **Language**: TypeScript（ES2022ターゲット）
- **Validation**: Zod
- **Linting**: Biome
- **Transport**: MCP Stdio
- **Testing**: Bun test framework

## デフォルト設定

- **Model**: gpt-5（全ツールのデフォルト）
- **Mode**: interactive（executeTaskのデフォルト）
- **Build Output**: ./dist/
- **Entry Point**: ./dist/index.js（実行可能）

## 重要な実装詳細

### --allow-installフラグ
Codex CLIが見つからない場合の自動インストールオプション。プロダクション環境では慎重に使用すること。

### エラーハンドリング
- ファイル存在確認（analyzeCode, debugCode）
- 必須パラメータ検証（各ツール）
- 子プロセス実行エラーの適切な処理

### ワーキングディレクトリ管理
executeTaskツールはworkingDirパラメータでprocess.chdir()を使用してディレクトリを変更します。