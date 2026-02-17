import { useMemo, useRef, useCallback } from 'react';
import { getHoliday } from '../data/holidays';
import { useSwipe } from '../hooks/useSwipe';
import './YearView.css';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Category colors for dot indicators. */
const CAT_COLORS = {
    personal: '#7986cb',
    work: '#039be5',
    health: '#33b679',
    learning: '#f6bf26',
};

/**
 * Format a Date as "YYYY-MM-DD".
 */
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Build the grid of days for a given month (with padding from prev/next months).
 */
function buildMonthDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        days.push({ date: new Date(year, month, d), otherMonth: false });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
        days.push({ date: new Date(year, month + 1, d), otherMonth: true });
    }
    return days;
}

/**
 * YearView — Overview of all 12 months with task dots.
 * Clicking a month navigates to week view for that month.
 * Clicking a day navigates to day view for that date.
 */
export function YearView({ currentDate, tasks, onDateSelect, onMonthSelect, onPrev, onNext }) {
    const year = currentDate.getFullYear();
    const todayStr = toDateStr(new Date());
    const { handlers: swipeHandlers, style: swipeStyle } = useSwipe(onNext, onPrev);

    // Wheel / trackpad scroll navigation
    const wheelTimer = useRef(null);
    const handleWheel = useCallback((e) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) < 10) return;
        if (wheelTimer.current) return;
        wheelTimer.current = setTimeout(() => { wheelTimer.current = null; }, 300);
        if (delta > 0) onNext();
        else onPrev();
    }, [onNext, onPrev]);

    /** Group tasks by date string for dot display. */
    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            if (!map[t.date]) map[t.date] = [];
            map[t.date].push(t);
        });
        return map;
    }, [tasks]);

    return (
        <div
            className="year-view"
            {...swipeHandlers}
            style={swipeStyle}
            onWheel={handleWheel}
        >
            <div className="year-grid">
                {MONTH_NAMES.map((monthName, monthIdx) => {
                    const days = buildMonthDays(year, monthIdx);
                    return (
                        <div
                            key={monthIdx}
                            className="year-month-card"
                            onClick={() => onMonthSelect(new Date(year, monthIdx, 1))}
                        >
                            <div className="year-month-name">{monthName}</div>
                            <div className="year-month-grid">
                                {DAYS_OF_WEEK.map((d, i) => (
                                    <span key={i} className="year-dow">{d}</span>
                                ))}
                                {days.map(({ date, otherMonth }, i) => {
                                    const dateStr = toDateStr(date);
                                    const isToday = dateStr === todayStr;
                                    const dayTasks = tasksByDate[dateStr] || [];
                                    // Show up to 3 dots
                                    const dots = dayTasks.slice(0, 3);

                                    return (
                                        <div
                                            key={i}
                                            className={`year-day ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${!otherMonth && getHoliday(dateStr) ? 'holiday' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!otherMonth) onDateSelect(date);
                                            }}
                                            title={(!otherMonth && getHoliday(dateStr)) ? getHoliday(dateStr).name : undefined}
                                        >
                                            {date.getDate()}
                                            {(dots.length > 0 || (!otherMonth && getHoliday(dateStr))) && !otherMonth && (
                                                <div className="year-day-dots">
                                                    {getHoliday(dateStr) && (
                                                        <span
                                                            className="year-task-dot holiday-dot"
                                                            style={{ background: '#d93025' }}
                                                        />
                                                    )}
                                                    {dots.map((t, di) => (
                                                        <span
                                                            key={di}
                                                            className="year-task-dot"
                                                            style={{ background: CAT_COLORS[t.category] || '#999' }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
