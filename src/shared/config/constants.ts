export const CDN_BASE_URL = 'https://cdn.gntc-youth.com'

export const FALLBACK_IMAGE_URL = `${CDN_BASE_URL}/assets/anyang-church-fallback.jpg`

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
]

export const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export const IMAGE_COMPRESSION_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
}

export const VIDEO_COMPRESSION_OPTIONS = {
  crf: 28,
  maxWidth: 1280,
  skipBelowSize: 20 * 1024 * 1024, // 20MB 이하 MP4는 압축 스킵
}
