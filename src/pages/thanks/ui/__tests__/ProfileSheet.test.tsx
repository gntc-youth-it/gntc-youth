import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpError } from '../../../../shared/api'
import { patchProfile } from '../../../../features/edit-profile'
import type { UserProfileResponse } from '../../../../features/edit-profile'
import { useProfilePhoto } from '../../model/useProfilePhoto'
import { ProfileSheet } from '../ProfileSheet'

jest.mock('../../../../features/edit-profile', () => ({
  patchProfile: jest.fn(),
  PROFILE_ERROR_CODE: { IMAGE_NOT_ATTACHABLE: 1106 },
}))

jest.mock('../../model/useProfilePhoto', () => ({
  useProfilePhoto: jest.fn(),
}))

const mockPatchProfile = patchProfile as jest.MockedFunction<typeof patchProfile>
const mockUseProfilePhoto = useProfilePhoto as jest.MockedFunction<typeof useProfilePhoto>

const noPhoto = { status: 'idle' as const, fileId: null, previewUrl: null, error: null, select: jest.fn() }
const newPhoto = { status: 'done' as const, fileId: 9, previewUrl: 'blob:me', error: null, select: jest.fn() }

const saved: UserProfileResponse = {
  name: '김하늘',
  churchId: null,
  churchName: null,
  generation: null,
  phoneNumber: null,
  gender: null,
  genderDisplay: null,
  profileImageId: 9,
  profileImagePath: 'uploads/me.webp',
}

const renderSheet = (mode: 'prompt' | 'edit' = 'prompt') => {
  const onLater = jest.fn()
  const onSaved = jest.fn()
  render(<ProfileSheet mode={mode} user={{ id: 1, name: '하늘' }} onLater={onLater} onSaved={onSaved} />)
  return { onLater, onSaved }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseProfilePhoto.mockReturnValue(noPhoto)
  mockPatchProfile.mockResolvedValue(saved)
})

describe('ProfileSheet', () => {
  it('지금 이름을 채워 두고, 바꾼 것이 없으면 저장할 수 없다', () => {
    renderSheet()

    expect(screen.getByPlaceholderText('이름을 적어 주세요')).toHaveValue('하늘')
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('새로 고른 사진만 보낸다', async () => {
    mockUseProfilePhoto.mockReturnValue(newPhoto)
    const { onSaved } = renderSheet()

    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(mockPatchProfile).toHaveBeenCalledWith({ profileImageId: 9 })
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved))
  })

  it('바꾼 이름은 앞뒤 공백을 빼고 보낸다', async () => {
    renderSheet()
    const input = screen.getByPlaceholderText('이름을 적어 주세요')

    await userEvent.clear(input)
    await userEvent.type(input, '  김하늘 ')
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(mockPatchProfile).toHaveBeenCalledWith({ name: '김하늘' })
  })

  it('이름을 비우면 저장할 수 없다', async () => {
    mockUseProfilePhoto.mockReturnValue(newPhoto)
    renderSheet()

    await userEvent.clear(screen.getByPlaceholderText('이름을 적어 주세요'))

    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('사진을 올리는 중에는 저장할 수 없다', () => {
    mockUseProfilePhoto.mockReturnValue({ ...newPhoto, status: 'uploading', fileId: null })
    renderSheet()

    expect(screen.getByText('올리는 중…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('프로필로 쓸 수 없는 사진(1106)이면 다른 사진을 고르라고 한다', async () => {
    mockUseProfilePhoto.mockReturnValue(newPhoto)
    mockPatchProfile.mockRejectedValue(new HttpError(400, '이 사진은 프로필로 쓸 수 없어요.', 1106))
    const { onSaved } = renderSheet()

    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이 사진은 프로필로 쓸 수 없어요. 다른 사진을 골라 주세요.')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('처음 안내에서는 나중에 할 수 있고, 내 사진 버튼으로 열었으면 닫기만 있다', async () => {
    const { onLater } = renderSheet('prompt')
    await userEvent.click(screen.getByRole('button', { name: '나중에 할게요' }))
    expect(onLater).toHaveBeenCalled()
  })

  it('내 사진 버튼으로 열면 제목이 내 프로필이다', () => {
    renderSheet('edit')

    expect(screen.getByRole('dialog', { name: '내 프로필' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
  })
})
