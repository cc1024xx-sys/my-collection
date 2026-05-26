export interface GuideStep {
  order: number
  content: string
}

export interface GuideLink {
  title?: string
  url: string
}

export interface Guide {
  id: string
  title: string
  steps: GuideStep[]
  links: GuideLink[]
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface GuideImage {
  id: string
  guideId: string
  blob: Blob
  mimeType: string
  order: number
  createdAt: number
}

export type GuideInput = Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>

export interface ExperienceFeedback {
  id: string
  guideId: string
  rating: number
  content: string
  experiencedAt: number
  createdAt: number
}
