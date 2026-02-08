import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditProfileModal } from '../EditProfileModal'

// Radix Dialog는 Portal을 사용하므로 모킹
jest.mock('@radix-ui/react-dialog', () => {
  const actual = jest.requireActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('EditProfileModal', () => {
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderModal = (open = true) => {
    return render(
      <EditProfileModal open={open} onOpenChange={mockOnOpenChange} />
    )
  }

  it('open=true일 때 모달 제목을 렌더링한다', () => {
    renderModal()

    expect(screen.getByText('내 정보 수정')).toBeInTheDocument()
    expect(
      screen.getByText('GNTC-YOUTH 회원 정보를 수정할 수 있습니다')
    ).toBeInTheDocument()
  })

  it('모든 폼 필드 라벨을 렌더링한다', () => {
    renderModal()

    expect(screen.getByText(/이름/)).toBeInTheDocument()
    expect(screen.getByText(/성전/)).toBeInTheDocument()
    expect(screen.getByText(/기수/)).toBeInTheDocument()
    expect(screen.getByText('전화번호')).toBeInTheDocument()
    expect(screen.getByText(/성별/)).toBeInTheDocument()
  })

  it('이름 입력 필드에 값을 입력할 수 있다', async () => {
    const user = userEvent.setup()
    renderModal()

    const nameInput = screen.getByPlaceholderText('이름을 입력하세요')
    await user.type(nameInput, '홍길동')

    expect(nameInput).toHaveValue('홍길동')
  })

  it('성전 입력 필드에 값을 입력할 수 있다', async () => {
    const user = userEvent.setup()
    renderModal()

    const templeInput = screen.getByPlaceholderText('성전을 입력하세요')
    await user.type(templeInput, '서울 성전')

    expect(templeInput).toHaveValue('서울 성전')
  })

  it('기수 입력 필드에 값을 입력할 수 있다', async () => {
    const user = userEvent.setup()
    renderModal()

    const generationInput = screen.getByPlaceholderText('기수를 입력하세요')
    await user.type(generationInput, '15기')

    expect(generationInput).toHaveValue('15기')
  })

  it('전화번호 입력 필드에 값을 입력할 수 있다', async () => {
    const user = userEvent.setup()
    renderModal()

    const phoneInput = screen.getByPlaceholderText('010-0000-0000')
    await user.type(phoneInput, '010-1234-5678')

    expect(phoneInput).toHaveValue('010-1234-5678')
  })

  it('성별 선택 카드(형제/자매)를 렌더링한다', () => {
    renderModal()

    expect(screen.getByText('형제')).toBeInTheDocument()
    expect(screen.getByText('자매')).toBeInTheDocument()
  })

  it('성별 카드를 클릭하면 선택 상태가 변경된다', async () => {
    const user = userEvent.setup()
    renderModal()

    const maleCard = screen.getByTestId('gender-male')
    await user.click(maleCard)

    expect(maleCard.className).toContain('border-[#3B5BDB]')
  })

  it('취소 버튼 클릭 시 onOpenChange(false)를 호출한다', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByText('취소'))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('저장하기 버튼 클릭 시 폼 데이터를 console.log하고 모달을 닫는다', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    renderModal()

    await user.click(screen.getByText('저장하기'))

    expect(consoleSpy).toHaveBeenCalledWith(
      '프로필 저장 데이터:',
      expect.objectContaining({
        name: '',
        temple: '',
        generation: '',
        phone: '',
        gender: null,
      })
    )
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)

    consoleSpy.mockRestore()
  })

  it('취소 버튼과 저장하기 버튼을 렌더링한다', () => {
    renderModal()

    expect(screen.getByText('취소')).toBeInTheDocument()
    expect(screen.getByText('저장하기')).toBeInTheDocument()
  })
})
