import { useMemo } from 'react'

function getCoverUrl(cover) {
  if (!cover) return null
  return `/api/cover?path=${encodeURIComponent(cover)}`
}

function PlaceholderCover({ name }) {
  const color = useMemo(() => {
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
    <div className={`w-full aspect-[3/4] bg-gradient-to-br ${color}
                     flex items-center justify-center rounded-lg`}>
      <span className="text-3xl font-bold text-white/80 select-none">
        {name.charAt(0)}
      </span>
    </div>
  )
}

export default function AnimeCard({ anime, onClick }) {
  const coverUrl = getCoverUrl(anime.cover)
  const watched = anime.episodes.filter(e => e.watched).length
  const total = anime.episodes.length

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-slate-800 rounded-xl overflow-hidden
                 border border-slate-700 hover:border-violet-500/50
                 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/10
                 hover:-translate-y-1"
    >
      <div className="relative overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={anime.name}
            className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <PlaceholderCover name={anime.name} />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${total > 0 ? (watched / total) * 100 : 0}%` }}
          />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-white truncate" title={anime.name}>
          {anime.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {watched}/{total} 集
        </p>
        {anime.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {anime.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
