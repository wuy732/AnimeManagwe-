import { useState } from 'react'
import { updateSettings } from '../api'

export default function SetupWizard({ hasPath, onPathSet, onScan, scanning, error }) {
  const [path, setPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!path.trim()) return

    setSaving(true)
    setLocalError('')
    try {
      await updateSettings(path.trim())
      onPathSet(path.trim())
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎬</div>
          <h1 className="text-3xl font-bold text-white mb-2">Anime Manager</h1>
          <p className="text-slate-400">
            {hasPath
              ? '路径有效但尚未扫描，请点击扫描按钮'
              : '请设置你的动漫资源文件夹路径'}
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
            {displayError && (
              <p className="mt-4 text-red-400 text-sm">{displayError}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                动漫资源路径
              </label>
              <input
                type="text"
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="例如: P:\Anime"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-500 focus:outline-none focus:border-violet-500
                           transition-colors"
                autoFocus
              />
            </div>
            {displayError && (
              <p className="text-red-400 text-sm">{displayError}</p>
            )}
            <button
              type="submit"
              disabled={saving || !path.trim()}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50
                         text-white font-medium rounded-lg transition-colors"
            >
              {saving ? '验证中...' : '确认路径并扫描'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
