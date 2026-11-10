import type { Question } from '../types'

/** 传给代理的诗篇上下文（都是公开的题库数据） */
export interface PoemContext {
  title: string
  author: string
  dynasty: string
  line: string
  meaning: string
  appreciation: string
  source: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export function toPoemContext(q: Question): PoemContext {
  return {
    title: q.poemTitle,
    author: q.author,
    dynasty: q.dynasty,
    line: q.line,
    meaning: q.meaning,
    appreciation: q.appreciation,
    source: q.source,
  }
}

/**
 * 离线诗笺
 * ------------------------------------------------------------------
 * 接口不可用时按关键词从题库已有的释义/赏析里组织回答，
 * 保证玩家不会对着空白的对话框。这里不编造任何新内容。
 */
export function localAnswer(question: string, poem: PoemContext): string {
  const text = question.trim()
  const has = (...keys: string[]) => keys.some((k) => text.includes(k))

  if (has('你是谁', '自我介绍', '何人', '哪个朝代')) {
    return `我是${poem.dynasty}人${poem.author}。此刻与你共读的，是《${poem.title}》中的「${poem.line}」。`
  }
  if (has('什么', '意思', '翻译', '讲的', '说的是', '怎么理解', '含义')) {
    return `「${poem.line}」——${poem.meaning}`
  }
  if (has('心境', '心情', '情感', '想表达', '为什么写', '背景', '当时')) {
    return `${poem.appreciation}`
  }
  if (has('字', '用词', '妙处', '为何', '意象')) {
    return `这一句的字面是：${poem.meaning}要把用字之妙看透，还得连上全篇的意境——${poem.appreciation}`
  }
  if (has('赏析', '评价', '好在哪里')) {
    return `${poem.appreciation}（出处：${poem.source}）`
  }
  return `「${poem.line}」的意思是：${poem.meaning}若你想知道更细的用字与心境，可以换个问法再问一次。`
}
