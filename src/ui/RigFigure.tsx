import { useLayoutEffect, useRef, type MutableRefObject } from 'react'
import { useLang } from '@/i18n'
import type { RigDefinition } from '@/motion/engine'
import { createRigRenderer } from '@/motion/svgRenderer'
import { cx } from './cx'

/** The same SVG renderer is bundled into Qassa's time-driven composition. */
export function RigFigure({ definition, time, name, className, yaw, guides, highlight, drawRef }: { definition:RigDefinition;time:number;name:string;className?:string;yaw?:number;guides?:boolean;highlight?:boolean;
  /** Receives a direct draw function, so a player can animate every frame without re-rendering React. */
  drawRef?:MutableRefObject<((time:number)=>void)|null> }) {
  const lang=useLang()
  const svg=useRef<SVGSVGElement>(null)
  const renderer=useRef<ReturnType<typeof createRigRenderer>|null>(null)
  useLayoutEffect(()=>{
    renderer.current=createRigRenderer(svg.current!,definition,false,{yaw,guides,highlight})
    return ()=>{renderer.current=null}
  },[definition,yaw,guides,highlight])
  useLayoutEffect(()=>{renderer.current?.render(time,lang)},[time,lang,definition,yaw,guides,highlight])
  useLayoutEffect(()=>{
    if(!drawRef)return
    drawRef.current=(value:number)=>renderer.current?.render(value,lang)
    return ()=>{drawRef.current=null}
  },[drawRef,lang])
  return <svg ref={svg} viewBox="0 0 900 900" role="img" aria-label={name} data-visual-style="segments" data-motion="continuous" className={cx('block h-full w-full',className)} />
}
