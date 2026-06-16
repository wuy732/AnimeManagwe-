import { useState } from 'react'
import { updateAnime, coverUrl } from '../api'

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
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

export default function AnimeDetail({ anime, onBack, onUpdate, onPlay, onScrape, scraping }) {
  const [tags, setTags] = useState(anime.tags || [])
  const [episodes, setEpisodes] = useState(anime.episodes || [])
  const [isPublic, setIsPublic] = useState(anime.public !== false)
  const [saving, setSaving] = useState(false)
  const [scrapingSelf, setScrapingSelf] = useState(false)
  const [error, setError] = useState('')
  const localCover = coverUrl(anime.cover)
  const posterUrl = anime.poster || localCover

  const save = async (newEpisodes, newTags, extra = {}) => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateAnime(anime.id, {
        episodes: newEpisodes || episodes,
        tags: newTags || tags,
        ...extra
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
    <div className="min-h-screen">
      {/* Backdrop */}
      <div className="relative">
        <div className="absolute inset-0 h-64 bg-gradient-to-b from-violet-900/30 to-slate-900" />
        {posterUrl && (
          <div className="absolute inset-0 h-64 overflow-hidden opacity-20 blur-xl scale-110">
            <img src={posterUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-6 pb-12">
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
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Poster */}
          <div className="w-44 flex-shrink-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 shadow-xl">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={anime.name_cn || anime.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700
                              flex items-center justify-center">
                  <span className="text-5xl font-black text-white/70">
                    {(anime.name_cn || anime.name).charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white">
              {anime.name_cn || anime.name}
            </h1>
            {anime.name_cn && anime.name_cn !== anime.name && (
              <p className="text-sm text-slate-500 mt-0.5">{anime.name}</p>
            )}
            <p className="text-xs text-slate-600 mt-1 truncate" title={anime.path}>
              {anime.path}
            </p>

            {/* Visibility + Score + Stats */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                onClick={() => { setIsPublic(!isPublic); save(null, null, { public: !isPublic }) }}
                disabled={saving}
                className={`text-xs px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${
                  isPublic
                    ? 'bg-emerald-900/30 border-emerald-800 text-emerald-400 hover:bg-emerald-900/50'
                    : 'bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50'
                }`}
                title={isPublic ? '局域网可见 - 点击设为隐藏' : '仅管理员可见 - 点击设为公开'}
              >
                {isPublic ? '设为隐藏' : '设为公开'}
              </button>
              {anime.score > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-lg font-bold text-white">{anime.score.toFixed(1)}</span>
                </div>
              )}
              <div className="text-sm text-slate-400">
                <span className="text-violet-400 font-medium">{watched}</span>
                <span>/{total} 集已看</span>
              </div>
              <div className="flex-1 max-w-40 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${total > 0 ? (watched / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Synopsis */}
            {anime.summary ? (
              <p className="mt-3 text-sm text-slate-300 leading-relaxed line-clamp-3">
                {anime.summary}
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-600 italic">暂无简介，点击下方按钮从 Bangumi 刮削</p>
            )}

            {/* Bangumi Tags + Re-scrape */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {anime.bangumi_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {anime.bangumi_tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-cyan-900/40 text-cyan-300 text-[11px]
                                           rounded-full border border-cyan-800/50">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={async () => {
                  setScrapingSelf(true)
                  await onScrape(anime.id)
                  setScrapingSelf(false)
                }}
                disabled={scrapingSelf}
                className="px-3 py-1 bg-cyan-900/30 hover:bg-cyan-900/50 disabled:opacity-50
                         text-xs text-cyan-300 rounded-md border border-cyan-800/40 transition-colors
                         inline-flex items-center gap-1"
                title="从 Bangumi 重新搜索封面和简介"
              >
                {scrapingSelf ? (
                  <><div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" /> 刮削中...</>
                ) : (
                  <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> 重新刮削</>
                )}
              </button>
            </div>

            {/* User Tags */}
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-1">个人标签</p>
              <TagEditor tags={tags} onTagsChange={handleTagsChange} />
            </div>

            {(saving || scraping) && (
              <span className="inline-block mt-2 text-xs text-slate-500">保存中...</span>
            )}
          </div>
        </div>

        {/* Episodes */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">剧集列表</h2>
          <div className="space-y-1">
            {episodes.map((ep, idx) => (
              <div
                key={ep.filename}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group/ep
                          ${ep.watched
                            ? 'bg-slate-800/30 hover:bg-slate-800/50'
                            : 'bg-slate-800 hover:bg-slate-700/60'
                          }`}
              >
                <span className="text-xs text-slate-500 w-8 text-right flex-shrink-0 tabular-nums">
                  {idx + 1}
                </span>

                {/* Play button */}
                <button
                  onClick={() => onPlay(anime, ep)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 group-hover/ep:bg-violet-600
                           flex items-center justify-center transition-colors"
                  title="播放"
                >
                  <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${ep.watched ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {ep.filename}
                  </p>
                  {/* Progress indicator */}
                  {ep.progress > 0 && !ep.watched && (
                    <span className="text-[11px] text-violet-400/70 ml-2">
                      已看 {formatTime(ep.progress)}
                    </span>
                  )}
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
