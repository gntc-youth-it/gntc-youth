import { cn } from '../../../shared/lib'

interface GenderSelectorProps {
  value: 'MALE' | 'FEMALE' | null
  onChange: (gender: 'MALE' | 'FEMALE') => void
}

const MaleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="14" r="6" />
    <path d="M20 4l-5.5 5.5" />
    <path d="M15 4h5v5" />
  </svg>
)

const FemaleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="10" r="6" />
    <path d="M12 16v6" />
    <path d="M9 19h6" />
  </svg>
)

export const GenderSelector = ({ value, onChange }: GenderSelectorProps) => {
  return (
    <div className="flex gap-5 w-full">
      <button
        type="button"
        data-testid="gender-male"
        className={cn(
          'flex flex-col items-center gap-2.5 rounded-xl py-5 px-6 w-[150px] transition-all',
          value === 'MALE'
            ? 'bg-indigo-50 border-2 border-[#3B5BDB]'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        )}
        onClick={() => onChange('MALE')}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            value === 'MALE' ? 'bg-[#3B5BDB] text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          <MaleIcon className="w-8 h-8" />
        </div>
        <span
          className={cn(
            'text-base font-semibold',
            value === 'MALE' ? 'text-[#3B5BDB]' : 'text-gray-500'
          )}
        >
          형제
        </span>
      </button>

      <button
        type="button"
        data-testid="gender-female"
        className={cn(
          'flex flex-col items-center gap-2.5 rounded-xl py-5 px-6 w-[150px] transition-all',
          value === 'FEMALE'
            ? 'bg-pink-50 border-2 border-[#E64980]'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        )}
        onClick={() => onChange('FEMALE')}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            value === 'FEMALE' ? 'bg-[#E64980] text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          <FemaleIcon className="w-8 h-8" />
        </div>
        <span
          className={cn(
            'text-base font-semibold',
            value === 'FEMALE' ? 'text-[#E64980]' : 'text-gray-500'
          )}
        >
          자매
        </span>
      </button>
    </div>
  )
}
