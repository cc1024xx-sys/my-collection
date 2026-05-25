export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').trim()
}

export function formatTagDisplay(tag: string): string {
  return `#${tag}`
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(/[,，\s#]+/)
    .map(normalizeTag)
    .filter(Boolean)
}
