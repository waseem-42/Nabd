import type { Dict } from '../index'

/** Body profile, load suggestions, warm-ups and plates. Keys are prefixed 'body.'. */
export default {
  'body.title': { ar: 'عن جسمك', en: 'About you' },
  'body.intro': {
    ar: 'نستخدمها عشان نقترح أوزان البداية والإحماء المناسب لك. تبقى على جهازك بس.',
    en: 'Used to suggest starting weights and the right warm-up. It never leaves this device.',
  },
  'body.weight': { ar: 'وزنك', en: 'Your weight' },
  'body.height': { ar: 'طولك (اختياري)', en: 'Your height (optional)' },
  'body.cm': { ar: 'سم', en: 'cm' },
  'body.level': { ar: 'خبرتك في التمرين', en: 'Training experience' },
  'body.level.beginner': { ar: 'أقل من ٦ شهور', en: 'Under 6 months' },
  'body.level.intermediate': { ar: '٦ شهور – سنتين', en: '6 months – 2 years' },
  'body.level.advanced': { ar: 'أكثر من سنتين', en: 'Over 2 years' },
  'body.skipWeight': { ar: 'ما أبي أحدد وزني', en: "I'd rather not say" },
  'body.noWeight': { ar: 'ما سجلت وزنك — بنبدأ الأوزان من صفر وتحددها أنت.', en: 'No weight logged — weights start at zero and you set them.' },
  'body.autoWarmup': { ar: 'مجموعات إحماء تلقائية', en: 'Automatic warm-up sets' },
  'body.autoWarmupHint': {
    ar: 'قبل أول تمرين ثقيل لكل عضلة، نضيف مجموعات أخف تجهّز المفاصل. راحتها أقصر (٤٥ ث).',
    en: 'Before the first heavy lift for each muscle we add lighter sets to prime the joints, with a shorter rest (45 s).',
  },
  'body.saveWeight': { ar: 'سجّل وزن اليوم', en: "Log today's weight" },
  'body.weightSaved': { ar: 'انحفظ وزنك', en: 'Weight saved' },

  // Prefill explanations in the workout.
  'body.hint.progress': {
    ar: 'كمّلت كل التكرارات آخر مرة — زدنا خطوة. إذا ثقل عليك ارجع للوزن السابق.',
    en: 'You hit every rep last time, so this is one step up. Drop back if it feels too heavy.',
  },
  'body.hint.body': {
    ar: 'وزن بداية مقترح من وزن جسمك وخبرتك. جرّبه في أول مجموعة وعدّله.',
    en: 'A starting weight from your body weight and experience. Try it on the first set and adjust.',
  },
  'body.effectiveLoad': { ar: 'تشيل تقريبًا {load} من وزن جسمك', en: "You're moving about {load} of body weight" },
  'body.addWarmups': { ar: 'أضف مجموعات إحماء', en: 'Add warm-up sets' },
  'body.noWarmupNeeded': { ar: 'الوزن خفيف — ما يحتاج إحماء خاص', en: 'Light enough — no ramp-up needed' },

  // Plate calculator.
  'body.plates': { ar: 'لكل جهة من البار', en: 'Per side of the bar' },
  'body.emptyBar': { ar: 'البار فاضي ({bar})', en: 'Empty bar ({bar})' },
  'body.platesRest': { ar: 'يبقى {rest} ما تطلع بأقراص قياسية', en: '{rest} left that standard plates can’t make' },

  // General warm-up.
  'body.warmupTitle': { ar: 'إحماء قبل ما تبدأ', en: 'Warm up first' },
  'body.warmupMeta': { ar: 'حوالي {n} دقايق · حسب تمرين اليوم', en: 'About {n} min · built for today' },
  'body.warmupLowImpact': { ar: 'بدون قفز — أريح للمفاصل', en: 'No jumping — easier on the joints' },
  'body.warmupDone': { ar: 'خلصت الإحماء', en: 'Warm-up done' },
  'body.warmupShow': { ar: 'اعرض الإحماء', en: 'Show warm-up' },
  'body.move.march': { ar: 'مشي في المكان مع رفع الركب', en: 'March in place, knees up' },
  'body.move.jog': { ar: 'هرولة خفيفة أو جمبنق جاك', en: 'Light jog or jumping jacks' },
  'body.move.armCircles': { ar: 'دوائر بالذراعين للأمام والخلف', en: 'Arm circles, forward and back' },
  'body.move.scapPushup': { ar: 'ضغط لوحي الكتف', en: 'Scapular push-ups' },
  'body.move.bandPullApart': { ar: 'فتح الذراعين للخلف (بحبل أو بدونه)', en: 'Pull-aparts (band or no band)' },
  'body.move.bwSquat': { ar: 'سكوات بوزن الجسم ببطء', en: 'Slow bodyweight squats' },
  'body.move.legSwings': { ar: 'أرجحة الرجل أمام وخلف', en: 'Leg swings, front to back' },
  'body.move.hipOpener': { ar: 'فتح الحوض واقفًا', en: 'Standing hip openers' },
  'body.move.catCow': { ar: 'قطة وبقرة على الأربع', en: 'Cat–cow on all fours' },
  'body.move.deadBug': { ar: 'ديد بق ببطء', en: 'Slow dead bugs' },
  'body.perSide': { ar: '{n} لكل جهة', en: '{n} each side' },

  // Recovery card.
  'body.recoveryTitle': { ar: 'جاهزية عضلاتك', en: 'Muscle readiness' },
  'body.recoveryHint': {
    ar: 'تقدير من آخر مرة شغّلت كل مجموعة — العضلة تحتاج عادة ٤٨–٧٢ ساعة.',
    en: 'Estimated from when you last trained each group — muscles usually need 48–72 hours.',
  },
  'body.fresh': { ar: 'جاهزة', en: 'Ready' },
  'body.recovering': { ar: 'تتعافى', en: 'Recovering' },
  'body.recommended': { ar: 'يناسب مستواك', en: 'Fits your level' },
} satisfies Dict
