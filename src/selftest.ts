/**
 * 题库与核心逻辑自检脚本（Node 运行，不依赖浏览器）
 * 运行：npm run selftest
 */
declare const process: { exit: (code?: number) => void }
import { buildLevels, checkAnswer, computeResult, evaluateAchievements, findInvalidQuestions, loadValidQuestions, locateNextHint } from './game/logic'
import { CHAPTERS, QUESTIONS } from './data/poems'

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed++
    console.error('  ✗ ' + msg)
  } else {
    console.log('  ✓ ' + msg)
  }
}

console.log('— 题库结构校验 —')
assert(QUESTIONS.length >= 15, `题目数量 ${QUESTIONS.length} ≥ 15`)
assert(findInvalidQuestions(QUESTIONS).length === 0, '无配置错误的题目')

const levels = buildLevels()
console.log('— 关卡组织 —')
assert(levels.length === QUESTIONS.length, `关卡总数 ${levels.length} = 题目数 ${QUESTIONS.length}`)
for (const ch of CHAPTERS) {
  const chLevels = levels.filter((l) => l.chapter.id === ch.id)
  assert(chLevels.length >= 2, `第${ch.id}章「${ch.name}」含 ${chLevels.length} 关`)
  const diffSeq = levels
    .filter((l) => l.chapter.id === ch.id)
    .map((l) => ({ easy: 0, medium: 1, hard: 2 }[l.question.difficulty]))
  const sorted = [...diffSeq].sort((a, b) => a - b)
  assert(JSON.stringify(diffSeq) === JSON.stringify(sorted), `第${ch.id}章难度递增: [${diffSeq.join(',')}]`)
}
const diffs = levels.map((l) => l.question.difficulty)
assert(diffs.filter((d) => d === 'easy').length >= 5, `初级 ${diffs.filter((d) => d === 'easy').length} ≥ 5`)
assert(diffs.filter((d) => d === 'medium').length >= 5, `中级 ${diffs.filter((d) => d === 'medium').length} ≥ 5`)
assert(diffs.filter((d) => d === 'hard').length >= 3, `高级 ${diffs.filter((d) => d === 'hard').length} ≥ 3`)

console.log('— 每道题可通关校验（含重复字）—')
for (const q of QUESTIONS) {
  // 1) 九宫格 9 字
  assert(q.tiles.length === 9, `[${q.poemTitle}] 九宫格 9 字`)
  // 2) 答案字（按重复次数）都在格子中，且能按顺序不冲突地选出
  const used = new Set<number>()
  let solvable = true
  for (const ch of q.answer) {
    const idx = q.tiles.findIndex((t, i) => t === ch && !used.has(i))
    if (idx < 0) {
      solvable = false
      break
    }
    used.add(idx)
  }
  assert(solvable, `[${q.poemTitle}] 答案「${q.answer}」可依序选出`)
  // 3) 按可解序列校验 checkAnswer
  if (solvable) {
    const seq = [...used]
    assert(checkAnswer(seq.map((i) => q.tiles[i]), q.answer), `[${q.poemTitle}] checkAnswer 通过`)
  }
  // 5) 中级：恰好一个正确选项；高级：有线索
  if (q.difficulty === 'medium')
    assert(q.options?.length === 4 && q.options.filter((o) => o.correct).length === 1, `[${q.poemTitle}] 中级选项 4 个且唯一正确`)
  if (q.difficulty === 'hard') assert((q.clues?.length ?? 0) >= 2, `[${q.poemTitle}] 高级线索 ≥ 2`)
  // 6) 答案字序必须是展示行（去标点）中的连续片段
  const strip = (s: string) => s.replace(/[，。！？、；：？！…—]/g, '')
  assert(strip(q.line).includes(q.answer), `[${q.poemTitle}] 答案是展示行中的连续片段`)
}

console.log('— 提示逻辑 —')
const q7 = QUESTIONS.find((q) => q.id === 'q-shudao-1')! // 蜀道之难难于上青天（难×2）
const h0 = locateNextHint([], q7.tiles, q7.answer)
assert(q7.tiles[h0.tileIndex] === '蜀', '蜀道难空选提示指向「蜀」')
const s1 = q7.tiles.reduce<number[]>((acc, c, i) => (c === '难' ? [...acc, i] : acc), [])
const h1 = locateNextHint([1, 5, 7, s1[0]], q7.tiles, q7.answer)
assert(q7.tiles[h1.tileIndex] === '难' && h1.tileIndex === s1[1], '重复字提示指向第二个「难」方块')
const wrong = locateNextHint([1, 0], q7.tiles, q7.answer)
assert(wrong.tileIndex === -1 && wrong.message.includes('撤销'), '前缀错误时提示先撤销')

const q11 = QUESTIONS.find((q) => q.id === 'q-jiangchengzi-1')! // 十年生死两茫茫（茫×2）
const mangIdx = q11.tiles.map((c, i) => [c, i] as const).filter(([c]) => c === '茫').map(([, i]) => i)
assert(mangIdx.length === 2, '江城子含两个「茫」方块')
const seq11: number[] = []
for (const ch of q11.answer) {
  const i = q11.tiles.findIndex((t, k) => t === ch && !seq11.includes(k))
  seq11.push(i)
}
assert(checkAnswer(seq11.map((i) => q11.tiles[i]), q11.answer), '江城子重复字序列校验通过')

console.log('— 计分与星级 —')
const r3 = computeResult('easy', 1, 0, 1)
assert(r3.score === 130 && r3.stars === 3, `完美初级 = 130 分 3 星（得 ${r3.score}/${r3.stars}）`)
const rHint = computeResult('hard', 1, 2, 3)
assert(rHint.score === 190 && rHint.stars === 1, `高级用2次提示连胜3 = 190 分 1 星（得 ${rHint.score}/${rHint.stars}）`)
const rSloppy = computeResult('medium', 4, 2, 1)
assert(rSloppy.score === 110 && rSloppy.stars === 1, `多错慢做中级 110 分 1 星（得 ${rSloppy.score}/${rSloppy.stars}）`)

console.log('— 成就 —')
const cleared = { [QUESTIONS[0].id]: { stars: 3 as const, score: 130 } }
const ach1 = evaluateAchievements(levels, cleared, 1, true)
assert(ach1.includes('first-clear') && ach1.includes('perfect'), '首关完美 → 初入诗门 + 一气呵成')
const allCleared: Record<string, { stars: 1 | 2 | 3; score: number }> = {}
for (const q of QUESTIONS) allCleared[q.id] = { stars: 3, score: 200 }
const ach2 = evaluateAchievements(levels, allCleared, 9, false)
assert(ach2.includes('all-clear') && ach2.includes('all-star') && ach2.includes('streak-5'), '全通关三星 → 学有所成 + 诗词达人 + 势如破竹')

const valid = loadValidQuestions()
assert(valid.length === QUESTIONS.length, 'loadValidQuestions 无过滤损失')

console.log(failed === 0 ? '\n全部自检通过 ✓' : `\n存在 ${failed} 处失败 ✗`)
process.exit(failed === 0 ? 0 : 1)
