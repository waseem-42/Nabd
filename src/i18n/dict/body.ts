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
  'body.hint.deload': {
    ar: 'أسبوع تخفيف: مجموعة أقل ووزن أخف بحوالي 10%. خله سهل عن قصد.',
    en: 'Deload week: one set fewer and about 10% lighter. Keep it easy on purpose.',
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
  'body.repsCount': { ar: '× {n}', en: '× {n}' },
  'body.howTo': { ar: 'طريقة الأداء', en: 'How to do it' },
  'body.warmupNext': { ar: 'تم، التالي', en: 'Done, next' },
  'body.warmupStart': { ar: 'خلصت الإحماء، ابدأ التمرين', en: 'Warm-up done, start training' },
  'body.warmupSkip': { ar: 'تخطي الإحماء', en: 'Skip warm-up' },
  'body.warmupStep': { ar: 'الإحماء', en: 'Warm-up' },
  'body.timerStart': { ar: 'ابدأ', en: 'Start' },
  'body.timerPause': { ar: 'إيقاف', en: 'Pause' },
  'body.timerReset': { ar: 'من البداية', en: 'Reset' },
  'body.how.march': {
    ar: 'قف مستقيم وشد بطنك خفيف.|ارفع ركبة لين تقارب مستوى الحوض، ونزّلها وارفع الثانية.|حرّك ذراعيك مع الخطوات وخلّ النَّفَس منتظم.',
    en: 'Stand tall with your stomach lightly braced.|Lift one knee toward hip height, lower it and lift the other.|Swing your arms with the steps and keep breathing steadily.',
  },
  'body.how.jog': {
    ar: 'هرول في مكانك على أطراف قدميك بخطوات قصيرة.|أو سوّ جمبنق جاك: افتح الرجلين والذراعين مع القفز ورجّعهم.|ابدأ بهدوء وزِد السرعة شوي شوي لين تحس بالدفا.',
    en: 'Jog on the spot on the balls of your feet with short steps.|Or do jumping jacks: jump feet and arms out, then back in.|Start easy and build the pace until you feel warm.',
  },
  'body.how.armCircles': {
    ar: 'افرد ذراعيك على الجانبين بمستوى الكتف.|سوّ دوائر صغيرة للأمام وكبّرها تدريجيًا.|نص الوقت للأمام والنص الثاني للخلف.',
    en: 'Hold your arms out to the sides at shoulder height.|Make small forward circles and let them grow.|Spend half the time forward and half backward.',
  },
  'body.how.scapPushup': {
    ar: 'خذ وضعية الضغط والذراعين مفرودة.|بدون ما تثني المرفق، خلّ صدرك ينزل شوي ولوحا الكتف يقربون من بعض.|ادفع الأرض بعيد ولوحا الكتف يتباعدون. حركة صغيرة وبطيئة.',
    en: 'Get into a push-up position with straight arms.|Without bending your elbows, let your chest sink so the shoulder blades squeeze together.|Push the floor away so they spread apart. Small, slow movement.',
  },
  'body.how.bandPullApart': {
    ar: 'امسك حبل مطاطي (أو بدونه) قدامك بمستوى الصدر والذراعين مفرودة.|افتح ذراعيك للجانبين لين يقرب الحبل من صدرك.|ضم لوحي الكتف لحظة وارجع ببطء.',
    en: 'Hold a band (or nothing) in front at chest height, arms straight.|Pull your arms out to the sides until the band nears your chest.|Squeeze your shoulder blades for a moment and return slowly.',
  },
  'body.how.bwSquat': {
    ar: 'القدمين بعرض الكتف تقريبًا وأصابع القدم للخارج شوي.|انزل كأنك بتجلس على كرسي، الصدر مرفوع والركب باتجاه أصابع القدم.|اطلع بالضغط على كامل القدم. انزل ببطء ووسّع المدى مع كل تكرار.',
    en: 'Feet about shoulder-width apart, toes turned out a little.|Sit back as if onto a chair, chest up, knees tracking over the toes.|Stand by pressing through the whole foot. Go slowly and deepen each rep.',
  },
  'body.how.legSwings': {
    ar: 'امسك جدار أو شي ثابت بيد وحدة.|أرجح الرجل البعيدة للأمام والخلف بشكل مريح والجذع ثابت.|كبّر المدى تدريجيًا، وبعدها بدّل الرجل.',
    en: 'Hold a wall or something steady with one hand.|Swing the outside leg forward and back, keeping your torso still.|Let the range grow gradually, then switch legs.',
  },
  'body.how.hipOpener': {
    ar: 'قف وامسك شي ثابت إذا تحتاج توازن.|ارفع الركبة لقدام ولفّها للجنب في دائرة كبيرة، ونزّلها.|سوّ العدد كامل، وبعدها بدّل الرجل.',
    en: 'Stand and hold something steady if you need balance.|Lift the knee in front, circle it out to the side and lower it.|Finish the reps, then switch legs.',
  },
  'body.how.catCow': {
    ar: 'انزل على يدينك وركبك: اليدين تحت الكتف والركب تحت الحوض.|مع الشهيق نزّل بطنك وارفع راسك وصدرك (بقرة).|مع الزفير قوّس ظهرك لفوق ونزّل راسك (قطة). حركة بطيئة مع النفس.',
    en: 'Kneel on all fours: hands under shoulders, knees under hips.|Breathe in, let your belly drop and lift your head and chest (cow).|Breathe out, round your back up and tuck your head (cat). Move with the breath.',
  },
  'body.how.deadBug': {
    ar: 'استلقِ على ظهرك، الذراعين لفوق والركب مثنية فوق الحوض.|اضغط أسفل ظهرك على الأرض وشد بطنك.|مدّ ذراع والرجل المعاكسة ببطء ورجّعهم، وبعدها الجهة الثانية.',
    en: 'Lie on your back, arms up, knees bent above your hips.|Press your lower back into the floor and brace your stomach.|Slowly reach one arm and the opposite leg out, return, then switch.',
  },

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
