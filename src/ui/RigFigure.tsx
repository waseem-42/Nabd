import { useLayoutEffect, useRef } from 'react'
import { useLang } from '@/i18n'
import type { RigDefinition } from '@/motion/engine'
import { createRigRenderer } from '@/motion/svgRenderer'
import { cx } from './cx'

/** The same SVG renderer is bundled into Qassa's time-driven composition. */
export function RigFigure({ definition, time, name, className, yaw, guides }: { definition:RigDefinition;time:number;name:string;className?:string;yaw?:number;guides?:boolean }) {
  const lang=useLang()
  const svg=useRef<SVGSVGElement>(null)
  const renderer=useRef<ReturnType<typeof createRigRenderer>|null>(null)
  useLayoutEffect(()=>{
    renderer.current=createRigRenderer(svg.current!,definition,false,{yaw,guides})
    return ()=>{renderer.current=null}
  },[definition,yaw,guides])
  useLayoutEffect(()=>{renderer.current?.render(time,lang)},[time,lang,definition,yaw,guides])
  return <svg ref={svg} viewBox="0 0 900 900" role="img" aria-label={name} data-visual-style="technical" data-motion="continuous" className={cx('block h-full w-full',className)} />
}
