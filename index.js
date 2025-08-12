#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "node:child_process";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
// Default model for Codex CLI
const DEFAULT_MODEL = "gpt-5";
// Function to determine the codex-cli command and its initial arguments
export async function decideCodexCliCommand(allowInstall) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const whichCmd = isWindows ? "where" : "which";
    const child = spawn(whichCmd, ["codex"]);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ command: "codex", initialArgs: [] });
      } else if (allowInstall) {
        resolve({
          command: "npm",
          initialArgs: ["install", "-g", "@openai/codex"],
        });
      } else {
        reject(
          new Error(
            "codex not found globally and --allow-install option not specified.",
          ),
        );
      }
    });
    child.on("error", (err) => {
      reject(err);
    });
  });
}
// Function to execute codex-cli command
export async function executeCodexCli(codexCliCommand, args) {
  const { command, initialArgs } = codexCliCommand;
  const commandArgs = [...initialArgs, ...args];
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    // Close stdin immediately since we're not sending any input
    child.stdin.end();
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`codex exited with code ${code}: ${stderr}`));
      }
    });
    child.on("error", (err) => {
      reject(err);
    });
  });
}
// Zod schema for executeTask tool parameters
export const ExecuteTaskParametersSchema = z.object({
  prompt: z.string().describe("The task description to execute."),
  mode: z
    .enum(["interactive", "exec"])
    .optional()
    .describe(
      "Execution mode: interactive (default) or exec for non-interactive.",
    ),
  approvalLevel: z
    .enum(["suggest", "auto-edit", "full-auto"])
    .optional()
    .describe(
      "Approval level: suggest (read-only, requires approval for writes), auto-edit (read/write files, requires approval for commands), full-auto (fully autonomous).",
    ),
  model: z
    .string()
    .optional()
    .describe(
      `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini", or use --oss for open source models.`,
    ),
  workingDir: z
    .string()
    .optional()
    .describe("The working directory for the task execution."),
});
// Zod schema for analyzeCode tool parameters
export const AnalyzeCodeParametersSchema = z.object({
  filePath: z.string().optional().describe("The path to the file to analyze."),
  codeSnippet: z
    .string()
    .optional()
    .describe("Direct code snippet to analyze (alternative to filePath)."),
  query: z.string().describe("The analysis query or question about the code."),
  model: z
    .string()
    .optional()
    .describe(
      `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini".`,
    ),
});
// Zod schema for debugCode tool parameters
export const DebugCodeParametersSchema = z.object({
  errorMessage: z.string().optional().describe("The error message to debug."),
  filePath: z
    .string()
    .optional()
    .describe("The path to the file with the issue."),
  context: z
    .string()
    .optional()
    .describe("Additional context about the debugging scenario."),
  model: z
    .string()
    .optional()
    .describe(
      `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini".`,
    ),
});
// Zod schema for generateCode tool parameters
export const GenerateCodeParametersSchema = z.object({
  description: z.string().describe("Description of the code to generate."),
  language: z
    .string()
    .optional()
    .describe("Programming language for the generated code."),
  outputPath: z
    .string()
    .optional()
    .describe("Path where the generated code should be saved."),
  framework: z
    .string()
    .optional()
    .describe("Framework or library to use in the generated code."),
  model: z
    .string()
    .optional()
    .describe(
      `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini".`,
    ),
});
// Tool execution functions
export async function executeTask(args, allowInstall = false) {
  const parsedArgs = ExecuteTaskParametersSchema.parse(args);
  const codexCliCmd = await decideCodexCliCommand(allowInstall);
  const cliArgs = [];
  // Set execution mode
  if (parsedArgs.mode === "exec") {
    cliArgs.push("exec");
  }
  // Add the prompt
  cliArgs.push(parsedArgs.prompt);
  // Set model (default to gpt-5)
  const model = parsedArgs.model || DEFAULT_MODEL;
  cliArgs.push("--model", model);
  // Set approval level
  if (parsedArgs.approvalLevel) {
    switch (parsedArgs.approvalLevel) {
      case "suggest":
        cliArgs.push("--suggest");
        break;
      case "auto-edit":
        cliArgs.push("--auto-edit");
        break;
      case "full-auto":
        cliArgs.push("--full-auto");
        break;
    }
  }
  // Set working directory if specified
  if (parsedArgs.workingDir) {
    process.chdir(parsedArgs.workingDir);
  }
  const result = await executeCodexCli(codexCliCmd, cliArgs);
  return result;
}
export async function analyzeCode(args, allowInstall = false) {
  const parsedArgs = AnalyzeCodeParametersSchema.parse(args);
  // Validate that either filePath or codeSnippet is provided
  if (!parsedArgs.filePath && !parsedArgs.codeSnippet) {
    throw new Error("Either filePath or codeSnippet must be provided");
  }
  const codexCliCmd = await decideCodexCliCommand(allowInstall);
  let codeContent = "";
  if (parsedArgs.filePath) {
    if (!existsSync(parsedArgs.filePath)) {
      throw new Error(`File not found: ${parsedArgs.filePath}`);
    }
    codeContent = await readFile(parsedArgs.filePath, "utf-8");
  } else if (parsedArgs.codeSnippet) {
    codeContent = parsedArgs.codeSnippet;
  }
  // Build the analysis prompt
  const prompt = `Analyze the following code and answer this query: ${parsedArgs.query}

Code:
\`\`\`
${codeContent}
\`\`\``;
  const model = parsedArgs.model || DEFAULT_MODEL;
  const cliArgs = [prompt, "--model", model];
  const result = await executeCodexCli(codexCliCmd, cliArgs);
  return result;
}
export async function debugCode(args, allowInstall = false) {
  const parsedArgs = DebugCodeParametersSchema.parse(args);
  // Validate that at least one input is provided
  if (!parsedArgs.errorMessage && !parsedArgs.filePath) {
    throw new Error("Either errorMessage or filePath must be provided");
  }
  const codexCliCmd = await decideCodexCliCommand(allowInstall);
  // Build the debugging prompt
  let prompt = "Debug the following issue:\n\n";
  if (parsedArgs.errorMessage) {
    prompt += `Error Message:\n${parsedArgs.errorMessage}\n\n`;
  }
  if (parsedArgs.filePath) {
    if (existsSync(parsedArgs.filePath)) {
      const fileContent = await readFile(parsedArgs.filePath, "utf-8");
      prompt += `File (${parsedArgs.filePath}):\n\`\`\`\n${fileContent}\n\`\`\`\n\n`;
    } else {
      prompt += `File path: ${parsedArgs.filePath} (file not found)\n\n`;
    }
  }
  if (parsedArgs.context) {
    prompt += `Additional Context:\n${parsedArgs.context}\n`;
  }
  prompt += "\nPlease identify the issue and provide a solution.";
  const model = parsedArgs.model || DEFAULT_MODEL;
  const cliArgs = [prompt, "--model", model, "--auto-edit"];
  const result = await executeCodexCli(codexCliCmd, cliArgs);
  return result;
}
export async function generateCode(args, allowInstall = false) {
  const parsedArgs = GenerateCodeParametersSchema.parse(args);
  const codexCliCmd = await decideCodexCliCommand(allowInstall);
  // Build the code generation prompt
  let prompt = `Generate code with the following requirements:\n\n${parsedArgs.description}`;
  if (parsedArgs.language) {
    prompt += `\n\nProgramming Language: ${parsedArgs.language}`;
  }
  if (parsedArgs.framework) {
    prompt += `\nFramework/Library: ${parsedArgs.framework}`;
  }
  if (parsedArgs.outputPath) {
    prompt += `\n\nSave the generated code to: ${parsedArgs.outputPath}`;
  }
  const model = parsedArgs.model || DEFAULT_MODEL;
  const cliArgs = ["exec", prompt, "--model", model];
  // Use auto-edit mode if outputPath is specified
  if (parsedArgs.outputPath) {
    cliArgs.push("--auto-edit");
  }
  const result = await executeCodexCli(codexCliCmd, cliArgs);
  return result;
}
async function main() {
  // Check for --allow-install argument
  const allowInstall = process.argv.includes("--allow-install");
  // Check if codex-cli is available at startup
  try {
    await decideCodexCliCommand(allowInstall);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      "Please install codex-cli globally or use --allow-install option.",
    );
    process.exit(1);
  }
  const server = new McpServer({
    name: "mcp-codex-cli",
    version: "0.1.0",
  });
  // Register executeTask tool
  server.registerTool(
    "executeTask",
    {
      description:
        "Execute a general coding task using Codex CLI. Can perform code generation, refactoring, and various development tasks.",
      inputSchema: {
        prompt: z.string().describe("The task description to execute."),
        mode: z
          .enum(["interactive", "exec"])
          .optional()
          .describe(
            "Execution mode: interactive (default) or exec for non-interactive.",
          ),
        approvalLevel: z
          .enum(["suggest", "auto-edit", "full-auto"])
          .optional()
          .describe(
            "Approval level: suggest (read-only), auto-edit (read/write files), full-auto (fully autonomous).",
          ),
        model: z
          .string()
          .optional()
          .describe(
            `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini".`,
          ),
        workingDir: z
          .string()
          .optional()
          .describe("The working directory for the task execution."),
      },
    },
    async (args) => {
      const result = await executeTask(args, allowInstall);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    },
  );
  // Register analyzeCode tool
  server.registerTool(
    "analyzeCode",
    {
      description:
        "Analyze code to understand its functionality, identify issues, or answer questions about it.",
      inputSchema: {
        filePath: z
          .string()
          .optional()
          .describe("The path to the file to analyze."),
        codeSnippet: z
          .string()
          .optional()
          .describe(
            "Direct code snippet to analyze (alternative to filePath).",
          ),
        query: z
          .string()
          .describe("The analysis query or question about the code."),
        model: z
          .string()
          .optional()
          .describe(
            `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini".`,
          ),
      },
    },
    async (args) => {
      const result = await analyzeCode(args, allowInstall);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    },
  );
  // Register debugCode tool
  server.registerTool(
    "debugCode",
    {
      description:
        "Debug code issues, errors, or unexpected behavior. Provides analysis and solutions.",
      inputSchema: {
        errorMessage: z
          .string()
          .optional()
          .describe("The error message to debug."),
        filePath: z
          .string()
          .optional()
          .describe("The path to the file with the issue."),
        context: z
          .string()
          .optional()
          .describe("Additional context about the debugging scenario."),
        model: z
          .string()
          .optional()
          .describe(
            `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini".`,
          ),
      },
    },
    async (args) => {
      const result = await debugCode(args, allowInstall);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    },
  );
  // Register generateCode tool
  server.registerTool(
    "generateCode",
    {
      description:
        "Generate new code based on specifications. Can create functions, classes, components, or entire files.",
      inputSchema: {
        description: z
          .string()
          .describe("Description of the code to generate."),
        language: z
          .string()
          .optional()
          .describe("Programming language for the generated code."),
        outputPath: z
          .string()
          .optional()
          .describe("Path where the generated code should be saved."),
        framework: z
          .string()
          .optional()
          .describe("Framework or library to use in the generated code."),
        model: z
          .string()
          .optional()
          .describe(
            `The model to use. Default: "${DEFAULT_MODEL}". Other options: "gpt-4.1", "gpt-4.1-mini", "o1", "o1-mini".`,
          ),
      },
    },
    async (args) => {
      const result = await generateCode(args, allowInstall);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    },
  );
  // Connect the server to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
// Only run main if this file is being executed directly
if (import.meta.main) {
  main().catch(console.error);
}
//# sourceMappingURL=index.js.map
