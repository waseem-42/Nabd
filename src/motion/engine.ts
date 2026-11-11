/** Original educational rigs. World coordinates are illustrative, not clinical measurements. */
export type Vec3 = [number, number, number]
export type RigId = 'squat' | 'pushup' | 'split' | 'bridge' | 'calf' | 'curl' | 'pulldown' | 'row' | 'shoulder' | 'bench'
  | 'backsquat' | 'rdl' | 'lateral' | 'chinup' | 'pushdown'
  | 'benchbar' | 'bentrow' | 'standpress' | 'barcurl' | 'legcurl'
export interface RigDefinition {
  id: RigId
  exerciseId: string
  title: { ar: string; en: string }
  yaw: number
  view: { ar: string; en: string }
  action: { ar: string; en: string }
  returning: { ar: string; en: string }
  sources: string[]
}
export interface RigPose {
  points: Record<string, Vec3>
  bones: { a: string; b: string; layer: 'near' | 'far' | 'core' }[]
  equipment: { points: Vec3[]; accent?: boolean; width?: number }[]
  phase: number
  progress: number
}
export const viewOf = (yaw: number) => yaw>65?{ar:'أمامي',en:'Front'}:yaw>30?{ar:'أمامي مائل',en:'Three-quarter'}:{ar:'جانبي',en:'Side'}
const ace = 'https://www.acefitness.org/resources/everyone/exercise-library/'
const definition = (id: RigId, exerciseId: string, ar: string, en: string, yaw: number, action: [string,string], returning: [string,string], sources: string[]): RigDefinition => ({id,exerciseId,title:{ar,en},yaw,view:viewOf(yaw),action:{ar:action[0],en:action[1]},returning:{ar:returning[0],en:returning[1]},sources:sources.map(path=>ace+path)})
export const RIGS: RigDefinition[] = [
  definition('squat','6YUfHPL','سكوات بوزن الجسم','Bodyweight squat',15,['نزول','Lower'],['صعود','Rise'],['135/bodyweight-squat/']),
  definition('pushup','I4hDWkc','الضغط','Push-up',15,['نزول','Lower'],['دفع','Press'],['41/push-up/']),
  definition('split','9E25EOx','سبليت سكوات','Split squat',18,['نزول','Lower'],['صعود','Rise'],['94/forward-lunge/']),
  definition('bridge','glute-bridge','جسر الأرداف','Glute bridge',15,['رفع الحوض','Lift hips'],['نزول','Lower'],['49/glute-bridge/']),
  definition('calf','bJYHBIN','رفع السمانة','Standing calf raise',18,['رفع الكعب','Raise heels'],['نزول','Lower'],['73/standing-calf-raises-wall/']),
  definition('curl','NbVPDMW','كيرل دمبل','Dumbbell biceps curl',32,['ثني المرفق','Curl'],['فرد المرفق','Extend'],['44/seated-biceps-curl/']),
  definition('pulldown','RVwzP10','السحب العلوي','Cable pulldown',75,['سحب','Pull'],['عودة','Return'],['158/seated-lat-pulldown/']),
  definition('row','fUBheHs','تجديف الكيبل','Cable seated row',22,['سحب','Pull'],['عودة','Return'],['168/seated-row/']),
  definition('shoulder','3d7wHyd','ضغط كتف بالدمبل','Seated dumbbell press',85,['دفع','Press'],['نزول','Lower'],['186/seated-shoulder-press/']),
  definition('bench','SpYC0Kp','بنش بالدمبل','Dumbbell bench press',38,['نزول','Lower'],['دفع','Press'],['19/chest-press/']),
  // Batch two.
  definition('backsquat','qXTaZnJ','سكوات بالبار','Barbell back squat',15,['نزول','Lower'],['صعود','Rise'],['11/back-squat/']),
  definition('rdl','wQ2c4XD','ديدلفت روماني','Romanian deadlift',15,['انحناء من الورك','Hinge'],['وقوف','Stand'],['317/romanian-deadlift/']),
  definition('lateral','DsgkuIt','رفع جانبي','Dumbbell lateral raise',85,['رفع','Raise'],['نزول','Lower'],['26/lateral-raise/']),
  definition('chinup','T2mxWqc','عقلة بقبضة معكوسة','Chin-up',70,['سحب','Pull'],['نزول','Lower'],['190/chin-ups/']),
  definition('pushdown','3ZflifB','بوش داون بالكيبل','Cable pushdown',20,['دفع للأسفل','Press down'],['عودة','Return'],['333/tricep-pressdown/']),
  // Batch three: the most-programmed exercises that still used source poses.
  definition('benchbar','EIeI8Vf','بنش برس بالبار','Barbell bench press',38,['نزول','Lower'],['دفع','Press'],['5/chest-press/']),
  definition('bentrow','eZyBC3j','تجديف منحني بالبار','Barbell bent-over row',15,['سحب','Pull'],['نزول','Lower'],['12/bent-over-row/']),
  definition('standpress','Kyd9Rz5','ضغط عسكري واقفًا بالبار','Standing barbell press',25,['دفع','Press'],['نزول','Lower'],['71/standing-shoulder-press/']),
  definition('barcurl','25GPyDY','كيرل بالبار','Barbell curl',32,['ثني المرفق','Curl'],['فرد المرفق','Extend'],['70/bicep-curl/']),
  definition('legcurl','C5jncD2','ليج كيرل مستلقيًا','Lying leg curl',15,['ثني الركبة','Curl'],['فرد الركبة','Extend'],['153/lying-hamstrings-curl/']),
]
export const RIG_DURATION = 6
/** Phase boundaries of one repetition, seconds (see movementClock). */
export const RIG_PHASES = { actionStart: .45, holdStart: 2.55, returnStart: 3.05, returnEnd: 5.55 } as const

/**
 * Teaching guides per rig: the joint whose path is drawn, the segments around the working
 * muscles, whether the breath out goes with the action phase (the effort) or the return,
 * and a second camera angle that still reads clearly.
 */
export interface RigGuide { track: string; work: [string, string][]; exhaleOnAction: boolean; altYaw: number }
const legs: [string, string][] = [['hipR','kneeR'],['hipL','kneeL']]
const upperArms: [string, string][] = [['shoulderR','elbowR'],['shoulderL','elbowL']]
export const RIG_GUIDES: Record<RigId, RigGuide> = {
  squat: { track: 'hip', work: legs, exhaleOnAction: false, altYaw: 60 },
  pushup: { track: 'shoulder', work: [...upperArms, ['shoulderL','shoulderR']], exhaleOnAction: false, altYaw: 55 },
  split: { track: 'hip', work: legs, exhaleOnAction: false, altYaw: 60 },
  bridge: { track: 'hip', work: [...legs, ['hipL','hipR']], exhaleOnAction: true, altYaw: 55 },
  calf: { track: 'heelR', work: [['kneeR','ankleR'],['kneeL','ankleL']], exhaleOnAction: true, altYaw: 60 },
  curl: { track: 'wristR', work: upperArms, exhaleOnAction: true, altYaw: 80 },
  pulldown: { track: 'wristR', work: [...upperArms, ['hip','shoulder']], exhaleOnAction: true, altYaw: 15 },
  row: { track: 'wristR', work: [...upperArms, ['hip','shoulder']], exhaleOnAction: true, altYaw: 60 },
  shoulder: { track: 'wristR', work: [...upperArms, ['shoulderL','shoulderR']], exhaleOnAction: true, altYaw: 20 },
  bench: { track: 'wristR', work: [...upperArms, ['shoulderL','shoulderR']], exhaleOnAction: false, altYaw: 80 },
  backsquat: { track: 'hip', work: legs, exhaleOnAction: false, altYaw: 60 },
  rdl: { track: 'wristR', work: [...legs, ['hip','shoulder']], exhaleOnAction: false, altYaw: 60 },
  lateral: { track: 'wristR', work: [['shoulderR','elbowR'],['shoulderL','elbowL'],['shoulderL','shoulderR']], exhaleOnAction: true, altYaw: 30 },
  chinup: { track: 'head', work: [...upperArms, ['hip','shoulder']], exhaleOnAction: true, altYaw: 15 },
  pushdown: { track: 'wristR', work: upperArms, exhaleOnAction: true, altYaw: 70 },
  benchbar: { track: 'wristR', work: [...upperArms, ['shoulderL','shoulderR']], exhaleOnAction: false, altYaw: 80 },
  bentrow: { track: 'wristR', work: [...upperArms, ['hip','shoulder']], exhaleOnAction: true, altYaw: 60 },
  standpress: { track: 'wristR', work: [...upperArms, ['shoulderL','shoulderR']], exhaleOnAction: true, altYaw: 80 },
  barcurl: { track: 'wristR', work: upperArms, exhaleOnAction: true, altYaw: 80 },
  legcurl: { track: 'ankleR', work: [['kneeR','ankleR'],['kneeL','ankleL'],['hipR','kneeR'],['hipL','kneeL']], exhaleOnAction: true, altYaw: 60 },
}
export const findRig = (exerciseId?: string) => RIGS.find(rig=>rig.exerciseId===exerciseId)
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0]+b[0],a[1]+b[1],a[2]+b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0]-b[0],a[1]-b[1],a[2]-b[2]]
export const scale = (a: Vec3, k: number): Vec3 => [a[0]*k,a[1]*k,a[2]*k]
export const dot = (a: Vec3,b: Vec3) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
export const length = (a: Vec3) => Math.hypot(...a)
const unit = (a: Vec3): Vec3 => scale(a,1/length(a))
export const mix = (a:number,b:number,p:number) => a+(b-a)*p
const deg = (angle:number) => angle*Math.PI/180
const vertical = (angle:number):Vec3 => [Math.sin(angle),Math.cos(angle),0]
const horizontal = (angle:number):Vec3 => [Math.cos(angle),Math.sin(angle),0]

/** Two-bone IK: bend plane is explicit and segment lengths are preserved exactly. */
export function solveLimb(start:Vec3,end:Vec3,upper:number,lower:number,bend:Vec3):Vec3 {
  const delta=sub(end,start), distance=length(delta)
  if(distance<.001||distance>upper+lower+1e-6||distance<Math.abs(upper-lower)-1e-6)throw new Error(`Unreachable limb: ${distance.toFixed(3)} / ${upper}+${lower}`)
  const axis=unit(delta)
  let perpendicular=sub(bend,scale(axis,dot(bend,axis)))
  if(length(perpendicular)<.001)perpendicular=sub([0,0,1],scale(axis,axis[2]))
  perpendicular=unit(perpendicular)
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance)
  const height=Math.sqrt(Math.max(0,upper*upper-along*along))
  return add(start,add(scale(axis,along),scale(perpendicular,height)))
}

export function movementClock(time:number) {
  const t=((time%RIG_DURATION)+RIG_DURATION)%RIG_DURATION
  const smooth=(value:number)=>{const s=Math.max(0,Math.min(1,value));return s*s*s*(s*(s*6-15)+10)}
  const phase=t<.45||t>=5.55?0:t<2.55?1:t<3.05?2:3
  const progress=t<.45?0:t<2.55?smooth((t-.45)/2.1):t<3.05?1:t<5.55?1-smooth((t-3.05)/2.5):0
  return {phase,progress}
}

export function sampleRig(id:RigId,time:number):RigPose {
  const clock=movementClock(time), p=clock.progress
  const result:RigPose={points:{},bones:[],equipment:[],...clock}
  const set=(name:string,point:Vec3)=>{result.points[name]=point;return point}
  const get=(name:string):Vec3=>{const point=result.points[name];if(!point)throw new Error(`Missing joint ${name}`);return point}
  const bone=(a:string,b:string,layer:'near'|'far'|'core'='core')=>result.bones.push({a,b,layer})
  const equipment=(points:Vec3[],accent=false,width=2)=>result.equipment.push({points,accent,width})
  function body(hip:Vec3,axis:Vec3,headAxis=axis) {
    set('hip',hip);set('shoulder',add(hip,scale(axis,118)))
    set('neck',add(get('shoulder'),scale(headAxis,25)));set('head',add(get('neck'),scale(headAxis,25)))
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;set('hip'+side,add(hip,[0,0,sign*26]));set('shoulder'+side,add(get('shoulder'),[0,0,sign*42.5]))}
    bone('hip','shoulder');bone('shoulder','neck');bone('neck','head');bone('hipL','hipR');bone('shoulderL','shoulderR')
  }
  function leg(side:'L'|'R',ankle:Vec3,bend:Vec3=[1,0,0],toe?:Vec3,heel?:Vec3){
    set('ankle'+side,ankle);set('knee'+side,solveLimb(get('hip'+side),ankle,100,100,bend))
    set('heel'+side,heel??add(ankle,[-25,-20,0]));set('toe'+side,toe??add(ankle,[35,-20,0]))
    const layer=side==='L'?'far':'near'
    bone('hip'+side,'knee'+side,layer);bone('knee'+side,'ankle'+side,layer);bone('ankle'+side,'heel'+side,layer);bone('heel'+side,'toe'+side,layer);bone('toe'+side,'ankle'+side,layer)
  }
  function arm(side:'L'|'R',wrist:Vec3,bend:Vec3,elbow?:Vec3){
    set('wrist'+side,wrist);set('elbow'+side,elbow??solveLimb(get('shoulder'+side),wrist,70,65,bend))
    const layer=side==='L'?'far':'near';bone('shoulder'+side,'elbow'+side,layer);bone('elbow'+side,'wrist'+side,layer)
  }
  function dumbbell(wrist:Vec3){
    equipment([add(wrist,[0,0,-20]),add(wrist,[0,0,20])],true,3)
    for(const z of [-15,15])equipment([add(wrist,[-8,-10,z]),add(wrist,[8,-10,z]),add(wrist,[8,10,z]),add(wrist,[-8,10,z]),add(wrist,[-8,-10,z])],true,2)
  }
  function dumbbellAlongX(wrist:Vec3){
    equipment([add(wrist,[-20,0,0]),add(wrist,[20,0,0])],true,3)
    for(const x of [-15,15])equipment([add(wrist,[x,-10,-8]),add(wrist,[x,10,-8]),add(wrist,[x,10,8]),add(wrist,[x,-10,8]),add(wrist,[x,-10,-8])],true,2)
  }
  function barbell(center:Vec3){
    equipment([add(center,[0,0,-125]),add(center,[0,0,125])],true,4)
    for(const z of [-100,100])equipment([add(center,[0,-26,z]),add(center,[0,26,z])],true,9)
  }
  function bench(back=false){
    for(const z of [-43,43]){equipment([[-42,115,z],[50,115,z]],false,5);equipment([[-30,115,z],[-30,0,z]]);equipment([[40,115,z],[40,0,z]])}
    if(back)for(const z of [-43,43])equipment([[-32,115,z],[-32,290,z]],false,4)
  }
  if(id==='squat'){
    body([mix(-6,-80,p),mix(219,130,p),0],vertical(mix(.05,.5,p)))
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26]);arm(side,add(get('shoulder'+side),[mix(17,123,p),mix(-130,-5,p),0]),[0,-1,0])}
  }else if(id==='pushup'){
    const axis=horizontal(deg(mix(20.9,4,p))),ankle:Vec3=[-160,20,0]
    body(add(ankle,scale(axis,200)),axis)
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[-160,20,sign*26],[0,1,0],[-125,0,sign*26],[-185,40,sign*26]);arm(side,[140,0,sign*42.5],[-1,0,0]);equipment([[127,0,sign*42.5],[156,0,sign*42.5]],false,4)}
  }else if(id==='split'){
    body([-10,mix(180,115,p),0],vertical(.06))
    leg('R',[95,20,26],[1,0,0]);leg('L',[-125,35,-26],[1,-1,0],[-90,0,-26],[-146,17,-26])
    for(const side of ['L','R'] as const)arm(side,add(get('shoulder'+side),[15,-130,0]),[-1,0,0])
  }else if(id==='bridge'){
    const shoulder:Vec3=[-130,22,0], ankle:Vec3=[125,20,0]
    const kneeAtTop=solveLimb(shoulder,ankle,218,100,[0,1,0])
    const topAngle=Math.atan2(kneeAtTop[1]-shoulder[1],kneeAtTop[0]-shoulder[0])
    const axis=horizontal(mix(.03,topAngle,p)),hip=add(shoulder,scale(axis,118))
    body(hip,scale(axis,-1),[-1,0,0])
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[125,20,sign*26],[0,1,0]);arm(side,add(get('shoulder'+side),[130,-8,0]),[0,0,sign])}
  }else if(id==='calf'){
    const angle=.4*p
    const ankle:Vec3=[35-35*Math.cos(angle)+20*Math.sin(angle),35*Math.sin(angle)+20*Math.cos(angle),0]
    body(add(ankle,[0,199.6,0]),vertical(0))
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,add(ankle,[0,0,sign*26]),[1,0,0],[35,0,sign*26],[35-60*Math.cos(angle),60*Math.sin(angle),sign*26]);arm(side,[110,280,sign*42.5],[0,-1,0])}
    equipment([[110,0,-65],[110,370,-65]]);equipment([[110,370,-65],[110,370,65],[110,0,65]])
  }else if(id==='curl'){
    body([0,219.6,0],vertical(0))
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26]);const elbow=add(get('shoulder'+side),[0,-70,0]);const angle=deg(mix(15,140,p));const wrist=add(elbow,[65*Math.sin(angle),-65*Math.cos(angle),0]);arm(side,wrist,[1,0,0],elbow);dumbbell(wrist)}
  }else if(id==='pulldown'||id==='shoulder'){
    body([0,125,0],vertical(id==='pulldown'?-.08:0));bench(id==='shoulder')
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[99,20,sign*26],[1,1,0])
      const wrist:Vec3=id==='pulldown'?[30,mix(365,251,p),sign*75]:[15,mix(248,370,p),sign*mix(105,55,p)]
      arm(side,wrist,[0,-1,sign*.5]);if(id==='shoulder')dumbbell(wrist)
    }
    if(id==='pulldown'){
      const barY=mix(365,251,p)
      equipment([[30,barY,-95],[30,barY,95]],true,4);equipment([[30,barY,0],[30,410,0]],true,1.5)
      equipment([[-75,0,-95],[-75,410,-95],[30,410,-95],[30,410,0]])
      equipment([[-75,0,95],[-75,410,95],[30,410,95]])
      equipment([[70,145,-50],[70,145,50]],false,6)
    }
  }else if(id==='row'){
    body([0,125,0],vertical(0));bench()
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[165,20,sign*26],[0,1,0]);arm(side,[mix(125,30,p),mix(230,215,p),sign*42.5],[-1,0,0])}
    const handle:Vec3=[mix(125,30,p),mix(230,215,p),0]
    equipment([[230,60,0],handle],true,1.5);equipment([add(handle,[0,0,-50]),add(handle,[0,0,50])],true,3)
    equipment([[178,0,-60],[178,70,-60],[178,70,60],[178,0,60]])
  }else if(id==='bench'){
    body([0,110,0],[-1,0,0])
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[120,20,sign*26],[1,1,0]);const wrist:Vec3=[-118,mix(240,180,p),sign*mix(44.5,100,p)];arm(side,wrist,[0,-1,sign]);dumbbell(wrist)}
    for(const z of [-48,48]){equipment([[-205,88,z],[25,88,z]],false,6);equipment([[-170,88,z],[-170,0,z]]);equipment([[5,88,z],[5,0,z]])}
  }else if(id==='backsquat'){
    // Same lower-body path as the bodyweight squat; the bar rides on the upper back.
    const lean=mix(.05,.5,p),axis=vertical(lean),back:Vec3=[-Math.cos(lean),Math.sin(lean),0]
    body([mix(-6,-80,p),mix(219,130,p),0],axis)
    const bar=add(add(get('shoulder'),scale(axis,4)),scale(back,13))
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26]);arm(side,add(bar,[0,0,sign*62]),[0,-1,0])}
    barbell(bar)
  }else if(id==='rdl'){
    // Hinge: hips travel back, knees stay softly bent, the bar slides close to the legs.
    const axis=vertical(mix(.02,1.15,p))
    body([mix(0,-70,p),mix(215,195,p),0],axis)
    const shoulder=get('shoulder'),bar:Vec3=[shoulder[0]*.5,shoulder[1]-130,0]
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26]);arm(side,add(bar,[0,0,sign*48]),[-1,0,0])}
    barbell(bar)
  }else if(id==='lateral'){
    body([0,219.6,0],vertical(0))
    const angle=deg(mix(8,82,p))
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26])
      const wrist=add(get('shoulder'+side),[4,-130*Math.cos(angle),sign*130*Math.sin(angle)])
      arm(side,wrist,[-1,0,0]);dumbbellAlongX(wrist)
    }
  }else if(id==='chinup'){
    // Hands stay on the bar; the body rises until the chin clears it.
    const barY=470
    body([mix(0,6,p),mix(220,312,p),0],vertical(mix(0,-.12,p)))
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1
      leg(side,add(get('hip'+side),[-18,-195,0]),[1,0,0])
      arm(side,[12,barY,sign*40],[1,0,sign*.4])
    }
    equipment([[12,barY,-115],[12,barY,115]],true,5)
    for(const z of [-115,115])equipment([[12,barY,z],[12,0,z]])
  }else if(id==='pushdown'){
    // Upper arms stay by the sides; only the elbows open.
    const axis=vertical(.12)
    body([-4,215,0],axis)
    const angle=deg(mix(100,8,p))
    let handle:Vec3=[0,0,0]
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26])
      const dz=-sign*7.5,dx=8,elbow=add(get('shoulder'+side),[dx,-Math.sqrt(70*70-dx*dx-dz*dz),dz])
      const wrist=add(elbow,[65*Math.sin(angle),-65*Math.cos(angle),0])
      arm(side,wrist,[-1,0,0],elbow);handle=[wrist[0],wrist[1],0]
    }
    const pulley:Vec3=[95,430,0]
    equipment([pulley,handle],true,1.5);equipment([add(handle,[0,0,-48]),add(handle,[0,0,48])],true,4)
    equipment([[125,0,-30],[125,445,-30],[95,445,-30],[95,430,0]]);equipment([[125,0,30],[125,445,30],[95,445,30]])
  }else if(id==='benchbar'){
    // Flat bench, grip a little wider than the shoulders; the bar lowers to the lower chest.
    body([0,110,0],[-1,0,0])
    const bar:Vec3=[mix(-118,-100,p),mix(240,150,p),0]
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[120,20,sign*26],[1,1,0]);arm(side,add(bar,[0,0,sign*62]),[0,-1,sign])}
    barbell(bar)
    for(const z of [-48,48]){equipment([[-205,88,z],[25,88,z]],false,6);equipment([[-170,88,z],[-170,0,z]]);equipment([[5,88,z],[5,0,z]])}
  }else if(id==='bentrow'){
    // The hinge holds still (flat back, soft knees); only the arms pull the bar to the lower torso.
    const lean=.85,axis=vertical(lean)
    body([-45,200,0],axis)
    const shoulder=get('shoulder'),front:Vec3=[Math.cos(lean),-Math.sin(lean),0]
    const hang:Vec3=[shoulder[0]+5,shoulder[1]-130,0],chest=add(add(get('hip'),scale(axis,50)),scale(front,28))
    const bar:Vec3=[mix(hang[0],chest[0],p),mix(hang[1],chest[1],p),0]
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26],[1,0,0]);arm(side,add(bar,[0,0,sign*48]),[-.6,1,sign*.2])}
    barbell(bar)
  }else if(id==='standpress'){
    // From the front of the shoulders to overhead; the bar curves forward around the face.
    body([0,219.6,0],vertical(0))
    const shoulder=get('shoulder'),bar:Vec3=[mix(18,2,p)+14*Math.sin(Math.PI*p),mix(shoulder[1]+7,shoulder[1]+125,p),0]
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26]);arm(side,add(bar,[0,0,sign*70]),[.4,-1,sign*.6])}
    barbell(bar)
  }else if(id==='barcurl'){
    // Same elbow path as the dumbbell curl, with both hands on one bar.
    body([0,219.6,0],vertical(0))
    const angle=deg(mix(15,140,p));let bar:Vec3=[0,0,0]
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1;leg(side,[0,20,sign*26]);const elbow=add(get('shoulder'+side),[0,-70,0]);const wrist=add(elbow,[65*Math.sin(angle),-65*Math.cos(angle),0]);arm(side,wrist,[1,0,0],elbow);bar=[wrist[0],wrist[1],0]}
    barbell(bar)
  }else if(id==='legcurl'){
    // Face down on the machine, knees just off the pad edge; the shins rotate about the knee.
    body([0,110,0],[-1,0,0],[-1,-.15,0])
    const angle=deg(mix(8,100,p)),d:Vec3=[Math.cos(angle),Math.sin(angle),0],n:Vec3=[Math.sin(angle),-Math.cos(angle),0]
    for(const side of ['L','R'] as const){const sign=side==='L'?-1:1
      const ankle=add([100,110,sign*26],scale(d,100))
      leg(side,ankle,[0,-1,0],add(add(ankle,scale(d,6)),scale(n,32)),add(add(ankle,scale(d,16)),scale(n,-12)))
      arm(side,[-200,95,sign*50],[0,-1,0])
    }
    const pad=add(add([100,110,0],scale(d,88)),scale(n,-16))
    equipment([[100,95,0],pad],true,3);equipment([add(pad,[0,0,-45]),add(pad,[0,0,45])],true,9)
    for(const z of [-40,40]){equipment([[-235,88,z],[95,88,z]],false,6);equipment([[-200,88,z],[-200,0,z]]);equipment([[60,88,z],[60,0,z]])}
  }
  return result
}

export function projectPoint(point:Vec3,yaw:number):[number,number] {
  const angle=deg(yaw)
  return [point[0]*Math.cos(angle)+point[2]*Math.sin(angle),-point[1]]
}

const fits=new Map<string,{scale:number;x:number;y:number}>()
export function rigFit(definition:RigDefinition,yaw=definition.yaw){
  const key=`${definition.id}:${yaw}`
  const cached=fits.get(key);if(cached)return cached
  const points:[number,number][]=[]
  for(let i=0;i<=60;i++){
    const pose=sampleRig(definition.id,i/10)
    for(const point of [...Object.values(pose.points),...pose.equipment.flatMap(item=>item.points)])points.push(projectPoint(point,yaw))
  }
  const minX=Math.min(...points.map(p=>p[0]))-20,maxX=Math.max(...points.map(p=>p[0]))+20
  const minY=Math.min(...points.map(p=>p[1]))-25,maxY=Math.max(...points.map(p=>p[1]))+20
  const scale=Math.min(760/(maxX-minX),620/(maxY-minY))
  const fit={scale,x:450-(minX+maxX)*scale/2,y:445-(minY+maxY)*scale/2};fits.set(key,fit);return fit
}
