#!/usr/bin/env node
/**
 * Builds the bundled exercise catalogue for Nabd from its two open sources (see CREDITS.md):
 *   - GymMane  (ids, English names/steps, muscles, equipment, program templates, art slugs)
 *   - openGym  (Arabic names, English names used to pick between candidates, accessory rule)
 *
 * Output (deterministic, 2-space JSON, UTF-8 without BOM, LF):
 *   src/data/exercises.json     RawExercise[]
 *   src/data/exercises.ar.json  RawExerciseAr (an entry for every id; name "" when unknown)
 *   src/data/programs.json      ProgramTemplate[]
 *
 * Usage: node scripts/build-catalog.mjs [--refresh] [--dump]
 *   --refresh  re-download the sources into .cache/catalog/
 *   --dump     print the catalogue as a table and exit (helps authoring programs)
 *
 * Everything read from the downloaded files is treated as data only.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.cache', 'catalog')
const OUT = join(ROOT, 'src', 'data')
const REFRESH = process.argv.includes('--refresh')
const DUMP = process.argv.includes('--dump')

const GM = 'https://raw.githubusercontent.com/InlitX/GymMane/HEAD/'
const OG = 'https://raw.githubusercontent.com/DuarteSantos8/openGym/HEAD/'

// ── Vocabulary (mirrors src/types.ts; the test file re-checks the output against the real types) ──
const MUSCLES = ['chest', 'shoulders', 'biceps', 'triceps', 'forearm', 'trapezius', 'back', 'lowerback',
  'abdomen', 'obliques', 'glutes', 'quads', 'hamstrings', 'calves']
const EQUIPMENT = ['bodyweight', 'dumbbell', 'barbell', 'machine', 'cable', 'band', 'kettlebell', 'weighted',
  'rings', 'other']
const ACCESSORIES = ['bench', 'pullup-bar']
const LEVELS = ['beginner', 'intermediate', 'advanced']
const KINDS = ['strength', 'calisthenics', 'cardio', 'stretch', 'sport']
const MODES = ['reps', 'time', 'cardio']

const fail = (msg) => { console.error('\nERROR: ' + msg); process.exit(1) }

// ── Download / cache ────────────────────────────────────────────────────────────────────────────
mkdirSync(CACHE, { recursive: true })

async function source(cacheName, url) {
  const file = join(CACHE, cacheName)
  if (!REFRESH && existsSync(file)) return readFileSync(file, 'utf8')
  console.log('downloading ' + url)
  const res = await fetch(url)
  if (!res.ok) fail(`GET ${url} -> HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(file, text, 'utf8')
  return text
}

async function artSlugs() {
  const file = join(CACHE, 'art_list.txt')
  if (!REFRESH && existsSync(file)) return readFileSync(file, 'utf8')
  let names
  try {
    names = execFileSync('gh', ['api', 'repos/InlitX/GymMane/contents/assets/art', '--paginate', '--jq', '.[].name'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    console.log('gh failed, using the unauthenticated GitHub API')
    const res = await fetch('https://api.github.com/repos/InlitX/GymMane/contents/assets/art', {
      headers: { 'User-Agent': 'nabd-build-catalog', Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) fail(`GitHub API -> HTTP ${res.status}`)
    const rows = await res.json()
    if (!Array.isArray(rows)) fail('GitHub API returned no listing for assets/art')
    names = rows.map((r) => r.name).join('\n') + '\n'
  }
  writeFileSync(file, names, 'utf8')
  return names
}

const [catalogSrc, programsSrc, aliasesSrc, mergedSrc, ogIdsSrc, arJson, exdbSrc, artText] = await Promise.all([
  source('gm_exercise_catalog.dart', GM + 'lib/catalog/exercise_catalog.dart'),
  source('gm_program_templates.dart', GM + 'lib/catalog/program_templates.dart'),
  source('gm_exercise_aliases.dart', GM + 'lib/catalog/exercise_aliases.dart'),
  source('gm_merged_exercises.dart', GM + 'lib/catalog/merged_exercises.dart'),
  source('gm_opengym_ids.dart', GM + 'lib/catalog/opengym_ids.dart'),
  source('og_ar.json', OG + 'catalogue/i18n/ar.json'),
  source('og_exercises-data.js', OG + 'frontend/src/lib/exercises-data.js'),
  artSlugs(),
])

// ── Dart parsing helpers ────────────────────────────────────────────────────────────────────────
const STR_RE = /'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g
const unescapeDart = (s) => s.replace(/\\(.)/g, '$1')
const dartStrings = (text) => [...text.matchAll(STR_RE)].map((m) => unescapeDart(m[1] ?? m[2]))

/** Text of a top-level `const ... name = <literal>;` (up to the closing `};` / `];` at column 0). */
function dartTable(src, name) {
  const start = src.search(new RegExp(`^const [^=\\n]*\\b${name} = `, 'm'))
  if (start < 0) fail(`table ${name} not found`)
  const rest = src.slice(start)
  const end = rest.search(/^[}\]];/m)
  if (end < 0) fail(`table ${name} has no end`)
  return rest.slice(0, end)
}
const dartSet = (src, name) => new Set(dartStrings(dartTable(src, name).replace(/^[^=]*=/, '')))
const dartList = (src, name) => dartStrings(dartTable(src, name).replace(/^[^=]*=/, ''))
function dartPairs(src, name) {
  const body = dartTable(src, name).replace(/^[^=]*=/, '')
  const out = []
  for (const m of body.matchAll(/(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*:\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")/g)) {
    out.push([unescapeDart(m[1] ?? m[2]), unescapeDart(m[3] ?? m[4])])
  }
  return out
}

// ── GymMane catalogue ───────────────────────────────────────────────────────────────────────────
const gmRaw = []
{
  const start = catalogSrc.indexOf('const List<Exercise> kExercises = [')
  const end = catalogSrc.indexOf('\n];', start)
  if (start < 0 || end < 0) fail('kExercises not found')
  const blocks = catalogSrc.slice(start, end).split('\n  Exercise(\n').slice(1)
  for (const block of blocks) {
    const field = (key) => {
      const m = block.match(new RegExp(`^    ${key}: (.*),$`, 'm'))
      return m ? m[1] : undefined
    }
    const str = (key) => {
      const v = field(key)
      return v === undefined ? undefined : dartStrings(v)[0]
    }
    const list = (key) => {
      const v = field(key)
      return v === undefined ? [] : dartStrings(v)
    }
    const stepsStart = block.indexOf('    steps: [')
    const stepsEnd = block.indexOf('\n    ],', stepsStart)
    if (stepsStart < 0 || stepsEnd < 0) fail('malformed steps in block:\n' + block.slice(0, 200))
    const steps = dartStrings(block.slice(stepsStart + '    steps: ['.length, stepsEnd))
    gmRaw.push({
      id: str('id'), name: str('name'), primary: str('primary'), secondary: list('secondary'),
      equipment: str('equipment'), difficulty: str('difficulty'), art: str('art'),
      mode: str('mode') ?? '', kind: str('kind') ?? '', aliases: list('aliases'), steps,
    })
  }
}
if (gmRaw.length < 400) fail(`only ${gmRaw.length} GymMane exercises parsed`)

const kNeedsKit = dartSet(catalogSrc, 'kNeedsKit')
const kStretchIds = dartSet(catalogSrc, 'kStretchIds')
const kCardioExtras = dartSet(catalogSrc, 'kCardioExtras')
const kCalisthenicsEquipment = dartSet(catalogSrc, 'kCalisthenicsEquipment')
const kExerciseModes = new Map(dartPairs(catalogSrc, 'kExerciseModes'))
const kMerged = new Map(dartPairs(mergedSrc, 'kMergedExercises'))
const kOpenGymIds = dartPairs(ogIdsSrc, 'kOpenGymIds')

const EQ_MAP = {
  Bodyweight: 'bodyweight', Dumbbell: 'dumbbell', Barbell: 'barbell', Machine: 'machine', Cable: 'cable',
  Band: 'band', Kettlebell: 'kettlebell', Weighted: 'weighted', Rings: 'rings', Other: 'other',
}
const LEVEL_MAP = { Beginner: 'beginner', Intermediate: 'intermediate', Advanced: 'advanced' }

const artSet = new Set(artText.split(/\r?\n/).filter((l) => l.endsWith('.txt')).map((l) => l.slice(0, -4)))
if (artSet.size < 100) fail(`art list looks wrong (${artSet.size} slugs)`)

// ── openGym data ────────────────────────────────────────────────────────────────────────────────
const arData = JSON.parse(arJson)

/** Decode the first JSON.parse('...') string literal of exercises-data.js without evaluating code. */
function readExdb(js) {
  const marker = js.indexOf("JSON.parse('")
  if (marker < 0) fail('exercises-data.js: JSON.parse literal not found')
  let i = marker + "JSON.parse('".length
  let out = ''
  for (; i < js.length; i++) {
    const c = js[i]
    if (c === "'") break
    if (c !== '\\') { out += c; continue }
    const n = js[++i]
    if (n === 'n') out += '\n'
    else if (n === 't') out += '\t'
    else if (n === 'r') out += '\r'
    else if (n === 'u') { out += String.fromCharCode(parseInt(js.slice(i + 1, i + 5), 16)); i += 4 }
    else if (n === 'x') { out += String.fromCharCode(parseInt(js.slice(i + 1, i + 3), 16)); i += 2 }
    else out += n
  }
  return JSON.parse(out)
}
const exdb = readExdb(exdbSrc)
const ogById = new Map(exdb.map((e) => [e.id, e]))

// ── Name matching (port of GymMane's lib/services/exercise_match.dart) ──────────────────────────
const STOP = new Set(['the', 'a', 'an', 'with', 'on', 'to', 'and', 'or', 'in', 'for', 'v', 'var'])
const SYN = {
  lat: 'lateral', lats: 'lateral', bicep: 'biceps', bicepts: 'biceps', tricep: 'triceps', tricepts: 'triceps',
  db: 'dumbbell', bb: 'barbell', kb: 'kettlebell', bw: 'bodyweight', dumbell: 'dumbbell', dumbells: 'dumbbell',
  dumbbells: 'dumbbell', barbells: 'barbell', cables: 'cable', machines: 'machine', bands: 'band',
  ohp: 'overhead press', pushup: 'push up', pushups: 'push up', pullup: 'pull up', pullups: 'pull up',
  chinup: 'chin up', chinups: 'chin up', situp: 'sit up', situps: 'sit up', curls: 'curl', rows: 'row',
  presses: 'press', ups: 'up', downs: 'down', climbers: 'climber', crushers: 'crusher', squats: 'squat',
  raises: 'raise', extensions: 'extension', flyes: 'fly', flies: 'fly', flys: 'fly', deadlifts: 'deadlift',
  lunges: 'lunge', dips: 'dip', pulldowns: 'pulldown', calves: 'calf', calve: 'calf', legs: 'leg', arms: 'arm',
  abs: 'abdominal', delts: 'deltoid', lever: 'machine', smith: 'machine', skullcrusher: 'lying triceps extension',
  skullcrushers: 'lying triceps extension', rdl: 'romanian deadlift', sldl: 'stiff leg deadlift',
}
const EQ_WORDS = new Set(['barbell', 'dumbbell', 'cable', 'machine', 'smith', 'kettlebell', 'band', 'bodyweight',
  'lever', 'sled', 'weighted', 'assisted', 'ez'])
const MODIFIERS = new Set(['one', 'single', 'arm', 'seated', 'sitted', 'standing', 'lying', 'alternate',
  'alternating', 'wide', 'close', 'narrow', 'grip', 'straight', 'bent', 'over', 'both', 'two', 'double', 'hand'])
const LEGS = new Set(['quads', 'glutes', 'hamstrings', 'calves'])
const MUSCLE_HINTS = [
  [['hyperextension', 'back extension', 'superman', 'lower back', 'erector', 'deadlift'], 'lowerback'],
  [['calf', 'calves', 'soleus'], 'calves'],
  [['hamstring', 'leg curl', 'good morning', 'nordic'], 'hamstrings'],
  [['glute', 'hip thrust', 'bridge', 'kickback'], 'glutes'],
  [['quad', 'squat', 'leg press', 'leg extension', 'lunge', 'step up', 'hack'], 'quads'],
  [['oblique', 'twist', 'side bend', 'wood chop', 'russian'], 'obliques'],
  [['crunch', 'sit up', 'plank', 'abdominal', 'leg raise', 'hollow', 'v up'], 'abdomen'],
  [['shrug', 'trap ', 'trapezius', 'upright row'], 'trapezius'],
  [['forearm', 'wrist', 'farmer', 'gripper', 'hand grip'], 'forearm'],
  [['triceps', 'pushdown', 'skullcrusher', 'kickback', 'dip'], 'triceps'],
  [['biceps', 'curl', 'preacher', 'chin up'], 'biceps'],
  [['lateral raise', 'shoulder', 'overhead press', 'military', 'arnold', 'face pull', 'delt', 'upright'], 'shoulders'],
  [['row', 'pulldown', 'pull up', 'pullover', 'lateral pull'], 'back'],
  [['bench press', 'chest', 'fly', 'pec', 'push up', 'press'], 'chest'],
]

function nameTokens(raw) {
  const flat = raw.toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/ñ/g, 'n')
  const out = []
  for (const part of flat.split(/[^a-z0-9]+/)) {
    if (!part || STOP.has(part)) continue
    out.push(...(SYN[part] ?? part).split(' '))
  }
  return out
}
const searchKey = (raw) => nameTokens(raw).join(' ')
const sortedKey = (raw) => nameTokens(raw).sort().join(' ')
const setDiff = (a, b) => new Set([...a].filter((x) => !b.has(x)))
const setInter = (a, b) => new Set([...a].filter((x) => b.has(x)))
const containsAll = (a, b) => [...b].every((x) => a.has(x))

function guessMuscle(name) {
  const flat = ` ${nameTokens(name).join(' ')} `
  for (const [needles, muscle] of MUSCLE_HINTS) {
    for (const n of needles) if (flat.includes(` ${n}`) || flat.includes(`${n} `)) return muscle
  }
  return null
}
const sameEquipment = (q, c) => {
  const qe = setInter(q, EQ_WORDS), ce = setInter(c, EQ_WORDS)
  return qe.size === 0 || ce.size === 0 || setInter(qe, ce).size > 0
}
const sameMuscle = (hint, e) => hint === null || e.primary === hint || e.secondary.includes(hint) ||
  (LEGS.has(hint) && LEGS.has(e.primary)) || (hint === 'lowerback' && (e.primary === 'hamstrings' || e.primary === 'glutes'))
const fits = (qCore, q, c) => {
  if (qCore.size > 0 && containsAll(c, qCore)) return true
  const cMeaning = setDiff(c, EQ_WORDS)
  return cMeaning.size >= 2 && setDiff(cMeaning, MODIFIERS).size > 0 && containsAll(q, cMeaning)
}
const score = (q, c) => {
  const shared = setInter(q, c)
  if (setDiff(shared, EQ_WORDS).size === 0) return 0
  return shared.size * 3 - setDiff(c, q).size - setDiff(q, c).size
}

const aliasIndex = new Map()
for (const [name, aliases] of dartPairsOfLists(aliasesSrc)) for (const a of aliases) aliasIndex.set(sortedKey(a), name)

/** kExerciseAliases is `'Name': ['a', 'b'],` per line. */
function dartPairsOfLists(src) {
  const body = dartTable(src, 'kExerciseAliases').replace(/^[^=]*=/, '')
  const out = []
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*:\s*\[(.*)\],?\s*$/)
    if (m) out.push([unescapeDart(m[1] ?? m[2]), dartStrings(m[3])])
  }
  return out
}

function matchExercise(name, pool) {
  const key = searchKey(name)
  if (!key) return null
  for (const e of pool) if (searchKey(e.name) === key) return e
  for (const e of pool) if (e.aliases.some((a) => searchKey(a) === key)) return e
  const alias = aliasIndex.get(sortedKey(name))
  if (alias) {
    const wanted = searchKey(alias)
    for (const e of pool) if (searchKey(e.name) === wanted) return e
  }
  const q = new Set(key.split(' '))
  const qMeaning = setDiff(q, EQ_WORDS)
  if (qMeaning.size === 0) return null
  const qCore = setDiff(qMeaning, MODIFIERS)
  const hint = guessMuscle(name)
  let exact = null, exactExtra = Infinity, loose = null, looseScore = 0
  for (const e of pool) {
    const c = new Set(nameTokens(e.name))
    if (c.size === 0 || !sameEquipment(q, c) || !sameMuscle(hint, e)) continue
    if (containsAll(c, qMeaning)) {
      const extra = setDiff(c, q).size
      if (extra < exactExtra) { exact = e; exactExtra = extra }
    } else if (fits(qCore, q, c)) {
      const s = score(q, c)
      if (s > looseScore) { loose = e; looseScore = s }
    }
  }
  return exact ?? (looseScore >= 3 ? loose : null)
}

// ── Accessories (openGym frontend/src/lib/equipment.js, applied to the GymMane English name) ────
function accessoriesByName(name, equipment) {
  if (equipment === 'machine') return [] // machines carry their own seat / bar / bench
  const n = name.toLowerCase()
  const need = []
  if (/\bbench\b|\bincline\b|\bdecline\b/.test(n)) need.push('bench')
  if (/pull-up|pull up|chin-up|\bchin\b|hanging|dead hang|muscle-up|muscle up/.test(n)) need.push('pullup-bar')
  return need
}
// Cases the name rule cannot see but the exercise's own steps state plainly (hang from a bar, sit on a bench).
// Other kNeedsKit exercises need kit the contract cannot express (parallel bars, a mat, a step...) and are reported.
const ACCESSORY_OVERRIDES = {
  'active-hang': ['pullup-bar'], 'arch-hang': ['pullup-bar'], 'wide-row': ['pullup-bar'],
  X6C6i5Y: ['bench'], G7xoEzr: ['bench'], 'dragon-flag': ['bench'],
}
const OG_ACC = { bench: 'bench', 'pull-up bar': 'pullup-bar' }

// ── Build exercises ─────────────────────────────────────────────────────────────────────────────
const gmIds = new Set(gmRaw.map((e) => e.id))
if (gmIds.size !== gmRaw.length) fail('duplicate ids in the GymMane catalogue')

// openGym id -> GymMane id (many-to-one), inverted to GymMane id -> openGym candidates.
const candidates = new Map()
const danglingOg = []
for (const [ogId, rawGmId] of kOpenGymIds) {
  const gmId = gmIds.has(rawGmId) ? rawGmId : kMerged.get(rawGmId)
  if (!gmId || !gmIds.has(gmId)) { danglingOg.push(`${ogId}->${rawGmId}`); continue }
  if (!candidates.has(gmId)) candidates.set(gmId, [])
  candidates.get(gmId).push(ogId)
}

function overlap(a, b) {
  const A = new Set(nameTokens(a)), B = new Set(nameTokens(b))
  const union = new Set([...A, ...B]).size
  return union === 0 ? 0 : setInter(A, B).size / union
}

const issues = {
  secondaryHadPrimary: [], kitWithoutAccessory: [], ogNeedsAdded: [], arCandidatesWithoutName: 0,
}

const exercises = []
const arMap = {}
for (const g of gmRaw) {
  const where = `${g.id} (${g.name})`
  if (!MUSCLES.includes(g.primary)) fail(`unknown primary muscle "${g.primary}" on ${where}`)
  for (const s of g.secondary) if (!MUSCLES.includes(s)) fail(`unknown secondary muscle "${s}" on ${where}`)
  if (!(g.equipment in EQ_MAP)) fail(`unknown equipment "${g.equipment}" on ${where}`)
  if (!(g.difficulty in LEVEL_MAP)) fail(`unknown difficulty "${g.difficulty}" on ${where}`)
  if (g.kind && !KINDS.includes(g.kind)) fail(`unknown kind "${g.kind}" on ${where}`)

  const equipment = EQ_MAP[g.equipment]
  const rawMode = g.mode || kExerciseModes.get(g.id) || ''
  if (rawMode && rawMode !== 'time' && rawMode !== 'cardio') fail(`unknown mode "${rawMode}" on ${where}`)
  const mode = rawMode === '' ? 'reps' : rawMode

  // Same derivation as GymMane's LibraryState.kindOf.
  let kind = g.kind
  if (!kind) {
    if (kStretchIds.has(g.id)) kind = 'stretch'
    else if (mode === 'cardio' || kCardioExtras.has(g.id)) kind = 'cardio'
    else kind = kCalisthenicsEquipment.has(g.equipment) ? 'calisthenics' : 'strength'
  }

  const secondary = []
  for (const s of g.secondary) {
    if (s === g.primary) { issues.secondaryHadPrimary.push(g.id); continue }
    if (!secondary.includes(s)) secondary.push(s)
  }

  // Arabic name: candidate whose English name is closest to ours.
  let arName = ''
  let best = -1
  for (const ogId of candidates.get(g.id) ?? []) {
    const ar = arData[ogId]
    const og = ogById.get(ogId)
    if (!ar || typeof ar.name !== 'string' || !ar.name.trim()) { issues.arCandidatesWithoutName++; continue }
    const s = og ? overlap(g.name, og.n) : 0
    if (s > best) { best = s; arName = ar.name.trim() }
  }

  // Accessories: name rule, plus what openGym's catalogue itself lists for the closest candidate.
  const needs = accessoriesByName(g.name, equipment)
  if (equipment !== 'machine') {
    let bestCand = null, bestS = -1
    for (const ogId of candidates.get(g.id) ?? []) {
      const og = ogById.get(ogId)
      const s = og ? overlap(g.name, og.n) : -1
      if (s > bestS) { bestS = s; bestCand = og }
    }
    for (const a of Array.isArray(bestCand?.nd) ? bestCand.nd : []) {
      const acc = OG_ACC[a]
      if (acc && !needs.includes(acc)) { needs.push(acc); issues.ogNeedsAdded.push(`${g.id} ${g.name} +${acc}`) }
    }
  }
  for (const a of ACCESSORY_OVERRIDES[g.id] ?? []) if (!needs.includes(a)) needs.push(a)
  needs.sort((a, b) => ACCESSORIES.indexOf(a) - ACCESSORIES.indexOf(b))
  if (kNeedsKit.has(g.id) && needs.length === 0) issues.kitWithoutAccessory.push(`${g.id} ${g.name} [${equipment}]`)

  const art = g.art && artSet.has(g.art) ? g.art : null
  exercises.push({
    id: g.id, name: g.name, primary: g.primary, secondary, equipment, needs, level: LEVEL_MAP[g.difficulty],
    kind, mode, art, steps: g.steps,
  })
  arMap[g.id] = { name: arName, steps: [] }
}

if (DUMP) {
  for (const e of exercises) {
    console.log([e.id, e.name, e.equipment, e.primary, e.mode, e.kind, e.needs.join('+')].join(' | '))
  }
  process.exit(0)
}

const byId = new Map(exercises.map((e) => [e.id, e]))
const poolForMatch = exercises.map((e, i) => ({ ...e, aliases: gmRaw[i].aliases }))

// ── Programs ────────────────────────────────────────────────────────────────────────────────────
/** Arabic names/descriptions + level for the GymMane templates, keyed by template id. */
const PROGRAM_META = {
  fullbody: {
    ar: 'الجسم كامل', level: 'beginner',
    desc: { en: 'Three full-body barbell days a week: squat, bench, row, press and hinge.', ar: 'ثلاثة أيام في الأسبوع لتمارين الجسم كامل بالبار: سكوات وبنش وسحب وكتف وتحميلة أرضية.' },
    days: { 'Full Body': 'الجسم كامل' },
  },
  ppl: {
    ar: 'دفع / سحب / أرجل', level: 'intermediate',
    desc: { en: 'Classic push, pull and legs split with the main compound lifts.', ar: 'تقسيم كلاسيكي دفع وسحب وأرجل مع أهم التمارين المركّبة.' },
    days: { Push: 'دفع', Pull: 'سحب', Legs: 'أرجل' },
  },
  arnold: {
    ar: 'تقسيم أرنولد', level: 'advanced',
    desc: { en: 'Six-day split in the style of Arnold: chest and back, shoulders and arms, legs, twice a week.', ar: 'تقسيم ستة أيام على طريقة أرنولد: صدر وظهر، كتف وذراع، أرجل، مرتين في الأسبوع.' },
    days: { 'Chest & Back': 'صدر وظهر', 'Shoulders & Arms': 'كتف وذراع', Legs: 'أرجل' },
  },
  upperlower: {
    ar: 'علوي / سفلي', level: 'intermediate',
    desc: { en: 'Four days alternating upper-body and lower-body sessions.', ar: 'أربعة أيام تتناوب فيها تمارين الجزء العلوي والجزء السفلي من الجسم.' },
    days: { Upper: 'علوي', Lower: 'سفلي' },
  },
  abcd: {
    ar: 'تقسيم أ ب ج د', level: 'intermediate',
    desc: { en: 'Four-day split: chest and triceps, back and biceps, legs, shoulders and abs.', ar: 'تقسيم أربعة أيام: صدر وترايسبس، ظهر وبايسبس، أرجل، كتف وبطن.' },
    days: {
      'A · Chest & Triceps': 'أ · صدر وترايسبس', 'B · Back & Biceps': 'ب · ظهر وبايسبس',
      'C · Legs': 'ج · أرجل', 'D · Shoulders & Abs': 'د · كتف وبطن',
    },
  },
  abcde: {
    ar: 'تقسيم أ ب ج د هـ', level: 'intermediate',
    desc: { en: 'Five-day bodybuilding split: one muscle group per day.', ar: 'تقسيم خمسة أيام لبناء العضلات: عضلة رئيسية واحدة في كل يوم.' },
    days: {
      'A · Chest': 'أ · صدر', 'B · Back': 'ب · ظهر', 'C · Legs': 'ج · أرجل', 'D · Shoulders': 'د · أكتاف', 'E · Arms': 'هـ · ذراعين',
    },
  },
  stronglifts: {
    ar: 'ستونغ ليفتس 5×5', level: 'beginner',
    desc: { en: 'Two alternating barbell workouts built on five sets of five.', ar: 'تمرينان بالبار يتناوبان، مبنيان على خمس مجموعات من خمس عدّات.' },
    days: { 'Workout A': 'تمرين أ', 'Workout B': 'تمرين ب' },
  },
  startingstrength: {
    ar: 'ستارتنغ سترنغث', level: 'beginner',
    desc: { en: 'Beginner barbell strength program: squat every session, alternating press, bench, deadlift and row.', ar: 'برنامج قوة للمبتدئين بالبار: سكوات في كل حصة مع تبديل الكتف والبنش والرفعة الميتة والسحب.' },
    days: { 'Workout A': 'تمرين أ', 'Workout B': 'تمرين ب' },
  },
  rr: {
    ar: 'الروتين الموصى به', level: 'beginner',
    desc: { en: 'Bodyweight routine three days a week: push, pull, legs and core, progressing step by step.', ar: 'روتين بوزن الجسم ثلاثة أيام في الأسبوع: دفع وسحب وأرجل وجذع، مع تدرّج خطوة بخطوة.' },
    days: { 'Recommended Routine': 'الروتين الموصى به' },
  },
  home: {
    ar: 'بدون معدات', level: 'beginner',
    desc: { en: 'Two simple bodyweight days with a pull-up bar: no weights needed.', ar: 'يومان بسيطان بوزن الجسم مع بار عقلة: بدون أوزان.' },
    days: { 'Home A': 'البيت أ', 'Home B': 'البيت ب' },
  },
}

// GymMane gives no reps; its app defaults to 10 reps / 30 s / 20 min. The two 5x5-style programs
// are named for their rep scheme, so those use 5 instead.
const DEFAULT_REPS = 10, DEFAULT_HOLD_SEC = 30, DEFAULT_CARDIO_SEC = 1200
const REPS_OVERRIDE = { stronglifts: 5, startingstrength: 5 }

function itemFor(ex, sets, repsOverride) {
  const item = { exerciseId: ex.id, sets }
  if (ex.mode === 'time') item.sec = DEFAULT_HOLD_SEC
  else if (ex.mode === 'cardio') item.sec = DEFAULT_CARDIO_SEC
  else item.reps = repsOverride ?? DEFAULT_REPS
  return item
}

function parseGymManePrograms(src) {
  const programs = []
  const chunks = src.split(/\n  ProgramTemplate\(/).slice(1)
  for (const chunk of chunks) {
    const head = chunk.match(/^'((?:\\.|[^'\\])*)',\s*'((?:\\.|[^'\\])*)'/)
    if (!head) fail('cannot parse ProgramTemplate header: ' + chunk.slice(0, 80))
    const days = []
    for (const d of chunk.split(/\n    ProgramDay\(/).slice(1)) {
      const dm = d.match(/^'((?:\\.|[^'\\])*)'/)
      if (!dm) fail('cannot parse ProgramDay: ' + d.slice(0, 80))
      const exs = [...d.matchAll(/\(\s*'((?:\\.|[^'\\])*)',\s*(\d+)\s*\)/g)].map((m) => [unescapeDart(m[1]), Number(m[2])])
      days.push({ name: unescapeDart(dm[1]), exercises: exs })
    }
    programs.push({ id: unescapeDart(head[1]), name: unescapeDart(head[2]), days })
  }
  if (programs.length < 5) fail(`only ${programs.length} GymMane programs parsed`)
  return programs
}

// GymMane's own matcher resolves "Lunge" to the dumbbell lunge, but its No Kit program clearly means a
// bodyweight one, and the catalogue has no plain bodyweight forward lunge. Use the split squat.
// The same goes for three other generic names that the fuzzy matcher resolves to a worse variant
// (Kettlebell Overhead Press, Cable Incline Fly, Single Dumbbell Skullcrusher): pin the intended
// barbell / cable-crossover versions, which are the ones GymMane's own alias table points at.
const NAME_OVERRIDES = {
  Lunge: 'Split Squats',
  'Overhead Press': 'Barbell Standing Wide Military Press',
  'Cable Fly': 'Cable Crossover',
  'Skull Crushers': 'Barbell Lying Triceps Extension',
}
const exactByName = new Map(exercises.map((e) => [e.name.toLowerCase(), e]))

const unresolved = []
const programs = []
for (const gp of parseGymManePrograms(programsSrc)) {
  const meta = PROGRAM_META[gp.id]
  if (!meta) fail(`no Arabic metadata for GymMane program "${gp.id}"`)
  const days = gp.days.map((d) => {
    const dayAr = meta.days[d.name]
    if (!dayAr) fail(`no Arabic name for day "${d.name}" of program ${gp.id}`)
    const items = []
    const seen = new Set()
    for (const [exName, sets] of d.exercises) {
      const ex = NAME_OVERRIDES[exName] ? exactByName.get(NAME_OVERRIDES[exName].toLowerCase()) : matchExercise(exName, poolForMatch)
      if (!ex) { unresolved.push(`${gp.id} / ${d.name}: ${exName}`); continue }
      if (seen.has(ex.id)) continue // the app also skips repeats within a day
      seen.add(ex.id)
      items.push(itemFor(byId.get(ex.id), sets, REPS_OVERRIDE[gp.id]))
    }
    return { name: { en: d.name, ar: dayAr }, items }
  })
  programs.push({ id: gp.id, name: { en: gp.name, ar: meta.ar }, description: meta.desc, level: meta.level, days })
}

/** Programs we author ourselves: exact catalogue names only (checked below). */
const AUTHORED = [
  {
    id: 'home-starter',
    name: { en: 'Home Starter (No Equipment)', ar: 'بداية البيت (بدون معدات)' },
    description: {
      en: 'Three beginner full-body days at home with no equipment at all: push, pull, legs and core.',
      ar: 'ثلاثة أيام للمبتدئين في البيت بدون أي معدات: دفع وسحب وأرجل وبطن.',
    },
    level: 'beginner',
    requireEquipment: ['bodyweight'],
    days: [
      { name: { en: 'Day 1', ar: 'اليوم الأول' }, items: [['Bodyweight Squat', 3], ['Push-up', 3], ['Glute Bridge', 3], ['Superman', 3], ['Plank', 3]] },
      { name: { en: 'Day 2', ar: 'اليوم الثاني' }, items: [['Split Squats', 3], ['Knee Push-up', 3], ['Bird Dog', 3], ['Dead Bug', 3], ['Wall Sit', 2]] },
      { name: { en: 'Day 3', ar: 'اليوم الثالث' }, items: [['Bodyweight Squat', 3], ['Wide Push-up', 3], ['Single-Leg Glute Bridge', 3], ['Superman Hold', 2], ['Side Plank', 2], ['Bicycle Crunch', 3]] },
    ],
  },
  {
    id: 'home-dumbbell',
    name: { en: 'Home Dumbbells', ar: 'دمبل في البيت' },
    description: {
      en: 'Three full-body days at home. Needs a pair of dumbbells (no bench or bar).',
      ar: 'ثلاثة أيام للجسم كامل في البيت. تحتاج زوجاً من الدمبل (بدون بنش ولا بار).',
    },
    level: 'beginner',
    requireEquipment: ['bodyweight', 'dumbbell'],
    days: [
      { name: { en: 'Day 1', ar: 'اليوم الأول' }, items: [['Dumbbell Goblet Squat', 3], ['Dumbbell Standing Overhead Press', 3], ['Dumbbell Bent Over Row', 3], ['Dumbbell Romanian Deadlift', 3], ['Plank', 3]] },
      { name: { en: 'Day 2', ar: 'اليوم الثاني' }, items: [['Reverse Lunge', 3], ['Push-up', 3], ['One-Arm Dumbbell Row', 3], ['Dumbbell Lateral Raise', 3], ['Dumbbell Single Leg Calf Raise', 3], ['Dead Bug', 3]] },
      { name: { en: 'Day 3', ar: 'اليوم الثالث' }, items: [['Dumbbell Squat', 3], ['Push-up', 3], ['Dumbbell Bent Over Row', 3], ['Dumbbell Hammer Curl', 3], ['Dumbbell Standing Triceps Extension', 3], ['Bicycle Crunch', 3]] },
    ],
  },
]

for (const a of AUTHORED) {
  const days = a.days.map((d) => ({
    name: d.name,
    items: d.items.map(([name, sets]) => {
      const ex = exactByName.get(name.toLowerCase())
      if (!ex) { unresolved.push(`${a.id} / ${d.name.en}: ${name} (exact catalogue name)`); return null }
      if (!a.requireEquipment.includes(ex.equipment) || ex.needs.length > 0) {
        fail(`${a.id}: "${name}" is ${ex.equipment}${ex.needs.length ? ' + ' + ex.needs.join('+') : ''}, not allowed here`)
      }
      return itemFor(ex, sets)
    }).filter(Boolean),
  }))
  programs.push({ id: a.id, name: a.name, description: a.description, level: a.level, days })
}
if (unresolved.length) fail(`unresolved program exercises (${unresolved.length}):\n  - ` + unresolved.join('\n  - '))

for (const p of programs) {
  p.place = p.days.every((d) => d.items.every((it) => byId.get(it.exerciseId).equipment === 'bodyweight')) ? 'home' : 'gym'
  p.daysPerWeek = p.days.length
}
// The dumbbell program is home-based even though it is not bodyweight-only.
programs.find((p) => p.id === 'home-dumbbell').place = 'home'

const programsOut = programs.map((p) => ({
  id: p.id, name: p.name, description: p.description, place: p.place, level: p.level,
  daysPerWeek: p.daysPerWeek, days: p.days,
}))

// ── Validation ──────────────────────────────────────────────────────────────────────────────────
const errors = []
const check = (cond, msg) => { if (!cond) errors.push(msg) }
check(new Set(exercises.map((e) => e.id)).size === exercises.length, 'duplicate exercise ids')
for (const e of exercises) {
  const w = `${e.id} (${e.name})`
  check(typeof e.name === 'string' && e.name.length > 0, `${w}: empty name`)
  check(MUSCLES.includes(e.primary), `${w}: primary`)
  check(e.secondary.every((m) => MUSCLES.includes(m) && m !== e.primary), `${w}: secondary`)
  check(EQUIPMENT.includes(e.equipment), `${w}: equipment`)
  check(e.needs.every((n) => ACCESSORIES.includes(n)), `${w}: needs`)
  check(LEVELS.includes(e.level), `${w}: level`)
  check(KINDS.includes(e.kind), `${w}: kind`)
  check(MODES.includes(e.mode), `${w}: mode`)
  check(e.art === null || artSet.has(e.art), `${w}: art slug "${e.art}" does not exist`)
  check(Array.isArray(e.steps) && e.steps.every((s) => typeof s === 'string'), `${w}: steps`)
  check(e.id in arMap, `${w}: missing in ar map`)
}
check(Object.keys(arMap).length === exercises.length, 'ar map size differs from exercises')
check(new Set(programsOut.map((p) => p.id)).size === programsOut.length, 'duplicate program ids')
for (const p of programsOut) {
  check(p.days.length === p.daysPerWeek && p.days.length > 0, `${p.id}: days`)
  check(LEVELS.includes(p.level), `${p.id}: level`)
  check(['home', 'gym'].includes(p.place), `${p.id}: place`)
  check(p.name.ar && p.description.ar && p.name.en && p.description.en, `${p.id}: missing text`)
  for (const d of p.days) {
    check(d.name.ar && d.name.en && d.items.length > 0, `${p.id}: day text/items`)
    for (const it of d.items) {
      const ex = byId.get(it.exerciseId)
      check(!!ex, `${p.id}: unknown exercise ${it.exerciseId}`)
      if (!ex) continue
      check(Number.isInteger(it.sets) && it.sets > 0, `${p.id}: sets`)
      if (ex.mode === 'reps') check(Number.isInteger(it.reps) && it.sec === undefined, `${p.id}/${ex.id}: reps expected`)
      else check(Number.isInteger(it.sec) && it.reps === undefined, `${p.id}/${ex.id}: sec expected`)
    }
  }
}
check(programsOut.filter((p) => p.place === 'home').length >= 3, 'fewer than 3 home programs')
check(programsOut.filter((p) => p.place === 'gym').length >= 3, 'fewer than 3 gym programs')
if (errors.length) fail('validation failed:\n  - ' + errors.join('\n  - '))

// ── Arabic translations ─────────────────────────────────────────────────────────────────────────
// scripts/translations/chunk-*.json hold the reviewed Arabic name and the translated steps per
// exercise id ({ id: { name, steps } }). They win over the openGym name; steps are only taken
// when their count matches the English steps, so a stale translation can never misalign.
const TRANSLATIONS = join(ROOT, 'scripts', 'translations')
let translatedSteps = 0
if (existsSync(TRANSLATIONS)) {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  for (const file of readdirSync(TRANSLATIONS).filter((f) => /^chunk-\d+\.json$/.test(f)).sort()) {
    const chunk = JSON.parse(readFileSync(join(TRANSLATIONS, file), 'utf8'))
    for (const [id, tr] of Object.entries(chunk)) {
      const ex = byId.get(id)
      if (!ex) continue
      if (typeof tr.name === 'string' && tr.name.trim()) arMap[id].name = tr.name.trim()
      if (Array.isArray(tr.steps) && tr.steps.length === ex.steps.length && tr.steps.every((s) => typeof s === 'string' && s.trim())) {
        arMap[id].steps = tr.steps.map((s) => s.trim())
        translatedSteps++
      }
    }
  }
}

// ── Write ───────────────────────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true })
const write = (name, data) => writeFileSync(join(OUT, name), JSON.stringify(data, null, 2) + '\n', { encoding: 'utf8' })
write('exercises.json', exercises)
write('exercises.ar.json', arMap)
write('programs.json', programsOut)

// ── Summary ─────────────────────────────────────────────────────────────────────────────────────
const tally = (rows, f) => {
  const c = {}
  for (const r of rows) c[f(r)] = (c[f(r)] ?? 0) + 1
  return Object.entries(c).map(([k, v]) => `${k}=${v}`).join(', ')
}
const noAr = exercises.filter((e) => !arMap[e.id].name)
const homeFit = exercises.filter((e) => e.equipment === 'bodyweight' && e.needs.length === 0)
console.log('\nNabd catalogue built')
console.log(`exercises:        ${exercises.length}`)
console.log(`equipment:        ${tally(exercises, (e) => e.equipment)}`)
console.log(`level:            ${tally(exercises, (e) => e.level)}`)
console.log(`mode:             ${tally(exercises, (e) => e.mode)}`)
console.log(`kind:             ${tally(exercises, (e) => e.kind)}`)
console.log(`with art:         ${exercises.filter((e) => e.art).length}`)
console.log(`Arabic name:      ${exercises.length - noAr.length} from openGym; ${exercises.filter((e) => arMap[e.id].name).length} after translations`)
console.log(`Arabic steps:     ${translatedSteps} of ${exercises.length}`)
console.log(`needs bench:      ${exercises.filter((e) => e.needs.includes('bench')).length}`)
console.log(`needs pullup-bar: ${exercises.filter((e) => e.needs.includes('pullup-bar')).length}`)
console.log(`bodyweight-only home fit (bodyweight, no accessory): ${homeFit.length}`)
console.log(`  ...of which not in GymMane kNeedsKit: ${homeFit.filter((e) => !kNeedsKit.has(e.id)).length}`)
console.log('programs:')
for (const p of programsOut) console.log(`  ${p.id.padEnd(18)} ${p.place.padEnd(4)} ${p.daysPerWeek} days  ${p.level.padEnd(12)} ${p.name.en} / ${p.name.ar}`)
console.log('\nnotes:')
console.log(`  openGym->GymMane rows with no matching GymMane id: ${danglingOg.length}${danglingOg.length ? ' (' + danglingOg.slice(0, 5).join(', ') + ')' : ''}`)
console.log(`  mapped candidates lacking an Arabic name: ${issues.arCandidatesWithoutName}`)
console.log(`  secondary muscle equal to primary (dropped): ${issues.secondaryHadPrimary.length}`)
console.log(`  accessories added from openGym "needs" data: ${issues.ogNeedsAdded.length}`)
console.log(`  kNeedsKit exercises with no expressible accessory: ${issues.kitWithoutAccessory.length}`)
for (const l of issues.kitWithoutAccessory) console.log('    ' + l)
console.log(`  without Arabic name (first 20): ${noAr.slice(0, 20).map((e) => e.name).join('; ')}`)
