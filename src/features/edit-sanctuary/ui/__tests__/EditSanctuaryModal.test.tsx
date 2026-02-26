import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditSanctuaryModal } from '../EditSanctuaryModal'
import { useChurchInfo, clearChurchInfoCache } from '../../../../entities/church'
import { compressImage, compressVideo, isVideoCompressionSupported, uploadToS3 } from '../../../../shared/lib'
import { getFilePresignedUrl, updateChurchInfo } from '../../api'

jest.mock('@radix-ui/react-dialog', () => {
  const actual = jest.requireActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

jest.mock('../../../../entities/church', () => ({
  useChurchInfo: jest.fn(),
  clearChurchInfoCache: jest.fn(),
}))

jest.mock('../../../../shared/lib', () => ({
  ...jest.requireActual('../../../../shared/lib'),
  getMediaType: jest.fn(() => 'image'),
  buildCdnUrl: jest.fn((path: string) => `https://cdn.example.com${path}`),
  compressImage: jest.fn(),
  compressVideo: jest.fn(),
  isVideoCompressionSupported: jest.fn(() => true),
  uploadToS3: jest.fn(),
}))

jest.mock('../../api', () => ({
  getFilePresignedUrl: jest.fn(),
  updateChurchInfo: jest.fn(),
}))

const mockUseChurchInfo = useChurchInfo as jest.MockedFunction<typeof useChurchInfo>
const mockClearCache = clearChurchInfoCache as jest.MockedFunction<typeof clearChurchInfoCache>
const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>
const mockCompressVideo = compressVideo as jest.MockedFunction<typeof compressVideo>
const mockIsSupported = isVideoCompressionSupported as jest.MockedFunction<typeof isVideoCompressionSupported>
const mockUploadToS3 = uploadToS3 as jest.MockedFunction<typeof uploadToS3>
const mockGetFilePresignedUrl = getFilePresignedUrl as jest.MockedFunction<typeof getFilePresignedUrl>
const mockUpdateChurchInfo = updateChurchInfo as jest.MockedFunction<typeof updateChurchInfo>

const mockChurchInfo = {
  churchId: 'ANYANG',
  groupPhotoFileId: 7,
  groupPhotoPath: '/photos/anyang.jpg',
  prayerTopics: [
    { id: 1, content: '교회의 부흥을 위해', sortOrder: 1 },
    { id: 2, content: '청년들의 신앙 성장을 위해', sortOrder: 2 },
  ],
}

describe('EditSanctuaryModal', () => {
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSupported.mockReturnValue(true)
    mockUseChurchInfo.mockReturnValue({
      churchInfo: mockChurchInfo,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useChurchInfo>)
    mockUpdateChurchInfo.mockResolvedValue(undefined)
    URL.createObjectURL = jest.fn(() => 'blob:preview-url')
    URL.revokeObjectURL = jest.fn()
  })

  const renderModal = (props?: Partial<React.ComponentProps<typeof EditSanctuaryModal>>) => {
    return render(
      <EditSanctuaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        churchId="ANYANG"
        churchName="안양"
        {...props}
      />
    )
  }

  describe('렌더링', () => {
    it('모달 제목과 설명을 렌더링한다', () => {
      renderModal()

      expect(screen.getByText('성전 정보 수정')).toBeInTheDocument()
      expect(screen.getByText('성전 사진과 기도제목을 수정할 수 있습니다')).toBeInTheDocument()
    })

    it('기존 기도제목을 표시한다', () => {
      renderModal()

      expect(screen.getByDisplayValue('교회의 부흥을 위해')).toBeInTheDocument()
      expect(screen.getByDisplayValue('청년들의 신앙 성장을 위해')).toBeInTheDocument()
    })

    it('저장하기, 취소 버튼을 렌더링한다', () => {
      renderModal()

      expect(screen.getByText('저장하기')).toBeInTheDocument()
      expect(screen.getByText('취소')).toBeInTheDocument()
    })

    it('churchId가 없으면 렌더링하지 않는다', () => {
      renderModal({ churchId: '' })

      expect(screen.queryByText('성전 정보 수정')).not.toBeInTheDocument()
    })
  })

  describe('기도제목 관리', () => {
    it('기도제목을 수정할 수 있다', async () => {
      const user = userEvent.setup()
      renderModal()

      const input = screen.getByDisplayValue('교회의 부흥을 위해')
      await user.clear(input)
      await user.type(input, '새로운 기도제목')

      expect(input).toHaveValue('새로운 기도제목')
    })

    it('추가 버튼으로 기도제목을 추가할 수 있다', async () => {
      const user = userEvent.setup()
      renderModal()

      const addButton = screen.getByText('추가')
      await user.click(addButton)

      const inputs = screen.getAllByPlaceholderText('기도제목을 입력하세요')
      expect(inputs).toHaveLength(3)
    })

    it('삭제 버튼으로 기도제목을 삭제할 수 있다', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByLabelText('기도제목 1 삭제'))

      expect(screen.queryByDisplayValue('교회의 부흥을 위해')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('청년들의 신앙 성장을 위해')).toBeInTheDocument()
    })

    it('최대 10개까지만 추가할 수 있다', async () => {
      mockUseChurchInfo.mockReturnValue({
        churchInfo: {
          ...mockChurchInfo,
          prayerTopics: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            content: `기도제목 ${i + 1}`,
            sortOrder: i + 1,
          })),
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useChurchInfo>)

      renderModal()

      const addButton = screen.getByText('추가')
      expect(addButton).toBeDisabled()
    })
  })

  describe('저장 - 기도제목만', () => {
    it('기도제목만 수정하고 저장하면 기존 groupPhotoFileId를 유지한다', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(mockUpdateChurchInfo).toHaveBeenCalledWith('ANYANG', {
          groupPhotoFileId: 7,
          prayerTopics: [
            { content: '교회의 부흥을 위해', sortOrder: 1 },
            { content: '청년들의 신앙 성장을 위해', sortOrder: 2 },
          ],
        })
      })

      expect(mockClearCache).toHaveBeenCalledWith('ANYANG')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('기존 사진이 없는 성전에서 기도제목만 저장하면 null로 전송한다', async () => {
      mockUseChurchInfo.mockReturnValue({
        churchInfo: {
          ...mockChurchInfo,
          groupPhotoFileId: null,
          groupPhotoPath: null,
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useChurchInfo>)

      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(mockUpdateChurchInfo).toHaveBeenCalledWith('ANYANG', {
          groupPhotoFileId: null,
          prayerTopics: expect.any(Array),
        })
      })
    })

    it('빈 기도제목만 있으면 에러를 표시한다', async () => {
      mockUseChurchInfo.mockReturnValue({
        churchInfo: {
          ...mockChurchInfo,
          prayerTopics: [{ id: 1, content: '   ', sortOrder: 1 }],
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useChurchInfo>)

      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByText('저장하기'))

      expect(screen.getByText('기도제목을 최소 1개 이상 입력해주세요.')).toBeInTheDocument()
      expect(mockUpdateChurchInfo).not.toHaveBeenCalled()
    })
  })

  describe('저장 - 이미지 업로드', () => {
    it('이미지 선택 후 저장 시 압축 → presigned URL → S3 업로드 → 저장 순서로 진행한다', async () => {
      const compressedBlob = new Blob(['compressed'], { type: 'image/webp' })
      mockCompressImage.mockResolvedValue({
        blob: compressedBlob,
        originalSize: 1024,
        compressedSize: 512,
      })
      mockGetFilePresignedUrl.mockResolvedValue({
        fileId: 42,
        presignedUrl: 'https://s3.example.com/upload',
      })
      mockUploadToS3.mockResolvedValue(undefined)

      const user = userEvent.setup()
      const { container } = renderModal()

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['image-data'], 'photo.jpg', { type: 'image/jpeg' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(mockCompressImage).toHaveBeenCalledWith(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
        })
      })

      await waitFor(() => {
        expect(mockGetFilePresignedUrl).toHaveBeenCalledWith(
          'photo.webp',
          'image/webp',
          compressedBlob.size
        )
      })

      await waitFor(() => {
        expect(mockUploadToS3).toHaveBeenCalledWith(
          'https://s3.example.com/upload',
          compressedBlob,
          'image/webp',
          expect.objectContaining({ onProgress: expect.any(Function) })
        )
      })

      await waitFor(() => {
        expect(mockUpdateChurchInfo).toHaveBeenCalledWith('ANYANG', {
          groupPhotoFileId: 42,
          prayerTopics: expect.any(Array),
        })
      })
    })
  })

  describe('저장 - 영상 업로드', () => {
    it('영상 선택 후 저장 시 압축 → presigned URL → S3 업로드 → 저장 순서로 진행한다', async () => {
      const compressedBlob = new Blob(['compressed-video'], { type: 'video/mp4' })
      mockCompressVideo.mockResolvedValue({
        blob: compressedBlob,
        originalSize: 5000,
        compressedSize: 2000,
      })
      mockGetFilePresignedUrl.mockResolvedValue({
        fileId: 99,
        presignedUrl: 'https://s3.example.com/upload-video',
      })
      mockUploadToS3.mockResolvedValue(undefined)

      const user = userEvent.setup()
      const { container } = renderModal()

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['video-data'], 'clip.mp4', { type: 'video/mp4' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(mockCompressVideo).toHaveBeenCalledWith(file, {
          crf: 28,
          maxWidth: 1280,
          skipBelowSize: 20 * 1024 * 1024,
          onProgress: expect.any(Function),
        })
      })

      await waitFor(() => {
        expect(mockGetFilePresignedUrl).toHaveBeenCalledWith(
          'clip.mp4',
          'video/mp4',
          compressedBlob.size
        )
      })

      await waitFor(() => {
        expect(mockUpdateChurchInfo).toHaveBeenCalledWith('ANYANG', {
          groupPhotoFileId: 99,
          prayerTopics: expect.any(Array),
        })
      })
    })

    it('WebAssembly 미지원 시 압축 없이 원본을 업로드한다', async () => {
      mockIsSupported.mockReturnValue(false)
      mockGetFilePresignedUrl.mockResolvedValue({
        fileId: 50,
        presignedUrl: 'https://s3.example.com/upload',
      })
      mockUploadToS3.mockResolvedValue(undefined)

      const user = userEvent.setup()
      const { container } = renderModal()

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['video-data'], 'clip.mov', { type: 'video/quicktime' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(mockCompressVideo).not.toHaveBeenCalled()
        expect(mockUploadToS3).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockUpdateChurchInfo).toHaveBeenCalledWith('ANYANG', {
          groupPhotoFileId: 50,
          prayerTopics: expect.any(Array),
        })
      })
    })
  })

  describe('에러 처리', () => {
    it('저장 API 실패 시 에러 메시지를 표시한다', async () => {
      mockUpdateChurchInfo.mockRejectedValue(new Error('권한이 없습니다.'))

      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(screen.getByText('권한이 없습니다.')).toBeInTheDocument()
      })

      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
    })

    it('이미지 압축 실패 시 에러 메시지를 표시한다', async () => {
      mockCompressImage.mockRejectedValue(new Error('이미지 압축에 실패했습니다.'))

      const user = userEvent.setup()
      const { container } = renderModal()

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(screen.getByText('이미지 압축에 실패했습니다.')).toBeInTheDocument()
      })
    })

    it('S3 업로드 실패 시 에러 메시지를 표시한다', async () => {
      mockCompressImage.mockResolvedValue({
        blob: new Blob(['ok'], { type: 'image/webp' }),
        originalSize: 1024,
        compressedSize: 512,
      })
      mockGetFilePresignedUrl.mockResolvedValue({
        fileId: 1,
        presignedUrl: 'https://s3.example.com/upload',
      })
      mockUploadToS3.mockRejectedValue(new Error('네트워크 오류로 업로드에 실패했습니다.'))

      const user = userEvent.setup()
      const { container } = renderModal()

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await user.click(screen.getByText('저장하기'))

      await waitFor(() => {
        expect(screen.getByText('네트워크 오류로 업로드에 실패했습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('취소', () => {
    it('취소 버튼 클릭 시 모달을 닫는다', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByText('취소'))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
