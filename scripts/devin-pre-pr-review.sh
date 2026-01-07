#!/bin/bash
#
# Devin Pre-PR Review System - Shell Wrapper
#
# PR作成前に複数の専門エージェントによる並列レビューを実行し、
# 問題が見つかった場合は自動修復を行うシステム。
#
# 使用方法:
#   ./scripts/devin-pre-pr-review.sh [--auto-fix] [--max-iterations N] [files...]
#
# 環境変数:
#   OPENAI_API_KEY: OpenAI APIキー
#   ANTHROPIC_API_KEY: Anthropic APIキー（オプション、フォールバック用）
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="${SCRIPT_DIR}/devin-pre-pr-review.py"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed"
    exit 1
fi

# Check if required packages are installed
check_packages() {
    local missing_packages=()
    
    if ! python3 -c "import openai" 2>/dev/null; then
        if ! python3 -c "import anthropic" 2>/dev/null; then
            missing_packages+=("openai or anthropic")
        fi
    fi
    
    if [ ${#missing_packages[@]} -gt 0 ]; then
        echo "Warning: Some packages may be missing: ${missing_packages[*]}"
        echo "Installing required packages..."
        pip install openai anthropic 2>/dev/null || true
    fi
}

# Check for API keys
check_api_keys() {
    if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "Error: No LLM API key found."
        echo "Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable."
        exit 1
    fi
}

# Main
main() {
    echo "=========================================="
    echo "Devin Pre-PR Review System"
    echo "=========================================="
    
    check_api_keys
    check_packages
    
    # Run the Python script with all arguments
    python3 "$PYTHON_SCRIPT" "$@"
    
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo "Review PASSED - Ready to create PR"
        echo "=========================================="
    else
        echo ""
        echo "=========================================="
        echo "Review NEEDS ATTENTION"
        echo "Please fix the issues before creating PR"
        echo "=========================================="
    fi
    
    exit $exit_code
}

main "$@"
