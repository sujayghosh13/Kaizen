import { useState, useEffect, useMemo } from 'react';
import { ThemePicker } from './ThemePicker';
import './CalendarHeader.css';

/**
 * Month names for the header display.
 */
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * CalendarHeader — Top toolbar mimicking Google Calendar.
 */
export function CalendarHeader({
    currentDate,
    view,
    sidebarOpen,
    currentTheme,
    alertsEnabled,
    onToggleSidebar,
    onToday,
    onPrev,
    onNext,
    onViewChange,
    onThemeChange,
    onToggleAlerts
}) {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    /** Cycle through views: week → month → year → week */
    const handleDateLabelClick = () => {
        const cycle = { day: 'month', week: 'month', month: 'year', year: 'week' };
        onViewChange(cycle[view] || 'month');
    };

    /** Format the displayed date based on the active view. */
    const dateLabel = useMemo(() => {
        const month = MONTHS[currentDate.getMonth()];
        const year = currentDate.getFullYear();

        if (view === 'year') return `${year}`;
        if (view === 'month') return `${month} ${year}`;
        if (view === 'day') return `${month} ${currentDate.getDate()}, ${year}`;

        // Week view
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const startMonth = MONTHS[startOfWeek.getMonth()];
        const endMonth = MONTHS[endOfWeek.getMonth()];

        if (startMonth === endMonth) return `${startMonth} ${startOfWeek.getFullYear()}`;
        return `${startMonth} – ${endMonth} ${endOfWeek.getFullYear()}`;
    }, [currentDate, view]);

    /** Format the real-time clock (HH:MM:SS AM/PM) */
    const timeLabel = useMemo(() => {
        return currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }, [currentTime]);

    return (
        <header className="calendar-header">
            {/* Left — Hamburger + Logo */}
            <div className="header-left">
                <button className="hamburger-btn" onClick={onToggleSidebar}
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="header-logo">
                    <div className="header-logo-icon">K</div>
                    <span className="header-logo-text">Kaizen</span>
                </div>
            </div>

            {/* Center — Navigation */}
            <nav className="header-nav">
                <button className="today-btn" onClick={onToday}>Today</button>
                <div className="header-nav-arrows">
                    <button className="nav-arrow" onClick={onPrev} title="Previous">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="nav-arrow" onClick={onNext} title="Next">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
                <div className="header-date-container">
                    <h2
                        className="header-date"
                        onClick={handleDateLabelClick}
                        title="Click to change time scale"
                    >{dateLabel}</h2>
                    <div className="header-clock">{timeLabel}</div>
                </div>
            </nav>

            {/* Right — View Switcher + Theme Picker */}
            <div className="header-right">
                <div className="view-switcher">
                    <button className={`view-btn ${view === 'day' ? 'active' : ''}`}
                        onClick={() => onViewChange('day')}>Day</button>
                    <button className={`view-btn ${view === 'week' ? 'active' : ''}`}
                        onClick={() => onViewChange('week')}>Week</button>
                    <button className={`view-btn ${view === 'month' ? 'active' : ''}`}
                        onClick={() => onViewChange('month')}>Month</button>
                    <button className={`view-btn ${view === 'year' ? 'active' : ''}`}
                        onClick={() => onViewChange('year')}>Year</button>
                </div>

                {/* Alert Toggle */}
                <button
                    className={`alert-toggle-btn ${alertsEnabled ? 'active' : ''}`}
                    onClick={onToggleAlerts}
                    title={alertsEnabled ? 'Alerts ON — click to disable' : 'Alerts OFF — click to enable'}
                >
                    <span className="material-symbols-outlined">
                        {alertsEnabled ? 'notifications_active' : 'notifications_off'}
                    </span>
                </button>

                {/* Theme Picker */}
                <ThemePicker
                    currentTheme={currentTheme}
                    onThemeChange={onThemeChange}
                />
            </div>
        </header>
    );
}
