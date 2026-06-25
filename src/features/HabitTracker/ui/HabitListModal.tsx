import { useState, useEffect, useRef } from 'react'
import { HabitFilterStatus } from '../model/types'
import type { HabitDto } from '../model/types'
import { fetchHabits, createHabit, updateHabit, deleteHabit } from '../storage/habitApi'
import './HabitListModal.css'

const FILTER_OPTIONS: { id: HabitFilterStatus; label: string }[] = [
  { id: HabitFilterStatus.All, label: 'Все' },
  { id: HabitFilterStatus.Active, label: 'Активные' },
  { id: HabitFilterStatus.Inactive, label: 'Неактивные' },
]

const LIMIT = 10

/* ─── Habit Form Modal ─── */

function HabitFormModal({
  title,
  initialName,
  initialActive,
  onSave,
  onClose,
}: {
  title: string
  initialName: string
  initialActive: boolean
  onSave: (name: string, isActive: boolean) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [active, setActive] = useState(initialActive)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="hfm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="hfm-panel" onMouseDown={e => e.stopPropagation()}>
        <div className="hfm-header">
          <span className="hfm-title">{title}</span>
          <button className="hfm-close-btn" onClick={onClose} title="Закрыть">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="hfm-body">
          <input
            className="hfm-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim(), active) }}
            placeholder="Название привычки"
            autoFocus
          />

          <label className="hfm-checkbox-row">
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
            />
            <span>Активность</span>
          </label>

          <button
            className="hfm-save-btn"
            onClick={() => { if (name.trim()) onSave(name.trim(), active) }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Habit List Modal ─── */

type Props = { onClose: () => void }

export function HabitListModal({ onClose }: Props) {
  const [habits, setHabits] = useState<HabitDto[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<HabitFilterStatus>(HabitFilterStatus.All)
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

  type FormMode = { mode: 'add' } | { mode: 'edit'; habit: HabitDto } | null
  const [formMode, setFormMode] = useState<FormMode>(null)

  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetchHabits({ page, limit: LIMIT, search, filter })
      .then(res => {
        if (cancelled) return
        setHabits(res.data)
        setTotal(res.total)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить привычки')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [page, search, filter, reloadKey])

  useEffect(() => {
    if (!filterOpen) return
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [filterOpen])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && !formMode) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [formMode, onClose])

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  function reload() {
    setReloadKey(k => k + 1)
  }

  async function handleAdd(name: string, isActive: boolean) {
    await createHabit(name, isActive)
    setFormMode(null)
    setPage(1)
    reload()
  }

  async function handleSaveEdit(name: string, isActive: boolean) {
    if (formMode?.mode !== 'edit') return
    await updateHabit(formMode.habit.id, name, isActive)
    setFormMode(null)
    reload()
  }

  async function handleDelete(id: number) {
    setHabits(prev => prev.filter(h => h.id !== id))
    setTotal(prev => prev - 1)
    try {
      await deleteHabit(id)
    } catch {
      reload()
    }
  }

  const currentFilterLabel = FILTER_OPTIONS.find(f => f.id === filter)?.label ?? 'Все'

  return (
    <>
      <div className="hlm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="hlm-panel" onMouseDown={e => e.stopPropagation()}>

          <div className="hlm-header">
            <span className="hlm-title">Управление списком привычек</span>
            <button className="hlm-close-btn" onClick={onClose} title="Закрыть">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="hlm-toolbar">
            <div className="hlm-search-wrap">
              <span className="hlm-search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input
                className="hlm-search"
                placeholder="Поиск по названию..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            <div className="hlm-filter-wrap" ref={filterRef}>
              <button
                className={`hlm-filter-btn${filterOpen ? ' hlm-filter-btn--open' : ''}`}
                onClick={() => setFilterOpen(o => !o)}
              >
                <span>{currentFilterLabel}</span>
                <svg
                  className={`hlm-filter-chevron${filterOpen ? ' hlm-filter-chevron--up' : ''}`}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {filterOpen && (
                <div className="hlm-filter-dropdown">
                  {FILTER_OPTIONS.map(f => (
                    <button
                      key={f.id}
                      className={`hlm-filter-option${f.id === filter ? ' hlm-filter-option--active' : ''}`}
                      onClick={() => { setFilter(f.id); setFilterOpen(false); setPage(1) }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="hlm-add-btn" onClick={() => setFormMode({ mode: 'add' })}>
              Добавить
            </button>
          </div>

          <div className="hlm-list">
            {isLoading ? (
              <div className="hlm-empty">Загрузка...</div>
            ) : error ? (
              <div className="hlm-empty hlm-empty--error">{error}</div>
            ) : habits.length === 0 ? (
              <div className="hlm-empty">Привычки не найдены</div>
            ) : (
              habits.map(h => (
                <div key={h.id} className="hlm-item-wrap">
                  <div className="hlm-item">
                    <span className="hlm-item-name">{h.label}</span>
                    <div className="hlm-item-right">
                      <span
                        className={`hlm-status-dot hlm-status-dot--${h.is_active ? 'active' : 'inactive'}`}
                        title={h.is_active ? 'Активна' : 'Неактивна'}
                      />
                      <button
                        className="hlm-edit-btn"
                        title="Редактировать"
                        onClick={() => setFormMode({ mode: 'edit', habit: h })}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </button>
                      <button
                        className="hlm-delete-btn"
                        title="Удалить"
                        onClick={() => handleDelete(h.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/>
                          <path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hlm-pagination">
            <span className="hlm-pagination-info">{total} привычек</span>
            <button className="hlm-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="hlm-page-current">{page}</span>
            <button className="hlm-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

        </div>
      </div>

      {formMode?.mode === 'add' && (
        <HabitFormModal
          title="Новая привычка"
          initialName=""
          initialActive={true}
          onSave={handleAdd}
          onClose={() => setFormMode(null)}
        />
      )}
      {formMode?.mode === 'edit' && (
        <HabitFormModal
          title="Редактировать привычку"
          initialName={formMode.habit.label}
          initialActive={formMode.habit.is_active}
          onSave={handleSaveEdit}
          onClose={() => setFormMode(null)}
        />
      )}
    </>
  )
}
