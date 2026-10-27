import { act, renderHook, waitFor } from '@testing-library/react'
import { uploadEntryMedia } from '../../api/thanksApi'
import { MediaError, prepareMedia } from '../prepareMedia'
import { useEntryMedia } from '../useEntryMedia'

jest.mock('../../api/thanksApi', () => ({
  uploadEntryMedia: jest.fn(),
}))

jest.mock('../prepareMedia', () => ({
  ...jest.requireActual('../prepareMedia'),
  prepareMedia: jest.fn(),
}))

const mockUploadEntryMedia = uploadEntryMedia as jest.MockedFunction<typeof uploadEntryMedia>
const mockPrepareMedia = prepareMedia as jest.MockedFunction<typeof prepareMedia>

const photo = new File(['photo'], 'lunch.jpg', { type: 'image/jpeg' })
const prepared = new Blob(['small'], { type: 'image/webp' })
const clip = new Blob(['clip'], { type: 'video/mp4' })

beforeAll(() => {
  // CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = () => undefined
})

beforeEach(() => {
  jest.clearAllMocks()
  mockPrepareMedia.mockImplementation(async (blob) => ({
    blob: blob.type.startsWith('video/') ? blob : prepared,
    mediaType: blob.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
  }))
  mockUploadEntryMedia.mockImplementation(async (_blob, onProgress) => {
    onProgress(60)
    return 31
  })
})

describe('useEntryMedia', () => {
  it('고른 사진을 다듬어 올리고 파일 번호를 받는다', async () => {
    const { result } = renderHook(() => useEntryMedia())

    await act(async () => {
      await result.current.select(photo, 'album')
    })

    expect(mockPrepareMedia).toHaveBeenCalledWith(photo, 'album', expect.any(Function))
    expect(mockUploadEntryMedia).toHaveBeenCalledWith(prepared, expect.any(Function))
    expect(result.current).toMatchObject({ status: 'done', fileId: 31, previewUrl: 'blob:preview', mediaType: 'IMAGE' })
  })

  it('찍은 영상도 같은 방법으로 올린다', async () => {
    const { result } = renderHook(() => useEntryMedia())

    await act(async () => {
      await result.current.select(clip, 'camera')
    })

    expect(mockPrepareMedia).toHaveBeenCalledWith(clip, 'camera', expect.any(Function))
    expect(result.current).toMatchObject({ status: 'done', fileId: 31, mediaType: 'VIDEO' })
  })

  it('다듬다가 막히면 그 안내를 그대로 보여 준다', async () => {
    mockPrepareMedia.mockRejectedValueOnce(new MediaError('5초가 넘는 영상은 올릴 수 없어요. 5초 이하로 골라 주세요.'))
    const { result } = renderHook(() => useEntryMedia())

    await act(async () => {
      await result.current.select(clip, 'album')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('5초가 넘는 영상은 올릴 수 없어요. 5초 이하로 골라 주세요.')
    expect(mockUploadEntryMedia).not.toHaveBeenCalled()
  })

  it('올리다 실패하면 안내하고 다시 올릴 수 있다', async () => {
    mockUploadEntryMedia.mockRejectedValueOnce(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    const { result } = renderHook(() => useEntryMedia())

    await act(async () => {
      await result.current.select(photo, 'album')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('올리지 못했어요. 인터넷 연결을 확인하고 다시 올려 주세요.')

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('done'))
    expect(result.current.fileId).toBe(31)
  })

  it('사진·영상이 아닌 파일은 안내만 하고 올리지 않는다', async () => {
    const { result } = renderHook(() => useEntryMedia())

    await act(async () => {
      await result.current.select(new File(['x'], 'note.pdf', { type: 'application/pdf' }), 'album')
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('사진이나 영상만 올릴 수 있어요.')
    expect(mockPrepareMedia).not.toHaveBeenCalled()
  })

  it('다시 찍으러 가면 처음 상태로 돌아가고, 늦게 끝난 업로드는 버린다', async () => {
    let finishUpload: (fileId: number) => void = () => undefined
    mockUploadEntryMedia.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishUpload = resolve
        })
    )
    const { result } = renderHook(() => useEntryMedia())

    let selecting: Promise<void> = Promise.resolve()
    act(() => {
      selecting = result.current.select(photo, 'album')
    })
    await waitFor(() => expect(result.current.status).toBe('uploading'))

    act(() => result.current.reset())
    await act(async () => {
      finishUpload(99)
      await selecting
    })

    expect(result.current).toMatchObject({ status: 'idle', fileId: null, previewUrl: null })
  })
})
