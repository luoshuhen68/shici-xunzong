import type { Achievement, Chapter, Difficulty, LevelRecord, Progress, Question } from '../types'
import { CHAPTERS, QUESTIONS } from '../data/poems'

// ────────────────────────────── 题目校验 ──────────────────────────────

/** 统计字符串中每个汉字出现的次数 */
function charCounts(s: string): Map<string, number> {
  const m = new Map<string, number>()
  for (const ch of s) m.set(ch, (m.get(ch) ?? 0) + 1)
  return m
}

/**
 * 校验题目配置是否可通关：
 *  - 九宫格必须 9 个字；
 *  - 目标答案长度 2~9；
 *  - 答案中的每个字（按重复次数）都必须存在于九宫格中；
 *  - 中级题必须提供恰好一个正确选项；高级题必须有线索。
 * 返回无效题目 id 列表，游戏启动时跳过它们，避免配置错误导致无法通关。
 */
export function findInvalidQuestions(questions: Question[]): string[] {
  const bad: string[] = []
  for (const q of questions) {
    const okTiles = q.tiles.length === 9
    const okLen = q.answer.length >= 2 && q.answer.length <= 9
    const tileCounts = charCounts(q.tiles.join(''))
    const ansCounts = charCounts(q.answer)
    let okSubset = true
    for (const [ch, n] of ansCounts) {
      if ((tileCounts.get(ch) ?? 0) < n) okSubset = false
    }
    const okMode =
      q.difficulty === 'easy' ||
      (q.difficulty === 'medium' &&
        !!q.options &&
        q.options.length >= 2 &&
        q.options.filter((o) => o.correct).length === 1) ||
      (q.difficulty === 'hard' && !!q.clues && q.clues.length >= 1)
    if (!(okTiles && okLen && okSubset && okMode)) bad.push(q.id)
  }
  return bad
}

/** 过滤掉配置有误的题目（控制台给出警告） */
export function loadValidQuestions(): Question[] {
  const invalid = findInvalidQuestions(QUESTIONS)
  if (invalid.length > 0) console.warn('[诗词寻踪] 以下题目配置有误，已跳过：', invalid)
  return QUESTIONS.filter((q) => !invalid.includes(q.id))
}

// ────────────────────────────── 关卡组织 ──────────────────────────────

export interface Level {
  /** 全局序号（1 开始） */
  index: number
  chapter: Chapter
  chapterLevel: number
  question: Question
}

/** 按「章节 → 难度阶梯」生成闯关序列 */
export function buildLevels(): Level[] {
  const questions = loadValidQuestions()
  const levels: Level[] = []
  for (const ch of CHAPTERS) {
    const qs = questions
      .filter((q) => q.chapter === ch.id)
      .sort((a, b) => rank(a.difficulty) - rank(b.difficulty))
    qs.forEach((q, i) => {
      levels.push({ index: levels.length + 1, chapter: ch, chapterLevel: i + 1, question: q })
    })
  }
  return levels
}

function rank(d: Difficulty): number {
  return d === 'easy' ? 0 : d === 'medium' ? 1 : 2
}

export const DIFFICULTY_NAME: Record<Difficulty, string> = {
  easy: '初级 · 诗句寻字',
  medium: '中级 · 诗题寻踪',
  hard: '高级 · 诗词探秘',
}

export const DIFFICULTY_BASE_SCORE: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  hard: 200,
}

// ────────────────────────────── 校验与提示 ──────────────────────────────

/** 玩家所选字序是否与答案一致（重复字天然按顺序匹配） */
export function checkAnswer(selectedChars: string[], answer: string): boolean {
  return selectedChars.join('') === answer
}

/**
 * 提示：找到当前「正确前缀」之后的下一个目标字，
 * 返回九宫格中该字的方块下标（未被选中的那一个）。
 * 若当前已选内容在正确前缀之外，返回 -1 并给出修正提示。
 */
export function locateNextHint(
  selected: number[],
  tiles: string[],
  answer: string,
): { tileIndex: number; message: string } {
  const selectedChars = selected.map((i) => tiles[i])
  // 计算最长正确前缀
  let prefix = 0
  while (prefix < selectedChars.length && selectedChars[prefix] === answer[prefix]) prefix++
  if (prefix < selectedChars.length) {
    return {
      tileIndex: -1,
      message: '已选的字中有不对的地方，先撤销多余的方块，再来试试。',
    }
  }
  if (prefix >= answer.length) {
    return { tileIndex: -1, message: '已经全部正确，直接提交吧！' }
  }
  const need = answer[prefix]
  const used = new Set(selected)
  const candidate = tiles.findIndex((ch, i) => ch === need && !used.has(i))
  if (candidate < 0) return { tileIndex: -1, message: '这一题好像无法继续了，请重新开始本题。' }
  return { tileIndex: candidate, message: `第 ${prefix + 1} 个字是「${need}」，看看发亮的方块。` }
}

// ────────────────────────────── 积分与星级 ──────────────────────────────

export interface LevelResult {
  base: number
  hintPenalty: number
  streakBonus: number
  perfectBonus: number
  score: number
  /** 星级（0 表示跳过本关） */
  stars: 0 | 1 | 2 | 3
}

export function computeResult(
  difficulty: Difficulty,
  attempts: number,
  hintsUsed: number,
  streak: number,
): LevelResult {
  const base = DIFFICULTY_BASE_SCORE[difficulty]
  const hintPenalty = hintsUsed * 20
  const streakBonus = Math.min(Math.max(streak - 1, 0), 4) * 15
  const perfectBonus = attempts === 1 && hintsUsed === 0 ? 30 : 0
  // 鼓励为主：得分不为负，且不低于基准的一半
  const score = Math.max(base - hintPenalty, Math.round(base * 0.5)) + streakBonus + perfectBonus
  let stars: 1 | 2 | 3 = 1
  if (attempts === 1 && hintsUsed === 0) stars = 3
  else if (attempts <= 2 && hintsUsed <= 1) stars = 2
  return { base, hintPenalty, streakBonus, perfectBonus, score, stars }
}

// ────────────────────────────── 成就 ──────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-clear', name: '初入诗门', desc: '完成第一关' },
  { id: 'streak-3', name: '七步成诗', desc: '连续答对 3 关' },
  { id: 'streak-5', name: '势如破竹', desc: '连续答对 5 关' },
  { id: 'perfect', name: '一气呵成', desc: '首次尝试且不用提示通过任意一关' },
  { id: 'chapter-1', name: '寻芳客', desc: '完成「春日寻诗」全部关卡' },
  { id: 'chapter-2', name: '山水知音', desc: '完成「山水入画」全部关卡' },
  { id: 'chapter-3', name: '望月怀远', desc: '完成「明月寄情」全部关卡' },
  { id: 'chapter-4', name: '塞上雄风', desc: '完成「边塞风云」全部关卡' },
  { id: 'chapter-5', name: '问道得真', desc: '完成「诗心问道」全部关卡' },
  { id: 'all-clear', name: '学有所成', desc: '走完诗词寻踪之旅的全部关卡' },
  { id: 'all-star', name: '诗词达人', desc: '所有关卡均获得三星' },
]

/** 根据通关结果计算新获得的成就 */
export function evaluateAchievements(
  levels: Level[],
  cleared: Record<string, LevelRecord>,
  streak: number,
  justPerfect: boolean,
): string[] {
  const owned = new Set<string>()
  const gained: string[] = []
  const grant = (id: string) => {
    if (!owned.has(id)) {
      owned.add(id)
      gained.push(id)
    }
  }
  const clearedIds = new Set(Object.keys(cleared))
  if (clearedIds.size >= 1) grant('first-clear')
  if (streak >= 3) grant('streak-3')
  if (streak >= 5) grant('streak-5')
  if (justPerfect) grant('perfect')
  // 跳过（0 星）的关卡不计入章节/全通关成就，需真正通关
  const done = (id: string) => (cleared[id]?.stars ?? 0) > 0
  for (const ch of CHAPTERS) {
    const ids = levels.filter((l) => l.chapter.id === ch.id).map((l) => l.question.id)
    if (ids.length > 0 && ids.every(done)) grant(`chapter-${ch.id}`)
  }
  const levelIds = levels.map((l) => l.question.id)
  if (levelIds.length > 0 && levelIds.every(done)) grant('all-clear')
  if (
    levelIds.length > 0 &&
    levelIds.every((id) => clearedIds.has(id) && cleared[id].stars === 3)
  )
    grant('all-star')
  return gained
}

// ────────────────────────────── 存档 ──────────────────────────────

const STORAGE_KEY = 'shici-xunzong-progress-v1'

export function defaultProgress(): Progress {
  return {
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    levels: {},
    unlocked: 1,
    achievements: [],
    guideSeen: false,
    soundOn: true,
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const data = JSON.parse(raw) as Partial<Progress>
    return { ...defaultProgress(), ...data }
  } catch (e) {
    console.warn('[诗词寻踪] 读取进度失败，已重置：', e)
    return defaultProgress()
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch (e) {
    console.warn('[诗词寻踪] 保存进度失败：', e)
  }
}
