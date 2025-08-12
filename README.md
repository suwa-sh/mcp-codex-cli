# MCP Codex CLI

OpenAI の Codex CLI のシンプルな MCP サーバーラッパーです。AI アシスタントが Model Context Protocol を通じて Codex のコーディング機能を使用できるようにします。

**特徴:**
- 非インタラクティブ（exec）モードのみ対応で、MCP 環境に最適化
- シンプルな1つのチャットツールを提供
- TypeScript + Zod によるスキーマ検証
- 高速・軽量なテスト構成

## 概要

このサーバーは、Codex CLI と対話する 1 つのツールを提供します：

- `chat`: コード生成、リファクタリング、解析、デバッグなど、あらゆるコーディングタスクを実行

## 前提条件

- [OpenAI Codex CLI](https://github.com/openai/codex-cli) がインストール・設定済み（--allow-install フラグでオプション）
- OpenAI API キーまたは ChatGPT Plus/Pro/Team アカウント
- Node.js 22+（Codex CLI の要件）

## 🚀 Quick Start with Claude Code

### 1. Add the MCP server

```bash
claude mcp add -s project codex-cli -- npx mcp-codex-cli --allow-install
```

または、以下のインストールオプションセクションに示される設定で MCP クライアントを設定してください。

### 2. Try it out

例となるプロンプト：

- **リファクタリング**: "このコンポーネントを React hooks を使うようリファクタリングして"
- **コード解析**: "認証モジュールを解析して JWT トークンの処理方法を説明して"  
- **デバッグ**: "ユーザー登録フローで発生するこの TypeError をデバッグして"
- **コード生成**: "バリデーション付きのユーザープロフィールデータ用 TypeScript インターフェースを生成して"

## 🔧 Installation Options

### Using npx with --allow-install flag

```json
{
  "mcpServers": {
    "mcp-codex-cli": {
      "command": "npx",
      "args": ["mcp-codex-cli", "--allow-install"]
    }
  }
}
```

### Local Development

1. クローンとインストール：

```bash
git clone https://github.com/suwa-sh/mcp-codex-cli
cd mcp-codex-cli
npm install
```

2. プロジェクトをビルド：

```bash
npm run build
```

3. Claude Desktop の設定に追加：

```json
{
  "mcpServers": {
    "mcp-codex-cli": {
      "command": "node",
      "args": ["/path/to/mcp-codex-cli/dist/index.js", "--allow-install"]
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

# オプション2：ChatGPT アカウントを使用（codex-cli でサインイン）
codex auth login
```

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

> **注意:** インタラクティブモードと "suggest" 承認レベルは MCP 環境での制約により廃止されました。

## 🔗 Related Links

- [Model Context Protocol（MCP）](https://modelcontextprotocol.io/)
- [OpenAI Codex CLI](https://github.com/openai/codex-cli)
