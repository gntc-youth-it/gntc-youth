import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../../shared/ui'

interface ProfileCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const ProfileCompletionModal = ({
  open,
  onOpenChange,
  onConfirm,
}: ProfileCompletionModalProps) => {
  const handleConfirm = () => {
    onOpenChange(false)
    onConfirm()
  }

  const handleDismiss = () => {
    sessionStorage.setItem('profileCompletionDismissed', 'true')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 gap-0 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 pt-7 px-7">
          <div className="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B5BDB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <DialogTitle className="text-xl font-semibold text-[#1A1A1A] text-center">
            프로필을 완성해보세요!
          </DialogTitle>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-2 px-7 pt-0 pb-5">
          <DialogDescription className="text-[15px] text-[#333333] text-center leading-relaxed">
            아직 작성되지 않은 프로필이 있어요
          </DialogDescription>
          <p className="text-sm text-[#666666] text-center leading-snug">
            지금 완성해서 더 많은 기능을 이용해보세요
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E0E0E0]" />

        {/* Buttons */}
        <div className="flex flex-col gap-3 p-5">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full h-11 rounded-lg bg-[#3B5BDB] text-white text-[15px] font-medium shadow-sm hover:bg-[#364FC7] transition-colors"
          >
            네, 작성할게요
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full h-11 rounded-lg bg-white text-[#666666] text-[15px] font-medium border border-[#E0E0E0] hover:bg-gray-50 transition-colors"
          >
            다음에 할게요
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
