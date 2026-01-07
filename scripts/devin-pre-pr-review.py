#!/usr/bin/env python3
"""
Devin Pre-PR Review System

PR作成前に複数の専門エージェントによる並列レビューを実行し、
問題が見つかった場合は自動修復を行うシステム。

使用方法:
    python scripts/devin-pre-pr-review.py [--auto-fix] [--max-iterations N]

環境変数:
    OPENAI_API_KEY: OpenAI APIキー
    ANTHROPIC_API_KEY: Anthropic APIキー（オプション、フォールバック用）
"""

import asyncio
import json
import os
import subprocess
import sys
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

# Constants
MAX_ITERATIONS_DEFAULT = 5
REVIEW_TIMEOUT_SECONDS = 120
MAX_FILE_SIZE_BYTES = 100000  # 100KB


class AgentType(str, Enum):
    """レビューエージェントの種類"""
    SECURITY = "security"
    PERFORMANCE = "performance"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    BUSINESS_LOGIC = "business_logic"


class IssueSeverity(str, Enum):
    """問題の重大度"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class CodeIssue:
    """検出されたコードの問題"""
    id: str
    agent_type: AgentType
    severity: IssueSeverity
    title: str
    description: str
    file_path: str
    line_number: int
    code_snippet: str
    recommendation: str
    auto_fix_available: bool = False
    suggested_fix: str = ""


@dataclass
class ReviewResult:
    """エージェントのレビュー結果"""
    agent_type: AgentType
    issues: list[CodeIssue] = field(default_factory=list)
    time_elapsed: float = 0.0
    status: str = "complete"
    error_message: str = ""


@dataclass
class OrchestratorResult:
    """オーケストレーター全体の結果"""
    cycle_id: int
    results: list[ReviewResult] = field(default_factory=list)
    total_issues: int = 0
    fixed_issues: int = 0
    total_time: float = 0.0
    status: str = "complete"
    all_passed: bool = False


def get_llm_client():
    """LLMクライアントを取得（OpenAI優先、Anthropicフォールバック）"""
    openai_key = os.environ.get("OPENAI_API_KEY")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if openai_key:
        try:
            import openai
            return ("openai", openai.OpenAI(api_key=openai_key))
        except ImportError:
            print("Warning: openai package not installed, trying anthropic...")
    
    if anthropic_key:
        try:
            import anthropic
            return ("anthropic", anthropic.Anthropic(api_key=anthropic_key))
        except ImportError:
            print("Warning: anthropic package not installed")
    
    return (None, None)


async def call_llm(client_info: tuple, prompt: str, system_prompt: str) -> str:
    """LLM APIを呼び出す"""
    client_type, client = client_info
    
    if client_type == "openai":
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=4096
        )
        return response.choices[0].message.content
    
    elif client_type == "anthropic":
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    
    else:
        raise ValueError("No LLM client available")


class BaseReviewAgent(ABC):
    """レビューエージェントの基底クラス"""
    
    def __init__(self, agent_type: AgentType, name: str, llm_client: tuple):
        self.agent_type = agent_type
        self.name = name
        self.llm_client = llm_client
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """エージェント固有のシステムプロンプトを返す"""
        pass
    
    @abstractmethod
    def get_review_prompt(self, code: str, file_path: str, context: dict) -> str:
        """レビュー用のプロンプトを生成"""
        pass
    
    async def review(self, code: str, file_path: str, context: dict | None = None) -> ReviewResult:
        """コードをレビューして問題を検出"""
        start_time = time.time()
        context = context or {}
        
        try:
            system_prompt = self.get_system_prompt()
            review_prompt = self.get_review_prompt(code, file_path, context)
            
            response = await call_llm(self.llm_client, review_prompt, system_prompt)
            issues = self._parse_response(response, file_path)
            
            elapsed = time.time() - start_time
            return ReviewResult(
                agent_type=self.agent_type,
                issues=issues,
                time_elapsed=elapsed,
                status="complete"
            )
        except Exception as e:
            elapsed = time.time() - start_time
            return ReviewResult(
                agent_type=self.agent_type,
                issues=[],
                time_elapsed=elapsed,
                status="error",
                error_message=str(e)
            )
    
    def _parse_response(self, response: str, file_path: str) -> list[CodeIssue]:
        """LLMレスポンスをパースしてCodeIssueリストに変換"""
        issues = []
        
        try:
            # JSON形式のレスポンスを期待
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0].strip()
            else:
                json_str = response.strip()
            
            data = json.loads(json_str)
            
            if isinstance(data, dict) and "issues" in data:
                issue_list = data["issues"]
            elif isinstance(data, list):
                issue_list = data
            else:
                return []
            
            for i, item in enumerate(issue_list):
                severity_str = item.get("severity", "medium").lower()
                severity = IssueSeverity.MEDIUM
                if severity_str == "critical":
                    severity = IssueSeverity.CRITICAL
                elif severity_str == "high":
                    severity = IssueSeverity.HIGH
                elif severity_str == "low":
                    severity = IssueSeverity.LOW
                
                issue = CodeIssue(
                    id=f"{self.agent_type.value}-{i+1}",
                    agent_type=self.agent_type,
                    severity=severity,
                    title=item.get("title", "Unknown Issue"),
                    description=item.get("description", ""),
                    file_path=file_path,
                    line_number=item.get("line", 0),
                    code_snippet=item.get("code", ""),
                    recommendation=item.get("recommendation", ""),
                    auto_fix_available=item.get("auto_fix_available", False),
                    suggested_fix=item.get("suggested_fix", "")
                )
                issues.append(issue)
        except (json.JSONDecodeError, KeyError, IndexError):
            pass
        
        return issues


class SecurityAgent(BaseReviewAgent):
    """セキュリティ脆弱性を検出するエージェント"""
    
    def __init__(self, llm_client: tuple):
        super().__init__(AgentType.SECURITY, "Security Agent", llm_client)
    
    def get_system_prompt(self) -> str:
        return """あなたはセキュリティ専門のコードレビューエージェントです。
以下の観点でコードをレビューしてください：

1. SQLインジェクション
2. XSS（クロスサイトスクリプティング）
3. CSRF（クロスサイトリクエストフォージェリ）
4. 認証・認可の脆弱性
5. 機密情報の露出（APIキー、パスワードのハードコード等）
6. 安全でない暗号化（MD5、SHA1等）
7. パストラバーサル
8. コマンドインジェクション

問題を発見した場合は、以下のJSON形式で出力してください：
```json
{
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "title": "問題のタイトル",
      "description": "問題の詳細説明",
      "line": 行番号,
      "code": "問題のあるコードスニペット",
      "recommendation": "修正方法の提案",
      "auto_fix_available": true/false,
      "suggested_fix": "修正後のコード（auto_fix_availableがtrueの場合）"
    }
  ]
}
```

問題がない場合は空の配列を返してください：
```json
{"issues": []}
```"""
    
    def get_review_prompt(self, code: str, file_path: str, context: dict) -> str:
        return f"""以下のコードをセキュリティの観点からレビューしてください。

ファイル: {file_path}

```
{code}
```

セキュリティ上の問題を検出し、JSON形式で出力してください。"""


class PerformanceAgent(BaseReviewAgent):
    """パフォーマンス問題を検出するエージェント"""
    
    def __init__(self, llm_client: tuple):
        super().__init__(AgentType.PERFORMANCE, "Performance Agent", llm_client)
    
    def get_system_prompt(self) -> str:
        return """あなたはパフォーマンス専門のコードレビューエージェントです。
以下の観点でコードをレビューしてください：

1. N+1クエリ問題
2. 不要なループ処理
3. メモリリーク
4. 非効率なアルゴリズム（O(n^2)以上の計算量）
5. 不要な再レンダリング（React等）
6. 大きなバンドルサイズ
7. 同期処理のブロッキング
8. キャッシュの未使用

問題を発見した場合は、以下のJSON形式で出力してください：
```json
{
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "title": "問題のタイトル",
      "description": "問題の詳細説明",
      "line": 行番号,
      "code": "問題のあるコードスニペット",
      "recommendation": "修正方法の提案",
      "auto_fix_available": true/false,
      "suggested_fix": "修正後のコード（auto_fix_availableがtrueの場合）"
    }
  ]
}
```

問題がない場合は空の配列を返してください：
```json
{"issues": []}
```"""
    
    def get_review_prompt(self, code: str, file_path: str, context: dict) -> str:
        return f"""以下のコードをパフォーマンスの観点からレビューしてください。

ファイル: {file_path}

```
{code}
```

パフォーマンス上の問題を検出し、JSON形式で出力してください。"""


class TestingAgent(BaseReviewAgent):
    """テスト品質を検出するエージェント"""
    
    def __init__(self, llm_client: tuple):
        super().__init__(AgentType.TESTING, "Testing Agent", llm_client)
    
    def get_system_prompt(self) -> str:
        return """あなたはテスト品質専門のコードレビューエージェントです。
以下の観点でコードをレビューしてください：

1. テストカバレッジの不足
2. エッジケースのテスト漏れ
3. エラーハンドリングのテスト漏れ
4. モックの不適切な使用
5. テストの可読性
6. テストの独立性（他のテストに依存していないか）
7. アサーションの品質

問題を発見した場合は、以下のJSON形式で出力してください：
```json
{
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "title": "問題のタイトル",
      "description": "問題の詳細説明",
      "line": 行番号,
      "code": "問題のあるコードスニペット",
      "recommendation": "修正方法の提案",
      "auto_fix_available": true/false,
      "suggested_fix": "修正後のコード（auto_fix_availableがtrueの場合）"
    }
  ]
}
```

問題がない場合は空の配列を返してください：
```json
{"issues": []}
```"""
    
    def get_review_prompt(self, code: str, file_path: str, context: dict) -> str:
        return f"""以下のコードをテスト品質の観点からレビューしてください。

ファイル: {file_path}

```
{code}
```

テスト品質上の問題を検出し、JSON形式で出力してください。"""


class DocumentationAgent(BaseReviewAgent):
    """ドキュメント品質を検出するエージェント"""
    
    def __init__(self, llm_client: tuple):
        super().__init__(AgentType.DOCUMENTATION, "Documentation Agent", llm_client)
    
    def get_system_prompt(self) -> str:
        return """あなたはドキュメント品質専門のコードレビューエージェントです。
以下の観点でコードをレビューしてください：

1. 関数・クラスのdocstringの不足
2. 複雑なロジックへのコメント不足
3. 型ヒントの不足（Python）/ 型定義の不足（TypeScript）
4. README更新の必要性
5. API仕様書の更新必要性
6. 変数名・関数名の明確さ

問題を発見した場合は、以下のJSON形式で出力してください：
```json
{
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "title": "問題のタイトル",
      "description": "問題の詳細説明",
      "line": 行番号,
      "code": "問題のあるコードスニペット",
      "recommendation": "修正方法の提案",
      "auto_fix_available": true/false,
      "suggested_fix": "修正後のコード（auto_fix_availableがtrueの場合）"
    }
  ]
}
```

問題がない場合は空の配列を返してください：
```json
{"issues": []}
```"""
    
    def get_review_prompt(self, code: str, file_path: str, context: dict) -> str:
        return f"""以下のコードをドキュメント品質の観点からレビューしてください。

ファイル: {file_path}

```
{code}
```

ドキュメント品質上の問題を検出し、JSON形式で出力してください。"""


class BusinessLogicAgent(BaseReviewAgent):
    """ビジネスロジックの問題を検出するエージェント"""
    
    def __init__(self, llm_client: tuple):
        super().__init__(AgentType.BUSINESS_LOGIC, "Business Logic Agent", llm_client)
    
    def get_system_prompt(self) -> str:
        return """あなたはビジネスロジック専門のコードレビューエージェントです。
以下の観点でコードをレビューしてください：

1. マジックナンバー・ハードコードされた値
2. DRY原則違反（重複コード）
3. 単一責任原則違反
4. エラーハンドリングの不備
5. 境界値チェックの不足
6. 状態管理の問題
7. 命名規則違反

問題を発見した場合は、以下のJSON形式で出力してください：
```json
{
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "title": "問題のタイトル",
      "description": "問題の詳細説明",
      "line": 行番号,
      "code": "問題のあるコードスニペット",
      "recommendation": "修正方法の提案",
      "auto_fix_available": true/false,
      "suggested_fix": "修正後のコード（auto_fix_availableがtrueの場合）"
    }
  ]
}
```

問題がない場合は空の配列を返してください：
```json
{"issues": []}
```"""
    
    def get_review_prompt(self, code: str, file_path: str, context: dict) -> str:
        return f"""以下のコードをビジネスロジックの観点からレビューしてください。

ファイル: {file_path}

```
{code}
```

ビジネスロジック上の問題を検出し、JSON形式で出力してください。"""


class MultiAgentOrchestrator:
    """複数エージェントの並列実行を管理するオーケストレーター"""
    
    def __init__(self, llm_client: tuple):
        self.llm_client = llm_client
        self.agents: list[BaseReviewAgent] = [
            SecurityAgent(llm_client),
            PerformanceAgent(llm_client),
            TestingAgent(llm_client),
            DocumentationAgent(llm_client),
            BusinessLogicAgent(llm_client),
        ]
        self.cycle_count = 0
    
    async def review_file(
        self,
        file_path: str,
        code: str,
        context: dict | None = None
    ) -> OrchestratorResult:
        """単一ファイルを全エージェントで並列レビュー"""
        self.cycle_count += 1
        start_time = time.time()
        
        # 全エージェントを並列実行
        tasks = [agent.review(code, file_path, context) for agent in self.agents]
        results = await asyncio.gather(*tasks)
        
        # 結果を集計
        total_issues = sum(len(r.issues) for r in results)
        total_time = time.time() - start_time
        
        # CRITICALまたはHIGHの問題がなければパス
        critical_or_high = sum(
            1 for r in results for issue in r.issues
            if issue.severity in [IssueSeverity.CRITICAL, IssueSeverity.HIGH]
        )
        
        return OrchestratorResult(
            cycle_id=self.cycle_count,
            results=list(results),
            total_issues=total_issues,
            fixed_issues=0,
            total_time=total_time,
            status="complete",
            all_passed=(critical_or_high == 0)
        )
    
    async def auto_fix(
        self,
        file_path: str,
        code: str,
        issues: list[CodeIssue]
    ) -> tuple[str, int]:
        """問題を自動修復"""
        fixed_code = code
        fixes_applied = 0
        
        for issue in issues:
            if issue.auto_fix_available and issue.suggested_fix:
                # 問題のあるコードを修正後のコードで置換
                if issue.code_snippet and issue.code_snippet in fixed_code:
                    fixed_code = fixed_code.replace(issue.code_snippet, issue.suggested_fix)
                    fixes_applied += 1
        
        return fixed_code, fixes_applied
    
    async def review_and_fix(
        self,
        file_path: str,
        code: str,
        context: dict | None = None,
        max_iterations: int = MAX_ITERATIONS_DEFAULT
    ) -> tuple[str, OrchestratorResult]:
        """レビューと自動修復を繰り返す"""
        current_code = code
        final_result = None
        
        for iteration in range(max_iterations):
            print(f"\n--- Iteration {iteration + 1}/{max_iterations} ---")
            
            result = await self.review_file(file_path, current_code, context)
            final_result = result
            
            if result.all_passed:
                print(f"All checks passed!")
                break
            
            # 自動修復可能な問題を収集
            fixable_issues = [
                issue
                for r in result.results
                for issue in r.issues
                if issue.auto_fix_available and issue.suggested_fix
            ]
            
            if not fixable_issues:
                print(f"No auto-fixable issues found. Manual intervention required.")
                break
            
            # 修復を適用
            current_code, fixes = await self.auto_fix(file_path, current_code, fixable_issues)
            final_result.fixed_issues = fixes
            
            if fixes == 0:
                print(f"No fixes could be applied.")
                break
            
            print(f"Applied {fixes} fixes. Re-reviewing...")
        
        return current_code, final_result


def get_changed_files() -> list[str]:
    """Gitで変更されたファイルを取得"""
    try:
        # ステージングされたファイル
        staged = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
            capture_output=True,
            text=True,
            check=True
        )
        staged_files = staged.stdout.strip().split("\n") if staged.stdout.strip() else []
        
        # 未ステージングの変更ファイル
        unstaged = subprocess.run(
            ["git", "diff", "--name-only", "--diff-filter=ACMR"],
            capture_output=True,
            text=True,
            check=True
        )
        unstaged_files = unstaged.stdout.strip().split("\n") if unstaged.stdout.strip() else []
        
        # 新規ファイル
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            capture_output=True,
            text=True,
            check=True
        )
        untracked_files = untracked.stdout.strip().split("\n") if untracked.stdout.strip() else []
        
        # 重複を除去
        all_files = list(set(staged_files + unstaged_files + untracked_files))
        
        # コードファイルのみをフィルタ
        code_extensions = {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs", ".java", ".kt", ".swift"}
        code_files = [f for f in all_files if f and Path(f).suffix in code_extensions]
        
        return code_files
    except subprocess.CalledProcessError:
        return []


def read_file_content(file_path: str) -> str | None:
    """ファイルの内容を読み取る"""
    try:
        path = Path(file_path)
        if not path.exists():
            return None
        if path.stat().st_size > MAX_FILE_SIZE_BYTES:
            print(f"Warning: {file_path} is too large, skipping...")
            return None
        return path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None


def write_file_content(file_path: str, content: str) -> bool:
    """ファイルに内容を書き込む"""
    try:
        Path(file_path).write_text(content, encoding="utf-8")
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False


def print_results(result: OrchestratorResult, file_path: str):
    """レビュー結果を表示"""
    print(f"\n{'='*60}")
    print(f"Review Results for: {file_path}")
    print(f"{'='*60}")
    print(f"Total Issues: {result.total_issues}")
    print(f"Fixed Issues: {result.fixed_issues}")
    print(f"Time Elapsed: {result.total_time:.2f}s")
    print(f"Status: {'PASSED' if result.all_passed else 'NEEDS ATTENTION'}")
    
    for agent_result in result.results:
        if agent_result.issues:
            print(f"\n--- {agent_result.agent_type.value.upper()} ---")
            for issue in agent_result.issues:
                severity_icon = {
                    IssueSeverity.CRITICAL: "[CRITICAL]",
                    IssueSeverity.HIGH: "[HIGH]",
                    IssueSeverity.MEDIUM: "[MEDIUM]",
                    IssueSeverity.LOW: "[LOW]"
                }.get(issue.severity, "[?]")
                print(f"  {severity_icon} {issue.title}")
                print(f"    Line: {issue.line_number}")
                print(f"    {issue.description}")
                print(f"    Recommendation: {issue.recommendation}")
                if issue.auto_fix_available:
                    print(f"    Auto-fix: Available")


async def main():
    """メイン処理"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Devin Pre-PR Review System")
    parser.add_argument("--auto-fix", action="store_true", help="自動修復を有効にする")
    parser.add_argument("--max-iterations", type=int, default=MAX_ITERATIONS_DEFAULT,
                        help=f"最大反復回数（デフォルト: {MAX_ITERATIONS_DEFAULT}）")
    parser.add_argument("--files", nargs="*", help="レビュー対象ファイル（指定しない場合はGit変更ファイル）")
    args = parser.parse_args()
    
    # LLMクライアントを取得
    llm_client = get_llm_client()
    if llm_client[0] is None:
        print("Error: No LLM API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.")
        sys.exit(1)
    
    print(f"Using LLM: {llm_client[0]}")
    
    # レビュー対象ファイルを取得
    if args.files:
        files = args.files
    else:
        files = get_changed_files()
    
    if not files:
        print("No files to review.")
        sys.exit(0)
    
    print(f"Files to review: {files}")
    
    # オーケストレーターを初期化
    orchestrator = MultiAgentOrchestrator(llm_client)
    
    all_passed = True
    total_issues = 0
    total_fixed = 0
    
    for file_path in files:
        code = read_file_content(file_path)
        if code is None:
            continue
        
        if args.auto_fix:
            fixed_code, result = await orchestrator.review_and_fix(
                file_path, code, max_iterations=args.max_iterations
            )
            
            # 修正されたコードを書き戻す
            if fixed_code != code:
                write_file_content(file_path, fixed_code)
                print(f"Updated: {file_path}")
        else:
            result = await orchestrator.review_file(file_path, code)
        
        print_results(result, file_path)
        
        if not result.all_passed:
            all_passed = False
        total_issues += result.total_issues
        total_fixed += result.fixed_issues
    
    # サマリー
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Files Reviewed: {len(files)}")
    print(f"Total Issues: {total_issues}")
    print(f"Total Fixed: {total_fixed}")
    print(f"Overall Status: {'PASSED' if all_passed else 'NEEDS ATTENTION'}")
    
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    asyncio.run(main())
