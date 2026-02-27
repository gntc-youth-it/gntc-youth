import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditProfileModal } from '../EditProfileModal'
import { getMyProfile, saveProfile, getChurches } from '../../api'

// Radix Dialog는 Portal을 사용하므로 모킹
jest.mock('@radix-ui/react-dialog', () => {
  const actual = jest.requireActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

jest.mock('../../api', () => ({
  getMyProfile: jest.fn(),
  saveProfile: jest.fn(),
  getChurches: jest.fn(),
}))

jest.mock('../../../../shared/api', () => ({
  getFilePresignedUrl: jest.fn(),
}))

jest.mock('../../../../shared/lib', () => ({
  ...jest.requireActual('../../../../shared/lib'),
  compressImage: jest.fn(),
  uploadToS3: jest.fn(),
  buildCdnUrl: (path: string) => `https://cdn.gntc-youth.com/${path}`,
}))

jest.mock('../../../../shared/config', () => ({
  IMAGE_COMPRESSION_OPTIONS: { maxWidth: 1920, maxHeight: 1920, quality: 0.8 },
}))

const mockGetMyProfile = getMyProfile as jest.MockedFunction<typeof getMyProfile>
const mockSaveProfile = saveProfile as jest.MockedFunction<typeof saveProfile>
const mockGetChurches = getChurches as jest.MockedFunction<typeof getChurches>

const mockProfileResponse = {
  name: '홍길동',
  churchId: 'anyang',
  churchName: '안양',
  generation: 15,
  phoneNumber: '010-1234-5678',
  gender: 'MALE',
  genderDisplay: '형제',
  profileImageId: 10,
  profileImagePath: 'uploads/profile.jpg',
}

describe('EditProfileModal', () => {
  const mockOnOpenChange = jest.fn()

  const mockChurchesResponse = {
    churches: [
      { code: 'anyang', name: '안양' },
      { code: 'suwon', name: '수원' },
      { code: 'gwangju', name: '광주' },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetMyProfile.mockResolvedValue(mockProfileResponse)
    mockSaveProfile.mockResolvedValue(mockProfileResponse)
    mockGetChurches.mockResolvedValue(mockChurchesResponse)
  })

  const renderModal = (open = true) => {
    return render(
      <EditProfileModal open={open} onOpenChange={mockOnOpenChange} />
    )
  }

  it('open=true일 때 모달 제목을 렌더링한다', async () => {
    renderModal()

    expect(screen.getByText('내 정보 수정')).toBeInTheDocument()
    expect(
      screen.getByText('GNTC-YOUTH 회원 정보를 수정할 수 있습니다')
    ).toBeInTheDocument()
  })

  it('모달 열림 시 프로필 데이터를 불러온다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(mockGetMyProfile).toHaveBeenCalledTimes(1)
    expect(screen.getByDisplayValue('15')).toBeInTheDocument()
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument()
  })

  it('로딩 중일 때 로딩 표시를 보여준다', () => {
    mockGetMyProfile.mockImplementation(() => new Promise(() => {}))
    renderModal()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('프로필 불러오기 실패 시 에러 메시지를 표시한다', async () => {
    mockGetMyProfile.mockRejectedValue(new Error('Network error'))
    renderModal()

    await waitFor(() => {
      expect(screen.getByText('프로필 정보를 불러오는데 실패했습니다.')).toBeInTheDocument()
    })
  })

  it('모든 폼 필드 라벨을 렌더링한다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(screen.getByText(/이름/)).toBeInTheDocument()
    expect(screen.getAllByText(/성전/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/기수/)).toBeInTheDocument()
    expect(screen.getByText('전화번호')).toBeInTheDocument()
    expect(screen.getByText(/성별/)).toBeInTheDocument()
  })

  it('이름 입력 필드에 값을 수정할 수 있다', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('홍길동')
    await user.clear(nameInput)
    await user.type(nameInput, '김철수')

    expect(nameInput).toHaveValue('김철수')
  })

  it('성별 선택 카드(형제/자매)를 렌더링한다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(screen.getByText('형제')).toBeInTheDocument()
    expect(screen.getByText('자매')).toBeInTheDocument()
  })

  it('저장하기 버튼 클릭 시 saveProfile API를 호출한다', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    await user.click(screen.getByText('저장하기'))

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith({
        name: '홍길동',
        churchId: 'anyang',
        generation: 15,
        phoneNumber: '01012345678',
        gender: 'MALE',
        profileImageId: 10,
      })
    })

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('저장 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    mockSaveProfile.mockRejectedValue(new Error('Save failed'))
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    await user.click(screen.getByText('저장하기'))

    await waitFor(() => {
      expect(screen.getByText('프로필 저장에 실패했습니다.')).toBeInTheDocument()
    })

    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('취소 버튼 클릭 시 모달을 닫는다', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    await user.click(screen.getByText('취소'))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('취소 버튼과 저장하기 버튼을 렌더링한다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(screen.getByText('취소')).toBeInTheDocument()
    expect(screen.getByText('저장하기')).toBeInTheDocument()
  })

  it('성전 선택 드롭다운을 렌더링한다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(screen.getByText('성전을 선택하세요')).toBeInTheDocument()
  })

  it('API에서 불러온 성전 목록을 드롭다운에 렌더링한다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(screen.getByText('안양')).toBeInTheDocument()
    expect(screen.getByText('수원')).toBeInTheDocument()
    expect(screen.getByText('광주')).toBeInTheDocument()
  })

  it('성전 목록 API 실패 시 에러 메시지를 표시한다', async () => {
    mockGetChurches.mockRejectedValue(new Error('Network error'))
    renderModal()

    await waitFor(() => {
      expect(screen.getByText('프로필 정보를 불러오는데 실패했습니다.')).toBeInTheDocument()
    })
  })

  it('프로필 이미지가 있으면 이미지 프리뷰를 표시한다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    const img = screen.getByAltText('프로필 이미지')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://cdn.gntc-youth.com/uploads/profile.jpg')
  })

  it('프로필 이미지가 없으면 기본 아이콘을 표시한다', async () => {
    mockGetMyProfile.mockResolvedValue({
      ...mockProfileResponse,
      profileImageId: null,
      profileImagePath: null,
    })
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(screen.getByTestId('profile-image-fallback')).toBeInTheDocument()
  })

  it('프로필 사진 변경 버튼을 렌더링한다', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
    })

    expect(screen.getByText('프로필 사진 변경')).toBeInTheDocument()
  })
})
