import type { BodyWeightEntry } from '@/types'
import { db } from './db'

/** One entry per day: logging again on the same day replaces it. */
export async function upsertBodyWeight(day: string, kg: number): Promise<void> {
  await db.bodyWeights.put({ day, kg })
}

/** Oldest first (chart order). */
export function listBodyWeights(): Promise<BodyWeightEntry[]> {
  return db.bodyWeights.orderBy('day').toArray()
}

export async function deleteBodyWeight(day: string): Promise<void> {
  await db.bodyWeights.delete(day)
}
