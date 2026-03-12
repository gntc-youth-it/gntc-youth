import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BibleVersePickerModal } from '../BibleVersePickerModal'
import { fetchBibleBooks, fetchChapterCount, fetchVerses } from '../../api/bibleApi'

jest.mock('@radix-ui/react-dialog', () => {
  const actual = jest.requireActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

jest.mock('../../api/bibleApi', () => ({
  fetchBibleBooks: jest.fn(),
  fetchChapterCount: jest.fn(),
  fetchVerses: jest.fn(),
}))

const mockFetchBooks = fetchBibleBooks as jest.MockedFunction<typeof fetchBibleBooks>
const mockFetchChapterCount = fetchChapterCount as jest.MockedFunction<typeof fetchChapterCount>
const mockFetchVerses = fetchVerses as jest.MockedFunction<typeof fetchVerses>

const mockBooks = [
  { bookCode: 'GENESIS', bookName: '창세기', order: 1 },
  { bookCode: 'EXODUS', bookName: '출애굽기', order: 2 },
  { bookCode: 'JOHN', bookName: '요한복음', order: 43 },
]

const mockVerses = [
  { verseId: 101, verseNumber: 1, content: '태초에 말씀이 계시니라' },
  { verseId: 102, verseNumber: 2, content: '그가 태초에 하나님과 함께 계셨고' },
  { verseId: 103, verseNumber: 3, content: '만물이 그로 말미암아 지은 바 되었으니' },
]

describe('BibleVersePickerModal', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchBooks.mockResolvedValue(mockBooks)
    mockFetchChapterCount.mockResolvedValue(21)
    mockFetchVerses.mockResolvedValue(mockVerses)
  })

  const renderModal = (open = true) => {
    return render(
      <BibleVersePickerModal
        open={open}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    )
  }

  describe('책 선택 단계', () => {
    it('모달이 열리면 성경 목록을 표시한다', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('창세기')).toBeInTheDocument()
        expect(screen.getByText('출애굽기')).toBeInTheDocument()
        expect(screen.getByText('요한복음')).toBeInTheDocument()
      })
    })

    it('제목과 설명을 표시한다', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('성경 선택')).toBeInTheDocument()
        expect(screen.getByText('주제 말씀으로 사용할 구절을 선택하세요')).toBeInTheDocument()
      })
    })

    it('로딩 중에는 로딩 표시를 보여준다', () => {
      mockFetchBooks.mockImplementation(() => new Promise(() => {}))
      renderModal()

      expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
    })

    it('API 에러 시 에러 메시지를 표시한다', async () => {
      mockFetchBooks.mockRejectedValue(new Error('네트워크 오류'))
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('성경 목록을 불러오지 못했습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('장 선택 단계', () => {
    it('책 클릭 시 해당 책의 장 선택 화면으로 이동한다', async () => {
      const user = userEvent.setup()
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('요한복음')).toBeInTheDocument()
      })

      await user.click(screen.getByText('요한복음'))

      await waitFor(() => {
        expect(mockFetchChapterCount).toHaveBeenCalledWith('JOHN')
        expect(screen.getByText('1장')).toBeInTheDocument()
        expect(screen.getByText('21장')).toBeInTheDocument()
      })

      expect(screen.getByText('요한복음 — 장 선택')).toBeInTheDocument()
    })

    it('장 정보 로드 실패 시 에러를 표시한다', async () => {
      mockFetchChapterCount.mockRejectedValue(new Error('실패'))
      const user = userEvent.setup()
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('창세기')).toBeInTheDocument()
      })

      await user.click(screen.getByText('창세기'))

      await waitFor(() => {
        expect(screen.getByText('장 정보를 불러오지 못했습니다.')).toBeInTheDocument()
      })
    })

    it('뒤로가기 버튼으로 책 선택 단계로 돌아간다', async () => {
      const user = userEvent.setup()
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('요한복음')).toBeInTheDocument()
      })

      await user.click(screen.getByText('요한복음'))

      await waitFor(() => {
        expect(screen.getByText('1장')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('뒤로가기'))

      await waitFor(() => {
        expect(screen.getByText('성경 선택')).toBeInTheDocument()
        expect(screen.getByText('창세기')).toBeInTheDocument()
      })
    })
  })

  describe('절 선택 단계', () => {
    const navigateToVerses = async (user: ReturnType<typeof userEvent.setup>) => {
      await waitFor(() => {
        expect(screen.getByText('요한복음')).toBeInTheDocument()
      })
      await user.click(screen.getByText('요한복음'))
      await waitFor(() => {
        expect(screen.getByText('1장')).toBeInTheDocument()
      })
      await user.click(screen.getByText('1장'))
    }

    it('장 클릭 시 해당 장의 절 목록을 표시한다', async () => {
      const user = userEvent.setup()
      renderModal()

      await navigateToVerses(user)

      await waitFor(() => {
        expect(mockFetchVerses).toHaveBeenCalledWith('JOHN', 1)
        expect(screen.getByText('태초에 말씀이 계시니라')).toBeInTheDocument()
        expect(screen.getByText('그가 태초에 하나님과 함께 계셨고')).toBeInTheDocument()
      })

      expect(screen.getByText('요한복음 1장 — 절 선택')).toBeInTheDocument()
    })

    it('절 클릭 시 onSelect 콜백이 호출되고 모달이 닫힌다', async () => {
      const user = userEvent.setup()
      renderModal()

      await navigateToVerses(user)

      await waitFor(() => {
        expect(screen.getByText('태초에 말씀이 계시니라')).toBeInTheDocument()
      })

      await user.click(screen.getByText('태초에 말씀이 계시니라'))

      expect(mockOnSelect).toHaveBeenCalledWith({
        verseId: 101,
        bookCode: 'JOHN',
        bookName: '요한복음',
        chapter: 1,
        verseNumber: 1,
        content: '태초에 말씀이 계시니라',
      })
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('말씀 로드 실패 시 에러를 표시한다', async () => {
      mockFetchVerses.mockRejectedValue(new Error('실패'))
      const user = userEvent.setup()
      renderModal()

      await navigateToVerses(user)

      await waitFor(() => {
        expect(screen.getByText('말씀을 불러오지 못했습니다.')).toBeInTheDocument()
      })
    })

    it('뒤로가기로 장 선택 단계로 돌아간다', async () => {
      const user = userEvent.setup()
      renderModal()

      await navigateToVerses(user)

      await waitFor(() => {
        expect(screen.getByText('태초에 말씀이 계시니라')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('뒤로가기'))

      await waitFor(() => {
        expect(screen.getByText('1장')).toBeInTheDocument()
        expect(screen.queryByText('태초에 말씀이 계시니라')).not.toBeInTheDocument()
      })
    })
  })

  describe('모달 상태 초기화', () => {
    it('모달이 닫혀 있으면 API를 호출하지 않는다', () => {
      renderModal(false)

      expect(mockFetchBooks).not.toHaveBeenCalled()
    })
  })
})
