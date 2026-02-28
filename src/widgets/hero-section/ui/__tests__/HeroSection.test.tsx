import { render, screen } from '@testing-library/react'
import { HeroSection } from '../HeroSection'

jest.mock('../TableOfContents', () => ({
  TableOfContents: () => null,
}))

jest.mock('../../model/useScrollVisibility', () => ({
  useScrollVisibility: () => false,
}))

describe('HeroSection', () => {
  it('"더 알아보기" 버튼이 존재하지 않는다', () => {
    render(<HeroSection />)

    expect(screen.queryByText('더 알아보기')).not.toBeInTheDocument()
  })
})
