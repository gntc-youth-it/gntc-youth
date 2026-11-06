import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ThanksCell } from '../model/types'
import { useMyCell } from '../model/useMyCell'
import { ThanksBrand, ThanksMark } from './ThanksBrand'
import { CheckIcon, Chevron } from './ThanksIcons'

const GateShell = ({ hasBar = false, children }: { hasBar?: boolean; children: ReactNode }) => (
  <div className="thanks-app">
    <main className={`thanks-shell ${hasBar ? 'has-write-bar' : ''}`}>
      <div className="thanks-nav">
        <Link to="/" aria-label="홈으로" className="thanks-icon-button">
          <Chevron direction="left" />
        </Link>
        <h1>
          <ThanksBrand />
        </h1>
        <span className="thanks-nav-spacer" />
      </div>
      {children}
    </main>
  </div>
)

interface CellPickerProps {
  cells: ThanksCell[]
  isSaving: boolean
  error: string | null
  // 없어진 구역을 골라 목록을 새로 받다가 실패한 경우. 보던 목록은 그대로 둔다
  loadError: string | null
  onReload: () => void
  onChoose: (cellId: number) => Promise<boolean>
}

// 잘못 고르면 취합이 틀어지므로, 고른 구역을 버튼에서 한 번 더 보여 주고 눌러야 들어간다
const CellPicker = ({ cells, isSaving, error, loadError, onReload, onChoose }: CellPickerProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // 목록을 새로 받아 고른 구역이 없어졌으면 고르지 않은 것으로 본다
  const selected = cells.find((cell) => cell.id === selectedId)

  const handleEnter = async () => {
    if (!selected || isSaving) return
    // 목록을 내려서 골랐어도 감사로그는 맨 위부터 보여 준다
    if (await onChoose(selected.id)) window.scrollTo(0, 0)
  }

  return (
    <GateShell hasBar>
      <div className="thanks-cell-intro">
        <div className="thanks-cell-mark">
          <ThanksMark size={42} />
        </div>
        <h2 id="thanks-cell-heading">어느 구역이에요?</h2>
        <p>구역을 고르면 감사로그가 열려요.</p>
      </div>
      <div role="radiogroup" aria-labelledby="thanks-cell-heading" className="thanks-cell-list">
        {cells.map((cell) => (
          <label key={cell.id} className="thanks-cell-option">
            <input
              type="radio"
              name="thanks-cell"
              checked={cell.id === selectedId}
              onChange={() => setSelectedId(cell.id)}
              // 저장하는 동안 다른 구역을 누르면 화면과 저장된 구역이 달라진다
              disabled={isSaving}
              className="sr-only"
            />
            <span className="thanks-cell-face">
              {cell.name}
              <span className="thanks-cell-check">
                <CheckIcon />
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="thanks-write-bar">
        {error && (
          <p role="alert" className="thanks-cell-error">
            {error}
          </p>
        )}
        {loadError && (
          <p role="alert" className="thanks-cell-error">
            {loadError}
            <button type="button" onClick={onReload}>
              다시 불러오기
            </button>
          </p>
        )}
        <button type="button" onClick={handleEnter} disabled={!selected || isSaving} className="thanks-write-button">
          <span>{isSaving ? '들어가는 중…' : selected ? `${selected.name} 들어가기` : '구역을 골라 주세요'}</span>
        </button>
      </div>
    </GateShell>
  )
}

interface CellGateProps {
  // 구역 목록이나 내 구역이 필요한 화면은 함수로 받는다
  children: ReactNode | ((cells: ThanksCell[], myCellId: number) => ReactNode)
}

// 구역을 고른 사람만 감사로그에 들어간다. 프로필 사진·이름 안내도 구역을 고른 뒤에 뜬다
export const CellGate = ({ children }: CellGateProps) => {
  const { cells, myCellId, loadError, saveError, isSaving, reload, choose } = useMyCell()

  if (cells !== null && myCellId !== null) {
    return <>{typeof children === 'function' ? children(cells, myCellId) : children}</>
  }

  if (cells === null) {
    return (
      <GateShell>
        {loadError ? (
          <div className="thanks-empty">
            <p role="alert">{loadError}</p>
            <button type="button" onClick={() => void reload()} className="thanks-retry">
              다시 불러오기
            </button>
          </div>
        ) : (
          <div role="status" className="thanks-skeleton">
            <span className="sr-only">불러오는 중…</span>
            <div aria-hidden="true" />
            <div aria-hidden="true" />
          </div>
        )}
      </GateShell>
    )
  }

  // 목록이 비면 아무도 들어오지 못하니, 멈춘 것처럼 보이지 않게 알려 준다
  if (cells.length === 0) {
    return (
      <GateShell>
        <div className="thanks-empty">
          <p role="alert">구역 목록을 준비하고 있어요. 잠시 후 다시 열어 주세요.</p>
          <button type="button" onClick={() => void reload()} className="thanks-retry">
            다시 불러오기
          </button>
        </div>
      </GateShell>
    )
  }

  return (
    <CellPicker
      cells={cells}
      isSaving={isSaving}
      error={saveError}
      loadError={loadError}
      onReload={() => void reload()}
      onChoose={choose}
    />
  )
}
