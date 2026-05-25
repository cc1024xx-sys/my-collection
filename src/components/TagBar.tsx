import { formatTagDisplay } from '../utils/tags'

interface TagBarProps {
  tags: string[]
  selected: string | null
  onSelect: (tag: string | null) => void
}

export function TagBar({ tags, selected, onSelect }: TagBarProps) {
  return (
    <div className="tag-bar" role="tablist" aria-label="分类筛选">
      <button
        type="button"
        role="tab"
        aria-selected={selected === null}
        className={`tag-chip ${selected === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        全部
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          role="tab"
          aria-selected={selected === tag}
          className={`tag-chip ${selected === tag ? 'active' : ''}`}
          onClick={() => onSelect(tag)}
        >
          {formatTagDisplay(tag)}
        </button>
      ))}
    </div>
  )
}
