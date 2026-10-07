import { COURSE_STOP_IDS, ZOO_STOPS } from '../model/course'
import type { StopId } from '../model/course'
import { PARK_GREEN } from './courseTheme'

export type StopFilterValue = StopId | 'ALL'

interface StopFilterProps {
  value: StopFilterValue
  counts: Partial<Record<StopId, number>>
  total: number
  onChange: (value: StopFilterValue) => void
}

// 장소별로 골라 보기. 장소가 많아 옆으로 밀어서 본다
export const StopFilter = ({ value, counts, total, onChange }: StopFilterProps) => {
  const options: { value: StopFilterValue; label: string; count: number }[] = [
    { value: 'ALL', label: '전체', count: total },
    ...COURSE_STOP_IDS.A.map((stopId) => ({ value: stopId, label: ZOO_STOPS[stopId].name, count: counts[stopId] ?? 0 })),
  ]

  return (
    <div role="group" aria-label="장소 고르기" className="scrollbar-hide -mx-4 mt-5 overflow-x-auto px-4 py-1">
      <div className="flex w-max gap-2">
        {options.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              disabled={option.value !== 'ALL' && option.count === 0}
              onClick={() => onChange(option.value)}
              className="shrink-0 rounded-full border px-3.5 py-2 text-[14px] font-semibold transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
              style={
                isSelected
                  ? { backgroundColor: PARK_GREEN, borderColor: PARK_GREEN, color: '#FFFFFF' }
                  : { backgroundColor: '#FFFFFF', borderColor: '#D1D6DB', color: '#333D4B' }
              }
            >
              {option.label}
              <span className={`ml-1 ${isSelected ? 'text-white/75' : 'text-[#8B95A1]'}`}>{option.count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
