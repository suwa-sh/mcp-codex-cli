# MCP Codex CLI アーキテクチャ設計 (C4 Model)

## 1. システムコンテキスト図

```mermaid
graph TB
    User[User/Developer]
    AIAssistant[AI Assistant<br/>Claude/GPT]
    MCPCodexCLI[MCP Codex CLI<br/>System]
    OpenAICodex[OpenAI Codex CLI]
    OpenAIAPI[OpenAI API]
    FileSystem[File System]
    
    User -->|Uses| AIAssistant
    AIAssistant -->|MCP Protocol| MCPCodexCLI
    MCPCodexCLI -->|Executes| OpenAICodex
    OpenAICodex -->|API Calls| OpenAIAPI
    OpenAICodex -->|Read/Write| FileSystem
```

### システムコンテキスト図の構成要素

| 要素                 | 説明                                                         |
| -------------------- | ------------------------------------------------------------ |
| User/Developer       | コード生成・分析・デバッグを行いたい開発者                   |
| AI Assistant         | MCPクライアントとして動作するAIアシスタント（Claude, GPT等） |
| MCP Codex CLI System | OpenAI Codex CLIをMCPツールとして公開するラッパーシステム    |
| OpenAI Codex CLI     | OpenAIの公式コーディングエージェントCLIツール                |
| OpenAI API           | GPTモデルにアクセスするためのOpenAI APIサービス              |
| File System          | コード生成・修正対象のローカルファイルシステム               |

## 2. コンテナ図

```mermaid
graph TB
    subgraph SystemCore ["MCP Codex CLI System"]
        MCPServer["McpServer<br/>@modelcontextprotocol/sdk"]
        Chat["chat Function<br/>Lines 106-137"]
        DecideCodex["decideCodexCliCommand Function<br/>Lines 12-39"]
        ExecuteCodex["executeCodexCli Function<br/>Lines 42-79"]
        ZodSchemas["Chat Parameter Schema<br/>Validation Object"]
    end
    
    subgraph ExternalSystems ["External Systems"]
        StdioTransport["StdioServerTransport<br/>@modelcontextprotocol/sdk"]
        CodexCLI["Codex CLI Binary<br/>spawn process"]
        NPM["NPM Registry<br/>auto install"]
        FileSystem["File System<br/>readFile/existsSync"]
    end
    
    MCPClient["MCP Client<br/>AI Assistant"]
    
    MCPClient -->|STDIO| StdioTransport
    StdioTransport -->|JSON-RPC| MCPServer
    MCPServer -->|registerTool| Chat
    
    Chat --> ZodSchemas
    Chat --> DecideCodex
    Chat --> ExecuteCodex
    
    DecideCodex -->|which/where| CodexCLI
    DecideCodex -->|npm install| NPM
    ExecuteCodex -->|spawn| CodexCLI
```

### コンテナ図の構成要素

| 要素                    | 説明                                                 |
| ----------------------- | ---------------------------------------------------- |
| McpServer               | `@modelcontextprotocol/sdk`のMCPサーバーインスタンス |
| chat()                  | コーディングタスク実行関数（106-137行）              |
| decideCodexCliCommand() | Codex CLI検出・判定関数（12-39行）                   |
| executeCodexCli()       | Codex CLI実行関数（42-79行）                         |
| Chat Parameter Schema   | chatツール用パラメータ検証スキーマ（82-100行）       |
| StdioServerTransport    | 標準入出力によるMCP通信トランスポート                |
| Codex CLI Binary        | `spawn()`で実行されるCodex CLI実行ファイル           |
| NPM Registry            | `--allow-install`時のCodex CLI自動インストール       |

## 3. コンポーネント図（シーケンス図）

### 3.1 chat ツールの実行フロー

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as McpServer
    participant Chat as chat()
    participant DecideCodex as decideCodexCliCommand()
    participant ExecuteCodex as executeCodexCli()
    participant CLI as Codex CLI
    participant NPM as NPM
    
    Client->>Server: call chat(args)
    Server->>Chat: chat(args, allowInstall)
    Chat->>Chat: ChatParametersSchema.parse(args)
    Note over Chat: Zod validation
    
    Chat->>DecideCodex: decideCodexCliCommand(allowInstall)
    
    alt Platform check
        DecideCodex->>CLI: spawn(which/where, ["codex"])
        CLI-->>DecideCodex: exit code
        
        alt Codex found (code=0)
            DecideCodex-->>Chat: {command: "codex", initialArgs: []}
        else Codex not found & allowInstall
            DecideCodex-->>Chat: {command: "npm", initialArgs: ["install", "-g", "@openai/codex"]}
        else Codex not found & !allowInstall
            DecideCodex-->>Chat: throw Error("codex not found")
            Chat-->>Server: Error
            Server-->>Client: Error response
        end
    end
    
    Chat->>Chat: Build cliArgs array
    Note over Chat: Add prompt, --model gpt-5,<br/>approval level flags, exec mode
    
    alt Working directory specified
        Chat->>Chat: process.chdir(workingDir)
    end
    
    Chat->>ExecuteCodex: executeCodexCli(codexCliCmd, cliArgs)
    ExecuteCodex->>CLI: spawn(command, commandArgs)
    ExecuteCodex->>CLI: child.stdin.end()
    
    loop Process output
        CLI-->>ExecuteCodex: stdout data
        ExecuteCodex->>ExecuteCodex: stdout += data
    end
    
    loop Process errors
        CLI-->>ExecuteCodex: stderr data
        ExecuteCodex->>ExecuteCodex: stderr += data
    end
    
    CLI-->>ExecuteCodex: process exit(code)
    
    alt exit code = 0
        ExecuteCodex-->>Chat: return stdout
        Chat-->>Server: return result
        Server-->>Client: success response
    else exit code != 0
        ExecuteCodex-->>Chat: throw Error(stderr)
        Chat-->>Server: Error
        Server-->>Client: error response
    end
```

### 3.2 初期化フロー

```mermaid
sequenceDiagram
    participant Main as main()
    participant Detector as decideCodexCliCommand()
    participant Server as McpServer
    participant Transport as StdioServerTransport
    participant Chat as chat()
    
    Main->>Main: parseArgs(process.argv)
    Note over Main: Check for --allow-install flag
    
    Main->>Detector: decideCodexCliCommand(allowInstall)
    
    alt Platform is Windows
        Detector->>Detector: spawn("where", ["codex"])
    else Platform is Unix/Mac
        Detector->>Detector: spawn("which", ["codex"])
    end
    
    alt Command found
        Detector-->>Main: {command: "codex", initialArgs: []}
    else Command not found & allowInstall
        Detector-->>Main: {command: "npm", initialArgs: ["install", "-g", "@openai/codex"]}
    else Command not found & !allowInstall
        Detector-->>Main: Error: Codex not found
        Main->>Main: console.error() & exit(1)
    end
    
    Main->>Server: new McpServer({name: "mcp-codex-cli", version: "0.1.0"})
    
    Main->>Server: server.registerTool("chat", schema, handler)
    Note over Main: Handler: (args) => chat(args, allowInstall)
    
    Main->>Transport: new StdioServerTransport()
    Main->>Server: server.connect(transport)
    Server-->>Main: connection established
    Note over Main: Server ready for MCP requests
```

## 4. 実装詳細

### 4.1 技術仕様

| 項目       | 詳細                              |
| ---------- | --------------------------------- |
| Runtime    | Node.js 22+ （Codex CLI要件）     |
| Language   | TypeScript （ES2022ターゲット）   |
| MCP SDK    | @modelcontextprotocol/sdk ^1.13.1 |
| Validation | Zod ^3.25.67                      |
| Linting    | Biome ^2.0.5                      |
| Testing    | Node.js Built-in Test Runner      |

### 4.2 ファイル構造

```
mcp-codex-cli/
├── index.ts                    # メイン実装（MCP Server + Tools）
├── dist/                      # ビルド出力
│   ├── index.js              # 実行可能ファイル（shebang付き）
│   ├── index.d.ts            # TypeScript型定義
│   └── index.js.map          # ソースマップ
├── tests/
│   ├── unit/
│   │   └── schemas.test.ts   # Zodスキーマ検証テスト
│   └── integration/
│       └── tools.test.ts     # 統合テスト（Node.js内蔵テストランナー）
├── package.json              # プロジェクト設定・依存関係
├── tsconfig.json            # TypeScript設定
├── biome.json              # Linting・Formatting設定
├── CLAUDE.md               # Claude Code用ガイダンス
├── ARCHITECTURE.md         # アーキテクチャ設計書（このファイル）
├── DEVELOPMENT.md          # 開発環境・テストガイド
└── README.md               # プロジェクト概要（日本語メイン）
```

### 4.3 コード構造詳細

#### index.ts

- 依存関係とデフォルト設定
- CLI検出・実行管理
- Zodによるパラメータ検証
- chatツールの実装
- サーバー初期化・ツール登録

#### ツールの実装詳細

**chat**
- プロンプト処理、承認レベル制御（auto-edit/full-auto）
- 常にexecモードで非インタラクティブ実行
- 作業ディレクトリ変更 (`process.chdir()`)
- Codex CLIのコマンドライン引数構築
- あらゆるコーディングタスクに対応（生成、解析、デバッグ、リファクタリング）
