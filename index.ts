import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "node:child_process";
import { z } from "zod";

// Default model for Codex CLI
const DEFAULT_MODEL = "gpt-5";

// Function to determine the codex-cli command and its initial arguments
export async function decideCodexCliCommand(): Promise<{
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
      } else {
        reject(
          new Error("codex not found globally. Please install Codex CLI."),
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
    .enum(["auto-edit", "full-auto"])
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

  // Check if codex-cli is available at runtime
  let codexCliCmd: { command: string; initialArgs: string[] };
  try {
    codexCliCmd = await decideCodexCliCommand();
  } catch (error) {
    throw new Error(
      `Codex CLI is not installed or not found in PATH. Please install it using: npm install -g @openai/codex. Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

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
  const server = new McpServer({
    name: "mcp-codex-cli",
    version: "0.1.0",
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
          .enum(["auto-edit", "full-auto"])
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
      try {
        const result = await chat(args);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
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
