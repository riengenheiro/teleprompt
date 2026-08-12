import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraPreview } from './components/CameraPreview'
import { RecordControls } from './components/RecordControls'
import { ScriptEditor } from './components/ScriptEditor'
import { Teleprompter } from './components/Teleprompter'
import { useFullscreen } from './hooks/useFullscreen'
import { useMediaRecorder } from './hooks/useMediaRecorder'
import { useTeleprompterScroll } from './hooks/useTeleprompterScroll'
import { useWakeLock } from './hooks/useWakeLock'
import { downloadBlob, timestampedFilename } from './lib/download'
import { loadPrefs, savePrefs } from './lib/storage'
import './styles.css'

const DEFAULT_SCRIPT = `Bem-vindo ao Teleprompter.

Cole o seu roteiro, ative a câmera e toque em Gravar.

O texto sobe sozinho enquanto o vídeo é gravado no celular ou no computador.

Quando terminar, o arquivo baixa automaticamente.

Toque na tela para pausar ou retomar o texto.`

const saved = loadPrefs()

function initialScript() {
  return typeof saved?.script === 'string' ? saved.script : DEFAULT_SCRIPT
}

function initialSpeed() {
  const n = saved?.speed
  return typeof n === 'number' && n >= 20 && n <= 160 ? n : 55
}

function initialFontSize() {
  const n = saved?.fontSize
  return typeof n === 'number' && n >= 28 && n <= 72 ? n : 42
}

export default function App() {
  const [script, setScript] = useState(initialScript)
  const [editing, setEditing] = useState(false)
  const [speed, setSpeed] = useState(initialSpeed)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [mirrored, setMirrored] = useState(Boolean(saved?.mirrored))
  const [scrolling, setScrolling] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [immersive, setImmersive] = useState(false)

  const appRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const countdownTimer = useRef<number | null>(null)

  const recorder = useMediaRecorder()
  const fullscreen = useFullscreen()
  const isRecording = recorder.status === 'recording'
  const keepAwake =
    isRecording || scrolling || countdown != null || sessionActive || immersive

  useWakeLock(keepAwake)

  const { finished, reset, rewind } = useTeleprompterScroll({
    speedPxPerSec: speed,
    enabled: scrolling,
    containerRef,
  })

  useEffect(() => {
    savePrefs({ script, speed, fontSize, mirrored })
  }, [script, speed, fontSize, mirrored])

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

  const leaveImmersive = useCallback(async () => {
    setImmersive(false)
    await fullscreen.exit()
  }, [fullscreen])

  const beginRecording = useCallback(() => {
    reset()
    setSessionActive(true)
    setScrolling(true)
    const ok = recorder.startRecording()
    if (!ok) {
      setScrolling(false)
      setSessionActive(false)
      void leaveImmersive()
      showToast(recorder.error ?? 'Não foi possível gravar')
    }
  }, [leaveImmersive, recorder, reset, showToast])

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
    await leaveImmersive()
    if (blob && blob.size > 0) {
      downloadBlob(blob, timestampedFilename(recorder.format.extension))
      showToast('Vídeo baixado')
    } else {
      showToast('Gravação vazia — tente de novo')
    }
  }, [clearCountdown, leaveImmersive, recorder, showToast])

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

  const enableCameraImmersive = useCallback(async () => {
    const ok = await recorder.enableCamera()
    if (!ok) {
      showToast('Permissão de câmera/microfone negada')
      return
    }
    setImmersive(true)
    await fullscreen.enter(appRef.current)
  }, [fullscreen, recorder, showToast])

  const paused = sessionActive && !scrolling && countdown == null

  return (
    <div
      ref={appRef}
      className={`app ${immersive ? 'is-immersive' : ''}`}
    >
      {isRecording && <span className="rec-badge">REC</span>}

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
          void enableCameraImmersive()
        }}
        onRecordToggle={onRecordToggle}
      />

      {editing && (
        <ScriptEditor
          value={script}
          onChange={setScript}
          onClose={() => {
            savePrefs({ script, speed, fontSize, mirrored })
            setEditing(false)
            showToast('Roteiro salvo neste aparelho')
          }}
        />
      )}
    </div>
  )
}
