import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentSlot, getMissionDate, isValidMissionDate, shiftMissionDate } from '../model/slots'
import type { ThanksEntry } from '../model/types'
import { useCurrentUser } from '../model/useCurrentUser'
import { useNow } from '../model/useNow'
import { useThanksLogs } from '../model/useThanksLogs'
import { EntryViewer } from './EntryViewer'
import { LogGroup } from './LogGroup'
import { ThanksHeader } from './ThanksHeader'
import { ThanksLoginRequired } from './ThanksLoginRequired'
import { WriteBar } from './WriteBar'
import { WriteSheet } from './WriteSheet'

interface OverlayState {
  openedFromList?: boolean
}

export const ThanksPage = () => {
  const user = useCurrentUser()
  if (!user) return <ThanksLoginRequired />
  return <ThanksBoard />
}

const ThanksBoard = () => {
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

  const { logs, error, addEntry, deleteEntry } = useThanksLogs(date, { poll: isToday })
  const myLog = isToday ? logs?.find((log) => log.entries.some((entry) => entry.isMine)) : undefined
  const hasPostedCurrentSlot = myLog?.entries.some((entry) => entry.slot === currentSlot) ?? false

  const openedEntryId = Number(searchParams.get('entry'))
  const openedEntry = openedEntryId
    ? logs?.flatMap((log) => log.entries).find((entry) => entry.id === openedEntryId) ?? null
    : null
  const isWriting = searchParams.get('write') === '1'

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
    <div className="min-h-screen bg-[#F2EFEA]">
      <main className={`mx-auto max-w-md px-4 ${isToday ? 'pb-36' : 'pb-16'}`}>
        <ThanksHeader
          date={date}
          isToday={isToday}
          personCount={logs?.length ?? 0}
          isLoading={logs === null}
          onPrevDate={() => changeDate(shiftMissionDate(date, -1))}
          onNextDate={() => changeDate(shiftMissionDate(date, 1))}
        />

        {logs === null ? (
          error ? (
            <p role="alert" className="mt-16 text-center text-[15px] text-[#6B7684]">
              {error}
            </p>
          ) : (
            <p className="mt-16 text-center text-[14px] text-[#8B95A1]">불러오는 중…</p>
          )
        ) : logs.length === 0 ? (
          <p className="mt-24 text-center text-[44px]" aria-hidden="true">
            🙏
          </p>
        ) : (
          logs.map((log) => (
            <LogGroup key={log.author.userId} log={log} now={now} onOpenEntry={(id) => openOverlay('entry', String(id))} />
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
          onDeleteEntry={async () => {
            await deleteEntry(openedEntry.id)
            closeOverlay()
          }}
        />
      )}

      {isWriting && <WriteSheet now={now} onClose={closeOverlay} onPosted={handlePosted} />}
    </div>
  )
}
