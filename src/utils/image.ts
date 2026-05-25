export async function compressImage(
  file: File,
  maxSize = 1200,
  quality = 0.82,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, maxSize / Math.max(width, height))
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })

  return blob ?? file
}

export function createObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}
