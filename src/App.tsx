import { useCallback, useEffect, useRef, useState } from 'react'
import BgScene from './components/BgScene'
import GuideModal from './components/GuideModal'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import {
  ACHIEVEMENTS,
  buildLevels,
  defaultProgress,
  evaluateAchievements,
  loadProgress,
  saveProgress,
} from './game/logic'
import type { Level } from './game/logic'
import type { Progress } from './types'
import { setMuted, sfx } from './game/audio'

export interface Toast {
  key: number
  name: string
  desc: string
}

const LEVELS = buildLevels()

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [screen, setScreen] = useState<'home' | 'game'>('home')
  const [levelIdx, setLevelIdx] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showGuide, setShowGuide] = useState(() => !loadProgress().guideSeen)
  const toastKeyRef = useRef(0)

  useEffect(() => {
    setMuted(!progress.soundOn)
  }, [progress.soundOn])

  const update = useCallback((p: Progress) => {
    setProgress(p)
    saveProgress(p)
  }, [])

  /** 通关：更新进度、解锁下一关、结算成就并弹窗提示 */
  const handleLevelComplete = useCallback(
    (level: Level, result: { score: number; stars: 1 | 2 | 3; perfect: boolean }) => {
      const qid = level.question.id
      const old = progress.levels[qid]
      const levels = {
        ...progress.levels,
        [qid]: {
          stars: Math.max(old?.stars ?? 0, result.stars) as 1 | 2 | 3,
          score: Math.max(old?.score ?? 0, result.score),
        },
      }
      const streak = progress.streak + 1
      // 只提示尚未获得的成就，避免重复弹窗
      const gained = evaluateAchievements(LEVELS, levels, streak, result.perfect).filter(
        (id) => !progress.achievements.includes(id),
      )
      const next: Progress = {
        ...progress,
        levels,
        streak,
        bestStreak: Math.max(progress.bestStreak, streak),
        totalScore: progress.totalScore + result.score,
        unlocked: Math.max(progress.unlocked, Math.min(level.index + 1, LEVELS.length)),
        achievements: [...new Set([...progress.achievements, ...gained])],
      }
      update(next)
      if (gained.length > 0) {
        sfx.achieve()
        setToasts((prev) => [
          ...prev,
          ...gained.map((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id)!
            return { key: ++toastKeyRef.current, name: a.name, desc: a.desc }
          }),
        ])
      }
    },
    [progress, update],
  )

  const dismissToast = useCallback((key: number) => {
    setToasts((prev) => prev.filter((t) => t.key !== key))
  }, [])

  const startLevel = useCallback((idx: number) => {
    setLevelIdx(idx)
    setScreen('game')
  }, [])

  const nextLevel = useCallback(() => {
    if (levelIdx + 1 < LEVELS.length) setLevelIdx(levelIdx + 1)
    else setScreen('home')
  }, [levelIdx])

  const continueGame = useCallback(() => {
    const idx = LEVELS.findIndex((l, i) => i < progress.unlocked && !progress.levels[l.question.id])
    startLevel(idx >= 0 ? idx : Math.min(progress.unlocked - 1, LEVELS.length - 1))
  }, [progress, startLevel])

  const resetProgress = useCallback(() => {
    if (window.confirm('确定要重置全部进度吗？诗词冒险将从头开始。')) {
      const fresh = defaultProgress()
      fresh.guideSeen = true
      update(fresh)
      setScreen('home')
    }
  }, [update])

  const closeGuide = useCallback(
    (seen: boolean) => {
      setShowGuide(false)
      if (seen) update({ ...progress, guideSeen: true })
    },
    [progress, update],
  )

  const toggleSound = useCallback(() => {
    update({ ...progress, soundOn: !progress.soundOn })
  }, [progress, update])

  return (
    <div className="app-root">
      <BgScene />
      {screen === 'home' ? (
        <HomeScreen
          levels={LEVELS}
          progress={progress}
          onPlay={startLevel}
          onContinue={continueGame}
          onReset={resetProgress}
          onShowGuide={() => setShowGuide(true)}
          onToggleSound={toggleSound}
        />
      ) : (
        <GameScreen
          key={levelIdx}
          level={LEVELS[levelIdx]}
          levelsTotal={LEVELS.length}
          progress={progress}
          onBack={() => setScreen('home')}
          onNext={nextLevel}
          onLevelComplete={handleLevelComplete}
          onToggleSound={toggleSound}
        />
      )}

      {showGuide && <GuideModal onClose={closeGuide} />}

      <div className="toast-area">
        {toasts.slice(-2).map((t) => (
          <AchievementToast key={t.key} toast={t} onDone={dismissToast} />
        ))}
      </div>
    </div>
  )
}

/** 单条成就弹窗：自动消失，也可点击立即关闭 */
function AchievementToast({ toast, onDone }: { toast: Toast; onDone: (key: number) => void }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const t1 = window.setTimeout(() => setLeaving(true), 2800)
    const t2 = window.setTimeout(() => onDone(toast.key), 3200)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [toast.key, onDone])
  return (
    <div
      className={'achievement-toast' + (leaving ? ' leaving' : '')}
      onClick={() => onDone(toast.key)}
      title="点击关闭"
    >
      <div className="toast-seal">成</div>
      <div>
        <div className="toast-name">获得成就 · {toast.name}</div>
        <div className="toast-desc">{toast.desc}</div>
      </div>
    </div>
  )
}
