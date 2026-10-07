import { useEffect, useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../../../shared/ui'
import { createZooTeam } from '../api/zooTeamApi'
import type { CourseId } from '../model/course'
import { TEAM_NAME_MAX_LENGTH } from '../model/team'
import type { ZooTeamDetail } from '../model/team'
import { toActionError } from '../model/useZooTeam'
import { CourseToggle } from './CourseToggle'
import { PARK_GREEN } from './courseTheme'

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (team: ZooTeamDetail) => void
  onFailed?: () => void
}

export const CreateTeamDialog = ({ open, onOpenChange, onCreated, onFailed }: CreateTeamDialogProps) => {
  const [name, setName] = useState('')
  const [course, setCourse] = useState<CourseId | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setCourse(null)
      setError(null)
    }
  }, [open])

  const trimmedName = name.trim()
  const canSubmit = trimmedName.length > 0 && course !== null && !isSubmitting

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit || !course) return

    setIsSubmitting(true)
    setError(null)
    try {
      onCreated(await createZooTeam({ name: trimmedName, course }))
    } catch (err) {
      setError(toActionError(err).message)
      onFailed?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-3xl p-6">
        <DialogTitle className="font-sign text-[30px] font-normal leading-tight" style={{ color: PARK_GREEN }}>
          조 만들기
        </DialogTitle>
        <DialogDescription className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#4E5968]">
          만든 사람이 조장이 돼요. 조원이 다 모이면 마감하고 함께 출발해요.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="zoo-team-name" className="block text-[14px] font-semibold text-[#191F28]">
            조 이름
          </label>
          <input
            id="zoo-team-name"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, TEAM_NAME_MAX_LENGTH))}
            maxLength={TEAM_NAME_MAX_LENGTH}
            placeholder="예: 사자팀"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-[#D1D6DB] px-4 py-3 text-[16px] text-[#191F28] outline-none transition-colors placeholder:text-[#B0B8C1] focus:border-[#1F4D36]"
          />
          <p className="mt-1 text-right text-[12px] text-[#8B95A1]">
            {name.length}/{TEAM_NAME_MAX_LENGTH}
          </p>

          <p className="mt-3 text-[14px] font-semibold text-[#191F28]">코스</p>
          <div className="mt-2">
            <CourseToggle course={course} onSelect={setCourse} />
          </div>

          {error && (
            <p role="alert" className="mt-4 break-keep text-[13px] text-[#E03131]">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <DialogClose asChild>
              <button
                type="button"
                className="flex-1 rounded-xl border border-[#D1D6DB] py-3.5 text-[15px] font-semibold text-[#4E5968]"
              >
                취소
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-[1.6] rounded-xl py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: PARK_GREEN }}
            >
              {isSubmitting ? '만드는 중...' : '조 만들기'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
