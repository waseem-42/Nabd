import { describe, expect, it } from 'vitest'
import { EXERCISE_BY_ID } from '@/data/catalog'
import { RIGS, findRig, length, movementClock, rigFit, sampleRig, sub } from './engine'

describe('continuous exercise rigs',()=>{
  it('maps fifteen exact catalogue ids without inheriting a rig through shared art slugs',()=>{
    expect(RIGS).toHaveLength(15)
    expect(new Set(RIGS.map(rig=>rig.exerciseId)).size).toBe(15)
    for(const rig of RIGS)expect(EXERCISE_BY_ID.has(rig.exerciseId)).toBe(true)
    expect(findRig('qx4fgX7')).toBeUndefined() // Elevated dumbbell split squat shares an art slug.
    expect(findRig('9E25EOx')?.id).toBe('split')
  })
  it.each(RIGS)('$id preserves every bone length throughout its complete repetition',(definition)=>{
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
    for(const definition of RIGS)for(let frame=0;frame<=180;frame++){
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
})
