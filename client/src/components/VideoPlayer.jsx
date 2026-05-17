import { useState, useEffect, useRef, useCallback } from 'react'
import { streamUrl, updateAnime } from '../api'

export default function VideoPlayer({ anime, episode, onClose }) {
  const [showResume, setShowResume] = useState(episode.progress > 0 && !episode.watched)
  const [saving, setSaving] = useState(false)
  const videoRef = useRef(null)
  const lastSavedRef = useRef(episode.progress || 0)

  const saveProgress = useCallback(async (currentTime, watched = false) => {
    const rounded = Math.floor(currentTime)
    if (rounded <= lastSavedRef.current && !watched) return

    lastSavedRef.current = rounded
    setSaving(true)
    try {
      await updateAnime(anime.id, {
        episodes: [{
          filename: episode.filename,
          progress: rounded,
          watched: watched || (rounded > 0 && videoRef.current?.duration && rounded >= videoRef.current.duration * 0.95)
        }]
      })
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }, [anime.id, episode.filename])

  // Save progress on pause / ended
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPause = () => {
      if (video.currentTime > 0 && !video.ended) {
        saveProgress(video.currentTime)
      }
    }
    const onEnded = () => {
      saveProgress(video.duration, true)
    }

    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [saveProgress])

  const handleClose = useCallback(() => {
    const video = videoRef.current
    const currentTime = video?.currentTime || 0
    const ended = video?.ended || false
    if (currentTime > 0 && !ended) {
      saveProgress(currentTime)
    }
    onClose({
      filename: episode.filename,
      progress: currentTime || lastSavedRef.current,
      watched: ended
    })
  }, [onClose, episode.filename, saveProgress])

  // Esc key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  const handleResume = () => {
    setShowResume(false)
    const video = videoRef.current
    if (video && episode.progress > 0) {
      video.currentTime = episode.progress
    }
    video?.play()
  }

  const handleStartOver = () => {
    setShowResume(false)
    videoRef.current?.play()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
         onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10
                   hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Info bar */}
      <div className="absolute top-4 left-4 z-10">
        <p className="text-white/80 text-sm font-medium">
          {anime.name_cn || anime.name}
        </p>
        <p className="text-white/40 text-xs mt-0.5 truncate max-w-md">
          {episode.filename}
        </p>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="absolute bottom-6 right-6 z-10 px-3 py-1.5 bg-black/60 rounded-lg
                      text-xs text-slate-400">
          已保存进度
        </div>
      )}

      {/* Resume prompt */}
      {showResume && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-bold text-white mb-2">继续播放？</h3>
            <p className="text-sm text-slate-400 mb-6">
              上次观看到 {formatTime(episode.progress)}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleResume}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium
                         rounded-lg transition-colors"
              >
                继续播放
              </button>
              <button
                onClick={handleStartOver}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200
                         rounded-lg transition-colors"
              >
                从头开始
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={streamUrl(episode.path)}
        className="max-w-full max-h-full object-contain"
        controls
        autoPlay={!showResume}
        playsInline
      />
    </div>
  )
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
