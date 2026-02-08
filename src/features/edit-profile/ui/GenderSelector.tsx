import { cn } from '../../../shared/lib'

interface GenderSelectorProps {
  value: 'MALE' | 'FEMALE' | null
  onChange: (gender: 'MALE' | 'FEMALE') => void
}

const MaleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <circle cx="12" cy="4.5" r="3" />
    <path d="M12 9c-3.3 0-6 2.7-6 6v3a1 1 0 0 0 1 1h2v-4a1 1 0 1 1 2 0v4h2v-4a1 1 0 1 1 2 0v4h2a1 1 0 0 0 1-1v-3c0-3.3-2.7-6-6-6Z" />
  </svg>
)

const FemaleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <circle cx="12" cy="4.5" r="3" />
    <path d="M15.6 9.4C14.5 8.5 13.3 8 12 8s-2.5.5-3.6 1.4C7.5 10.3 7 11.6 7 13l2.5 7a1 1 0 0 0 .9.7h.1a1 1 0 0 0 1-.8L12 17l.5 2.9a1 1 0 0 0 1 .8h.1a1 1 0 0 0 .9-.7L17 13c0-1.4-.5-2.7-1.4-3.6Z" />
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
            ? 'bg-indigo-50 border-2 border-[#3B5BDB]'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        )}
        onClick={() => onChange('FEMALE')}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            value === 'FEMALE' ? 'bg-[#3B5BDB] text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          <FemaleIcon className="w-8 h-8" />
        </div>
        <span
          className={cn(
            'text-base font-semibold',
            value === 'FEMALE' ? 'text-[#3B5BDB]' : 'text-gray-500'
          )}
        >
          자매
        </span>
      </button>
    </div>
  )
}
