import type { Dict } from '../index'

/** Strings for the settings area. Keys are prefixed 'settings.'. */
export default {
  'settings.general': { ar: 'عام', en: 'General' },
  'settings.workout': { ar: 'التمرين', en: 'Workout' },
  'settings.rest': { ar: 'الراحة الافتراضية بين المجموعات', en: 'Default rest between sets' },
  'settings.restHint': {
    ar: 'تقدر تغيّرها لكل تمرين أثناء الجلسة. صفر يعني بدون مؤقت.',
    en: 'You can change it per exercise during a workout. Zero turns the timer off.',
  },
  'settings.sound': { ar: 'صوت نهاية الراحة', en: 'Sound when rest ends' },
  'settings.homeGear': { ar: 'معدات البيت', en: 'Home equipment' },
  'settings.data': { ar: 'بياناتك', en: 'Your data' },
  'settings.export': { ar: 'نسخة احتياطية', en: 'Back up' },
  'settings.exportHint': { ar: 'نزّل ملف فيه كل تمارينك وإعداداتك', en: 'Download a file with all your workouts and settings' },
  'settings.exported': { ar: 'نزل الملف', en: 'Backup downloaded' },
  'settings.import': { ar: 'استرجاع', en: 'Restore' },
  'settings.importHint': { ar: 'من ملف نسخة احتياطية', en: 'From a backup file' },
  'settings.importTitle': { ar: 'تسترجع النسخة الاحتياطية؟', en: 'Restore this backup?' },
  'settings.importBody': {
    ar: 'كل البيانات اللي على هذا الجهاز بتنستبدل بمحتوى الملف.',
    en: 'Everything on this device will be replaced with the contents of the file.',
  },
  'settings.imported': { ar: 'تم الاسترجاع', en: 'Backup restored' },
  'settings.badFile': { ar: 'هذا مو ملف نسخة احتياطية من نبض', en: 'This is not a Nabd backup file' },
  'settings.badVersion': { ar: 'الملف من نسخة أحدث من التطبيق', en: 'The file is from a newer version of the app' },
  'settings.importFailed': { ar: 'ما قدرنا نسترجع الملف', en: 'Could not restore the file' },
  'settings.privacy': {
    ar: 'كل بياناتك محفوظة على جهازك بس — ما فيه حساب ولا سيرفر.',
    en: 'All your data stays on this device — no account, no server.',
  },
  'settings.about': { ar: 'عن التطبيق', en: 'About' },
  'settings.basedOn': { ar: 'مبني على GymMane من InlitX.', en: 'Based on GymMane by InlitX.' },
  'settings.credits': {
    ar: 'الأسماء العربية من openGym، والرسوم التوضيحية من Workout Guide و Everkinetic (CC BY-SA 4.0).',
    en: 'Arabic names from openGym; illustrations from Workout Guide and Everkinetic (CC BY-SA 4.0).',
  },
  'settings.license': { ar: 'برنامج حر برخصة AGPL-3.0.', en: 'Free software under the AGPL-3.0.' },
  'settings.haptics': { ar: 'اهتزاز عند إنهاء المجموعة والراحة', en: 'Vibrate on set done and rest end' },
  'settings.keepAwake': { ar: 'الشاشة تبقى شغّالة أثناء التمرين', en: 'Keep the screen on during workouts' },
  'settings.keepAwakeHint': { ar: 'تشتغل في المتصفحات اللي تدعمها، وتتوقف إذا البطارية ضعيفة.', en: 'Works where the browser supports it, and pauses on low battery.' },
  'settings.stored': { ar: 'عندك {n} تمرين محفوظ على هذا الجهاز.', en: '{n} workouts are stored on this device.' },
  'settings.neverBackedUp': { ar: 'ما سويت نسخة احتياطية للحين.', en: 'You have not backed up yet.' },
  'settings.lastBackup': { ar: 'آخر نسخة احتياطية: {date}.', en: 'Last backup: {date}.' },
  'settings.backupNudge': { ar: 'بياناتك على جهازك بس — نزّل نسخة عشان ما تضيع.', en: 'Your data lives only here — download a copy so it can’t be lost.' },
} satisfies Dict
