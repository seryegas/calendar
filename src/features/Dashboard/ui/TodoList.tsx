import { useState, useEffect } from 'react'
import type { Task } from '../../Tasks/model/types'
import { priorityMeta } from '../../Tasks/model/types'
import { fetchTasks, setTaskDone } from '../../Tasks/storage/taskApi'

const LIMIT = 10

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchTasks({ status: 'active', limit: LIMIT })
      .then(data => { if (!cancelled) setTasks(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function complete(task: Task) {
    // закрытая задача уходит из активного списка
    setTasks(prev => prev.filter(t => t.id !== task.id))
    try {
      await setTaskDone(task.id, true)
    } catch {
      setTasks(prev => [...prev, task])
    }
  }

  return (
    <div className="dash-widget dash-todo">
      <div className="dash-widget-head">
        <span className="dash-widget-title">Текущие дела</span>
        <span className="dash-habits-counter">{tasks.length}</span>
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
            const color = priorityMeta(t.priority).color
            return (
              <li key={t.id}>
                <button className="dash-todo-item" onClick={() => complete(t)}>
                  <span className="dash-todo-check" style={{ borderColor: color }} />
                  <span className="dash-todo-text">{t.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
