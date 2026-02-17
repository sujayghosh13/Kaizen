import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { TaskChip } from './TaskChip';
import { getHoliday } from '../data/holidays';
import { useSwipe } from '../hooks/useSwipe';
import './CalendarGrid.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const HOUR_HEIGHT = 48; // px per hour, must match CSS .grid-hour-cell height

/**
 * Format hour index (0-23) to label like "1 AM", "12 PM", etc.
 */
function formatHourLabel(h) {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
}

/**
 * Get the array of dates for a given week (Sun–Sat) containing `date`.
 */
function getWeekDates(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
    });
}

/**
 * Convert "HH:MM" to fractional hours (e.g., "09:30" → 9.5).
 */
function timeToFraction(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
}

/**
 * Format a Date as "YYYY-MM-DD".
 */
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * CalendarGrid — The main weekly (or daily) time-slot grid.
 */
export function CalendarGrid({
    currentDate,
    view,
    tasks,
    onSlotClick,
    onTaskClick,
    onPrev,
    onNext
}) {
    const scrollRef = useRef(null);
    const [now, setNow] = useState(new Date());
    const { handlers: swipeHandlers, style: swipeStyle } = useSwipe(onNext, onPrev);

    // Wheel / trackpad scroll navigation (debounced)
    const wheelTimer = useRef(null);
    const handleWheel = useCallback((e) => {
        // Use deltaX for trackpad horizontal, deltaY for mouse wheel
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) < 10) return; // ignore tiny movements
        if (wheelTimer.current) return; // debounce
        wheelTimer.current = setTimeout(() => { wheelTimer.current = null; }, 300);
        if (delta > 0) onNext();
        else onPrev();
    }, [onNext, onPrev]);

    // Update current time every minute for the red line indicator
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to ~8 AM on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 8 * HOUR_HEIGHT - 20;
        }
    }, []);

    /** Days to render: 1 for day view, 7 for week view. */
    const visibleDates = useMemo(() => {
        if (view === 'day') {
            return [new Date(currentDate)];
        }
        return getWeekDates(currentDate);
    }, [currentDate, view]);

    /** Group tasks by their date string for efficient lookup. */
    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach(task => {
            if (!map[task.date]) map[task.date] = [];
            map[task.date].push(task);
        });
        return map;
    }, [tasks]);

    const todayStr = toDateStr(new Date());
    const selectedStr = toDateStr(currentDate);

    return (
        <div
            className="calendar-grid-wrapper"
            {...swipeHandlers}
            style={swipeStyle}
            onWheel={handleWheel}
        >
            {/* Day header row */}
            <div className="grid-day-header">
                <div className="gutter-spacer" />
                <div className="day-header-cells">
                    {visibleDates.map((date, i) => {
                        const dateStr = toDateStr(date);
                        const isToday = dateStr === todayStr;
                        const holiday = getHoliday(dateStr);
                        return (
                            <div key={i} className={`day-header-cell ${isToday ? 'today' : ''} ${holiday ? 'holiday' : ''} ${dateStr === selectedStr && !isToday ? 'selected' : ''}`}>
                                <div className="day-header-dow">{DAYS_SHORT[date.getDay()]}</div>
                                <div className="day-header-date">{date.getDate()}</div>
                                {holiday && (
                                    <div className="day-header-holiday">
                                        {holiday.emoji} {holiday.name}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scrollable time grid */}
            <div className="grid-scroll-area" ref={scrollRef}>
                <div className="grid-body" style={{ height: 24 * HOUR_HEIGHT }}>
                    {/* Time gutter */}
                    <div className="time-gutter">
                        {HOURS.map(h => (
                            h > 0 && (
                                <span
                                    key={h}
                                    className="time-gutter-label"
                                    style={{ top: h * HOUR_HEIGHT }}
                                >
                                    {formatHourLabel(h)}
                                </span>
                            )
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className="grid-columns">
                        {visibleDates.map((date, colIdx) => {
                            const dateStr = toDateStr(date);
                            const isToday = dateStr === todayStr;
                            const dayTasks = tasksByDate[dateStr] || [];

                            return (
                                <div key={colIdx} className={`grid-day-column ${dateStr === selectedStr ? 'selected' : ''}`}>
                                    {/* Hour cells */}
                                    {HOURS.map(h => (
                                        <div
                                            key={h}
                                            className="grid-hour-cell"
                                            onClick={() => onSlotClick(date, `${String(h).padStart(2, '0')}:00`)}
                                        />
                                    ))}

                                    {/* Task chips */}
                                    {dayTasks.map(task => {
                                        const startFrac = timeToFraction(task.startTime);
                                        const endFrac = timeToFraction(task.endTime);
                                        const duration = Math.max(endFrac - startFrac, 0.5); // min 30 min display

                                        return (
                                            <TaskChip
                                                key={task.id}
                                                task={task}
                                                onClick={onTaskClick}
                                                style={{
                                                    top: startFrac * HOUR_HEIGHT,
                                                    height: duration * HOUR_HEIGHT - 2,
                                                }}
                                            />
                                        );
                                    })}

                                    {/* Current time indicator */}
                                    {isToday && (
                                        <div
                                            className="current-time-line"
                                            style={{
                                                top: (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
