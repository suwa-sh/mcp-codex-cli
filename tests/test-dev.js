#!/usr/bin/env node
// 開発用テストスクリプト - MCPサーバーを経由せずにchat関数を直接呼び出す

import { chat } from "../index.js";

async function testChat() {
  console.log("🧪 Testing chat function directly...\n");

  try {
    const result = await chat(
      {
        prompt:
          "typescriptで、Hello World と表示するシンプルな関数を作成してください",
        approvalLevel: "auto-edit",
        model: "gpt-5",
        reasoningEffort: "high",
      },
      true,
    );

    console.log("✅ Result:");
    console.log(result);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testChat();
