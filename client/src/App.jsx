import { useState, useEffect, useCallback, useRef } from 'react'
import { getSettings, getAnimes, triggerScan, triggerScrape, scrapeAnime } from './api'
import SetupWizard from './components/SetupWizard'
import AnimeGrid from './components/AnimeGrid'
import AnimeDetail from './components/AnimeDetail'
import VideoPlayer from './components/VideoPlayer'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [animePath, setAnimePath] = useState('')
  const [animes, setAnimes] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [player, setPlayer] = useState(null)
  const pollRef = useRef(null)

  const loadAnimes = useCallback(async () => {
    try {
      const data = await getAnimes()
      setAnimes(data)
    } catch {
      setError('加载动漫列表失败')
    }
  }, [])

  const startPoll = useCallback((intervalMs = 2000) => {
    if (pollRef.current) clearInterval(pollRef.current)
    let polls = 0
    pollRef.current = setInterval(async () => {
      try {
        const data = await getAnimes()
        setAnimes(data)
        polls++
        if (data.every(a => a.scraped) || polls > 30) {
          clearInterval(pollRef.current)
          pollRef.current = null
          setScraping(false)
        }
      } catch {
        clearInterval(pollRef.current)
        pollRef.current = null
        setScraping(false)
      }
    }, intervalMs)
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const loadSettings = useCallback(async () => {
    try {
      const { anime_path } = await getSettings()
      setAnimePath(anime_path)
      if (anime_path) await loadAnimes()
    } catch {
      setError('无法连接服务器')
    } finally {
      setLoading(false)
    }
  }, [loadAnimes])

  useEffect(() => { loadSettings() }, [loadSettings])

  const handlePathSet = async (path) => {
    setAnimePath(path)
    await doScan()
  }

  const doScan = async () => {
    setScanning(true)
    setError('')
    try {
      const result = await triggerScan()
      setAnimes(result.animes)
      setScraping(true)
      triggerScrape().finally(() => setScraping(false))
      startPoll()
    } catch (e) {
      setError(e.message)
    } finally {
      setScanning(false)
    }
  }

  const handleScrape = async (force = false) => {
    setScraping(true)
    try {
      await triggerScrape(force)
      startPoll()
    } catch (e) {
      setError(e.message)
      setScraping(false)
    }
  }

  const handleScrapeAnime = async (animeId) => {
    try {
      await scrapeAnime(animeId)
      const data = await getAnimes()
      setAnimes(data)
      const updated = data.find(a => a.id === animeId)
      if (updated) setSelected(updated)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleUpdateAnime = (updated) => {
    setAnimes(prev => prev.map(a => a.id === updated.id ? updated : a))
    setSelected(updated)
  }

  const handlePlayEpisode = (anime, episode) => {
    setPlayer({ anime, episode })
  }

  const handlePlayerClose = (updatedEpisode) => {
    if (updatedEpisode && player) {
      const updatedAnime = {
        ...player.anime,
        episodes: player.anime.episodes.map(ep =>
          ep.filename === updatedEpisode.filename
            ? { ...ep, progress: updatedEpisode.progress, watched: updatedEpisode.watched }
            : ep
        )
      }
      handleUpdateAnime(updatedAnime)
    }
    setPlayer(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!animePath || (animes.length === 0 && !scanning)) {
    return (
      <SetupWizard
        hasPath={!!animePath}
        onPathSet={handlePathSet}
        onScan={doScan}
        scanning={scanning}
        error={error}
      />
    )
  }

  const mainView = selected ? (
    <AnimeDetail
      anime={selected}
      onBack={() => setSelected(null)}
      onUpdate={handleUpdateAnime}
      onPlay={handlePlayEpisode}
      onScrape={handleScrapeAnime}
      scraping={scraping}
    />
  ) : (
    <AnimeGrid
      animes={animes}
      scanning={scanning}
      scraping={scraping}
      error={error}
      onSelect={setSelected}
      onScan={doScan}
      onScrape={handleScrape}
    />
  )

  return (
    <>
      {mainView}
      {player && (
        <VideoPlayer
          anime={player.anime}
          episode={player.episode}
          onClose={handlePlayerClose}
        />
      )}
    </>
  )
}
