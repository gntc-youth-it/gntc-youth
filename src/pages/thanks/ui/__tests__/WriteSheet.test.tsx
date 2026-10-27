import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpError } from '../../../../shared/api'
import { createThanksEntry } from '../../api/thanksApi'
import { useEntryPhoto } from '../../model/useEntryPhoto'
import type { ThanksEntry } from '../../model/types'
import { WriteSheet } from '../WriteSheet'

jest.mock('../../api/thanksApi', () => ({
  createThanksEntry: jest.fn(),
}))

jest.mock('../../model/useEntryPhoto', () => ({
  useEntryPhoto: jest.fn(),
}))

const mockCreateThanksEntry = createThanksEntry as jest.MockedFunction<typeof createThanksEntry>
const mockUseEntryPhoto = useEntryPhoto as jest.MockedFunction<typeof useEntryPhoto>

const kst = (value: string) => new Date(`${value}+09:00`)

const readyPhoto = {
  status: 'done' as const,
  progress: 100,
  fileId: 7,
  previewUrl: 'blob:preview',
  error: null,
  select: jest.fn(),
  retry: jest.fn(),
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

beforeEach(() => {
  jest.clearAllMocks()
  mockUseEntryPhoto.mockReturnValue(readyPhoto)
})

describe('WriteSheet', () => {
  it('지금 칸과 마감 시각을 보여 준다', () => {
    render(<WriteSheet now={kst('2026-11-09T13:20:00')} onClose={jest.fn()} onPosted={jest.fn()} />)

    expect(screen.getByText('오후 감사 남기기')).toBeInTheDocument()
    expect(screen.getByText('17:59까지 올릴 수 있어요')).toBeInTheDocument()
  })

  it('감사제목을 써야 올릴 수 있고, 올리면 사진 파일 번호와 함께 보낸다', async () => {
    const onPosted = jest.fn()
    mockCreateThanksEntry.mockResolvedValue(posted)
    render(<WriteSheet now={kst('2026-11-09T13:20:00')} onClose={jest.fn()} onPosted={onPosted} />)

    const submit = screen.getByRole('button', { name: '감사 올리기' })
    expect(submit).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '  점심 사 준 동기에게 감사 ')
    await userEvent.click(submit)

    expect(mockCreateThanksEntry).toHaveBeenCalledWith({ content: '점심 사 준 동기에게 감사', fileId: 7 })
    await waitFor(() => expect(onPosted).toHaveBeenCalledWith(posted))
  })

  it('사진이 다 올라가기 전에는 올릴 수 없다', async () => {
    mockUseEntryPhoto.mockReturnValue({ ...readyPhoto, status: 'uploading', progress: 40, fileId: null })
    render(<WriteSheet now={kst('2026-11-09T13:20:00')} onClose={jest.fn()} onPosted={jest.fn()} />)

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '감사')

    expect(screen.getByText('사진 올리는 중 40%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '감사 올리기' })).toBeDisabled()
  })

  it('이 칸에 이미 올렸으면 안내한다', async () => {
    mockCreateThanksEntry.mockRejectedValue(new HttpError(409, '이미 올렸습니다.', 6002))
    render(<WriteSheet now={kst('2026-11-09T13:20:00')} onClose={jest.fn()} onPosted={jest.fn()} />)

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '감사')
    await userEvent.click(screen.getByRole('button', { name: '감사 올리기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이 시간 감사는 이미 올렸어요.')
  })

  it('붙일 수 없는 사진이면 다시 고르라고 안내한다', async () => {
    mockCreateThanksEntry.mockRejectedValue(new HttpError(400, '이 파일은 붙일 수 없어요.', 6005))
    render(<WriteSheet now={kst('2026-11-09T13:20:00')} onClose={jest.fn()} onPosted={jest.fn()} />)

    await userEvent.type(screen.getByPlaceholderText('오후에 어떤 일이 감사했나요?'), '감사')
    await userEvent.click(screen.getByRole('button', { name: '감사 올리기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이 사진은 올릴 수 없어요. 사진을 다시 골라 주세요.')
  })

  it('자정부터 아침 6시까지는 올릴 수 없다', async () => {
    render(<WriteSheet now={kst('2026-11-10T01:00:00')} onClose={jest.fn()} onPosted={jest.fn()} />)

    await userEvent.type(screen.getByPlaceholderText('어떤 일이 감사했나요?'), '감사')

    expect(screen.getByText('아침 감사는 06:00부터 올릴 수 있어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '감사 올리기' })).toBeDisabled()
  })
})
