import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOTION_STYLES } from '@/store/motionReview'

const html = readFileSync(resolve('public/motion/squat/index.html'), 'utf8')
const script = readFileSync(resolve('public/motion/squat/motion.js'), 'utf8')
const render = (time: number, style = 'sculpted', lang = 'ar') =>
  (window as unknown as { renderFrame: (t: number, g: object) => void }).renderFrame(time, { data: { style, lang } })

beforeEach(() => {
  document.body.innerHTML = html.match(/<body>([\s\S]*)<script src=/)?.[1] ?? ''
  new Function(script)()
})

describe('shared Qassa motion composition', () => {
  it.each(MOTION_STYLES)('seeks %s deterministically with finite geometry', (style) => {
    render(2.8,style)
    const expected = document.querySelector('#stage')!.innerHTML
    expect(document.documentElement.dataset.style).toBe(style)
    for(const time of [0,1.2,4.4,5.8]) {
      render(time,style)
      expect(document.querySelector('#stage')!.innerHTML).not.toMatch(/NaN|Infinity/)
    }
    render(2.8,style)
    expect(document.querySelector('#stage')!.innerHTML).toBe(expected)
  })
  it('can seek backwards and render the same pose without playback history', () => {
    render(2.8)
    const expected = document.querySelector('#figure')!.innerHTML
    render(0)
    expect(document.querySelector('#figure')!.innerHTML).not.toBe(expected)
    render(4.5)
    render(2.8)
    expect(document.querySelector('#figure')!.innerHTML).toBe(expected)
    render(8.8)
    expect(document.querySelector('#figure')!.innerHTML).toBe(expected)
  })

  it('keeps its loop continuous and produces finite geometry throughout a repetition', () => {
    render(0)
    const start = document.querySelector('#figure')!.innerHTML
    render(6)
    expect(document.querySelector('#figure')!.innerHTML).toBe(start)
    for (let time = 0; time <= 6; time += .1) {
      render(time)
      expect(document.querySelector('#figure')!.innerHTML).not.toMatch(/NaN|Infinity/)
    }
  })

  it('changes the presentation and language while retaining the same animation clock', () => {
    render(2.8, 'technical', 'en')
    expect(document.documentElement.dataset.style).toBe('technical')
    expect(document.querySelector('#phase')!.textContent).toBe('Brief hold')
    expect(document.querySelectorAll('#guides path')).toHaveLength(2)
    render(2.8, 'duotone')
    expect(document.querySelector('#phase')!.textContent).toBe('وقفة قصيرة')
    expect(document.querySelector('#backdrop')!.getAttribute('fill')).toBe('#eeeede')
    expect(document.querySelector('#figure')!.children.length).toBeGreaterThan(0)
  })
})
