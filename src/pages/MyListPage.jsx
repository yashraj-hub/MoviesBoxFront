import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, ChevronLeft, FolderPlus, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'

const DEFAULT_LIST_ID = 'default'

export default function MyListPage() {
  const navigate = useNavigate()
  const [lists, setLists] = useState([])
  const [selectedListId, setSelectedListId] = useState(DEFAULT_LIST_ID)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [error, setError] = useState('')

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId) || lists[0] || null,
    [lists, selectedListId],
  )

  const load = useCallback((listId = selectedListId) => {
    setLoading(true)
    setError('')
    apiFetch(`my-list?listId=${encodeURIComponent(listId || DEFAULT_LIST_ID)}`)
      .then((r) => (r ? r.json() : null))
      .then((d) => {
        const nextLists = Array.isArray(d?.lists) ? d.lists : []
        const nextSelected = d?.list?.id || listId || DEFAULT_LIST_ID
        setLists(nextLists)
        setSelectedListId(nextSelected)
        setItems(Array.isArray(d?.items) ? d.items : [])
      })
      .catch(() => {
        setLists([])
        setItems([])
        setError('Could not load your lists.')
      })
      .finally(() => setLoading(false))
  }, [selectedListId])

  useEffect(() => {
    load(DEFAULT_LIST_ID)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectList = (listId) => {
    setSelectedListId(listId)
    load(listId)
  }

  const createList = async (event) => {
    event.preventDefault()
    const name = newListName.trim()
    if (!name || creating) return
    setCreating(true)
    setError('')
    try {
      const res = await apiFetch('my-list/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res?.json().catch(() => ({}))
      if (!res?.ok) throw new Error(data?.message || 'Could not create list.')
      setNewListName('')
      const nextId = data?.list?.id || DEFAULT_LIST_ID
      load(nextId)
    } catch (err) {
      setError(err.message || 'Could not create list.')
    } finally {
      setCreating(false)
    }
  }

  const remove = async (tmdbId, mediaType = 'movie') => {
    const r = await apiFetch(
      `my-list/${tmdbId}?mediaType=${encodeURIComponent(mediaType)}&listId=${encodeURIComponent(selectedListId)}`,
      { method: 'DELETE' },
    )
    if (r?.ok) {
      setItems((prev) => prev.filter((x) => !(x.tmdbId === tmdbId && (x.mediaType || 'movie') === mediaType)))
      setLists((prev) => prev.map((list) => (
        list.id === selectedListId ? { ...list, count: Math.max(0, (list.count || 0) - 1) } : list
      )))
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-12">
      <div className="mb-8 md:mb-10 flex flex-wrap items-center gap-x-3 gap-y-2 md:gap-x-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          title="Go back"
          aria-label="Go back"
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:border-yellow-400/40 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-3xl md:text-4xl leading-none text-yellow-400 uppercase tracking-tight m-0">
            My lists
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">
            {lists.length || 1} lists
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
            {lists.map((list) => {
              const active = list.id === selectedListId
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => selectList(list.id)}
                  className={`flex min-w-[180px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition lg:w-full ${
                    active
                      ? 'border-yellow-400/55 bg-yellow-400/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/25 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{list.name}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">{list.count || 0} titles</span>
                  </span>
                  {list.isDefault ? <Bookmark className="h-4 w-4 shrink-0 text-yellow-400" /> : null}
                </button>
              )
            })}
          </div>

          <form onSubmit={createList} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <FolderPlus className="h-4 w-4 text-yellow-400" />
              New list
            </div>
            <div className="flex gap-2">
              <input
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="Action nights"
                maxLength={80}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none placeholder:text-gray-600 focus:border-yellow-400/50"
              />
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Create list"
              >
                {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </form>

          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-200">
              {error}
            </div>
          ) : null}
        </aside>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black uppercase tracking-tight text-white">
                {selectedList?.name || 'My List'}
              </h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {items.length} saved titles
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <Bookmark className="w-12 h-12 text-yellow-400/40 mx-auto mb-4" />
              <p className="text-gray-400 text-sm leading-relaxed">
                Nothing here yet. Tap the save button on any movie or show and choose this list.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {items.map((m) => {
                const mediaType = m.mediaType || 'movie'
                return (
                  <div key={`${mediaType}-${m.tmdbId}`} className="group relative">
                    <button
                      type="button"
                      onClick={() => remove(m.tmdbId, mediaType)}
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 border border-white/15 text-gray-300 hover:text-red-400 hover:border-red-400/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(mediaType === 'tv' ? `/tv/${m.tmdbId}` : `/movie/${m.tmdbId}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(mediaType === 'tv' ? `/tv/${m.tmdbId}` : `/movie/${m.tmdbId}`)
                      }}
                      className="cursor-pointer"
                    >
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-yellow-400/40 transition-all duration-300">
                        {m.posterUrl ? (
                          <img src={m.posterUrl} alt={m.title} className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-gray-600 text-xs font-bold text-center px-2">{m.title}</div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/65 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-200">
                          {mediaType === 'tv' ? 'Series' : 'Movie'}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] font-bold text-white truncate px-0.5">{m.title}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
