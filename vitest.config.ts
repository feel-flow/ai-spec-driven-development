import { defineConfig } from "vitest/config";

// Issue #577: bash を起動するテストは Windows（MSYS bash）では起動が重く、vitest 全体（17 ファイル並列）で回すと
// 既定の 5000 ms を超えてランダムに落ちる。実測（Issue #577）: multi-agent.sh 1 回が単独 2.0〜2.8 秒、全体実行中
// 3.0〜5.3 秒。export-toolkit-templates の 2 件が 5.3 / 6.5 秒。quality-local.test.ts は単独最長 3.3 秒（Issue #570）。
// 最悪値 6.5 秒の約 3 倍、単独時の約 6 倍まで待つ（ms）。OS で切り替えず全体に掛ける（POSIX では上限に届かないので
// 挙動は変わらない）。
const TEST_TIMEOUT_MS = 20_000;

export default defineConfig({
  test: {
    environment: "node",
    include: ["docs-template/scripts/ace/**/*.test.ts", "scripts/**/*.test.ts"],
    testTimeout: TEST_TIMEOUT_MS,
  },
});
