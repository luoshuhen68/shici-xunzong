import { useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from '../types'
import { streamPoetAnswer, type ChatMode } from '../ai/client'
import { toPoemContext, type ChatTurn } from '../ai/poemContext'
import { isAiConfigured } from '../ai/config'
import { sfx } from '../game/audio'

interface Msg {
  role: 'user' | 'assistant'
  text: string
  /** 仅助手消息：本条回答来自哪里 */
  mode?: ChatMode
}

interface Props {
  question: Question
  onClose: () => void
}

/** 与诗人对谈：以关卡诗文为上下文，流式接收回答，失败时自动降级为离线诗笺 */
export default function PoetChat({ question, onClose }: Props) {
  const poem = useMemo(() => toPoemContext(question), [question])
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      role: 'assistant',
      text: `「${question.line}」——你既寻到了这一句，便坐下来谈谈罢。想问什么，尽管说。`,
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const suggestions = useMemo(() => {
    const mid = question.answer[Math.floor(question.answer.length / 2)] ?? ''
    return [
      '这句诗是什么意思？',
      '你写这句时是怎样的心境？',
      mid ? `为何用「${mid}」这个字？` : '这句好在哪里？',
    ]
  }, [question])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    const history: ChatTurn[] = msgs.map((m) => ({ role: m.role, content: m.text }))
    setInput('')
    setBusy(true)
    sfx.select()
    setMsgs((prev) => [...prev, { role: 'user', text }, { role: 'assistant', text: '' }])

    const controller = new AbortController()
    abortRef.current = controller
    const mode = await streamPoetAnswer({
      question: text,
      poem,
      history,
      signal: controller.signal,
      onDelta: (piece) => {
        setMsgs((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: m.text + piece } : m)),
        )
      },
    })

    if (mode === 'abort') return
    setMsgs((prev) =>
      prev.map((m, i) => (i === prev.length - 1 ? { ...m, mode } : m)),
    )
    setBusy(false)
  }

  const offline = msgs.some((m) => m.mode === 'local')

  return (
    <div className="modal-mask chat-mask" onClick={onClose}>
      <div className="chat-card" onClick={(e) => e.stopPropagation()}>
        <header className="chat-head">
          <div className="chat-seal">{question.author.slice(0, 1)}</div>
          <div className="chat-head-text">
            <div className="chat-title">与{question.author}对谈</div>
            <div className="chat-sub">
              {question.dynasty} · 《{question.poemTitle}》
              {offline && <span className="chat-offline">离线诗笺</span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="结束对话">
            ✕
          </button>
        </header>

        <div className="chat-list" ref={listRef}>
          {msgs.map((m, i) => (
            <div key={i} className={'chat-row ' + m.role}>
              <div className={'chat-bubble' + (m.text ? '' : ' typing')}>
                {m.text || (busy ? '……' : '')}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-suggest">
          {suggestions.map((s) => (
            <button
              key={s}
              className="chat-chip"
              disabled={busy}
              onClick={() => void send(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <footer className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            maxLength={100}
            placeholder={busy ? '先生正在斟酌……' : '问一句诗里的意思'}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send(input)
            }}
            disabled={busy}
          />
          <button
            className="btn primary small"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
          >
            奉问
          </button>
        </footer>

        <p className="chat-note">
          {isAiConfigured()
            ? '本对话由 AI 生成，仅供学习参考，难免有失实处。'
            : '未连接 AI 服务，当前以题库释义作答。'}
        </p>
      </div>
    </div>
  )
}
