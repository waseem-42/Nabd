#!/usr/bin/env bash
# Stop: auto-save work straight to main. Commits changes, rebases on the latest origin/main
# (so pushes from another machine are kept), then pushes. No branches, no Pull Requests.
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

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  # Secret guard: refuse to commit anything that looks like a credential.
  if git diff --cached --name-only | grep -Eiq '(^|/)\.env($|\.)|\.pem$|\.key$|id_rsa' ||
     git diff --cached -U0 | grep -Eq '^\+.*(ghp_[A-Za-z0-9]{20}|gho_[A-Za-z0-9]{20}|sk-[A-Za-z0-9_-]{20}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30}|BEGIN [A-Z ]*PRIVATE KEY)'; then
    git reset -q
    msg "nabd-sync: لم يتم الرفع - يبدو أن التعديلات تحتوي ملف أسرار أو مفتاح. راجعها أولًا."
  fi
  files=$(git diff --cached --name-only | head -5 | tr '\n' ' ')
  git commit -q -m "wip: auto-save $(date '+%Y-%m-%d %H:%M')" -m "Files: $files" || msg "nabd-sync: تعذّر إنشاء commit."
fi

# An old branch from the PR days: save it where it is and point back to main.
if [ "$branch" != "main" ]; then
  if [ -n "$(git log --oneline "origin/$branch..HEAD" 2>/dev/null || echo new)" ]; then
    git push -q -u origin "$branch" 2>/dev/null
  fi
  msg "nabd-sync: أنت على الفرع القديم $branch، والشغل الحين يروح على main مباشرة. اطلب: «انقل شغلي إلى main»."
fi

# Nothing to send?
git fetch -q origin main 2>/dev/null || msg "nabd-sync: حُفظ commit محليًا لكن تعذّر الاتصال بـ GitHub. ينرفع في المرة الجاية."
[ -z "$(git log --oneline origin/main..HEAD)" ] && exit 0

# Put our commits on top of anything pushed from another machine, then push.
if ! git rebase -q origin/main >/dev/null 2>&1; then
  git rebase --abort >/dev/null 2>&1
  msg "nabd-sync: ما انرفع - تعديلاتك تتعارض مع تحديث جديد على main. شغلك محفوظ محليًا. اطلب: «حل التعارض وارفع»."
fi
git push -q origin main 2>/dev/null || msg "nabd-sync: حُفظ commit محليًا لكن الرفع فشل. ينرفع في المرة الجاية، أو اطلب: «ارفع على main»."
msg "nabd-sync: تم الحفظ والرفع على main."
