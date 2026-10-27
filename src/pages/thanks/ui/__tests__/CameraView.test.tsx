import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { capturePhoto, recordClip } from '../../lib/recorder'
import { CameraView } from '../CameraView'
import type { CaptureMode } from '../CameraView'

jest.mock('../../lib/recorder', () => ({
  canRecordVideo: () => true,
  capturePhoto: jest.fn(),
  recordClip: jest.fn(),
}))

const mockCapturePhoto = capturePhoto as jest.MockedFunction<typeof capturePhoto>
const mockRecordClip = recordClip as jest.MockedFunction<typeof recordClip>

const fakeTrack = { stop: jest.fn(), readyState: 'live' }
const fakeStream = {
  getTracks: () => [fakeTrack],
  getVideoTracks: () => [fakeTrack],
  getAudioTracks: () => [fakeTrack],
}

const renderCamera = (mode: CaptureMode, handlers: Partial<Record<string, jest.Mock>> = {}) => {
  const props = {
    onModeChange: jest.fn(),
    onCapture: jest.fn(),
    onPickAlbum: jest.fn(),
    onNativePhoto: jest.fn(),
    onNativeVideo: jest.fn(),
    onClose: jest.fn(),
    ...handlers,
  }
  render(<CameraView title="오후 감사 남기기" subtitle="17:59까지 올릴 수 있어요" slotLabel="오후" mode={mode} {...props} />)
  return props
}

const setMediaDevices = (value: unknown) => {
  Object.defineProperty(navigator, 'mediaDevices', { value, configurable: true })
}

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve()
})

beforeEach(() => {
  jest.clearAllMocks()
  setMediaDevices({ getUserMedia: jest.fn().mockResolvedValue(fakeStream) })
})

afterEach(() => {
  setMediaDevices(undefined)
})

describe('CameraView', () => {
  it('카메라를 켜고, 사진 모드에서 누르면 찰칵 찍어 넘긴다', async () => {
    const photo = new Blob(['p'], { type: 'image/webp' })
    mockCapturePhoto.mockResolvedValue(photo)
    const props = renderCamera('PHOTO')

    const shutter = screen.getByRole('button', { name: '사진 찍기' })
    await waitFor(() => expect(shutter).toBeEnabled())
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: true }))

    await userEvent.click(shutter)

    expect(props.onCapture).toHaveBeenCalledWith(photo)
  })

  it('영상 모드에서 누르면 정해진 5초만큼 녹화해 넘긴다', async () => {
    const clip = new Blob(['v'], { type: 'video/mp4' })
    mockRecordClip.mockResolvedValue(clip)
    const props = renderCamera('VIDEO')

    const shutter = screen.getByRole('button', { name: '5초 영상 찍기' })
    await waitFor(() => expect(shutter).toBeEnabled())
    await userEvent.click(shutter)

    expect(mockRecordClip).toHaveBeenCalledWith(expect.objectContaining({ seconds: 5, mirrored: false }))
    await waitFor(() => expect(props.onCapture).toHaveBeenCalledWith(clip))
  })

  it('카메라 권한이 없으면 휴대폰 기본 카메라와 앨범으로 찍게 한다', async () => {
    setMediaDevices({ getUserMedia: jest.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) })
    const props = renderCamera('PHOTO')

    expect(await screen.findByText(/카메라 권한을 허락해 주세요/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '사진 찍기' }))
    await userEvent.click(screen.getByRole('button', { name: '영상 찍기' }))
    await userEvent.click(screen.getByRole('button', { name: '앨범에서 고르기' }))

    expect(props.onNativePhoto).toHaveBeenCalled()
    expect(props.onNativeVideo).toHaveBeenCalled()
    expect(props.onPickAlbum).toHaveBeenCalled()
  })

  it('카메라를 쓸 수 없는 브라우저도 같은 방법으로 찍게 한다', () => {
    setMediaDevices(undefined)
    renderCamera('PHOTO')

    expect(screen.getByText(/이 브라우저에서는 카메라를 열 수 없어요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '영상 찍기' })).toBeInTheDocument()
  })
})
