import { useState, useMemo, useCallback, useRef } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import './CalendarSidebar.css';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Category definitions with colors matching CSS variables.
 */
const CATEGORIES = [
    { id: 'personal', label: 'Personal', color: '#7986cb' },
    { id: 'work', label: 'Work', color: '#039be5' },
    { id: 'health', label: 'Health', color: '#33b679' },
    { id: 'learning', label: 'Learning', color: '#f6bf26' },
];

/**
 * CalendarSidebar — Left panel with create button, mini calendar, and category filters.
 */
export function CalendarSidebar({
    currentDate,
    sidebarOpen,
    tasks,
    activeCategories,
    onDateSelect,
    onCreateTask,
    onSmartDecompose,
    onToggleCategory,
    onCreateFromCategory,
    onDeleteCategoryTasks
}) {
    // Separate month state for the mini calendar so it can navigate independently
    const [miniMonth, setMiniMonth] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

    /** Build the grid of days for the mini calendar. */
    const calendarDays = useMemo(() => {
        const year = miniMonth.getFullYear();
        const month = miniMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, daysInPrevMonth - i),
                otherMonth: true
            });
        }

        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({
                date: new Date(year, month, d),
                otherMonth: false
            });
        }

        // Next month padding (fill to 42 = 6 rows)
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            days.push({
                date: new Date(year, month + 1, d),
                otherMonth: true
            });
        }

        return days;
    }, [miniMonth]);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const selectedStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;

    /** Count tasks per category. */
    const categoryCounts = useMemo(() => {
        const counts = {};
        CATEGORIES.forEach(c => counts[c.id] = 0);
        tasks.forEach(t => {
            if (counts[t.category] !== undefined) {
                counts[t.category]++;
            }
        });
        return counts;
    }, [tasks]);

    const handleMiniPrev = useCallback(() => {
        setMiniMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const handleMiniNext = useCallback(() => {
        setMiniMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    // Swipe support for mini calendar
    const { handlers: miniSwipeHandlers, style: miniSwipeStyle } = useSwipe(handleMiniNext, handleMiniPrev, 50);

    // Wheel / trackpad scroll for mini calendar
    const miniWheelTimer = useRef(null);
    const handleMiniWheel = useCallback((e) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) < 10) return;
        if (miniWheelTimer.current) return;
        miniWheelTimer.current = setTimeout(() => { miniWheelTimer.current = null; }, 300);
        e.stopPropagation(); // don't bubble to main calendar
        if (delta > 0) handleMiniNext();
        else handleMiniPrev();
    }, [handleMiniNext, handleMiniPrev]);

    return (
        <aside className={`calendar-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
            {/* Create Task Button */}
            <button className="create-task-btn" onClick={onCreateTask}>
                <span className="material-symbols-outlined">add</span>
                Create
            </button>

            {/* Smart Decompose Button */}
            <button className="smart-decompose-trigger" onClick={onSmartDecompose}>
                <span className="material-symbols-outlined">auto_awesome</span>
                Smart Decompose
            </button>

            {/* Mini Calendar */}
            <div className="mini-calendar" {...miniSwipeHandlers} style={miniSwipeStyle} onWheel={handleMiniWheel}>
                <div className="mini-cal-header">
                    <span className="mini-cal-title">
                        {MONTH_NAMES[miniMonth.getMonth()]} {miniMonth.getFullYear()}
                    </span>
                    <div className="mini-cal-nav">
                        <button onClick={handleMiniPrev}>
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button onClick={handleMiniNext}>
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="mini-cal-grid">
                    {DAYS_OF_WEEK.map((d, i) => (
                        <span key={i} className="mini-cal-dow">{d}</span>
                    ))}
                    {calendarDays.map(({ date, otherMonth }, i) => {
                        const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedStr;

                        return (
                            <button
                                key={i}
                                className={`mini-cal-day ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => onDateSelect(date)}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Categories */}
            <div>
                <div className="sidebar-section-title">My Calendars</div>
                <div className="category-list">
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategories?.has(cat.id) ?? true;
                        return (
                            <div
                                key={cat.id}
                                className={`category-item ${isActive ? '' : 'inactive'}`}
                            >
                                <span
                                    className="category-dot"
                                    onClick={() => onToggleCategory?.(cat.id)}
                                    style={{
                                        background: isActive ? cat.color : 'transparent',
                                        border: `2px solid ${cat.color}`
                                    }}
                                >
                                    {isActive && (
                                        <span className="material-symbols-outlined category-check">check</span>
                                    )}
                                </span>
                                <span
                                    className="category-label"
                                    onClick={() => onToggleCategory?.(cat.id)}
                                >{cat.label}</span>
                                <span className="category-count">{categoryCounts[cat.id]}</span>
                                <div className="category-actions">
                                    <button
                                        className="category-action-btn"
                                        onClick={(e) => { e.stopPropagation(); onCreateFromCategory?.(cat.id); }}
                                        title={`Add ${cat.label} task`}
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                    {categoryCounts[cat.id] > 0 && (
                                        <button
                                            className="category-action-btn delete"
                                            onClick={(e) => { e.stopPropagation(); onDeleteCategoryTasks?.(cat.id); }}
                                            title={`Delete all ${cat.label} tasks`}
                                        >
                                            <span className="material-symbols-outlined">delete_outline</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
