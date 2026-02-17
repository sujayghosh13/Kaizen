import './TaskChip.css';

/**
 * Format a time string "HH:MM" to short display like "9 AM" or "2:30 PM".
 */
function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return m > 0 ? `${hour}:${String(m).padStart(2, '0')} ${ampm}` : `${hour} ${ampm}`;
}

/**
 * TaskChip — A colored pill representing a task inside the calendar grid.
 * Positioned absolutely within the time-slot cell based on start/end times.
 */
export function TaskChip({
    task,
    onClick,
    style
}) {
    return (
        <div
            className={`task-chip cat-${task.category} ${task.completed ? 'completed' : ''}`}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                onClick(task);
            }}
            title={`${task.title} (${formatTime(task.startTime)} – ${formatTime(task.endTime)})`}
        >
            <span className="task-chip-title">{task.title}</span>
            <span className="task-chip-time">
                {formatTime(task.startTime)} – {formatTime(task.endTime)}
            </span>
        </div>
    );
}
