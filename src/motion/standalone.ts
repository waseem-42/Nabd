import { findRig, RIGS, type RigDefinition } from './engine'
import { createRigRenderer } from './svgRenderer'

declare global {interface Window {GRAPHIC?:{data?:{exercise?:string;lang?:'ar'|'en'}};renderFrame?:(time:number,graphic?:{data?:{exercise?:string;lang?:'ar'|'en'}})=>void}}
const svg=document.querySelector<SVGSVGElement>('#rig-stage')!
const query=new URLSearchParams(location.search)
let current:RigDefinition|undefined
let renderer:ReturnType<typeof createRigRenderer>
window.renderFrame=(time,graphic)=>{
  const exercise=graphic?.data?.exercise??query.get('exercise')??RIGS[0]!.exerciseId
  const definition=findRig(exercise)
  if(!definition)throw new Error(`No continuous rig for exercise ${exercise}`)
  if(current?.id!==definition.id){current=definition;renderer=createRigRenderer(svg,definition,true)}
  renderer.render(time,graphic?.data?.lang??(query.get('lang')==='en'?'en':'ar'))
}
window.renderFrame(0,window.GRAPHIC)
