import { uploadToS3 } from '../uploadToS3'

type EventHandler = (event?: Partial<ProgressEvent>) => void

let mockXhr: {
  open: jest.Mock
  setRequestHeader: jest.Mock
  send: jest.Mock
  status: number
  upload: { addEventListener: jest.Mock }
  addEventListener: jest.Mock
  _listeners: Record<string, EventHandler>
  _uploadListeners: Record<string, EventHandler>
  _triggerEvent: (event: string, data?: Partial<ProgressEvent>) => void
  _triggerUploadEvent: (event: string, data?: Partial<ProgressEvent>) => void
}

beforeEach(() => {
  mockXhr = {
    open: jest.fn(),
    setRequestHeader: jest.fn(),
    send: jest.fn(),
    status: 200,
    upload: {
      addEventListener: jest.fn(),
    },
    addEventListener: jest.fn(),
    _listeners: {},
    _uploadListeners: {},
    _triggerEvent(event: string, data?: Partial<ProgressEvent>) {
      this._listeners[event]?.(data)
    },
    _triggerUploadEvent(event: string, data?: Partial<ProgressEvent>) {
      this._uploadListeners[event]?.(data)
    },
  }

  mockXhr.addEventListener.mockImplementation((event: string, handler: EventHandler) => {
    mockXhr._listeners[event] = handler
  })

  mockXhr.upload.addEventListener.mockImplementation((event: string, handler: EventHandler) => {
    mockXhr._uploadListeners[event] = handler
  })

  jest.spyOn(globalThis, 'XMLHttpRequest').mockImplementation(
    () => mockXhr as unknown as XMLHttpRequest
  )
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('uploadToS3', () => {
  it('올바른 URL과 Content-Type으로 PUT 요청한다', async () => {
    const blob = new Blob(['data'], { type: 'image/webp' })

    mockXhr.send.mockImplementation(() => {
      mockXhr.status = 200
      mockXhr._triggerEvent('load')
    })

    await uploadToS3('https://s3.example.com/upload', blob, 'image/webp')

    expect(mockXhr.open).toHaveBeenCalledWith('PUT', 'https://s3.example.com/upload')
    expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'image/webp')
    expect(mockXhr.send).toHaveBeenCalledWith(blob)
  })

  it('업로드 성공 시 resolve한다', async () => {
    const blob = new Blob(['data'])

    mockXhr.send.mockImplementation(() => {
      mockXhr.status = 200
      mockXhr._triggerEvent('load')
    })

    await expect(uploadToS3('https://s3.example.com/upload', blob, 'video/mp4')).resolves.toBeUndefined()
  })

  it('HTTP 에러 시 reject한다', async () => {
    const blob = new Blob(['data'])

    mockXhr.send.mockImplementation(() => {
      mockXhr.status = 403
      mockXhr._triggerEvent('load')
    })

    await expect(
      uploadToS3('https://s3.example.com/upload', blob, 'image/webp')
    ).rejects.toThrow('업로드에 실패했습니다. (403)')
  })

  it('네트워크 에러 시 reject한다', async () => {
    const blob = new Blob(['data'])

    mockXhr.send.mockImplementation(() => {
      mockXhr._triggerEvent('error')
    })

    await expect(
      uploadToS3('https://s3.example.com/upload', blob, 'image/webp')
    ).rejects.toThrow('네트워크 오류로 업로드에 실패했습니다.')
  })

  it('업로드 취소 시 reject한다', async () => {
    const blob = new Blob(['data'])

    mockXhr.send.mockImplementation(() => {
      mockXhr._triggerEvent('abort')
    })

    await expect(
      uploadToS3('https://s3.example.com/upload', blob, 'image/webp')
    ).rejects.toThrow('업로드가 취소되었습니다.')
  })

  it('onProgress 콜백을 호출한다', async () => {
    const onProgress = jest.fn()
    const blob = new Blob(['data'])

    mockXhr.send.mockImplementation(() => {
      mockXhr._triggerUploadEvent('progress', {
        lengthComputable: true,
        loaded: 50,
        total: 100,
      })
      mockXhr._triggerUploadEvent('progress', {
        lengthComputable: true,
        loaded: 100,
        total: 100,
      })
      mockXhr.status = 200
      mockXhr._triggerEvent('load')
    })

    await uploadToS3('https://s3.example.com/upload', blob, 'image/webp', { onProgress })

    expect(onProgress).toHaveBeenCalledWith(50)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('lengthComputable이 false면 onProgress를 호출하지 않는다', async () => {
    const onProgress = jest.fn()
    const blob = new Blob(['data'])

    mockXhr.send.mockImplementation(() => {
      mockXhr._triggerUploadEvent('progress', {
        lengthComputable: false,
        loaded: 50,
        total: 0,
      })
      mockXhr.status = 200
      mockXhr._triggerEvent('load')
    })

    await uploadToS3('https://s3.example.com/upload', blob, 'image/webp', { onProgress })

    expect(onProgress).not.toHaveBeenCalled()
  })
})
