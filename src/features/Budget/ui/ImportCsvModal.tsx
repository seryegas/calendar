import { useMemo, useState } from 'react'
import type { BudgetKind } from '../model/types'
import { categoriesOf } from '../model/types'
import type { NewTransaction } from '../model/transaction'
import type { ParsedCsv, BankPreset } from '../model/csv'
import {
  BANK_PRESETS,
  parseCsv,
  detectDelimiter,
  parseAmount,
  parseDate,
  findColumn,
  guessCategory,
} from '../model/csv'
import './modals.css'

interface ReviewRow {
  key: number
  date: string | null
  amount: number   // модуль
  kind: BudgetKind
  categoryId: number
  desc: string
  include: boolean
}

type ColMap = { date: number; amount: number; category: number; desc: number }

export function ImportCsvModal({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (txs: NewTransaction[]) => Promise<number>
}) {
  const [preset, setPreset] = useState<BankPreset>(BANK_PRESETS[0])
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [map, setMap] = useState<ColMap>({ date: -1, amount: -1, category: -1, desc: -1 })
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [imported, setImported] = useState<number | null>(null)

  async function handleFile(file: File) {
    setError('')
    setImported(null)
    try {
      const buf = await file.arrayBuffer()
      const text = new TextDecoder(preset.encoding).decode(buf)
      const delim = preset.delimiter || detectDelimiter(text)
      const p = parseCsv(text, delim)
      if (p.headers.length === 0) {
        setError('Файл пуст или не распознан')
        return
      }
      const m: ColMap = {
        date: findColumn(p.headers, preset.cols.date),
        amount: findColumn(p.headers, preset.cols.amount),
        category: findColumn(p.headers, preset.cols.category ?? ''),
        desc: findColumn(p.headers, preset.cols.desc ?? ''),
      }
      setParsed(p)
      setMap(m)
      setFileName(file.name)
      setRows(buildRows(p, m))
    } catch (e) {
      setError('Не удалось прочитать файл: ' + (e as Error).message)
    }
  }

  function remap(field: keyof ColMap, col: number) {
    const m = { ...map, [field]: col }
    setMap(m)
    if (parsed) setRows(buildRows(parsed, m))
  }

  function setRow(key: number, patch: Partial<ReviewRow>) {
    setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)))
  }

  const includedValid = useMemo(
    () => rows.filter(r => r.include && r.date && r.amount > 0),
    [rows],
  )

  async function doImport() {
    const txs: NewTransaction[] = includedValid.map(r => ({
      date: r.date!,
      kind: r.kind,
      categoryId: r.categoryId,
      amount: r.amount,
      note: r.desc || undefined,
      source: preset.id,
      extId: `${preset.id}:${r.date}:${r.amount}:${r.desc}`,
    }))
    const added = await onImport(txs)
    setImported(added)
  }

  return (
    <div className="bg-modal-overlay" onMouseDown={onClose}>
      <div className="bg-modal bg-modal--wide" onMouseDown={e => e.stopPropagation()}>
        <div className="bg-modal-head">
          <span className="bg-modal-title">Импорт CSV</span>
          <button className="bg-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="bg-modal-body">
          <div className="bg-import-controls">
            <label className="bg-field bg-field--inline">
              <span className="bg-field-label">Банк</span>
              <select
                className="bg-input"
                value={preset.id}
                onChange={e => {
                  const p = BANK_PRESETS.find(b => b.id === e.target.value)!
                  setPreset(p)
                  setParsed(null)
                  setRows([])
                  setFileName('')
                }}
              >
                {BANK_PRESETS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>

            <label className="bg-file-btn">
              {fileName || 'Выбрать CSV-файл'}
              <input
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {error && <div className="bg-import-error">{error}</div>}

          {parsed && (
            <>
              <div className="bg-map-grid">
                {(['date', 'amount', 'category', 'desc'] as const).map(f => (
                  <label key={f} className="bg-field bg-field--inline">
                    <span className="bg-field-label">{MAP_LABELS[f]}</span>
                    <select
                      className="bg-input"
                      value={map[f]}
                      onChange={e => remap(f, Number(e.target.value))}
                    >
                      <option value={-1}>—</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Колонка ${i + 1}`}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="bg-import-summary">
                Найдено строк: {rows.length} · к импорту: <b>{includedValid.length}</b>
                {(map.date < 0 || map.amount < 0) && (
                  <span className="bg-import-warn"> — укажите колонки «Дата» и «Сумма»</span>
                )}
              </div>

              <div className="bg-preview-wrap">
                <table className="bg-preview">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Дата</th>
                      <th>Тип</th>
                      <th>Сумма</th>
                      <th>Категория</th>
                      <th>Описание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 200).map(r => (
                      <tr key={r.key} className={!r.date || r.amount <= 0 ? 'bg-preview-row--bad' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={r.include}
                            onChange={e => setRow(r.key, { include: e.target.checked })}
                          />
                        </td>
                        <td>{r.date ?? '—'}</td>
                        <td>
                          <span className={`bg-tag bg-tag--${r.kind}`}>
                            {r.kind === 'income' ? 'Доход' : 'Расход'}
                          </span>
                        </td>
                        <td className="bg-preview-amount">{r.amount > 0 ? r.amount.toLocaleString('ru-RU') : '—'}</td>
                        <td>
                          <select
                            className="bg-preview-select"
                            value={r.categoryId}
                            onChange={e => setRow(r.key, { categoryId: Number(e.target.value) })}
                          >
                            {categoriesOf(r.kind).map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="bg-preview-desc" title={r.desc}>{r.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 200 && (
                  <div className="bg-preview-more">…показаны первые 200 из {rows.length}</div>
                )}
              </div>
            </>
          )}

          {imported !== null && (
            <div className="bg-import-done">✓ Импортировано: {imported} (дубли пропущены)</div>
          )}
        </div>

        <div className="bg-modal-foot">
          <button className="bg-btn bg-btn--ghost" onClick={onClose}>Закрыть</button>
          <button
            className="bg-btn bg-btn--primary"
            onClick={doImport}
            disabled={includedValid.length === 0}
          >
            Импортировать ({includedValid.length})
          </button>
        </div>
      </div>
    </div>
  )
}

const MAP_LABELS: Record<keyof ColMap, string> = {
  date: 'Дата',
  amount: 'Сумма',
  category: 'Категория банка',
  desc: 'Описание',
}

function buildRows(parsed: ParsedCsv, map: ColMap): ReviewRow[] {
  return parsed.rows.map((cells, i) => {
    const rawAmount = map.amount >= 0 ? cells[map.amount] ?? '' : ''
    const signed = parseAmount(rawAmount)
    const amount = isNaN(signed) ? 0 : Math.abs(signed)
    const kind: BudgetKind = signed < 0 ? 'expense' : 'income'
    const date = map.date >= 0 ? parseDate(cells[map.date] ?? '') : null
    const bankCat = map.category >= 0 ? cells[map.category] ?? '' : ''
    const desc = map.desc >= 0 ? cells[map.desc] ?? '' : ''
    return {
      key: i,
      date,
      amount,
      kind,
      categoryId: guessCategory(kind, bankCat, desc),
      desc,
      include: !!date && amount > 0,
    }
  })
}
