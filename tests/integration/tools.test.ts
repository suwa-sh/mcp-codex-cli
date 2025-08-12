import { describe, test } from "node:test";
import assert from "node:assert";
import { chat } from "../../index.ts";

describe("MCP Codex CLI 統合テスト（ハッピーパスのみ）", () => {
  // 前提: Codex CLI がインストールされていること

  test("chat が正常に実行されること", { timeout: 30000 }, async () => {
    // Given: 有効なパラメータでchatを実行
    const params = {
      prompt: "Hello World!",
      approvalLevel: "auto-edit" as const,
    };

    // When: chat を実行する
    const result = await chat(params, true);

    // Then: 結果が返される
    assert.ok(result, "実行結果が存在すること");
    assert.strictEqual(typeof result, "string", "実行結果が文字列であること");
    console.log("✅ chat 成功");
  });
});
