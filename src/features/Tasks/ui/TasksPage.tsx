import { useState, useEffect, useMemo } from 'react'
import type { Task, TaskInput, TaskList } from '../model/types'
import { priorityMeta, MAX_TASK_DEPTH } from '../model/types'
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

type TaskForm =
  | { mode: 'add'; parentId?: number | null }
  | { mode: 'edit'; task: Task }
  | null
type ListForm = { mode: 'add' } | { mode: 'edit'; list: TaskList } | null

// узел дерева задач
type TaskNode = Task & { children: TaskNode[]; depth: number }

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
  // свёрнутые задачи (по id) — их подзадачи скрыты
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const toggleCollapse = (id: number) =>
    setCollapsed(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

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

  // строим дерево: корни (parentId == null) + вложенные подзадачи
  const tree = useMemo(() => {
    const byParent = new Map<number | null, Task[]>()
    for (const t of tasks) {
      const key = t.parentId ?? null
      const arr = byParent.get(key)
      if (arr) arr.push(t)
      else byParent.set(key, [t])
    }
    const sortSiblings = (arr: Task[]) =>
      [...arr].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority]
      })
    const build = (parentId: number | null, depth: number): TaskNode[] =>
      sortSiblings(byParent.get(parentId) ?? []).map(t => ({
        ...t,
        depth,
        children: build(t.id, depth + 1),
      }))
    return build(null, 0)
  }, [tasks])

  // все id потомков задачи (по текущему состоянию) — для рекурсивного закрытия
  const descendantIds = (rootId: number): number[] => {
    const out: number[] = []
    let frontier = [rootId]
    while (frontier.length) {
      const kids = tasks.filter(t => t.parentId != null && frontier.includes(t.parentId))
      if (!kids.length) break
      const ids = kids.map(k => k.id)
      out.push(...ids)
      frontier = ids
    }
    return out
  }

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
    const next = !task.done
    // закрытие задачи рекурсивно закрывает подзадачи (как на бэкенде)
    const affected = next ? new Set([task.id, ...descendantIds(task.id)]) : new Set([task.id])
    setTasks(prev => prev.map(t => affected.has(t.id) ? { ...t, done: next } : t))
    try {
      await setTaskDone(task.id, next)
    } catch {
      reloadTasks()
    }
  }

  async function handleDeleteTask(id: number) {
    // на бэкенде удаляется всё поддерево — убираем потомков и локально
    const remove = new Set([id, ...descendantIds(id)])
    setTasks(prev => prev.filter(t => !remove.has(t.id)))
    try {
      await deleteTask(id)
    } catch {
      reloadTasks()
    }
  }

  function openSubtask(parentId: number) {
    setCollapsed(prev => { const n = new Set(prev); n.delete(parentId); return n }) // раскрыть родителя
    setTaskForm({ mode: 'add', parentId })
  }

  // рекурсивный рендер узла дерева с подзадачами
  // коннекторы (├─ └─ │) рисуются целиком на CSS через ::before/::after у .tk-node
  function renderNode(node: TaskNode) {
    const prio = priorityMeta(node.priority)
    const hasKids = node.children.length > 0
    const isCollapsed = collapsed.has(node.id)
    const canNest = node.depth < MAX_TASK_DEPTH
    const openKids = hasKids ? node.children.filter(c => !c.done).length : 0

    return (
      <li
        key={node.id}
        className={`tk-node${node.depth === 0 ? ' tk-node--root' : ''}${hasKids ? ' tk-node--branch' : ''}`}
      >
        <div
          className={`tk-task${node.done ? ' tk-task--done' : ''}`}
          onClick={() => setTaskForm({ mode: 'edit', task: node })}
        >
          <button
            className={`tk-twisty${hasKids ? '' : ' tk-twisty--empty'}`}
            onClick={e => { e.stopPropagation(); if (hasKids) toggleCollapse(node.id) }}
            title={hasKids ? (isCollapsed ? 'Развернуть' : 'Свернуть') : undefined}
            aria-hidden={!hasKids}
          >
            {hasKids && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.12s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>

          <button
            className="tk-check"
            onClick={e => { e.stopPropagation(); toggleDone(node) }}
            style={node.done ? { background: prio.color, borderColor: prio.color } : { borderColor: prio.color }}
            title={node.done ? 'Вернуть в работу' : 'Завершить'}
          >
            {node.done && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <div className="tk-task-body">
            <div className="tk-task-titlerow">
              <span className="tk-task-title" title={node.title}>{node.title}</span>
              <span className="tk-prio-badge" style={{ background: `${prio.color}1a`, color: prio.color }}>{prio.label}</span>
              {hasKids && (
                <span className="tk-subcount" title="Открытых подзадач">{openKids}/{node.children.length}</span>
              )}
            </div>
            {node.description && <div className="tk-task-desc">{node.description}</div>}
            {(node.dueDate || node.deadline) && (
              <div className="tk-task-dates">
                {node.dueDate && <span className="tk-date-badge">🗓 {fmtDate(node.dueDate)}</span>}
                {node.deadline && <span className="tk-date-badge tk-date-badge--deadline">⏰ {fmtDate(node.deadline)}</span>}
              </div>
            )}
          </div>

          <div className="tk-task-actions">
            {canNest && (
              <button
                className="tk-mini-btn"
                title="Добавить подзадачу"
                onClick={e => { e.stopPropagation(); openSubtask(node.id) }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
            <button
              className="tk-mini-btn tk-mini-btn--danger"
              title="Удалить"
              onClick={e => { e.stopPropagation(); handleDeleteTask(node.id) }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>

        {hasKids && !isCollapsed && (
          <ul
            className="tk-tasks tk-subtasks"
            style={{ ['--rail' as string]: prio.color }}
          >
            {node.children.map(renderNode)}
          </ul>
        )}
      </li>
    )
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
              {tree.map(n => renderNode(n))}
            </ul>
          )}
        </div>
      </main>

      {/* ===== MODALS ===== */}
      {taskForm && selectedList && (
        <TaskFormModal
          title={
            taskForm.mode === 'edit'
              ? 'Редактировать задачу'
              : taskForm.parentId != null ? 'Новая подзадача' : 'Новая задача'
          }
          lists={lists}
          defaultListId={selectedList.id}
          initial={taskForm.mode === 'edit' ? taskForm.task : undefined}
          parentId={taskForm.mode === 'add' ? taskForm.parentId ?? null : null}
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
