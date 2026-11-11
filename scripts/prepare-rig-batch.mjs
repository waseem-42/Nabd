import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const installation=process.env.NABD_EDIT_TOOL??'D:/AntigravityProjects/Edit-tool'
const {transform}=await import(pathToFileURL(path.join(installation,'node_modules/esbuild/lib/main.js')).href)
const source=await readFile(path.join(root,'src/motion/engine.ts'),'utf8')
const js=await transform(source,{loader:'ts',format:'esm',target:'es2022'})
await mkdir(path.join(root,'.cache/motion'),{recursive:true})
const moduleFile=path.join(root,'.cache/motion/engine.mjs');await writeFile(moduleFile,js.code)
const {RIGS}=await import(pathToFileURL(moduleFile).href)
const ops=[
  {op:'set_settings',patch:{aspect:'1:1',resolution:1080,fps:24,motionBlur:0,theme:{accent:'#ff785c',accent2:'#a6bfb8',panel:'#171b16',text:'#f5f2e9',font:'IBM Plex Sans Arabic',direction:'rtl'}}},
  {op:'add_track',track:{id:'motion',kind:'overlay',name:'الدفعة الأولى · حركة مستمرة'}},
  ...RIGS.map((rig,index)=>({op:'add_clip',clip:{id:`rig-${rig.id}-01`,trackId:'motion',graphic:'graphics/rigs',graphicData:{exercise:rig.exerciseId,lang:'ar'},label:`${String(index+1).padStart(2,'0')} · ${rig.title.ar}`,start:index*6,in:0,out:6}})),
]
await writeFile(path.join(root,'studio/rig-batch-ops.json'),JSON.stringify({project:'nabd-rig-batch-01',ops,note:'الدفعة الأولى: عشرة هياكل مفاصل مستقلة مرتبطة بمعرّفات التمارين الدقيقة، بمصدر رسم واحد للتطبيق وقصّة.'},null,2))
await writeFile(path.join(root,'docs/motion/rig-batch-manifest.json'),JSON.stringify({duration:6,style:'technical',rigs:RIGS},null,2))
console.log('Prepared ten exact exercise mappings and undoable Qassa operations.')
