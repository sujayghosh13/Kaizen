import { useMemo, useRef, useCallback } from 'react';
import { getHoliday } from '../data/holidays';
import { useSwipe } from '../hooks/useSwipe';
import './MonthView.css';

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MAX_VISIBLE_TASKS = 3;

/**
 * Format a Date as "YYYY-MM-DD".
 */
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Format time "HH:MM" to short display.
 */
function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return m > 0 ? `${hour}:${String(m).padStart(2, '0')} ${ampm}` : `${hour} ${ampm}`;
}

/**
 * Build the grid of days for the current month view (6 rows × 7 cols).
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
 * MonthView — Full monthly calendar grid with task bars.
 * Clicking a cell navigates to day view. Clicking a task opens editing.
 */
export function MonthView({ currentDate, tasks, onSlotClick, onTaskClick, onPrev, onNext }) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const todayStr = toDateStr(new Date());
    const days = useMemo(() => buildMonthDays(year, month), [year, month]);
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

    /** Group tasks by date. */
    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            if (!map[t.date]) map[t.date] = [];
            map[t.date].push(t);
        });
        // Sort tasks within each day by start time
        Object.values(map).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
        return map;
    }, [tasks]);

    return (
        <div
            className="month-view"
            {...swipeHandlers}
            style={swipeStyle}
            onWheel={handleWheel}
        >
            {/* Day-of-week header */}
            <div className="month-dow-header">
                {DAYS_OF_WEEK.map((d, i) => (
                    <div key={i} className="month-dow-cell">{d}</div>
                ))}
            </div>

            {/* Month grid */}
            <div className="month-grid">
                {days.map(({ date, otherMonth }, i) => {
                    const dateStr = toDateStr(date);
                    const isToday = dateStr === todayStr;
                    const dayTasks = tasksByDate[dateStr] || [];
                    const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
                    const extraCount = dayTasks.length - MAX_VISIBLE_TASKS;

                    return (
                        <div
                            key={i}
                            className={`month-day-cell ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => onSlotClick(date, '09:00')}
                        >
                            <div className="month-day-number">{date.getDate()}</div>
                            {(() => {
                                const holiday = getHoliday(dateStr);
                                return holiday ? (
                                    <div className="month-holiday-label">
                                        {holiday.emoji} {holiday.name}
                                    </div>
                                ) : null;
                            })()}
                            <div className="month-task-list">
                                {visibleTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`month-task-bar cat-${task.category} ${task.completed ? 'completed' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTaskClick(task);
                                        }}
                                        title={`${formatTime(task.startTime)} ${task.title}`}
                                    >
                                        {formatTime(task.startTime)} {task.title}
                                    </div>
                                ))}
                                {extraCount > 0 && (
                                    <div className="month-more-tasks">+{extraCount} more</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
