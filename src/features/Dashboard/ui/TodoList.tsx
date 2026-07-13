import { useState, useEffect } from 'react'
import type { Task, TaskInput, TaskList } from '../../Tasks/model/types'
import { priorityMeta } from '../../Tasks/model/types'
import { fetchTasks, fetchLists, createTask, setTaskDone } from '../../Tasks/storage/taskApi'
import { TaskFormModal } from '../../Tasks/ui/TaskFormModal'

const LIMIT = 10

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<TaskList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    Promise.all([
      fetchTasks({ status: 'active', limit: LIMIT }),
      fetchLists(),
    ])
      .then(([t, l]) => { if (!cancelled) { setTasks(t); setLists(l) } })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadTick])

  async function complete(task: Task) {
    // закрытая задача уходит из активного списка
    setTasks(prev => prev.filter(t => t.id !== task.id))
    try {
      await setTaskDone(task.id, true)
    } catch {
      setTasks(prev => [...prev, task])
    }
  }

  async function handleAdd(input: TaskInput) {
    await createTask(input)
    setAddOpen(false)
    setReloadTick(t => t + 1)
  }

  return (
    <div className="dash-widget dash-todo">
      <div className="dash-widget-head">
        <span className="dash-widget-title">Текущие дела</span>
        <div className="dash-widget-head-right">
          <span className="dash-habits-counter">{tasks.length}</span>
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
