# MCP Codex CLI - Development Guide

## 開発環境セットアップ

```bash
# リポジトリクローン
git clone https://github.com/suwa-sh/mcp-codex-cli
cd mcp-codex-cli

# 依存関係インストール
npm install

# 開発モード実行（ホットリロード）
npm run dev
```

## 開発コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発モード実行（tsx --watch、Node.js v20.6.0+） |
| `npm run build` | 開発ビルド + shebang追加 |
| `npm run build:prod` | プロダクションビルド |
| `npm run lint` | Biomeリント実行 |
| `npm run lint:fix` | リント自動修正 |
| `npm run format` | コードフォーマット |
| `npm test` | 全テスト実行（unit + integration） |
| `npm run test:unit` | スキーマ検証テスト実行（高速） |
| `npm run test:integration` | 統合テスト実行（Codex CLI必須） |

## コード品質基準

- **TypeScript Strict Mode**: 有効（tsconfig.json）
- **Linting Rules**: Biome recommended規則
- **Formatting**: 2スペースインデント、LF改行
- **Test Strategy**: 
  - **Unit Tests**: Chatツール用Zodスキーマ検証（高速、0.27秒）
  - **Integration Tests**: 実際のCodex CLI連携（ハッピーパス）
  - **Test Runner**: Node.js内蔵テストランナー

## パッケージ公開手順

### リリース前チェックリスト

#### コード品質確認
```bash
# 1. 依存関係の整合性確認
npm audit
npm outdated

# 2. コード品質チェック
npm run lint
npm run format

# 3. ビルド実行
npm run build:prod

# 4. 型チェック
npx tsc --noEmit

# 5. テスト実行
npm run test:unit      # 高速スキーマ検証
npm run test:integration  # Codex CLI統合テスト
```

#### 機能テスト
```bash
# ローカルテスト
node dist/index.js --help

# MCPクライアント統合テスト
# Claude Desktop等で実際にchatツールが動作することを確認
```

### バージョニング

```bash
# セマンティックバージョニング
# Major: 破壊的変更（例: 1.0.0 → 2.0.0）
# Minor: 新機能追加（例: 1.0.0 → 1.1.0）  
# Patch: バグ修正（例: 1.0.0 → 1.0.1）

# バージョンアップ例
npm version patch    # パッチバージョンアップ
npm version minor    # マイナーバージョンアップ
npm version major    # メジャーバージョンアップ

# 手動でpackage.jsonを編集も可能
```

### Git管理

```bash
# 変更をステージング
git add .

# コミット（npm versionで自動作成される場合もあり）
git commit -m "Release v0.1.1: バグ修正とパフォーマンス改善"

# タグとブランチをプッシュ
git push origin main --tags
```

### npm公開

```bash
# npm アカウント確認
npm whoami

# ログイン（必要に応じて）
npm login

# パッケージ情報確認
npm pack --dry-run

# 公開実行
npm publish

# 公開確認
npm info mcp-codex-cli
```

### 公開後検証

```bash
# インストールテスト
npx mcp-codex-cli@latest --allow-install

# MCPクライアントでの動作確認
# Claude Desktop等での統合テスト

# ドキュメント更新確認
# README.md、ARCHITECTURE.mdが最新版に対応していること
```

### リリースノート作成

GitHub Releasesでリリースノートを作成：
- バージョン番号とタグの一致確認
- 変更点の明記（Added, Changed, Fixed, Removed）
- 破壊的変更がある場合は明確に記載
- アップグレード手順（必要に応じて）

## トラブルシューティング

### よくある問題

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| "codex not found" エラー | Codex CLI未インストール | `--allow-install`フラグ使用 |
| 認証エラー | OpenAI認証未設定 | `OPENAI_API_KEY`設定または`codex auth login` |
| ビルドエラー | TypeScript型エラー | `npx tsc --noEmit`で詳細確認 |
| 統合テスト失敗 | Codex CLI認証/設定問題 | `codex auth login`で認証確認 |
| テストハング | インタラクティブモード | 非インタラクティブモード専用 |
| MCP接続エラー | 標準入出力問題 | クライアント設定確認 |

### デバッグ方法

```bash
# 開発モードでのデバッグ
npm run dev

# Codex CLI直接テスト
codex "Hello World"

# MCP通信ログ確認（クライアント側）
# Claude Desktop: Developer Tools → Console

# Node.jsデバッグ
node --inspect dist/index.js
```

## 関連ドキュメント

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: システムアーキテクチャと設計
- **[README.md](./README.md)**: プロジェクト概要とクイックスタート
- **[CLAUDE.md](./CLAUDE.md)**: Claude Code 用の開発ガイダンス