# =============================================================================
# Review Router Script - Copilot CLI セッション分離レビュー (Windows PowerShell)
# =============================================================================
#
# 各レビュースキルを独立した Copilot CLI セッションで実行し、
# 結果をファイルに出力するスクリプト。
#
# 使用方法:
#   .\scripts\review.ps1 [options]
#
# オプション:
#   -All                すべてのスキルを実行（デフォルト: 必須スキルのみ）
#   -Skill <name>       指定スキルのみ実行（複数指定可: -Skill code-review,test-analysis）
#   -Parallel           並列実行（デフォルト: 順次実行）
#   -OutputDir <dir>    出力ディレクトリ（デフォルト: .review-results）
#
# 例:
#   .\scripts\review.ps1                                    # 必須スキルのみ
#   .\scripts\review.ps1 -All                               # 全スキル実行
#   .\scripts\review.ps1 -Skill code-review                 # 単一スキル
#   .\scripts\review.ps1 -Skill code-review,test-analysis   # 複数スキル
#   .\scripts\review.ps1 -All -Parallel                     # 全スキル並列実行
#
# =============================================================================

[CmdletBinding()]
param(
    [switch]$All,
    [string[]]$Skill = @(),
    [switch]$Parallel,
    [string]$OutputDir = ".review-results",
    [switch]$NoCopilot,
    [switch]$Help
)

# ---------------------------------------------------------------------------
# 定数
# ---------------------------------------------------------------------------
$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$SKILLS_DIR = ".github\skills"

# 必須スキル（常に実行）
$MANDATORY_SKILLS = @("code-review", "error-handler-hunt")

# 条件付きスキル
$CONDITIONAL_SKILLS = @("test-analysis", "type-design-analysis", "comment-analysis", "code-simplification")

# すべてのスキル
$ALL_SKILLS = $MANDATORY_SKILLS + $CONDITIONAL_SKILLS

# ---------------------------------------------------------------------------
# 変数
# ---------------------------------------------------------------------------
$FailedSkills = [System.Collections.ArrayList]@()
$SucceededSkills = [System.Collections.ArrayList]@()
$SelectedSkills = [System.Collections.ArrayList]@()

# ---------------------------------------------------------------------------
# ユーティリティ関数
# ---------------------------------------------------------------------------
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO]  $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERR]  $Message" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# ヘルプ表示
# ---------------------------------------------------------------------------
function Show-Help {
    @"
Review Router Script - Copilot CLI セッション分離レビュー (Windows)

使用方法:
  .\scripts\review.ps1 [options]

オプション:
  -All                すべてのスキルを実行（デフォルト: 必須スキルのみ）
  -Skill <name>       指定スキルのみ実行（カンマ区切りで複数指定可）
  -Parallel           並列実行（デフォルト: 順次実行）
  -OutputDir <dir>    出力ディレクトリ（デフォルト: .review-results）
  -NoCopilot          Copilot CLI をスキップし、手動レビュー推奨メッセージのみ出力
  -Help               このヘルプを表示

利用可能なスキル:
  code-review           コードレビュー（必須）
  error-handler-hunt    エラーハンドリング検査（必須）
  test-analysis         テスト品質分析
  type-design-analysis  型設計評価
  comment-analysis      コメント分析
  code-simplification   コード簡素化

例:
  .\scripts\review.ps1                                    # 必須スキルのみ
  .\scripts\review.ps1 -All                               # 全スキル実行
  .\scripts\review.ps1 -Skill code-review                 # 単一スキル
  .\scripts\review.ps1 -Skill code-review,test-analysis   # 複数スキル
  .\scripts\review.ps1 -All -Parallel                     # 全スキル並列実行
"@
}

# ---------------------------------------------------------------------------
# Copilot CLI チェック
# ---------------------------------------------------------------------------
function Test-CopilotCli {
    $copilotPath = Get-Command copilot -ErrorAction SilentlyContinue
    if (-not $copilotPath) {
        Write-Err "Copilot CLI がインストールされていません"
        Write-Info "インストール方法:"
        Write-Info "  winget install GitHub.Copilot"
        Write-Info "  または: scoop install copilot-cli"
        Write-Info "  または: npm install -g @github/copilot"
        Write-Info "詳細: https://github.com/github/copilot-cli"
        exit 1
    }
    Write-Info "Copilot CLI: $($copilotPath.Source)"
    try {
        $versionOutput = & copilot version 2>$null
        if ($versionOutput) {
            Write-Info "バージョン: $($versionOutput -join ' ')"
        }
    } catch {
        # バージョン取得はオプション、失敗しても続行
    }
}

# ---------------------------------------------------------------------------
# 変更ファイルの検出
# ---------------------------------------------------------------------------
function Get-ChangedFiles {
    $changedFiles = ""

    # HEAD との差分（ステージング済み + 未ステージング）
    try {
        $changedFiles = git diff --name-only HEAD 2>$null
    } catch {}

    if (-not $changedFiles) {
        try {
            $changedFiles = git diff --name-only --cached 2>$null
        } catch {}
    }

    if (-not $changedFiles) {
        # develop ブランチとの差分を確認
        try {
            $changedFiles = git diff --name-only develop...HEAD 2>$null
        } catch {}
    }

    return $changedFiles
}

# ---------------------------------------------------------------------------
# 条件付きスキルの自動判定
# ---------------------------------------------------------------------------
function Test-ShouldRunSkill {
    param(
        [string]$SkillName,
        [string]$ChangedFiles
    )

    switch ($SkillName) {
        "test-analysis" {
            if ($ChangedFiles -match '\.(test|spec)\.(ts|tsx|js|jsx)$') { return $true }
            if ($ChangedFiles -match '\.(ts|tsx|js|jsx)$') { return $true }
            return $false
        }
        "type-design-analysis" {
            if ($ChangedFiles -match '\.(ts|tsx)$') { return $true }
            return $false
        }
        "comment-analysis" {
            if ($ChangedFiles -match '\.(md|mdx)$|README') { return $true }
            if ($ChangedFiles -match '\.(ts|tsx|js|jsx)$') { return $true }
            return $false
        }
        "code-simplification" {
            if ($ChangedFiles -match '\.(ts|tsx|js|jsx)$') { return $true }
            return $false
        }
        default {
            return $true
        }
    }
}

# ---------------------------------------------------------------------------
# 実行するスキルの決定
# ---------------------------------------------------------------------------
function Get-SkillsToRun {
    $changedFiles = Get-ChangedFiles

    if ($Skill.Count -gt 0) {
        # 明示的に指定されたスキル
        foreach ($s in $Skill) {
            $skillDir = Join-Path $PROJECT_ROOT $SKILLS_DIR $s
            if (-not (Test-Path $skillDir)) {
                Write-Err "スキルが見つかりません: $s"
                exit 1
            }
            [void]$SelectedSkills.Add($s)
        }
        return
    }

    if ($All) {
        foreach ($s in $ALL_SKILLS) {
            [void]$SelectedSkills.Add($s)
        }
        return
    }

    # 必須スキル
    foreach ($s in $MANDATORY_SKILLS) {
        [void]$SelectedSkills.Add($s)
    }

    # 条件付きスキルの自動判定
    foreach ($s in $CONDITIONAL_SKILLS) {
        if (Test-ShouldRunSkill -SkillName $s -ChangedFiles ($changedFiles -join "`n")) {
            [void]$SelectedSkills.Add($s)
            Write-Info "条件付きスキル追加: $s"
        } else {
            Write-Info "条件付きスキルスキップ: $s（該当変更なし）"
        }
    }
}

# ---------------------------------------------------------------------------
# スキル実行
# ---------------------------------------------------------------------------
function Invoke-Skill {
    param([string]$SkillName)

    $outputFile = Join-Path $OutputDir "$SkillName.md"
    $skillPath = "$SKILLS_DIR/$SkillName/SKILL.md" -replace '\\', '/'

    Write-Info "実行中: $SkillName ..."

    # Copilot CLI をプログラマティックモードで実行
    # 非インタラクティブモードでは --allow-all-tools が必須（公式ドキュメント参照）
    # 各呼び出しが独立したLLMセッション = 真のセッション分離
    $prompt = @"
変更されたコードに対して、@$skillPath のスキル定義に従いレビューを実施してください。
git diff で変更内容を確認し、変更されたファイルのみを対象にレビューしてください。
結果はMarkdown形式で出力してください。
"@

    $result = & copilot -p $prompt -s --allow-all-tools 2>&1
    $exitCode = $LASTEXITCODE
    $result | Out-File -FilePath $outputFile -Encoding utf8

    if ($exitCode -eq 0) {
        Write-Success "$SkillName 完了 → $outputFile"
        [void]$SucceededSkills.Add($SkillName)
    } else {
        Write-Err "$SkillName 失敗（終了コード: $exitCode）"
        if (Test-Path $outputFile -PathType Leaf) {
            $lines = Get-Content $outputFile
            if ($lines) {
                Write-Err "詳細は $outputFile を確認してください（最後の15行）:"
                $lines | Select-Object -Last 15 | ForEach-Object { Write-Err $_ }
            }
        }
        [void]$FailedSkills.Add($SkillName)
        @"
# $SkillName - 実行失敗

スキルの実行中にエラーが発生しました。
"@ | Out-File -FilePath $outputFile -Encoding utf8
    }
}

# ---------------------------------------------------------------------------
# 統合レポート生成
# ---------------------------------------------------------------------------
function New-IntegratedReport {
    $reportPath = Join-Path $OutputDir "review-report.md"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $reportContent = [System.Text.StringBuilder]::new()
    [void]$reportContent.AppendLine("# Review Router Report")
    [void]$reportContent.AppendLine("")
    [void]$reportContent.AppendLine("**実行日時:** $timestamp")
    [void]$reportContent.AppendLine("**実行モード:** Copilot CLI セッション分離")
    [void]$reportContent.AppendLine("**プラットフォーム:** Windows PowerShell")
    [void]$reportContent.AppendLine("")
    [void]$reportContent.AppendLine("## 実行されたスキル")
    [void]$reportContent.AppendLine("")

    foreach ($s in $ALL_SKILLS) {
        $executed = $SelectedSkills -contains $s
        $failed = $FailedSkills -contains $s

        if ($executed) {
            if ($failed) {
                [void]$reportContent.AppendLine("- [FAIL] $s（実行失敗）")
            } else {
                [void]$reportContent.AppendLine("- [OK] $s")
            }
        } else {
            [void]$reportContent.AppendLine("- [SKIP] $s（スキップ）")
        }
    }

    [void]$reportContent.AppendLine("")
    [void]$reportContent.AppendLine("---")
    [void]$reportContent.AppendLine("")

    # 各スキルの結果を統合
    foreach ($s in $SelectedSkills) {
        $resultFile = Join-Path $OutputDir "$s.md"
        if (Test-Path $resultFile) {
            [void]$reportContent.AppendLine("## $s")
            [void]$reportContent.AppendLine("")
            $content = Get-Content $resultFile -Raw -Encoding utf8
            [void]$reportContent.AppendLine($content)
            [void]$reportContent.AppendLine("")
            [void]$reportContent.AppendLine("---")
            [void]$reportContent.AppendLine("")
        }
    }

    $reportContent.ToString() | Out-File -FilePath $reportPath -Encoding utf8
}

# ---------------------------------------------------------------------------
# メイン処理
# ---------------------------------------------------------------------------
function Main {
    Push-Location $PROJECT_ROOT

    try {
        Write-Info "=== Review Router (Copilot CLI - Windows) ==="
        Write-Info ""

        # ヘルプ表示
        if ($Help) {
            Show-Help
            return
        }

        # -NoCopilot の場合は手動レビュー推奨メッセージのみ
        if ($NoCopilot) {
            Write-Warn "Copilot CLI をスキップしました（-NoCopilot）"
            Write-Info "手動レビューを推奨します。または以下の方法で Copilot CLI を利用できます:"
            Write-Info "  1. winget install GitHub.Copilot でインストール後、本スクリプトを再実行"
            Write-Info "  2. @review-router エージェントのモード2（動的読み込み）を利用"
            Write-Info "詳細: https://github.com/github/copilot-cli"
            return
        }

        # Copilot CLI チェック
        Test-CopilotCli

        # 実行スキル決定
        Get-SkillsToRun

        $executionMode = if ($Parallel) { "並列" } else { "順次" }

        Write-Info ""
        Write-Info "実行スキル: $($SelectedSkills -join ', ')"
        Write-Info "出力先: $OutputDir\"
        Write-Info "実行モード: $executionMode"
        Write-Info ""

        # 出力ディレクトリ作成
        if (-not (Test-Path $OutputDir)) {
            New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        }

        # 実行
        if ($Parallel) {
            # 並列実行（PowerShell Jobs）
            $jobs = @()
            foreach ($s in $SelectedSkills) {
                $jobScript = {
                    param($SkillName, $SkillsDir, $OutDir)

                    $outputFile = Join-Path $OutDir "$SkillName.md"
                    $skillPath = "$SkillsDir/$SkillName/SKILL.md" -replace '\\', '/'

                    $prompt = @"
変更されたコードに対して、@$skillPath のスキル定義に従いレビューを実施してください。
git diff で変更内容を確認し、変更されたファイルのみを対象にレビューしてください。
結果はMarkdown形式で出力してください。
"@

                    $result = & copilot -p $prompt -s --allow-all-tools 2>&1
                    $exitCode = $LASTEXITCODE
                    $result | Out-File -FilePath $outputFile -Encoding utf8

                    if ($exitCode -eq 0) {
                        return @{ Skill = $SkillName; Success = $true }
                    } else {
                        @"
# $SkillName - 実行失敗

スキルの実行中にエラーが発生しました。
"@ | Out-File -FilePath $outputFile -Encoding utf8
                        return @{ Skill = $SkillName; Success = $false; Error = "終了コード: $exitCode" }
                    }
                }

                $jobs += Start-Job -ScriptBlock $jobScript -ArgumentList $s, $SKILLS_DIR, $OutputDir
            }

            # すべてのジョブの完了を待つ
            $results = $jobs | Wait-Job | Receive-Job
            $jobs | Remove-Job -Force

            foreach ($r in $results) {
                if ($r.Success) {
                    Write-Success "$($r.Skill) 完了"
                    [void]$SucceededSkills.Add($r.Skill)
                } else {
                    Write-Err "$($r.Skill) 失敗: $($r.Error)"
                    [void]$FailedSkills.Add($r.Skill)
                }
            }
        } else {
            # 順次実行
            foreach ($s in $SelectedSkills) {
                Invoke-Skill -SkillName $s
            }
        }

        # サマリー出力
        Write-Info ""
        Write-Info "=== Review Summary ==="
        Write-Info "成功: $($SucceededSkills.Count)/$($SelectedSkills.Count)"

        if ($FailedSkills.Count -gt 0) {
            Write-Warn "失敗: $($FailedSkills -join ', ')"
        }

        Write-Info ""
        Write-Info "結果ファイル:"
        foreach ($s in $SelectedSkills) {
            $status = if ($FailedSkills -contains $s) { "[ERR]" } else { "[OK] " }
            Write-Info "  $status $OutputDir\$s.md"
        }

        # 統合レポート生成
        New-IntegratedReport

        Write-Info ""
        Write-Info "統合レポート: $OutputDir\review-report.md"
        Write-Success "レビュー完了"
    } finally {
        Pop-Location
    }
}

# ---------------------------------------------------------------------------
# エントリポイント
# ---------------------------------------------------------------------------
Main
