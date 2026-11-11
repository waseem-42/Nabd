import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check, CheckCheck, Layers3, Pause, Play, RotateCcw } from 'lucide-react'
import { routes } from '@/app/routes'
import { useLang, useT } from '@/i18n'
import { MOTION_STYLES, NEW_MOTION_STYLES, useMotionReview, type MotionStyle } from '@/store/motionReview'
import { Badge, Button, Card, Screen, Section, cx } from '@/ui'
import { MotionFrame } from '@/ui/MotionFrame'

export default function MotionLab() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const approved = useMotionReview(s => s.approved)
  const approve = useMotionReview(s => s.approve)
  const [style, setStyle] = useState<MotionStyle>(approved ?? 'athlete')
  const [showPrevious, setShowPrevious] = useState(!!approved && MOTION_STYLES.indexOf(approved) < 3)
  const [time, setTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(() => typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const stop = () => { if (query.matches) setPlaying(false) }
    query.addEventListener('change', stop)
    return () => query.removeEventListener('change', stop)
  }, [])

  useEffect(() => {
    if (!playing) return
    let request: number
    let previous: number | undefined
    let accumulated = 0
    const tick = (now: number) => {
      if (previous !== undefined && !document.hidden) accumulated += Math.min((now - previous) / 1000, .1) * speed
      previous = now
      if (accumulated >= 1 / 30) { const delta = accumulated; accumulated = 0; setTime(t => (t + delta) % 6) }
      request = requestAnimationFrame(tick)
    }
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  }, [playing, speed])

  const saved = approved === style
  return (
    <Screen title={t('motion.title')} subtitle={t('motion.subtitle')} onBack={() => navigate(routes.library)} actions={<Badge tone="accent">{t('motion.sample')}</Badge>}>
      <div className="px-5 pt-3">
        <p className="mb-4 text-sm leading-relaxed text-muted">{t('motion.intro')}</p>
        <div className="mb-3 grid grid-cols-2 gap-2" role="group" aria-label={t('motion.choose')}>
          {NEW_MOTION_STYLES.map((candidate) => <button type="button" key={candidate} aria-pressed={style === candidate} onClick={() => setStyle(candidate)} className={cx('min-h-16 rounded-control border px-3 py-2 text-start transition-colors', style === candidate ? 'border-accent bg-accent-soft' : 'border-line bg-surface')}>
            <span className="flex items-center justify-between gap-1 text-[0.6rem] text-faint"><span dir="ltr">0{MOTION_STYLES.indexOf(candidate) + 1}</span>{approved === candidate ? <CheckCheck className="size-3.5 text-ok" /> : <span className="text-accent">{t('motion.new')}</span>}</span>
            <span className="mt-1 block text-xs font-semibold">{t(`motion.style.${candidate}`)}</span>
          </button>)}
        </div>
        <button type="button" className="mb-4 min-h-11 w-full rounded-control border border-line px-3 text-sm text-muted" aria-expanded={showPrevious} aria-controls="previous-motion-styles" onClick={() => setShowPrevious(p => !p)}>{t('motion.previous')}</button>
        {showPrevious && <div id="previous-motion-styles" className="mb-4 grid grid-cols-3 gap-2" role="group" aria-label={t('motion.previous')}>{MOTION_STYLES.slice(0,3).map((candidate,i) => <button type="button" key={candidate} aria-pressed={style===candidate} onClick={() => setStyle(candidate)} className={cx('min-h-16 rounded-control border px-2 py-2 text-xs',style===candidate?'border-accent bg-accent-soft':'border-line bg-surface')}><span className="mb-1 block text-[0.6rem] text-faint" dir="ltr">0{i+1}</span>{t(`motion.style.${candidate}`)}</button>)}</div>}
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3"><span className="text-sm font-semibold">{t('motion.squat')}</span><span className="text-xs text-muted">{t(`motion.style.${style}`)}</span></div>
          <MotionFrame style={style} time={time} />
          <div className="border-t border-line bg-surface px-4 py-4">
            <label className="sr-only" htmlFor="motion-time">{t('motion.seek')}</label>
            <input id="motion-time" type="range" min={0} max={6} step={.01} value={time} aria-valuetext={`${time.toFixed(1)} / 6 s`} onChange={e => { setPlaying(false); setTime(Number(e.target.value)) }} className="motion-range w-full" dir="ltr" />
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><button type="button" onClick={() => setPlaying(p => !p)} aria-label={t(playing ? 'motion.pause' : 'motion.play')} className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-ink">{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button><button type="button" aria-label={t('motion.restart')} onClick={() => { setTime(0); setPlaying(false) }} className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2"><RotateCcw className="size-4" /></button></div>
              <div className="flex gap-1 rounded-pill bg-bg p-1" role="group" aria-label={t('motion.speed')}>{[.5, 1, 1.5].map(value => <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)} className={cx('min-h-10 min-w-11 rounded-pill px-2 text-xs font-semibold tabular-nums', speed === value ? 'bg-surface-3 text-text' : 'text-muted')} dir="ltr">{value}×</button>)}</div>
            </div>
          </div>
        </div>
      </div>
      <Section>
        <Card><div className="mb-2 flex items-center gap-2"><Layers3 className="size-4 text-accent" /><p className="text-sm font-semibold">{t(`motion.style.${style}`)}</p>{style === 'technical' && <Badge tone="accent">{t('motion.chosen')}</Badge>}</div><p className="text-sm leading-relaxed text-muted">{t(`motion.detail.${style}`)}</p></Card>
        <Button fullWidth className="mt-4" variant={saved ? 'secondary' : 'primary'} icon={saved ? <CheckCheck className="size-5" /> : <Check className="size-5" />} onClick={() => approve(style)}>{t(saved ? 'motion.approved' : 'motion.approve')}</Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-faint">{t('motion.approvalHint')}</p>
      </Section>
      <Section title={t('motion.production')}>
        <Card className="flex flex-col gap-3"><p className="text-sm leading-relaxed text-muted">{t('motion.toolDescription')}</p><a href="http://127.0.0.1:14317/?p=nabd-motion-styles-v1" target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between border-t border-line pt-3 text-sm font-semibold text-accent">{t('motion.openEditor')}<ArrowUpRight className="size-4" aria-hidden /></a><p className="text-xs leading-relaxed text-faint">{lang === 'ar' ? 'نسخة تجريبية لمقارنة الأسلوب والحركة. تحتاج الرسوم مراجعة فنية قبل تعميمها على المكتبة.' : 'A style and motion prototype. Technical review is needed before extending it to the catalogue.'}</p></Card>
      </Section>
    </Screen>
  )
}
