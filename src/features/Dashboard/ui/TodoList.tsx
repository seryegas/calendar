import { useState, useEffect, useRef } from 'react'
import type { Task, TaskInput, TaskList } from '../../Tasks/model/types'
import { priorityMeta } from '../../Tasks/model/types'
import { fetchTasks, fetchLists, createTask, setTaskDone } from '../../Tasks/storage/taskApi'
import { TaskFormModal } from '../../Tasks/ui/TaskFormModal'

const LIMIT = 10
const UNDO_SECONDS = 10
const EXIT_MS = 320

const CheckIcon = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M2.5 6.3l2.2 2.2 4.8-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

type Timer = { interval: ReturnType<typeof setInterval>; timeout: ReturnType<typeof setTimeout> }

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<TaskList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [addOpen, setAddOpen] = useState(false)

  // задачи, ждущие подтверждения: id -> секунд до исчезновения
  const [countdown, setCountdown] = useState<Record<string, number>>({})
  // задачи в процессе анимации ухода
  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, Timer>>(new Map())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    Promise.all([
      fetchTasks({ status: 'active', limit: LIMIT }),
      fetchLists(),
    ])
      // в виджете показываем только корневые задачи — структура живёт на странице задач
      .then(([t, l]) => { if (!cancelled) { setTasks(t.filter(x => x.parentId == null)); setLists(l) } })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadTick])

  // подчистить таймеры при размонтировании
  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach(({ interval, timeout }) => { clearInterval(interval); clearTimeout(timeout) })
      map.clear()
    }
  }, [])

  function clearTimer(key: string) {
    const t = timers.current.get(key)
    if (t) { clearInterval(t.interval); clearTimeout(t.timeout); timers.current.delete(key) }
  }

  // старт отсчёта: задача перечёркивается, 10 секунд на отмену
  function complete(task: Task) {
    const key = String(task.id)
    if (timers.current.has(key)) return
    setCountdown(prev => ({ ...prev, [key]: UNDO_SECONDS }))
    const interval = setInterval(() => {
      setCountdown(prev => (key in prev ? { ...prev, [key]: Math.max(0, prev[key] - 1) } : prev))
    }, 1000)
    const timeout = setTimeout(() => finish(task), UNDO_SECONDS * 1000)
    timers.current.set(key, { interval, timeout })
  }

  // отмена — задача возвращается в активные
  function undo(task: Task) {
    const key = String(task.id)
    clearTimer(key)
    setCountdown(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  // время вышло — анимация ухода + запись на бэкенд
  function finish(task: Task) {
    const key = String(task.id)
    clearTimer(key)
    setCountdown(prev => { const n = { ...prev }; delete n[key]; return n })
    setExiting(prev => new Set(prev).add(key))
    setTaskDone(task.id, true).catch(() => {
      // не удалось закрыть — вернуть в список
      setExiting(prev => { const n = new Set(prev); n.delete(key); return n })
    })
    setTimeout(() => {
      setTasks(prev => prev.filter(t => String(t.id) !== key))
      setExiting(prev => { const n = new Set(prev); n.delete(key); return n })
    }, EXIT_MS)
  }

  async function handleAdd(input: TaskInput) {
    await createTask(input)
    setAddOpen(false)
    setReloadTick(t => t + 1)
  }

  const activeCount = tasks.length - Object.keys(countdown).length - exiting.size

  return (
    <div className="dash-widget dash-todo">
      <div className="dash-widget-head">
        <span className="dash-widget-title">Текущие дела</span>
        <div className="dash-widget-head-right">
          <span className="dash-habits-counter">{activeCount}</span>
          <button
            className="dash-add-btn"
            title="Новая задача"
            disabled={lists.length === 0}
            onClick={() => setAddOpen(true)}
          >
            +
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dash-widget-empty">Загрузка...</div>
      ) : error ? (
        <div className="dash-widget-empty">Не удалось загрузить задачи</div>
      ) : tasks.length === 0 ? (
        <div className="dash-widget-empty">Активных задач нет</div>
      ) : (
        <ul className="dash-todo-list">
          {tasks.map(t => {
            const key = String(t.id)
            const color = priorityMeta(t.priority).color
            const isPending = key in countdown
            const isExiting = exiting.has(key)
            const done = isPending || isExiting
            return (
              <li key={t.id} className={isExiting ? 'dash-todo-leave' : undefined}>
                <div className={`dash-todo-item${done ? ' dash-todo-item--done' : ''}`}>
                  <button
                    className="dash-todo-main"
                    onClick={() => complete(t)}
                    disabled={done}
                  >
                    <span
                      className="dash-todo-check"
                      style={done ? undefined : { borderColor: color }}
                    >
                      {done && CheckIcon}
                    </span>
                    <span className="dash-todo-text">{t.title}</span>
                  </button>
                  {isPending && (
                    <button className="dash-todo-undo" onClick={() => undo(t)}>
                      Отменить {countdown[key]}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {addOpen && lists.length > 0 && (
        <TaskFormModal
          title="Новая задача"
          lists={lists}
          defaultListId={lists[0].id}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  )
}
