import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryWritePage } from '../GalleryWritePage'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

let mockAuthValue = { user: null as { id: number; name: string; role?: string } | null, isLoggedIn: false }

jest.mock('../../../../features/auth', () => ({
  useAuth: () => mockAuthValue,
}))

jest.mock('../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

const mockHandleSubmit = jest.fn()
const mockSetSelectedCategory = jest.fn()
const mockSetSelectedSubCategory = jest.fn()
const mockSetContent = jest.fn()
const mockAddHashtag = jest.fn()
const mockRemoveHashtag = jest.fn()
const mockToggleChurch = jest.fn()
const mockAddImages = jest.fn()
const mockRemoveImage = jest.fn()

const defaultWriteHook = {
  categories: [{ name: 'RETREAT', displayName: '수련회' }],
  subCategories: [{ name: 'RETREAT_2026_WINTER', displayName: '2026 겨울 수련회' }],
  selectedCategory: '',
  setSelectedCategory: mockSetSelectedCategory,
  selectedSubCategory: '',
  setSelectedSubCategory: mockSetSelectedSubCategory,
  content: '',
  setContent: mockSetContent,
  hashtags: [] as string[],
  addHashtag: mockAddHashtag,
  removeHashtag: mockRemoveHashtag,
  selectedChurches: [] as string[],
  toggleChurch: mockToggleChurch,
  images: [] as never[],
  addImages: mockAddImages,
  removeImage: mockRemoveImage,
  churches: [
    { code: 'ANYANG', name: '안양' },
    { code: 'SUWON', name: '수원' },
  ],
  churchesLoading: false,
  handleSubmit: mockHandleSubmit,
  isSubmitting: false,
  submitError: null as string | null,
}

let mockWriteHookValue = { ...defaultWriteHook }

jest.mock('../../model/useGalleryWrite', () => ({
  useGalleryWrite: () => mockWriteHookValue,
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockAuthValue = { user: { id: 1, name: '홍길동', role: 'USER' }, isLoggedIn: true }
  mockWriteHookValue = { ...defaultWriteHook }
})

describe('GalleryWritePage 인증 가드', () => {
  it('비로그인 시 로그인 안내 메시지를 표시한다', () => {
    mockAuthValue = { user: null, isLoggedIn: false }

    render(<GalleryWritePage />)

    expect(screen.getByText('로그인이 필요한 서비스입니다.')).toBeInTheDocument()
    expect(screen.getByText('로그인하기')).toBeInTheDocument()
  })

  it('로그인하기 버튼 클릭 시 로그인 페이지로 이동한다', async () => {
    mockAuthValue = { user: null, isLoggedIn: false }

    render(<GalleryWritePage />)

    await userEvent.click(screen.getByText('로그인하기'))

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})

describe('GalleryWritePage 페이지 헤더', () => {
  it('페이지 타이틀이 표시된다', () => {
    render(<GalleryWritePage />)

    expect(screen.getByText('게시글 작성')).toBeInTheDocument()
  })

  it('돌아가기 버튼이 표시된다', () => {
    render(<GalleryWritePage />)

    expect(screen.getByText('갤러리로 돌아가기')).toBeInTheDocument()
  })

  it('돌아가기 버튼 클릭 시 갤러리 페이지로 이동한다', async () => {
    render(<GalleryWritePage />)

    await userEvent.click(screen.getByText('갤러리로 돌아가기'))

    expect(mockNavigate).toHaveBeenCalledWith('/gallery')
  })
})

describe('GalleryWritePage 카테고리 선택', () => {
  it('카테고리와 세부 카테고리 셀렉트가 표시된다', () => {
    render(<GalleryWritePage />)

    expect(screen.getByText('카테고리 *')).toBeInTheDocument()
    expect(screen.getByText('카테고리 선택')).toBeInTheDocument()
    expect(screen.getByText('세부 카테고리 선택')).toBeInTheDocument()
  })

  it('카테고리 옵션이 표시된다', () => {
    render(<GalleryWritePage />)

    expect(screen.getByText('수련회')).toBeInTheDocument()
  })

  it('카테고리 선택 시 setSelectedCategory가 호출된다', async () => {
    render(<GalleryWritePage />)

    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'RETREAT')

    expect(mockSetSelectedCategory).toHaveBeenCalledWith('RETREAT')
  })

  it('카테고리 미선택 시 세부 카테고리가 비활성화된다', () => {
    render(<GalleryWritePage />)

    const selects = screen.getAllByRole('combobox')
    expect(selects[1]).toBeDisabled()
  })

  it('카테고리 선택 후 세부 카테고리가 활성화된다', () => {
    mockWriteHookValue = { ...defaultWriteHook, selectedCategory: 'RETREAT' }

    render(<GalleryWritePage />)

    const selects = screen.getAllByRole('combobox')
    expect(selects[1]).not.toBeDisabled()
  })
})

describe('GalleryWritePage 이미지 업로드 영역', () => {
  it('USER 역할일 때 이미지 업로드 권한 안내를 표시한다', () => {
    mockAuthValue = { user: { id: 1, name: '홍길동', role: 'USER' }, isLoggedIn: true }

    render(<GalleryWritePage />)

    expect(screen.getByText('이미지 업로드는 리더 이상 권한이 필요합니다.')).toBeInTheDocument()
  })

  it('LEADER 역할일 때 이미지 업로드 영역을 표시한다', () => {
    mockAuthValue = { user: { id: 1, name: '홍길동', role: 'LEADER' }, isLoggedIn: true }

    render(<GalleryWritePage />)

    expect(screen.getByText('클릭하거나 이미지를 드래그하여 업로드')).toBeInTheDocument()
  })

  it('MASTER 역할일 때 이미지 업로드 영역을 표시한다', () => {
    mockAuthValue = { user: { id: 1, name: '홍길동', role: 'MASTER' }, isLoggedIn: true }

    render(<GalleryWritePage />)

    expect(screen.getByText('클릭하거나 이미지를 드래그하여 업로드')).toBeInTheDocument()
  })
})

describe('GalleryWritePage 본문 입력', () => {
  it('내용 입력 필드가 표시된다', () => {
    render(<GalleryWritePage />)

    expect(screen.getByPlaceholderText('내용을 입력해주세요...')).toBeInTheDocument()
  })
})

describe('GalleryWritePage 해시태그', () => {
  it('해시태그 입력 필드가 표시된다', () => {
    render(<GalleryWritePage />)

    expect(screen.getByPlaceholderText('태그 입력 후 Enter')).toBeInTheDocument()
  })

  it('Enter 키로 해시태그를 추가할 수 있다', async () => {
    render(<GalleryWritePage />)

    const input = screen.getByPlaceholderText('태그 입력 후 Enter')
    await userEvent.type(input, '수련회{Enter}')

    expect(mockAddHashtag).toHaveBeenCalledWith('수련회')
  })

  it('해시태그 칩이 표시된다', () => {
    mockWriteHookValue = { ...defaultWriteHook, hashtags: ['수련회', '은혜'] }

    render(<GalleryWritePage />)

    expect(screen.getByText('#수련회')).toBeInTheDocument()
    expect(screen.getByText('#은혜')).toBeInTheDocument()
  })
})

describe('GalleryWritePage 성전 태그', () => {
  it('성전 태그 섹션과 선택하기 버튼이 표시된다', () => {
    render(<GalleryWritePage />)

    expect(screen.getByText('성전 태그')).toBeInTheDocument()
    expect(screen.getByText('선택하기')).toBeInTheDocument()
  })

  it('선택하기 클릭 시 성전 목록이 표시된다', async () => {
    render(<GalleryWritePage />)

    await userEvent.click(screen.getByText('선택하기'))

    expect(screen.getByText('안양')).toBeInTheDocument()
    expect(screen.getByText('수원')).toBeInTheDocument()
  })

  it('성전 체크박스 클릭 시 toggleChurch가 호출된다', async () => {
    render(<GalleryWritePage />)

    await userEvent.click(screen.getByText('선택하기'))
    await userEvent.click(screen.getByLabelText('안양'))

    expect(mockToggleChurch).toHaveBeenCalledWith('ANYANG')
  })
})

describe('GalleryWritePage 제출', () => {
  it('세부 카테고리 미선택 시 등록 버튼이 비활성화된다', () => {
    render(<GalleryWritePage />)

    const submitButton = screen.getByRole('button', { name: '게시글 등록' })
    expect(submitButton).toBeDisabled()
  })

  it('세부 카테고리 선택 시 등록 버튼이 활성화된다', () => {
    mockWriteHookValue = { ...defaultWriteHook, selectedSubCategory: 'RETREAT_2026_WINTER' }

    render(<GalleryWritePage />)

    const submitButton = screen.getByRole('button', { name: '게시글 등록' })
    expect(submitButton).not.toBeDisabled()
  })

  it('등록 중일 때 버튼 텍스트가 변경된다', () => {
    mockWriteHookValue = {
      ...defaultWriteHook,
      selectedSubCategory: 'RETREAT_2026_WINTER',
      isSubmitting: true,
    }

    render(<GalleryWritePage />)

    expect(screen.getByText('등록 중...')).toBeInTheDocument()
  })

  it('에러 메시지가 표시된다', () => {
    mockWriteHookValue = {
      ...defaultWriteHook,
      submitError: '카테고리를 선택해주세요.',
    }

    render(<GalleryWritePage />)

    expect(screen.getByText('카테고리를 선택해주세요.')).toBeInTheDocument()
  })

  it('폼 제출 시 handleSubmit이 호출된다', async () => {
    mockWriteHookValue = { ...defaultWriteHook, selectedSubCategory: 'RETREAT_2026_WINTER' }

    render(<GalleryWritePage />)

    await userEvent.click(screen.getByRole('button', { name: '게시글 등록' }))

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1)
  })
})
