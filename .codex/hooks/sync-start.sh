#!/usr/bin/env bash
# SessionStart: bring this checkout up to date and report what teammates sent.
# Never discards local work: only fast-forwards, and aborts any merge that conflicts.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

out() { printf '%s\n' "$*"; }
out "[nabd-sync] بداية الجلسة:"

if ! git fetch origin --prune -q 2>/dev/null; then
  out "- تعذّر الاتصال بـ GitHub (تحقق من الإنترنت أو gh auth login). تشتغل على النسخة المحلية."
  exit 0
fi

branch=$(git symbolic-ref --short -q HEAD)
dirty=$(git status --porcelain)
before=$(git rev-parse HEAD)

if [ "$branch" = "main" ]; then
  if git merge --ff-only -q origin/main 2>/dev/null; then
    [ "$before" != "$(git rev-parse HEAD)" ] && out "- تم سحب تحديثات جديدة إلى main." || out "- main محدّث."
  else
    out "- تعذّر تحديث main تلقائيًا (توجد تعديلات محلية متعارضة). اطلب: «حدّث main بأمان»."
  fi
elif [ -n "$branch" ]; then
  # Pick up this branch's own commits pushed from elsewhere.
  if git rev-parse -q --verify "origin/$branch" >/dev/null; then
    git merge --ff-only -q "origin/$branch" 2>/dev/null
  fi
  behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
  if [ "$behind" -gt 0 ]; then
    if [ -z "$dirty" ] && git merge --no-edit -q origin/main >/dev/null 2>&1; then
      out "- تم دمج $behind تحديث جديد من main في فرعك $branch."
    else
      git merge --abort >/dev/null 2>&1
      out "- main فيه $behind تحديث جديد لم يُدمج في $branch (تعديلات غير محفوظة أو تعارض). اطلب: «ادمج آخر main في فرعي وحل التعارضات»."
    fi
  else
    out "- فرعك $branch محدّث مع main."
  fi
fi

if command -v gh >/dev/null 2>&1; then
  prs=$(gh pr list --state open --limit 10 --json number,title,author,headRefName \
        --template '{{range .}}  #{{.number}} {{.title}} ({{.author.login}}, {{.headRefName}}){{"\n"}}{{end}}' 2>/dev/null)
  if [ -n "$prs" ]; then out "- Pull Requests مفتوحة:"; out "$prs"; else out "- لا توجد Pull Requests مفتوحة."; fi
fi
out "(تعليمات لـ Claude: لخّص هذا للمستخدم باختصار في أول رد.)"
exit 0
