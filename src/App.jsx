import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarSidebar } from './components/CalendarSidebar';
import { CalendarGrid } from './components/CalendarGrid';
import { MonthView } from './components/MonthView';
import { YearView } from './components/YearView';
import { TaskModal } from './components/TaskModal';
import { SmartDecompose } from './components/SmartDecompose';
import { useTaskAlerts } from './hooks/useTaskAlerts';
import './App.css';

/**
 * LocalStorage keys for persistence.
 */
const STORAGE_KEY = 'kaizen_calendar_tasks';
const THEME_KEY = 'kaizen_theme';
const ALERTS_KEY = 'kaizen_alerts_enabled';

/**
 * Generate a unique task ID.
 */
function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Load tasks from localStorage.
 */
function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Save tasks to localStorage.
 */
function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Format a Date as "YYYY-MM-DD".
 */
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Expand recurring tasks into individual instances for a given date range.
 * This generates "virtual" task objects for each occurrence within the range.
 *
 * @param {Array} tasks - The raw task list from localStorage
 * @param {Date} rangeStart - Start of the visible date range
 * @param {Date} rangeEnd - End of the visible date range
 * @returns {Array} All tasks (one-time + expanded recurring instances)
 */
function expandRecurringTasks(tasks, rangeStart, rangeEnd) {
    const result = [];
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();

    for (const task of tasks) {
        if (!task.recurrence || task.recurrence === 'none') {
            // Non-recurring — include as-is
            result.push(task);
            continue;
        }

        // Determine recurrence end date
        const recEnd = task.recurrenceEnd
            ? new Date(task.recurrenceEnd + 'T23:59:59')
            : new Date(rangeEnd.getFullYear() + 1, 0, 1); // Default: ~1 year out

        const taskStartDate = new Date(task.date);
        let cursor = new Date(taskStartDate);

        // Generate occurrences by stepping through dates
        let safety = 0;
        while (cursor.getTime() <= Math.min(endMs, recEnd.getTime()) && safety < 1000) {
            safety++;

            if (cursor.getTime() >= startMs) {
                const dateStr = toDateStr(cursor);
                result.push({
                    ...task,
                    date: dateStr,
                    // Virtual instances get a derived ID so edits go to the source
                    id: dateStr === task.date ? task.id : `${task.id}__${dateStr}`,
                    _sourceId: task.id,
                    _isRecurrenceInstance: dateStr !== task.date,
                });
            }

            // Step forward based on recurrence type
            const next = new Date(cursor);
            switch (task.recurrence) {
                case 'daily':
                    next.setDate(next.getDate() + 1);
                    break;
                case 'weekly':
                    next.setDate(next.getDate() + 7);
                    break;
                case 'monthly':
                    next.setMonth(next.getMonth() + 1);
                    break;
                case 'yearly':
                    next.setFullYear(next.getFullYear() + 1);
                    break;
                default:
                    next.setFullYear(next.getFullYear() + 100); // bail
            }
            cursor = next;
        }
    }

    return result;
}

/**
 * Get the visible date range for the current view.
 */
function getVisibleRange(currentDate, view) {
    const d = new Date(currentDate);
    let start, end;

    switch (view) {
        case 'day':
            start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
            break;
        case 'week': {
            const dayOfWeek = d.getDay();
            start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek);
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59);
            break;
        }
        case 'month':
            start = new Date(d.getFullYear(), d.getMonth(), 1);
            // Pad for 6-week grid display
            start.setDate(start.getDate() - start.getDay());
            end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            end.setDate(end.getDate() + (6 - end.getDay()));
            end.setHours(23, 59, 59);
            break;
        case 'year':
            start = new Date(d.getFullYear(), 0, 1);
            end = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
            break;
        default:
            start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    }

    return { start, end };
}

/**
 * App — Root component for the Kaizen Calendar To-Do app.
 * Manages tasks, navigation, views, and modal state.
 * Supports daily, weekly, monthly, and yearly recurring schedules.
 */
function App() {
    // --- State ---
    const [tasks, setTasks] = useState(() => loadTasks());
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [view, setView] = useState('week');       // 'day' | 'week' | 'month' | 'year'
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [defaultDate, setDefaultDate] = useState(null);
    const [defaultTime, setDefaultTime] = useState(null);
    const [defaultCategory, setDefaultCategory] = useState(null);
    const [smartDecomposeOpen, setSmartDecomposeOpen] = useState(false);
    const [activeCategories, setActiveCategories] = useState(new Set(['personal', 'work', 'health', 'learning']));
    const [alertsEnabled, setAlertsEnabled] = useState(() => {
        const saved = localStorage.getItem(ALERTS_KEY);
        return saved === null ? true : saved === 'true';
    });
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Persist tasks whenever they change
    useEffect(() => {
        saveTasks(tasks);
    }, [tasks]);

    // Sync theme with <html> data attribute and localStorage
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    // Persist alerts preference
    useEffect(() => {
        localStorage.setItem(ALERTS_KEY, String(alertsEnabled));
    }, [alertsEnabled]);

    const handleThemeChange = useCallback((newTheme) => setTheme(newTheme), []);

    // Task alert notifications
    useTaskAlerts(tasks, alertsEnabled);

    // --- Expand recurring tasks for the current view range ---
    const expandedTasks = useMemo(() => {
        const { start, end } = getVisibleRange(currentDate, view);
        return expandRecurringTasks(tasks, start, end);
    }, [tasks, currentDate, view]);

    // --- Filter by active categories ---
    const filteredTasks = useMemo(() => {
        if (activeCategories.size === 4) return expandedTasks; // all selected, skip filter
        return expandedTasks.filter(t => activeCategories.has(t.category));
    }, [expandedTasks, activeCategories]);

    const handleToggleCategory = useCallback((catId) => {
        setActiveCategories(prev => {
            const next = new Set(prev);
            if (next.has(catId)) {
                // Don't allow deselecting the last category
                if (next.size > 1) next.delete(catId);
            } else {
                next.add(catId);
            }
            return next;
        });
    }, []);

    // --- Navigation handlers ---
    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const handlePrev = useCallback(() => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            switch (view) {
                case 'day': d.setDate(d.getDate() - 1); break;
                case 'week': d.setDate(d.getDate() - 7); break;
                case 'month': d.setMonth(d.getMonth() - 1); break;
                case 'year': d.setFullYear(d.getFullYear() - 1); break;
            }
            return d;
        });
    }, [view]);

    const handleNext = useCallback(() => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            switch (view) {
                case 'day': d.setDate(d.getDate() + 1); break;
                case 'week': d.setDate(d.getDate() + 7); break;
                case 'month': d.setMonth(d.getMonth() + 1); break;
                case 'year': d.setFullYear(d.getFullYear() + 1); break;
            }
            return d;
        });
    }, [view]);

    const handleViewChange = useCallback((newView) => setView(newView), []);
    const handleToggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const handleDateSelect = useCallback((date) => {
        setCurrentDate(date);
        setView('day');
    }, []);

    // --- Task CRUD ---

    /** Open modal to create a new task (from sidebar Create button). */
    const handleCreateTask = useCallback(() => {
        setEditingTask(null);
        setDefaultDate(new Date());
        setDefaultTime('09:00');
        setDefaultCategory(null);
        setModalOpen(true);
    }, []);

    /** Open modal to create a new task from a category row. */
    const handleCreateFromCategory = useCallback((catId) => {
        setEditingTask(null);
        setDefaultDate(new Date());
        setDefaultTime('09:00');
        setDefaultCategory(catId);
        setModalOpen(true);
    }, []);

    /** Delete all tasks in a given category. */
    const handleDeleteCategoryTasks = useCallback((catId) => {
        if (window.confirm(`Delete all ${catId} tasks? This cannot be undone.`)) {
            setTasks(prev => prev.filter(t => t.category !== catId));
        }
    }, []);

    /** Open modal to create a new task from a clicked time slot. */
    const handleSlotClick = useCallback((date, time) => {
        setEditingTask(null);
        setDefaultDate(date);
        setDefaultTime(time);
        setModalOpen(true);
    }, []);

    /** Open modal to edit an existing task. */
    const handleTaskClick = useCallback((task) => {
        // If it's a recurring instance, find the source task to edit
        if (task._isRecurrenceInstance && task._sourceId) {
            const source = tasks.find(t => t.id === task._sourceId);
            if (source) {
                setEditingTask(source);
            } else {
                setEditingTask(task);
            }
        } else {
            setEditingTask(task);
        }
        setDefaultDate(null);
        setDefaultTime(null);
        setDefaultCategory(null);
        setModalOpen(true);
    }, [tasks]);

    /** Save a task (create or update). */
    const handleSaveTask = useCallback((taskData) => {
        setTasks(prev => {
            if (taskData.id) {
                return prev.map(t => t.id === taskData.id ? { ...taskData } : t);
            } else {
                return [...prev, { ...taskData, id: generateId() }];
            }
        });
        setModalOpen(false);
        setEditingTask(null);
    }, []);

    /** Delete a task by ID. */
    const handleDeleteTask = useCallback((taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setModalOpen(false);
        setEditingTask(null);
    }, []);

    /** Close the modal. */
    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        setEditingTask(null);
    }, []);

    /** Navigate from year view — clicking a month card. */
    const handleMonthSelect = useCallback((date) => {
        setCurrentDate(date);
        setView('month');
    }, []);

    // --- Render the appropriate view ---
    const renderView = () => {
        switch (view) {
            case 'year':
                return (
                    <YearView
                        currentDate={currentDate}
                        tasks={filteredTasks}
                        onDateSelect={handleDateSelect}
                        onMonthSelect={handleMonthSelect}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                );
            case 'month':
                return (
                    <MonthView
                        currentDate={currentDate}
                        tasks={filteredTasks}
                        onSlotClick={handleSlotClick}
                        onTaskClick={handleTaskClick}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                );
            default: // 'day' or 'week'
                return (
                    <CalendarGrid
                        currentDate={currentDate}
                        view={view}
                        tasks={filteredTasks}
                        onSlotClick={handleSlotClick}
                        onTaskClick={handleTaskClick}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                );
        }
    };

    return (
        <div className="app">
            {/* Header Toolbar */}
            <CalendarHeader
                currentDate={currentDate}
                view={view}
                sidebarOpen={sidebarOpen}
                currentTheme={theme}
                alertsEnabled={alertsEnabled}
                onToggleSidebar={handleToggleSidebar}
                onToday={handleToday}
                onPrev={handlePrev}
                onNext={handleNext}
                onViewChange={handleViewChange}
                onThemeChange={handleThemeChange}
                onToggleAlerts={() => setAlertsEnabled(prev => !prev)}
            />

            {/* Body: Sidebar + Active View */}
            <div className="app-body">
                <CalendarSidebar
                    currentDate={currentDate}
                    sidebarOpen={sidebarOpen}
                    tasks={tasks}
                    activeCategories={activeCategories}
                    onDateSelect={handleDateSelect}
                    onCreateTask={handleCreateTask}
                    onSmartDecompose={() => setSmartDecomposeOpen(true)}
                    onToggleCategory={handleToggleCategory}
                    onCreateFromCategory={handleCreateFromCategory}
                    onDeleteCategoryTasks={handleDeleteCategoryTasks}
                />

                {renderView()}
            </div>

            {/* Task Modal */}
            {modalOpen && (
                <TaskModal
                    task={editingTask}
                    defaultDate={defaultDate}
                    defaultTime={defaultTime}
                    defaultCategory={defaultCategory}
                    onSave={handleSaveTask}
                    onDelete={handleDeleteTask}
                    onClose={handleCloseModal}
                />
            )}

            {/* Smart Decompose Modal */}
            {smartDecomposeOpen && (
                <SmartDecompose
                    onAddTasks={(newTasks) => {
                        const tasksWithIds = newTasks.map(t => ({
                            ...t,
                            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        }));
                        setTasks(prev => [...prev, ...tasksWithIds]);
                    }}
                    onClose={() => setSmartDecomposeOpen(false)}
                />
            )}
        </div>
    );
}

export default App;
