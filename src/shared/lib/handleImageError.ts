import { FALLBACK_IMAGE_URL } from '../config'

// 최종 fallback: CDN도 안될 때 사용하는 inline SVG placeholder
const INLINE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23E8E8E8'/%3E%3Ctext x='200' y='150' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='14' fill='%23999'%3E이미지를 불러올 수 없습니다%3C/text%3E%3C/svg%3E"

// 요소+src 조합으로 추적하여, src가 바뀌면 다시 CDN fallback을 시도할 수 있도록 함
const failedSrcMap = new WeakMap<HTMLImageElement, string>()

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement> | Event) {
  const img =
    'currentTarget' in e && e.currentTarget instanceof HTMLImageElement
      ? e.currentTarget
      : (e.target as HTMLImageElement)
  if (!(img instanceof HTMLImageElement)) return

  const src = img.currentSrc || img.src
  if (failedSrcMap.get(img) === src) {
    // fallback도 실패 → inline SVG로 최종 교체 (더 이상 네트워크 요청 없음)
    img.onerror = null
    img.src = INLINE_FALLBACK
    return
  }
  failedSrcMap.set(img, src)
  img.src = FALLBACK_IMAGE_URL
}
