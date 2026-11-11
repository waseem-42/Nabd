import { ArrowUpLeft } from 'lucide-react'
import { Brand, BrandMark, Card } from '@/ui'

const colors = [
  ['المرجاني', '#FF785C', 'bg-accent'],
  ['الطباشيري', '#F5F2E9', 'bg-text'],
  ['الفحمي', '#111310', 'bg-bg'],
  ['الرملي · البيت', '#D6BB8C', 'bg-home'],
  ['المريمي · النادي', '#A6BFB8', 'bg-gym'],
] as const

/** Development-only reference; uses the same assets and tokens as the product. */
export default function BrandGuide() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-12" lang="ar" dir="rtl">
      <header className="mb-12 flex items-center justify-between border-b border-line pb-6">
        <Brand />
        <span className="text-xs text-muted">دليل الهوية · 01</span>
      </header>
      <div className="grid items-start gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="mb-4 text-sm font-semibold text-accent">رفيق تمرينك. على إيقاعك.</p>
          <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-bold leading-[1.3]">كل تمرين،<br /><span className="text-accent">خطوة لقدّام.</span></h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-muted">خطة واضحة. تمرين بتركيز.<br />وتقدّم تشوفه.</p>
          <div className="mt-8 flex gap-3">
            <span className="rounded-pill border border-line px-4 py-2 text-xs text-muted">واضح</span>
            <span className="rounded-pill border border-line px-4 py-2 text-xs text-muted">عملي</span>
            <span className="rounded-pill border border-line px-4 py-2 text-xs text-muted">يشجّعك تستمر</span>
          </div>
        </section>
        <section className="grid grid-cols-2 gap-3" aria-label="تطبيقات العلامة">
          <div className="col-span-2 flex min-h-52 items-center justify-center rounded-card bg-accent p-8">
            <div className="flex items-center gap-4 text-accent-ink">
              <img src="/brand/symbol.svg" className="size-24" alt="علامة نبض" />
              <div><p className="text-6xl font-bold">نبض</p><p className="mt-3 text-sm">على إيقاعك.</p></div>
            </div>
          </div>
          <div className="flex min-h-36 items-center justify-center rounded-card border border-line bg-surface"><BrandMark className="size-20" /></div>
          <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-card bg-text text-bg"><span className="text-4xl font-bold">نبض</span><span className="text-xs" lang="en">NABD · TRAINING</span></div>
        </section>
      </div>
      <section className="mt-12 border-t border-line pt-6">
        <h2 className="mb-4 text-sm text-muted">01 / لوحة الألوان</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {colors.map(([name, hex, fill]) => <div key={hex} className="overflow-hidden rounded-control border border-line"><div className={`h-20 ${fill}`} /><div className="bg-surface p-3"><p className="text-xs">{name}</p><p className="mt-1 text-xs text-muted" dir="ltr">{hex}</p></div></div>)}
        </div>
      </section>
      <div className="mt-8 grid gap-8 border-t border-line pt-6 md:grid-cols-2">
        <section>
          <h2 className="mb-5 text-sm text-muted">02 / الخط ونبرة الكلام</h2>
          <p className="text-2xl font-bold">قوّتك في استمرارك.</p>
          <p className="mt-2 text-sm text-muted">IBM Plex Sans Arabic · واضح بالعربي والإنجليزي</p>
          <p className="mt-5 text-3xl font-bold text-text tabular-nums" dir="ltr">24 : 08 &nbsp; / &nbsp; 32.5 kg</p>
        </section>
        <section>
          <h2 className="mb-5 text-sm text-muted">03 / من الهوية إلى الواجهة</h2>
          <Card className="hero-card">
            <p className="text-xs font-semibold text-accent">خطوتك اليوم</p>
            <p className="mt-2 text-xl font-bold">جاهز لتمرينك الجاي؟</p>
            <p className="mt-1 text-sm text-muted">خذها تمرين تمرين. الاستمرار يصنع الفرق.</p>
            <a href="/" className="mt-5 flex min-h-12 items-center justify-between rounded-control bg-accent px-4 font-semibold text-accent-ink">افتح نبض<ArrowUpLeft className="size-5" aria-hidden /></a>
          </Card>
        </section>
      </div>
      <footer className="mt-10 flex justify-between border-t border-line pt-5 text-xs text-faint"><span>نبض — على إيقاعك.</span><span lang="en" dir="ltr">NABD / BRAND SYSTEM</span></footer>
    </main>
  )
}
