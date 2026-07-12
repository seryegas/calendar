import { useMemo } from 'react'
import { DayGrid } from '../../../widgets/calendar/grids/day/DayGrid'
import { HabitsToday } from './HabitsToday'
import { TodoList } from './TodoList'
import { MonthlyDonuts } from './MonthlyDonuts'
import './DashboardPage.css'

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function DashboardPage() {
  const today = useMemo(() => new Date(), [])

  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const monthKey = `${year}-${pad(month)}`
  const dateKey = `${monthKey}-${pad(day)}`
  const humanDate = `${day} ${MONTHS_GEN[today.getMonth()]}, ${WEEKDAYS[today.getDay()]}`

  return (
    <div className="dash-page">
      <div className="dash-left">
        <div className="dash-left-head">
          <span className="dash-left-title">Сегодня</span>
          <span className="dash-left-date">{humanDate}</span>
        </div>
        <div className="dash-calendar">
          <DayGrid date={today} />
        </div>
      </div>

      <div className="dash-right">
        <HabitsToday monthKey={monthKey} dateKey={dateKey} />
        <TodoList />
        <MonthlyDonuts year={year} month={month} />
      </div>
    </div>
  )
}
