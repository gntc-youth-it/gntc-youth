import { useCallback, useState } from 'react'
import type { StopId } from './course'
import type { ZooMissionAnswer } from './team'

type AnswerMap = Record<string, string>

export const getMissionDraftKey = (teamId: number, stopId: StopId) => `zooMissionDraft:${teamId}:${stopId}`

const readDraft = (key: string): AnswerMap | null => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    )
  } catch {
    return null
  }
}

const writeDraft = (key: string, answers: AnswerMap) => {
  try {
    localStorage.setItem(key, JSON.stringify(answers))
  } catch {
    // 저장하지 못해도 화면에서는 그대로 쓸 수 있다
  }
}

const removeDraft = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // 지우지 못해도 다음 제출 때 덮어쓴다
  }
}

// 쓰던 답은 폰에 임시 저장해서, 신호가 끊기거나 화면을 나갔다 와도 다시 쓰지 않게 한다.
// 저장된 초안이 없으면 이미 낸 답으로 시작한다.
export const useMissionDraft = (teamId: number, stopId: StopId, submittedAnswers?: ZooMissionAnswer[]) => {
  const key = getMissionDraftKey(teamId, stopId)
  const [answers, setAnswers] = useState<AnswerMap>(
    () =>
      readDraft(key) ??
      Object.fromEntries((submittedAnswers ?? []).map(({ questionId, answer }) => [questionId, answer]))
  )

  const setAnswer = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: value }
        writeDraft(key, next)
        return next
      })
    },
    [key]
  )

  const clearDraft = useCallback(() => removeDraft(key), [key])

  return { answers, setAnswer, clearDraft }
}
