import { useState, useMemo, useEffect } from 'react'
import AnimeCard from './AnimeCard'
import { getServerInfo } from '../api'

export default function AnimeGrid({ animes, scanning, scraping, error, onSelect, onScan, onScrape }) {
  const [search, setSearch] = useState('')
  const [lanIPs, setLanIPs] = useState([])

  useEffect(() => {
    getServerInfo().then(info => setLanIPs(info.ips || [])).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return animes
    const q = search.toLowerCase()
    return animes.filter(a =>
      (a.name_cn || a.name).toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q)) ||
      (a.bangumi_tags || []).some(t => t.toLowerCase().includes(q))
    )
  }, [animes, search])

  const inProgress = useMemo(() =>
    animes.filter(a => a.episodes.some(e => e.progress > 0 && !e.watched)).slice(0, 6),
    [animes]
  )

  const allScraped = animes.every(a => a.scraped)
  const watching = animes.reduce((sum, a) => sum + a.episodes.filter(e => e.watched).length, 0)
  const totalEps = animes.reduce((sum, a) => sum + a.episodes.length, 0)

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Anime Manager
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {animes.length} 部作品 · {watching}/{totalEps} 集已看
              </p>
              {lanIPs.length > 0 && (
                <p className="text-xs text-emerald-400/70 mt-1">
                  局域网访问: {lanIPs.map(ip => `http://${ip}:3001`).join(' 或 ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!allScraped && (
                <button
                  onClick={onScrape}
                  disabled={scraping}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50
                           text-sm text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  {scraping ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      刮削中...
                    </>
                  ) : '刮削元数据'}
                </button>
              )}
              <button
                onClick={onScan}
                disabled={scanning}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50
                         text-sm text-slate-200 rounded-lg transition-colors"
              >
                {scanning ? '扫描中...' : '重新扫描'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索动漫、标签..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg
                       text-white placeholder-slate-500 focus:outline-none focus:border-violet-500
                       transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Continue Watching */}
        {!search && inProgress.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              继续观看
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {inProgress.map(anime => (
                <AnimeCard key={anime.id} anime={anime} onClick={() => onSelect(anime)} />
              ))}
            </div>
          </section>
        )}

        {/* All Anime */}
        <section>
          {!search && (
            <h2 className="text-lg font-bold text-white mb-4">
              {search ? '搜索结果' : '全部作品'}
            </h2>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              {search ? '没有匹配的动漫' : '没有扫描到动漫'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map(anime => (
                <AnimeCard key={anime.id} anime={anime} onClick={() => onSelect(anime)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
