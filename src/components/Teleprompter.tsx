import { forwardRef } from 'react'

type Props = {
  text: string
  fontSize: number
  mirrored: boolean
}

export const Teleprompter = forwardRef<HTMLDivElement, Props>(
  function Teleprompter({ text, fontSize, mirrored }, ref) {
    const lines = text.trim() ? text : 'Toque em Roteiro para colar o texto.'

    return (
      <div
        ref={ref}
        className={`teleprompter ${mirrored ? 'is-mirrored' : ''}`}
        aria-live="polite"
      >
        <div
          className="teleprompter-inner"
          style={{ fontSize: `${fontSize}px` }}
        >
          <div className="teleprompter-spacer" aria-hidden />
          <p className="teleprompter-text">{lines}</p>
          <div className="teleprompter-spacer" aria-hidden />
        </div>
        <div className="reading-line" aria-hidden />
      </div>
    )
  },
)
