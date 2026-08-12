import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraPreview } from './components/CameraPreview'
import { RecordControls } from './components/RecordControls'
import { ScriptEditor } from './components/ScriptEditor'
import { Teleprompter } from './components/Teleprompter'
import { useMediaRecorder } from './hooks/useMediaRecorder'
import { useTeleprompterScroll } from './hooks/useTeleprompterScroll'
import { useWakeLock } from './hooks/useWakeLock'
import { downloadBlob, timestampedFilename } from './lib/download'
import './styles.css'

const DEFAULT_SCRIPT = `Bem-vindo ao Teleprompter.

Cole o seu roteiro, ative a câmera e toque em Gravar.

O texto sobe sozinho enquanto o vídeo é gravado no celular ou no computador.

Quando terminar, o arquivo baixa automaticamente.

Toque na tela para pausar ou retomar o texto.`

export default function App() {
  const [script, setScript] = useState(DEFAULT_SCRIPT)
  const [editing, setEditing] = useState(false)
  const [speed, setSpeed] = useState(55)
  const [fontSize, setFontSize] = useState(42)
  const [mirrored, setMirrored] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const countdownTimer = useRef<number | null>(null)

  const recorder = useMediaRecorder()
  const isRecording = recorder.status === 'recording'
  const keepAwake =
    isRecording || scrolling || countdown != null || sessionActive

  useWakeLock(keepAwake)

  const { finished, reset, rewind } = useTeleprompterScroll({
    speedPxPerSec: speed,
    enabled: scrolling,
    containerRef,
  })

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const clearCountdown = useCallback(() => {
    if (countdownTimer.current != null) {
      window.clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
    setCountdown(null)
  }, [])

  const beginRecording = useCallback(() => {
    reset()
    setSessionActive(true)
    setScrolling(true)
    const ok = recorder.startRecording()
    if (!ok) {
      setScrolling(false)
      setSessionActive(false)
      showToast(recorder.error ?? 'Não foi possível gravar')
    }
  }, [recorder, reset, showToast])

  const startCountdownThenRecord = useCallback(() => {
    if (!recorder.stream) {
      showToast('Ative a câmera primeiro')
      return
    }
    clearCountdown()
    setScrolling(false)
    reset()
    setCountdown(3)

    let remaining = 3
    countdownTimer.current = window.setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearCountdown()
        beginRecording()
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }, [beginRecording, clearCountdown, recorder.stream, reset, showToast])

  const handleStop = useCallback(async () => {
    clearCountdown()
    setScrolling(false)
    setSessionActive(false)
    const blob = await recorder.stopRecording()
    if (blob && blob.size > 0) {
      downloadBlob(blob, timestampedFilename(recorder.format.extension))
      showToast('Vídeo baixado')
    } else {
      showToast('Gravação vazia — tente de novo')
    }
  }, [clearCountdown, recorder, showToast])

  useEffect(() => {
    if (finished && isRecording) {
      void handleStop()
    } else if (finished && !isRecording) {
      setScrolling(false)
      setSessionActive(false)
    }
  }, [finished, isRecording, handleStop])

  useEffect(() => {
    return () => clearCountdown()
  }, [clearCountdown])

  const onRecordToggle = () => {
    if (isRecording) {
      void handleStop()
      return
    }
    startCountdownThenRecord()
  }

  const toggleScroll = useCallback(() => {
    if (countdown != null || editing) return
    setScrolling((prev) => {
      const next = !prev
      if (next) setSessionActive(true)
      return next
    })
  }, [countdown, editing])

  const paused = sessionActive && !scrolling && countdown == null

  return (
    <div className="app">
      <header className="brand-bar">
        <p className="brand">Teleprompter</p>
        {isRecording && <span className="rec-badge">REC</span>}
      </header>

      <Teleprompter
        ref={containerRef}
        text={script}
        fontSize={fontSize}
        mirrored={mirrored}
        paused={paused}
        onTogglePause={toggleScroll}
      />

      <CameraPreview stream={recorder.stream} />

      {countdown != null && (
        <div className="countdown" aria-live="assertive">
          <span>{countdown}</span>
        </div>
      )}

      {recorder.error && (
        <p className="error-banner" role="alert">
          {recorder.error}
        </p>
      )}

      {toast && <p className="toast">{toast}</p>}

      <RecordControls
        speed={speed}
        fontSize={fontSize}
        mirrored={mirrored}
        isScrolling={scrolling}
        isRecording={isRecording}
        cameraReady={recorder.status === 'ready' || isRecording}
        countdown={countdown}
        onSpeedChange={setSpeed}
        onFontSizeChange={setFontSize}
        onToggleMirror={() => setMirrored((v) => !v)}
        onEditScript={() => setEditing(true)}
        onToggleScroll={toggleScroll}
        onRewind={() => rewind()}
        onEnableCamera={() => {
          void recorder.enableCamera().then((ok) => {
            if (!ok) showToast('Permissão de câmera/microfone negada')
          })
        }}
        onRecordToggle={onRecordToggle}
      />

      {editing && (
        <ScriptEditor
          value={script}
          onChange={setScript}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
