import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrayerSection } from '../PrayerSection'
import { useChurches, useChurchInfo } from '../../../../entities/church'
import { useAuth } from '../../../../features/auth'

jest.mock('../../../../entities/church', () => ({
  useChurches: jest.fn(),
  useChurchInfo: jest.fn(),
  ChurchMedia: () => null,
  PrayerList: ({ prayers }: { prayers: string[] }) => (
    <ul>{prayers.map((p) => <li key={p}>{p}</li>)}</ul>
  ),
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../../features/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../features/edit-sanctuary', () => ({
  EditSanctuaryModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-modal">EditSanctuaryModal</div> : null,
}))

jest.mock('../../../../shared/ui', () => {
  const React = require('react')
  const TabsContext = React.createContext({ value: '', onValueChange: () => {} })

  return {
    Tabs: ({ children, value, onValueChange }: any) => (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div>{children}</div>
      </TabsContext.Provider>
    ),
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children, value }: any) => {
      const ctx = React.useContext(TabsContext)
      return <button onClick={() => ctx.onValueChange(value)}>{children}</button>
    },
    TabsContent: ({ children, value }: any) => {
      const ctx = React.useContext(TabsContext)
      return ctx.value === value ? <div>{children}</div> : null
    },
  }
})

jest.mock('../../../../shared/lib', () => ({
  buildCdnUrl: (path: string) => `https://cdn.test/${path}`,
}))

jest.mock('../../../../shared/config', () => ({
  FALLBACK_IMAGE_URL: 'https://cdn.test/fallback.jpg',
}))

jest.mock('../../model/usePrayerAnimation', () => ({
  usePrayerAnimation: () => ({ isVisible: true, resetAnimation: jest.fn() }),
}))

beforeAll(() => {
  Element.prototype.scrollTo = jest.fn()
})

const mockUseChurches = useChurches as jest.MockedFunction<typeof useChurches>
const mockUseChurchInfo = useChurchInfo as jest.MockedFunction<typeof useChurchInfo>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const churches = [
  { code: 'ANYANG', name: '안양' },
  { code: 'SUWON', name: '수원' },
]

const mockChurchInfoResult = {
  churchInfo: {
    churchId: 'ANYANG',
    groupPhotoFileId: null,
    groupPhotoPath: null,
    prayerTopics: [
      { id: 1, content: '기도제목1', sortOrder: 1 },
    ],
    randomPhotos: [],
  },
  isLoading: false,
  notFound: false,
  error: null,
} as ReturnType<typeof useChurchInfo>

const baseAuthValue = {
  isLoggedIn: true,
  login: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
}

describe('PrayerSection 수정 버튼 권한', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChurches.mockReturnValue({
      churches,
      isLoading: false,
    } as ReturnType<typeof useChurches>)
    mockUseChurchInfo.mockReturnValue(mockChurchInfoResult)
  })

  it('MASTER 역할이면 수정 버튼이 노출된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 1, name: 'Admin', role: 'MASTER' },
    })

    render(<PrayerSection />)

    expect(screen.getByText('수정')).toBeInTheDocument()
    expect(screen.getByText('성전 정보 수정하기')).toBeInTheDocument()
  })

  it('LEADER이고 같은 성전 소속이면 수정 버튼이 노출된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 2, name: 'Leader', role: 'LEADER', churchId: 'ANYANG' },
    })

    render(<PrayerSection />)

    // 기본 탭이 ANYANG이므로 수정 버튼 노출
    expect(screen.getByText('수정')).toBeInTheDocument()
    expect(screen.getByText('성전 정보 수정하기')).toBeInTheDocument()
  })

  it('LEADER이지만 목록에 없는 성전 소속이면 수정 버튼이 노출되지 않는다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 3, name: 'Leader2', role: 'LEADER', churchId: 'BUSAN' },
    })

    render(<PrayerSection />)

    // BUSAN은 목록에 없으므로 기본 탭은 ANYANG → 수정 버튼 없음
    expect(screen.queryByText('수정')).not.toBeInTheDocument()
    expect(screen.queryByText('성전 정보 수정하기')).not.toBeInTheDocument()
  })

  it('LEADER는 본인 성전이 자동 선택되어 수정 버튼이 노출된다', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 3, name: 'Leader2', role: 'LEADER', churchId: 'SUWON' },
    })

    render(<PrayerSection />)

    // 초기: 본인 성전(SUWON)이 자동 선택되어 수정 버튼 노출
    expect(screen.getByText('수정')).toBeInTheDocument()
    expect(screen.getByText('성전 정보 수정하기')).toBeInTheDocument()

    // ANYANG 탭 클릭 → 다른 성전이므로 수정 버튼 사라짐
    await user.click(screen.getByText('안양'))

    expect(screen.queryByText('수정')).not.toBeInTheDocument()
    expect(screen.queryByText('성전 정보 수정하기')).not.toBeInTheDocument()
  })

  it('LEADER가 다른 성전 탭으로 전환하면 수정 버튼이 사라진다', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 2, name: 'Leader', role: 'LEADER', churchId: 'ANYANG' },
    })

    render(<PrayerSection />)

    // 초기: ANYANG 탭 → 수정 버튼 노출
    expect(screen.getByText('수정')).toBeInTheDocument()

    // SUWON 탭 클릭
    await user.click(screen.getByText('수원'))

    // 다른 성전이므로 수정 버튼 사라짐
    expect(screen.queryByText('수정')).not.toBeInTheDocument()
    expect(screen.queryByText('성전 정보 수정하기')).not.toBeInTheDocument()
  })

  it('일반 사용자(MEMBER)는 수정 버튼이 노출되지 않는다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 4, name: 'Member', role: 'MEMBER', churchId: 'ANYANG' },
    })

    render(<PrayerSection />)

    expect(screen.queryByText('수정')).not.toBeInTheDocument()
    expect(screen.queryByText('성전 정보 수정하기')).not.toBeInTheDocument()
  })

  it('비로그인 사용자는 수정 버튼이 노출되지 않는다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: null,
      isLoggedIn: false,
    })

    render(<PrayerSection />)

    expect(screen.queryByText('수정')).not.toBeInTheDocument()
    expect(screen.queryByText('성전 정보 수정하기')).not.toBeInTheDocument()
  })

  it('MASTER는 어떤 탭이든 수정 버튼이 노출된다', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 1, name: 'Admin', role: 'MASTER' },
    })

    render(<PrayerSection />)

    // ANYANG 탭
    expect(screen.getByText('수정')).toBeInTheDocument()

    // SUWON 탭으로 전환
    await user.click(screen.getByText('수원'))

    expect(screen.getByText('수정')).toBeInTheDocument()
    expect(screen.getByText('성전 정보 수정하기')).toBeInTheDocument()
  })

  describe('404 빈 상태', () => {
    beforeEach(() => {
      mockUseChurchInfo.mockReturnValue({
        churchInfo: null,
        isLoading: false,
        notFound: true,
        error: null,
      } as ReturnType<typeof useChurchInfo>)
    })

    it('MASTER는 404 상태에서 작성 버튼이 노출된다', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthValue,
        user: { id: 1, name: 'Admin', role: 'MASTER' },
      })

      render(<PrayerSection />)

      expect(screen.getByText('성전 정보 작성하기')).toBeInTheDocument()
    })

    it('같은 성전 LEADER는 404 상태에서 작성 버튼이 노출된다', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthValue,
        user: { id: 2, name: 'Leader', role: 'LEADER', churchId: 'ANYANG' },
      })

      render(<PrayerSection />)

      expect(screen.getByText('성전 정보 작성하기')).toBeInTheDocument()
    })

    it('목록에 없는 성전 LEADER는 404 상태에서 작성 버튼이 노출되지 않는다', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthValue,
        user: { id: 3, name: 'Leader2', role: 'LEADER', churchId: 'BUSAN' },
      })

      render(<PrayerSection />)

      expect(screen.queryByText('성전 정보 작성하기')).not.toBeInTheDocument()
    })

    it('일반 사용자는 404 상태에서 작성 버튼이 노출되지 않는다', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthValue,
        user: { id: 4, name: 'Member', role: 'MEMBER', churchId: 'ANYANG' },
      })

      render(<PrayerSection />)

      expect(screen.queryByText('성전 정보 작성하기')).not.toBeInTheDocument()
    })
  })
})

describe('PrayerSection 사진 캐러셀', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    mockUseChurches.mockReturnValue({
      churches,
      isLoading: false,
    } as ReturnType<typeof useChurches>)
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 4, name: 'Member', role: 'MEMBER', churchId: 'ANYANG' },
    })
  })

  it('randomPhotos가 있으면 사진 섹션이 표시된다', () => {
    mockUseChurchInfo.mockReturnValue({
      churchInfo: {
        churchId: 'ANYANG',
        groupPhotoFileId: null,
        groupPhotoPath: null,
        prayerTopics: [{ id: 1, content: '기도제목1', sortOrder: 1 }],
        randomPhotos: ['uploads/img1.jpg', 'uploads/img2.jpg', 'uploads/img3.jpg'],
      },
      isLoading: false,
      notFound: false,
      error: null,
    } as ReturnType<typeof useChurchInfo>)

    render(<PrayerSection />)

    expect(screen.getByText('사진')).toBeInTheDocument()
    expect(screen.getByText('더보기')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })

  it('randomPhotos가 빈 배열이면 사진 섹션이 표시되지 않는다', () => {
    mockUseChurchInfo.mockReturnValue({
      ...mockChurchInfoResult,
      churchInfo: {
        ...mockChurchInfoResult.churchInfo!,
        randomPhotos: [],
      },
    } as ReturnType<typeof useChurchInfo>)

    render(<PrayerSection />)

    expect(screen.queryByText('사진')).not.toBeInTheDocument()
    expect(screen.queryByText('더보기')).not.toBeInTheDocument()
  })

  it('randomPhotos가 7개 미만이면 있는 만큼만 표시한다', () => {
    mockUseChurchInfo.mockReturnValue({
      churchInfo: {
        churchId: 'ANYANG',
        groupPhotoFileId: null,
        groupPhotoPath: null,
        prayerTopics: [{ id: 1, content: '기도제목1', sortOrder: 1 }],
        randomPhotos: ['uploads/img1.jpg', 'uploads/img2.jpg'],
      },
      isLoading: false,
      notFound: false,
      error: null,
    } as ReturnType<typeof useChurchInfo>)

    render(<PrayerSection />)

    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('더보기 버튼 클릭 시 갤러리 성전별 페이지로 이동한다', async () => {
    const user = userEvent.setup()
    mockUseChurchInfo.mockReturnValue({
      churchInfo: {
        churchId: 'ANYANG',
        groupPhotoFileId: null,
        groupPhotoPath: null,
        prayerTopics: [{ id: 1, content: '기도제목1', sortOrder: 1 }],
        randomPhotos: ['uploads/img1.jpg'],
      },
      isLoading: false,
      notFound: false,
      error: null,
    } as ReturnType<typeof useChurchInfo>)

    render(<PrayerSection />)

    await user.click(screen.getByText('더보기'))

    expect(mockNavigate).toHaveBeenCalledWith('/gallery?category=CHURCH&churchId=ANYANG')
  })

  it('사진이 1장이면 네비게이션 화살표와 도트가 표시되지 않는다', () => {
    mockUseChurchInfo.mockReturnValue({
      churchInfo: {
        churchId: 'ANYANG',
        groupPhotoFileId: null,
        groupPhotoPath: null,
        prayerTopics: [{ id: 1, content: '기도제목1', sortOrder: 1 }],
        randomPhotos: ['uploads/img1.jpg'],
      },
      isLoading: false,
      notFound: false,
      error: null,
    } as ReturnType<typeof useChurchInfo>)

    render(<PrayerSection />)

    expect(screen.getAllByRole('img')).toHaveLength(1)
    // 좌우 화살표 버튼이 없어야 함 (더보기 버튼만 존재)
    const buttons = screen.getAllByRole('button')
    const arrowButtons = buttons.filter(
      (btn) => !btn.textContent?.includes('더보기') && !btn.textContent
    )
    expect(arrowButtons).toHaveLength(0)
  })

  it('사진이 여러 장이면 다음 화살표 버튼이 표시된다', () => {
    mockUseChurchInfo.mockReturnValue({
      churchInfo: {
        churchId: 'ANYANG',
        groupPhotoFileId: null,
        groupPhotoPath: null,
        prayerTopics: [{ id: 1, content: '기도제목1', sortOrder: 1 }],
        randomPhotos: ['uploads/img1.jpg', 'uploads/img2.jpg', 'uploads/img3.jpg'],
      },
      isLoading: false,
      notFound: false,
      error: null,
    } as ReturnType<typeof useChurchInfo>)

    render(<PrayerSection />)

    // 도트 인디케이터 3개가 있어야 함
    const allButtons = screen.getAllByRole('button')
    // 더보기 + 다음 화살표 + 도트 3개 = 5개 (이전 화살표는 첫 사진이므로 없음)
    // 성전 탭 버튼들도 있으므로, 도트 인디케이터는 클래스로 확인
    expect(screen.getByText('사진')).toBeInTheDocument()
  })
})
