import { Link } from 'react-router-dom'
import type { Guide } from '../types'
import { formatTagDisplay } from '../utils/tags'

interface GuideCardProps {
  guide: Guide
  coverUrl?: string
}

export function GuideCard({ guide, coverUrl }: GuideCardProps) {
  const stepCount = guide.steps.length

  return (
    <Link to={`/guide/${guide.id}`} className="guide-card">
      <div className="guide-card-cover">
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" />
        ) : (
          <div className="guide-card-placeholder">📋</div>
        )}
      </div>
      <div className="guide-card-body">
        <h2 className="guide-card-title">{guide.title}</h2>
        {guide.tags.length > 0 && (
          <div className="guide-card-tags">
            {guide.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag-mini">
                {formatTagDisplay(tag)}
              </span>
            ))}
          </div>
        )}
        <p className="guide-card-meta">
          {stepCount > 0 ? `${stepCount} 个步骤` : '暂无步骤'}
        </p>
      </div>
    </Link>
  )
}
