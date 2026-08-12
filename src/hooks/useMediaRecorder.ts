import { useCallback, useEffect, useRef, useState } from 'react'
import { pickRecordingFormat, type RecordingFormat } from '../lib/mime'

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'recording'
  | 'error'

type RecorderState = {
  status: RecorderStatus
  error: string | null
  stream: MediaStream | null
  format: RecordingFormat
  blob: Blob | null
}

const initial: RecorderState = {
  status: 'idle',
  error: null,
  stream: null,
  format: { mimeType: '', extension: 'webm' },
  blob: null,
}

export function useMediaRecorder() {
  const [state, setState] = useState<RecorderState>(initial)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const enableCamera = useCallback(async () => {
    setState((s) => ({ ...s, status: 'requesting', error: null, blob: null }))

    try {
      stopTracks()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      const format = pickRecordingFormat()
      setState({
        status: 'ready',
        error: null,
        stream,
        format,
        blob: null,
      })
      return true
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível acessar câmera/microfone'
      setState({
        ...initial,
        status: 'error',
        error: message,
      })
      return false
    }
  }, [stopTracks])

  const startRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'Câmera não está pronta',
      }))
      return false
    }

    if (typeof MediaRecorder === 'undefined') {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'MediaRecorder não suportado neste navegador',
      }))
      return false
    }

    const format = pickRecordingFormat()
    chunksRef.current = []

    try {
      const recorder = format.mimeType
        ? new MediaRecorder(stream, { mimeType: format.mimeType })
        : new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onerror = () => {
        setState((s) => ({
          ...s,
          status: 'error',
          error: 'Erro durante a gravação',
        }))
      }

      recorder.start(250)
      recorderRef.current = recorder
      setState((s) => ({
        ...s,
        status: 'recording',
        format,
        blob: null,
        error: null,
      }))
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao iniciar gravação'
      setState((s) => ({ ...s, status: 'error', error: message }))
      return false
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        setState((s) => ({
          ...s,
          status: streamRef.current ? 'ready' : 'idle',
        }))
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const mime =
          recorder.mimeType ||
          pickRecordingFormat().mimeType ||
          'video/webm'
        const blob = new Blob(chunksRef.current, { type: mime })
        chunksRef.current = []
        recorderRef.current = null
        setState((s) => ({
          ...s,
          status: 'ready',
          blob,
        }))
        resolve(blob)
      }

      recorder.stop()
    })
  }, [])

  const release = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    chunksRef.current = []
    stopTracks()
    setState(initial)
  }, [stopTracks])

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop()
      }
      stopTracks()
    }
  }, [stopTracks])

  return {
    ...state,
    enableCamera,
    startRecording,
    stopRecording,
    release,
  }
}
