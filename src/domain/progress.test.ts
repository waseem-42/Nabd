import { describe, expect, it } from 'vitest'
import {
  bestSet,
  detectPRs,
  estimate1RM,
  exerciseHistory,
  lastPerformance,
  metricOf,
  personalRecords,
  sessionDurationSec,
  sessionVolume,
  startOfWeek,
  totals,
  weekStreak,
  weekSummary,
  muscleSplit,
  recentRecords,
  routineMinutes,
  weeklyHistory,
} from './progress'
import { BENCH, PLANK, PUSH_UP, done, lookup, set } from './testFixtures'

const at = (day: string, time = '12:00:00') => new Date(`${day}T${time}`).getTime()

describe('estimate1RM', () => {
  it('uses Epley and rounds to 0.1', () => {
    expect(estimate1RM(100, 5)).toBe(116.7)
    expect(estimate1RM(60, 10)).toBe(80)
  })
  it('returns the weight itself for a single rep', () => {
    expect(estimate1RM(140, 1)).toBe(140)
  })
  it('refuses to guess without load, without reps or above the rep cap', () => {
    expect(estimate1RM(0, 5)).toBeNull()
    expect(estimate1RM(100, 0)).toBeNull()
    expect(estimate1RM(100, 13)).toBeNull()
  })
})

describe('metricOf', () => {
  it('picks weight, reps or seconds', () => {
    expect(metricOf(BENCH)).toBe('weight')
    expect(metricOf(PUSH_UP)).toBe('reps')
    expect(metricOf(PLANK)).toBe('sec')
  })
})

describe('bestSet', () => {
  const entry = {
    exerciseId: 'bench',
    restSec: 90,
    sets: [set(100, 5), set(110, 2), set(120, 1, { kind: 'warmup' as const }), set(130, 1, { done: false })],
  }
  it('ignores warm-ups and sets not done, ranking by e1RM for weighted work', () => {
    // e1RM: 100×5 → 116.7, 110×2 → 117.3.
    expect(bestSet(entry, 'weight')).toMatchObject({ weight: 110, reps: 2 })
  })
  it('ranks by reps or seconds for those metrics', () => {
    expect(bestSet(entry, 'reps')).toMatchObject({ weight: 100, reps: 5 })
    const holds = { exerciseId: 'plank', restSec: 60, sets: [set(0, 0, { sec: 40 }), set(0, 0, { sec: 55 })] }
    expect(bestSet(holds, 'sec')).toMatchObject({ sec: 55 })
  })
  it('is null without work sets', () => {
    expect(bestSet({ exerciseId: 'x', restSec: 0, sets: [set(50, 5, { done: false })] }, 'weight')).toBeNull()
  })
})

describe('session volume and duration', () => {
  const s = done('2026-11-02', [
    ['bench', [set(100, 5), set(100, 5), set(40, 10, { kind: 'warmup' })]],
    ['push-up', [set(0, 20)]],
  ])
  it('sums weight × reps over work sets', () => {
    expect(sessionVolume(s)).toBe(1000)
  })
  it('measures whole seconds, up to now while active', () => {
    expect(sessionDurationSec(s)).toBe(3600)
    expect(sessionDurationSec({ ...s, status: 'active', endedAt: undefined }, s.startedAt + 90_500)).toBe(91)
  })
})

describe('history, records and PRs', () => {
  const s1 = done('2026-10-01', [['bench', [set(80, 8), set(80, 8)]]])
  const s2 = done('2026-10-08', [['bench', [set(85, 6)]], ['push-up', [set(0, 15), set(0, 12)]]])
  const s3 = done('2026-10-15', [['bench', [set(90, 3)]], ['bench', [set(70, 12)]]])
  const active = { ...done('2026-10-20', [['bench', [set(200, 1)]]]), status: 'active' as const }
  const all = [s3, s1, active, s2]

  it('builds chronological points per finished session, merging repeated entries', () => {
    const points = exerciseHistory(all, BENCH)
    expect(points.map((p) => p.day)).toEqual(['2026-10-01', '2026-10-08', '2026-10-15'])
    expect(points[0]).toMatchObject({ topWeight: 80, e1rm: 101.3, volume: 1280, bestReps: 8, value: 101.3 })
    expect(points[2]).toMatchObject({ topWeight: 90, bestReps: 12, volume: 270 + 840 })
  })

  it('charts reps for bodyweight exercises and seconds for timed ones', () => {
    expect(exerciseHistory(all, PUSH_UP).map((p) => p.value)).toEqual([15])
    const holds = [done('2026-10-02', [['plank', [set(0, 0, { sec: 45 }), set(0, 0, { sec: 60 })]]])]
    expect(exerciseHistory(holds, PLANK)[0]).toMatchObject({ bestSec: 60, value: 60, e1rm: null })
  })

  it('keeps the best value of each kind across sessions', () => {
    expect(personalRecords(all, 'bench')).toEqual({ e1rm: 102, weight: 90, reps: 12, sec: 0, volume: 1280 })
    expect(personalRecords(all, 'squat')).toBeNull()
  })

  it('finds the last performance among finished sessions', () => {
    const last = lastPerformance(all, 'bench')
    expect(last?.session.id).toBe(s3.id)
    expect(last?.sets.map((s) => s.weight)).toEqual([90, 70])
    expect(lastPerformance(all, 'squat')).toBeNull()
  })

  describe('detectPRs', () => {
    it('flags a higher e1RM or a heavier set', () => {
      const heavier = done('2026-10-22', [['bench', [set(95, 1)]]])
      const stronger = done('2026-10-22', [['bench', [set(80, 10)]]])
      const weaker = done('2026-10-22', [['bench', [set(80, 5)]]])
      expect(detectPRs(heavier, all, lookup)).toEqual(['bench'])
      expect(detectPRs(stronger, all, lookup)).toEqual(['bench'])
      expect(detectPRs(weaker, all, lookup)).toEqual([])
    })
    it('flags more reps for bodyweight and longer holds for timed exercises', () => {
      const base = [done('2026-10-01', [['push-up', [set(0, 15)]], ['plank', [set(0, 0, { sec: 60 })]]])]
      const next = done('2026-10-08', [['push-up', [set(0, 16)]], ['plank', [set(0, 0, { sec: 50 })]]])
      expect(detectPRs(next, base, lookup)).toEqual(['push-up'])
    })
    it('does not count a first-ever attempt, and ignores the session itself in history', () => {
      const first = done('2026-10-01', [['bench', [set(100, 5)]]])
      expect(detectPRs(first, [first], lookup)).toEqual([])
    })
    it('infers the metric for exercises the lookup no longer knows', () => {
      const base = [done('2026-10-01', [['deleted', [set(20, 10)]]])]
      expect(detectPRs(done('2026-10-08', [['deleted', [set(25, 8)]]]), base, lookup)).toEqual(['deleted'])
    })
  })
})

describe('weeks', () => {
  // 2026-11-10 is a Tuesday; with Saturday as week start the week is 11-07 … 11-13.
  const now = at('2026-11-10')

  it('starts weeks on Saturday by default', () => {
    expect(startOfWeek(now).getDate()).toBe(7)
    expect(startOfWeek(now, 1).getDate()).toBe(9)
  })

  it('summarizes the current week', () => {
    const sessions = [
      done('2026-11-06', []),
      done('2026-11-07', []),
      done('2026-11-09', []),
      done('2026-11-09', []),
    ]
    const week = weekSummary(sessions, now)
    expect(week.count).toBe(3)
    expect(week.days.map((d) => d.day)).toEqual([
      '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13',
    ])
    expect(week.days.filter((d) => d.trained).map((d) => d.day)).toEqual(['2026-11-07', '2026-11-09'])
  })

  it('counts consecutive weeks, not broken by a current week without training yet', () => {
    const sessions = [done('2026-11-06', []), done('2026-10-31', []), done('2026-10-26', []), done('2026-10-10', [])]
    // weeks starting 10-31 and 10-24 are trained; 10-17 is not.
    expect(weekStreak(sessions, now)).toBe(2)
    expect(weekStreak([...sessions, done('2026-11-08', [])], now)).toBe(3)
    expect(weekStreak([done('2026-10-10', [])], now)).toBe(0)
    expect(weekStreak([], now)).toBe(0)
  })
})

describe('totals', () => {
  it('adds up finished sessions only', () => {
    const a = done('2026-11-01', [['bench', [set(100, 5), set(50, 10, { kind: 'warmup' })]]])
    const b = done('2026-11-03', [['push-up', [set(0, 20), set(0, 18)]]])
    const active = { ...done('2026-11-04', [['bench', [set(100, 5)]]]), status: 'active' as const }
    expect(totals([a, b, active])).toEqual({ sessions: 2, sets: 3, volume: 500, durationSec: 7200 })
  })
})

describe('trends', () => {
  const now = new Date('2026-11-11T12:00:00').getTime()
  const history = [
    done('2026-11-10', [['bench', [set(60, 8), set(60, 8)]], ['squat', [set(80, 5)]]], { prs: ['bench'] }),
    done('2026-11-02', [['bench', [set(50, 10)]]]),
    done('2026-08-01', [['squat', [set(70, 5)]]], { prs: ['squat'] }),
  ]

  it('counts workouts and volume per week, oldest first', () => {
    const weeks = weeklyHistory(history, 3, now)
    expect(weeks.map((w) => [w.start, w.count, w.volume])).toEqual([
      ['2026-10-24', 0, 0],
      ['2026-10-31', 1, 500],
      ['2026-11-07', 1, 1360],
    ])
  })

  it('splits recent work sets by muscle group', () => {
    const split = muscleSplit(history, lookup, new Date('2026-10-15T00:00:00').getTime())
    expect(split.slice(0, 2)).toEqual([{ group: 'chest', sets: 3 }, { group: 'legs', sets: 1 }])
    expect(split).toHaveLength(6)
  })

  it('lists records newest first and estimates routine length', () => {
    expect(recentRecords(history).map((r) => r.exerciseId)).toEqual(['bench', 'squat'])
    expect(routineMinutes([{ sets: 4 }, { sets: 3, restSec: 60 }], 90)).toBe(15)
  })
})
