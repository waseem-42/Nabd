import { Printer } from 'lucide-react'
import { EXERCISES } from '@/data/catalog'
import { isAnimated } from '@/domain/animated'
import { exerciseStepsFor, safetyFor } from '@/domain/safety'
import { pick, useLang, useT } from '@/i18n'
import { fmtDate } from '@/i18n/format'
import { MUSCLE_GROUPS, MUSCLE_TO_GROUP, type L10n } from '@/types'
import { Brand, Button } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'

/*
 * A printable sheet for a qualified coach: every animated exercise with its how-to and safety
 * cues, plus the rules the app uses to suggest weights. Open /coach-review, print or save as
 * PDF, and hand it over. No sign-up needed, so it can be shared as a link too.
 */

const RULES: { title: L10n; body: L10n }[] = [
  {
    title: { ar: 'وزن البداية', en: 'Starting weight' },
    body: {
      ar: 'لتمرين ما سواه المستخدم قبل: وزن الجسم × نسبة لنوع الحركة × معامل الخبرة (مبتدئ 1، متوسط 1.4، متقدم 1.8)، مقرّب لأقرب وزن ينركّب. أمثلة النسب: سكوات بالبار 0.45، بنش بالبار 0.40، ديدلفت روماني 0.40، ضغط عسكري 0.25، دمبل للكتف 0.08 لكل يد. ما نقترح وزن لأجهزة المساعدة والتمارين اللي ما يصح فيها تخمين.',
      en: 'For a lift never done before: body weight × a ratio per movement × a level factor (beginner 1, intermediate 1.4, advanced 1.8), rounded to a loadable weight. Example ratios: barbell squat 0.45, barbell bench 0.40, Romanian deadlift 0.40, military press 0.25, dumbbell shoulder press 0.08 per hand. No guess for assisted machines or lifts where one would mislead.',
    },
  },
  {
    title: { ar: 'التقدّم', en: 'Progression' },
    body: {
      ar: 'تقدّم مزدوج: إذا كمّل كل التكرارات المطلوبة في كل المجموعات آخر مرة، نزيد خطوة وزن (بار 2.5 كجم، دمبل 2 كجم) أو تكرار واحد في تمارين وزن الجسم. غير كذا نعيد نفس الأرقام.',
      en: 'Double progression: if every set hit the target reps last time, add one loadable step (barbell 2.5 kg, dumbbell 2 kg) or one rep for bodyweight moves. Otherwise repeat the same numbers.',
    },
  },
  {
    title: { ar: 'الهدف', en: 'Goal' },
    body: {
      ar: 'قوة: 4–6 تكرارات في التمارين بوزن، وراحة دقيقتين. بناء عضل: البرنامج كما هو (8–12)، وراحة دقيقة. لياقة: تكرارات أكثر بـ40% وثبات أطول بـ25%، وراحة 30 ثانية.',
      en: 'Strength: 4–6 reps on loaded lifts, 2-minute rests. Muscle: the program as written (8–12), 1-minute rests. Fitness: 40% more reps and 25% longer holds, 30-second rests.',
    },
  },
  {
    title: { ar: 'البرامج وأسبوع التخفيف', en: 'Programs and deload' },
    body: {
      ar: 'كل برنامج 8 أسابيع. الأسبوع الثامن تخفيف: مجموعة أقل (ما تقل عن 2) ووزن أخف بحوالي 10%، أو تكرارات أقل بالربع بدون وزن. بعدها يكمّل المستخدم نفس البرنامج أو ينتقل للمستوى الجاي.',
      en: 'Every program runs 8 weeks. Week 8 is a deload: one set fewer (at least 2) and about 10% lighter, or a quarter fewer reps without load. Then the user repeats the program or moves up a level.',
    },
  },
  {
    title: { ar: 'الإحماء', en: 'Warm-up' },
    body: {
      ar: 'إحماء عام أول كل جلسة: 2–3 دقايق لرفع النبض، وبعدها تحريك المناطق اللي بتشتغل. بدون قفز إذا مؤشر كتلة الجسم 30 أو أكثر. وقبل أول تمرين ثقيل لكل مجموعة عضلية مجموعات أخف تتدرّج (مثلًا البار الفاضي × 10، ثم 50% × 5، ثم 75% × 3)، وراحتها 45 ثانية.',
      en: 'A general warm-up opens every session: 2–3 minutes to raise the pulse, then mobility for the areas that will work; no jumping when BMI is 30 or more. Before the first heavy lift of each muscle group, ramp-up sets (e.g. empty bar × 10, 50% × 5, 75% × 3) with 45-second rests.',
    },
  },
]

const HEAD: Record<string, L10n> = {
  title: { ar: 'مراجعة المدرب', en: 'Coach review' },
  intro: {
    ar: 'نبض تطبيق تمارين يقترح خطة وأوزان، ويعرض كل تمرين بحركة متحركة. قبل ما ننشره نحتاج مدرب مؤهل يراجع الحركات والتعليمات وقواعد الأوزان. لكل تمرين: شوف الرسم، واقرأ الخطوات والتنبيهات، وعلّم «سليم» أو «يحتاج تعديل» واكتب الملاحظة. الحركة نفسها تقدر تشوفها تتحرك في التطبيق.',
    en: 'Nabd is a training app that suggests a plan and weights and shows every exercise as an animation. Before release, a qualified coach needs to review the movements, instructions and loading rules. For each exercise: look at the figure, read the steps and cues, tick “OK” or “Needs a change” and add a note. The animation itself can be watched in the app.',
  },
  rules: { ar: 'قواعد الأوزان والتقدّم', en: 'Loading and progression rules' },
  exercises: { ar: 'التمارين ({n})', en: 'Exercises ({n})' },
  ok: { ar: 'سليم', en: 'OK' },
  fix: { ar: 'يحتاج تعديل', en: 'Needs a change' },
  notes: { ar: 'ملاحظات', en: 'Notes' },
  steps: { ar: 'الخطوات', en: 'Steps' },
  cues: { ar: 'تنبيهات السلامة', en: 'Safety cues' },
  print: { ar: 'اطبع أو احفظ PDF', en: 'Print or save as PDF' },
  reviewer: { ar: 'اسم المراجع ومؤهله:', en: 'Reviewer and qualification:' },
  date: { ar: 'التاريخ:', en: 'Date:' },
}

export default function CoachReview() {
  const t = useT()
  const lang = useLang()
  const h = (key: keyof typeof HEAD) => pick(HEAD[key]!, lang)
  const animated = EXERCISES.filter((e) => isAnimated(e.id))

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 print:max-w-none print:bg-white print:px-0 print:text-black">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Brand />
          <h1 className="mt-3 text-3xl font-bold">{h('title')}</h1>
          <p className="text-sm text-muted print:text-neutral-600">v{__APP_VERSION__} · {fmtDate(Date.now(), lang, 'long')}</p>
        </div>
        <Button className="print:hidden" icon={<Printer className="size-5" />} onClick={() => window.print()}>{h('print')}</Button>
      </header>

      <p className="mb-4 leading-relaxed">{h('intro')}</p>
      <p className="mb-8 flex flex-wrap gap-x-10 gap-y-2 text-sm">
        <span>{h('reviewer')} ____________________________</span>
        <span>{h('date')} ____________</span>
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">{h('rules')}</h2>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {RULES.map((rule) => (
            <li key={rule.title.en} className="break-inside-avoid rounded-card border border-line p-4 print:border-neutral-300">
              <p className="mb-1 font-bold">{pick(rule.title, lang)}</p>
              <p className="text-sm leading-relaxed">{pick(rule.body, lang)}</p>
              <ReviewMarks ok={h('ok')} fix={h('fix')} notes={h('notes')} />
            </li>
          ))}
        </ol>
      </section>

      <h2 className="mb-3 text-xl font-bold">{t('app.tab.exercises')} · {animated.length}</h2>
      {MUSCLE_GROUPS.map((group) => {
        const list = animated.filter((e) => MUSCLE_TO_GROUP[e.primary] === group)
        if (!list.length) return null
        return (
          <section key={group} className="mb-8">
            <h3 className="mb-3 text-lg font-bold text-accent print:text-black">{t(`common.group.${group}`)}</h3>
            <div className="flex flex-col gap-4">
              {list.map((exercise) => (
                <article key={exercise.id} className="break-inside-avoid rounded-card border border-line p-4 print:border-neutral-300">
                  <div className="flex gap-4">
                    <MotionThumb exerciseId={exercise.id} name={pick(exercise.name, lang)} still className="size-28 shrink-0 rounded-control" />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold">{pick(exercise.name, lang)}</p>
                      <p className="text-xs text-muted print:text-neutral-600" dir="ltr">{lang === 'ar' ? exercise.name.en : exercise.name.ar} · {exercise.id}</p>
                      <p className="mt-1 text-sm text-muted print:text-neutral-700">
                        {t(`common.muscle.${exercise.primary}`)} · {t(`common.equipment.${exercise.equipment}`)} · {t(`common.level.${exercise.level}`)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm font-semibold">{h('steps')}</p>
                      <ol className="m-0 list-decimal space-y-1 ps-5 text-sm leading-relaxed">{exerciseStepsFor(exercise, lang).map((step, i) => <li key={i}>{step}</li>)}</ol>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold">{h('cues')}</p>
                      <ul className="m-0 list-disc space-y-1 ps-5 text-sm leading-relaxed">{safetyFor(exercise).cues.map((cue) => <li key={cue.en}>{pick(cue, lang)}</li>)}</ul>
                    </div>
                  </div>
                  <ReviewMarks ok={h('ok')} fix={h('fix')} notes={h('notes')} />
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ReviewMarks({ ok, fix, notes }: { ok: string; fix: string; notes: string }) {
  return (
    <div className="mt-3 border-t border-line pt-3 text-sm print:border-neutral-300">
      <p className="flex gap-6">
        <span>☐ {ok}</span>
        <span>☐ {fix}</span>
      </p>
      <p className="mt-2 text-muted print:text-neutral-600">{notes}: ______________________________________________</p>
    </div>
  )
}
