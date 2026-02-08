import type { ProfileFormData } from '../types'

describe('ProfileFormData', () => {
  it('모든 필드를 포함하는 객체를 생성할 수 있다', () => {
    const data: ProfileFormData = {
      name: '홍길동',
      temple: '서울 성전',
      generation: '15기',
      phone: '010-1234-5678',
      gender: 'male',
    }

    expect(data.name).toBe('홍길동')
    expect(data.temple).toBe('서울 성전')
    expect(data.generation).toBe('15기')
    expect(data.phone).toBe('010-1234-5678')
    expect(data.gender).toBe('male')
  })

  it('gender가 null일 수 있다', () => {
    const data: ProfileFormData = {
      name: '',
      temple: '',
      generation: '',
      phone: '',
      gender: null,
    }

    expect(data.gender).toBeNull()
  })

  it('gender는 male 또는 female 값을 가질 수 있다', () => {
    const maleData: ProfileFormData = {
      name: '형제',
      temple: '성전',
      generation: '1기',
      phone: '',
      gender: 'male',
    }

    const femaleData: ProfileFormData = {
      name: '자매',
      temple: '성전',
      generation: '1기',
      phone: '',
      gender: 'female',
    }

    expect(maleData.gender).toBe('male')
    expect(femaleData.gender).toBe('female')
  })
})
