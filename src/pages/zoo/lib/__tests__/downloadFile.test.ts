import { downloadTextFile } from '../downloadFile'

describe('downloadTextFile', () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  let createdBlobs: Blob[]
  let revokedUrls: string[]

  beforeEach(() => {
    jest.useFakeTimers()
    createdBlobs = []
    revokedUrls = []
    // jsdom에는 없는 함수라 직접 넣는다 (CRA의 resetMocks에 지워지지 않도록 jest.fn 대신 일반 함수)
    URL.createObjectURL = (blob: Blob) => {
      createdBlobs.push(blob)
      return 'blob:answers'
    }
    URL.revokeObjectURL = (url: string) => {
      revokedUrls.push(url)
    }
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    jest.useRealTimers()
  })

  it('파일 이름을 붙여 내려받게 하고, 잠시 뒤 임시 주소를 정리한다', () => {
    const clicked: { href: string; download: string }[] = []
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download })
    })

    downloadTextFile('조,답', '동물원-미션-답.csv', 'text/csv;charset=utf-8')

    expect(createdBlobs[0].type).toBe('text/csv;charset=utf-8')
    expect(clicked).toEqual([{ href: 'blob:answers', download: '동물원-미션-답.csv' }])
    expect(document.querySelector('a[download]')).toBeNull()
    expect(revokedUrls).toEqual([])

    jest.advanceTimersByTime(1000)
    expect(revokedUrls).toEqual(['blob:answers'])

    clickSpy.mockRestore()
  })
})
