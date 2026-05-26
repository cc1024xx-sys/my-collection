import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getGuideFeedbacks } from '../db'
import { StarRating } from './StarRating'
import { createId } from '../utils/id'
import {
  formatExperienceDate,
  formatRatingAverage,
  formatStars,
  fromDateInputValue,
  toDateInputValue,
} from '../utils/rating'
import type { ExperienceFeedback } from '../types'

interface ExperienceSectionProps {
  guideId: string
}

export function ExperienceSection({ guideId }: ExperienceSectionProps) {
  const feedbacks = useLiveQuery(
    () => getGuideFeedbacks(guideId),
    [guideId],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [dateValue, setDateValue] = useState(() => toDateInputValue(Date.now()))
  const [saving, setSaving] = useState(false)

  const summary =
    feedbacks && feedbacks.length > 0
      ? {
          average:
            Math.round(
              (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length) *
                10,
            ) / 10,
          count: feedbacks.length,
        }
      : null

  function openCreateForm() {
    setEditingId(null)
    setRating(0)
    setContent('')
    setDateValue(toDateInputValue(Date.now()))
    setFormOpen(true)
  }

  function openEditForm(item: ExperienceFeedback) {
    setEditingId(item.id)
    setRating(item.rating)
    setContent(item.content)
    setDateValue(toDateInputValue(item.experiencedAt))
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  async function handleSave() {
    if (rating < 1) {
      window.alert('请选择 1～5 星评分')
      return
    }

    setSaving(true)
    try {
      const now = Date.now()
      const record: ExperienceFeedback = {
        id: editingId ?? createId(),
        guideId,
        rating,
        content: content.trim(),
        experiencedAt: fromDateInputValue(dateValue),
        createdAt: editingId
          ? (await db.feedbacks.get(editingId))?.createdAt ?? now
          : now,
      }
      await db.feedbacks.put(record)
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: ExperienceFeedback) {
    const confirmed = window.confirm('确定删除这条体验记录吗？')
    if (!confirmed) return
    await db.feedbacks.delete(item.id)
  }

  return (
    <section className="detail-section experience-section">
      <div className="experience-header">
        <h2>我的体验</h2>
        <button
          type="button"
          className="btn-text"
          onClick={openCreateForm}
        >
          + 记录这次体验
        </button>
      </div>

      {summary ? (
        <p className="experience-summary">
          <span className="experience-summary-stars" aria-hidden>
            {formatStars(Math.round(summary.average))}
          </span>
          <span>
            {formatRatingAverage(summary.average)} 分 · {summary.count} 条记录
          </span>
        </p>
      ) : (
        <p className="experience-empty">还没有体验记录，试过后可以在这里打分和写反馈。</p>
      )}

      {feedbacks && feedbacks.length > 0 && (
        <ul className="experience-list">
          {feedbacks.map((item) => (
            <li key={item.id} className="experience-item">
              <div className="experience-item-top">
                <StarRating value={item.rating} size="md" label="评分" />
                <time dateTime={new Date(item.experiencedAt).toISOString()}>
                  {formatExperienceDate(item.experiencedAt)}
                </time>
              </div>
              {item.content ? (
                <p className="experience-item-content">{item.content}</p>
              ) : null}
              <div className="experience-item-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => openEditForm(item)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="btn-text experience-delete"
                  onClick={() => void handleDelete(item)}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <div
          className="backup-overlay experience-form-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="experience-form-title"
          onClick={closeForm}
        >
          <div
            className="backup-sheet experience-form-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="backup-sheet-header">
              <h3 id="experience-form-title" className="backup-title">
                {editingId ? '编辑体验' : '记录这次体验'}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={closeForm}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <label className="form-label">
              评分 <span className="form-required">*</span>
            </label>
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
            />

            <label className="form-label" htmlFor="experience-date">
              体验日期
            </label>
            <input
              id="experience-date"
              type="date"
              className="form-input"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />

            <label className="form-label" htmlFor="experience-content">
              体验反馈（选填）
            </label>
            <textarea
              id="experience-content"
              className="form-textarea"
              rows={4}
              placeholder="这次感觉如何？有什么想记下来的？"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <button
              type="button"
              className="btn-primary btn-block"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
