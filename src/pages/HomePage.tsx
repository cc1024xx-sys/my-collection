import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getAllTags } from '../db'
import { TagBar } from '../components/TagBar'
import { GuideCard } from '../components/GuideCard'
import { Fab } from '../components/Fab'
import { createObjectUrl } from '../utils/image'

export function HomePage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})

  const guides = useLiveQuery(
    async () => {
      const list = await db.guides.orderBy('updatedAt').reverse().toArray()
      if (!selectedTag) return list
      return list.filter((g) => g.tags.includes(selectedTag))
    },
    [selectedTag],
  )

  useEffect(() => {
    getAllTags().then(setAllTags)
  }, [guides])

  const guideIds = useMemo(
    () => (guides ?? []).map((g) => g.id).join(','),
    [guides],
  )

  useEffect(() => {
    if (!guides || guides.length === 0) {
      setCoverUrls({})
      return
    }

    const guideList = guides
    let cancelled = false

    async function loadCovers() {
      const urls: Record<string, string> = {}
      for (const guide of guideList) {
        const first = await db.images
          .where('guideId')
          .equals(guide.id)
          .sortBy('order')
        if (first.length > 0) {
          urls[guide.id] = createObjectUrl(first[0].blob)
        }
      }
      if (!cancelled) setCoverUrls(urls)
    }

    loadCovers()

    return () => {
      cancelled = true
      setCoverUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url))
        return {}
      })
    }
  }, [guideIds, guides])

  return (
    <div className="home">
      <TagBar
        tags={allTags}
        selected={selectedTag}
        onSelect={setSelectedTag}
      />

      {!guides ? (
        <p className="empty-hint">加载中…</p>
      ) : guides.length === 0 ? (
        <div className="empty-state">
          <p>还没有攻略</p>
          <p className="empty-sub">点击右下角 + 创建你的第一条攻略</p>
        </div>
      ) : (
        <ul className="guide-list">
          {guides.map((guide) => (
            <li key={guide.id}>
              <GuideCard guide={guide} coverUrl={coverUrls[guide.id]} />
            </li>
          ))}
        </ul>
      )}

      <Fab />
    </div>
  )
}
