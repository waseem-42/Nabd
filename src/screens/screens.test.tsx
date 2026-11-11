import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '@/app/App'
import { routes } from '@/app/routes'
import { PROGRAM_TEMPLATES } from '@/data/catalog'
import { ALL_TABLES } from '@/db/db'
import { getActiveSession, listDoneSessions, startProgramFromTemplate } from '@/db'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import { useMotionReview } from '@/store/motionReview'
import { DEFAULT_SETTINGS } from '@/types'

/*
 * Smoke tests: every route renders real content against a real (fake) IndexedDB, and the core
 * loop — start the next workout, tick a set, finish — ends on the summary with a saved session.
 */

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLElement

async function settle(times = 6) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 15))
    })
  }
}

async function render(path: string) {
  window.history.pushState({}, '', path)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () => root!.render(<App />))
  await settle()
}

/** Lets lazy screens and live queries resolve until `text` shows up (or gives up after ~3 s). */
async function waitForText(text: string) {
  for (let i = 0; i < 200 && !document.body.textContent?.includes(text); i++) await settle(1)
  expect(document.body.textContent).toContain(text)
}

function click(el: Element | null | undefined) {
  expect(el).toBeTruthy()
  act(() => (el as HTMLElement).click())
}

const byText = (text: string) =>
  [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(text))

beforeEach(async () => {
  await Promise.all(ALL_TABLES.map((t) => t.clear()))
  useSettings.getState().replace({ ...DEFAULT_SETTINGS, lang: 'en', onboarded: true, place: 'gym' })
  useWorkout.setState({ session: null, rest: null, hydrated: true })
  useMotionReview.getState().clear()
})

afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

describe('screens', () => {
  it('sends a first-time user to onboarding', async () => {
    useSettings.getState().set({ onboarded: false })
    await render(routes.today)
    expect(window.location.pathname).toBe(routes.onboarding)
    await waitForText('Nabd')
  })

  it.each([
    ['today', routes.today, 'No program yet'],
    ['library', routes.library, 'Barbell Bench Press'],
    ['exercise', routes.exercise('EIeI8Vf'), 'Barbell Bench Press'],
    ['progress', routes.progress, 'No workouts yet'],
    ['settings', routes.settings, 'Based on GymMane by InlitX'],
    ['programs', routes.programs, 'Ready-made programs'],
    ['template', routes.program(PROGRAM_TEMPLATES[0]!.id), 'Start this program'],
    ['new routine', routes.routine('new'), 'New day'],
    ['motion studio', routes.motionLab, 'Motion studio'],
    ['continuous motion batch', routes.motionBatch, 'Technical motion'],
  ])('renders %s', async (_name, path, text) => {
    await render(path)
    await waitForText(text)
  })

  it('saves a sample approval without changing workout settings', async () => {
    const settings = useSettings.getState()
    await render(routes.motionLab)
    await waitForText('Approve this sample style')
    click(byText('Previous styles'))
    click(byText('Technical'))
    click(byText('Approve this sample style'))
    expect(useMotionReview.getState().approved).toBe('technical')
    expect(useSettings.getState()).toBe(settings)
    await waitForText('Sample style approved')
  })

  it('offers the four new styles while preserving an earlier sample approval', async () => {
    useMotionReview.getState().approve('technical')
    await render(routes.motionLab)
    await waitForText('Athlete illustration')
    expect(document.body.textContent).toContain('Before and during')
    expect(document.querySelector('button[aria-pressed="true"]')?.textContent).toContain('Technical')
    click(byText('Color segments'))
    click(byText('Approve this sample style'))
    expect(useMotionReview.getState().approved).toBe('segments')
  })

  it('runs a workout from the active program to the summary', async () => {
    await startProgramFromTemplate('fullbody', 'en')
    await render(routes.today)
    await waitForText('Up next')

    click(byText('Start workout'))
    await settle()
    await waitForText('Before you start')
    expect(useWorkout.getState().session).toBeNull()
    expect(byText('Begin session')?.disabled).toBe(true)
    for (const check of document.querySelectorAll('input[type="checkbox"]')) click(check)
    click(byText('Begin session'))
    await settle()
    expect(window.location.pathname).toBe(routes.workout)
    expect(useWorkout.getState().session?.entries.length).toBeGreaterThan(0)

    click(document.querySelector('button[aria-pressed="false"][aria-label^="Set 1"]'))
    await settle(2)
    expect(useWorkout.getState().session?.entries[0]?.sets[0]?.done).toBe(true)
    expect(useWorkout.getState().rest).not.toBeNull()

    click(byText('Finish'))
    await settle(2)
    // Unticked sets remain, so a confirmation comes first.
    click([...document.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === 'Finish'))
    await settle()

    expect(window.location.pathname).toMatch(/^\/summary\//)
    await waitForText('Workout complete!')
    const done = await listDoneSessions()
    expect(done).toHaveLength(1)
    expect(done[0]!.entries).toHaveLength(1)
  })

  it('cancels preparation without creating a session and resets checks when reopened', async () => {
    await render(routes.today)
    click(byText('Quick workout'))
    await settle()
    click(document.querySelector('input[type="checkbox"]'))
    click(byText('Not ready now'))
    await settle()
    expect(useWorkout.getState().session).toBeNull()
    expect(await getActiveSession()).toBeUndefined()
    expect(window.location.pathname).toBe(routes.today)
    click(byText('Quick workout'))
    await settle()
    expect([...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].every(input => !input.checked)).toBe(true)
    expect(byText('Begin session')?.disabled).toBe(true)
  })

  it('resumes without a new preparation check; symptom help stops rest and preserves completed work', async () => {
    await useWorkout.getState().start({ routine: {
      id: 'safety-test', name: 'Safety test', place: 'gym',
      items: [{ exerciseId: '6YUfHPL', sets: 3, reps: 8, restSec: 90 }], createdAt: 0, updatedAt: 0,
    } })
    useWorkout.getState().toggleSet(0, 0)
    const session = useWorkout.getState().session!
    await render(routes.today)
    click(byText('Resume'))
    await settle()
    expect(document.body.textContent).not.toContain('Before you start')
    expect(useWorkout.getState().rest).not.toBeNull()
    click(byText('Pain or dizziness?'))
    await waitForText('Stop moving first')
    expect(useWorkout.getState().rest).toBeNull()
    expect(useWorkout.getState().session).toEqual(session)
    click(byText('Close guidance'))
    await settle()
    expect(useWorkout.getState().rest).toBeNull()
    expect((await getActiveSession())?.entries[0]?.sets[0]?.done).toBe(true)
    click(byText('Pain or dizziness?'))
    await settle()
    click(byText('End and save completed sets'))
    await settle()
    const saved = (await listDoneSessions())[0]!
    expect(saved.id).toBe(session.id)
    expect(saved.entries[0]?.sets).toHaveLength(1)
    expect(saved.entries[0]?.sets[0]).toEqual(session.entries[0]?.sets[0])
    expect(useWorkout.getState().session).toBeNull()
  })
})
