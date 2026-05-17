import { useState, useEffect, useCallback } from 'react'
import { getSettings, getAnimes, triggerScan } from './api'
import SetupWizard from './components/SetupWizard'
import AnimeGrid from './components/AnimeGrid'
import AnimeDetail from './components/AnimeDetail'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [animePath, setAnimePath] = useState('')
  const [animes, setAnimes] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const loadAnimes = useCallback(async () => {
    try {
      const data = await getAnimes()
      setAnimes(data)
    } catch {
      setError('加载动漫列表失败')
    }
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const { anime_path } = await getSettings()
      setAnimePath(anime_path)
      if (anime_path) {
        await loadAnimes()
      }
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
    } catch (e) {
      setError(e.message)
    } finally {
      setScanning(false)
    }
  }

  const handleUpdateAnime = (updated) => {
    setAnimes(prev => prev.map(a => a.id === updated.id ? updated : a))
    setSelected(updated)
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

  if (selected) {
    return (
      <AnimeDetail
        anime={selected}
        onBack={() => setSelected(null)}
        onUpdate={handleUpdateAnime}
      />
    )
  }

  return (
    <AnimeGrid
      animes={animes}
      scanning={scanning}
      error={error}
      onSelect={setSelected}
      onScan={doScan}
    />
  )
}
