import { useState, useEffect, useRef } from 'react';
import './TaskModal.css';

/**
 * Category definitions for the selector.
 */
const CATEGORIES = [
    { id: 'personal', label: 'Personal', color: '#7986cb' },
    { id: 'work', label: 'Work', color: '#039be5' },
    { id: 'health', label: 'Health', color: '#33b679' },
    { id: 'learning', label: 'Learning', color: '#f6bf26' },
];

/**
 * Recurrence options for scheduling.
 */
const RECURRENCE_OPTIONS = [
    { id: 'none', label: 'Does not repeat', icon: 'block' },
    { id: 'daily', label: 'Every day', icon: 'today' },
    { id: 'weekly', label: 'Every week', icon: 'date_range' },
    { id: 'monthly', label: 'Every month', icon: 'calendar_month' },
    { id: 'yearly', label: 'Every year', icon: 'event_repeat' },
];

/**
 * Helper: format a Date to "YYYY-MM-DD" for the date input.
 */
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * TaskModal — Create / Edit dialog for tasks.
 * Now includes recurrence selector for daily/weekly/monthly/yearly scheduling.
 */
export function TaskModal({
    task,          // null = creating new task
    defaultDate,   // pre-filled date for new tasks
    defaultTime,   // pre-filled start time for new tasks
    defaultCategory, // pre-filled category for new tasks
    onSave,
    onDelete,
    onClose
}) {
    const isEditing = task !== null;
    const titleRef = useRef(null);

    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [date, setDate] = useState(task?.date || toDateStr(defaultDate || new Date()));
    const [startTime, setStartTime] = useState(task?.startTime || defaultTime || '09:00');
    const [endTime, setEndTime] = useState(task?.endTime || (() => {
        const [h] = (defaultTime || '09:00').split(':').map(Number);
        return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:00`;
    })());
    const [category, setCategory] = useState(task?.category || defaultCategory || 'personal');
    const [completed, setCompleted] = useState(task?.completed || false);
    const [recurrence, setRecurrence] = useState(task?.recurrence || 'none');
    const [recurrenceEnd, setRecurrenceEnd] = useState(task?.recurrenceEnd || '');

    // Auto-focus the title input on mount
    useEffect(() => {
        setTimeout(() => titleRef.current?.focus(), 100);
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSave = () => {
        if (!title.trim()) {
            titleRef.current?.focus();
            return;
        }

        onSave({
            id: task?.id || null,
            title: title.trim(),
            description: description.trim(),
            date,
            startTime,
            endTime,
            category,
            completed,
            recurrence,
            recurrenceEnd: recurrence !== 'none' ? recurrenceEnd : '',
            createdAt: task?.createdAt || new Date().toISOString()
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
                {/* Header */}
                <div className="task-modal-header">
                    <h3>{isEditing ? 'Edit Task' : 'New Task'}</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="task-modal-body">
                    <div className="modal-field">
                        <input
                            ref={titleRef}
                            type="text"
                            className="title-input"
                            placeholder="Add title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="modal-time-row">
                        <div className="modal-field">
                            <label>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="modal-field">
                            <label>Start</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="modal-field">
                            <label>End</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>

                    {/* Recurrence / Schedule Selector */}
                    <div className="modal-field">
                        <label>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom', marginRight: 4 }}>event_repeat</span>
                            Schedule
                        </label>
                        <div className="recurrence-options">
                            {RECURRENCE_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`recurrence-option ${recurrence === opt.id ? 'selected' : ''}`}
                                    onClick={() => setRecurrence(opt.id)}
                                >
                                    <span className="material-symbols-outlined recurrence-icon">{opt.icon}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Recurrence end date — only show if a recurrence is selected */}
                        {recurrence !== 'none' && (
                            <div className="recurrence-end-row">
                                <span className="recurrence-end-label">
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>event_busy</span>
                                    Repeat until
                                </span>
                                <input
                                    type="date"
                                    className="recurrence-end-input"
                                    value={recurrenceEnd}
                                    onChange={e => setRecurrenceEnd(e.target.value)}
                                    placeholder="No end date"
                                />
                                {!recurrenceEnd && (
                                    <span className="recurrence-end-hint">Leave empty for forever</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-field">
                        <label>Category</label>
                        <div className="category-options">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`category-option ${category === cat.id ? 'selected' : ''}`}
                                    style={category === cat.id ? { color: cat.color } : {}}
                                    onClick={() => setCategory(cat.id)}
                                >
                                    <span className="cat-dot" style={{ background: cat.color }} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-field">
                        <label>Description</label>
                        <textarea
                            placeholder="Add description (optional)"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Completed toggle (only show when editing) */}
                    {isEditing && (
                        <label className="completed-toggle">
                            <input
                                type="checkbox"
                                checked={completed}
                                onChange={e => setCompleted(e.target.checked)}
                            />
                            Mark as completed
                        </label>
                    )}
                </div>

                {/* Footer */}
                <div className="task-modal-footer">
                    {isEditing && (
                        <div className="modal-footer-left">
                            <button className="modal-btn danger" onClick={() => onDelete(task.id)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4, verticalAlign: 'text-bottom' }}>delete</span>
                                Delete
                            </button>
                        </div>
                    )}
                    <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}
