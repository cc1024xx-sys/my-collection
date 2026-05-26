import { clampRating } from '../utils/rating'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  size?: 'md' | 'lg'
  label?: string
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  label = '评分',
}: StarRatingProps) {
  const interactive = Boolean(onChange)
  const current = value > 0 ? clampRating(value) : 0

  return (
    <div
      className={`star-rating star-rating--${size}${interactive ? ' star-rating--interactive' : ''}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? label : `${label} ${current} 星`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-rating-btn${star <= current ? ' active' : ''}`}
          disabled={!interactive}
          aria-label={`${star} 星`}
          aria-pressed={interactive ? star === current : undefined}
          onClick={() => onChange?.(star)}
        >
          ★
        </button>
      ))}
    </div>
  )
}
