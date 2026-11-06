import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { UserInfo } from '../../../features/auth'
import { countEntries, formatLastPosted, getHeatmapDates, HEATMAP_DAYS, sortMembers } from '../model/cellStats'
import { formatMissionDate, getMissionDate } from '../model/slots'
import type { ThanksCell, ThanksCellMemberStats } from '../model/types'
import { useCellStats } from '../model/useCellStats'
import { useCurrentUser } from '../model/useCurrentUser'
import { useNow } from '../model/useNow'
import { Avatar } from './Avatar'
import { CellGate } from './CellGate'
import { ThanksBrand } from './ThanksBrand'
import { Chevron } from './ThanksIcons'
import { ThanksLoginRequired } from './ThanksLoginRequired'
import './thanks.css'

interface MemberRowProps {
  member: ThanksCellMemberStats
  dates: string[]
  now: Date
  isMe: boolean
}

const MemberRow = ({ member, dates, now, isMe }: MemberRowProps) => {
  const counts = new Map(member.dailyCounts.map((day) => [day.date, day.count]))
  // 칸의 진하기를 읽을 수 없는 사람에게는 올린 날과 개수를 글로 읽어 준다
  const recent = dates.filter((date) => counts.has(date)).map((date) => `${formatMissionDate(date)} ${counts.get(date)}개`)
  return (
    <li className="thanks-status-member">
      <Avatar author={member.user} size={36} />
      <div className="thanks-status-member-body">
        <div className="thanks-status-member-top">
          <p className="thanks-author-name">
            <span>{member.user.name}</span>
            {isMe && <span className="thanks-mine">나</span>}
          </p>
          <span className="thanks-posted-at">
            {member.lastPostedAt ? formatLastPosted(member.lastPostedAt, now) : '아직 올리기 전'}
          </span>
          <span className="thanks-status-count">
            {countEntries(member)}
            <span>개</span>
          </span>
        </div>
        <div
          role="img"
          aria-label={recent.length > 0 ? `최근 ${HEATMAP_DAYS}일: ${recent.join(', ')}` : `최근 ${HEATMAP_DAYS}일 기록 없음`}
          className="thanks-heat-strip"
        >
          {dates.map((date) => {
            const count = counts.get(date) ?? 0
            return (
              <span
                key={date}
                title={`${formatMissionDate(date)} ${count}개`}
                className={`thanks-heat-cell thanks-heat-${Math.min(count, 3)}`}
              />
            )
          })}
        </div>
      </div>
    </li>
  )
}

interface CellStatusProps {
  user: UserInfo
  cells: ThanksCell[]
  myCellId: number
}

const CellStatus = ({ user, cells, myCellId }: CellStatusProps) => {
  const [cellId, setCellId] = useState(myCellId)
  const { stats, error, reload } = useCellStats(cellId)
  const now = useNow()
  const dates = getHeatmapDates(getMissionDate(now))
  const members = stats ? sortMembers(stats.members) : []
  const totalEntries = members.reduce((sum, member) => sum + countEntries(member), 0)
  const cellName = cells.find((cell) => cell.id === cellId)?.name

  return (
    <div className="thanks-app">
      <main className="thanks-shell">
        <div className="thanks-nav">
          <Link to="/thanks" aria-label="감사로그로" className="thanks-icon-button">
            <Chevron direction="left" />
          </Link>
          <h1>
            <ThanksBrand />
          </h1>
          <span className="thanks-nav-spacer" />
        </div>

        <div className="thanks-status-heading">
          <p>{cellId === myCellId ? '우리 구역 현황' : '구역 현황'}</p>
          {user.role === 'MASTER' ? (
            <>
              <h2 className="sr-only">{cellName}</h2>
              <select
                value={cellId}
                onChange={(event) => setCellId(Number(event.target.value))}
                aria-label="볼 구역"
                className="thanks-status-select"
              >
                {cells.map((cell) => (
                  <option key={cell.id} value={cell.id}>
                    {cell.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <h2>{cellName}</h2>
          )}
        </div>

        {stats === null ? (
          error ? (
            <div className="thanks-empty">
              <p role="alert">{error}</p>
              <button type="button" onClick={() => void reload()} className="thanks-retry">
                다시 불러오기
              </button>
            </div>
          ) : (
            <div role="status" className="thanks-status-skeleton">
              <span className="sr-only">불러오는 중…</span>
              <div aria-hidden="true" />
              <div aria-hidden="true" />
              <div aria-hidden="true" />
            </div>
          )
        ) : (
          <>
            <dl className="thanks-status-tiles">
              <div>
                <dt>참여</dt>
                <dd>
                  {members.length.toLocaleString()}
                  <span>명</span>
                </dd>
              </div>
              <div>
                <dt>감사 기록</dt>
                <dd>
                  {totalEntries.toLocaleString()}
                  <span>개</span>
                </dd>
              </div>
            </dl>
            {error && (
              <p role="alert" className="thanks-error-inline">
                {error}
                <button type="button" onClick={() => void reload()}>
                  다시 불러오기
                </button>
              </p>
            )}
            {members.length === 0 ? (
              <div className="thanks-empty">
                <p>아직 이 구역을 고른 사람이 없어요.</p>
              </div>
            ) : (
              <section aria-label="구역원" className="thanks-status-members">
                <div className="thanks-status-legend">
                  <span>최근 {HEATMAP_DAYS}일, 오른쪽이 오늘</span>
                  <span className="thanks-heat-scale" aria-hidden="true">
                    <span>0</span>
                    <i className="thanks-heat-0" />
                    <i className="thanks-heat-1" />
                    <i className="thanks-heat-2" />
                    <i className="thanks-heat-3" />
                    <span>3개</span>
                  </span>
                </div>
                <ol>
                  {members.map((member) => (
                    <MemberRow
                      key={member.user.userId}
                      member={member}
                      dates={dates}
                      now={now}
                      isMe={member.user.userId === user.id}
                    />
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export const CellStatusPage = () => {
  const user = useCurrentUser()
  if (!user) return <ThanksLoginRequired />
  return (
    <CellGate key={user.id}>{(cells, myCellId) => <CellStatus user={user} cells={cells} myCellId={myCellId} />}</CellGate>
  )
}
