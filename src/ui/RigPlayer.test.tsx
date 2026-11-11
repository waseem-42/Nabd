import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettings } from '@/store/settings'
import { ExercisePlayer } from './ExercisePlayer'

;(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true
let root:Root,host:HTMLDivElement
beforeEach(()=>{
  vi.useFakeTimers();useSettings.getState().set({lang:'en'})
  host=document.createElement('div');document.body.append(host);root=createRoot(host)
})
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers()})
describe('continuous exercise integration',()=>{
  it('routes the exact curl id into a continuous rig and pauses when seeking',()=>{
    act(()=>root.render(<ExercisePlayer activity="NbVPDMW" slug="bicep-curl" name="Curl"/>))
    expect(host.querySelector('[data-rig-player]')?.getAttribute('data-rig-player')).toBe('curl')
    const end=host.querySelector<HTMLButtonElement>('button[data-segment="hold"]')!
    act(()=>end.click())
    expect(host.querySelector('[data-motion]')?.getAttribute('data-time')).toBe('2.800')
    act(()=>vi.advanceTimersByTime(3000))
    expect(host.querySelector('[data-motion]')?.getAttribute('data-time')).toBe('2.800')
    expect(host.querySelector('button[aria-label="Play motion"]')).toBeTruthy()
    act(()=>(host.querySelector('button[aria-label="Reset motion"]')as HTMLButtonElement).click())
    expect(host.querySelector('[data-motion]')?.getAttribute('data-time')).toBe('0.000')
  })
  it('does not borrow the bodyweight split squat for an elevated dumbbell variant',()=>{
    act(()=>root.render(<ExercisePlayer activity="qx4fgX7" slug={null} name="Elevated dumbbell split squat"/>))
    expect(host.querySelector('[data-motion="continuous"]')).toBeNull()
    expect(host.textContent).toContain('no pose sequence')
  })
})
