import type { WorkoutSession } from '@/types'
import { db } from './db'

/** Finished sessions, newest first. */
export function listDoneSessions(): Promise<WorkoutSession[]> {
  return db.sessions.orderBy('startedAt').reverse().filter((s) => s.status === 'done').toArray()
}

export function getSession(id: string): Promise<WorkoutSession | undefined> {
  return db.sessions.get(id)
}

/** The in-progress session, if any (there is at most one). */
export function getActiveSession(): Promise<WorkoutSession | undefined> {
  return db.sessions.where('status').equals('active').first()
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  await db.sessions.put(session)
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id)
}
