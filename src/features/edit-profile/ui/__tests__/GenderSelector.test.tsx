import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenderSelector } from '../GenderSelector'

describe('GenderSelector', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('형제와 자매 카드 2개를 렌더링한다', () => {
    render(<GenderSelector value={null} onChange={mockOnChange} />)

    expect(screen.getByText('형제')).toBeInTheDocument()
    expect(screen.getByText('자매')).toBeInTheDocument()
  })

  it('형제 카드 클릭 시 onChange("male")를 호출한다', async () => {
    const user = userEvent.setup()
    render(<GenderSelector value={null} onChange={mockOnChange} />)

    await user.click(screen.getByTestId('gender-male'))

    expect(mockOnChange).toHaveBeenCalledWith('male')
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('자매 카드 클릭 시 onChange("female")를 호출한다', async () => {
    const user = userEvent.setup()
    render(<GenderSelector value={null} onChange={mockOnChange} />)

    await user.click(screen.getByTestId('gender-female'))

    expect(mockOnChange).toHaveBeenCalledWith('female')
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('male 선택 시 형제 카드에 활성 스타일이 적용된다', () => {
    render(<GenderSelector value="male" onChange={mockOnChange} />)

    const maleCard = screen.getByTestId('gender-male')
    const femaleCard = screen.getByTestId('gender-female')

    expect(maleCard.className).toContain('border-[#3B5BDB]')
    expect(femaleCard.className).not.toContain('border-[#3B5BDB]')
  })

  it('female 선택 시 자매 카드에 활성 스타일이 적용된다', () => {
    render(<GenderSelector value="female" onChange={mockOnChange} />)

    const maleCard = screen.getByTestId('gender-male')
    const femaleCard = screen.getByTestId('gender-female')

    expect(femaleCard.className).toContain('border-[#3B5BDB]')
    expect(maleCard.className).not.toContain('border-[#3B5BDB]')
  })

  it('아무것도 선택되지 않았을 때 두 카드 모두 비활성 스타일이다', () => {
    render(<GenderSelector value={null} onChange={mockOnChange} />)

    const maleCard = screen.getByTestId('gender-male')
    const femaleCard = screen.getByTestId('gender-female')

    expect(maleCard.className).toContain('border-gray-200')
    expect(femaleCard.className).toContain('border-gray-200')
  })
})
