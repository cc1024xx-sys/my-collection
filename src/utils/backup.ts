import { db } from '../db'
import type { Guide, GuideImage } from '../types'

export const BACKUP_VERSION = 1

export interface BackupImageRecord {
  id: string
  guideId: string
  mimeType: string
  order: number
  createdAt: number
  data: string
}

export interface BackupFile {
  version: number
  exportedAt: number
  guides: Guide[]
  images: BackupImageRecord[]
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('无法读取图片数据'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('读取失败'))
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

function backupFilename(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
  return `my-collection-backup-${stamp}.json`
}

export async function buildBackupFile(): Promise<BackupFile> {
  const guides = await db.guides.toArray()
  const images = await db.images.toArray()
  const imageRecords: BackupImageRecord[] = []

  for (const img of images) {
    imageRecords.push({
      id: img.id,
      guideId: img.guideId,
      mimeType: img.mimeType,
      order: img.order,
      createdAt: img.createdAt,
      data: await blobToBase64(img.blob),
    })
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    guides,
    images: imageRecords,
  }
}

export async function downloadBackup(): Promise<void> {
  const data = await buildBackupFile()
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFilename()
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function isGuide(value: unknown): value is Guide {
  if (!value || typeof value !== 'object') return false
  const g = value as Guide
  return (
    typeof g.id === 'string' &&
    typeof g.title === 'string' &&
    Array.isArray(g.steps) &&
    Array.isArray(g.links) &&
    Array.isArray(g.tags) &&
    typeof g.createdAt === 'number' &&
    typeof g.updatedAt === 'number'
  )
}

function isBackupImage(value: unknown): value is BackupImageRecord {
  if (!value || typeof value !== 'object') return false
  const img = value as BackupImageRecord
  return (
    typeof img.id === 'string' &&
    typeof img.guideId === 'string' &&
    typeof img.mimeType === 'string' &&
    typeof img.order === 'number' &&
    typeof img.createdAt === 'number' &&
    typeof img.data === 'string'
  )
}

export function parseBackupFile(raw: unknown): BackupFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('备份文件格式无效')
  }
  const file = raw as BackupFile
  if (file.version !== BACKUP_VERSION) {
    throw new Error(`不支持的备份版本（${file.version}）`)
  }
  if (!Array.isArray(file.guides) || !Array.isArray(file.images)) {
    throw new Error('备份文件缺少 guides 或 images')
  }
  if (!file.guides.every(isGuide)) {
    throw new Error('攻略数据格式不正确')
  }
  if (!file.images.every(isBackupImage)) {
    throw new Error('图片数据格式不正确')
  }

  const guideIds = new Set(file.guides.map((g) => g.id))
  for (const img of file.images) {
    if (!guideIds.has(img.guideId)) {
      throw new Error(`图片 ${img.id} 对应的攻略不存在`)
    }
  }

  return file
}

function toGuideImages(records: BackupImageRecord[]): GuideImage[] {
  return records.map((img) => ({
    id: img.id,
    guideId: img.guideId,
    mimeType: img.mimeType,
    order: img.order,
    createdAt: img.createdAt,
    blob: base64ToBlob(img.data, img.mimeType),
  }))
}

export type ImportMode = 'merge' | 'replace'

export async function importBackup(
  file: File,
  mode: ImportMode,
): Promise<{ guides: number; images: number }> {
  let parsed: unknown
  try {
    const text = await file.text()
    parsed = JSON.parse(text)
  } catch {
    throw new Error('无法解析 JSON 文件')
  }

  const backup = parseBackupFile(parsed)
  const images = toGuideImages(backup.images)

  await db.transaction('rw', db.guides, db.images, async () => {
    if (mode === 'replace') {
      await db.images.clear()
      await db.guides.clear()
    }
    await db.guides.bulkPut(backup.guides)
    await db.images.bulkPut(images)
  })

  return { guides: backup.guides.length, images: backup.images.length }
}
