import { useEffect, useRef } from 'react'

type Props = {
  stream: MediaStream | null
}

export function CameraPreview({ stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    if (stream) {
      void video.play().catch(() => {
        /* autoplay policies */
      })
    }
  }, [stream])

  if (!stream) return null

  return (
    <div className="camera-pip">
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
        autoPlay
      />
    </div>
  )
}
