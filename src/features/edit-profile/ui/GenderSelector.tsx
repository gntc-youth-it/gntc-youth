import { cn } from '../../../shared/lib'

interface GenderSelectorProps {
  value: 'MALE' | 'FEMALE' | null
  onChange: (gender: 'MALE' | 'FEMALE') => void
}

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
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl',
            value === 'MALE' ? 'bg-[#3B5BDB] text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          👦
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
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl',
            value === 'FEMALE' ? 'bg-[#3B5BDB] text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          👧
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
