import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileCompletionModal } from '../ProfileCompletionModal'

jest.mock('@radix-ui/react-dialog', () => {
  const actual = jest.requireActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('ProfileCompletionModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  it('모달이 열리면 안내 텍스트가 표시된다', () => {
    render(<ProfileCompletionModal {...defaultProps} />)

    expect(screen.getByText('프로필을 완성해보세요!')).toBeInTheDocument()
    expect(screen.getByText('아직 작성되지 않은 프로필이 있어요')).toBeInTheDocument()
    expect(screen.getByText('지금 완성해서 더 많은 기능을 이용해보세요')).toBeInTheDocument()
  })

  it('"네, 작성할게요" 클릭 시 onConfirm과 onOpenChange를 호출한다', async () => {
    const user = userEvent.setup()
    render(<ProfileCompletionModal {...defaultProps} />)

    await user.click(screen.getByText('네, 작성할게요'))

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })

  it('"다음에 할게요" 클릭 시 sessionStorage에 기록하고 모달을 닫는다', async () => {
    const user = userEvent.setup()
    render(<ProfileCompletionModal {...defaultProps} />)

    await user.click(screen.getByText('다음에 할게요'))

    expect(sessionStorage.getItem('profileCompletionDismissed')).toBe('true')
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('open이 false이면 모달이 표시되지 않는다', () => {
    render(<ProfileCompletionModal {...defaultProps} open={false} />)

    expect(screen.queryByText('프로필을 완성해보세요!')).not.toBeInTheDocument()
  })
})
