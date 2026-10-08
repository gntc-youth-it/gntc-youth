interface SegmentedControlProps<T extends string> {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

// 한 화면 안에서 보기 방식을 바꾸는 버튼 묶음 (예: 투표하기 / 결과 보기)
export const SegmentedControl = <T extends string>({ value, options, onChange }: SegmentedControlProps<T>) => (
  <div role="group" aria-label="화면 고르기" className="mt-5 flex rounded-xl bg-[#F2F4F6] p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={`flex-1 rounded-lg py-2.5 text-[14px] font-semibold transition-colors ${
          value === option.value ? 'bg-white text-[#191F28] shadow-sm' : 'text-[#6B7684]'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
)
