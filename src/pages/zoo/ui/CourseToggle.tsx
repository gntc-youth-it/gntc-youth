import { COURSE_IDS, ZOO_STOPS, COURSE_STOP_IDS } from '../model/course'
import type { CourseId } from '../model/course'
import { COURSE_THEME } from './courseTheme'

interface CourseToggleProps {
  course: CourseId | null
  onSelect: (course: CourseId) => void
}

export const CourseToggle = ({ course, onSelect }: CourseToggleProps) => (
  <div className="grid grid-cols-2 gap-3" aria-label="코스 선택" role="group">
    {COURSE_IDS.map((id) => {
      const theme = COURSE_THEME[id]
      const isSelected = course === id
      const firstStop = ZOO_STOPS[COURSE_STOP_IDS[id][0]]

      return (
        <button
          key={id}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(id)}
          className="relative overflow-hidden rounded-2xl border-2 px-4 pb-3.5 pt-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
          style={{
            borderColor: isSelected ? theme.color : '#E5E8EB',
            backgroundColor: isSelected ? theme.tint : '#FFFFFF',
          }}
        >
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: theme.color }} />
          <span className="flex items-center justify-between">
            <span className="font-sign text-[28px] leading-none text-[#191F28]">{id}코스</span>
            {isSelected && (
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.color }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.onColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17.5 19 7" />
                </svg>
              </span>
            )}
          </span>
          <span className="mt-2 block text-[13px] leading-snug text-[#4E5968]">{firstStop.name}부터</span>
        </button>
      )
    })}
  </div>
)
