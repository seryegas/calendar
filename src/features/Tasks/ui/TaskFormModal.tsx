import { useState, useEffect } from 'react'
import { PRIORITIES } from '../model/types'
import type { Priority, Task, TaskInput, TaskList } from '../model/types'
import './modal.css'

export function TaskFormModal({
  title,
  lists,
  defaultListId,
  initial,
  parentId = null,
  onSave,
  onClose,
}: {
  title: string
  lists: TaskList[]
  defaultListId: number
  initial?: Task
  parentId?: number | null // задан => создаём подзадачу, список наследуется от родителя
  onSave: (input: TaskInput) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'current')
  const [listId, setListId] = useState<number>(initial?.listId ?? defaultListId)
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')

  // подзадача наследует список родителя — селектор списка прячем
  const isSubtask = (initial?.parentId ?? parentId) != null

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const valid = name.trim().length > 0 && listId != null

  function submit() {
    if (!valid) return
    onSave({
      listId,
      parentId: initial?.parentId ?? parentId,
      title: name.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      deadline: deadline || undefined,
    })
  }

  return (
    <div className="tk-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className="tk-modal"
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => {
          // Enter сохраняет; в описании (textarea) оставляем перенос строки
          if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault()
            submit()
          }
        }}
      >
        <div className="tk-modal-head">
          <span className="tk-modal-title">{title}</span>
          <button className="tk-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="tk-modal-body">
          <label className="tk-field">
            <span className="tk-field-label">Название</span>
            <input
              className="tk-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Что нужно сделать"
              autoFocus
            />
          </label>

          <label className="tk-field">
            <span className="tk-field-label">Описание</span>
            <textarea
              className="tk-input tk-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="необязательно"
              rows={3}
            />
          </label>

          <div className="tk-field">
            <span className="tk-field-label">Приоритет</span>
            <div className="tk-prio-switch">
              {PRIORITIES.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`tk-prio-btn${priority === p.id ? ' tk-prio-btn--active' : ''}`}
                  style={priority === p.id ? { borderColor: p.color, color: p.color } : undefined}
                  onClick={() => setPriority(p.id)}
                >
                  <span className="tk-prio-dot" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {!isSubtask && (
            <label className="tk-field">
              <span className="tk-field-label">Список</span>
              <select className="tk-input" value={listId} onChange={e => setListId(Number(e.target.value))}>
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
          )}

          <div className="tk-field-row">
            <label className="tk-field">
              <span className="tk-field-label">Дата выполнения</span>
              <input type="date" className="tk-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </label>
            <label className="tk-field">
              <span className="tk-field-label">Дедлайн</span>
              <input type="date" className="tk-input" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="tk-modal-foot">
          <button className="tk-btn tk-btn--ghost" onClick={onClose}>Отмена</button>
          <button className="tk-btn tk-btn--primary" onClick={submit} disabled={!valid}>Сохранить</button>
        </div>
      </div>
    </div>
  )
}
