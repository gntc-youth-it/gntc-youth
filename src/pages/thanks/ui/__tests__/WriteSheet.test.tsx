import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpError } from '../../../../shared/api'
import { createThanksEntry } from '../../api/thanksApi'
import { useEntryMedia } from '../../model/useEntryMedia'
import type { ThanksEntry } from '../../model/types'
import { WriteSheet } from '../WriteSheet'

jest.mock('../../api/thanksApi', () => ({
  createThanksEntry: jest.fn(),
}))

jest.mock('../../model/useEntryMedia', () => ({
  useEntryMedia: jest.fn(),
}))

// 카메라는 CameraView 테스트에서 따로 본다. 여기서는 찍었다고 치는 버튼만 둔다
jest.mock('../CameraView', () => ({
  CameraView: ({ title, onCapture, onPickAlbum }: { title: string; onCapture: (blob: Blob) => void; onPickAlbum: () => void }) => (
    <div data-testid="camera">
      <p>{title}</p>
      <button type="button" onClick={() => onCapture(new Blob(['p'], { type: 'image/webp' }))}>
        찰칵
      </button>
      <button type="button" onClick={onPickAlbum}>
        앨범 열기
      </button>
    </div>
  ),
}))

const mockCreateThanksEntry = createThanksEntry as jest.MockedFunction<typeof createThanksEntry>
const mockUseEntryMedia = useEntryMedia as jest.MockedFunction<typeof useEntryMedia>

const kst = (value: string) => new Date(`${value}+09:00`)

const readyMedia = {
  status: 'done' as const,
  progress: 100,
  fileId: 7,
  previewUrl: 'blob:preview',
  mediaType: 'IMAGE' as const,
  error: null,
  select: jest.fn(),
  retry: jest.fn(),
  reset: jest.fn(),
}

const posted: ThanksEntry = {
  id: 1,
  missionDate: '2026-11-09',
  slot: 'AFTERNOON',
  content: '점심 사 준 동기에게 감사',
  media: { fileId: 7, url: 'uploads/a.webp', type: 'IMAGE' },
  author: { userId: 1, name: '정은혜', profileImageUrl: null },
  reactions: [],
  commentCount: 0,
  latestComment: null,
  isMine: true,
  createdAt: '2026-11-09T04:20:00',
}

const renderSheet = (now = kst('2026-11-09T13:20:00'), onPosted = jest.fn()) =>
  render(<WriteSheet now={now} onClose={jest.fn()} onPosted={onPosted} />)

// 카메라에서 찍고 쓰기 화면으로 넘어간다
const capture = async () => {
  await userEvent.click(screen.getByRole('button', { name: '찰칵' }))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseEntryMedia.mockReturnValue(readyMedia)
})

describe('WriteSheet', () => {
  it('먼저 카메라를 띄운다', () => {
    renderSheet()

    expect(screen.getByTestId('camera')).toHaveTextContent('오후 감사 남기기')
  })

  it('찍으면 올려 두고 쓰기 화면으로 넘어간다', async () => {
    renderSheet()

    await capture()

    expect(readyMedia.select).toHaveBeenCalledWith(expect.any(Blob), 'camera')
    expect(screen.getByText('17:59까지 올릴 수 있어요')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?')).toBeInTheDocument()
  })

  it('앨범에서 고른 사진·영상도 쓰기 화면으로 넘어간다', () => {
    renderSheet()
    const clip = new File(['v'], 'clip.mov', { type: 'video/quicktime' })

    fireEvent.change(screen.getByTestId('album-input'), { target: { files: [clip] } })

    expect(readyMedia.select).toHaveBeenCalledWith(clip, 'album')
    expect(screen.queryByTestId('camera')).not.toBeInTheDocument()
  })

  it('감사제목을 써야 올릴 수 있고, 올리면 파일 번호와 함께 보낸다', async () => {
    const onPosted = jest.fn()
    mockCreateThanksEntry.mockResolvedValue(posted)
    renderSheet(kst('2026-11-09T13:20:00'), onPosted)
    await capture()

    const submit = screen.getByRole('button', { name: '감사 올리기' })
    expect(submit).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '  점심 사 준 동기에게 감사 ')
    await userEvent.click(submit)

    expect(mockCreateThanksEntry).toHaveBeenCalledWith({ content: '점심 사 준 동기에게 감사', fileId: 7 })
    await waitFor(() => expect(onPosted).toHaveBeenCalledWith(posted))
  })

  it('영상은 소리 없이 미리 보여 주고, 눌러야 소리를 켠다', async () => {
    mockUseEntryMedia.mockReturnValue({ ...readyMedia, mediaType: 'VIDEO' })
    renderSheet()
    await capture()

    await userEvent.click(screen.getByRole('button', { name: '🔇 눌러서 소리 듣기' }))

    expect(screen.getByRole('button', { name: '🔊 소리 끄기' })).toBeInTheDocument()
  })

  it('다 올라가기 전에는 올릴 수 없고 진행률을 보여 준다', async () => {
    mockUseEntryMedia.mockReturnValue({ ...readyMedia, status: 'processing', progress: 40, fileId: null, mediaType: 'VIDEO' })
    renderSheet()
    await capture()

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '감사')

    expect(screen.getByText('영상 다듬는 중 40%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '감사 올리기' })).toBeDisabled()
  })

  it('다시 찍기를 누르면 고른 것을 버리고 카메라로 돌아간다', async () => {
    renderSheet()
    await capture()

    await userEvent.click(screen.getByRole('button', { name: '다시 찍기' }))

    expect(readyMedia.reset).toHaveBeenCalled()
    expect(screen.getByTestId('camera')).toBeInTheDocument()
  })

  it('이 칸에 이미 올렸으면 안내한다', async () => {
    mockCreateThanksEntry.mockRejectedValue(new HttpError(400, '이미 올렸습니다.', 6002))
    renderSheet()
    await capture()

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '감사')
    await userEvent.click(screen.getByRole('button', { name: '감사 올리기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이 시간 감사는 이미 올렸어요.')
  })

  it('붙일 수 없는 파일이면 다시 찍거나 고르라고 안내한다', async () => {
    mockCreateThanksEntry.mockRejectedValue(new HttpError(400, '이 파일은 붙일 수 없어요.', 6005))
    renderSheet()
    await capture()

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '감사')
    await userEvent.click(screen.getByRole('button', { name: '감사 올리기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이 사진은 올릴 수 없어요. 다시 찍거나 골라 주세요.')
  })

  it('자정부터 아침 6시까지는 올릴 수 없다', async () => {
    renderSheet(kst('2026-11-10T01:00:00'))
    await capture()

    await userEvent.type(screen.getByPlaceholderText('어떤 일이 감사했나요?'), '감사')

    expect(screen.getByText('아침 감사는 06:00부터 올릴 수 있어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '감사 올리기' })).toBeDisabled()
  })
})
