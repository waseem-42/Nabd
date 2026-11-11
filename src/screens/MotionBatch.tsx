import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpLeft, Check } from 'lucide-react'
import { routes } from '@/app/routes'
import { EXERCISE_BY_ID } from '@/data/catalog'
import { pick, useLang, useT } from '@/i18n'
import { RIGS } from '@/motion/engine'
import { Badge, Card, Screen, Section, cx } from '@/ui'
import { RigFigure } from '@/ui/RigFigure'
import { RigPlayer } from '@/ui/RigPlayer'
import { ExerciseSafety } from './parts/ExerciseSafety'

export default function MotionBatch(){
  const t=useT(),lang=useLang(),navigate=useNavigate()
  const [selected,setSelected]=useState(RIGS[0]!)
  const exercise=EXERCISE_BY_ID.get(selected.exerciseId)!
  return <Screen title={t('motion.batchTitle')} subtitle={t('motion.batchSubtitle')} onBack={()=>navigate(routes.library)} actions={<Badge tone="accent">10 / 10</Badge>}>
    <div className="px-5 pt-3"><p className="mb-4 text-sm leading-relaxed text-muted">{t('motion.batchIntro')}</p>
      <p className="mb-4 rounded-control border border-warn/25 bg-surface p-3 text-xs leading-relaxed text-warn">{t('motion.reviewNote')}</p>
      <label className="mb-2 block text-xs text-muted" htmlFor="rig-exercise">{t('motion.chooseExercise')}</label>
      <select id="rig-exercise" value={selected.exerciseId} onChange={event=>setSelected(RIGS.find(rig=>rig.exerciseId===event.target.value)!)} className="mb-4 min-h-12 w-full rounded-control border border-line bg-surface px-3 text-sm">{RIGS.map(rig=><option key={rig.id} value={rig.exerciseId}>{pick(EXERCISE_BY_ID.get(rig.exerciseId)!.name,lang)}</option>)}</select>
      <h2 className="mb-3 text-xl font-bold">{pick(exercise.name,lang)}</h2>
      <RigPlayer key={selected.id} definition={selected} name={pick(exercise.name,lang)}/>
      <div className="mt-4"><ExerciseSafety exercise={exercise}/></div>
      <button type="button" onClick={()=>navigate(routes.exercise(exercise.id))} className="mt-3 flex min-h-12 w-full items-center justify-between rounded-control border border-accent/25 bg-accent-soft px-4 text-sm font-semibold text-accent">{t('motion.openExercise')}<ArrowUpLeft className="size-4 ltr:-scale-x-100"/></button>
    </div>
    <Section title={t('motion.batchExercises')}><div className="grid grid-cols-2 gap-3">{RIGS.map(rig=><button type="button" key={rig.id} aria-pressed={selected.id===rig.id} onClick={()=>setSelected(rig)} className={cx('overflow-hidden rounded-card border text-start',selected.id===rig.id?'border-accent bg-accent-soft':'border-line bg-surface')}><div className="aspect-square"><RigFigure definition={rig} time={2.8} name={rig.title[lang]}/></div><span className="flex min-h-14 items-center justify-between gap-2 border-t border-line px-3 py-2 text-xs font-semibold"><span>{rig.title[lang]}</span>{selected.id===rig.id&&<Check className="size-4 shrink-0 text-accent"/>}</span></button>)}</div></Section>
    <Section><Card><p className="text-sm leading-relaxed text-muted">{t('motion.batchScope')}</p></Card></Section>
  </Screen>
}
