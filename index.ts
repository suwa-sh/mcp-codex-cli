import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "node:child_process";
import { z } from "zod";

// Default model for Codex CLI
const DEFAULT_MODEL = "gpt-5";

// Global flag to track --allow-npx option
let ALLOW_NPX = false;

// Function to determine the codex-cli command and its initial arguments
export async function decideCodexCliCommand(
  allowNpx: boolean = false,
): Promise<{
  command: string;
  initialArgs: string[];
}> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const whichCmd = isWindows ? "where" : "which";
    const child = spawn(whichCmd, ["codex"]);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ command: "codex", initialArgs: [] });
      } else if (allowNpx) {
        // Use npx to run codex CLI when not found locally
        resolve({
          command: "npx",
          initialArgs: ["@openai/codex"],
        });
      } else {
        reject(
          new Error(
            "codex not found globally and --allow-npx option not specified.",
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
export async function executeCodexCli(
  codexCliCommand: { command: string; initialArgs: string[] },
  args: string[],
): Promise<string> {
  const { command, initialArgs } = codexCliCommand;

  // Note: codex-not-found case is no longer used since we now use npx directly

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

// Zod schema for chat tool parameters
export const ChatParametersSchema = z.object({
  prompt: z.string().describe("The task description to execute."),
  approvalLevel: z
    .string()
    .optional()
    .describe(
      "Approval level: auto-edit (read/write files, requires approval for commands), full-auto (fully autonomous). Default: auto-edit.",
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

// Tool execution functions
export async function chat(args: unknown) {
  const parsedArgs = ChatParametersSchema.parse(args);

  // Validate approvalLevel if provided
  if (
    parsedArgs.approvalLevel &&
    !["auto-edit", "full-auto"].includes(parsedArgs.approvalLevel)
  ) {
    throw new Error(
      `Invalid approvalLevel: ${parsedArgs.approvalLevel}. Must be "auto-edit" or "full-auto".`,
    );
  }

  // Use the same allowNpx setting as startup
  const codexCliCmd = await decideCodexCliCommand(ALLOW_NPX);

  const cliArgs: string[] = [];

  // Set model (default to gpt-5)
  const model = parsedArgs.model || DEFAULT_MODEL;
  cliArgs.push("-m", model);

  // Set approval level (default to auto-edit for MCP compatibility)
  const approvalLevel = parsedArgs.approvalLevel || "auto-edit";
  switch (approvalLevel) {
    case "auto-edit":
      cliArgs.push("-a", "on-failure");
      cliArgs.push("-s", "workspace-write");
      break;
    case "full-auto":
      cliArgs.push("--full-auto");
      break;
  }

  // Always use exec mode for non-interactive execution
  cliArgs.push("exec");

  // Add skip git repo check for untrusted directories (needed for npx execution)
  cliArgs.push("--skip-git-repo-check");

  // Add the prompt at the end
  cliArgs.push(parsedArgs.prompt);

  // Set working directory if specified
  if (parsedArgs.workingDir) {
    process.chdir(parsedArgs.workingDir);
  }

  const result = await executeCodexCli(codexCliCmd, cliArgs);
  return result;
}

async function main() {
  // Check for --allow-npx argument
  ALLOW_NPX = process.argv.includes("--allow-npx");

  // Check if codex-cli is available at startup
  try {
    await decideCodexCliCommand(ALLOW_NPX);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      "Please install codex-cli globally using: npm install -g @openai/codex",
    );
    process.exit(1);
  }

  const server = new McpServer({
    name: "mcp-codex-cli",
    version: "1.0.0",
  });

  // Register chat tool
  server.registerTool(
    "chat",
    {
      description:
        "Chat with Codex CLI in non-interactive mode. Can perform code generation, refactoring, and various development tasks.",
      inputSchema: {
        prompt: z.string().describe("The task description to execute."),
        approvalLevel: z
          .string()
          .optional()
          .describe(
            "Approval level: auto-edit (read/write files, requires approval for commands), full-auto (fully autonomous). Default: auto-edit.",
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
      const result = await chat(args);
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
// For NPX execution, import.meta.main might be undefined, so we'll always run main
if (import.meta.main !== false) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
