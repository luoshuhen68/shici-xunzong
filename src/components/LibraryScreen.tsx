import { useMemo, useState } from 'react'
import { POEM_LIBRARY, VOLUMES } from '../data/library'
import type { PoemEntry, VolumeId } from '../data/library'
import { QUESTIONS } from '../data/poems'

interface Props {
  onBack: () => void
}

export default function LibraryScreen({ onBack }: Props) {
  const [query, setQuery] = useState('')
  const [vol, setVol] = useState<VolumeId | 'all'>('all')
  const [openTitle, setOpenTitle] = useState<string | null>(null)

  // 游戏中出现过的篇目（题库 poemTitle 与诗词库 title 一致）
  const gameTitles = useMemo(() => new Set(QUESTIONS.map((q) => q.poemTitle)), [])

  const kw = query.trim()
  const filtered = useMemo(() => {
    return POEM_LIBRARY.filter((p) => {
      if (vol !== 'all' && p.volume !== vol) return false
      if (!kw) return true
      // 支持全名或去括号后的简称匹配，如「声声慢」「望海潮」
      const bare = p.title.replace(/[（〔].*?[）〕]/g, '')
      return p.title.includes(kw) || bare.includes(kw) || p.author.includes(kw)
    })
  }, [vol, kw])

  const volumeName = (id: VolumeId) => VOLUMES.find((v) => v.id === id)?.name ?? ''

  return (
    <div className="library-screen">
      <header className="lib-header">
        <button className="icon-btn" onClick={onBack} title="返回首页">
          ←
        </button>
        <div className="lib-head-text">
          <h1 className="lib-title">诗词库</h1>
          <p className="lib-sub">统编版教材篇目 · 共 {POEM_LIBRARY.length} 篇</p>
        </div>
      </header>

      <div className="lib-toolbar">
        <input
          className="lib-search"
          type="search"
          placeholder="搜索诗词名称或作者…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="搜索诗词"
        />
        <div className="lib-chips">
          <button className={'lib-chip' + (vol === 'all' ? ' on' : '')} onClick={() => setVol('all')}>
            全部
          </button>
          {VOLUMES.map((v) => (
            <button key={v.id} className={'lib-chip' + (vol === v.id ? ' on' : '')} onClick={() => setVol(v.id)}>
              {v.name}
            </button>
          ))}
        </div>
      </div>

      <main className="lib-list">
        {filtered.length === 0 && <p className="lib-empty">没有找到「{kw}」相关的诗词，换个名字试试。</p>}
        {filtered.map((p) => (
          <PoemCard
            key={p.title}
            poem={p}
            inGame={gameTitles.has(p.title)}
            volName={volumeName(p.volume)}
            open={openTitle === p.title}
            onToggle={() => setOpenTitle(openTitle === p.title ? null : p.title)}
          />
        ))}
      </main>
    </div>
  )
}

function PoemCard({
  poem,
  inGame,
  volName,
  open,
  onToggle,
}: {
  poem: PoemEntry
  inGame: boolean
  volName: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <article className={'lib-card' + (open ? ' open' : '')}>
      <button className="lib-card-head" onClick={onToggle} aria-expanded={open}>
        <div>
          <h3 className="lib-poem-title">《{poem.title}》</h3>
          <p className="lib-poem-meta">
            {poem.dynasty} · {poem.author}
          </p>
        </div>
        <div className="lib-card-tags">
          {inGame && <span className="lib-badge-game">游戏关卡</span>}
          <span className="lib-badge-vol">{volName}</span>
          <span className={'lib-arrow' + (open ? ' up' : '')}>▾</span>
        </div>
      </button>
      {open && (
        <div className="lib-poem-text">
          {poem.text.split('\n').map((line, i) =>
            line === '' ? <span key={i} className="lib-gap" /> : (
              <p key={i} className={'lib-line' + (line.startsWith('【序】') ? ' lib-order' : '')}>
                {line}
              </p>
            ),
          )}
        </div>
      )}
    </article>
  )
}
