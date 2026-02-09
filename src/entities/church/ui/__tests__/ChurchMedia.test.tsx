import { render, screen } from '@testing-library/react'
import { ChurchMedia } from '../ChurchMedia'

describe('ChurchMedia', () => {
  it('이미지 URL이면 img 태그를 렌더링한다', () => {
    render(
      <ChurchMedia
        mediaUrl="https://cdn.gntc-youth.com/uploads/anyang.jpg"
        churchName="안양"
      />
    )

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://cdn.gntc-youth.com/uploads/anyang.jpg')
    expect(img).toHaveAttribute('alt', '안양성전 청년봉사선교회')
  })

  it('webp 이미지도 img 태그를 렌더링한다', () => {
    render(
      <ChurchMedia
        mediaUrl="https://cdn.gntc-youth.com/uploads/suwon.webp"
        churchName="수원"
      />
    )

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })

  it('mp4 URL이면 video 태그를 렌더링한다', () => {
    const { container } = render(
      <ChurchMedia
        mediaUrl="https://cdn.gntc-youth.com/uploads/anyang.mp4"
        churchName="안양"
      />
    )

    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'https://cdn.gntc-youth.com/uploads/anyang.mp4')
    expect(video).toHaveAttribute('autoplay')
    expect(video).toHaveProperty('muted', true)
  })

  it('mov URL이면 video 태그를 렌더링한다', () => {
    const { container } = render(
      <ChurchMedia
        mediaUrl="https://cdn.gntc-youth.com/uploads/test.mov"
        churchName="테스트"
      />
    )

    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
  })

  it('webm URL이면 video 태그를 렌더링한다', () => {
    const { container } = render(
      <ChurchMedia
        mediaUrl="https://cdn.gntc-youth.com/uploads/test.webm"
        churchName="테스트"
      />
    )

    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
  })

  it('className이 적용된다', () => {
    render(
      <ChurchMedia
        mediaUrl="https://cdn.gntc-youth.com/uploads/test.jpg"
        churchName="테스트"
        className="custom-class"
      />
    )

    const img = screen.getByRole('img')
    expect(img.className).toContain('custom-class')
  })

  it('쿼리 파라미터가 있는 URL에서도 확장자를 올바르게 판별한다', () => {
    const { container } = render(
      <ChurchMedia
        mediaUrl="https://cdn.gntc-youth.com/uploads/test.mp4?v=123"
        churchName="테스트"
      />
    )

    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
  })
})
