type Props = {
  speed: number
  fontSize: number
  mirrored: boolean
  isScrolling: boolean
  isRecording: boolean
  cameraReady: boolean
  countdown: number | null
  onSpeedChange: (value: number) => void
  onFontSizeChange: (value: number) => void
  onToggleMirror: () => void
  onEditScript: () => void
  onToggleScroll: () => void
  onEnableCamera: () => void
  onRecordToggle: () => void
}

export function RecordControls({
  speed,
  fontSize,
  mirrored,
  isScrolling,
  isRecording,
  cameraReady,
  countdown,
  onSpeedChange,
  onFontSizeChange,
  onToggleMirror,
  onEditScript,
  onToggleScroll,
  onEnableCamera,
  onRecordToggle,
}: Props) {
  const busy = countdown != null

  return (
    <footer className="controls">
      <div className="controls-row sliders">
        <label className="control-field">
          <span>Velocidade</span>
          <input
            type="range"
            min={20}
            max={160}
            step={5}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            disabled={busy}
          />
        </label>
        <label className="control-field">
          <span>Fonte</span>
          <input
            type="range"
            min={28}
            max={72}
            step={2}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            disabled={busy}
          />
        </label>
      </div>

      <div className="controls-row actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onEditScript}
          disabled={busy || isRecording}
        >
          Roteiro
        </button>
        <button
          type="button"
          className={`btn btn-ghost ${mirrored ? 'is-active' : ''}`}
          onClick={onToggleMirror}
          disabled={busy}
          aria-pressed={mirrored}
        >
          Espelhar
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onToggleScroll}
          disabled={busy || isRecording}
        >
          {isScrolling ? 'Pausar' : 'Rolar'}
        </button>
        {!cameraReady ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEnableCamera}
            disabled={busy}
          >
            Câmera
          </button>
        ) : (
          <button
            type="button"
            className={`btn ${isRecording ? 'btn-stop' : 'btn-record'}`}
            onClick={onRecordToggle}
            disabled={busy}
          >
            {isRecording ? 'Parar' : 'Gravar'}
          </button>
        )}
      </div>
    </footer>
  )
}
