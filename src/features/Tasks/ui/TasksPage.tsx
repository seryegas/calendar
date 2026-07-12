import { useState, useEffect, useMemo } from 'react'
import type { Task, TaskInput, TaskList } from '../model/types'
import { priorityMeta } from '../model/types'
import {
  fetchLists, createList, updateList, deleteList,
  fetchTasks, createTask, updateTask, setTaskDone, deleteTask,
} from '../storage/taskApi'
import { TaskFormModal } from './TaskFormModal'
import { ListFormModal } from './ListFormModal'
import './TasksPage.css'

const LS_SELECTED = 'tasks_selected_list'

const PRIO_ORDER: Record<string, number> = { urgent: 0, important: 1, current: 2 }

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

type TaskForm = { mode: 'add' } | { mode: 'edit'; task: Task } | null
type ListForm = { mode: 'add' } | { mode: 'edit'; list: TaskList } | null

export function TasksPage() {
  const [lists, setLists] = useState<TaskList[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const saved = Number(localStorage.getItem(LS_SELECTED))
    return saved > 0 ? saved : null
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [listsTick, setListsTick] = useState(0)
  const [tasksTick, setTasksTick] = useState(0)

  const [taskForm, setTaskForm] = useState<TaskForm>(null)
  const [listForm, setListForm] = useState<ListForm>(null)

  const reloadLists = () => setListsTick(t => t + 1)
  const reloadTasks = () => setTasksTick(t => t + 1)

  // ===== load lists =====
  useEffect(() => {
    let cancelled = false
    setError('')
    fetchLists()
      .then(data => {
        if (cancelled) return
        setLists(data)
        setSelectedId(prev => {
          if (prev != null && data.some(l => l.id === prev)) return prev
          return data[0]?.id ?? null
        })
      })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить списки') })
    return () => { cancelled = true }
  }, [listsTick])

  // ===== load tasks of selected list =====
  useEffect(() => {
    if (selectedId == null) {
      setTasks([])
      setLoading(false)
      return
    }
    localStorage.setItem(LS_SELECTED, String(selectedId))
    let cancelled = false
    setLoading(true)
    fetchTasks({ listId: selectedId, status: 'all' })
      .then(data => { if (!cancelled) setTasks(data) })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить задачи') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedId, tasksTick])

  const selectedList = lists.find(l => l.id === selectedId) ?? null

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority]
    })
  }, [tasks])

  const activeCount = tasks.filter(t => !t.done).length

  // ===== list mutations =====
  async function handleSaveList(name: string, color: string) {
    if (listForm?.mode === 'edit') {
      await updateList(listForm.list.id, name, color)
    } else {
      const created = await createList(name, color)
      setSelectedId(created.id)
    }
    setListForm(null)
    reloadLists()
  }

  async function handleDeleteList(id: number) {
    if (!confirm('Удалить список вместе со всеми задачами?')) return
    await deleteList(id)
    if (selectedId === id) setSelectedId(null)
    reloadLists()
  }

  // ===== task mutations =====
  async function handleSaveTask(input: TaskInput) {
    if (taskForm?.mode === 'edit') {
      await updateTask(taskForm.task.id, input)
    } else {
      await createTask(input)
    }
    setTaskForm(null)
    reloadTasks()
  }

  async function toggleDone(task: Task) {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
    try {
      await setTaskDone(task.id, !task.done)
    } catch {
      reloadTasks()
    }
  }

  async function handleDeleteTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTask(id)
    } catch {
      reloadTasks()
    }
  }

  return (
    <div className="tk-page">
      {/* ===== SIDEBAR ===== */}
      <aside className="tk-sidebar">
        <div className="tk-sidebar-head">
          <span className="tk-sidebar-title">Списки</span>
          <button className="tk-icon-add" title="Новый список" onClick={() => setListForm({ mode: 'add' })}>+</button>
        </div>

        <div className="tk-lists">
          {lists.length === 0 && !error && (
            <div className="tk-lists-empty">Пока нет списков</div>
          )}
          {lists.map(l => (
            <div
              key={l.id}
              className={`tk-list-item${l.id === selectedId ? ' tk-list-item--active' : ''}`}
              onClick={() => setSelectedId(l.id)}
            >
              <span className="tk-list-dot" style={{ background: l.color }} />
              <span className="tk-list-name">{l.name}</span>
              <span className="tk-list-actions">
                <button
                  className="tk-mini-btn"
                  title="Редактировать"
                  onClick={e => { e.stopPropagation(); setListForm({ mode: 'edit', list: l }) }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                  </svg>
                </button>
                <button
                  className="tk-mini-btn tk-mini-btn--danger"
                  title="Удалить"
                  onClick={e => { e.stopPropagation(); handleDeleteList(l.id) }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="tk-main">
        <div className="tk-topbar">
          <div className="tk-topbar-title">
            {selectedList ? (
              <>
                <span className="tk-list-dot tk-list-dot--lg" style={{ background: selectedList.color }} />
                <span className="tk-topbar-name">{selectedList.name}</span>
                <span className="tk-topbar-counter">{activeCount}</span>
              </>
            ) : (
              <span className="tk-topbar-name">Задачи</span>
            )}
          </div>
          <button
            className="tk-btn tk-btn--primary"
            disabled={!selectedList}
            onClick={() => setTaskForm({ mode: 'add' })}
          >
            + Добавить
          </button>
        </div>

        <div className="tk-content">
          {error ? (
            <div className="tk-empty">
              <div className="tk-empty-title">{error}</div>
              <div className="tk-empty-sub">Проверьте, что бэкенд запущен.</div>
              <button className="tk-btn tk-btn--ghost" onClick={reloadLists}>Повторить</button>
            </div>
          ) : !selectedList ? (
            <div className="tk-empty">
              <div className="tk-empty-title">Нет выбранного списка</div>
              <div className="tk-empty-sub">Создайте список слева, чтобы добавлять задачи.</div>
              <button className="tk-btn tk-btn--primary" onClick={() => setListForm({ mode: 'add' })}>+ Новый список</button>
            </div>
          ) : loading ? (
            <div className="tk-empty"><div className="tk-empty-sub">Загрузка...</div></div>
          ) : tasks.length === 0 ? (
            <div className="tk-empty">
              <div className="tk-empty-title">Задач пока нет</div>
              <div className="tk-empty-sub">Добавьте первую задачу в этот список.</div>
              <button className="tk-btn tk-btn--primary" onClick={() => setTaskForm({ mode: 'add' })}>+ Добавить</button>
            </div>
          ) : (
            <ul className="tk-tasks">
              {sortedTasks.map(t => {
                const prio = priorityMeta(t.priority)
                return (
                  <li
                    key={t.id}
                    className={`tk-task${t.done ? ' tk-task--done' : ''}`}
                    onClick={() => setTaskForm({ mode: 'edit', task: t })}
                  >
                    <button
                      className="tk-check"
                      onClick={e => { e.stopPropagation(); toggleDone(t) }}
                      style={t.done ? { background: prio.color, borderColor: prio.color } : { borderColor: prio.color }}
                      title={t.done ? 'Вернуть в работу' : 'Завершить'}
                    >
                      {t.done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <div className="tk-task-body">
                      <div className="tk-task-titlerow">
                        <span className="tk-task-title">{t.title}</span>
                        <span className="tk-prio-badge" style={{ background: `${prio.color}1a`, color: prio.color }}>{prio.label}</span>
                      </div>
                      {t.description && <div className="tk-task-desc">{t.description}</div>}
                      {(t.dueDate || t.deadline) && (
                        <div className="tk-task-dates">
                          {t.dueDate && <span className="tk-date-badge">🗓 {fmtDate(t.dueDate)}</span>}
                          {t.deadline && <span className="tk-date-badge tk-date-badge--deadline">⏰ {fmtDate(t.deadline)}</span>}
                        </div>
                      )}
                    </div>

                    <button
                      className="tk-mini-btn tk-mini-btn--danger"
                      title="Удалить"
                      onClick={e => { e.stopPropagation(); handleDeleteTask(t.id) }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>

      {/* ===== MODALS ===== */}
      {taskForm && selectedList && (
        <TaskFormModal
          title={taskForm.mode === 'add' ? 'Новая задача' : 'Редактировать задачу'}
          lists={lists}
          defaultListId={selectedList.id}
          initial={taskForm.mode === 'edit' ? taskForm.task : undefined}
          onSave={handleSaveTask}
          onClose={() => setTaskForm(null)}
        />
      )}
      {listForm && (
        <ListFormModal
          title={listForm.mode === 'add' ? 'Новый список' : 'Редактировать список'}
          initial={listForm.mode === 'edit' ? listForm.list : undefined}
          onSave={handleSaveList}
          onClose={() => setListForm(null)}
        />
      )}
    </div>
  )
}
