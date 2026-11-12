import { projectPoint, RIG_GUIDES, RIG_PHASES, rigFit, sampleRig, viewOf, type RigDefinition, type RigPose, type Vec3 } from './engine'

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
  /**
   * 'segments' (default): the approved coloured-parts athlete from motion study 06.
   * 'technical': the earlier line drawing, kept for comparison and Qassa reviews.
   */
  style?: 'segments' | 'technical'
  /** Soft coral halo on the working segments while they're under load (player only). */
  highlight?: boolean
}

/** Palette of motion study 06 (coloured parts); coral comes from the theme. */
export const SEGMENT_COLORS = {
  limb: '#a6bfb8', limbFar: '#6a8d83', limbFarFront: '#8aa59d',
  shirt: '#f5f2e9', shirtShade: '#d9dccf', shortsFar: '#9c5546',
  dark: '#56695d', hair: '#3e4c43', frame: '#3a443c', implement: '#c9cfc3',
} as const

/** One drawing implementation for the app and Qassa. Time is the only animation input. */
export function createRigRenderer(svg:SVGSVGElement,definition:RigDefinition,showTitle=false,options:RigRenderOptions={}){
  const document=svg.ownerDocument
  const yaw=options.yaw??definition.yaw
  const style=options.style??'segments'
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
  if(style==='segments'){
    // A quiet spotlight instead of the drafting grid.
    const glow=element('radialGradient',{id,cx:'50%',cy:'46%',r:'60%'})
    glow.append(element('stop',{offset:'0%','stop-color':text,'stop-opacity':.07}),element('stop',{offset:'100%','stop-color':text,'stop-opacity':0}))
    defs.replaceChildren(glow)
  }
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

  /** Coloured-parts athlete: tapered limbs, far side in shade, shirt, shorts and coral joints. */
  function drawSegments(pose:RigPose){
    const C=SEGMENT_COLORS,s=fit.scale
    const P=(name:string)=>{const value=pose.points[name];if(!value)throw new Error(`Missing point ${name}`);return project(value)}
    const far=yaw>=60?C.limbFarFront:C.limbFar
    const heel=P('heelR'),toe=P('toeR'),facing=Math.sign(toe[0]-heel[0])||1
    const capsule=(parent:Element,a:[number,number],b:[number,number],w1:number,w2:number,fill:string,extra:Record<string,string|number>={})=>{
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length
      const g=element('g',extra);parent.append(g)
      g.append(element('path',{d:`M${a[0]+nx*w1} ${a[1]+ny*w1}L${b[0]+nx*w2} ${b[1]+ny*w2}L${b[0]-nx*w2} ${b[1]-ny*w2}L${a[0]-nx*w1} ${a[1]-ny*w1}Z`,fill}))
      g.append(element('circle',{cx:a[0],cy:a[1],r:w1,fill}),element('circle',{cx:b[0],cy:b[1],r:w2,fill}))
    }
    // A closed path with a thick round-joined stroke is a rounded hull (a capsule when flat).
    const hull=(parent:Element,points:[number,number][],radius:number,fill:string,extra:Record<string,string|number>={})=>parent.append(element('path',{d:'M'+points.map(p=>`${p[0]} ${p[1]}`).join('L')+'Z',fill,stroke:fill,'stroke-width':radius*2,'stroke-linejoin':'round',...extra}))
    const lerp=(a:[number,number],b:[number,number],k:number):[number,number]=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]
    // Floor shadow spans the whole figure, so lying and hinged positions stay grounded.
    const xs=Object.values(pose.points).map(p=>project(p)[0]),minX=Math.min(...xs),maxX=Math.max(...xs)
    body.append(element('ellipse',{cx:(minX+maxX)/2,cy:fit.y+5*s,rx:(maxX-minX)/2+22*s,ry:8*s,fill:'#000',opacity:.28}))
    // Working muscles: a halo behind the body all through the rep, brighter under load.
    const load=pose.phase===1||pose.phase===2
    if(options.highlight){
      for(const [a,b] of guide.work)body.append(element('path',{d:`M${P(a).join(' ')}L${P(b).join(' ')}`,stroke:accent,'stroke-width':62*s,'stroke-linecap':'round',fill:'none',opacity:load?.32:.16,'data-work':'1'}))
    }
    // Implements held in the far hand go behind the body; everything else in front.
    const wristL=pose.points.wristL,wristR=pose.points.wristR
    const near=(points:Vec3[],to?:Vec3)=>{if(!to)return Infinity;const c=points.reduce((m,p)=>[m[0]+p[0]/points.length,m[1]+p[1]/points.length,m[2]+p[2]/points.length] as Vec3,[0,0,0] as Vec3);return Math.hypot(c[0]-to[0],c[1]-to[1],c[2]-to[2])}
    const back:typeof pose.equipment=[],front:typeof pose.equipment=[]
    for(const item of pose.equipment){
      if(!item.accent)back.push(item)
      else if(near(item.points,wristL)<45&&near(item.points,wristL)<near(item.points,wristR))back.push(item)
      else front.push(item)
    }
    const drawItems=(items:typeof pose.equipment)=>{for(const item of items){
      const d=item.points.map(project).map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join('')
      const w=(item.width??2)
      body.append(element('path',{d,fill:'none',stroke:item.accent?C.implement:C.frame,'stroke-width':item.accent?Math.max(3,w*2.2):Math.max(4,w*3.2),'stroke-linecap':'round','stroke-linejoin':'round','data-equipment':item.accent?'implement':'frame'}))
    }}
    const shoe=(side:'L'|'R',color:string)=>{hull(body,[P('ankle'+side),P('heel'+side),P('toe'+side)],6.5*s,color);body.append(element('path',{d:`M${P('heel'+side).join(' ')}L${P('toe'+side).join(' ')}`,stroke:C.shirtShade,'stroke-width':2.5*s,'stroke-linecap':'round',opacity:side==='R'?.8:.35,transform:`translate(0 ${6*s})`}))}
    const leg=(side:'L'|'R',limb:string,shorts:string)=>{
      const hip=P('hip'+side),knee=P('knee'+side),ankle=P('ankle'+side)
      capsule(body,knee,ankle,12*s,8.5*s,limb);capsule(body,hip,knee,17*s,12.5*s,limb)
      capsule(body,hip,lerp(hip,knee,.52),19*s,15.5*s,shorts,{'data-part':'shorts'})
      shoe(side,C.dark)
    }
    const arm=(side:'L'|'R',limb:string,sleeve:string)=>{
      const shoulder=P('shoulder'+side),elbow=P('elbow'+side),wrist=P('wrist'+side)
      capsule(body,shoulder,elbow,10.5*s,8.5*s,limb);capsule(body,elbow,wrist,8.5*s,6.5*s,limb)
      capsule(body,shoulder,lerp(shoulder,elbow,.36),12.5*s,11*s,sleeve,{'data-part':'sleeve'})
      body.append(element('circle',{cx:wrist[0],cy:wrist[1],r:8.5*s,fill:limb}))
    }
    drawItems(back)
    leg('L',far,C.shortsFar);arm('L',far,C.shirtShade)
    capsule(body,P('shoulder'),P('neck'),7.5*s,7*s,C.limb)
    hull(body,[P('shoulderL'),P('shoulderR'),P('hipR'),P('hipL')],(yaw>=60?11:17)*s,C.shirt,{'data-part':'torso'})
    hull(body,[P('hipL'),P('hipR')],18.5*s,accent,{'data-part':'shorts'})
    leg('R',C.limb,accent)
    // Head: hair sits behind the face, toward the back of the head; nose and eye show direction.
    const head=P('head'),neck=P('neck'),r=17*s,side=yaw<60?1:0
    const ul=Math.hypot(head[0]-neck[0],head[1]-neck[1])||1,u:[number,number]=[(head[0]-neck[0])/ul,(head[1]-neck[1])/ul]
    body.append(element('circle',{cx:head[0]-facing*side*.26*r+u[0]*.2*r,cy:head[1]+u[1]*.2*r,r:.95*r,fill:C.hair}))
    body.append(element('circle',{cx:head[0]+facing*side*.06*r,cy:head[1],r:.9*r,fill:C.limb}))
    if(side){
      body.append(element('circle',{cx:head[0]+facing*.86*r-u[0]*.1*r,cy:head[1]-u[1]*.1*r,r:.2*r,fill:C.limb}))
      body.append(element('circle',{cx:head[0]+facing*.5*r+u[0]*.12*r,cy:head[1]+u[1]*.12*r,r:.09*r,fill:C.hair}))
      body.append(element('circle',{cx:head[0]-facing*.12*r,cy:head[1],r:.2*r,fill:'none',stroke:C.limbFar,'stroke-width':1.5*s}))
    }
    arm('R',C.limb,C.shirt)
    // ...and the muscle itself painted coral on top of the limb, so it reads as "this one works".
    if(options.highlight){
      for(const [a,b] of guide.work){
        const pa=P(a),pb=P(b)
        body.append(element('path',{d:`M${lerp(pa,pb,.18).join(' ')}L${lerp(pa,pb,.82).join(' ')}`,stroke:accent,'stroke-width':15*s,'stroke-linecap':'round',fill:'none',opacity:load?.9:.5,'data-muscle':'1'}))
      }
    }
    drawItems(front)
    // Coral joint rings belong to the full-size player; thumbnails stay clean.
    if(options.highlight||showTitle)for(const name of ['hipR','kneeR','shoulderR','elbowR']){
      const p=P(name),ring=Math.max(6,7*s)
      body.append(element('circle',{cx:p[0],cy:p[1],r:ring,fill:panel,stroke:accent,'stroke-width':Math.max(2.5,2.6*s),'data-joint':name}))
      body.append(element('circle',{cx:p[0],cy:p[1],r:ring*.3,fill:text}))
    }
  }

  function render(time:number,lang:'ar'|'en'='ar'){
    const pose=sampleRig(definition.id,time)
    equipment.replaceChildren();body.replaceChildren();hud.replaceChildren()
    svg.dataset.time=time.toFixed(3);svg.dataset.phase=String(pose.phase)
    if(style==='segments'){
      drawSegments(pose)
      if(showTitle)label(450,66,definition.title[lang],30,text)
      const phase=pose.phase===0?(lang==='ar'?'استعداد':'Ready'):pose.phase===1?definition.action[lang]:pose.phase===2?(lang==='ar'?'وقفة قصيرة':'Brief hold'):definition.returning[lang]
      // The player shows the phase in its tempo bar; only standalone renders label it here.
      if(showTitle){circle(hud,[450,818],4,accent,'none',0);label(450,866,phase,32,text)}
      if(pose.phase===1||pose.phase===3){const exhale=(pose.phase===1)===guide.exhaleOnAction;svg.dataset.breath=exhale?'out':'in'}else delete svg.dataset.breath
      return
    }
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
