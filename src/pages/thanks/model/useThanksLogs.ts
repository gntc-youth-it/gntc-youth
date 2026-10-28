import { useCallback, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { usePolling } from '../../../shared/lib'
import { deleteThanksEntry, fetchThanksEntries } from '../api/thanksApi'
import { groupLogs, removeEntry, upsertEntry } from './logs'
import { THANKS_ERROR_CODE } from './types'
import type { ThanksEntry, ThanksLog } from './types'

const POLL_INTERVAL_MS = 30 * 1000

// 그날의 감사로그. 오늘 화면을 보고 있으면 30초마다 새로 불러온다
export const useThanksLogs = (date: string, { poll }: { poll: boolean }) => {
  const [logs, setLogs] = useState<ThanksLog[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 날짜를 넘긴 뒤에 늦게 도착한 앞 날짜 응답은 버린다
  const currentDate = useRef(date)
  currentDate.current = date
  // 새로고침은 화면 복귀 때와 30초마다 겹쳐 돌 수 있다. 더 새로운 요청이 있거나
  // 그사이 올리기·지우기로 목록을 직접 고쳤으면, 먼저 보낸 요청의 응답은 버린다
  const requestSeq = useRef(0)

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    const isStale = () => currentDate.current !== date || seq !== requestSeq.current
    try {
      const { entries } = await fetchThanksEntries(date)
      if (isStale()) return
      setLogs(groupLogs(entries))
      setError(null)
    } catch {
      if (isStale()) return
      setError('감사로그를 불러오지 못했어요. 잠시 후 다시 열어 주세요.')
    }
  }, [date])

  useEffect(() => {
    setLogs(null)
    setError(null)
    void load()
  }, [load])

  usePolling(load, POLL_INTERVAL_MS, poll)

  // 방금 올린 기록은 다음 새로고침을 기다리지 않고 바로 보여 준다
  const addEntry = useCallback((entry: ThanksEntry) => {
    if (entry.missionDate !== currentDate.current) return
    requestSeq.current += 1
    setLogs((prev) => upsertEntry(prev ?? [], entry))
  }, [])

  const deleteEntry = useCallback(async (entryId: number) => {
    try {
      await deleteThanksEntry(entryId)
    } catch (error) {
      // 다른 기기에서 이미 지웠으면 목록에서만 빼면 된다
      if (!(error instanceof HttpError && error.code === THANKS_ERROR_CODE.ENTRY_NOT_FOUND)) throw error
    }
    requestSeq.current += 1
    setLogs((prev) => (prev ? removeEntry(prev, entryId) : prev))
  }, [])

  // 반응처럼 한 기록만 바꿀 때. 사람 순서는 그대로다
  const updateEntry = useCallback((entryId: number, update: (entry: ThanksEntry) => ThanksEntry) => {
    requestSeq.current += 1
    setLogs((prev) =>
      prev
        ? prev.map((log) => ({ ...log, entries: log.entries.map((entry) => (entry.id === entryId ? update(entry) : entry)) }))
        : prev
    )
  }, [])

  // 다른 기기에서 이미 지운 기록을 목록에서만 뺀다
  const dropEntry = useCallback((entryId: number) => {
    requestSeq.current += 1
    setLogs((prev) => (prev ? removeEntry(prev, entryId) : prev))
  }, [])

  return { logs, error, reload: load, addEntry, deleteEntry, updateEntry, dropEntry }
}
