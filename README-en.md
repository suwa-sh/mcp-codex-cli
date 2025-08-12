# MCP Codex CLI

A simple MCP server wrapper for OpenAI's Codex CLI that enables AI assistants to use Codex's coding capabilities through the Model Context Protocol.

## What it does

This server exposes four tools that interact with Codex CLI:

- `executeTask`: Execute general coding tasks like refactoring, feature implementation, or code fixes
- `analyzeCode`: Analyze code to understand functionality, identify issues, or answer questions
- `debugCode`: Debug errors and unexpected behavior with intelligent analysis and solutions
- `generateCode`: Generate new code based on specifications and requirements

## Prerequisites

- [OpenAI Codex CLI](https://github.com/openai/codex-cli) installed and configured (optional with --allow-install flag)
- OpenAI API Key or ChatGPT Plus/Pro/Team account
- Node.js 22+ (for Codex CLI requirement)

## 🚀 Quick Start with Claude Code

### 1. Add the MCP server

```bash
claude mcp add -s project codex-cli -- npx mcp-codex-cli --allow-install
```

Or configure your MCP client with the settings shown in the Installation Options section below.

### 2. Try it out

Example prompts:

- **Task Execution**: "Use executeTask to refactor this component to use React hooks"
- **Code Analysis**: "Analyze the authentication module and explain how JWT tokens are handled"
- **Debugging**: "Debug this TypeError that occurs in the user registration flow"
- **Code Generation**: "Generate a TypeScript interface for user profile data with validation"

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

1. Clone and install:

```bash
git clone https://github.com/suwa-sh/mcp-codex-cli
cd mcp-codex-cli
npm install
```

2. Build the project:

```bash
npm run build
```

3. Add to Claude Desktop config:

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

### 1. executeTask

Execute general coding tasks with flexible options.

**Parameters:**

- `prompt` (required): The task description
- `mode` (optional): "interactive" (default) or "exec" for non-interactive execution
- `approvalLevel` (optional): "suggest" (read-only), "auto-edit" (read/write files), "full-auto" (fully autonomous)
- `model` (optional): Model to use (default: "gpt-5")
- `workingDir` (optional): Working directory for the task

### 2. analyzeCode

Analyze code to understand functionality or identify issues.

**Parameters:**

- `filePath` or `codeSnippet` (required): Code to analyze (provide one)
- `query` (required): The analysis question or request
- `model` (optional): Model to use (default: "gpt-5")

### 3. debugCode

Debug errors and provide solutions.

**Parameters:**

- `errorMessage` or `filePath` (required): Error details or problematic file (provide at least one)
- `context` (optional): Additional context about the issue
- `model` (optional): Model to use (default: "gpt-5")

### 4. generateCode

Generate new code based on specifications.

**Parameters:**

- `description` (required): Description of code to generate
- `language` (optional): Programming language
- `outputPath` (optional): Where to save the generated code
- `framework` (optional): Framework or library to use
- `model` (optional): Model to use (default: "gpt-5")

## 💡 Example Usage

### executeTask

```typescript
// Refactor a component
executeTask({ 
  prompt: "Refactor the UserDashboard component to use React hooks instead of class components",
  approvalLevel: "auto-edit",
  workingDir: "./src/components"
});

// Fix type errors
executeTask({
  prompt: "Fix all TypeScript type errors in the authentication module",
  mode: "exec",
  model: "gpt-5"
});
```

### analyzeCode

```typescript
// Analyze a file
analyzeCode({
  filePath: "./src/utils/auth.ts",
  query: "How does the JWT token validation work in this module?"
});

// Analyze code snippet
analyzeCode({
  codeSnippet: `
    const processData = async (data) => {
      return data.map(item => item.value * 2).filter(v => v > 10);
    }
  `,
  query: "What does this function do and are there any potential issues?"
});
```

### debugCode

```typescript
// Debug an error message
debugCode({
  errorMessage: "TypeError: Cannot read property 'length' of undefined",
  context: "This happens in the user input validation function when submitting the form",
  filePath: "./src/components/UserForm.tsx"
});

// Debug a problematic file
debugCode({
  filePath: "./src/hooks/useAuth.ts",
  context: "Users are getting logged out unexpectedly"
});
```

### generateCode

```typescript
// Generate a React component
generateCode({
  description: "Create a reusable Button component with variants (primary, secondary, danger) and sizes (small, medium, large)",
  language: "typescript",
  framework: "react",
  outputPath: "./src/components/Button.tsx"
});

// Generate utility function
generateCode({
  description: "Create a function to validate email addresses with comprehensive regex pattern",
  language: "javascript"
});
```

## ⚙️ Configuration

### Environment Variables

Set up authentication for Codex CLI:

```bash
# Option 1: OpenAI API Key
export OPENAI_API_KEY=your_api_key_here

# Option 2: Use ChatGPT account (sign in via codex-cli)
codex auth login
```

### Default Model

All tools use **gpt-5** as the default model, which is Codex CLI's current default. You can override this by specifying the `model` parameter in any tool call:

- `gpt-5` (default)
- `gpt-4.1`
- `gpt-4.1-mini`
- `o1`
- `o1-mini`

### Approval Levels

- **suggest**: Only reads files; requires approval for writes (safest)
- **auto-edit**: Reads and writes files; requires approval for shell commands
- **full-auto**: Fully autonomous execution (use with caution)

## 🔗 Related Links

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [OpenAI Codex CLI](https://github.com/openai/codex-cli)
