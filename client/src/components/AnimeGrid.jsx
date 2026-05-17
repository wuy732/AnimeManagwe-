import { useState, useMemo } from 'react'
import AnimeCard from './AnimeCard'

export default function AnimeGrid({ animes, scanning, error, onSelect, onScan }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return animes
    const q = search.toLowerCase()
    return animes.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [animes, search])

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Anime Manager</h1>
          <button
            onClick={onScan}
            disabled={scanning}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50
                       text-sm text-slate-200 rounded-lg transition-colors"
          >
            {scanning ? '扫描中...' : '重新扫描'}
          </button>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索动漫或标签..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                       text-white placeholder-slate-500 focus:outline-none focus:border-violet-500
                       transition-colors"
          />
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-20 text-slate-500">
          {search ? '没有匹配的动漫' : '没有扫描到动漫'}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(anime => (
            <AnimeCard key={anime.id} anime={anime} onClick={() => onSelect(anime)} />
          ))}
        </div>
      )}
    </div>
  )
}
