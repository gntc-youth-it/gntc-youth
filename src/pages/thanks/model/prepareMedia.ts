import { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../../../shared/config'
import { compressImage, compressVideo, isVideoCompressionSupported } from '../../../shared/lib'
import { getVideoDuration } from '../lib/videoDuration'
import { VIDEO_MAX_SECONDS } from './types'
import type { ThanksMedia } from './types'

export type MediaSource = 'camera' | 'album'
export type EntryMediaType = ThanksMedia['type']

export interface PreparedMedia {
  blob: Blob
  mediaType: EntryMediaType
}

// 화면에 그대로 보여 줄 안내가 담긴 오류
export class MediaError extends Error {}

// 카드에 꽉 차게 보이는 크기라 갤러리(1920px)보다 작게 줄인다. 하루 50~60장이 한 화면에 쌓인다
const PHOTO_COMPRESSION = { maxWidth: 1280, maxHeight: 1280, quality: 0.8 }
// 휴대폰 영상 길이는 조금씩 넘치므로 이만큼은 5초로 본다
const DURATION_TOLERANCE_SEC = 0.3

const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm|3gp)$/i
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif)$/i

// 일부 안드로이드 앨범은 type을 비워서 주므로 파일 이름으로도 본다
export const mediaTypeOf = (blob: Blob): EntryMediaType | null => {
  if (blob.type.startsWith('image/')) return 'IMAGE'
  if (blob.type.startsWith('video/')) return 'VIDEO'
  const name = blob instanceof File ? blob.name : ''
  if (IMAGE_EXTENSIONS.test(name)) return 'IMAGE'
  if (VIDEO_EXTENSIONS.test(name)) return 'VIDEO'
  return null
}

// 앞 5초만 남기고 어느 폰에서나 재생되는 mp4(H.264, 720p급)로 바꾼다
const toMp4 = async (blob: Blob, onProgress?: (progress: number) => void) =>
  (await compressVideo(blob, { maxWidth: 1280, maxDurationSec: VIDEO_MAX_SECONDS, onProgress })).blob

const preparePhoto = async (blob: Blob, source: MediaSource): Promise<Blob> => {
  // 화면 안 카메라로 찍은 사진은 이미 줄여서 만들었다
  if (source === 'camera') return blob
  if (blob.size > MAX_IMAGE_SIZE) throw new MediaError('20MB보다 큰 사진은 올릴 수 없어요.')
  try {
    return (await compressImage(blob, PHOTO_COMPRESSION)).blob
  } catch {
    throw new MediaError('이 사진은 열 수 없어요. 다른 사진을 골라 주세요.')
  }
}

const prepareVideo = async (blob: Blob, source: MediaSource, onProgress?: (progress: number) => void): Promise<Blob> => {
  // 화면 안 카메라 녹화는 이미 5초·1280px 이하다. 아이폰에서 못 트는 webm만 mp4로 바꾸고, 못 바꾸면 그대로 올린다
  if (source === 'camera') {
    if (blob.type === 'video/mp4' || !isVideoCompressionSupported()) return blob
    return toMp4(blob, onProgress).catch(() => blob)
  }

  if (blob.size > MAX_VIDEO_SIZE) throw new MediaError('영상이 너무 커요. 더 짧은 영상을 골라 주세요.')
  const duration = await getVideoDuration(blob)
  const fitsLength = duration !== null && duration <= VIDEO_MAX_SECONDS + DURATION_TOLERANCE_SEC
  // 5초 이하 mp4는 그대로 올린다. 그 밖(긴 영상, 아이폰 mov 등)은 앞 5초만 mp4로 바꾼다
  if (fitsLength && blob.type === 'video/mp4') return blob
  if (isVideoCompressionSupported()) {
    try {
      return await toMp4(blob, onProgress)
    } catch {
      // 바꾸지 못하면 아래에서 길이만 보고 정한다
    }
  }
  if (fitsLength) return blob
  throw new MediaError(`${VIDEO_MAX_SECONDS}초가 넘는 영상은 올릴 수 없어요. ${VIDEO_MAX_SECONDS}초 이하로 골라 주세요.`)
}

// 찍거나 고른 사진·영상을 올릴 수 있는 모양으로 다듬는다
export const prepareMedia = async (
  blob: Blob,
  source: MediaSource,
  onProgress?: (progress: number) => void
): Promise<PreparedMedia> => {
  const mediaType = mediaTypeOf(blob)
  if (mediaType === 'IMAGE') return { blob: await preparePhoto(blob, source), mediaType }
  if (mediaType === 'VIDEO') return { blob: await prepareVideo(blob, source, onProgress), mediaType }
  throw new MediaError('사진이나 영상만 올릴 수 있어요.')
}
