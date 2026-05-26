import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteGuideWithImages, getGuideImages } from '../db'
import { ExperienceSection } from '../components/ExperienceSection'
import { formatTagDisplay } from '../utils/tags'
import { createObjectUrl } from '../utils/image'
import type { GuideImage } from '../types'

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const guide = useLiveQuery(() => (id ? db.guides.get(id) : undefined), [id])

  const images = useLiveQuery(
    () => (id ? getGuideImages(id) : []),
    [id],
  ) as GuideImage[] | undefined

  useEffect(() => {
    if (!images || images.length === 0) {
      setImageUrls([])
      return
    }
    const urls = images.map((img) => createObjectUrl(img.blob))
    setImageUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [images])

  async function handleDelete() {
    if (!id || !guide) return
    const confirmed = window.confirm(`确定删除「${guide.title}」吗？`)
    if (!confirmed) return
    await deleteGuideWithImages(id)
    navigate('/', { replace: true })
  }

  if (!guide) {
    return <p className="empty-hint">加载中…</p>
  }

  const sortedSteps = [...guide.steps].sort((a, b) => a.order - b.order)

  return (
    <div className="detail">
      <div className="detail-actions">
        <Link to={`/guide/${id}/edit`} className="btn-secondary">
          编辑
        </Link>
        <button type="button" className="btn-danger" onClick={handleDelete}>
          删除
        </button>
      </div>

      <h1 className="detail-title">{guide.title}</h1>

      {guide.tags.length > 0 && (
        <div className="detail-tags">
          {guide.tags.map((tag) => (
            <span key={tag} className="tag-mini">
              {formatTagDisplay(tag)}
            </span>
          ))}
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="image-gallery">
          {imageUrls.map((url, i) => (
            <img key={url} src={url} alt={`图片 ${i + 1}`} />
          ))}
        </div>
      )}

      {sortedSteps.length > 0 && (
        <section className="detail-section">
          <h2>步骤</h2>
          <ol className="step-list">
            {sortedSteps.map((step, i) => (
              <li key={step.order}>
                <span className="step-num">{i + 1}</span>
                <p>{step.content}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {guide.links.length > 0 && (
        <section className="detail-section">
          <h2>相关链接</h2>
          <ul className="link-list">
            {guide.links.map((link, i) => (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title || link.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {id && <ExperienceSection guideId={id} />}
    </div>
  )
}
