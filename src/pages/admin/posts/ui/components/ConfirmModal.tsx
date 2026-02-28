export const ConfirmModal = ({
  title,
  message,
  confirmLabel,
  confirmClassName,
  isProcessing,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClassName: string
  isProcessing: boolean
  onConfirm: () => void
  onCancel: () => void
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
    <div
      role="dialog"
      aria-modal="true"
      className="relative bg-white rounded-2xl shadow-2xl w-[320px] mx-4 p-6 flex flex-col items-center gap-4"
    >
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-lg font-bold text-[#1A1A1A]">{title}</h3>
        <p className="text-sm text-[#666666] text-center whitespace-pre-line">{message}</p>
      </div>
      <div className="flex gap-3 w-full mt-2">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-2.5 rounded-lg bg-[#F0F0F0] text-sm font-medium text-[#666666] hover:bg-[#E0E0E0] transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${confirmClassName}`}
        >
          {isProcessing ? '처리 중...' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
)
