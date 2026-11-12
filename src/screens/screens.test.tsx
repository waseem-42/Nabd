import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '@/app/App'
import { routes } from '@/app/routes'
import { ALL_TABLES } from '@/db/db'
import { getProgram, listDoneSessions, startProgramFromTemplate } from '@/db'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import { DEFAULT_SETTINGS } from '@/types'

/*
 * Smoke tests for the place-first app: setup, each screen, the place switch, and the core
 * loop — start today's workout, tick a set, finish — ending on the summary with a saved session.
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

const byText = (text: string, selector = 'button') =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((b) => b.textContent?.includes(text))

async function skipWarmup() {
  await waitForText('Skip warm-up')
  click(byText('Skip warm-up'))
  await settle()
}

beforeEach(async () => {
  await Promise.all(ALL_TABLES.map((t) => t.clear()))
  useSettings.getState().replace({ ...DEFAULT_SETTINGS, lang: 'en', onboarded: true, place: 'gym' })
  useWorkout.setState({ session: null, rest: null, hydrated: true })
})

afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

describe('setup', () => {
  it('asks where, what gear, which level and what goal, then follows a matching plan', async () => {
    useSettings.getState().set({ onboarded: false })
    await render(routes.today)
    expect(window.location.pathname).toBe(routes.onboarding)
    await waitForText('Where do you train?')
    click(byText('Home'))
    click(byText('Next'))
    await waitForText('What do you have at home?')
    click(byText('Dumbbells'))
    click(byText('Next'))
    await waitForText('Your level?')
    click(byText('Next'))
    await waitForText('What’s your goal?')
    click(byText('Strength'))
    click(byText('Let’s go'))
    await settle(10)

    const settings = useSettings.getState()
    expect(settings.onboarded).toBe(true)
    expect(settings.place).toBe('home')
    expect(settings.homeEquipment).toEqual(expect.arrayContaining(['bodyweight', 'dumbbell']))
    expect(settings.goal).toBe('strength')
    expect(settings.restSec).toBe(120)
    const program = await getProgram(settings.homeProgramId!)
    expect(program?.templateId).toBe('home-dumbbell')
    expect(program?.weeks).toBe(8)
    expect(window.location.pathname).toBe(routes.today)
  })
})

describe('screens', () => {
  it.each([
    ['train without a plan', routes.today, 'Pick your plan'],
    ['exercise', routes.exercise('EIeI8Vf'), 'How to'],
    ['log', routes.progress, 'Your first finished workout'],
    ['settings', routes.settings, 'Settings'],
    ['plans', routes.programs, 'Ready plans'],
  ])('renders %s', async (_name, path, text) => {
    await render(path)
    await waitForText(text)
  })

  it('lists only animated exercises that fit the place', async () => {
    await render(routes.library)
    await waitForText('Barbell Bench Press')
    expect(document.body.textContent).not.toContain('Leg Press') // no animation yet
    act(() => useSettings.getState().set({ place: 'home' }))
    await waitForText('Plank')
    expect(document.body.textContent).not.toContain('Barbell Bench Press')
    expect(document.querySelectorAll('[data-motion-thumb]').length).toBeGreaterThan(5)
  })

  it('keeps a separate plan for each place', async () => {
    await startProgramFromTemplate('fullbody', 'en')
    await render(routes.today)
    await waitForText('Gym full body')
    click(byText('Home'))
    await waitForText('Pick your plan')
    click(byText('Follow'))
    await waitForText('Home start')
    click(byText('Gym'))
    await waitForText('Gym full body')
    expect(useSettings.getState().homeProgramId).not.toBe(useSettings.getState().gymProgramId)
  })
})

describe('workout', () => {
  it('runs today’s workout from the plan to the summary', async () => {
    await startProgramFromTemplate('fullbody', 'en')
    await render(routes.today)
    await waitForText('Today’s workout')
    click(byText('Start'))
    await settle()
    // No checklist: the workout opens straight on its warm-up step.
    expect(window.location.pathname).toBe(routes.workout)
    expect(useWorkout.getState().session?.entries.length).toBeGreaterThan(0)
    await waitForText('How to do it')
    await skipWarmup()

    // The open set's big button ticks it and starts the rest timer.
    const firstUndone = useWorkout.getState().session!.entries[0]!.sets.findIndex((s) => !s.done)
    click(byText('Set done'))
    await settle(2)
    expect(useWorkout.getState().session?.entries[0]?.sets[firstUndone]?.done).toBe(true)
    expect(useWorkout.getState().rest).not.toBeNull()

    click(byText('Finish'))
    await settle(2)
    // Unticked sets remain, so a confirmation comes first.
    click([...document.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === 'Finish'))
    await settle()
    expect(window.location.pathname).toMatch(/^\/summary\//)
    await waitForText('Workout complete!')
    expect(await listDoneSessions()).toHaveLength(1)
  })

  it('resumes without the warm-up once a set is done; symptom help stops rest and preserves completed work', async () => {
    await useWorkout.getState().start({ routine: {
      id: 'safety-test', name: 'Safety test', place: 'gym',
      items: [{ exerciseId: '6YUfHPL', sets: 3, reps: 8, restSec: 90 }], createdAt: 0, updatedAt: 0,
    } })
    useWorkout.getState().toggleSet(0, 0)
    const session = useWorkout.getState().session!
    await render(routes.today)
    await waitForText('Resume workout')
    click(byText('Resume workout', 'a'))
    await settle()
    expect(document.body.textContent).not.toContain('Before you start')
    expect(useWorkout.getState().rest).not.toBeNull()
    click(byText('Pain or dizziness?'))
    await waitForText('Stop moving first')
    expect(useWorkout.getState().rest).toBeNull()
    expect(useWorkout.getState().session).toEqual(session)
    click(byText('Close guidance'))
    await settle()
    click(byText('Pain or dizziness?'))
    await settle()
    click(byText('End and save completed sets'))
    await settle()
    const saved = (await listDoneSessions())[0]!
    expect(saved.id).toBe(session.id)
    expect(saved.entries[0]?.sets).toHaveLength(1)
    expect(useWorkout.getState().session).toBeNull()
  })
})
