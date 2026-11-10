import { AI_ENDPOINT, isAiConfigured } from './config'
import { localAnswer, type ChatTurn, type PoemContext } from './poemContext'

export type ChatMode = 'ai' | 'local' | 'abort'

interface AskOptions {
  question: string
  poem: PoemContext
  history: ChatTurn[]
  signal: AbortSignal
  /** 每收到一小段增量文本就回调一次 */
  onDelta: (text: string) => void
}

/**
 * 向代理发起一次对话，边收边显示。
 * 任何失败都会自动降级为离线诗笺，并返回实际使用的模式。
 */
export async function streamPoetAnswer(opts: AskOptions): Promise<ChatMode> {
  const { question, poem, history, signal, onDelta } = opts

  if (!isAiConfigured()) {
    onDelta(localAnswer(question, poem))
    return 'local'
  }

  try {
    const res = await fetch(`${AI_ENDPOINT}/chat`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, poem, history }),
    })
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let received = false

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // 代理透传 OpenAI 风格的 SSE，按空行切事件
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''
      for (const evt of events) {
        for (const line of evt.split('\n')) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') continue
          try {
            const piece = JSON.parse(data)?.choices?.[0]?.delta?.content
            if (typeof piece === 'string' && piece) {
              received = true
              onDelta(piece)
            }
          } catch {
            // 分片不完整时忽略，等下一段
          }
        }
      }
    }

    if (!received) throw new Error('empty stream')
    return 'ai'
  } catch (err) {
    if ((err as Error).name === 'AbortError') return 'abort'
    onDelta(localAnswer(question, poem))
    return 'local'
  }
}
