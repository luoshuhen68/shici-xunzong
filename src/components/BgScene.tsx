/** 远景：星空、明月、流云、山影。纯装饰，不响应交互。 */
export default function BgScene() {
  return (
    <div className="bg-scene" aria-hidden>
      <div className="stars" />
      <div className="moon" />
      <svg className="cloud c1" viewBox="0 0 220 70" fill="none">
        <path
          d="M18 52 C6 52 4 40 12 34 C8 22 24 14 34 20 C38 6 60 2 70 12 C80 2 100 6 102 18 C116 10 132 20 126 32 C140 30 146 46 134 52 Z"
          fill="currentColor"
        />
      </svg>
      <svg className="cloud c2" viewBox="0 0 220 70" fill="none">
        <path
          d="M18 52 C6 52 4 40 12 34 C8 22 24 14 34 20 C38 6 60 2 70 12 C80 2 100 6 102 18 C116 10 132 20 126 32 C140 30 146 46 134 52 Z"
          fill="currentColor"
        />
      </svg>
      <svg className="mountains" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
        <path
          d="M0 260 L180 150 L320 240 L470 120 L620 250 L780 170 L940 260 L1100 140 L1260 240 L1440 180 L1440 320 L0 320 Z"
          fill="rgba(20,28,52,0.9)"
        />
        <path
          d="M0 300 L240 220 L420 290 L640 210 L860 300 L1080 230 L1300 295 L1440 260 L1440 320 L0 320 Z"
          fill="rgba(12,18,36,0.95)"
        />
      </svg>
    </div>
  )
}
