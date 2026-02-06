import { cn } from '../cn'

describe('cn', () => {
  it('여러 클래스를 병합한다', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('조건부 클래스를 처리한다', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('Tailwind 충돌 시 뒤의 클래스가 우선한다', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('빈 입력을 처리한다', () => {
    expect(cn()).toBe('')
  })

  it('undefined와 null을 무시한다', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})
