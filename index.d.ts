import { z } from "zod";
export declare function decideCodexCliCommand(allowInstall: boolean): Promise<{
  command: string;
  initialArgs: string[];
}>;
export declare function executeCodexCli(
  codexCliCommand: {
    command: string;
    initialArgs: string[];
  },
  args: string[],
): Promise<string>;
export declare const ExecuteTaskParametersSchema: z.ZodObject<
  {
    prompt: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<["interactive", "exec"]>>;
    approvalLevel: z.ZodOptional<
      z.ZodEnum<["suggest", "auto-edit", "full-auto"]>
    >;
    model: z.ZodOptional<z.ZodString>;
    workingDir: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    prompt: string;
    mode?: "interactive" | "exec" | undefined;
    approvalLevel?: "suggest" | "auto-edit" | "full-auto" | undefined;
    model?: string | undefined;
    workingDir?: string | undefined;
  },
  {
    prompt: string;
    mode?: "interactive" | "exec" | undefined;
    approvalLevel?: "suggest" | "auto-edit" | "full-auto" | undefined;
    model?: string | undefined;
    workingDir?: string | undefined;
  }
>;
export declare const AnalyzeCodeParametersSchema: z.ZodObject<
  {
    filePath: z.ZodOptional<z.ZodString>;
    codeSnippet: z.ZodOptional<z.ZodString>;
    query: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    query: string;
    model?: string | undefined;
    filePath?: string | undefined;
    codeSnippet?: string | undefined;
  },
  {
    query: string;
    model?: string | undefined;
    filePath?: string | undefined;
    codeSnippet?: string | undefined;
  }
>;
export declare const DebugCodeParametersSchema: z.ZodObject<
  {
    errorMessage: z.ZodOptional<z.ZodString>;
    filePath: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    model?: string | undefined;
    filePath?: string | undefined;
    errorMessage?: string | undefined;
    context?: string | undefined;
  },
  {
    model?: string | undefined;
    filePath?: string | undefined;
    errorMessage?: string | undefined;
    context?: string | undefined;
  }
>;
export declare const GenerateCodeParametersSchema: z.ZodObject<
  {
    description: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    outputPath: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    description: string;
    model?: string | undefined;
    language?: string | undefined;
    outputPath?: string | undefined;
    framework?: string | undefined;
  },
  {
    description: string;
    model?: string | undefined;
    language?: string | undefined;
    outputPath?: string | undefined;
    framework?: string | undefined;
  }
>;
export declare function executeTask(
  args: unknown,
  allowInstall?: boolean,
): Promise<string>;
export declare function analyzeCode(
  args: unknown,
  allowInstall?: boolean,
): Promise<string>;
export declare function debugCode(
  args: unknown,
  allowInstall?: boolean,
): Promise<string>;
export declare function generateCode(
  args: unknown,
  allowInstall?: boolean,
): Promise<string>;
