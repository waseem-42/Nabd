#!/usr/bin/env bash
# SessionStart: bring main up to date with what the other person pushed.
# Never discards local work: rebases with autostash and aborts on any conflict.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

out() { printf '%s\n' "$*"; }
out "[nabd-sync] بداية الجلسة:"

if ! git fetch origin --prune -q 2>/dev/null; then
  out "- تعذّر الاتصال بـ GitHub (تحقق من الإنترنت أو gh auth login). تشتغل على النسخة المحلية."
  exit 0
fi

branch=$(git symbolic-ref --short -q HEAD)
if [ "$branch" != "main" ]; then
  out "- أنت على الفرع $branch. الشغل الحين يروح على main مباشرة. اطلب: «انقل شغلي إلى main»."
else
  before=$(git rev-parse HEAD)
  if git rebase -q --autostash origin/main >/dev/null 2>&1; then
    if [ "$before" != "$(git rev-parse HEAD)" ]; then
      out "- تم سحب تحديثات جديدة إلى main:"
      git log --oneline --no-merges "$before..HEAD" 2>/dev/null | head -8 | sed 's/^/  /'
    else
      out "- main محدّث."
    fi
  else
    git rebase --abort >/dev/null 2>&1
    out "- تعذّر تحديث main تلقائيًا (تعديلاتك تتعارض مع الجديد). اطلب: «حدّث main وحل التعارض»."
  fi
fi
out "(تعليمات لـ Claude: لخّص هذا للمستخدم باختصار في أول رد.)"
exit 0
