export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export interface CompressedImageResult {
  blob: Blob
  originalSize: number
  compressedSize: number
}

const DEFAULT_MAX_WIDTH = 1920
const DEFAULT_MAX_HEIGHT = 1920
const DEFAULT_QUALITY = 0.8

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'))
    img.src = src
  })
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let newWidth = width
  let newHeight = height

  if (newWidth > maxWidth) {
    newHeight = Math.round((newHeight * maxWidth) / newWidth)
    newWidth = maxWidth
  }

  if (newHeight > maxHeight) {
    newWidth = Math.round((newWidth * maxHeight) / newHeight)
    newHeight = maxHeight
  }

  return { width: newWidth, height: newHeight }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('이미지 변환에 실패했습니다.'))
        }
      },
      type,
      quality
    )
  })
}

export async function compressImage(
  file: File,
  options?: ImageCompressionOptions
): Promise<CompressedImageResult> {
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_HEIGHT
  const quality = options?.quality ?? DEFAULT_QUALITY

  const objectUrl = URL.createObjectURL(file)

  try {
    const img = await loadImage(objectUrl)
    const { width, height } = calculateDimensions(
      img.naturalWidth,
      img.naturalHeight,
      maxWidth,
      maxHeight
    )

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.')
    }

    ctx.drawImage(img, 0, 0, width, height)

    let blob: Blob
    try {
      blob = await canvasToBlob(canvas, 'image/webp', quality)
      // WebP 미지원 브라우저 폴백
      if (blob.type !== 'image/webp') {
        blob = await canvasToBlob(canvas, 'image/jpeg', quality)
      }
    } catch {
      blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }

    return {
      blob,
      originalSize: file.size,
      compressedSize: blob.size,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
