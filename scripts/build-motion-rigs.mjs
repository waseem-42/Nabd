import { copyFile, readFile, writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const installation=process.env.NABD_EDIT_TOOL??'D:/AntigravityProjects/Edit-tool'
const {build}=await import(pathToFileURL(path.join(installation,'node_modules/esbuild/lib/main.js')).href)
const out=path.join(root,'public/motion/rigs');await mkdir(out,{recursive:true})
await build({entryPoints:[path.join(root,'src/motion/standalone.ts')],outfile:path.join(out,'rig-batch.js'),bundle:true,format:'esm',platform:'browser',target:'es2022'})
for(const subset of ['arabic','latin'])await copyFile(path.join(root,`node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-${subset}-500-normal.woff2`),path.join(out,`${subset}.woff2`))
if(process.argv.includes('--studio')){
  const project=path.join(root,'studio/edit-data/projects/nabd-rig-batch-01')
  await readFile(path.join(project,'project.json')) // Project creation belongs to MCP.
  const graphic=path.join(project,'graphics/rigs');await mkdir(graphic,{recursive:true})
  for(const name of ['rig-batch.js','arabic.woff2','latin.woff2'])await copyFile(path.join(out,name),path.join(graphic,name))
  const html=await readFile(path.join(out,'index.html'),'utf8')
  await writeFile(path.join(graphic,'index.html'),html.replace('<head>','<head><script src="/api/graphics/runtime.js"></script>'))
  await writeFile(path.join(graphic,'template.json'),JSON.stringify({description:'نبض — عشرة تمارين بهياكل مفاصل مستمرة مستقلة.',duration:6,data:{exercise:'6YUfHPL',lang:'ar'},labels:{exercise:'معرّف التمرين',lang:'اللغة'},scenes:[{name:'البداية',start:0},{name:'الحركة',start:.45},{name:'وقفة',start:2.55},{name:'العودة',start:3.05}]},null,2))
}
console.log('Built shared continuous-rig renderer for Nabd and Qassa.')
