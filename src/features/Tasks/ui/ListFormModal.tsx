import { useState, useEffect } from 'react'
import { LIST_COLORS } from '../model/types'
import type { TaskList } from '../model/types'
import './modal.css'

export function ListFormModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string
  initial?: TaskList
  onSave: (name: string, color: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? LIST_COLORS[0])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const valid = name.trim().length > 0

  function submit() {
    if (valid) onSave(name.trim(), color)
  }

  return (
    <div className="tk-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="tk-modal tk-modal--sm" onMouseDown={e => e.stopPropagation()}>
        <div className="tk-modal-head">
          <span className="tk-modal-title">{title}</span>
          <button className="tk-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="tk-modal-body">
          <label className="tk-field">
            <span className="tk-field-label">Название списка</span>
            <input
              className="tk-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="Например: Покупки"
              autoFocus
            />
          </label>

          <div className="tk-field">
            <span className="tk-field-label">Цвет</span>
            <div className="tk-swatches">
              {LIST_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`tk-swatch${color === c ? ' tk-swatch--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
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
