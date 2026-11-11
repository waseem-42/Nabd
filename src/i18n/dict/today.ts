import type { Dict } from '../index'

/** Strings for the today area. Keys are prefixed 'today.'. */
export default {
  'today.inProgress': { ar: 'تمرين شغّال', en: 'Workout in progress' },
  'today.resume': { ar: 'كمّل التمرين', en: 'Resume workout' },
  'today.next': { ar: 'تمرينك الجاي', en: 'Up next' },
  'today.nextBadge': { ar: 'الجاي', en: 'Next' },
  'today.start': { ar: 'ابدأ التمرين', en: 'Start workout' },
  'today.exerciseCount': { ar: '{n} تمارين', en: '{n} exercises' },
  'today.notFit': {
    ar: '{n} تمارين ما تناسب {place} — بنقترح لك بدائل أثناء التمرين.',
    en: "{n} exercises don't fit {place} — you'll get swaps during the workout.",
  },
  'today.programEmpty': { ar: 'برنامجك ما فيه أيام للحين.', en: 'Your program has no days yet.' },
  'today.addDay': { ar: 'أضف يوم تمرين', en: 'Add a training day' },
  'today.noProgram': { ar: 'ما اخترت برنامج', en: 'No program yet' },
  'today.noProgramBody': {
    ar: 'اختر برنامج جاهز للبيت أو النادي، أو سوّ برنامجك بنفسك.',
    en: 'Pick a ready-made home or gym program, or build your own.',
  },
  'today.choose': { ar: 'اختر برنامج', en: 'Choose a program' },
  'today.quick': { ar: 'تمرين حر', en: 'Quick workout' },
  'today.week': { ar: 'هذا الأسبوع', en: 'This week' },
  'today.streak': { ar: '{n} أسابيع متتالية', en: '{n}-week streak' },
  'today.weekCount': { ar: 'تمرّنت {n} مرات هذا الأسبوع', en: '{n} workouts this week' },
  'today.weekNone': { ar: 'ما تمرّنت هذا الأسبوع للحين', en: 'No workouts this week yet' },
  'today.days': { ar: 'أيام البرنامج', en: 'Program days' },
  'today.last': { ar: 'آخر تمرين', en: 'Last workout' },
  'today.aboutMinutes': { ar: 'حوالي {n} دقيقة', en: 'About {n} min' },
  'today.andMore': { ar: '+{n} غيرها', en: '+{n} more' },
  'today.goalLabel': { ar: '{done} من {goal} تمارين هذا الأسبوع', en: '{done} of {goal} workouts this week' },
  'today.goalLeft': { ar: 'باقي لك {n} هذا الأسبوع', en: '{n} to go this week' },
  'today.goalDone': { ar: 'كمّلت هدف الأسبوع', en: 'Weekly goal done' },
  'today.goalOf': { ar: 'الهدف {goal} بالأسبوع، حسب برنامجك', en: 'Goal: {goal} workouts — from your program days' },
  'today.goalDefault': { ar: 'الهدف {goal} تمارين بالأسبوع', en: 'Goal: {goal} workouts a week' },
} satisfies Dict
