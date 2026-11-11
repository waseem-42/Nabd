#!/usr/bin/env bash
# Stop: auto-save work. Commits changes and pushes them to a personal work branch
# (never main), then opens a draft Pull Request once. Merging stays manual.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
gitdir=$(git rev-parse --git-dir 2>/dev/null) || exit 0

msg() { # print a JSON systemMessage shown to the user
  local t=${1//\\/\/}; t=${t//\"/\'}
  printf '{"systemMessage": "%s"}\n' "$t"; exit 0
}

# Don't touch the repo in the middle of a merge/rebase/cherry-pick.
for f in MERGE_HEAD rebase-merge rebase-apply CHERRY_PICK_HEAD REVERT_HEAD; do
  [ -e "$gitdir/$f" ] && msg "nabd-sync: الحفظ التلقائي متوقف مؤقتًا (دمج أو rebase جارٍ)."
done

branch=$(git symbolic-ref --short -q HEAD) || exit 0
[ -n "$(git config user.email)" ] || msg "nabd-sync: لم يُحفظ شيء - اضبط git config user.name و user.email أولًا."

changes=$(git status --porcelain)
if [ -z "$changes" ]; then
  # Nothing new; still push commits that weren't pushed yet (feature branches only).
  if [ "$branch" != "main" ] && [ -n "$(git log --oneline "origin/$branch..HEAD" 2>/dev/null || git log --oneline origin/main..HEAD 2>/dev/null)" ]; then
    git push -q -u origin "$branch" 2>/dev/null && msg "nabd-sync: تم رفع commits الفرع $branch إلى GitHub."
  fi
  exit 0
fi

# Never commit on main: move the uncommitted work to a new personal branch.
if [ "$branch" = "main" ]; then
  who=$(gh api user --jq .login 2>/dev/null || git config user.name)
  who=$(printf '%s' "$who" | tr -cs 'A-Za-z0-9' '-' | tr 'A-Z' 'a-z' | sed 's/^-//;s/-$//')
  branch="work/${who:-me}-$(date +%Y%m%d-%H%M)"
  git switch -q -c "$branch" || msg "nabd-sync: تعذّر إنشاء فرع جديد للحفظ."
fi

git add -A
# Secret guard: refuse to commit anything that looks like a credential.
if git diff --cached --name-only | grep -Eiq '(^|/)\.env($|\.)|\.pem$|\.key$|id_rsa' ||
   git diff --cached -U0 | grep -Eq '^\+.*(ghp_[A-Za-z0-9]{20}|gho_[A-Za-z0-9]{20}|sk-[A-Za-z0-9_-]{20}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30}|BEGIN [A-Z ]*PRIVATE KEY)'; then
  git reset -q
  msg "nabd-sync: لم يتم الرفع - يبدو أن التعديلات تحتوي ملف أسرار أو مفتاح. راجعها أولًا."
fi

files=$(git diff --cached --name-only | head -5 | tr '\n' ' ')
git commit -q -m "wip: auto-save $(date '+%Y-%m-%d %H:%M')" -m "Files: $files" || msg "nabd-sync: تعذّر إنشاء commit."

if ! git push -q -u origin "$branch" 2>/dev/null; then
  msg "nabd-sync: حُفظ commit محليًا على $branch لكن الرفع فشل (إنترنت أو تحديثات أحدث على GitHub). اطلب: «ارفع فرعي»."
fi

pr=""
if command -v gh >/dev/null 2>&1; then
  pr=$(gh pr view "$branch" --json url --jq .url 2>/dev/null)
  if [ -z "$pr" ]; then
    pr=$(gh pr create --draft --base main --head "$branch" --title "$branch" \
         --body "حفظ تلقائي من Claude Code. حوّله إلى Ready for review عند الانتهاء، والدمج يدوي بعد المراجعة." 2>/dev/null | tail -1)
  fi
fi
msg "nabd-sync: تم الحفظ والرفع على $branch. ${pr}"
