// ===== Priority =====
export type Priority = 'urgent' | 'important' | 'current'

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'urgent',    label: 'Срочный', color: '#ea4335' },
  { id: 'important', label: 'Важный',  color: '#f9ab00' },
  { id: 'current',   label: 'Текущий', color: '#34a853' },
]

export function priorityMeta(p: Priority) {
  return PRIORITIES.find(x => x.id === p) ?? PRIORITIES[2]
}

// палитра для кружочка списка
export const LIST_COLORS = [
  '#1a73e8', '#34a853', '#ea4335', '#f9ab00', '#a142f4',
  '#00acc1', '#ff6d00', '#e91e63', '#558b2f', '#9aa0a6',
]

// ===== Domain =====
export interface TaskList {
  id: number
  name: string
  color: string
}

export interface Task {
  id: number
  listId: number
  parentId: number | null // null => корневая задача
  title: string
  description?: string
  priority: Priority
  dueDate?: string   // YYYY-MM-DD, дата выполнения (опционально)
  deadline?: string  // YYYY-MM-DD, дедлайн (опционально)
  done: boolean
}

// поля для создания/редактирования (без id/done)
export type TaskInput = Omit<Task, 'id' | 'done'>

// максимальная глубина вложенности подзадач (корень = 0)
export const MAX_TASK_DEPTH = 8

// ===== DTO (снейк-кейс с бэкенда) =====
export interface TaskListDto {
  id: number
  name: string
  color: string
}

export interface TaskDto {
  id: number
  list_id: number
  parent_id?: number | null
  title: string
  description?: string | null
  priority: Priority
  due_date?: string | null
  deadline?: string | null
  done: boolean
}
