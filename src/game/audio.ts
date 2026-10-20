/** 轻量音效：WebAudio 程序化生成，无需任何音频资源文件 */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean): void {
  muted = m
}

function ensureCtx(): AudioContext | null {
  if (muted) return null
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', gain = 0.05, delay = 0): void {
  const ac = ensureCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = ac.currentTime + delay
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  select: () => tone(660, 0.08, 'sine', 0.045),
  deselect: () => tone(440, 0.08, 'sine', 0.035),
  correct: () => {
    tone(523.25, 0.14, 'sine', 0.05, 0)
    tone(659.25, 0.14, 'sine', 0.05, 0.1)
    tone(783.99, 0.22, 'sine', 0.055, 0.2)
    tone(1046.5, 0.3, 'sine', 0.05, 0.32)
  },
  wrong: () => {
    tone(233, 0.16, 'square', 0.025, 0)
    tone(196, 0.2, 'square', 0.025, 0.12)
  },
  hint: () => {
    tone(880, 0.1, 'triangle', 0.04, 0)
    tone(1174.7, 0.12, 'triangle', 0.04, 0.09)
  },
  achieve: () => {
    tone(783.99, 0.12, 'triangle', 0.05, 0)
    tone(987.77, 0.12, 'triangle', 0.05, 0.1)
    tone(1318.5, 0.25, 'triangle', 0.05, 0.2)
  },
}
