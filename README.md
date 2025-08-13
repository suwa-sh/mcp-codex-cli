# MCP Codex CLI

[![npm version](https://badge.fury.io/js/mcp-codex-cli.svg)](https://www.npmjs.com/package/mcp-codex-cli)
[![Publish to npm](https://github.com/suwa-sh/mcp-codex-cli/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/suwa-sh/mcp-codex-cli/actions/workflows/npm-publish.yml)

OpenAI の Codex CLI のシンプルな MCP サーバーラッパーです。AI アシスタントが Model Context Protocol を通じて Codex の機能を使用できるようにします。

## 前提条件

- OpenAI API キーまたは ChatGPT Plus/Pro/Team アカウント
- Node.js 22+（Codex CLI の要件）
- `--allow-npx` オプションで、Codex CLI をローカルにインストールせずに利用できます

## 🚀 Quick Start with Claude Code

### 1. Add the MCP server

```bash
# Codex CLI がローカルにインストールされている場合
claude mcp add -s project codex-cli -- npx mcp-codex-cli

# Codex CLI をnpx経由で使用する場合（推奨）
claude mcp add -s project codex-cli -- npx mcp-codex-cli --allow-npx
```

## 🔧 Installation Options

### Option 1: NPX with allow-npx flag (推奨)

Codex CLI をローカルにインストールする必要なし：

```json
{
  "mcpServers": {
    "mcp-codex-cli": {
      "command": "npx",
      "args": ["mcp-codex-cli", "--allow-npx"]
    }
  }
}
```

### Option 2: Global installation

```bash
# Codex CLI をグローバルインストール
npm install -g @openai/codex

# Claude Desktop設定
{
  "mcpServers": {
    "mcp-codex-cli": {
      "command": "npx",
      "args": ["mcp-codex-cli"]
    }
  }
}
```

### Option 3: Local project installation

```bash
npm install -g mcp-codex-cli

{
  "mcpServers": {
    "mcp-codex-cli": {
      "command": "mcp-codex-cli",
      "args": ["--allow-npx"]
    }
  }
}
```

## 🛠️ Available Tools

### chat

あらゆるコーディングタスクを非インタラクティブモードで実行します。

**パラメータ：**

- `prompt`（必須）：実行するタスクの説明
- `approvalLevel`（オプション）："auto-edit"（ファイル読み取り/書き込み、デフォルト）、"full-auto"（完全自動）
- `model`（オプション）：使用するモデル（デフォルト："gpt-5"）
- `workingDir`（オプション）：タスク用の作業ディレクトリ

## 💡 Example Usage

### chat

```typescript
// コンポーネントのリファクタリング
chat({ 
  prompt: "UserDashboard コンポーネントをクラスコンポーネントの代わりに React hooks を使うようリファクタリング",
  approvalLevel: "auto-edit",
  workingDir: "./src/components"
});

// コード分析
chat({
  prompt: "./src/utils/auth.ts ファイルで JWT トークンのバリデーションはどのように動作しますか？"
});

// デバッグ
chat({
  prompt: "TypeError: Cannot read property 'length' of undefined というエラーがフォーム送信時のユーザー入力バリデーション関数で発生しています。./src/components/UserForm.tsx を確認してデバッグしてください。"
});

// コード生成
chat({
  prompt: "バリアント（primary、secondary、danger）とサイズ（small、medium、large）を持つ再利用可能な Button コンポーネントを TypeScript + React で ./src/components/Button.tsx に作成してください",
  model: "gpt-5"
});
```

## ⚙️ Configuration

### Environment Variables

Codex CLI の認証を設定：

```bash
# オプション1：OpenAI API キー
export OPENAI_API_KEY=your_api_key_here

# オプション2：ChatGPT アカウントを使用
# --allow-npx使用時は初回実行時に自動でサインインプロンプトが表示されます
# ローカルインストール時は以下を実行:
codex auth login
```

### --allow-npx オプション

`--allow-npx` フラグを使用すると：

- Codex CLI をローカルにインストールする必要がありません
- 自動的に `npx @openai/codex` を使用して実行します
- 信頼されていないディレクトリでも動作します（`--skip-git-repo-check` を自動追加）
- 常に最新バージョンのCodex CLIを使用できます

### Default Model

すべてのツールは **gpt-5** をデフォルトモデルとして使用します（Codex CLI の現在のデフォルト）。任意のツール呼び出しで `model` パラメータを指定してこれを上書きできます：

- `gpt-5`（デフォルト）
- `gpt-4.1`
- `gpt-4.1-mini`
- `o1`
- `o1-mini`

### Approval Levels

- **auto-edit**：ファイルの読み取りと書き込み；シェルコマンドには承認が必要（デフォルト）
- **full-auto**：完全に自動実行（注意して使用）

## 🚨 トラブルシューティング

### "Not inside a trusted directory" エラー

`--allow-npx` オプションを使用していればこのエラーは自動的に回避されます。手動で解決する場合：

```bash
# 信頼できるディレクトリとしてマーク
codex trust .

# または--skip-git-repo-checkを使用
codex --skip-git-repo-check exec "your task"
```

### 認証エラー

```bash
# OpenAI API キーを設定
export OPENAI_API_KEY=your_api_key_here

# またはChatGPTアカウントでログイン
codex auth login
```

## 🔗 Related Links

- [Model Context Protocol（MCP）](https://modelcontextprotocol.io/)
- [OpenAI Codex CLI](https://github.com/openai/codex-cli)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
