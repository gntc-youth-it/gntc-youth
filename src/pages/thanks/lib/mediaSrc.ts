import { buildCdnUrl } from '../../../shared/lib'

// 서버가 주는 'uploads/...' 경로는 CDN 주소로 바꾸고, 고른 사진 미리보기(blob:)나 전체 주소는 그대로 쓴다
export const toMediaSrc = (url: string): string => (/^(https?:|blob:|data:)/.test(url) ? url : buildCdnUrl(url))
