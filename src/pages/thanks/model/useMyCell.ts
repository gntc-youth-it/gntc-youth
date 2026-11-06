import { useCallback, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { chooseCell, fetchCells } from '../api/thanksApi'
import { THANKS_ERROR_CODE } from './types'
import type { ThanksCellsResponse } from './types'

// 구역 목록과 내 구역. 고른 구역은 서버에 있어서 다른 기기에서도 다시 묻지 않는다
export const useMyCell = () => {
  // 불러오는 중이면 null
  const [data, setData] = useState<ThanksCellsResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saving = useRef(false)
  // 불러오기 응답이 왔을 때 그사이 다시 불러왔거나 구역을 저장했으면 그 응답은 버린다
  const requestSeq = useRef(0)

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoadError(null)
    try {
      const next = await fetchCells()
      if (seq === requestSeq.current) setData(next)
    } catch {
      if (seq === requestSeq.current) setLoadError('구역 목록을 불러오지 못했어요.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // 저장하는 동안에는 다시 보내지 않는다. 저장했으면 true
  const choose = useCallback(
    async (cellId: number): Promise<boolean> => {
      if (saving.current) return false
      saving.current = true
      setIsSaving(true)
      setSaveError(null)
      try {
        const next = await chooseCell(cellId)
        requestSeq.current += 1
        setData(next)
        return true
      } catch (error) {
        // 목록을 띄워 둔 사이 없어진 구역이면 목록을 새로 받아 다시 고르게 한다
        if (error instanceof HttpError && error.code === THANKS_ERROR_CODE.CELL_NOT_FOUND) {
          setSaveError('이 구역은 고를 수 없어요. 다시 골라 주세요.')
          void load()
          return false
        }
        setSaveError('구역을 저장하지 못했어요. 잠시 후 다시 눌러 주세요.')
        return false
      } finally {
        saving.current = false
        setIsSaving(false)
      }
    },
    [load]
  )

  return {
    cells: data?.cells ?? null,
    myCellId: data?.myCellId ?? null,
    loadError,
    saveError,
    isSaving,
    reload: load,
    choose,
  }
}
