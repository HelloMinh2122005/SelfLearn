#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------------------------
# Git Push Automation Script for SelfLearn Workspace
# Format: <type>: <day-month-year> - <details>
# Types: feat | fix | core | docs | refactor | chore | test
# ------------------------------------------------------------------------------

VALID_TYPES="feat|fix|core|docs|refactor|chore|test"

show_usage() {
    echo "Usage:"
    echo "  $0 <type> <details>"
    echo "  $0 \"<type>: <details>\""
    echo ""
    echo "Valid types: feat, fix, core, docs, refactor, chore, test"
    echo "Example:"
    echo "  $0 feat \"Thêm bài học 1_1_1 Create users and groups\""
    echo "  $0 docs \"Cập nhật sổ tay ghi chú note.md\""
    exit 1
}

if [ $# -lt 1 ]; then
    show_usage
fi

TYPE="$1"
shift || true
DETAILS="$*"

# Handle case where user passes "feat: my details" as single argument
if [[ "$TYPE" =~ ^([a-zA-Z]+):?$ ]] && [ -z "$DETAILS" ]; then
    echo "Error: Thiếu nội dung mô tả chi tiết (details)!"
    show_usage
elif [[ "$TYPE" =~ ^([a-zA-Z]+):[[:space:]]*(.+)$ ]]; then
    TYPE="${BASH_REMATCH[1]}"
    DETAILS="${BASH_REMATCH[2]}"
fi

# Normalize type to lowercase and remove trailing colon if present
TYPE=$(echo "$TYPE" | tr '[:upper:]' '[:lower:]' | tr -d ':')

# Validate type
if ! echo "$TYPE" | grep -Eq "^($VALID_TYPES)$"; then
    echo "❌ Error: Loại commit '$TYPE' không hợp lệ!"
    echo "Chỉ chấp nhận các loại: feat, fix, core, docs, refactor, chore, test"
    exit 1
fi

if [ -z "$DETAILS" ]; then
    echo "❌ Error: Vui lòng nhập nội dung mô tả chi tiết (details)!"
    exit 1
fi

# Calculate current date in DD-MM-YYYY format
TODAY=$(date +"%d-%m-%Y")

# Build commit message
COMMIT_MSG="${TYPE}: ${TODAY} - ${DETAILS}"

echo "=========================================================="
echo "📦 Chuẩn bị commit & push với message:"
echo "👉 \"$COMMIT_MSG\""
echo "=========================================================="

# Check workspace changes
STATUS=$(git status -s)
if [ -z "$STATUS" ]; then
    echo "ℹ️ Không có thay đổi nào cần commit."
    exit 0
fi

# Show staged changes preview
echo "📂 Danh sách tệp tin thay đổi:"
git status -s
echo ""

# Stage files
git add .

# Commit
git commit -m "$COMMIT_MSG"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "🚀 Đang đẩy lên remote origin/$CURRENT_BRANCH ..."

# Push
git push origin "$CURRENT_BRANCH"

echo "=========================================================="
echo "✅ Push thành công!"
echo "=========================================================="
