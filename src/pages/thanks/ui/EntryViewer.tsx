import { FormEvent, useEffect, useState } from 'react'
import { REACTIONS } from '../model/reactions'
import { formatKstTime, formatRelativeTime, getSlotInfo } from '../model/slots'
import { COMMENT_MAX_LENGTH, CONTENT_MAX_LENGTH } from '../model/types'
import type { ReactionEmoji, ThanksComment, ThanksEntry } from '../model/types'
import { Avatar } from './Avatar'
import { EntryMedia } from './EntryMedia'

// 반응·댓글·감사제목 수정은 API가 붙는 단계에서 넘겨준다. 넘기지 않으면 그 부분은 안 보인다
interface EntryViewerProps {
  entry: ThanksEntry
  now: Date
  onClose: () => void
  onDeleteEntry?: () => Promise<void>
  // 고쳤으면 true. 그때만 고치기를 닫는다
  onUpdateContent?: (content: string) => Promise<boolean>
  onReact?: (emoji: ReactionEmoji) => void
  // 댓글. 불러오는 중이면 null
  comments?: ThanksComment[] | null
  commentsError?: string | null
  onRetryComments?: () => void
  // 달았으면 true. 그때만 입력창을 비운다
  onAddComment?: (content: string) => Promise<boolean>
  isSendingComment?: boolean
  onDeleteComment?: (commentId: number) => void
}

// 카드를 누르면 뜨는 크게 보기. 감사제목 전체(80자)를 여기서 본다
export const EntryViewer = ({
  entry,
  now,
  onClose,
  onDeleteEntry,
  onUpdateContent,
  onReact,
  comments,
  commentsError,
  onRetryComments,
  onAddComment,
  isSendingComment = false,
  onDeleteComment,
}: EntryViewerProps) => {
  const [isMuted, setIsMuted] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [draft, setDraft] = useState(entry.content)
  const [comment, setComment] = useState('')

  // 뒤에 있는 목록이 같이 스크롤되지 않게 막고, Esc로 닫는다
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // 고칠 때마다 지금 감사제목에서 시작한다
  const startEditing = () => {
    setDraft(entry.content)
    setIsEditing(true)
  }

  // 저장하는 동안에는 다시 보내지 않고, 고치지 못하면 고친 글을 그대로 둔다. 그대로면 보내지 않고 닫는다
  const handleSaveContent = async () => {
    const trimmed = draft.trim()
    if (!trimmed || !onUpdateContent || isSaving) return
    if (trimmed === entry.content) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    const saved = await onUpdateContent(trimmed)
    setIsSaving(false)
    if (saved) setIsEditing(false)
  }

  const handleDeleteEntry = async () => {
    if (!onDeleteEntry || !window.confirm('이 감사 기록을 지울까요?')) return
    setIsDeleting(true)
    try {
      await onDeleteEntry()
    } catch {
      setIsDeleting(false)
      window.alert('지우지 못했어요. 잠시 후 다시 해 주세요.')
    }
  }

  // 보내는 동안에는 다시 보내지 않고, 달지 못하면 쓴 글을 그대로 둔다
  const handleSubmitComment = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = comment.trim()
    if (!trimmed || !onAddComment || isSendingComment) return
    if (await onAddComment(trimmed)) setComment('')
  }

  const handleDeleteComment = (commentId: number) => {
    if (onDeleteComment && window.confirm('이 댓글을 지울까요?')) onDeleteComment(commentId)
  }

  const slotLabel = getSlotInfo(entry.slot).label
  const canComment = comments !== undefined && onAddComment !== undefined

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.author.name}의 ${slotLabel} 감사`}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#141414] text-white"
    >
      <div className={`mx-auto max-w-md px-4 pt-3 ${canComment ? 'pb-32' : 'pb-12'}`}>
        <div className="flex items-center gap-2.5">
          <Avatar author={entry.author} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold">{entry.author.name}</p>
            <p className="text-[12px] text-white/55">
              {slotLabel} 감사 · {formatKstTime(entry.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[22px] bg-black">
          <EntryMedia media={entry.media} fit="contain" muted={isMuted} className="max-h-[62vh]" />
          {/* 영상은 소리 없이 시작하고, 영상이나 버튼을 눌러야 소리가 난다 */}
          {entry.media.type === 'VIDEO' && (
            <button
              type="button"
              onClick={() => setIsMuted((muted) => !muted)}
              aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
              className="absolute inset-0 flex items-end justify-end p-3"
            >
              <span className="rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-semibold">
                {isMuted ? '🔇 눌러서 소리 듣기' : '🔊 소리 끄기'}
              </span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-4">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={CONTENT_MAX_LENGTH}
              rows={3}
              aria-label="감사제목 고치기"
              className="w-full resize-none rounded-2xl bg-white/10 p-3 text-[16px] leading-relaxed text-white outline-none focus:ring-2 focus:ring-white/40"
            />
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-white/50">
                {draft.length}/{CONTENT_MAX_LENGTH}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-full px-3 py-1.5 text-white/70">
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveContent}
                  disabled={!draft.trim() || isSaving}
                  className="rounded-full bg-white px-4 py-1.5 font-bold text-[#141414] disabled:opacity-50"
                >
                  {isSaving ? '저장하는 중…' : '저장'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 whitespace-pre-wrap break-keep text-[18px] font-semibold leading-relaxed">{entry.content}</p>
        )}

        {entry.isMine && !isEditing && (onUpdateContent || onDeleteEntry) && (
          <div className="mt-2 flex gap-3 text-[13px] text-white/50">
            {onUpdateContent && (
              <button type="button" onClick={startEditing} className="hover:text-white">
                수정
              </button>
            )}
            {onDeleteEntry && (
              <button type="button" onClick={handleDeleteEntry} disabled={isDeleting} className="hover:text-white disabled:opacity-50">
                {isDeleting ? '지우는 중…' : '삭제'}
              </button>
            )}
          </div>
        )}

        {onReact && (
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="반응">
            {REACTIONS.map((option) => {
              const reaction = entry.reactions.find((item) => item.emoji === option.id)
              const active = reaction?.reactedByMe ?? false
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onReact(option.id)}
                  aria-pressed={active}
                  aria-label={`${option.label} ${reaction?.count ?? 0}`}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[18px] transition-colors ${
                    active ? 'bg-white text-[#141414]' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {option.emoji}
                  {reaction && <span className="text-[13px] font-bold">{reaction.count}</span>}
                </button>
              )
            })}
          </div>
        )}

        {canComment && (
          <section className="mt-7" aria-label="댓글">
            <h2 className="text-[14px] font-bold text-white/70">댓글 {comments?.length ?? entry.commentCount}</h2>
            {/* 받아 둔 댓글이 있어도 다시 불러오지 못하면 알린다. 받아 둔 댓글은 그대로 보여 준다 */}
            {commentsError && (
              <p role="alert" className="mt-3 text-[14px] text-white/50">
                {commentsError}
                {onRetryComments && (
                  <button type="button" onClick={onRetryComments} className="ml-2 font-semibold text-white underline">
                    다시 불러오기
                  </button>
                )}
              </p>
            )}
            {!comments || comments.length === 0 ? (
              !commentsError && (
                <p className="mt-3 text-[14px] text-white/40">
                  {comments ? '첫 댓글로 마음을 보내 주세요' : '댓글을 불러오는 중…'}
                </p>
              )
            ) : (
              <ul className="mt-3 space-y-3.5">
                {comments.map((item) => (
                  <li key={item.id} className="flex gap-2.5">
                    <Avatar author={item.author} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px]">
                        <span className="font-bold">{item.author.name}</span>
                        <span className="ml-1.5 text-white/40">{formatRelativeTime(item.createdAt, now)}</span>
                      </p>
                      <p className="mt-0.5 break-keep text-[14px] leading-snug text-white/90">{item.content}</p>
                    </div>
                    {item.isMine && onDeleteComment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(item.id)}
                        className="self-start text-[12px] text-white/40 hover:text-white"
                      >
                        삭제
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {canComment && (
        <form
          onSubmit={handleSubmitComment}
          className="fixed inset-x-0 bottom-0 bg-[#141414]/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3"
        >
          <div className="mx-auto flex max-w-md items-center gap-2">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder="댓글로 마음을 보내요"
              aria-label="댓글"
              className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={!comment.trim() || isSendingComment}
              className="rounded-full bg-white px-4 py-3 text-[14px] font-bold text-[#141414] disabled:opacity-40"
            >
              {isSendingComment ? '보내는 중…' : '등록'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
