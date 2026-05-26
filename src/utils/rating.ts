export function clampRating(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)))
}

export function formatStars(rating: number): string {
  const n = clampRating(rating)
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

export function formatRatingAverage(average: number): string {
  return average % 1 === 0 ? String(average) : average.toFixed(1)
}

export function toDateInputValue(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromDateInputValue(value: string): number {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return Date.now()
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime()
}

export function formatExperienceDate(ms: number): string {
  return new Date(ms).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
