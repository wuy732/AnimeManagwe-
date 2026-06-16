import { useState, useEffect } from 'react'
import { updateSettings, getServerInfo } from '../api'

export default function SetupWizard({ hasPath, publicMode, onPathSet, onSettingsUpdate, onScan, scanning, error }) {
  const [path, setPath] = useState('')
  const [proxy, setProxy] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')
  const [lanIPs, setLanIPs] = useState([])
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    getServerInfo().then(info => setLanIPs(info.ips || [])).catch(() => {})
  }, [])

  const saveSettings = async (fields) => {
    setSaving(true)
    setLocalError('')
    try {
      const data = await updateSettings(fields)
      if (onSettingsUpdate) onSettingsUpdate(data)
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!path.trim()) return
    await saveSettings({ anime_path: path.trim() })
    onPathSet(path.trim())
  }

  const handleProxySave = () => {
    saveSettings({ proxy: proxy.trim() })
  }

  const handlePublicModeToggle = () => {
    const next = !publicMode
    saveSettings({ public_mode: next })
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
          <div className="text-center space-y-6">
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

            {/* Settings panel */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {showSettings ? '收起设置 ▲' : '局域网与代理设置 ▼'}
              </button>
              {showSettings && (
                <div className="mt-4 space-y-4 max-w-xs mx-auto text-left">
                  {/* Proxy */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">HTTP 代理 (用于 Bangumi 刮削)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={proxy}
                        onChange={e => setProxy(e.target.value)}
                        placeholder="例如: http://127.0.0.1:7890"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md
                                   text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        onClick={handleProxySave}
                        disabled={saving}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sm text-slate-200
                                   rounded-md transition-colors disabled:opacity-50"
                      >保存</button>
                    </div>
                  </div>

                  {/* Public mode toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300">局域网访问控制</p>
                      <p className="text-xs text-slate-500">开启后，LAN 用户仅看到"公开"动漫</p>
                    </div>
                    <button
                      onClick={handlePublicModeToggle}
                      disabled={saving}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                        publicMode ? 'bg-violet-600' : 'bg-slate-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        publicMode ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                HTTP 代理 (可选，用于刮削)
              </label>
              <input
                type="text"
                value={proxy}
                onChange={e => setProxy(e.target.value)}
                placeholder="例如: http://127.0.0.1:7890"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-500 focus:outline-none focus:border-violet-500
                           transition-colors text-sm"
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

        {lanIPs.length > 0 && (
          <p className="mt-6 text-center text-xs text-slate-500">
            局域网设备可访问: {lanIPs.map(ip => `http://${ip}:3001`).join(' 或 ')}
          </p>
        )}
      </div>
    </div>
  )
}
