import { CDN_BASE_URL } from '../config'

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']

export const isVideoUrl = (url: string): boolean => {
  const pathname = url.split('?')[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))
}

export const getMediaType = (url: string): 'video' | 'image' => {
  return isVideoUrl(url) ? 'video' : 'image'
}

export const buildCdnUrl = (path: string): string => {
  if (/^(?:[a-z]+:)?\/\//i.test(path)) return path
  const normalizedPath = `/${path.replace(/^\/+/, '')}`
  return `${CDN_BASE_URL}${normalizedPath}`
}
