import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { UserInfo } from '../../../features/auth'
import { buildCdnUrl } from '../../../shared/lib'
import { COURSE_STOP_IDS, ZOO_STOPS, isStopId } from '../model/course'
import type { StopId, ZooStop } from '../model/course'
import { ANSWER_MAX_LENGTH, getStopMission } from '../model/missions'
import type { MissionQuestion, PhotoSpot, StopMission } from '../model/missions'
import type { SubmitZooMissionRequest, ZooTeamDetail, ZooTeamMission } from '../model/team'
import { useCurrentUser } from '../model/useCurrentUser'
import { useMissionDraft } from '../model/useMissionDraft'
import { useMissionPhoto } from '../model/useMissionPhoto'
import { useZooTeam } from '../model/useZooTeam'
import type { ZooActionError } from '../model/useZooTeam'
import { CourseBadge } from './CourseBadge'
import { TeamLoading, TeamMembersOnly, TeamMissing } from './TeamStatusScreens'
import { ZooLayout } from './ZooLayout'
import { ZooLoginRequired } from './ZooLoginRequired'
import { COURSE_THEME, PARK_GREEN } from './courseTheme'

const CameraIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

interface MissionScreenProps {
  team: ZooTeamDetail
  stop: ZooStop
  stopNumber: number
  mission: StopMission
  submitted: ZooTeamMission | null
}

const MissionHeader = ({ team, stop, stopNumber }: Pick<MissionScreenProps, 'team' | 'stop' | 'stopNumber'>) => (
  <>
    <Link
      to={`/zoo/teams/${team.id}`}
      className="inline-flex max-w-full items-center gap-1 text-[14px] text-[#6B7684] hover:text-[#333D4B]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="15 6 9 12 15 18" />
      </svg>
      <span className="truncate">{team.name}</span>
    </Link>
    <div className="mt-5 flex items-center gap-2">
      <CourseBadge course={team.course} />
      <span className="text-[14px] font-semibold text-[#4E5968]">{stopNumber}번째 장소</span>
    </div>
    <h1 className="mt-3 font-sign text-[38px] leading-tight" style={{ color: PARK_GREEN }}>
      {stop.name}
    </h1>
    <p className="mt-1 text-[14px] text-[#6B7684]">{stop.animals.join(', ')}</p>
  </>
)

const SectionTitle = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="font-sign text-[25px] leading-tight" style={{ color: PARK_GREEN }}>
    {children}
  </h2>
)

// 사진 찍을 곳을 찾기 쉽도록 현장 사진을 같이 보여준다
const PhotoSpotGuide = ({ spot }: { spot: PhotoSpot }) => (
  <figure className="mt-3 overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F9FAFB]">
    <img src={spot.image} alt="사진 찍을 곳" loading="lazy" className="block max-h-[280px] w-full object-contain" />
    <figcaption className="break-keep px-3.5 py-2.5 text-[13px] leading-relaxed text-[#4E5968]">{spot.description}</figcaption>
  </figure>
)

const QuestionNumber = ({ value }: { value: number }) => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2F4F6] font-sign text-[16px] text-[#333D4B]">
    {value}
  </span>
)

const QuestionField = ({
  question,
  number,
  value,
  onChange,
}: {
  question: MissionQuestion
  number: number
  value: string
  onChange: (value: string) => void
}) => {
  const fieldId = `zoo-mission-${question.id}`

  return (
    <li className="flex gap-3">
      <QuestionNumber value={number} />
      <div className="min-w-0 flex-1">
        {question.choices ? (
          <>
            <p id={fieldId} className="break-keep text-[16px] font-semibold leading-snug text-[#191F28]">
              {question.text}
            </p>
            <div role="group" aria-labelledby={fieldId} className="mt-2.5 flex flex-wrap gap-2">
              {question.choices.map((choice) => {
                const isSelected = value === choice
                return (
                  <button
                    key={choice}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange(choice)}
                    className="rounded-full border px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
                    style={
                      isSelected
                        ? { backgroundColor: PARK_GREEN, borderColor: PARK_GREEN, color: '#FFFFFF' }
                        : { backgroundColor: '#FFFFFF', borderColor: '#D1D6DB', color: '#333D4B' }
                    }
                  >
                    {choice}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <label htmlFor={fieldId} className="block break-keep text-[16px] font-semibold leading-snug text-[#191F28]">
              {question.text}
            </label>
            <input
              id={fieldId}
              value={value}
              onChange={(event) => onChange(event.target.value.slice(0, ANSWER_MAX_LENGTH))}
              maxLength={ANSWER_MAX_LENGTH}
              placeholder="답을 적어 주세요"
              autoComplete="off"
              className="mt-2.5 w-full rounded-xl border border-[#D1D6DB] px-4 py-3 text-[16px] text-[#191F28] outline-none transition-colors placeholder:text-[#B0B8C1] focus:border-[#1F4D36]"
            />
          </>
        )}
      </div>
    </li>
  )
}

const MissionForm = ({
  team,
  stop,
  stopNumber,
  mission,
  submitted,
  isSaving,
  error,
  onSubmit,
}: MissionScreenProps & {
  isSaving: boolean
  error: ZooActionError | null
  onSubmit: (data: SubmitZooMissionRequest) => Promise<boolean>
}) => {
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const { answers, setAnswer, clearDraft } = useMissionDraft(team.id, stop.id, submitted?.answers)
  const photo = useMissionPhoto(
    submitted ? { fileId: submitted.photoFileId, url: buildCdnUrl(submitted.photoPath) } : null
  )

  const unansweredCount = mission.questions.filter((question) => !(answers[question.id] ?? '').trim()).length
  const isPhotoBusy = photo.status === 'compressing' || photo.status === 'uploading'
  const isPhotoReady = photo.status === 'done' && photo.fileId !== null
  const canSubmit = unansweredCount === 0 && isPhotoReady && !isSaving

  const hint =
    unansweredCount > 0
      ? `아직 답하지 않은 문제가 ${unansweredCount}개 있어요.`
      : isPhotoBusy
        ? '사진을 올리는 중이에요.'
        : !isPhotoReady
          ? '사진 미션까지 하면 낼 수 있어요.'
          : null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit || photo.fileId === null) return

    const succeeded = await onSubmit({
      answers: mission.questions.map((question) => ({ questionId: question.id, answer: answers[question.id].trim() })),
      photoFileId: photo.fileId,
    })
    if (succeeded) {
      clearDraft()
      navigate(`/zoo/teams/${team.id}`, { replace: true })
    }
  }

  return (
    <>
      <ZooLayout hasBottomBar>
        <MissionHeader team={team} stop={stop} stopNumber={stopNumber} />
        {submitted && (
          <p className="mt-4 break-keep rounded-xl px-3.5 py-2.5 text-[13px] text-[#191F28]" style={{ backgroundColor: COURSE_THEME[team.course].tint }}>
            이미 낸 미션이에요. 고칠 내용이 있으면 바꾸고 다시 저장하세요.
          </p>
        )}

        <form id="zoo-mission-form" onSubmit={handleSubmit}>
          <section aria-labelledby="zoo-mission-questions" className="mt-8">
            <SectionTitle id="zoo-mission-questions">문제</SectionTitle>
            <ol className="mt-4 space-y-6">
              {mission.questions.map((question, index) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  number={index + 1}
                  value={answers[question.id] ?? ''}
                  onChange={(value) => setAnswer(question.id, value)}
                />
              ))}
            </ol>
          </section>

          <section aria-labelledby="zoo-mission-photo" className="mt-10">
            <SectionTitle id="zoo-mission-photo">사진 미션</SectionTitle>
            <p className="mt-3 break-keep text-[16px] font-semibold leading-snug text-[#191F28]">{mission.photoMission}</p>
            {mission.photoSpot && <PhotoSpotGuide spot={mission.photoSpot} />}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              aria-label="미션 사진 고르기"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void photo.select(file)
                event.target.value = ''
              }}
            />

            {photo.previewUrl ? (
              <div className="relative mt-3 overflow-hidden rounded-2xl bg-[#F2F4F6]">
                <img src={photo.previewUrl} alt="미션 사진" className="block max-h-[440px] w-full object-contain" />
                {isPhotoBusy && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-3 text-[14px] font-semibold text-white">
                    {photo.status === 'compressing' ? '사진을 줄이는 중이에요.' : `사진을 올리는 중이에요. ${photo.progress}%`}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#C5D3C8] bg-[#F5F8F2] py-10 text-[#4E5968] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
              >
                <CameraIcon />
                <span className="text-[15px] font-semibold">사진 찍기 또는 고르기</span>
              </button>
            )}

            {photo.previewUrl && !isPhotoBusy && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="mt-3 rounded-full border border-[#D1D6DB] px-4 py-2 text-[14px] font-semibold text-[#333D4B]"
              >
                다른 사진으로 바꾸기
              </button>
            )}

            {photo.error && (
              <div role="alert" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#C92A2A]">
                <span className="break-keep">{photo.error}</span>
                {photo.status === 'error' && (
                  <button type="button" onClick={photo.retry} className="font-semibold underline underline-offset-2">
                    다시 올리기
                  </button>
                )}
              </div>
            )}
          </section>
        </form>
      </ZooLayout>

      <aside aria-label="미션 제출" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-3 shadow-[0_8px_28px_rgba(25,31,40,0.16)] ring-1 ring-black/5">
          {error && (
            <p role="alert" className="mb-2.5 break-keep rounded-xl bg-[#FFF5F5] px-3 py-2.5 text-[13px] text-[#C92A2A]">
              {error.message}
            </p>
          )}
          {hint && <p className="px-1 pb-2.5 text-[13px] text-[#6B7684]">{hint}</p>}
          <button
            type="submit"
            form="zoo-mission-form"
            disabled={!canSubmit}
            className="w-full rounded-xl py-3.5 font-sign text-[21px] text-white transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
            style={{ backgroundColor: PARK_GREEN }}
          >
            {isSaving ? '내는 중...' : submitted ? '고친 내용 저장하기' : '제출하고 도착 처리하기'}
          </button>
        </div>
      </aside>
    </>
  )
}

// 조원은 문제를 같이 보고, 조장이 낸 답과 사진을 확인만 한다
const MissionView = ({ team, stop, stopNumber, mission, submitted }: MissionScreenProps) => {
  const answerOf = (questionId: string) => submitted?.answers.find((answer) => answer.questionId === questionId)?.answer

  return (
    <ZooLayout>
      <MissionHeader team={team} stop={stop} stopNumber={stopNumber} />
      <p
        className="mt-4 break-keep rounded-xl px-3.5 py-2.5 text-[13px] text-[#191F28]"
        style={{ backgroundColor: submitted ? COURSE_THEME[team.course].tint : '#F2F4F6' }}
      >
        {submitted ? '조장이 낸 답과 사진이에요.' : '조장이 답과 사진을 내면 여기에 보여요. 문제를 같이 풀어 보세요.'}
      </p>

      <section aria-labelledby="zoo-mission-questions" className="mt-8">
        <SectionTitle id="zoo-mission-questions">문제</SectionTitle>
        <ol className="mt-4 space-y-6">
          {mission.questions.map((question, index) => {
            const answer = answerOf(question.id)
            return (
              <li key={question.id} className="flex gap-3">
                <QuestionNumber value={index + 1} />
                <div className="min-w-0 flex-1">
                  <p className="break-keep text-[16px] font-semibold leading-snug text-[#191F28]">{question.text}</p>
                  {question.choices && !answer && (
                    <p className="mt-1.5 break-keep text-[14px] text-[#6B7684]">{question.choices.join(' / ')}</p>
                  )}
                  {answer && (
                    <p className="mt-2.5 break-keep rounded-xl bg-[#F2F4F6] px-4 py-3 text-[16px] text-[#191F28]">{answer}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="zoo-mission-photo" className="mt-10">
        <SectionTitle id="zoo-mission-photo">사진 미션</SectionTitle>
        <p className="mt-3 break-keep text-[16px] font-semibold leading-snug text-[#191F28]">{mission.photoMission}</p>
        {mission.photoSpot && <PhotoSpotGuide spot={mission.photoSpot} />}
        {submitted ? (
          <div className="mt-3 overflow-hidden rounded-2xl bg-[#F2F4F6]">
            <img src={buildCdnUrl(submitted.photoPath)} alt="조장이 올린 미션 사진" className="block max-h-[440px] w-full object-contain" />
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#D1D6DB] py-10 text-[14px] text-[#8B95A1]">
            조장이 사진을 올리면 여기에 보여요.
          </div>
        )}
      </section>
    </ZooLayout>
  )
}

const MissionNotice = ({ team, stop, stopNumber, message }: Pick<MissionScreenProps, 'team' | 'stop' | 'stopNumber'> & { message: string }) => (
  <ZooLayout>
    <MissionHeader team={team} stop={stop} stopNumber={stopNumber} />
    <p className="mt-6 break-keep text-[15px] leading-relaxed text-[#4E5968]">{message}</p>
    <Link
      to={`/zoo/teams/${team.id}`}
      className="mt-6 inline-flex rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white"
      style={{ backgroundColor: PARK_GREEN }}
    >
      조 화면으로
    </Link>
  </ZooLayout>
)

const MissionContent = ({ teamId, stopId, currentUser }: { teamId: number; stopId: StopId; currentUser: UserInfo }) => {
  const { team, loadState, reload, pendingAction, actionError, submitMission } = useZooTeam(teamId)

  if (loadState === 'notFound') return <TeamMissing />
  if (!team) return <TeamLoading loadState={loadState} onRetry={() => void reload()} />

  const isMember = team.members.some((member) => member.userId === currentUser.id)
  const isLeader = team.leaderUserId === currentUser.id
  const isMaster = currentUser.role === 'MASTER'
  if (!isMember && !isMaster) return <TeamMembersOnly team={team} message="미션은 이 조의 조원만 볼 수 있어요." />

  const stop = ZOO_STOPS[stopId]
  const stopNumber = COURSE_STOP_IDS[team.course].indexOf(stopId) + 1
  const mission = getStopMission(stopId)

  if (team.status !== 'STARTED') {
    return (
      <MissionNotice team={team} stop={stop} stopNumber={stopNumber} message="조장이 마감하고 출발하면 미션을 할 수 있어요." />
    )
  }
  const submitted = team.missions?.find((item) => item.stopId === stopId) ?? null
  const props = { team, stop, stopNumber, mission, submitted }

  return isLeader || isMaster ? (
    <MissionForm
      {...props}
      isSaving={pendingAction === 'mission'}
      error={actionError}
      onSubmit={(data) => submitMission(stopId, data)}
    />
  ) : (
    <MissionView {...props} />
  )
}

export const ZooMissionPage = () => {
  const { teamId: teamIdParam, stopId: stopIdParam } = useParams()
  const currentUser = useCurrentUser()
  const teamId = Number(teamIdParam)

  if (!currentUser) {
    return (
      <ZooLayout>
        <ZooLoginRequired title="미션" description="미션을 보려면 로그인이 필요해요. 로그인하면 이 화면으로 바로 돌아와요." />
      </ZooLayout>
    )
  }

  if (!Number.isInteger(teamId) || teamId <= 0 || !isStopId(stopIdParam)) return <TeamMissing />

  return <MissionContent key={`${teamId}-${stopIdParam}`} teamId={teamId} stopId={stopIdParam} currentUser={currentUser} />
}
