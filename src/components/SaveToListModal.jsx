import { useEffect, useMemo, useState } from 'react'
import { BookmarkCheck, Check, LoaderCircle, Plus, X } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'

export default function SaveToListModal({ open, item, onClose, onSaved }) {
  const [lists, setLists] = useState([])
  const [savedListIds, setSavedListIds] = useState([])
  const [selectedListId, setSelectedListId] = useState('default')
  const [newListName, setNewListName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const mediaType = item?.mediaType === 'tv' ? 'tv' : 'movie'
  const tmdbId = item?.tmdbId ? Number(item.tmdbId) : null

  const availableLists = useMemo(() => {
    const saved = new Set(savedListIds)
    return lists.map((list) => ({ ...list, saved: saved.has(list.id) }))
  }, [lists, savedListIds])

  useEffect(() => {
    if (!open || !tmdbId) return
    let cancelled = false
    setLoading(true)
    setError('')
    setNewListName('')

    apiFetch(`my-list/check/${tmdbId}?mediaType=${encodeURIComponent(mediaType)}`)
      .then((res) => res?.json())
      .then((data) => {
        if (cancelled) return
        const nextLists = Array.isArray(data?.lists) ? data.lists : []
        const nextSavedIds = Array.isArray(data?.listIds) ? data.listIds : []
        setLists(nextLists)
        setSavedListIds(nextSavedIds)
        setSelectedListId(nextLists.find((list) => !nextSavedIds.includes(list.id))?.id || 'new')
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your lists.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [open, tmdbId, mediaType])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !item) return null

  const save = async () => {
    if (saving || !tmdbId) return
    const createListName = newListName.trim()
    if (selectedListId === 'new' && !createListName) {
      setError('Name your new list first.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await apiFetch('my-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId,
          mediaType,
          title: item.title || '',
          posterUrl: item.posterUrl || '',
          ...(selectedListId === 'new' ? { createListName } : { listId: selectedListId }),
        }),
      })
      const data = await res?.json().catch(() => ({}))
      if (!res?.ok) throw new Error(data?.message || 'Could not save this title.')
      const savedId = data?.listId || selectedListId
      setSavedListIds((prev) => [...new Set([...prev, savedId])])
      onSaved?.({ listId: savedId, list: data?.list })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save this title.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#101010] text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-yellow-400">Save to list</p>
            <h2 className="mt-1 truncate text-lg font-black uppercase tracking-tight">{item.title || 'Untitled'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:border-yellow-400/40 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-yellow-400">
              <LoaderCircle className="h-7 w-7 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {availableLists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  disabled={list.saved}
                  onClick={() => setSelectedListId(list.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    list.saved
                      ? 'border-yellow-400/35 bg-yellow-400/10 text-yellow-300'
                      : selectedListId === list.id
                        ? 'border-yellow-400/55 bg-white/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/25 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    list.saved ? 'border-yellow-400/40 bg-yellow-400/15' : 'border-white/10 bg-black/30'
                  }`}>
                    {list.saved ? <BookmarkCheck className="h-4 w-4" /> : selectedListId === list.id ? <Check className="h-4 w-4 text-yellow-400" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{list.name}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">{list.count || 0} titles</span>
                  </span>
                  {list.saved ? <span className="text-[10px] font-black uppercase tracking-widest">Saved</span> : null}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedListId('new')}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  selectedListId === 'new'
                    ? 'border-yellow-400/55 bg-white/10 text-white'
                    : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/25 hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30">
                  <Plus className="h-4 w-4 text-yellow-400" />
                </span>
                <span className="text-sm font-black">Create new list</span>
              </button>

              {selectedListId === 'new' ? (
                <input
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  placeholder="Weekend watchlist"
                  autoFocus
                  maxLength={80}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-yellow-400/50"
                />
              ) : null}
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-gray-300 transition hover:border-white/25 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="flex h-10 items-center gap-2 rounded-full bg-yellow-400 px-5 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
