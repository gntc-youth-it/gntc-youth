import { pickRecorderMimeType, recordClip } from '../recorder'

// jsdom에는 MediaRecorder가 없어서 흉내 낸다
class FakeMediaRecorder {
  static isTypeSupported = jest.fn((type: string) => type.startsWith('video/webm'))
  static instances: FakeMediaRecorder[] = []
  state: 'inactive' | 'recording' = 'inactive'
  mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(
    public stream: MediaStream,
    public options: { mimeType?: string } = {}
  ) {
    this.mimeType = options.mimeType ?? ''
    FakeMediaRecorder.instances.push(this)
  }

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['clip']) })
    this.onstop?.()
  }
}

const fakeVideo = { videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement
const fakeStream = { getAudioTracks: () => [] } as unknown as MediaStream

beforeEach(() => {
  jest.useFakeTimers()
  FakeMediaRecorder.instances = []
  FakeMediaRecorder.isTypeSupported.mockImplementation((type: string) => type.startsWith('video/webm'))
  ;(window as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeMediaRecorder
  // jsdom 캔버스는 그리지 못한다. 그때는 카메라를 그대로 녹화하는 길로 간다
  HTMLCanvasElement.prototype.getContext = jest.fn(() => null)
})

afterEach(() => {
  jest.useRealTimers()
  delete (window as unknown as { MediaRecorder?: unknown }).MediaRecorder
})

describe('pickRecorderMimeType', () => {
  it('mp4를 녹화할 수 있으면 mp4를 고른다', () => {
    FakeMediaRecorder.isTypeSupported.mockImplementation((type: string) => type.startsWith('video/'))

    expect(pickRecorderMimeType()).toBe('video/mp4;codecs=avc1.42E01E,mp4a.40.2')
  })

  it('mp4가 안 되면 webm을 고른다', () => {
    expect(pickRecorderMimeType()).toBe('video/webm;codecs=vp9,opus')
  })

  it('녹화를 못 하는 브라우저면 없다', () => {
    delete (window as unknown as { MediaRecorder?: unknown }).MediaRecorder

    expect(pickRecorderMimeType()).toBeUndefined()
  })
})

describe('recordClip', () => {
  it('정해진 초가 지나면 저절로 멈추고 녹화한 영상을 돌려준다', async () => {
    const onProgress = jest.fn()
    const recording = recordClip({ video: fakeVideo, stream: fakeStream, mirrored: false, seconds: 5, onProgress })

    const recorder = FakeMediaRecorder.instances[0]
    expect(recorder.stream).toBe(fakeStream)
    expect(recorder.options.mimeType).toBe('video/webm;codecs=vp9,opus')
    expect(recorder.state).toBe('recording')

    jest.advanceTimersByTime(4900)
    expect(recorder.state).toBe('recording')
    expect(onProgress).toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    const blob = await recording

    expect(recorder.state).toBe('inactive')
    expect(blob.type).toBe('video/webm')
    expect(blob.size).toBeGreaterThan(0)
  })
})
