import { isVideoUrl, getMediaType, buildCdnUrl } from '../media'

describe('isVideoUrl', () => {
  it('mp4 확장자는 true를 반환한다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.mp4')).toBe(true)
  })

  it('mov 확장자는 true를 반환한다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.mov')).toBe(true)
  })

  it('webm 확장자는 true를 반환한다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.webm')).toBe(true)
  })

  it('jpg 확장자는 false를 반환한다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.jpg')).toBe(false)
  })

  it('webp 확장자는 false를 반환한다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.webp')).toBe(false)
  })

  it('png 확장자는 false를 반환한다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.png')).toBe(false)
  })

  it('쿼리 파라미터가 있어도 확장자를 올바르게 판별한다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.mp4?v=123')).toBe(true)
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.jpg?v=123')).toBe(false)
  })

  it('대소문자를 구분하지 않는다', () => {
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.MP4')).toBe(true)
    expect(isVideoUrl('https://cdn.gntc-youth.com/assets/test.Mov')).toBe(true)
  })
})

describe('getMediaType', () => {
  it('영상 URL이면 video를 반환한다', () => {
    expect(getMediaType('https://cdn.gntc-youth.com/assets/test.mp4')).toBe('video')
  })

  it('이미지 URL이면 image를 반환한다', () => {
    expect(getMediaType('https://cdn.gntc-youth.com/assets/test.jpg')).toBe('image')
  })
})

describe('buildCdnUrl', () => {
  it('슬래시 없는 경로에 슬래시를 추가한다', () => {
    expect(buildCdnUrl('assets/2025-anyang-youth.mp4')).toBe(
      'https://cdn.gntc-youth.com/assets/2025-anyang-youth.mp4'
    )
  })

  it('슬래시로 시작하는 경로를 그대로 사용한다', () => {
    expect(buildCdnUrl('/assets/2025-anyang-youth.mp4')).toBe(
      'https://cdn.gntc-youth.com/assets/2025-anyang-youth.mp4'
    )
  })

  it('이중 슬래시를 단일 슬래시로 정규화한다', () => {
    expect(buildCdnUrl('//assets/2025-anyang-youth.mp4')).toBe(
      'https://cdn.gntc-youth.com/assets/2025-anyang-youth.mp4'
    )
  })

  it('여러 개의 선행 슬래시를 단일 슬래시로 정규화한다', () => {
    expect(buildCdnUrl('///assets/test.jpg')).toBe(
      'https://cdn.gntc-youth.com/assets/test.jpg'
    )
  })
})
