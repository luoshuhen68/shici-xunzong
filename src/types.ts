/** 三种难度模式 */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** 中级模式的诗题选项 */
export interface TitleOption {
  /** 诗题文本，如《静夜思》 */
  text: string
  /** 是否为正确答案 */
  correct: boolean
  /** 选错时展示的解释 */
  explain: string
}

/**
 * 一道题目（题库结构化数据）
 * 题库与游戏逻辑分离：本文件只描述数据，不包含玩法逻辑。
 */
export interface Question {
  /** 唯一 id，如 q-guiyuan-1 */
  id: string
  /** 所属章节 1~5 */
  chapter: number
  difficulty: Difficulty
  /** 诗歌标题 */
  poemTitle: string
  /** 作者 */
  author: string
  /** 朝代 */
  dynasty: string
  /** 目标诗句（带标点，用于展示） */
  line: string
  /** 目标诗句的字序（去标点，用于校验；重复字如实保留） */
  answer: string
  /** 九宫格 9 个汉字（按行优先排列，含干扰字） */
  tiles: string[]
  /** 题干（初级直接给诗名与线索；高级给线索引导语） */
  prompt: string
  /** 中级：诗题选项（correct 恰好一个） */
  options?: TitleOption[]
  /** 高级：线索列表 */
  clues?: string[]
  /** 诗句简短释义 */
  meaning: string
  /** 诗词知识卡片（意境/情感/文化背景） */
  appreciation: string
  /** 教材来源 */
  source: string
}

/** 章节定义 */
export interface Chapter {
  id: number
  name: string
  subtitle: string
}

/** 单关卡的存档记录 */
export interface LevelRecord {
  stars: 1 | 2 | 3
  score: number
}

/** 成就定义 */
export interface Achievement {
  id: string
  name: string
  desc: string
}

/** 全局进度（localStorage） */
export interface Progress {
  totalScore: number
  /** 当前连胜（按完成的关卡数计） */
  streak: number
  bestStreak: number
  /** 各关卡最佳记录 */
  levels: Record<string, LevelRecord>
  /** 已解锁的关卡数量（按顺序解锁，初始为 1） */
  unlocked: number
  achievements: string[]
  guideSeen: boolean
  soundOn: boolean
}
