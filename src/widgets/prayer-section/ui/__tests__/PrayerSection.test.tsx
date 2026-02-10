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
  buildCdnUrl: (path: string) => `https://cdn.test${path}`,
}))

jest.mock('../../model/usePrayerAnimation', () => ({
  usePrayerAnimation: () => ({ isVisible: true, resetAnimation: jest.fn() }),
}))

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

  it('LEADER이지만 다른 성전 소속이면 수정 버튼이 노출되지 않는다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 3, name: 'Leader2', role: 'LEADER', churchId: 'SUWON' },
    })

    render(<PrayerSection />)

    // 기본 탭이 ANYANG인데 사용자는 SUWON 소속
    expect(screen.queryByText('수정')).not.toBeInTheDocument()
    expect(screen.queryByText('성전 정보 수정하기')).not.toBeInTheDocument()
  })

  it('LEADER가 자기 성전 탭으로 전환하면 수정 버튼이 노출된다', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 3, name: 'Leader2', role: 'LEADER', churchId: 'SUWON' },
    })

    render(<PrayerSection />)

    // 초기: ANYANG 탭 → 수정 버튼 없음
    expect(screen.queryByText('수정')).not.toBeInTheDocument()

    // SUWON 탭 클릭
    await user.click(screen.getByText('수원'))

    // 자기 성전 탭이므로 수정 버튼 노출
    expect(screen.getByText('수정')).toBeInTheDocument()
    expect(screen.getByText('성전 정보 수정하기')).toBeInTheDocument()
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

    it('다른 성전 LEADER는 404 상태에서 작성 버튼이 노출되지 않는다', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthValue,
        user: { id: 3, name: 'Leader2', role: 'LEADER', churchId: 'SUWON' },
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
