import { dismissProfilePrompt, wasProfilePromptDismissed } from '../profilePrompt'

beforeEach(() => {
  localStorage.clear()
})

describe('profilePrompt', () => {
  it('나중에 하기를 누른 날에는 다시 묻지 않는다', () => {
    expect(wasProfilePromptDismissed('2026-11-09')).toBe(false)

    dismissProfilePrompt('2026-11-09')

    expect(wasProfilePromptDismissed('2026-11-09')).toBe(true)
  })

  it('다음 날에는 다시 묻는다', () => {
    dismissProfilePrompt('2026-11-09')

    expect(wasProfilePromptDismissed('2026-11-10')).toBe(false)
  })
})
