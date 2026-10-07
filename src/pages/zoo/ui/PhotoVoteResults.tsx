import { buildCdnUrl } from '../../../shared/lib'
import { ZOO_STOPS } from '../model/course'
import { groupByStop, rankResults } from '../model/photo'
import { usePhotoResults } from '../model/usePhotoResults'
import { PARK_GREEN } from './courseTheme'

// 1등은 금색으로 눈에 띄게
const FIRST_PLACE_COLOR = '#F5B300'

// 운영자만 보는 장소별 득표 순위. 참가자 화면에는 득표 수가 어디에도 나오지 않는다
export const PhotoVoteResults = () => {
  const { results, loadState, isRefreshing, refreshFailed, reload } = usePhotoResults()

  if (loadState === 'loading') return <p className="mt-8 text-[14px] text-[#8B95A1]">결과를 불러오는 중이에요.</p>

  if (loadState === 'error' || !results) {
    return (
      <div className="mt-8">
        <p className="break-keep text-[14px] text-[#4E5968]">결과를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-3 rounded-full border border-[#D1D6DB] px-4 py-2 text-[14px] font-semibold text-[#333D4B]"
        >
          다시 불러오기
        </button>
      </div>
    )
  }

  const groups = groupByStop(results.photos)

  return (
    <section aria-label="투표 결과" className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] text-[#333D4B]">
          투표한 사람 <strong className="font-semibold text-[#191F28]">{results.voterCount}명</strong>
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={isRefreshing}
          className="shrink-0 rounded-full border border-[#D1D6DB] px-3.5 py-2 text-[13px] font-semibold text-[#333D4B] disabled:opacity-50"
        >
          {isRefreshing ? '불러오는 중...' : '새로고침'}
        </button>
      </div>
      <p className="mt-1.5 break-keep text-[13px] text-[#6B7684]">운영진만 보는 화면이에요. 참가자에게는 득표 수가 보이지 않아요.</p>
      {refreshFailed && (
        <p role="alert" className="mt-2 text-[13px] text-[#C92A2A]">
          새로고침하지 못했어요. 다시 눌러 주세요.
        </p>
      )}

      {groups.length === 0 && <p className="mt-8 text-[14px] text-[#6B7684]">아직 올라온 사진이 없어요.</p>}

      {groups.map((group) => (
        <section key={group.stopId} aria-labelledby={`zoo-result-${group.stopId}`} className="mt-8">
          <h2 id={`zoo-result-${group.stopId}`} className="font-sign text-[24px] leading-tight" style={{ color: PARK_GREEN }}>
            {ZOO_STOPS[group.stopId].name}
          </h2>
          <ol className="mt-2 divide-y divide-[#F2F4F6]">
            {rankResults(group.items).map((result) => (
              <li key={result.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sign text-[17px]"
                  style={
                    result.rank === 1 && result.voteCount > 0
                      ? { backgroundColor: FIRST_PLACE_COLOR, color: '#191F28' }
                      : { backgroundColor: '#F2F4F6', color: '#4E5968' }
                  }
                >
                  {result.rank}
                </span>
                <a
                  href={buildCdnUrl(result.photoPath)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${result.teamName} 사진 원본 보기`}
                  className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F2F4F6]"
                >
                  <img src={buildCdnUrl(result.photoPath)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </a>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#191F28]">{result.teamName}</span>
                <span className="shrink-0 text-[15px] font-semibold text-[#191F28]">{result.voteCount}표</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </section>
  )
}
