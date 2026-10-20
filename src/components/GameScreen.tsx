import { useEffect, useRef, useState } from 'react'
import type { Level } from '../game/logic'
import {
  DIFFICULTY_NAME,
  checkAnswer,
  computeResult,
  locateNextHint,
} from '../game/logic'
import type { LevelResult } from '../game/logic'
import type { Progress } from '../types'
import { sfx } from '../game/audio'
import ResultModal from './ResultModal'

const MAX_HINTS = 2

const WRONG_MESSAGES = [
  '顺序或用字还有些出入，不急，慢慢调。',
  '差一点点！可以试着换一换方块的顺序。',
  '诗句尚有偏差，回到诗句的意境里再想想。',
]

interface Props {
  level: Level
  levelsTotal: number
  progress: Progress
  onBack: () => void
  onNext: () => void
  onLevelComplete: (level: Level, result: { score: number; stars: 1 | 2 | 3; perfect: boolean }) => void
  onToggleSound: () => void
}

export default function GameScreen({
  level,
  levelsTotal,
  progress,
  onBack,
  onNext,
  onLevelComplete,
  onToggleSound,
}: Props) {
  const q = level.question
  const answerLen = q.answer.length

  const needTitlePick = q.difficulty === 'medium'
  const [phase, setPhase] = useState<'title-pick' | 'selecting' | 'solved'>(
    needTitlePick ? 'title-pick' : 'selecting',
  )
  const [selected, setSelected] = useState<number[]>([])
  const [wrongOpt, setWrongOpt] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintTile, setHintTile] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [result, setResult] = useState<LevelResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [burst, setBurst] = useState(0)
  const hintTimer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current)
    },
    [],
  )

  const complete = selected.length === answerLen

  // 选字状态的同步真值源：连续快速点击（同批次事件）时仍保证逻辑正确
  const selectedRef = useRef<number[]>(selected)
  const applySelection = (next: number[]) => {
    selectedRef.current = next
    setSelected(next)
  }

  // ── 选字 ──
  const toggleTile = (i: number) => {
    if (phase !== 'selecting') return
    setNotice(null)
    const cur = selectedRef.current
    if (cur.includes(i)) {
      applySelection(cur.filter((x) => x !== i))
      sfx.deselect()
    } else if (cur.length < answerLen) {
      applySelection([...cur, i])
      sfx.select()
    }
  }

  const undo = () => {
    if (phase !== 'selecting' || selectedRef.current.length === 0) return
    applySelection(selectedRef.current.slice(0, -1))
    setNotice(null)
    sfx.deselect()
  }

  const reset = () => {
    if (phase !== 'selecting') return
    applySelection([])
    setNotice(null)
    sfx.deselect()
  }

  // ── 中级：先选诗题 ──
  const pickOption = (i: number) => {
    const opt = q.options![i]
    if (opt.correct) {
      setWrongOpt(null)
      setPhase('selecting')
      setNotice('判断正确！现在请按顺序选出这句词。')
      sfx.correct()
    } else {
      setWrongOpt(i)
      setShake(true)
      window.setTimeout(() => setShake(false), 500)
      sfx.wrong()
    }
  }

  // ── 提交 ──
  const submit = () => {
    if (phase !== 'selecting' || selectedRef.current.length !== answerLen) return
    const chars = selectedRef.current.map((idx) => q.tiles[idx])
    if (checkAnswer(chars, q.answer)) {
      const perfect = attempts === 0 && hintsUsed === 0
      const r = computeResult(q.difficulty, attempts + 1, hintsUsed, progress.streak + 1)
      setResult(r)
      setPhase('solved')
      setModalOpen(true)
      setBurst((b) => b + 1)
      sfx.correct()
      onLevelComplete(level, { score: r.score, stars: r.stars, perfect })
    } else {
      const chars2 = selectedRef.current.map((idx) => q.tiles[idx])
      const hit = chars2.filter((c, idx) => c === q.answer[idx]).length
      setAttempts((a) => a + 1)
      setShake(true)
      window.setTimeout(() => setShake(false), 500)
      setNotice(
        hit > 0
          ? `${WRONG_MESSAGES[attempts % WRONG_MESSAGES.length]}（已有 ${hit} 个字位置正确）`
          : WRONG_MESSAGES[attempts % WRONG_MESSAGES.length],
      )
      sfx.wrong()
    }
  }

  // ── 提示 ──
  const useHint = () => {
    if (phase !== 'selecting') return
    if (hintsUsed >= MAX_HINTS) {
      setNotice('本关的提示已用完，相信你可以的。')
      return
    }
    const h = locateNextHint(selectedRef.current, q.tiles, q.answer)
    setNotice(h.message)
    if (h.tileIndex >= 0) {
      setHintTile(h.tileIndex)
      setHintsUsed((n) => n + 1)
      sfx.hint()
      if (hintTimer.current) window.clearTimeout(hintTimer.current)
      hintTimer.current = window.setTimeout(() => setHintTile(null), 3500)
    }
  }

  const isSuccess = phase === 'solved'
  const hasNext = level.index < levelsTotal

  return (
    <div className="game-screen">
      <header className="game-header">
        <button className="icon-btn" onClick={onBack} title="返回首页">
          ←
        </button>
        <div className="game-meta">
          <span className="meta-chapter">
            第{['一', '二', '三', '四', '五'][level.chapter.id - 1]}章 · {level.chapter.name}
          </span>
          <span className="meta-level">
            第 {level.index} / {levelsTotal} 关 · {DIFFICULTY_NAME[q.difficulty]}
          </span>
        </div>
        <div className="game-stats">
          <span className="chip">连胜 {progress.streak}</span>
          <button className="icon-btn" onClick={onToggleSound} title="音效开关">
            {progress.soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <section className="question-card">
        <p className="question-prompt">{q.prompt}</p>
        {q.difficulty === 'medium' && (
          <div className={'title-options' + (shake ? ' shake' : '')}>
            {q.options!.map((o, i) => (
              <button
                key={i}
                className={
                  'option-btn' +
                  (phase === 'selecting' && o.correct ? ' chosen' : '') +
                  (wrongOpt === i ? ' wrong' : '')
                }
                disabled={phase !== 'title-pick'}
                onClick={() => pickOption(i)}
              >
                <span className="option-tag">{['甲', '乙', '丙', '丁'][i]}</span>
                {o.text}
              </button>
            ))}
            {wrongOpt !== null && phase === 'title-pick' && (
              <p className="option-explain">「{q.options![wrongOpt].text}」不对哦——{q.options![wrongOpt].explain}</p>
            )}
          </div>
        )}
        {q.difficulty === 'hard' && (
          <ul className="clue-list">
            {q.clues!.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
        {q.difficulty === 'easy' && <p className="poem-ctx">《{q.poemTitle}》 · {q.author}（{q.dynasty}）</p>}
        {q.difficulty === 'medium' && phase === 'selecting' && (
          <p className="poem-ctx chosen-poem">已判定出处：《{q.poemTitle}》 · {q.author}</p>
        )}
      </section>

      <main className="board-wrap">
        <div className={'grid' + (phase === 'title-pick' ? ' disabled' : '')}>
          {q.tiles.map((ch, i) => {
            const sel = selected.includes(i)
            return (
              <button
                key={i}
                className={
                  'tile' +
                  (sel ? ' selected' : '') +
                  (hintTile === i ? ' hinted' : '') +
                  (isSuccess ? ' solved' : '')
                }
                onClick={() => toggleTile(i)}
                aria-label={ch}
              >
                {ch}
              </button>
            )
          })}
          {burst > 0 && isSuccess && (
            <div className="particle-burst" key={burst}>
              {Array.from({ length: 28 }).map((_, i) => (
                <span
                  key={i}
                  style={
                    {
                      '--dx': `${(Math.random() - 0.5) * 320}px`,
                      '--dy': `${(Math.random() - 0.9) * 300}px`,
                      '--rot': `${Math.random() * 720 - 360}deg`,
                      '--delay': `${Math.random() * 0.25}s`,
                      '--c': i % 3 === 0 ? '#e8c56a' : i % 3 === 1 ? '#d95f43' : '#f3e9c8',
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className={'answer-slots' + (shake ? ' shake' : '')}>
          {Array.from({ length: answerLen }).map((_, i) => {
            const tileIdx = selected[i]
            const ch = tileIdx !== undefined ? q.tiles[tileIdx] : ''
            return (
              <button
                key={i}
                className={'slot' + (ch ? ' filled' : '')}
                onClick={() => tileIdx !== undefined && toggleTile(tileIdx)}
                aria-label={ch || '空'}
              >
                {ch}
              </button>
            )
          })}
        </div>

        {isSuccess && <p className="solved-line">「{q.line}」——《{q.poemTitle}》</p>}
        {notice && <p className="notice">{notice}</p>}
      </main>

      <footer className="game-controls">
        <button className="btn ghost" onClick={useHint} disabled={phase !== 'selecting'}>
          提示 {MAX_HINTS - hintsUsed}
        </button>
        <button className="btn ghost" onClick={undo} disabled={phase !== 'selecting' || selected.length === 0}>
          撤销
        </button>
        <button className="btn ghost" onClick={reset} disabled={phase !== 'selecting' || selected.length === 0}>
          重选
        </button>
        <button
          className="btn primary"
          onClick={isSuccess ? onNext : submit}
          disabled={!isSuccess && !complete}
        >
          {isSuccess ? (hasNext ? '进入下一关' : '完成旅程') : '提交答案'}
        </button>
      </footer>

      {modalOpen && result && (
        <ResultModal
          question={q}
          result={result}
          perfect={attempts === 0 && hintsUsed === 0}
          hasNext={hasNext}
          onClose={() => setModalOpen(false)}
          onNext={onNext}
        />
      )}
    </div>
  )
}
