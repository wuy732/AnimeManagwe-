import { useState } from 'react'
import { updateAnime } from '../api'

function getCoverUrl(cover) {
  if (!cover) return null
  return `/api/cover?path=${encodeURIComponent(cover)}`
}

function TagEditor({ tags, onTagsChange }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const tag = input.trim()
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag])
    }
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-600/20
                                     text-violet-300 text-xs rounded-md">
            {tag}
            <button
              onClick={() => onTagsChange(tags.filter(t => t !== tag))}
              className="hover:text-white transition-colors"
            >&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="添加标签..."
          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md
                     text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={addTag}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-sm text-slate-200
                     rounded-md transition-colors"
        >添加</button>
      </div>
    </div>
  )
}

export default function AnimeDetail({ anime, onBack, onUpdate }) {
  const [tags, setTags] = useState(anime.tags || [])
  const [episodes, setEpisodes] = useState(anime.episodes || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const coverUrl = getCoverUrl(anime.cover)

  const save = async (newEpisodes, newTags) => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateAnime(anime.id, {
        episodes: newEpisodes || episodes,
        tags: newTags || tags
      })
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

  const handleTagsChange = (newTags) => {
    setTags(newTags)
    save(null, newTags)
  }

  const watched = episodes.filter(e => e.watched).length
  const total = episodes.length

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
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

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex gap-6 mb-8">
          <div className="w-40 h-56 flex-shrink-0 rounded-xl overflow-hidden bg-slate-800">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={anime.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700
                            flex items-center justify-center">
                <span className="text-4xl font-bold text-white/80">{anime.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{anime.name}</h1>
            <p className="text-sm text-slate-500 mt-1 truncate" title={anime.path}>{anime.path}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="text-sm">
                <span className="text-violet-400 font-medium">{watched}</span>
                <span className="text-slate-500">/{total} 集已看</span>
              </div>
              <div className="flex-1 max-w-xs h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${total > 0 ? (watched / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-1">标签</p>
              <TagEditor tags={tags} onTagsChange={handleTagsChange} />
            </div>
            {saving && (
              <span className="inline-block mt-2 text-xs text-slate-500">保存中...</span>
            )}
          </div>
        </div>

        {/* Episodes */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">剧集列表</h2>
          <div className="space-y-1">
            {episodes.map((ep, idx) => (
              <div
                key={ep.filename}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                          ${ep.watched ? 'bg-slate-800/50' : 'bg-slate-800 hover:bg-slate-700/50'}`}
              >
                <span className="text-xs text-slate-500 w-8 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${ep.watched ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {ep.filename}
                  </p>
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
