import { projectPoint, RIG_GUIDES, RIG_PHASES, rigFit, sampleRig, viewOf, type RigDefinition, type Vec3 } from './engine'

const NS='http://www.w3.org/2000/svg'
let serial=0

export interface RigRenderOptions {
  /** Camera angle in degrees; defaults to the rig's reviewed view. */
  yaw?: number
  /**
   * Teaching guides: a faint ghost of the end of the range, the path of the key joint, a
   * glow around the working segments and a breathing cue. Off for thumbnails and Qassa.
   */
  guides?: boolean
}

/** One drawing implementation for the app and Qassa. Time is the only animation input. */
export function createRigRenderer(svg:SVGSVGElement,definition:RigDefinition,showTitle=false,options:RigRenderOptions={}){
  const document=svg.ownerDocument
  const yaw=options.yaw??definition.yaw
  const guide=RIG_GUIDES[definition.id]
  const element=(tag:string,attributes:Record<string,string|number>)=>{
    const node=document.createElementNS(NS,tag)
    for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value))
    return node
  }
  const group=()=>element('g',{})
  const panel='var(--panel,var(--color-surface,#171b16))'
  const text='var(--text,var(--color-text,#f5f2e9))'
  const accent='var(--accent,var(--color-accent,#ff785c))'
  const id=`rig-grid-${++serial}`
  svg.replaceChildren();svg.setAttribute('viewBox','0 0 900 900')
  svg.setAttribute('font-family',"var(--font,var(--font-sans,'IBM Plex Sans Arabic',sans-serif))")
  svg.dataset.rig=definition.id;svg.dataset.exercise=definition.exerciseId;svg.dataset.yaw=String(yaw)
  const defs=element('defs',{}),pattern=element('pattern',{id,width:45,height:45,patternUnits:'userSpaceOnUse'})
  pattern.append(element('path',{d:'M45 0H0V45',fill:'none',stroke:text,'stroke-width':1,opacity:.04}));defs.append(pattern)
  svg.append(defs,element('rect',{width:900,height:900,fill:panel}),element('rect',{width:900,height:900,fill:`url(#${id})`}))
  const guidesLayer=group(),equipment=group(),body=group(),hud=group();svg.append(guidesLayer,equipment,body,hud)
  guidesLayer.dataset.layer='guides'
  const fit=rigFit(definition,yaw)
  const project=(point:Vec3):[number,number]=>{const p=projectPoint(point,yaw);return[p[0]*fit.scale+fit.x,p[1]*fit.scale+fit.y]}
  const line=(parent:Element,a:[number,number],b:[number,number],color:string,width:number,opacity=1,extra:Record<string,string|number>={})=>parent.append(element('path',{d:`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',opacity,...extra}))
  const circle=(parent:Element,p:[number,number],r:number,fill:string,stroke:string,width:number,opacity=1)=>parent.append(element('circle',{cx:p[0],cy:p[1],r,fill,stroke,'stroke-width':width,opacity}))
  const label=(x:number,y:number,value:string,size:number,color:string,anchor='middle',opacity=1)=>{const node=element('text',{x,y,'font-size':size,fill:color,'text-anchor':anchor,direction:'ltr',opacity});node.textContent=value;hud.append(node)}

  // Static guides are the same every frame: the end-of-range ghost and the joint's path.
  if(options.guides){
    const end=sampleRig(definition.id,(RIG_PHASES.holdStart+RIG_PHASES.returnStart)/2)
    const at=(name:string)=>{const value=end.points[name];return value?project(value):null}
    for(const bone of end.bones){
      const a=at(bone.a),b=at(bone.b)
      if(a&&b)line(guidesLayer,a,b,text,4,.13,{'stroke-dasharray':'2 12'})
    }
    const head=at('head');if(head)guidesLayer.append(element('circle',{cx:head[0],cy:head[1],r:16*fit.scale,fill:'none',stroke:text,'stroke-width':3,opacity:.13,'stroke-dasharray':'2 10'}))
    const path:[number,number][]=[]
    for(let t=RIG_PHASES.actionStart;t<=RIG_PHASES.holdStart+1e-6;t+=.05){const p=sampleRig(definition.id,t).points[guide.track];if(p)path.push(project(p))}
    if(path.length>1){
      guidesLayer.append(element('path',{d:path.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(''),fill:'none',stroke:accent,'stroke-width':3,'stroke-dasharray':'1 11','stroke-linecap':'round',opacity:.75}))
      circle(guidesLayer,path[0]!,7,'none',accent,2.5,.7)
      circle(guidesLayer,path.at(-1)!,7,accent,'none',0,.7)
    }
  }

  function render(time:number,lang:'ar'|'en'='ar'){
    const pose=sampleRig(definition.id,time)
    equipment.replaceChildren();body.replaceChildren();hud.replaceChildren()
    svg.dataset.time=time.toFixed(3);svg.dataset.phase=String(pose.phase)
    line(equipment,[80,fit.y],[820,fit.y],text,1,.12)
    for(const item of pose.equipment){
      const points=item.points.map(project)
      const d=points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ')
      equipment.append(element('path',{d,fill:'none',stroke:item.accent?accent:text,'stroke-width':item.width??2,opacity:item.accent?.9:.3,'stroke-linecap':'round','stroke-linejoin':'round'}))
    }
    const point=(name:string)=>{const value=pose.points[name];if(!value)throw new Error(`Missing point ${name}`);return project(value)}
    const shoulders=[point('shoulderL'),point('shoulderR')],hips=[point('hipL'),point('hipR')]
    body.append(element('path',{d:`M${shoulders[0]!.join(' ')}L${shoulders[1]!.join(' ')}L${hips[1]!.join(' ')}L${hips[0]!.join(' ')}Z`,fill:text,opacity:.055}))
    if(options.guides){
      // Working segments glow brighter while they're under load (action and hold).
      const effort=pose.phase===1||pose.phase===2?.3:.16
      for(const [a,b] of guide.work)line(body,point(a),point(b),accent,34,effort,{'data-work':'1'})
    }
    for(const layer of ['far','core','near'])for(const bone of pose.bones.filter(b=>b.layer===layer)){
      const a=point(bone.a),b=point(bone.b),far=layer==='far'
      if(!bone.a.startsWith('heel')&&!bone.a.startsWith('toe'))line(body,a,b,text,far?29:40,far?.025:.045)
      line(body,a,b,text,far?4:6.5,far?.35:.95)
    }
    const head=point('head')
    circle(body,head,16*fit.scale,panel,text,5)
    // The facing tick is tied to the view, so direction is clear even without a face.
    if(yaw<60&&!['bridge','bench'].includes(definition.id))line(body,[head[0]+16*fit.scale,head[1]],[head[0]+20*fit.scale,head[1]+3],text,3)
    for(const name of ['hipR','kneeR','ankleR','shoulderR','elbowR','wristR']){
      circle(body,point(name),8,panel,accent,3);circle(body,point(name),2,text,'none',0)
    }
    for(const name of ['hipL','kneeL','ankleL','shoulderL','elbowL','wristL'])circle(body,point(name),4,panel,text,2,.4)
    if(options.guides){const p=pose.points[guide.track];if(p)circle(body,project(p),11,'none',accent,3,.9)}
    if(showTitle)label(450,66,definition.title[lang],30,text)
    if(!options.guides)label(65,105,'NABD / TECHNICAL',15,text,'start')
    label(options.guides?65:835,105,viewOf(yaw)[lang],22,text,options.guides?'start':'end')
    const phase=pose.phase===0?(lang==='ar'?'استعداد':'Ready'):pose.phase===1?definition.action[lang]:pose.phase===2?(lang==='ar'?'وقفة قصيرة':'Brief hold'):definition.returning[lang]
    circle(hud,[450,810],4,accent,'none',0);label(450,860,phase,32,text)
    if(options.guides&&(pose.phase===1||pose.phase===3)){
      const exhale=(pose.phase===1)===guide.exhaleOnAction
      const breath=exhale?(lang==='ar'?'زفير':'Breathe out'):(lang==='ar'?'شهيق':'Breathe in')
      label(65,860,breath,28,exhale?accent:text,'start',.9)
      svg.dataset.breath=exhale?'out':'in'
    }else delete svg.dataset.breath
  }
  return {render}
}
