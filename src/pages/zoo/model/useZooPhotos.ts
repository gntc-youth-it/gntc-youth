import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { fetchZooPhotos, unvoteZooPhoto, voteZooPhoto } from '../api/zooPhotoApi'
import type { ZooPhoto } from './photo'
import { ZOO_ERROR_CODE } from './team'
import { usePolling } from './usePolling'
import { toActionError } from './useZooTeam'
import type { ZooActionError } from './useZooTeam'

// 새로 올라온 사진만 받아 오면 되므로 조 화면보다 느긋하게 다시 불러온다
export const PHOTO_POLL_INTERVAL_MS = 30000

export type ZooPhotosLoadState = 'loading' | 'ready' | 'error'

export const useZooPhotos = () => {
  const [serverPhotos, setServerPhotos] = useState<ZooPhoto[]>([])
  const [loadState, setLoadState] = useState<ZooPhotosLoadState>('loading')
  // 이 화면에서 직접 누른 투표. 내 투표는 나만 바꾸므로 늦게 도착한 목록 응답보다 이 값을 믿는다
  const [myVotes, setMyVotes] = useState<Record<number, boolean>>({})
  const [voteError, setVoteError] = useState<ZooActionError | null>(null)
  const pending = useRef(new Set<number>())

  const load = useCallback(async () => {
    try {
      const { photos } = await fetchZooPhotos()
      setServerPhotos(photos)
      setLoadState('ready')
    } catch {
      // 이미 보여주던 사진은 그대로 두고 다음 주기에 다시 시도
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  usePolling(load, PHOTO_POLL_INTERVAL_MS, loadState === 'ready')

  const photos = useMemo(
    () => serverPhotos.map((photo) => (photo.id in myVotes ? { ...photo, isVoted: myVotes[photo.id] } : photo)),
    [serverPhotos, myVotes]
  )

  // 누르자마자 하트를 바꾸고 실패하면 되돌린다.
  // 같은 사진의 요청이 끝나기 전에 다시 누르면 무시해서, 투표와 취소가 뒤바뀐 순서로 도착하지 않게 한다
  const toggleVote = useCallback(
    async (photo: ZooPhoto) => {
      if (photo.isMyTeam || pending.current.has(photo.id)) return
      const nextVoted = !photo.isVoted

      pending.current.add(photo.id)
      setVoteError(null)
      setMyVotes((prev) => ({ ...prev, [photo.id]: nextVoted }))
      try {
        await (nextVoted ? voteZooPhoto(photo.id) : unvoteZooPhoto(photo.id))
      } catch (error) {
        setMyVotes((prev) => ({ ...prev, [photo.id]: !nextVoted }))
        setVoteError(toActionError(error))
        // 사진이 지워졌거나 우리 조 사진이었다면 화면이 서버와 어긋난 것이니 목록을 다시 받는다
        const isStale =
          error instanceof HttpError &&
          (error.code === ZOO_ERROR_CODE.PHOTO_NOT_FOUND || error.code === ZOO_ERROR_CODE.OWN_TEAM_PHOTO)
        if (isStale) void load()
      } finally {
        pending.current.delete(photo.id)
      }
    },
    [load]
  )

  const dismissVoteError = useCallback(() => setVoteError(null), [])

  return { photos, loadState, reload: load, toggleVote, voteError, dismissVoteError }
}
