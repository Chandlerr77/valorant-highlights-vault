export function extractFrame(file: File, atSeconds = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.crossOrigin = 'anonymous'
    video.muted = true

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(atSeconds, video.duration / 2)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('截图失败'))
        URL.revokeObjectURL(video.src)
      }, 'image/jpeg', 0.9)
    }

    video.onerror = () => reject(new Error('视频加载失败'))
  })
}
