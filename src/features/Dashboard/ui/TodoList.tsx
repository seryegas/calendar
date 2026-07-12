import { useState } from 'react'

type Todo = { id: number; text: string; done: boolean }

// TODO: replace mock with backend data
const MOCK_TODOS: Todo[] = [
  { id: 1, text: 'Ответить на письма', done: false },
  { id: 2, text: 'Созвон с командой 15:00', done: false },
  { id: 3, text: 'Ревью MR', done: true },
  { id: 4, text: 'Купить продукты', done: false },
  { id: 5, text: 'Прогулка 30 мин', done: false },
  { id: 6, text: 'Оплатить счета', done: false },
  { id: 7, text: 'Записаться к врачу', done: true },
  { id: 8, text: 'Прочитать главу книги', done: false },
  { id: 9, text: 'Разобрать почту в Telegram', done: false },
  { id: 10, text: 'Обновить резюме', done: false },
  { id: 11, text: 'Позвонить родителям', done: false },
  { id: 12, text: 'Тренировка в зале', done: true },
  { id: 13, text: 'Спланировать неделю', done: false },
  { id: 14, text: 'Забрать посылку', done: false },
  { id: 15, text: 'Полить цветы', done: false },
]

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(MOCK_TODOS)

  function toggle(id: number) {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const doneCount = todos.filter(t => t.done).length

  return (
    <div className="dash-widget dash-todo">
      <div className="dash-widget-head">
        <span className="dash-widget-title">Текущие дела</span>
        <span className="dash-habits-counter">{doneCount}/{todos.length}</span>
      </div>
      <ul className="dash-todo-list">
        {todos.map(t => (
          <li key={t.id}>
            <button
              className={`dash-todo-item${t.done ? ' dash-todo-item--done' : ''}`}
              onClick={() => toggle(t.id)}
            >
              <span className="dash-todo-check">
                {t.done && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="dash-todo-text">{t.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
