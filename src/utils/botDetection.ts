/**
 * 봇 감지 유틸리티 (간소화 버전)
 * 키보드 타이핑 패턴만 검사하여 자동화 도구 사용을 감지합니다
 */

interface TypingPattern {
  timestamp: number;
  charCount: number;
  keyInterval: number[];
}

interface BotDetectionConfig {
  minTypingDelay: number; // 최소 타이핑 간격 (ms)
  maxTypingSpeed: number; // 최대 타이핑 속도 (char/sec)
  suspiciousPatternThreshold: number; // 의심스러운 패턴 임계값
}

const DEFAULT_CONFIG: BotDetectionConfig = {
  minTypingDelay: 30, // 사람이 타이핑할 때 최소 30ms 간격 (매우 빠른 타이핑도 허용)
  maxTypingSpeed: 20, // 초당 최대 20자 (프로 타이피스트 수준)
  suspiciousPatternThreshold: 0.85, // 85% 이상 일정한 간격이면 의심
};

export class BotDetector {
  private config: BotDetectionConfig;
  private typingPatterns: TypingPattern[] = [];
  private lastKeystroke: number = 0;
  private currentPattern: TypingPattern = {
    timestamp: Date.now(),
    charCount: 0,
    keyInterval: []
  };

  constructor(config: Partial<BotDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 타이핑 패턴 분석
   * 키 입력 간격을 분석하여 봇 여부 판단
   */
  recordKeystroke(): void {
    const now = Date.now();

    if (this.lastKeystroke > 0) {
      const interval = now - this.lastKeystroke;
      this.currentPattern.keyInterval.push(interval);
      this.currentPattern.charCount++;
    }

    this.lastKeystroke = now;
  }

  /**
   * 현재 타이핑 패턴 분석
   */
  analyzeCurrentPattern(): {
    isBot: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let suspicionScore = 0;

    // 최소 10번의 키 입력이 있어야 분석 시작
    if (this.currentPattern.keyInterval.length < 10) {
      return {
        isBot: false,
        confidence: 0,
        reasons: []
      };
    }

    // 1. 타이핑 속도 체크
    const duration = Date.now() - this.currentPattern.timestamp;
    const typingSpeed = (this.currentPattern.charCount / duration) * 1000; // chars per second

    if (typingSpeed > this.config.maxTypingSpeed) {
      reasons.push(`초당 ${typingSpeed.toFixed(1)}자로 너무 빠름`);
      suspicionScore += 0.5;
    }

    // 2. 키 간격 일정성 체크 (봇은 매우 일정한 간격으로 입력)
    const intervals = this.currentPattern.keyInterval;
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cvr = stdDev / avgInterval; // 변동계수

    // 변동계수가 너무 낮으면 (일정한 간격) 봇으로 의심
    if (cvr < 0.15) { // 매우 일정한 패턴
      reasons.push(`키 입력이 기계적으로 일정함`);
      suspicionScore += 0.5;
    }

    // 3. 극단적으로 빠른 입력 체크
    const minInterval = Math.min(...intervals);
    if (minInterval < this.config.minTypingDelay) {
      const fastCount = intervals.filter(i => i < this.config.minTypingDelay).length;
      const fastRatio = fastCount / intervals.length;

      if (fastRatio > 0.3) { // 30% 이상이 너무 빠름
        reasons.push(`비현실적으로 빠른 타이핑`);
        suspicionScore += 0.4;
      }
    }

    // 4. 완전히 동일한 간격 체크 (복사-붙여넣기 또는 매크로)
    const intervalCounts = new Map<number, number>();
    intervals.forEach(interval => {
      // 10ms 단위로 그룹화
      const rounded = Math.round(interval / 10) * 10;
      intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1);
    });

    const maxCount = Math.max(...intervalCounts.values());
    const uniformityRatio = maxCount / intervals.length;

    if (uniformityRatio > 0.7) { // 70% 이상이 비슷한 간격
      reasons.push(`동일한 간격으로 반복 입력`);
      suspicionScore += 0.3;
    }

    return {
      isBot: suspicionScore >= this.config.suspiciousPatternThreshold,
      confidence: Math.min(suspicionScore, 1),
      reasons
    };
  }

  /**
   * 패턴 초기화
   */
  resetPattern(): void {
    if (this.currentPattern.charCount > 0) {
      this.typingPatterns.push(this.currentPattern);
    }

    this.currentPattern = {
      timestamp: Date.now(),
      charCount: 0,
      keyInterval: []
    };
    this.lastKeystroke = 0;
  }

  /**
   * 대량 텍스트 입력 감지 (복사-붙여넣기 방지와 별개)
   */
  static detectBulkInput(prevLength: number, newLength: number): boolean {
    const diff = newLength - prevLength;
    // 한 번에 10자 이상 입력되면 의심
    return diff > 10;
  }

  /**
   * 너무 빠른 필사 완료 감지
   */
  static detectRapidCompletion(textLength: number, timeTaken: number): boolean {
    // 평균 타이핑 속도: 분당 40단어 (한글 기준 초당 2-3자)
    // 매우 빠른 타이핑: 초당 5자
    const minTimeRequired = (textLength / 5) * 1000; // 최소 필요 시간 (ms)
    return timeTaken < minTimeRequired;
  }
}

export default BotDetector;