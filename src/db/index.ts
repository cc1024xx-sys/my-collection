import Dexie, { type EntityTable } from 'dexie'
import type { ExperienceFeedback, Guide, GuideImage } from '../types'

export interface GuideRatingSummary {
  average: number
  count: number
}

class GuideDatabase extends Dexie {
  guides!: EntityTable<Guide, 'id'>
  images!: EntityTable<GuideImage, 'id'>
  feedbacks!: EntityTable<ExperienceFeedback, 'id'>

  constructor() {
    super('GuideCollectionDB')
    this.version(1).stores({
      guides: 'id, updatedAt, *tags',
      images: 'id, guideId, order',
    })
    this.version(2).stores({
      guides: 'id, updatedAt, *tags',
      images: 'id, guideId, order',
      feedbacks: 'id, guideId, experiencedAt, rating',
    })
  }
}

export const db = new GuideDatabase()

export async function getAllTags(): Promise<string[]> {
  const guides = await db.guides.toArray()
  const tagSet = new Set<string>()
  for (const guide of guides) {
    for (const tag of guide.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

export async function deleteGuideWithImages(id: string): Promise<void> {
  await db.transaction('rw', db.guides, db.images, db.feedbacks, async () => {
    await db.images.where('guideId').equals(id).delete()
    await db.feedbacks.where('guideId').equals(id).delete()
    await db.guides.delete(id)
  })
}

export async function getGuideImages(guideId: string): Promise<GuideImage[]> {
  return db.images.where('guideId').equals(guideId).sortBy('order')
}

export async function getGuideFeedbacks(
  guideId: string,
): Promise<ExperienceFeedback[]> {
  const list = await db.feedbacks.where('guideId').equals(guideId).toArray()
  return list.sort((a, b) => b.experiencedAt - a.experiencedAt)
}

export async function getGuideRatingSummary(
  guideId: string,
): Promise<GuideRatingSummary | null> {
  const list = await db.feedbacks.where('guideId').equals(guideId).toArray()
  if (list.length === 0) return null
  const average =
    list.reduce((sum, f) => sum + f.rating, 0) / list.length
  return {
    average: Math.round(average * 10) / 10,
    count: list.length,
  }
}

export async function getRatingSummariesForGuides(
  guideIds: string[],
): Promise<Record<string, GuideRatingSummary>> {
  const result: Record<string, GuideRatingSummary> = {}
  await Promise.all(
    guideIds.map(async (id) => {
      const summary = await getGuideRatingSummary(id)
      if (summary) result[id] = summary
    }),
  )
  return result
}
