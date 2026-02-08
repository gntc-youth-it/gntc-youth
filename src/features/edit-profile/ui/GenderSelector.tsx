import { cn } from '../../../shared/lib'

interface GenderSelectorProps {
  value: 'male' | 'female' | null
  onChange: (gender: 'male' | 'female') => void
}

export const GenderSelector = ({ value, onChange }: GenderSelectorProps) => {
  return (
    <div className="flex gap-5 w-full">
      <button
        type="button"
        data-testid="gender-male"
        className={cn(
          'flex flex-col items-center gap-2.5 rounded-xl py-5 px-6 w-[150px] transition-all',
          value === 'male'
            ? 'bg-indigo-50 border-2 border-[#3B5BDB]'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        )}
        onClick={() => onChange('male')}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl',
            value === 'male' ? 'bg-[#3B5BDB] text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          👦
        </div>
        <span
          className={cn(
            'text-base font-semibold',
            value === 'male' ? 'text-[#3B5BDB]' : 'text-gray-500'
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
          value === 'female'
            ? 'bg-indigo-50 border-2 border-[#3B5BDB]'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        )}
        onClick={() => onChange('female')}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl',
            value === 'female' ? 'bg-[#3B5BDB] text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          👧
        </div>
        <span
          className={cn(
            'text-base font-semibold',
            value === 'female' ? 'text-[#3B5BDB]' : 'text-gray-500'
          )}
        >
          자매
        </span>
      </button>
    </div>
  )
}
