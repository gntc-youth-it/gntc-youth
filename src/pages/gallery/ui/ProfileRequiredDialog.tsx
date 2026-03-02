interface ProfileRequiredDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ProfileRequiredDialog = ({
  open,
  onConfirm,
  onCancel,
}: ProfileRequiredDialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-[420px] w-[calc(100%-32px)] overflow-hidden">
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
          <h2 className="text-xl font-semibold text-[#1A1A1A] text-center">
            추가 정보가 필요합니다
          </h2>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-2 px-7 pt-2 pb-5">
          <p className="text-[15px] text-[#333333] text-center leading-relaxed">
            게시글 검수를 위해 성전 정보와 기수 정보가 필요합니다.
          </p>
          <p className="text-sm text-[#666666] text-center leading-snug">
            내 정보 수정에서 입력해주세요.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E0E0E0]" />

        {/* Buttons */}
        <div className="flex flex-col gap-3 p-5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full h-11 rounded-lg bg-[#3B5BDB] text-white text-[15px] font-medium shadow-sm hover:bg-[#364FC7] transition-colors"
          >
            정보 입력하기
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full h-11 rounded-lg bg-white text-[#666666] text-[15px] font-medium border border-[#E0E0E0] hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
