const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']

export const isVideoUrl = (url: string): boolean => {
  const pathname = url.split('?')[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))
}

export const getMediaType = (url: string): 'video' | 'image' => {
  return isVideoUrl(url) ? 'video' : 'image'
}
