import { forwardRef } from 'react'

type Props = {
  text: string
  fontSize: number
  mirrored: boolean
  paused: boolean
  onTogglePause: () => void
}

export const Teleprompter = forwardRef<HTMLDivElement, Props>(
  function Teleprompter(
    { text, fontSize, mirrored, paused, onTogglePause },
    ref,
  ) {
    const lines = text.trim() ? text : 'Toque em Roteiro para colar o texto.'

    return (
      <div
        ref={ref}
        className={`teleprompter ${mirrored ? 'is-mirrored' : ''} ${paused ? 'is-paused' : ''}`}
        aria-live="polite"
        onClick={onTogglePause}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onTogglePause()
          }
        }}
        aria-label={paused ? 'Retomar texto' : 'Pausar texto'}
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
        {paused && (
          <div className="pause-hint" aria-hidden>
            Pausado · toque para continuar
          </div>
        )}
      </div>
    )
  },
)
