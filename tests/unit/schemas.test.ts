import { describe, test } from "node:test";
import assert from "node:assert";
import { ChatParametersSchema } from "../../index.ts";

describe("Zodスキーマ検証テスト", () => {
  describe("ChatParametersSchema", () => {
    test("有効な必須パラメータのみが提供された場合、パースが成功すること", () => {
      // Given: 有効な必須パラメータを指定して
      const validParams = {
        prompt: "テストタスクを実行する",
      };

      // When: スキーマでパースする
      const result = ChatParametersSchema.parse(validParams);

      // Then: パースが成功し、値が保持されること
      assert.strictEqual(
        result.prompt,
        "テストタスクを実行する",
        "promptが正しく保持されること",
      );
      assert.strictEqual(
        result.approvalLevel,
        undefined,
        "approvalLevelは未定義のままであること",
      );
      assert.strictEqual(
        result.model,
        undefined,
        "modelは未定義のままであること",
      );
    });

    test("全てのオプショナルパラメータが提供された場合、パースが成功すること", () => {
      // Given: すべてのパラメータを指定して
      const validParams = {
        prompt: "完全なテストタスク",
        approvalLevel: "auto-edit" as const,
        model: "gpt-4.1",
        workingDir: "/tmp/workspace",
      };

      // When: スキーマでパースする
      const result = ChatParametersSchema.parse(validParams);

      // Then: すべての値が正しく保持されること
      assert.strictEqual(result.prompt, "完全なテストタスク");
      assert.strictEqual(result.approvalLevel, "auto-edit");
      assert.strictEqual(result.model, "gpt-4.1");
      assert.strictEqual(result.workingDir, "/tmp/workspace");
    });

    test("promptが文字列でない場合、パースエラーが発生すること", () => {
      // Given: promptが数値の無効なパラメータを指定して
      const invalidParams = {
        prompt: 123,
      };

      // When & Then: パースエラーが発生すること
      assert.throws(
        () => ChatParametersSchema.parse(invalidParams),
        /Expected string/,
        "promptが文字列でない場合、適切なエラーが発生すること",
      );
    });

    test("無効なapprovalLevelが指定された場合、パースエラーが発生すること", () => {
      // Given: 無効なapprovalLevelを指定して
      const invalidParams = {
        prompt: "テスト",
        approvalLevel: "suggest", // 廃止されたオプション
      };

      // When & Then: パースエラーが発生すること
      assert.throws(
        () => ChatParametersSchema.parse(invalidParams),
        /Invalid enum value/,
        "無効なapprovalLevelの場合、適切なエラーが発生すること",
      );
    });
  });
});
