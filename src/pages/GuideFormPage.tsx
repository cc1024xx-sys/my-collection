import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, getAllTags, getGuideImages } from '../db'
import { createId } from '../utils/id'
import { compressImage, createObjectUrl } from '../utils/image'
import { normalizeTag, parseTagsInput } from '../utils/tags'
import type { Guide, GuideImage, GuideLink, GuideStep } from '../types'

interface ExistingImage {
  id: string
  url: string
  order: number
}

export function GuideFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [steps, setSteps] = useState<GuideStep[]>([{ order: 0, content: '' }])
  const [links, setLinks] = useState<GuideLink[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllTags().then(setExistingTags)
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return

    async function load() {
      const guide = await db.guides.get(id!)
      if (!guide) {
        navigate('/', { replace: true })
        return
      }
      setTitle(guide.title)
      setSteps(
        guide.steps.length > 0
          ? guide.steps
          : [{ order: 0, content: '' }],
      )
      setLinks(guide.links)
      setTags(guide.tags)

      const imgs = await getGuideImages(id!)
      const withUrls: ExistingImage[] = imgs.map((img) => ({
        id: img.id,
        url: createObjectUrl(img.blob),
        order: img.order,
      }))
      setExistingImages(withUrls)
      setLoading(false)
    }

    load()
  }, [id, isEdit, navigate])

  useEffect(() => {
    return () => {
      existingImages.forEach((img) => URL.revokeObjectURL(img.url))
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [existingImages, newImagePreviews])

  useEffect(() => {
    const urls = newImageFiles.map((f) => createObjectUrl(f))
    setNewImagePreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [newImageFiles])

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { order: prev.length, content: '' },
    ])
  }

  function updateStep(index: number, content: string) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, content } : s)),
    )
  }

  function removeStep(index: number) {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i })),
    )
  }

  function addLink() {
    setLinks((prev) => [...prev, { title: '', url: '' }])
  }

  function updateLink(
    index: number,
    field: 'title' | 'url',
    value: string,
  ) {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    )
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function addTag(raw: string) {
    const tag = normalizeTag(raw)
    if (!tag) return
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  function handleImagesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      setNewImageFiles((prev) => [...prev, ...files])
    }
    e.target.value = ''
  }

  function removeExistingImage(imageId: string) {
    setExistingImages((prev) => {
      const removed = prev.find((img) => img.id === imageId)
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((img) => img.id !== imageId)
    })
  }

  function removeNewImage(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      window.alert('请填写标题')
      return
    }

    setSaving(true)
    const now = Date.now()
    const guideId = id ?? createId()

    const cleanedSteps = steps
      .map((s, i) => ({ order: i, content: s.content.trim() }))
      .filter((s) => s.content)

    const cleanedLinks = links
      .map((l) => ({
        title: l.title?.trim() || undefined,
        url: l.url.trim(),
      }))
      .filter((l) => l.url)

    const guide: Guide = {
      id: guideId,
      title: trimmedTitle,
      steps: cleanedSteps,
      links: cleanedLinks,
      tags,
      createdAt: now,
      updatedAt: now,
    }

    try {
      if (isEdit) {
        const existing = await db.guides.get(guideId)
        guide.createdAt = existing?.createdAt ?? now
        await db.guides.put(guide)

        const keepIds = new Set(existingImages.map((img) => img.id))
        const allImages = await getGuideImages(guideId)
        const toDelete = allImages.filter((img) => !keepIds.has(img.id))
        await db.images.bulkDelete(toDelete.map((img) => img.id))

        for (const img of existingImages) {
          const record = allImages.find((i) => i.id === img.id)
          if (record && record.order !== img.order) {
            await db.images.update(img.id, { order: img.order })
          }
        }
      } else {
        await db.guides.add(guide)
      }

      const startOrder = existingImages.length
      const newRecords: GuideImage[] = []

      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i]
        const blob = await compressImage(file)
        newRecords.push({
          id: createId(),
          guideId,
          blob,
          mimeType: blob.type || file.type,
          order: startOrder + i,
          createdAt: now,
        })
      }

      if (newRecords.length > 0) {
        await db.images.bulkAdd(newRecords)
      }

      navigate(`/guide/${guideId}`, { replace: true })
    } catch (err) {
      console.error(err)
      window.alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="empty-hint">加载中…</p>
  }

  const suggestedTags = existingTags.filter((t) => !tags.includes(t))

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">标题 *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：经典莫吉托"
          required
        />
      </div>

      <div className="form-group">
        <div className="form-group-header">
          <label>步骤</label>
          <button type="button" className="btn-text" onClick={addStep}>
            + 添加步骤
          </button>
        </div>
        {steps.map((step, index) => (
          <div key={index} className="step-input-row">
            <span className="step-num">{index + 1}</span>
            <textarea
              value={step.content}
              onChange={(e) => updateStep(index, e.target.value)}
              placeholder={`步骤 ${index + 1}`}
              rows={2}
            />
            {steps.length > 1 && (
              <button
                type="button"
                className="btn-icon"
                onClick={() => removeStep(index)}
                aria-label="删除步骤"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="form-group">
        <label>图片</label>
        <div className="image-preview-grid">
          {existingImages.map((img) => (
            <div key={img.id} className="image-preview-item">
              <img src={img.url} alt="" />
              <button
                type="button"
                className="image-remove"
                onClick={() => removeExistingImage(img.id)}
              >
                ×
              </button>
            </div>
          ))}
          {newImagePreviews.map((url, i) => (
            <div key={url} className="image-preview-item">
              <img src={url} alt="" />
              <button
                type="button"
                className="image-remove"
                onClick={() => removeNewImage(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden-input"
          onChange={handleImagesSelected}
        />
        <button
          type="button"
          className="btn-secondary btn-block"
          onClick={() => fileInputRef.current?.click()}
        >
          从相册选择或拍照
        </button>
      </div>

      <div className="form-group">
        <div className="form-group-header">
          <label>相关链接</label>
          <button type="button" className="btn-text" onClick={addLink}>
            + 添加链接
          </button>
        </div>
        {links.length === 0 && (
          <p className="form-hint">可选，添加参考视频或文章链接</p>
        )}
        {links.map((link, index) => (
          <div key={index} className="link-input-row">
            <input
              type="text"
              value={link.title ?? ''}
              onChange={(e) => updateLink(index, 'title', e.target.value)}
              placeholder="链接名称（可选）"
            />
            <input
              type="url"
              value={link.url}
              onChange={(e) => updateLink(index, 'url', e.target.value)}
              placeholder="https://..."
            />
            <button
              type="button"
              className="btn-icon"
              onClick={() => removeLink(index)}
              aria-label="删除链接"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label htmlFor="tags">分类标签</label>
        <div className="tag-input-area">
          {tags.map((tag) => (
            <span key={tag} className="tag-chip active">
              #{tag}
              <button
                type="button"
                className="tag-remove"
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => {
              if (tagInput.trim()) {
                parseTagsInput(tagInput).forEach(addTag)
              }
            }}
            placeholder="输入标签，回车添加"
          />
        </div>
        {suggestedTags.length > 0 && (
          <div className="suggested-tags">
            <span className="form-hint">已有标签：</span>
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="tag-chip"
                onClick={() => addTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary btn-block" disabled={saving}>
        {saving ? '保存中…' : '保存'}
      </button>
    </form>
  )
}
