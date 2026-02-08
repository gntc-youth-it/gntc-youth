import type { ProfileFormData, UserProfileResponse, UserProfileRequest } from '../types'

describe('ProfileFormData', () => {
  it('모든 필드를 포함하는 객체를 생성할 수 있다', () => {
    const data: ProfileFormData = {
      name: '홍길동',
      churchId: 'anyang',
      generation: '15',
      phoneNumber: '010-1234-5678',
      gender: 'MALE',
    }

    expect(data.name).toBe('홍길동')
    expect(data.churchId).toBe('anyang')
    expect(data.generation).toBe('15')
    expect(data.phoneNumber).toBe('010-1234-5678')
    expect(data.gender).toBe('MALE')
  })

  it('gender가 null일 수 있다', () => {
    const data: ProfileFormData = {
      name: '',
      churchId: '',
      generation: '',
      phoneNumber: '',
      gender: null,
    }

    expect(data.gender).toBeNull()
  })

  it('gender는 MALE 또는 FEMALE 값을 가질 수 있다', () => {
    const maleData: ProfileFormData = {
      name: '형제',
      churchId: 'anyang',
      generation: '1',
      phoneNumber: '',
      gender: 'MALE',
    }

    const femaleData: ProfileFormData = {
      name: '자매',
      churchId: 'suwon',
      generation: '1',
      phoneNumber: '',
      gender: 'FEMALE',
    }

    expect(maleData.gender).toBe('MALE')
    expect(femaleData.gender).toBe('FEMALE')
  })
})

describe('UserProfileResponse', () => {
  it('API 응답 형식을 올바르게 표현한다', () => {
    const response: UserProfileResponse = {
      name: '홍길동',
      churchId: 'anyang',
      churchName: '안양',
      generation: 15,
      phoneNumber: '010-1234-5678',
      gender: 'MALE',
      genderDisplay: '형제',
    }

    expect(response.name).toBe('홍길동')
    expect(response.churchId).toBe('anyang')
    expect(response.churchName).toBe('안양')
    expect(response.generation).toBe(15)
    expect(response.gender).toBe('MALE')
    expect(response.genderDisplay).toBe('형제')
  })
})

describe('UserProfileRequest', () => {
  it('API 요청 형식을 올바르게 표현한다', () => {
    const request: UserProfileRequest = {
      name: '홍길동',
      churchId: 'anyang',
      generation: 15,
      phoneNumber: '010-1234-5678',
      gender: 'MALE',
    }

    expect(request.name).toBe('홍길동')
    expect(request.churchId).toBe('anyang')
    expect(request.generation).toBe(15)
    expect(request.gender).toBe('MALE')
  })

  it('nullable 필드가 null일 수 있다', () => {
    const request: UserProfileRequest = {
      name: '홍길동',
      churchId: null,
      generation: null,
      phoneNumber: null,
      gender: null,
    }

    expect(request.churchId).toBeNull()
    expect(request.generation).toBeNull()
    expect(request.phoneNumber).toBeNull()
    expect(request.gender).toBeNull()
  })
})
