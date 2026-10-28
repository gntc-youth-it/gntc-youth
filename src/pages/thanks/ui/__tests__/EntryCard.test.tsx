import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ThanksEntry } from '../../model/types'
import { EntryCard } from '../EntryCard'

const entry: ThanksEntry = {
  id: 7,
  missionDate: '2026-11-09',
  slot: 'MORNING',
  content: '함께 나눈 아침에 감사해요',
  media: { fileId: 7, url: 'uploads/morning.webp', type: 'IMAGE' },
  author: { userId: 1, name: '정은혜', profileImageUrl: null },
  reactions: [],
  commentCount: 0,
  latestComment: null,
  isMine: false,
  createdAt: '2026-11-09T00:15:00Z',
}

it('카드의 접근 가능한 이름에 표시된 반응·내 반응·댓글을 포함하고 카드를 열 수 있다', async () => {
  const onOpen = jest.fn()
  render(
    <EntryCard
      entry={{
        ...entry,
        reactions: [
          { emoji: 'CLAP', count: 0, reactedByMe: false },
          { emoji: 'LAUGH', count: 1, reactedByMe: false },
          { emoji: 'TOUCHED', count: 2, reactedByMe: false },
          { emoji: 'PRAY', count: 3, reactedByMe: true },
          { emoji: 'HEART', count: 4, reactedByMe: false },
        ],
        commentCount: 2,
        latestComment: { author: { userId: 2, name: '김하늘', profileImageUrl: null }, content: '저도 감사해요' },
      }}
      onOpen={onOpen}
    />
  )

  const card = screen.getByRole('button', {
    name: '정은혜 아침 감사 09:15: 함께 나눈 아침에 감사해요. 반응: 좋아요 4개, 아멘 3개 (내 반응), 감동이에요 2개. 댓글 2개. 최근 댓글, 김하늘: 저도 감사해요',
  })
  expect(card).not.toHaveAccessibleName(/박수|웃겨요/)
  await userEvent.setup().click(card)
  expect(onOpen).toHaveBeenCalledWith(7)
})

it('반응이나 댓글이 없는 카드도 누락된 값 없이 읽을 수 있다', () => {
  render(<EntryCard entry={entry} onOpen={jest.fn()} />)
  expect(screen.getByRole('button')).toHaveAccessibleName('정은혜 아침 감사 09:15: 함께 나눈 아침에 감사해요. 댓글 0개')
})

it('반응·댓글 수가 바뀌면 읽기 내용도 갱신하고 영상의 무음 상태를 알린다', () => {
  const video = { ...entry, media: { ...entry.media, type: 'VIDEO' as const } }
  const { rerender } = render(<EntryCard entry={video} onOpen={jest.fn()} />)
  expect(screen.getByRole('button')).toHaveAccessibleName(/댓글 0개\. 소리 없이 재생되는 영상$/)

  rerender(
    <EntryCard
      entry={{ ...video, reactions: [{ emoji: 'HEART', count: 1, reactedByMe: true }], commentCount: 1 }}
      onOpen={jest.fn()}
    />
  )
  expect(screen.getByRole('button')).toHaveAccessibleName(
    /반응: 좋아요 1개 \(내 반응\)\. 댓글 1개\. 소리 없이 재생되는 영상$/
  )
})
