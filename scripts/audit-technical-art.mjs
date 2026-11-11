import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bounds from 'svg-path-bounds'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const exercises = JSON.parse(await readFile(path.join(root, 'src/data/exercises.json'), 'utf8'))
const symbols = (await readFile(path.join(root, 'src/ui/ActivitySymbol.tsx'), 'utf8'))
const artFiles = await readdir(path.join(root, 'public/art'))
let poses = 0
const errors = []
for (const file of artFiles.filter(name => name.endsWith('.json'))) {
  const art = JSON.parse(await readFile(path.join(root, 'public/art', file), 'utf8'))
  if (art.viewBox.length !== 4 || !art.viewBox.every(Number.isFinite) || art.viewBox[2] <= 0 || art.viewBox[3] <= 0 || !art.frames.length) errors.push(`${file}: invalid dimensions or no poses`)
  for (const frame of art.frames) {
    const box = bounds(frame)
    if (!box.every(Number.isFinite) || box[2] <= box[0] || box[3] <= box[1]) errors.push(`${file}: invalid path bounds`)
    poses++
  }
}
const illustrated = exercises.filter(exercise => exercise.art)
for (const exercise of illustrated) if (!artFiles.includes(`${exercise.art}.json`)) errors.push(`Missing art: ${exercise.id}`)
const symbolic = exercises.filter(exercise => !exercise.art)
const manifest = JSON.parse(await readFile(path.join(root,'docs/motion/rig-batch-manifest.json'),'utf8'))
const continuousIds = manifest.rigs.map(rig=>rig.exerciseId)
for(const id of continuousIds) if(!exercises.some(exercise=>exercise.id===id)) errors.push(`Continuous rig has no catalogue entry: ${id}`)
if(new Set(continuousIds).size!==continuousIds.length) errors.push('Duplicate continuous rig mappings')
for (const exercise of symbolic) {
  const key = exercise.id.includes('-') ? `'${exercise.id}'` : exercise.id
  if (!symbols.includes(`${key}:`)) errors.push(`Missing activity symbol: ${exercise.id}`)
}
const report = { style:'technical', total:exercises.length, illustrated:illustrated.length, continuous:continuousIds.length, poseOnly:illustrated.length-continuousIds.length, continuousExerciseIds:continuousIds, uniqueArtFiles:artFiles.length, sourcePoses:poses, activitySymbols:symbolic.map(({id,name})=>({id,name})), errors }
await writeFile(path.join(root,'docs/motion/technical-coverage.json'),JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
if(errors.length)process.exitCode=1
