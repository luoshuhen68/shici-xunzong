import { useState } from 'react'

const STEPS = [
  {
    title: '何为「诗词寻踪」',
    body: (
      <>
        <p>九宫格中藏着一句真正的古诗。请按诗句的<strong>正确顺序</strong>依次点选汉字，拼出目标诗句。</p>
        <p>点错的字可以再点一次取消，也可用「撤销」或「重选」调整。</p>
      </>
    ),
    emoji: '格',
  },
  {
    title: '三种寻诗之法',
    body: (
      <>
        <p><strong>初级 · 诗句寻字</strong>：直接告诉你诗名与线索，照序选字即可。</p>
        <p><strong>中级 · 诗题寻踪</strong>：先从四个诗题中判断诗句出处，再选字成句。</p>
        <p><strong>高级 · 诗词探秘</strong>：诗名隐去，只留线索，考验真正的诗词功底。</p>
      </>
    ),
    emoji: '法',
  },
  {
    title: '旅途与成长',
    body: (
      <>
        <p>五段旅程、二十个关卡，答对得分、连胜有加成，星级记录你的表现。</p>
        <p>遇到困难可用「提示」点亮下一个字（会少量扣分）。进度自动保存，随时再来。</p>
      </>
    ),
    emoji: '旅',
  },
]

export default function GuideModal({ onClose }: { onClose: (seen: boolean) => void }) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  return (
    <div className="modal-mask guide-mask">
      <div className="guide-card">
        <div className="guide-emblem">{s.emoji}</div>
        <h2 className="guide-title">{s.title}</h2>
        <div className="guide-body">{s.body}</div>
        <div className="guide-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'dot on' : 'dot'} />
          ))}
        </div>
        <div className="guide-actions">
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              上一步
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn primary" onClick={() => setStep(step + 1)}>
              下一步
            </button>
          ) : (
            <button className="btn primary" onClick={() => onClose(true)}>
              开始寻踪
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
