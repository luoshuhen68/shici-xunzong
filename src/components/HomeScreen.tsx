import type { Level } from '../game/logic'
import { DIFFICULTY_NAME } from '../game/logic'
import { ACHIEVEMENTS } from '../game/logic'
import type { Progress } from '../types'

interface Props {
  levels: Level[]
  progress: Progress
  onPlay: (idx: number) => void
  onContinue: () => void
  onReset: () => void
  onShowGuide: () => void
  onToggleSound: () => void
}

function starIcons(n: number): string {
  return n >= 1 ? '★'.repeat(n) + '☆'.repeat(3 - n) : '☆☆☆'
}

export default function HomeScreen({
  levels,
  progress,
  onPlay,
  onContinue,
  onReset,
  onShowGuide,
  onToggleSound,
}: Props) {
  const clearedCount = Object.keys(progress.levels).length
  const totalStars = Object.values(progress.levels).reduce((s, r) => s + r.stars, 0)
  const chapters = [...new Set(levels.map((l) => l.chapter.id))].map((cid) => ({
    chapter: levels.find((l) => l.chapter.id === cid)!.chapter,
    levels: levels.filter((l) => l.chapter.id === cid),
  }))
  const hasProgress = clearedCount > 0

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="brand">
          <span className="brand-seal">寻</span>
          <div>
            <h1 className="brand-title">诗词寻踪</h1>
            <p className="brand-sub">九宫格里，寻一句千年</p>
          </div>
        </div>
        <div className="home-tools">
          <button className="icon-btn" onClick={onToggleSound} title="音效开关">
            {progress.soundOn ? '🔊' : '🔇'}
          </button>
          <button className="icon-btn" onClick={onShowGuide} title="新手引导">
            卷
          </button>
        </div>
      </header>

      <section className="stats-row">
        <div className="stat">
          <span className="stat-num">{progress.totalScore}</span>
          <span className="stat-label">总分</span>
        </div>
        <div className="stat">
          <span className="stat-num">
            {totalStars}
            <em>/{levels.length * 3}</em>
          </span>
          <span className="stat-label">星辉</span>
        </div>
        <div className="stat">
          <span className="stat-num">{progress.streak}</span>
          <span className="stat-label">连胜</span>
        </div>
        <div className="stat">
          <span className="stat-num">
            {clearedCount}
            <em>/{levels.length}</em>
          </span>
          <span className="stat-label">关卡</span>
        </div>
      </section>

      <div className="home-cta">
        <button className="btn primary big" onClick={onContinue}>
          {hasProgress ? '继续寻踪' : '启程 · 诗词寻踪之旅'}
        </button>
      </div>

      <section className="journey">
        {chapters.map(({ chapter, levels: chLevels }) => {
          const chapterCleared = chLevels.filter((l) => progress.levels[l.question.id]).length
          const locked = chLevels.every((l) => l.index > progress.unlocked)
          return (
            <div key={chapter.id} className={'chapter-card' + (locked ? ' locked' : '')}>
              <div className="chapter-head">
                <span className="chapter-no">第{['一', '二', '三', '四', '五'][chapter.id - 1]}章</span>
                <span className="chapter-name">{chapter.name}</span>
                <span className="chapter-sub">{chapter.subtitle}</span>
                <span className="chapter-progress">
                  {chapterCleared}/{chLevels.length}
                </span>
              </div>
              <div className="level-nodes">
                {chLevels.map((l) => {
                  const rec = progress.levels[l.question.id]
                  const isLocked = l.index > progress.unlocked
                  const isCurrent = !isLocked && !rec
                  return (
                    <button
                      key={l.question.id}
                      disabled={isLocked}
                      className={
                        'level-node' +
                        (isLocked ? ' locked' : '') +
                        (rec ? ' cleared' : '') +
                        (isCurrent ? ' current' : '')
                      }
                      onClick={() => onPlay(l.index - 1)}
                      title={`${DIFFICULTY_NAME[l.question.difficulty]} · ${l.question.poemTitle}`}
                    >
                      <span className="node-no">{l.index}</span>
                      <span className="node-stars">{rec ? starIcons(rec.stars) : '···'}</span>
                      <span className="node-diff">{DIFFICULTY_NAME[l.question.difficulty].slice(0, 2)}</span>
                      {isLocked && <span className="node-lock">🔒</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      <section className="achievements">
        <h3 className="sec-title">成就 · {progress.achievements.length}/{ACHIEVEMENTS.length}</h3>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const owned = progress.achievements.includes(a.id)
            return (
              <div key={a.id} className={'ach-card' + (owned ? ' owned' : '')}>
                <span className="ach-name">{owned ? '✦' : '✧'} {a.name}</span>
                <span className="ach-desc">{a.desc}</span>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="home-footer">
        <button className="btn ghost small" onClick={onReset}>
          重置进度
        </button>
        <span className="foot-note">诗句均出自统编版高中语文教材 · 进度保存在本机浏览器</span>
      </footer>
    </div>
  )
}
