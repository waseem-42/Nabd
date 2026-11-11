import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Rotate3d, Route } from 'lucide-react'
import { useLang, useT } from '@/i18n'
import { fmtNumber } from '@/i18n/format'
import { movementClock, RIG_DURATION, RIG_GUIDES, RIG_PHASES, viewOf, type RigDefinition } from '@/motion/engine'
import { RigFigure } from './RigFigure'
import { usePrefersReducedMotion } from './ExerciseArt'
import { cx } from './cx'

const { actionStart, holdStart, returnStart, returnEnd } = RIG_PHASES

export function RigPlayer({definition,name}:{definition:RigDefinition;name:string}){
  const t=useT(),lang=useLang(),reduced=usePrefersReducedMotion()
  const guide=RIG_GUIDES[definition.id]
  const [time,setTime]=useState(0),[paused,setPaused]=useState(reduced),[speed,setSpeed]=useState(1),[visible,setVisible]=useState(true)
  const [alt,setAlt]=useState(false),[reps,setReps]=useState(0),[guides,setGuides]=useState(false)
  const root=useRef<HTMLDivElement>(null),clock=useRef(0),draw=useRef<((time:number)=>void)|null>(null)
  const yaw=alt?guide.altYaw:definition.yaw
  useEffect(()=>{if(reduced)setPaused(true)},[reduced])
  useEffect(()=>{
    if(!root.current||typeof IntersectionObserver==='undefined')return
    const observer=new IntersectionObserver(([entry])=>setVisible(!!entry?.isIntersecting))
    observer.observe(root.current);return()=>observer.disconnect()
  },[])
  // The figure is drawn on every display frame (time is its only input); the controls
  // below it only need ~10 updates a second, so React re-renders stay cheap.
  useEffect(()=>{
    if(paused||!visible)return
    let request:number,previous:number|undefined,sinceUi=0
    const tick=(now:number)=>{
      if(previous!==undefined&&!document.hidden){
        const step=Math.min((now-previous)/1000,.1)*speed
        const next=clock.current+step
        if(next>=RIG_DURATION)setReps(n=>n+1)
        clock.current=next%RIG_DURATION
        draw.current?.(clock.current)
        sinceUi+=step
        if(sinceUi>=.1){sinceUi=0;setTime(clock.current)}
      }
      previous=now
      request=requestAnimationFrame(tick)
    }
    request=requestAnimationFrame(tick);return()=>cancelAnimationFrame(request)
  },[paused,visible,speed])
  const jump=(value:number)=>{setPaused(true);clock.current=value;setTime(value)}
  const {phase}=movementClock(time)
  const exhaleOnAction=guide.exhaleOnAction
  const secs=(value:number)=>`${fmtNumber(value,lang,1)} ${t('common.sec')}`
  const segments=[
    {key:'action',from:actionStart,to:holdStart,label:definition.action[lang],active:phase===1,breath:exhaleOnAction},
    {key:'hold',from:holdStart,to:returnStart,label:t('motion.hold'),active:phase===2,breath:null},
    {key:'return',from:returnStart,to:returnEnd,label:definition.returning[lang],active:phase===3,breath:!exhaleOnAction},
  ] as const
  const chip='flex min-h-10 items-center gap-1.5 rounded-pill border border-line bg-bg/85 px-3 text-xs font-medium backdrop-blur'

  return <div ref={root} className="overflow-hidden rounded-card border border-line bg-surface" data-rig-player={definition.id}>
    <div className="relative aspect-square w-full">
      <RigFigure definition={definition} time={clock.current} name={name} yaw={yaw} guides={guides} highlight drawRef={draw}/>
      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <div className="flex gap-2">
          <button type="button" onClick={()=>setAlt(value=>!value)} aria-pressed={alt} aria-label={t('motion.angle')} className={cx(chip,'text-text')}>
            <Rotate3d className="size-4" aria-hidden />{viewOf(alt?definition.yaw:guide.altYaw)[lang]}
          </button>
          <button type="button" onClick={()=>setGuides(value=>!value)} aria-pressed={guides} className={cx(chip,guides?'border-accent/40 text-accent':'text-muted')}>
            <Route className="size-4" aria-hidden />{t('motion.guides')}
          </button>
        </div>
        <span className="rounded-pill bg-bg/70 px-2.5 py-1 text-xs tabular-nums text-muted backdrop-blur" aria-live="polite">{t('motion.repCount',{n:fmtNumber(reps+1,lang)})}</span>
      </div>
    </div>
    <div className="border-t border-line px-4 pb-3 pt-3">
      {/* Tempo: the parts of one repetition, proportional to their time, with the breath for each. Tap a part to see it. */}
      <div className="mb-3 flex gap-1.5" dir="ltr">
        {segments.map(segment=>{
          const done=!segment.active&&time>=segment.to&&time<returnEnd
          const fill=segment.active?Math.min(100,Math.max(0,(time-segment.from)/(segment.to-segment.from)*100)):done?100:0
          return <button type="button" key={segment.key} data-segment={segment.key} onClick={()=>jump((segment.from+segment.to)/2)} style={{flexGrow:segment.to-segment.from}} className="min-w-0 basis-0 text-start" dir={lang==='ar'?'rtl':'ltr'}>
            <span className="relative mb-1.5 block h-1.5 overflow-hidden rounded-pill bg-line" dir="ltr" aria-hidden>
              <span className={cx('absolute inset-y-0 left-0 rounded-pill',segment.active?'bg-accent':'bg-accent/45')} style={{width:`${fill}%`}}/>
            </span>
            <span className={cx('block truncate text-[0.72rem] font-semibold leading-tight',segment.active?'text-accent':'text-muted')}>{segment.label}</span>
            {segment.breath!==null&&<span className="block truncate text-[0.68rem] leading-tight text-faint">{secs(segment.to-segment.from)} · {t(segment.breath?'motion.breatheOut':'motion.breatheIn')}</span>}
          </button>
        })}
      </div>
      {guides&&<div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-pill bg-accent/30" aria-hidden />{t('motion.legendWork')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dotted border-accent" aria-hidden />{t('motion.legendPath')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-faint" aria-hidden />{t('motion.legendEnd')}</span>
      </div>}
      <label className="sr-only" htmlFor={`rig-time-${definition.id}`}>{t('motion.seek')}</label>
      <input id={`rig-time-${definition.id}`} className="motion-range mb-3 w-full" type="range" min={0} max={RIG_DURATION} step={.01} value={time} aria-valuetext={`${time.toFixed(1)} / ${RIG_DURATION} s`} onChange={event=>jump(Number(event.target.value))} dir="ltr"/>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={()=>setPaused(value=>!value)} aria-label={t(paused?'motion.play':'motion.pause')} aria-pressed={!paused} className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-ink">{paused?<Play className="size-4"/>:<Pause className="size-4"/>}</button>
          <button type="button" onClick={()=>{jump(0);setReps(0)}} aria-label={t('motion.restart')} className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2"><RotateCcw className="size-4"/></button>
        </div>
        <div className="flex gap-1 rounded-pill bg-bg p-1" role="group" aria-label={t('motion.speed')}>{[.25,.5,1].map(value=><button type="button" key={value} aria-pressed={speed===value} onClick={()=>setSpeed(value)} dir="ltr" className={cx('min-h-10 min-w-11 rounded-pill px-3 text-xs',speed===value?'bg-surface-3 text-text':'text-muted')}>{value}×</button>)}</div>
      </div>
      <p className="mt-3 text-[0.7rem] leading-relaxed text-faint">{t('motion.illustrativeTiming')}</p>
    </div>
  </div>
}
