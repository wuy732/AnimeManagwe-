import { useState, useEffect } from 'react'
import { updateSettings, detectPlayer } from '../api'

export default function SetupWizard({ hasPath, onScan, scanning, error }) {
  const [animePath, setAnimePath] = useState('')
  const [playerPath, setPlayerPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')
  const [playerStatus, setPlayerStatus] = useState(null) // null=checking, {found, name}, false

  useEffect(() => {
    detectPlayer().then(r => setPlayerStatus(r.found ? r : false)).catch(() => setPlayerStatus(false))
  }, [])

  const handleDetect = async () => {
    setPlayerStatus(null)
    try {
      const r = await detectPlayer()
      setPlayerStatus(r.found ? r : false)
    } catch {
      setPlayerStatus(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!animePath.trim()) return

    setSaving(true)
    setLocalError('')
    try {
      await updateSettings({ anime_path: animePath.trim(), player_path: playerPath.trim() })
      onScan()
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 select-none">🎬</div>
          <h1 className="text-3xl font-bold text-white mb-2">Anime Manager</h1>
          <p className="text-slate-400 text-sm">
            {hasPath ? '点击扫描开始' : '首次使用，请配置路径'}
          </p>
        </div>

        {hasPath ? (
          <div className="text-center">
            <button
              onClick={onScan}
              disabled={scanning}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50
                       text-white font-medium rounded-lg transition-colors"
            >
              {scanning ? '扫描中...' : '开始扫描'}
            </button>
            {displayError && <p className="mt-4 text-red-400 text-sm">{displayError}</p>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Anime path */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">动漫资源路径</label>
              <input
                type="text"
                value={animePath}
                onChange={e => setAnimePath(e.target.value)}
                placeholder="例如: P:\Anime"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                         text-white placeholder-slate-500 focus:outline-none focus:border-violet-500
                         transition-colors text-sm"
                autoFocus
              />
            </div>

            {/* Player path */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                本地播放器路径（可留空自动检测）
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playerPath}
                  onChange={e => { setPlayerPath(e.target.value); setPlayerStatus(null) }}
                  placeholder="自动检测 VLC / PotPlayer / MPC / mpv"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-500 focus:outline-none focus:border-violet-500
                           transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={handleDetect}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200
                           rounded-lg transition-colors whitespace-nowrap"
                >
                  自动检测
                </button>
              </div>
              {playerStatus === null && (
                <p className="text-xs text-slate-500 mt-1">检测中...</p>
              )}
              {playerStatus === false && (
                <p className="text-xs text-amber-400 mt-1">未检测到播放器，请手动指定路径</p>
              )}
              {playerStatus?.found && (
                <p className="text-xs text-emerald-400 mt-1">
                  已检测到: {playerStatus.name} ({playerStatus.path})
                </p>
              )}
            </div>

            {displayError && <p className="text-red-400 text-sm">{displayError}</p>}
            <button
              type="submit"
              disabled={saving || !animePath.trim()}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50
                       text-white font-medium rounded-lg transition-colors"
            >
              {saving ? '验证中...' : '确认并扫描'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
