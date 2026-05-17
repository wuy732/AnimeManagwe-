import { useState, useMemo } from 'react'
import { coverUrl } from '../api'

function CardPoster({ anime }) {
  const [imgError, setImgError] = useState(false)
  const url = coverUrl(anime.cover)

  if (!url || imgError) {
    return <PlaceholderCover name={anime.name} />
  }

  return (
    <img
      src={url}
      alt={anime.name}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  )
}

function PlaceholderCover({ name }) {
  const gradient = useMemo(() => {
    const colors = [
      'from-violet-600 to-purple-700',
      'from-pink-600 to-rose-700',
      'from-blue-600 to-cyan-700',
      'from-emerald-600 to-teal-700',
      'from-amber-600 to-orange-700',
      'from-indigo-600 to-blue-700'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }, [name])

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient}
                    flex items-center justify-center`}>
      <span className="text-4xl font-black text-white/50 select-none">{name.charAt(0)}</span>
    </div>
  )
}

export default function AnimeCard({ anime, onClick }) {
  const watched = anime.episodes.filter(e => e.watched).length
  const total = anime.episodes.length

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-slate-800 rounded-xl overflow-hidden
               border border-slate-700/50 hover:border-violet-500/60
               hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1
               transition-all duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <CardPoster anime={anime} />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-end">
          <div className="p-3 w-full">
            <div className="w-10 h-10 mx-auto rounded-full bg-violet-500/90
                        flex items-center justify-center shadow-lg
                        group-hover:scale-100 scale-75 transition-transform duration-300">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        {total > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700">
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${(watched / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-2.5">
        <h3 className="font-semibold text-sm text-white truncate" title={anime.name}>
          {anime.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-slate-400">{watched}/{total} 集</p>
          {anime.notes && (
            <span className="text-[10px] text-amber-500" title="含本地说明文件">📄</span>
          )}
        </div>
        {anime.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {anime.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
