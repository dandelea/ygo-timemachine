import { Archetype } from '../db/models.ts'

/** Archetype names, sorted. The original endpoint loaded every card of every archetype. */
export async function listArchetypeIds(): Promise<string[]> {
  const archetypes = await Archetype.findAll({ attributes: ['id'], order: [['id', 'ASC']] })
  return archetypes.map((archetype) => archetype.id)
}
