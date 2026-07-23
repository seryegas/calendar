import type { Task, TaskInput, TaskList, TaskDto, TaskListDto } from '../model/types'

const HOST = import.meta.env.VITE_HOST || ''
const PORT = import.meta.env.VITE_PORT || ''
const API_PART = import.meta.env.VITE_API_PART || ''
const API_URL = `http://${HOST}:${PORT}/${API_PART}`

// ===== mapping =====
function listFromDto(d: TaskListDto): TaskList {
  return { id: d.id, name: d.name, color: d.color }
}

function taskFromDto(d: TaskDto): Task {
  return {
    id: d.id,
    listId: d.list_id,
    parentId: d.parent_id ?? null,
    title: d.title,
    description: d.description || undefined,
    priority: d.priority,
    dueDate: d.due_date || undefined,
    deadline: d.deadline || undefined,
    done: d.done,
  }
}

function taskToPayload(t: TaskInput) {
  return {
    list_id: t.listId,
    parent_id: t.parentId ?? null,
    title: t.title,
    description: t.description ?? '',
    priority: t.priority,
    due_date: t.dueDate ?? null,
    deadline: t.deadline ?? null,
  }
}

// ===== lists =====
export async function fetchLists(): Promise<TaskList[]> {
  const res = await fetch(`${API_URL}/task-lists`)
  if (!res.ok) throw new Error(`Failed to fetch lists: ${res.status}`)
  const docs = await res.json()
  return (docs as TaskListDto[]).map(listFromDto)
}

export async function createList(name: string, color: string): Promise<TaskList> {
  const res = await fetch(`${API_URL}/task-lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  })
  if (!res.ok) throw new Error(`Failed to create list: ${res.status}`)
  return listFromDto(await res.json())
}

export async function updateList(id: number, name: string, color: string): Promise<TaskList> {
  const res = await fetch(`${API_URL}/task-lists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  })
  if (!res.ok) throw new Error(`Failed to update list: ${res.status}`)
  return listFromDto(await res.json())
}

export async function deleteList(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/task-lists/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete list: ${res.status}`)
}

// ===== tasks =====
export type TaskQuery = {
  listId?: number
  status?: 'active' | 'done' | 'all'
  limit?: number
}

export async function fetchTasks(q: TaskQuery = {}): Promise<Task[]> {
  const url = new URL(`${API_URL}/tasks`)
  if (q.listId != null) url.searchParams.set('list_id', String(q.listId))
  if (q.status && q.status !== 'all') url.searchParams.set('status', q.status)
  if (q.limit != null) url.searchParams.set('limit', String(q.limit))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`)
  const docs = await res.json()
  return (docs as TaskDto[]).map(taskFromDto)
}

export async function createTask(t: TaskInput): Promise<Task> {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskToPayload(t)),
  })
  if (!res.ok) throw new Error(`Failed to create task: ${res.status}`)
  return taskFromDto(await res.json())
}

export async function updateTask(id: number, t: TaskInput): Promise<Task> {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskToPayload(t)),
  })
  if (!res.ok) throw new Error(`Failed to update task: ${res.status}`)
  return taskFromDto(await res.json())
}

export async function setTaskDone(id: number, done: boolean): Promise<void> {
  const res = await fetch(`${API_URL}/tasks/${id}/done`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  })
  if (!res.ok) throw new Error(`Failed to toggle task: ${res.status}`)
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete task: ${res.status}`)
}
