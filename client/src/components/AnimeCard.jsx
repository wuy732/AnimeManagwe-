import { useMemo, useState } from 'react'
import { coverUrl } from '../api'

function PosterImage({ anime }) {
  const [imgError, setImgError] = useState(false)
  const localCover = coverUrl(anime.cover)
  const posterUrl = anime.poster || localCover

  if (!posterUrl || imgError) {
    return <PlaceholderPoster name={anime.name_cn || anime.name} />
  }

  return (
    <img
      src={posterUrl}
      alt={anime.name_cn || anime.name}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  )
}

function PlaceholderPoster({ name }) {
  const gradient = useMemo(() => {
    const colors = [
      'from-violet-600 via-purple-600 to-indigo-700',
      'from-pink-600 via-rose-600 to-red-700',
      'from-blue-600 via-cyan-600 to-teal-700',
      'from-emerald-600 via-green-600 to-teal-700',
      'from-amber-600 via-orange-600 to-red-700',
      'from-indigo-600 via-blue-600 to-violet-700'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }, [name])

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient}
                    flex flex-col items-center justify-center p-4`}>
      <span className="text-4xl font-black text-white/60 select-none">
        {name.charAt(0)}
      </span>
      <span className="text-xs text-white/40 mt-2 text-center line-clamp-2 select-none">
        {name}
      </span>
    </div>
  )
}

export default function AnimeCard({ anime, onClick }) {
  const watched = anime.episodes.filter(e => e.watched).length
  const total = anime.episodes.length
  const inProgress = anime.episodes.find(e => e.progress > 0 && !e.watched)
  const displayName = anime.name_cn || anime.name

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative rounded-lg overflow-hidden
                 bg-slate-800/80 border border-slate-700/50
                 hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-500/10
                 hover:-translate-y-1.5 hover:z-10
                 transition-all duration-300 ease-out"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <PosterImage anime={anime} />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-center justify-center">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {anime.score > 0 && (
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm
                            rounded-md text-yellow-400 text-xs font-bold">
                ★ {anime.score.toFixed(1)}
              </div>
            )}
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-violet-500/90
                          flex items-center justify-center shadow-lg
                          group-hover:scale-100 scale-75 transition-transform duration-300">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            {anime.summary && (
              <p className="text-xs text-slate-300 line-clamp-2 mb-2">{anime.summary}</p>
            )}
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

        {inProgress && (
          <div className="absolute top-2 left-2">
            <div className="px-1.5 py-0.5 bg-violet-500/90 rounded text-[10px] font-medium text-white">
              继续
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5">
        <h3 className="font-semibold text-sm text-white truncate" title={displayName}>
          {displayName}
        </h3>
        {/* User tags */}
        {anime.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {anime.tags.slice(0, 3).map(t => (
              <span key={t} className="px-1.5 py-0.5 bg-violet-600/20 text-violet-300 text-[10px] rounded">
                {t}
              </span>
            ))}
            {anime.tags.length > 3 && (
              <span className="text-[10px] text-slate-500">+{anime.tags.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-400">
            {watched}/{total} 集
          </p>
          {anime.bangumi_tags?.length > 0 && (
            <span className="text-[10px] text-slate-500 truncate ml-2 max-w-[120px]">
              {anime.bangumi_tags.slice(0, 2).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
