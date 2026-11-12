import { describe, expect, it } from 'vitest'
import { firstOccurrence, reminderCalendar } from './calendar'

// 2026-11-12 is a Thursday.
const now = new Date(2026, 10, 12, 19, 0)

describe('training reminder calendar', () => {
  it('starts on the next selected day still ahead', () => {
    expect(firstOccurrence([4], '20:00', now)).toEqual(new Date(2026, 10, 12, 20, 0)) // later today
    expect(firstOccurrence([4], '18:00', now)).toEqual(new Date(2026, 10, 19, 18, 0)) // today already passed
    expect(firstOccurrence([6, 1], '18:00', now)).toEqual(new Date(2026, 10, 14, 18, 0)) // Saturday
  })

  it('repeats weekly on the chosen days with an alarm', () => {
    const ics = reminderCalendar([1, 6, 3], '07:30', 'تمرين نبض', now)
    expect(ics).toContain('DTSTART:20261114T073000')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,SA')
    expect(ics).toContain('SUMMARY:تمرين نبض')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })

  it('refuses an empty schedule', () => {
    expect(() => reminderCalendar([], '18:00', 'x', now)).toThrow()
  })
})
