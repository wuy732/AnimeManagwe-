import { useState } from 'react'
import { updateAnime, playEpisode, coverUrl } from '../api'

function TagEditor({ tags, onTagsChange }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const tag = input.trim()
    if (tag && !tags.includes(tag)) onTagsChange([...tags, tag])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-600/20
                                     text-violet-300 text-xs rounded-md">
            {tag}
            <button onClick={() => onTagsChange(tags.filter(t => t !== tag))}
                    className="hover:text-white transition-colors">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="添加标签..."
          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md
                   text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
        <button onClick={addTag}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-sm text-slate-200
                         rounded-md transition-colors">添加</button>
      </div>
    </div>
  )
}

export default function AnimeDetail({ anime, onBack, onUpdate }) {
  const [tags, setTags] = useState(anime.tags || [])
  const [episodes, setEpisodes] = useState(anime.episodes || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [playMsg, setPlayMsg] = useState('')
  const [coverPath, setCoverPath] = useState(anime.cover || '')
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [coverInput, setCoverInput] = useState('')
  const localCover = coverUrl(coverPath)

  const save = async (newEpisodes, newTags, newCover) => {
    setSaving(true)
    setError('')
    try {
      const payload = {}
      if (newEpisodes) payload.episodes = newEpisodes
      if (newTags) payload.tags = newTags
      if (newCover !== undefined) payload.cover = newCover
      const updated = await updateAnime(anime.id, payload)
      onUpdate(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleWatched = (idx) => {
    const next = episodes.map((ep, i) =>
      i === idx ? { ...ep, watched: !ep.watched, progress: ep.watched ? 0 : 100 } : ep
    )
    setEpisodes(next)
    save(next, null)
  }

  const handleCoverChange = async () => {
    // Try Electron native dialog first
    if (window.electronAPI) {
      const filePath = await window.electronAPI.openCoverDialog()
      if (filePath) {
        setCoverPath(filePath)
        save(null, null, filePath)
      }
      return
    }
    // Fallback: show manual input
    setShowCoverInput(!showCoverInput)
  }

  const handleCoverInputConfirm = () => {
    const p = coverInput.trim()
    if (p) {
      setCoverPath(p)
      setCoverInput('')
      setShowCoverInput(false)
      save(null, null, p)
    }
  }

  const handlePlay = async (ep) => {
    setPlayMsg('')
    try {
      const result = await playEpisode(ep.path)
      setPlayMsg(`已在 ${result.player} 中打开`)
      setTimeout(() => setPlayMsg(''), 3000)
    } catch (e) {
      setPlayMsg(e.message)
      setTimeout(() => setPlayMsg(''), 5000)
    }
  }

  const watched = episodes.filter(e => e.watched).length
  const total = episodes.length

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-12">
        {/* Back */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white
                     transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回列表
        </button>

        {/* Play feedback */}
        {playMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            playMsg.includes('已在') ? 'bg-emerald-900/30 border border-emerald-800 text-emerald-400'
                                     : 'bg-red-900/30 border border-red-800 text-red-400'
          }`}>
            {playMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-44 flex-shrink-0">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 shadow-xl relative group/cover">
              {localCover ? (
                <img src={localCover} alt={anime.name}
                     className="w-full h-full object-cover"
                     onError={(e) => { e.target.style.display = 'none' }} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700
                              flex items-center justify-center">
                  <span className="text-5xl font-black text-white/70">{anime.name.charAt(0)}</span>
                </div>
              )}
              {/* Cover change overlay */}
              <button
                onClick={handleCoverChange}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100
                         transition-opacity flex items-center justify-center text-white text-xs font-medium"
              >
                更换封面
              </button>
            </div>
            {/* Manual path input (non-Electron fallback) */}
            {showCoverInput && (
              <div className="mt-2 flex gap-1">
                <input
                  type="text"
                  value={coverInput}
                  onChange={e => setCoverInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCoverInputConfirm()}
                  placeholder="图片绝对路径..."
                  className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs
                           text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleCoverInputConfirm}
                  className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-xs text-white rounded
                           transition-colors"
                >确定</button>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white">{anime.name}</h1>
            <p className="text-xs text-slate-600 mt-1 truncate" title={anime.path}>{anime.path}</p>

            <div className="flex items-center gap-4 mt-3">
              <div className="text-sm">
                <span className="text-violet-400 font-medium">{watched}</span>
                <span className="text-slate-500">/{total} 集已看</span>
              </div>
              <div className="flex-1 max-w-40 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all"
                     style={{ width: `${total > 0 ? (watched / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Notes from local txt */}
            {anime.notes && (
              <details className="mt-3 group">
                <summary className="text-xs text-amber-400/80 cursor-pointer hover:text-amber-300 transition-colors select-none">
                  本地说明文件
                </summary>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg p-3
                            border border-slate-700/50 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {anime.notes}
                </p>
              </details>
            )}

            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-1">标签（手动添加）</p>
              <TagEditor tags={tags} onTagsChange={(t) => { setTags(t); save(null, t) }} />
            </div>
            {saving && <span className="inline-block mt-2 text-xs text-slate-500">保存中...</span>}
          </div>
        </div>

        {/* Episodes */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">剧集列表</h2>
          <div className="space-y-1">
            {episodes.map((ep, idx) => (
              <div
                key={ep.filename}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                          ${ep.watched ? 'bg-slate-800/30 hover:bg-slate-800/50'
                                       : 'bg-slate-800 hover:bg-slate-700/60'}`}
              >
                <span className="text-xs text-slate-500 w-8 text-right flex-shrink-0 tabular-nums">
                  {idx + 1}
                </span>

                {/* Launch local player */}
                <button
                  onClick={() => handlePlay(ep)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 hover:bg-emerald-600
                           flex items-center justify-center transition-colors group/play"
                  title="本地播放器打开"
                >
                  <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>

                <div className="flex-1 min-w-0" onClick={() => handlePlay(ep)}
                     title="点击使用本地播放器打开">
                  <p className={`text-sm truncate cursor-pointer hover:text-violet-300 transition-colors
                              ${ep.watched ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {ep.filename}
                  </p>
                  <span className="text-[10px] text-slate-600">点击使用本地播放器</span>
                </div>

                <button
                  onClick={() => toggleWatched(idx)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                            transition-colors ${
                              ep.watched
                                ? 'bg-violet-500 border-violet-500 text-white'
                                : 'border-slate-600 hover:border-violet-500 text-transparent hover:text-violet-500'
                            }`}
                >
                  {ep.watched && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
