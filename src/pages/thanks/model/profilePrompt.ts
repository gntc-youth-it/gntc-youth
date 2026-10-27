// 프로필 사진이 없을 때 띄우는 "사진과 이름을 정해 주세요" 안내는 하루 한 번만 띄운다
const DISMISSED_KEY = 'thanksProfilePromptDismissedOn'

export const wasProfilePromptDismissed = (today: string): boolean => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === today
  } catch {
    // 사파리 개인 정보 보호 모드처럼 저장소를 못 쓰면 매번 띄운다
    return false
  }
}

export const dismissProfilePrompt = (today: string): void => {
  try {
    localStorage.setItem(DISMISSED_KEY, today)
  } catch {
    // 저장하지 못해도 이번에는 닫힌다
  }
}
