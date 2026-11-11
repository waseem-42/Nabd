import { copyFile, readFile, writeFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const project = path.join(root, 'studio/edit-data/projects/nabd-motion-styles-v1')
await access(path.join(project, 'project.json')) // Create through MCP, never by writing project.json.
const variant = process.argv.includes('--v2') ? 'squat-v2' : 'squat'
const graphic = path.join(project, 'graphics', variant)
await mkdir(graphic, { recursive: true })
const source = path.join(root, 'public/motion/squat')
for (const [subset, name] of [['arabic', 'arabic.woff2'], ['latin', 'latin.woff2']]) {
  await copyFile(path.join(root, `node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-${subset}-500-normal.woff2`), path.join(source, name))
}
for (const name of ['style.css', 'motion.js', 'arabic.woff2', 'latin.woff2']) await copyFile(path.join(source, name), path.join(graphic, name))
const html = await readFile(path.join(source, 'index.html'), 'utf8')
await writeFile(path.join(graphic, 'index.html'), html.replace('<head>', '<head><script src="/api/graphics/runtime.js"></script>'))
await writeFile(path.join(graphic, 'template.json'), JSON.stringify({
  description: variant === 'squat-v2' ? 'نبض — أربعة اتجاهات إضافية لحركة السكوات قبل الاعتماد.' : 'نبض — دراسة حركة السكوات للمقارنة قبل الاعتماد.',
  duration: 6, data: { style: 'sculpted', lang: 'ar' }, labels: { style: 'الستايل', lang: 'اللغة' },
  scenes: [{name:'استعداد',start:0},{name:'نزول',start:.6},{name:'وقفة',start:2.5},{name:'صعود',start:3.1}],
}, null, 2))
console.log(`Synced shared motion composition: ${graphic}`)
