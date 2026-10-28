import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth'
import type { UserInfo } from '../../../features/auth'
import { dismissProfilePrompt, wasProfilePromptDismissed } from '../model/profilePrompt'
import { getCurrentSlot, getMissionDate, isValidMissionDate, shiftMissionDate } from '../model/slots'
import type { ThanksAuthor, ThanksEntry } from '../model/types'
import { useCurrentUser } from '../model/useCurrentUser'
import { useEntryComments } from '../model/useEntryComments'
import { useEntryEdit } from '../model/useEntryEdit'
import { useNow } from '../model/useNow'
import { useReactions } from '../model/useReactions'
import { useThanksLogs } from '../model/useThanksLogs'
import { EntryViewer } from './EntryViewer'
import { LogGroup } from './LogGroup'
import { ProfileSheet } from './ProfileSheet'
import { ThanksHeader } from './ThanksHeader'
import { ThanksLoginRequired } from './ThanksLoginRequired'
import { WriteBar } from './WriteBar'
import { WriteSheet } from './WriteSheet'
import { DailyProgress } from './DailyProgress'
import { ThanksMark } from './ThanksBrand'
import './thanks.css'

interface OverlayState {
  openedFromList?: boolean
}

export const ThanksPage = () => {
  const user = useCurrentUser()
  if (!user) return <ThanksLoginRequired />
  return <ThanksBoard user={user} />
}

const ThanksBoard = ({ user }: { user: UserInfo }) => {
  const { refreshUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const now = useNow()
  const today = getMissionDate(now)
  // 손으로 고친 주소나 잘못된 링크(?date=foo, 빈 값, 미래 날짜)는 오늘로 본다
  const requestedDate = searchParams.get('date')
  const date = requestedDate && isValidMissionDate(requestedDate) && requestedDate <= today ? requestedDate : today
  const isToday = date === today
  const currentSlot = getCurrentSlot(now)

  const { logs, error, reload, addEntry, deleteEntry, updateEntry, dropEntry } = useThanksLogs(date, { poll: isToday })
  const myLog = isToday ? logs?.find((log) => log.entries.some((entry) => entry.isMine)) : undefined
  const hasPostedCurrentSlot = myLog?.entries.some((entry) => entry.slot === currentSlot) ?? false

  const openedEntryId = Number(searchParams.get('entry'))
  const openedEntry = openedEntryId
    ? (logs?.flatMap((log) => log.entries).find((entry) => entry.id === openedEntryId) ?? null)
    : null
  const isWriting = searchParams.get('write') === '1'

  // 반응·댓글·고치기를 보내는 사이 다른 기기에서 지워진 감사면 목록에서 빼고(크게 보기도 같이 닫힌다) 알려 준다
  const handleEntryGone = useCallback(
    (entryId: number) => {
      dropEntry(entryId)
      window.alert('이미 지워진 감사예요.')
    },
    [dropEntry]
  )
  const handleActionError = useCallback((message: string) => window.alert(message), [])
  const { react } = useReactions({ updateEntry, onEntryGone: handleEntryGone, onError: handleActionError })
  const { updateContent } = useEntryEdit({ updateEntry, onEntryGone: handleEntryGone, onError: handleActionError })
  const comments = useEntryComments(openedEntry?.id ?? null, {
    updateEntry,
    onEntryGone: handleEntryGone,
    onError: handleActionError,
  })

  const me: ThanksAuthor = { userId: user.id, name: user.name, profileImageUrl: user.profileImagePath || null }
  const [profileSheet, setProfileSheet] = useState<'prompt' | 'edit' | null>(null)

  // 프로필 사진이 없으면 들어왔을 때 사진과 이름을 정해 달라고 한다. 하루 한 번만
  const profilePromptChecked = useRef(false)
  useEffect(() => {
    if (profilePromptChecked.current) return
    profilePromptChecked.current = true
    if (!user.profileImagePath && !wasProfilePromptDismissed(today)) setProfileSheet('prompt')
  }, [user.profileImagePath, today])

  const closeProfileSheet = useCallback(() => {
    if (profileSheet === 'prompt') dismissProfilePrompt(today)
    setProfileSheet(null)
  }, [profileSheet, today])

  // 저장하면 토큰을 새로 받아 내 사진·이름을 바꾸고, 목록의 내 카드도 새로 불러온다
  const handleProfileSaved = async () => {
    setProfileSheet(null)
    try {
      await refreshUser()
    } catch {
      // 저장은 됐다. 헤더 사진은 다음에 토큰을 새로 받을 때 바뀐다
    }
    void reload()
  }

  const changeDate = (next: string) => {
    const params = new URLSearchParams(searchParams)
    if (next === today) params.delete('date')
    else params.set('date', next)
    setSearchParams(params, { replace: true })
    window.scrollTo(0, 0)
  }

  // 크게 보기와 기록하기는 주소에 남겨서 휴대폰 뒤로가기로 닫히게 한다
  const openOverlay = (key: 'entry' | 'write', value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(key, value)
    const state: OverlayState = { openedFromList: true }
    navigate({ search: params.toString() }, { state })
  }

  const closeOverlay = useCallback(() => {
    if ((location.state as OverlayState | null)?.openedFromList) {
      navigate(-1)
      return
    }
    const params = new URLSearchParams(location.search)
    params.delete('entry')
    params.delete('write')
    navigate({ search: params.toString() }, { replace: true })
  }, [location.search, location.state, navigate])

  const handlePosted = (entry: ThanksEntry) => {
    addEntry(entry)
    closeOverlay()
    window.scrollTo(0, 0)
  }

  return (
    <div className="thanks-app">
      <main className={`thanks-shell ${isToday ? 'has-write-bar' : ''}`}>
        <ThanksHeader
          date={date}
          isToday={isToday}
          personCount={logs?.length ?? 0}
          isLoading={logs === null}
          me={me}
          onOpenProfile={() => setProfileSheet('edit')}
          onPrevDate={() => changeDate(shiftMissionDate(date, -1))}
          onNextDate={() => changeDate(shiftMissionDate(date, 1))}
          onToday={() => changeDate(today)}
        />

        {isToday && logs !== null && (
          <DailyProgress
            currentSlot={currentSlot}
            postedSlots={myLog?.entries.map((entry) => entry.slot) ?? []}
            onWrite={() => openOverlay('write', '1')}
          />
        )}

        <div className="thanks-feed-heading">
          <h2 className="sr-only">함께 나눈 감사</h2>
        </div>
        {error && logs !== null && (
          <p role="alert" className="thanks-error-inline">
            새 기록을 불러오지 못했어요.
            <button type="button" onClick={() => void reload()}>
              다시 불러오기
            </button>
          </p>
        )}
        {logs === null ? (
          error ? (
            <div className="thanks-empty">
              <p role="alert">{error}</p>
              <button type="button" onClick={() => void reload()} className="thanks-retry">
                다시 불러오기
              </button>
            </div>
          ) : (
            <div role="status" className="thanks-skeleton">
              <span className="sr-only">불러오는 중…</span>
              <div aria-hidden="true" />
              <div aria-hidden="true" />
            </div>
          )
        ) : logs.length === 0 ? (
          <div className="thanks-empty">
            <div className="thanks-empty-mark">
              <ThanksMark size={42} />
            </div>
            <h3>{isToday ? '오늘의 첫 감사를 기다려요' : '잠시 쉬어 간 하루예요'}</h3>
            <p>
              {isToday
                ? currentSlot
                  ? '거창하지 않아도 괜찮아요. 사진 한 장과 짧은 감사로 오늘을 시작해 보세요.'
                  : '아침 6시, 새로운 감사 기록이 열려요. 그동안 지난날의 감사를 돌아보세요.'
                : '남겨진 기록은 없지만, 다른 날의 감사는 날짜를 넘겨서 볼 수 있어요.'}
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <LogGroup
              key={log.author.userId}
              log={log}
              now={now}
              onOpenEntry={(id) => openOverlay('entry', String(id))}
            />
          ))
        )}
      </main>

      {isToday && logs !== null && (
        <WriteBar
          today={today}
          currentSlot={currentSlot}
          hasPostedCurrentSlot={hasPostedCurrentSlot}
          onWrite={() => openOverlay('write', '1')}
        />
      )}

      {openedEntry && (
        <EntryViewer
          key={openedEntry.id}
          entry={openedEntry}
          now={now}
          onClose={closeOverlay}
          onUpdateContent={(content) => updateContent(openedEntry.id, content)}
          onReact={(emoji) => void react(openedEntry, emoji)}
          comments={comments.comments}
          commentsError={comments.error}
          onRetryComments={() => void comments.reload()}
          onAddComment={comments.add}
          isSendingComment={comments.isSending}
          onDeleteComment={(commentId) => void comments.remove(commentId)}
          onDeleteEntry={async () => {
            await deleteEntry(openedEntry.id)
            closeOverlay()
          }}
        />
      )}

      {isWriting && <WriteSheet now={now} onClose={closeOverlay} onPosted={handlePosted} />}

      {profileSheet && (
        <ProfileSheet mode={profileSheet} user={user} onLater={closeProfileSheet} onSaved={handleProfileSaved} />
      )}
    </div>
  )
}
