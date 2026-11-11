import type { Exercise, L10n, Lang } from '@/types'

// Exact catalogue IDs only. Do not borrow technique cues for a similarly named variant.
// Primary references and the scope of each cue are documented in docs/EXERCISE-SAFETY.md.
export const EXERCISE_SAFETY: Record<string, L10n[]> = {
  '6YUfHPL': [
    { ar: 'خل الكعبين على الأرض والركبتين باتجاه أصابع القدم، بدون انهيار للداخل.', en: 'Keep heels grounded and knees tracking with the toes, without collapsing inward.' },
    { ar: 'انزل بتحكم؛ قلل العمق إذا ارتفع الكعب أو بدأت تفقد ثبات الظهر.', en: 'Lower with control; reduce depth if heels lift or you lose a stable back position.' },
  ],
  I4hDWkc: [
    { ar: 'ثبت البطن وخل الرأس والجذع على خط واحد؛ تجنب هبوط أسفل الظهر.', en: 'Brace your trunk and align head and torso; avoid letting the lower back sag.' },
    { ar: 'ارفع الجسم وانزله كوحدة واحدة بدون رفع الحوض لحاله.', en: 'Raise and lower the body as one unit rather than lifting the hips alone.' },
  ],
  '9E25EOx': [
    { ar: 'ثبت وقفة متوازنة وخل الركبة الأمامية باتجاه القدم، بدون انهيار للداخل.', en: 'Use a balanced stance and keep the front knee tracking with the foot, without collapsing inward.' },
    { ar: 'انزل بتحكم مع ثبات الجذع؛ قلل المدى إذا فقدت التوازن.', en: 'Lower with a steady trunk; shorten the range if you lose balance.' },
  ],
  'glute-bridge': [
    { ar: 'ارفع الحوض بعصر عضلات المؤخرة، بدون زيادة تقوّس أسفل الظهر.', en: 'Lift the hips by engaging the glutes, without over-arching the lower back.' },
    { ar: 'ثبت القدمين وانزل الحوض بهدوء؛ تجنب الدفع المفاجئ.', en: 'Keep feet planted and lower the hips smoothly; avoid thrusting abruptly.' },
  ],
  bJYHBIN: [
    { ar: 'استخدم الجدار للتوازن وخل القدمين باتجاه الأمام.', en: 'Use the wall for balance and keep feet pointing forward.' },
    { ar: 'ارفع الكعبين وانزل بتحكم؛ تجنب الارتداد أو لف القدمين.', en: 'Raise and lower heels with control; avoid bouncing or twisting the feet.' },
  ],
  NbVPDMW: [
    { ar: 'ثبت الذراعين العلويين بجانب الجسم والرسغين بوضع مريح ومحايد.', en: 'Keep upper arms by your sides and wrists in a comfortable neutral position.' },
    { ar: 'ارفع بالذراع بدون تأرجح الجذع أو تقويس الظهر للمساعدة.', en: 'Curl without swinging the torso or arching the back to help lift.' },
  ],
  RVwzP10: [
    { ar: 'اسحب البار أمامك باتجاه أعلى الصدر، وليس خلف الرقبة.', en: 'Bring the bar down in front toward the upper chest, rather than behind the neck.' },
    { ar: 'ثبت الجذع؛ تجنب الاندفاع للخلف أو شد الوزن بهزة.', en: 'Keep the trunk steady; avoid leaning farther back or jerking the load.' },
  ],
  fUBheHs: [
    { ar: 'ثبت الجذع والرسغين؛ تجنب تقويس أسفل الظهر لشد الوزن.', en: 'Keep trunk and wrists steady; avoid arching the lower back to pull the load.' },
    { ar: 'اسحب وارجع بتحكم، بدون تأرجح الجسم للأمام والخلف.', en: 'Pull and return with control rather than rocking the body back and forth.' },
  ],
  '3d7wHyd': [
    { ar: 'ثبت الظهر على مسند المقعد وتجنب زيادة تقوّس أسفل الظهر.', en: 'Keep your back supported by the seat and avoid over-arching the lower back.' },
    { ar: 'ارفع وانزل الدمبل بتحكم، وقلل الحمل إذا فقدت ثبات الجذع.', en: 'Press and lower the dumbbells with control; reduce the load if the trunk loses stability.' },
  ],
  SpYC0Kp: [
    { ar: 'ثبت الرأس والكتفين والمؤخرة على المقعد والقدمين على الأرض.', en: 'Keep head, shoulders and hips supported on the bench, with feet grounded.' },
    { ar: 'ثبت الرسغين وانزل الدمبل بتحكم؛ استخدم حملًا تقدر ترفعه وتضعه بأمان.', en: 'Keep wrists steady and lower with control; choose a load you can safely position and put down.' },
  ],
  // Batch two.
  qXTaZnJ: [
    { ar: 'خذ البار من حامل بارتفاع الكتف تقريبًا وثبّته على أعلى الظهر، مو على الرقبة. استخدم مساند الأمان.', en: 'Take the bar from a rack set near shoulder height and rest it on the upper back, not the neck. Set the safety arms.' },
    { ar: 'خل الصدر مرفوع والركبتين باتجاه أصابع القدم؛ انزل للعمق اللي تتحكم فيه، ما يلزم توصل للموازي.', en: 'Keep the chest up and knees tracking the toes; squat only as deep as you control — parallel is not required.' },
  ],
  wQ2c4XD: [
    { ar: 'انحنِ من الوركين وظهرك محايد، والبار قريب من رجليك طول الحركة.', en: 'Hinge from the hips with a neutral back, keeping the bar close to your legs throughout.' },
    { ar: 'انزل لين تحس بشد خلف الفخذ، ووقف قبل ما يتقوّس ظهرك.', en: 'Lower until you feel tension in the back of the thighs, and stop before the back rounds.' },
  ],
  DsgkuIt: [
    { ar: 'ثني خفيف في المرفقين والكتفين لتحت وللخلف؛ ارفع لمستوى الكتف تقريبًا، مو أعلى.', en: 'Keep a slight elbow bend with shoulders down and back; raise to about shoulder height, not higher.' },
    { ar: 'وزن خفيف ونزول بطيء — بدون تأرجح الجسم.', en: 'Use a light load and lower slowly — no swinging the body.' },
  ],
  T2mxWqc: [
    { ar: 'ابدأ من تعلّق ثابت مع شد الكتفين؛ تجنب التأرجح أو الرفس للمساعدة.', en: 'Start from a steady hang with shoulders engaged; avoid swinging or kicking to help.' },
    { ar: 'انزل للآخر بتحكم. إذا ما تقدر تكمل التكرار، استخدم حبل مطاطي أو جهاز مساعدة.', en: 'Lower all the way with control. If you can’t finish a rep, use a band or an assisted machine.' },
  ],
  '3ZflifB': [
    { ar: 'خل المرفقين لاصقة بجنبك؛ الساعد بس اللي يتحرك.', en: 'Keep the elbows at your sides; only the forearms move.' },
    { ar: 'ارجع بهدوء لمستوى الصدر تقريبًا، ولا تخلي الوزن يسحب يدينك فجأة.', en: 'Return slowly to about chest height; don’t let the stack yank your hands up.' },
  ],
  // Batch five.
  'reverse-lunge': [
    { ar: 'ارجع خطوة للخلف وانزل بشكل مستقيم، والركبة الأمامية فوق القدم وباتجاه الأصابع.', en: 'Step back and lower straight down, front knee over the foot and tracking the toes.' },
    { ar: 'الجذع مستقيم والدمبل على جنبك؛ ادفع من كعب القدم الأمامية للرجوع.', en: 'Keep the torso upright with the dumbbells at your sides; push through the front heel to return.' },
  ],
  'mountain-climber': [
    { ar: 'اليدين تحت الكتفين والبطن مشدود؛ لا تخلي الورك يهبط أو يرتفع كثير.', en: 'Hands under the shoulders and abs braced; don’t let the hips sag or pike too high.' },
    { ar: 'ابدأ ببطء وزوّد السرعة بس إذا قدرت تحافظ على ثبات الجذع.', en: 'Start slowly and only speed up while you can keep the trunk steady.' },
  ],
  superman: [
    { ar: 'ارفع الذراعين والرجلين كم سانتي بس، والرقبة على خط الظهر ونظرك للأرض.', en: 'Lift the arms and legs only a few centimetres, neck in line with the back and eyes on the floor.' },
    { ar: 'شد البطن والمؤخرة ولا تقوّس أسفل الظهر بقوة؛ وقف إذا حسيت ألم.', en: 'Brace the abs and glutes and don’t force a deep arch; stop if your lower back hurts.' },
  ],
  'leg-extension': [
    { ar: 'عدّل الجهاز بحيث الركبة على محور الجهاز والوسادة فوق الكاحل.', en: 'Set the machine so the knee lines up with its pivot and the pad sits just above the ankle.' },
    { ar: 'افرد الركبة بتحكم بدون قفل عنيف، ونزّل الوزن ببطء؛ استخدم وزن خفيف إذا عندك ألم بالركبة.', en: 'Extend with control without snapping the knee locked, and lower slowly; keep the load light if your knees hurt.' },
  ],
  X6C6i5Y: [
    { ar: 'خل ظهرك قريب من البنش والكتفين لتحت وللخلف، والمرفقين يرجعون للخلف مو للجنب.', en: 'Keep your back close to the bench, shoulders down and back, and elbows bending straight back, not out.' },
    { ar: 'انزل لين الذراع العلوي يقارب الأرضية بس؛ إذا عندك مشكلة بالكتف اختر تمرين ثاني.', en: 'Lower only until the upper arms are about level; if you have shoulder problems, pick another exercise.' },
  ],
  'hip-thrust': [
    { ar: 'أعلى الظهر على حافة البنش والقدمين ثابتة، والبار على مفصل الورك مع وسادة.', en: 'Rest the upper back on the bench edge with feet planted, and the bar on the hip crease with a pad.' },
    { ar: 'ارفع لين يصير الجذع موازي للأرض واعصر المؤخرة؛ لا تكمل بتقويس أسفل الظهر.', en: 'Rise until the torso is level and squeeze the glutes; don’t keep going by arching the lower back.' },
  ],
  // Batch four (home).
  'plank-hold': [
    { ar: 'المرفقين تحت الكتفين، والجسم خط واحد من الكعب للرأس؛ لا تخلي الورك ينزل أو يرتفع.', en: 'Elbows under the shoulders and one straight line from heels to head; don’t let the hips sag or pike.' },
    { ar: 'تنفّس بانتظام. ابدأ بثواني قليلة وزوّدها تدريجيًا، ووقف إذا حسيت بألم في أسفل الظهر.', en: 'Breathe steadily. Start with a few seconds and build up, and stop if your lower back hurts.' },
  ],
  TFqbd8t: [
    { ar: 'ارفع الكتفين بس بحركة بطيئة، والذقن مائل شوي للصدر؛ لا تسحب رقبتك بيدينك.', en: 'Curl only the shoulders up slowly with the chin slightly tucked; don’t pull your neck with your hands.' },
    { ar: 'لا تستعجل: السرعة تخلي عضلات الورك تساعد وتضغط على أسفل الظهر.', en: 'Don’t rush: going fast brings in the hip flexors and stresses the lower back.' },
  ],
  'bird-dog': [
    { ar: 'اليدين تحت الكتفين والركبتين تحت الوركين، والظهر محايد طول الحركة.', en: 'Hands under shoulders and knees under hips, with a neutral back throughout.' },
    { ar: 'لا ترفع الذراع والرجل أعلى من اللي يقدر ظهرك يثبت عليه.', en: 'Don’t lift the arm and leg higher than your lower back can stay steady.' },
  ],
  'dead-bug': [
    { ar: 'شد البطن وخل أسفل الظهر قريب من الأرض؛ إذا بدأ يتقوّس قلّل المدى.', en: 'Brace your abs and keep the lower back close to the floor; shorten the range if it starts to arch.' },
    { ar: 'تحرّك ببطء وتنفّس بشكل طبيعي، بدون حبس النفس.', en: 'Move slowly and breathe normally, without holding your breath.' },
  ],
  yn8yg1r: [
    { ar: 'الدمبل قريب من الصدر والمرفقين لتحت، والظهر مستقيم.', en: 'Hold the dumbbell close to the chest, elbows tucked, back straight.' },
    { ar: 'انزل للعمق اللي تتحكم فيه والركبتين باتجاه أصابع القدم، وادفع من القدمين للوقوف.', en: 'Squat as deep as you control with knees tracking the toes, then push through the feet to stand.' },
  ],
  BJ0Hz5L: [
    { ar: 'انحنِ من الوركين وظهرك مستقيم وثني خفيف في الركبتين، وثبّت هذي الوضعية.', en: 'Hinge at the hips with a straight back and slightly bent knees, and hold that position.' },
    { ar: 'اسحب الدمبل باتجاه البطن بدون هز الجسم، ونزّله بتحكم.', en: 'Pull the dumbbells toward your abdomen without jerking, and lower with control.' },
  ],
  // Batch three.
  EIeI8Vf: [
    { ar: 'ثبّت الرأس والكتفين والمؤخرة على البنش والقدمين على الأرض. استخدم مساند الأمان أو شخص يساعدك.', en: 'Keep head, shoulders and hips on the bench and feet on the floor. Use safety arms or a spotter.' },
    { ar: 'انزل البار بتحكم لأسفل الصدر بدون ارتداد عليه، والرسغين فوق المرفقين.', en: 'Lower the bar with control to the lower chest without bouncing it, wrists stacked over elbows.' },
  ],
  eZyBC3j: [
    { ar: 'انحنِ من الوركين وظهرك مستقيم وثني خفيف في الركبتين، وثبّت هذي الوضعية طول المجموعة.', en: 'Hinge at the hips with a straight back and slightly bent knees, and hold that position for the whole set.' },
    { ar: 'اسحب البار لأسفل الجذع بدون هز الجسم؛ خفف الوزن إذا بدأ ظهرك يتقوّس.', en: 'Pull the bar toward the lower torso without jerking the body; reduce the load if your back starts to round.' },
  ],
  Kyd9Rz5: [
    { ar: 'ابدأ من البار على أعلى الكتفين، وشد البطن والمؤخرة عشان ما يتقوّس أسفل ظهرك.', en: 'Start with the bar on the upper shoulders and brace your abs and glutes so the lower back doesn’t arch.' },
    { ar: 'ادفع البار فوق الرأس وارجعه للكتفين بتحكم. إذا تحس بضغط في الكتف، جرّب الدمبل أو وزن أخف.', en: 'Press overhead and return to the shoulders with control. If your shoulder feels pinched, try dumbbells or a lighter load.' },
  ],
  '25GPyDY': [
    { ar: 'المرفقين جنب الجسم والصدر ثابت؛ الذراعين بس اللي تتحرك.', en: 'Keep the elbows by your sides and the chest still; only the arms move.' },
    { ar: 'ارفع ونزّل بتحكم بدون تأرجح الجذع أو دفع الوركين.', en: 'Curl and lower with control, without swinging the torso or driving with the hips.' },
  ],
  C5jncD2: [
    { ar: 'خل الركبة على خط محور الجهاز، واضبط المسند فوق الكعب مباشرة.', en: 'Line your knee up with the machine’s pivot and set the pad just above the heels.' },
    { ar: 'شد البطن عشان ما يرتفع أسفل الظهر، واثنِ الركبة وارجعها بتحكم.', en: 'Brace your core so the lower back stays still, and curl and return under control.' },
  ],
}

const GENERAL: Record<Exercise['kind'], L10n[]> = {
  strength: [
    { ar: 'ابدأ بحمل تقدر تتحكم فيه. خفف الوزن أو العدات إذا فقدت جودة الحركة.', en: 'Start with a manageable load. Reduce weight or reps if technique breaks down.' },
    { ar: 'تحرك بدون اندفاع وتنفس بانتظام؛ تجنب حبس النفس.', en: 'Move without jerking and breathe steadily; avoid holding your breath.' },
  ],
  calisthenics: [
    { ar: 'اختر نسخة تقدر تؤديها بتحكم، وقلل العدات إذا فقدت ثبات الحركة.', en: 'Choose a version you can control and reduce reps if movement becomes unstable.' },
    { ar: 'تحرك بهدوء وتنفس بانتظام بدل حبس النفس.', en: 'Move smoothly and breathe steadily instead of holding your breath.' },
  ],
  cardio: [
    { ar: 'ابدأ بجهد خفيف وارفعه تدريجيًا حسب قدرتك.', en: 'Start at an easy effort and build gradually within your ability.' },
    { ar: 'جهز مساحة ومعدات مناسبة للنشاط، وانتبه للسوائل والحرارة.', en: 'Use space and equipment suited to the activity; account for hydration and heat.' },
  ],
  stretch: [
    { ar: 'ابدأ بلطف؛ لا تجبر المفصل على مدى مؤلم.', en: 'Start gently; do not force a joint into a painful range.' },
    { ar: 'حافظ على حركة هادئة وتنفس منتظم.', en: 'Keep movement gentle and breathing steady.' },
  ],
  sport: [
    { ar: 'تعلم تقنية النشاط واستخدم معدات الحماية المناسبة له.', en: 'Learn the activity’s technique and use appropriate protective equipment.' },
    { ar: 'ابدأ بالتدرج حسب قدرتك. الرمز المعروض ليس شرحًا كاملًا لتقنية الرياضة.', en: 'Build gradually within your ability. The symbol shown is not a complete technique guide for the sport.' },
  ],
}

export function safetyFor(exercise: Exercise): { specific: boolean; cues: L10n[] } {
  const exact = exercise.custom ? undefined : EXERCISE_SAFETY[exercise.id]
  return { specific: !!exact, cues: exact ? [...exact, GENERAL[exercise.kind][0]!] : GENERAL[exercise.kind] }
}

// Narrow corrections to the bundled how-to copy. Keep generated catalogue files intact.
const STEP_CORRECTIONS: Record<string, Record<number, L10n>> = {
  NbVPDMW: {
    2: { ar: 'اثنِ المرفقين لمدى مريح مع ثبات الذراعين العلويين والرسغين؛ لا ترفع المرفق للوصول بالدمبل إلى الكتف.', en: 'Curl within a comfortable range with upper arms and wrists steady; do not lift the elbows to force the dumbbells to shoulder height.' },
  },
  '3d7wHyd': {
    2: { ar: 'ادفع الدمبل للأعلى بتحكم مع ثبات الجذع؛ تجنب قفل المرفقين بقوة.', en: 'Press the dumbbells upward with a steady trunk; avoid forcefully locking the elbows.' },
  },
  '6YUfHPL': {
    3: { ar: 'انزل لمدى تقدر تتحكم فيه مع ثبات الكعبين والظهر؛ لا تجبر نفسك على عمق الرسم.', en: 'Lower only as far as you can control with heels grounded and back stable; do not force the illustrated depth.' },
  },
  '9E25EOx': {
    1: { ar: 'خذ وقفة متوازنة بقدم أمامك والثانية خلفك، وثبت مكان القدمين خلال الحركة.', en: 'Take a balanced split stance with one foot forward and the other behind; keep both feet in place during the movement.' },
    3: { ar: 'انزل بتحكم لمدى تقدر تثبت فيه الجذع والتوازن، بدون إجبار الفخذ على وضع أفقي.', en: 'Lower within a range that preserves trunk control and balance, without forcing the front thigh to horizontal.' },
  },
  'glute-bridge': {
    4: { ar: 'انزل الحوض بهدوء مع ثبات الجذع، بدون تقويس زائد لأسفل الظهر.', en: 'Lower the hips smoothly with trunk control, avoiding excessive lower-back arching.' },
  },
  SpYC0Kp: {
    2: { ar: 'انزل الدمبل بتحكم بجانب الصدر، لمدى مريح تقدر تتحكم فيه مع ثبات الرسغين والكتفين.', en: 'Lower the dumbbells beside the chest within a comfortable, controlled range, keeping wrists and shoulders stable.' },
  },
}

const ADDITIONAL_STEPS: Record<string, L10n[]> = {
  RVwzP10: [{ ar: 'ارجع البار للأعلى بهدوء مع فرد الذراعين بتحكم وثبات الجذع؛ لا تترك الوزن يسحبك فجأة.', en: 'Return the bar upward slowly, extending the arms with control and keeping the trunk steady; do not let the load pull you abruptly.' }],
}

export function exerciseStepsFor(exercise: Exercise, lang: Lang): string[] {
  const translated = exercise.steps[lang].length > 0
  const steps = translated ? exercise.steps[lang] : exercise.steps.en
  const corrections = exercise.custom ? undefined : STEP_CORRECTIONS[exercise.id]
  const copyLang = translated ? lang : 'en'
  const additions = exercise.custom || !steps.length ? [] : ADDITIONAL_STEPS[exercise.id] ?? []
  return [...steps.map((step, i) => corrections?.[i]?.[copyLang] ?? step), ...additions.map(step => step[copyLang])]
}

export const SAFETY_SOURCES = {
  technique: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/weight-training/art-20045842',
  symptoms: 'https://www.nhs.uk/symptoms/chest-pain/',
  activity: 'https://www.niddk.nih.gov/health-information/weight-management/tips-get-active/tips-keep-moving',
  stretch: 'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/flexibility-exercise-stretching',
}
