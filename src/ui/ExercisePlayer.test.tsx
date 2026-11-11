import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useSettings } from '@/store/settings'
import { ExercisePlayer } from './ExercisePlayer'
import type { ArtFile } from '@/types'

;(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true
const data=JSON.parse(readFileSync(resolve('public/art/bench-press.json'),'utf8')) as ArtFile
let root:Root
let host:HTMLDivElement
const button=(label:string)=>host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!

beforeEach(()=>{
  vi.useFakeTimers()
  useSettings.getState().set({lang:'en'})
  host=document.createElement('div');document.body.append(host);root=createRoot(host)
  act(()=>root.render(<ExercisePlayer slug="bench-press" name="Bench press" data={data}/>))
})
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers()})

describe('technical exercise player',()=>{
  it('renders exactly one real pose, then pauses when the user chooses one',()=>{
    expect(host.querySelector('[data-visual-style]')?.getAttribute('data-visual-style')).toBe('technical')
    act(()=>button('Show pose 2').click())
    expect(host.querySelector('[data-pose]')?.getAttribute('data-pose')).toBe('1')
    act(()=>vi.advanceTimersByTime(5000))
    expect(host.querySelector('[data-pose]')?.getAttribute('data-pose')).toBe('1')
    const paths=[...host.querySelectorAll('[data-pose] svg path')]
    expect(paths.filter(path=>(path as SVGElement).style.display!=='none')).toHaveLength(1)
    act(()=>button('Reset motion').click())
    expect(host.querySelector('[data-pose]')?.getAttribute('data-pose')).toBe('0')
  })
  it('plays at a slower speed after a deliberate source pose selection',()=>{
    act(()=>button('Show pose 1').click())
    const slow=[...host.querySelectorAll('button')].find(button=>button.textContent==='0.5×')!
    act(()=>slow.click())
    act(()=>button('Play motion').click())
    act(()=>vi.advanceTimersByTime(1100))
    expect(host.querySelector('[data-pose]')?.getAttribute('data-pose')).toBe('0')
    act(()=>vi.advanceTimersByTime(1100))
    expect(host.querySelector('[data-pose]')?.getAttribute('data-pose')).toBe('1')
  })
})
