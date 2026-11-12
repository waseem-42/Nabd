import { describe, expect, it } from 'vitest'
import { EXERCISE_BY_ID } from '@/data/catalog'
import { RIGS, WARMUP_RIGS, findRig, length, movementClock, rigFit, sampleRig, sub } from './engine'

describe('continuous exercise rigs',()=>{
  it('maps thirty-two exact catalogue ids without inheriting a rig through shared art slugs',()=>{
    expect(RIGS).toHaveLength(32)
    expect(new Set(RIGS.map(rig=>rig.exerciseId)).size).toBe(32)
    for(const rig of RIGS)expect(EXERCISE_BY_ID.has(rig.exerciseId)).toBe(true)
    expect(findRig('qx4fgX7')).toBeUndefined() // Elevated dumbbell split squat shares an art slug.
    expect(findRig('9E25EOx')?.id).toBe('split')
    for(const rig of WARMUP_RIGS)expect(findRig(rig.exerciseId)?.id).toBe(rig.id)
  })
  it.each([...RIGS, ...WARMUP_RIGS])('$id preserves every bone length throughout its complete repetition',(definition)=>{
    const initial=sampleRig(definition.id,0)
    const expected=initial.bones.map(bone=>length(sub(initial.points[bone.a]!,initial.points[bone.b]!)))
    for(let frame=0;frame<=180;frame++){
      const pose=sampleRig(definition.id,frame/30)
      for(const point of Object.values(pose.points))expect(point.every(Number.isFinite),definition.id).toBe(true)
      pose.bones.forEach((bone,index)=>expect(length(sub(pose.points[bone.a]!,pose.points[bone.b]!)),`${definition.id}:${bone.a}–${bone.b}@${frame}`).toBeCloseTo(expected[index]!,5))
    }
    expect(sampleRig(definition.id,6).points).toEqual(initial.points)
    expect(Number.isFinite(rigFit(definition).scale)).toBe(true)
  })
  it('keeps push-up support contacts fixed and the torso aligned with the legs',()=>{
    const initial=sampleRig('pushup',0)
    for(const time of [1,2,2.8,4.5]){
      const pose=sampleRig('pushup',time)
      for(const key of ['wristL','wristR','toeL','toeR'])expect(pose.points[key]).toEqual(initial.points[key])
      const spine=sub(pose.points.shoulder!,pose.points.hip!),legs=sub(pose.points.hip!,pose.points.ankleR!)
      expect(spine[0]/spine[1]).toBeCloseTo(legs[0]/legs[1],6)
    }
  })
  it('raises the heels around planted toes and curls without moving the upper arms',()=>{
    const calfStart=sampleRig('calf',0),calfEnd=sampleRig('calf',2.8)
    expect(calfEnd.points.toeR).toEqual(calfStart.points.toeR)
    expect(calfEnd.points.heelR![1]).toBeGreaterThan(calfStart.points.heelR![1]+15)
    const curlStart=sampleRig('curl',0),curlEnd=sampleRig('curl',2.8)
    expect(curlEnd.points.elbowR).toEqual(curlStart.points.elbowR)
    expect(curlEnd.points.shoulderR).toEqual(curlStart.points.shoulderR)
    expect(curlEnd.points.wristR![1]).toBeGreaterThan(curlStart.points.wristR![1]+90)
  })
  it('is continuous across its loop and phase boundaries',()=>{
    for(const boundary of [.45,2.55,3.05,5.55,6])expect(Math.abs(movementClock(boundary-1e-5).progress-movementClock(boundary+1e-5).progress)).toBeLessThan(1e-6)
  })
  it('keeps every foot above the floor, with raised push-up heels and planted toes',()=>{
    for(const definition of [...RIGS, ...WARMUP_RIGS])for(let frame=0;frame<=180;frame++){
      const pose=sampleRig(definition.id,frame/30)
      for(const side of ['L','R']){
        for(const part of ['heel','toe'])expect(pose.points[part+side]![1],`${definition.id}:${part}${side}@${frame}`).toBeGreaterThanOrEqual(-1e-6)
        if(definition.id==='pushup'){
          expect(pose.points['toe'+side]![1]).toBe(0)
          expect(pose.points['heel'+side]![1]).toBeGreaterThan(pose.points['ankle'+side]![1])
        }
      }
    }
  })
  it('keeps the lunge stance, calf hand support and seated trunk contacts still',()=>{
    for(const definition of RIGS){
      const keys=definition.id==='split'?['heelR','toeR','toeL']:definition.id==='calf'?['wristL','wristR']:
        ['pulldown','row','shoulder','bench'].includes(definition.id)?['hip','shoulder','head','heelL','heelR','toeL','toeR']:[]
      const initial=sampleRig(definition.id,0)
      for(let frame=0;frame<=90;frame++){
        const pose=sampleRig(definition.id,frame/15)
        for(const key of keys)expect(pose.points[key],`${definition.id}:${key}@${frame}`).toEqual(initial.points[key])
      }
    }
  })
  it('keeps hands on the chin-up bar, the chin over it at the top, and pushdown elbows still',()=>{
    const bottom=sampleRig('chinup',0),top=sampleRig('chinup',2.8)
    expect(top.points.wristR).toEqual(bottom.points.wristR)
    expect(top.points.head![1]).toBeGreaterThan(top.points.wristR![1])
    expect(bottom.points.head![1]).toBeLessThan(bottom.points.wristR![1])
    const start=sampleRig('pushdown',0),end=sampleRig('pushdown',2.8)
    expect(end.points.elbowR).toEqual(start.points.elbowR)
    expect(end.points.wristR![1]).toBeLessThan(start.points.wristR![1]-50)
  })
  it('hinges the deadlift at the hips with the bar near the legs, and raises lateral arms to about shoulder height',()=>{
    const top=sampleRig('rdl',0),bottom=sampleRig('rdl',2.8)
    expect(bottom.points.hip![0]).toBeLessThan(top.points.hip![0]-50)
    expect(Math.abs(bottom.points.wristR![0]-bottom.points.kneeR![0])).toBeLessThan(45)
    const raised=sampleRig('lateral',2.8)
    expect(Math.abs(raised.points.wristR![1]-raised.points.shoulderR![1])).toBeLessThan(25)
  })
  it('keeps the pulldown bar in front of the head and attached to both hands',()=>{
    for(let frame=0;frame<=180;frame++){
      const pose=sampleRig('pulldown',frame/30)
      const bar=pose.equipment.find(item=>item.accent&&item.width===4)!.points
      for(const side of ['L','R']){
        expect(pose.points['wrist'+side]![0]).toBe(bar[0]![0])
        expect(pose.points['wrist'+side]![1]).toBe(bar[0]![1])
      }
      expect(bar[0]![0]).toBeGreaterThan(pose.points.head![0])
    }
  })
  it('batch three: barbell bench to the lower chest, row with a still hinge, press around the face',()=>{
    const benchTop=sampleRig('benchbar',0),benchLow=sampleRig('benchbar',2.8)
    for(const key of ['hip','shoulder','head','toeR'])expect(benchLow.points[key]).toEqual(benchTop.points[key])
    expect(benchLow.points.wristR![1]).toBeLessThan(benchTop.points.wristR![1]-70)
    expect(benchLow.points.wristR![1]-benchLow.points.shoulderR![1]).toBeGreaterThan(20) // bar stays above the chest
    expect(Math.abs(benchTop.points.wristR![2])).toBeGreaterThan(Math.abs(benchTop.points.shoulderR![2])) // grip wider than shoulders
    for(let frame=0;frame<=90;frame++){
      const pose=sampleRig('bentrow',frame/15)
      for(const key of ['hip','shoulder','head','kneeR','toeR'])expect(pose.points[key],`bentrow:${key}@${frame}`).toEqual(sampleRig('bentrow',0).points[key])
    }
    const rowTop=sampleRig('bentrow',2.8),rowBottom=sampleRig('bentrow',0)
    expect(rowTop.points.wristR![1]).toBeGreaterThan(rowBottom.points.wristR![1]+40)
    for(let frame=0;frame<=90;frame++){
      const pose=sampleRig('standpress',frame/15),head=pose.points.head!
      // The bar never passes through the head: it is in front of it or above it.
      const clear=pose.points.wristR![0]>head[0]+16||pose.points.wristR![1]>head[1]+16||pose.points.wristR![1]<head[1]-16
      expect(clear,`standpress@${frame}`).toBe(true)
    }
    expect(sampleRig('standpress',2.8).points.wristR![1]).toBeGreaterThan(sampleRig('standpress',2.8).points.head![1]+40)
  })
  it('batch three: the barbell curl keeps the upper arms still and the leg curl keeps the thighs on the pad',()=>{
    const start=sampleRig('barcurl',0),end=sampleRig('barcurl',2.8)
    expect(end.points.elbowR).toEqual(start.points.elbowR)
    expect(end.points.wristR![1]).toBeGreaterThan(start.points.wristR![1]+90)
    for(let frame=0;frame<=90;frame++){
      const pose=sampleRig('legcurl',frame/15)
      for(const side of ['L','R']){
        expect(pose.points['knee'+side]![0]).toBeCloseTo(100,6)
        expect(pose.points['knee'+side]![1]).toBeCloseTo(110,6)
      }
    }
    expect(sampleRig('legcurl',2.8).points.ankleR![1]).toBeGreaterThan(sampleRig('legcurl',0).points.ankleR![1]+80)
  })
  it('batch four: plank holds its contacts, crunch and dead bug keep the hips down',()=>{
    const still=(id:Parameters<typeof sampleRig>[0],keys:string[])=>{const first=sampleRig(id,0);for(let frame=0;frame<=90;frame++){const pose=sampleRig(id,frame/15);for(const key of keys)expect(pose.points[key],`${id}:${key}@${frame}`).toEqual(first.points[key])}}
    still('plank',['wristL','wristR','toeL','toeR'])
    const plank=sampleRig('plank',2.8),line=sub(plank.points.shoulder!,plank.points.hip!),legs=sub(plank.points.hip!,plank.points.ankleR!)
    expect(line[1]/line[0]).toBeCloseTo(legs[1]/legs[0],6) // one straight line, no sagging hips
    expect(plank.points.elbowR![1]).toBeLessThan(15) // forearms on the floor
    still('crunch',['hip','toeL','toeR','heelL','heelR'])
    expect(sampleRig('crunch',2.8).points.shoulder![1]).toBeGreaterThan(sampleRig('crunch',0).points.shoulder![1]+40)
    still('deadbug',['hip','shoulder','ankleR','wristL'])
    expect(sampleRig('deadbug',2.8).points.ankleL![1]).toBeGreaterThan(30) // the lowered foot stays off the floor
  })
  it('batch four: bird dog keeps a level back on one hand and knee; goblet stays upright; dumbbell row keeps its hinge',()=>{
    const start=sampleRig('birddog',0),reach=sampleRig('birddog',2.8)
    for(const key of ['hip','shoulder','wristL','kneeR','ankleR'])expect(reach.points[key]).toEqual(start.points[key])
    expect(Math.abs(reach.points.wristR![1]-reach.points.shoulderR![1])).toBeLessThan(10)
    expect(Math.abs(reach.points.ankleL![1]-reach.points.hipL![1])).toBeLessThan(10)
    const goblet=sampleRig('goblet',2.8),squat=sampleRig('squat',2.8)
    const tilt=(pose:typeof goblet)=>{const v=sub(pose.points.shoulder!,pose.points.hip!);return Math.atan2(v[0],v[1])}
    expect(tilt(goblet)).toBeLessThan(tilt(squat)-.1)
    for(let frame=0;frame<=90;frame++)for(const key of ['hip','shoulder','kneeR'])expect(sampleRig('dbrow',frame/15).points[key]).toEqual(sampleRig('dbrow',0).points[key])
  })
  it('batch five: reverse lunge plants the front foot, climber and superman keep the trunk on its contacts',()=>{
    const still=(id:Parameters<typeof sampleRig>[0],keys:string[])=>{const first=sampleRig(id,0);for(let frame=0;frame<=90;frame++){const pose=sampleRig(id,frame/15);for(const key of keys)expect(pose.points[key],`${id}:${key}@${frame}`).toEqual(first.points[key])}}
    still('revlunge',['ankleR','heelR','toeR'])
    const lunge=sampleRig('revlunge',2.8)
    expect(lunge.points.ankleL![0]).toBeLessThan(-200) // the moving foot steps behind
    expect(lunge.points.hip![1]).toBeLessThan(sampleRig('revlunge',0).points.hip![1]-90)
    still('climber',['shoulder','wristL','wristR','toeL'])
    const climb=sampleRig('climber',2.8)
    expect(climb.points.hip).toEqual(sampleRig('climber',0).points.hip) // back to a straight plank once the knee is in
    expect(climb.points.kneeR![0]).toBeGreaterThan(climb.points.hip![0]+50) // the knee drives under the chest
    for(let frame=0;frame<=600;frame++)expect(sampleRig('climber',frame/100).points.kneeR![1]).toBeGreaterThan(10) // and never touches the floor on the way
    still('superman',['hip'])
    const lift=sampleRig('superman',2.8),flat=sampleRig('superman',0)
    for(const key of ['wristR','ankleR','head'])expect(lift.points[key]![1]).toBeGreaterThan(flat.points[key]![1]+15)
    expect(lift.points.wristR![1]).toBeLessThan(90) // a few centimetres, not a full back bend
  })
  it('batch five: leg extension moves only the shins, bench dip keeps hands and feet planted, hip thrust levels the torso',()=>{
    // Knees come from the limb solver, so they hold still to rounding error rather than bit for bit.
    for(let frame=0;frame<=90;frame++)for(const key of ['hip','shoulder','kneeR','kneeL','wristR'])expect(length(sub(sampleRig('legext',frame/15).points[key]!,sampleRig('legext',0).points[key]!))).toBeLessThan(1e-9)
    expect(sampleRig('legext',2.8).points.ankleR![1]).toBeGreaterThan(sampleRig('legext',0).points.ankleR![1]+80)
    for(let frame=0;frame<=90;frame++)for(const key of ['wristL','wristR','ankleL','ankleR'])expect(sampleRig('benchdip',frame/15).points[key]).toEqual(sampleRig('benchdip',0).points[key])
    const dip=sampleRig('benchdip',2.8)
    expect(dip.points.shoulder![1]).toBeLessThan(sampleRig('benchdip',0).points.shoulder![1]-35)
    expect(dip.points.elbowR![0]).toBeLessThan(dip.points.wristR![0]) // elbows bend back, not out
    const top=sampleRig('hipthrust',2.8),bottom=sampleRig('hipthrust',0)
    expect(top.points.shoulder).toEqual(bottom.points.shoulder)
    expect(Math.abs(top.points.hip![1]-top.points.shoulder![1])).toBeLessThan(1) // level at the top
    expect(top.points.hip![1]).toBeGreaterThan(bottom.points.hip![1]+60)
  })
})
