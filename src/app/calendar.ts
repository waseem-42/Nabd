/*
 * A weekly reminder as an iCalendar file. A PWA can't schedule notifications without a server,
 * but every phone calendar can import a repeating event with an alarm, and it works offline.
 */

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

/** Escapes text for an iCalendar value. */
const text = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')

/**
 * The first moment on one of `days` (0 = Sunday … 6 = Saturday) at `time` ('HH:MM') that is
 * still ahead of `now`. Local, floating time: the reminder follows the phone's time zone.
 */
export function firstOccurrence(days: number[], time: string, now: Date): Date {
  const [h, m] = time.split(':').map(Number)
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h ?? 18, m ?? 0)
    if (days.includes(d.getDay()) && d > now) return d
  }
  throw new Error('No training day selected')
}

export function reminderCalendar(days: number[], time: string, title: string, now = new Date()): string {
  if (!days.length) throw new Error('No training day selected')
  const start = firstOccurrence(days, time, now)
  const utc = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nabd//Training reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:nabd-training-reminder-${utc}`,
    `DTSTAMP:${utc}`,
    `DTSTART:${stamp(start)}`,
    'DURATION:PT45M',
    `RRULE:FREQ=WEEKLY;BYDAY=${[...days].sort((a, b) => a - b).map((d) => BYDAY[d]).join(',')}`,
    `SUMMARY:${text(title)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${text(title)}`,
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadReminder(ics: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'nabd-reminder.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
