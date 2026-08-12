const CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
] as const

export type RecordingFormat = {
  mimeType: string
  extension: 'mp4' | 'webm'
}

export function pickRecordingFormat(): RecordingFormat {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: '', extension: 'webm' }
  }

  for (const mimeType of CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return {
        mimeType,
        extension: mimeType.includes('mp4') ? 'mp4' : 'webm',
      }
    }
  }

  return { mimeType: '', extension: 'webm' }
}
