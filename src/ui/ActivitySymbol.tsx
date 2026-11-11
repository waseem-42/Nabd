/** Static symbols for sports without a documented exercise pose sequence. */
export const SPORT_SYMBOLS: Record<string, string> = {
  football: 'M50 15a35 35 0 1 0 0 70a35 35 0 1 0 0-70 M50 35l15 11-6 18H41l-6-18Z M50 15v20 M17 39l18 7 M29 78l12-14 M71 78L59 64 M83 39l-18 7',
  basketball: 'M50 15a35 35 0 1 0 0 70a35 35 0 1 0 0-70 M15 50h70 M50 15v70 M25 25q43 25 0 50 M75 25q-43 25 0 50',
  volleyball: 'M50 15a35 35 0 1 0 0 70a35 35 0 1 0 0-70 M50 50Q25 31 28 23 M50 50Q72 37 77 29 M50 50Q47 77 38 82 M35 16q-3 24 25 35 M84 45Q66 39 48 67 M63 83Q49 61 25 58',
  tennis: 'M62 16c-17-9-39 3-43 22S28 70 45 66s34-31 29-42Z M29 61l-14 21 M24 71l9 7 M30 30l31 24 M39 22l30 24 M23 40l28 22 M31 22l-6 35 M44 18l-6 45 M58 20l-7 39 M77 72a9 9 0 1 0 0 18a9 9 0 1 0 0-18',
  padel: 'M57 16c-18-3-34 12-33 29 1 13 9 20 19 21l-7 19 10 4 7-22c13-3 23-19 23-31 0-12-8-19-19-20Z M38 33h1 M50 29h1 M61 34h1 M36 45h1 M49 42h1 M61 46h1 M45 55h1',
  badminton: 'M51 16L28 48q22 17 44 0Z M28 48l12 21q11 9 21 0l11-21 M40 69q-2 14 10 16t11-16 M51 16v41 M39 31l6 24 M63 31l-6 24',
  squash: 'M59 17c-17-6-35 8-36 25s13 26 28 20 30-30 24-40Z M32 59L17 83 M26 69l8 5 M32 28l28 22 M25 40l26 20 M45 19L31 55 M59 20L45 59 M79 73a7 7 0 1 0 0 14a7 7 0 1 0 0-14',
  'table-tennis': 'M60 18c-15-6-35 2-39 16s6 28 18 32l-7 14 9 5 12-16c16 1 28-12 28-26 0-12-8-22-21-25Z M25 31l48 25 M81 72a7 7 0 1 0 0 14a7 7 0 1 0 0-14',
  handball: 'M64 17a20 20 0 1 0 0 40a20 20 0 1 0 0-40 M44 37h40 M64 17v40 M21 80V52q0-6 5-6t5 6v-9q0-6 5-6t5 6v16l10-6q9-3 9 3L45 79v7H25Z',
  rugby: 'M18 65Q17 24 56 18q27-4 27 25-2 33-36 40-28 5-29-18Z M30 30l40 40 M41 22l36 36 M37 63l25-26 M43 61l-5-5 M51 53l-5-5 M59 45l-5-5',
  boxing: 'M25 70V52q-10-4-8-14 1-6 8-6v-8q0-8 8-8h20q12 0 15 13l5 20q4 14-9 20v14H25Z M25 70h39 M32 30v12 M44 28v14 M57 31v14 M25 52l15 5',
  'martial-arts': 'M50 12a11 11 0 1 0 0 22a11 11 0 1 0 0-22 M34 38l16 11 16-11 15 24-12 8-9-14 7 30H33l7-30-9 14-12-8Z M50 49l-8 20h19 M37 71h27 M50 71l8 15 M45 71l-5 13',
  climbing: 'M17 84l17-66 19 21 15-27 18 72Z M32 55l7-2 M54 68l7-2 M65 35l6 3 M43 18q-8 26 8 37t-2 29',
  skiing: 'M23 18l34 66q4 6 8 1 M51 17l23 65q3 7 8 2 M17 24l13 59 M38 18l7 65 M22 75l15-3 M37 75l16-2 M34 42l14-7 M56 39l12-4',
  surfing: 'M52 12Q21 30 28 70q3 17 19 16 16-18 19-43 3-21-14-31Z M52 12L40 82 M12 78q11-14 24 0t25 0t27 0 M12 90q11-12 24 0t25 0t27 0',
  dance: 'M51 13a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M46 38l-8 25 18 9 11 15 M38 63L22 85 M46 38l20 10 14-18 M45 43l-18 5-12-13 M75 10v13q-12-4-12 5t12 5V14l13-4v11q-11-3-11 5t11 4V6Z',
  golf: 'M57 16v52 M57 16l24 10-24 8 M16 84h70 M38 77a5 5 0 1 0 0 10a5 5 0 1 0 0-10 M20 17l10 48 12 5-1 7-22-7-8-52',
}

export function ActivitySymbol({ activity }: { activity?: string }) {
  const path = activity ? SPORT_SYMBOLS[activity] : undefined
  return <svg viewBox="0 0 100 100" className="relative size-full p-[18%] text-text/85" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={path ?? 'M20 35v30m10-38v46m40-46v46m10-38v30M30 50h40'} />
    <path d="M9 21V9h12M79 9h12v12M91 79v12H79M21 91H9V79" stroke="var(--color-accent)" opacity=".65" strokeWidth="1.5" />
  </svg>
}
