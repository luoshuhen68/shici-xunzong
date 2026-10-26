import type { Question } from '../types'
import type { LevelResult } from '../game/logic'

interface Props {
  question: Question
  result: LevelResult
  perfect: boolean
  /** 本关是否为跳过（不计分） */
  skipped: boolean
  hasNext: boolean
  onClose: () => void
  /** 跳过后再挑战：重置本关重新作答 */
  onRetry: () => void
  onNext: () => void
}

export default function ResultModal({
  question,
  result,
  perfect,
  skipped,
  hasNext,
  onClose,
  onRetry,
  onNext,
}: Props) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="result-card" onClick={(e) => e.stopPropagation()}>
        <div className="result-head">
          <h2 className="result-title">
            {skipped ? '跳过 · 诗境回望' : hasNext ? '寻迹有成' : '终点·亦是起点'}
          </h2>
          {skipped ? (
            <div className="skip-tag">已跳过 · 本关不计分</div>
          ) : (
            <div className="result-stars">
              {'★'.repeat(result.stars)}
              {'☆'.repeat(3 - result.stars)}
            </div>
          )}
          {perfect && !skipped && <span className="perfect-tag">一气呵成 · 完美</span>}
        </div>

        <div className="scroll-card">
          <p className="scroll-line">{question.line}</p>
          <p className="scroll-meta">
            {question.dynasty} · {question.author}《{question.poemTitle}》
          </p>
          <p className="scroll-meaning">{question.meaning}</p>
        </div>

        <div className="knowledge-card">
          <span className="kc-tag">诗词知识卡</span>
          <p>{question.appreciation}</p>
        </div>

        <div className="score-detail">
          {skipped ? (
            <span className="score-total">跳过不得分 · 可点「再挑战」赢回星级</span>
          ) : (
            <>
              <span>基础 {result.base}</span>
              {result.streakBonus > 0 && <span>连胜 +{result.streakBonus}</span>}
              {result.perfectBonus > 0 && <span>完美 +{result.perfectBonus}</span>}
              {result.hintPenalty > 0 && <span className="minus">提示 −{result.hintPenalty}</span>}
              <span className="score-total">共 {result.score} 分</span>
            </>
          )}
        </div>

        <div className="result-actions">
          <button className="btn ghost" onClick={skipped ? onRetry : onClose}>
            {skipped ? '再挑战一次' : '再读一遍'}
          </button>
          <button className="btn primary" onClick={onNext}>
            {hasNext ? '进入下一关' : '完成旅程 · 返回首页'}
          </button>
        </div>
      </div>
    </div>
  )
}
