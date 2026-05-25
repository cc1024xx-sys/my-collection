import Dexie, { type EntityTable } from 'dexie'
import type { Guide, GuideImage } from '../types'

class GuideDatabase extends Dexie {
  guides!: EntityTable<Guide, 'id'>
  images!: EntityTable<GuideImage, 'id'>

  constructor() {
    super('GuideCollectionDB')
    this.version(1).stores({
      guides: 'id, updatedAt, *tags',
      images: 'id, guideId, order',
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
  await db.transaction('rw', db.guides, db.images, async () => {
    await db.images.where('guideId').equals(id).delete()
    await db.guides.delete(id)
  })
}

export async function getGuideImages(guideId: string): Promise<GuideImage[]> {
  return db.images.where('guideId').equals(guideId).sortBy('order')
}
