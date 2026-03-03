import { useEffect, useRef, useCallback } from 'react';

/**
 * Alert lead times by category.
 * Higher-priority categories (trips, exams → "learning") get longer lead times.
 *
 * - health  (workouts)     → 1 hour before
 * - personal               → 2 hours before
 * - work                   → 1 day before
 * - learning (exams/study) → 1 week before
 */
const ALERT_LEAD_MS = {
    health: 1 * 60 * 60 * 1000,         // 1 hour
    personal: 2 * 60 * 60 * 1000,         // 2 hours
    work: 24 * 60 * 60 * 1000,        // 1 day
    learning: 7 * 24 * 60 * 60 * 1000,   // 1 week
};

const NOTIFIED_KEY = 'kaizen_notified_tasks';
const CHECK_INTERVAL = 60000; // check every minute

/**
 * Get already-notified task IDs from localStorage.
 */
function getNotified() {
    try {
        return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * Mark a task as notified.
 */
function markNotified(taskId) {
    const list = getNotified();
    list.push(taskId);
    // Keep max 500 entries to avoid growing forever
    if (list.length > 500) list.splice(0, list.length - 500);
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list));
}

/**
 * Format a friendly time string for the notification body.
 */
function formatAlertTime(date, startTime) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = startTime.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${months[m - 1]} ${d}, ${y} at ${hour12}:${String(min).padStart(2, '0')} ${ampm}`;
}

/**
 * useTaskAlerts — Custom hook that checks tasks and fires browser notifications
 * when a task is within its category's alert lead time.
 *
 * @param {Array} tasks — All tasks from the calendar
 * @param {boolean} enabled — Whether alerts are enabled
 */
export function useTaskAlerts(tasks, enabled) {
    const permissionRef = useRef(null);

    // Request notification permission on mount
    useEffect(() => {
        if (!enabled) return;
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            Notification.requestPermission().then(p => {
                permissionRef.current = p;
            });
        } else {
            permissionRef.current = Notification.permission;
        }
    }, [enabled]);

    const checkAndNotify = useCallback(() => {
        if (!enabled) return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const now = Date.now();
        const notified = getNotified();

        for (const task of tasks) {
            // Skip completed or already notified
            if (task.completed) continue;
            if (notified.includes(task.id)) continue;

            // Parse task datetime
            const [y, m, d] = task.date.split('-').map(Number);
            const [h, min] = (task.startTime || '09:00').split(':').map(Number);
            const taskTime = new Date(y, m - 1, d, h, min).getTime();

            // Skip past tasks
            if (taskTime < now) continue;

            // Check if we're within the alert window
            const leadMs = ALERT_LEAD_MS[task.category] || ALERT_LEAD_MS.personal;
            const alertAt = taskTime - leadMs;

            if (now >= alertAt && now < taskTime) {
                // Time to alert!
                const timeLeft = taskTime - now;
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const daysLeft = Math.floor(hoursLeft / 24);

                let countdownStr;
                if (daysLeft >= 1) {
                    countdownStr = `${daysLeft} day${daysLeft > 1 ? 's' : ''} away`;
                } else if (hoursLeft >= 1) {
                    countdownStr = `${hoursLeft}h ${minsLeft}m away`;
                } else {
                    countdownStr = `${minsLeft} min away`;
                }

                const emoji = task.category === 'health' ? '🏋️' :
                    task.category === 'work' ? '💼' :
                        task.category === 'learning' ? '📚' : '📌';

                new Notification(`${emoji} ${task.title}`, {
                    body: `${countdownStr} — ${formatAlertTime(task.date, task.startTime)}\nCategory: ${task.category}`,
                    icon: '/favicon.svg',
                    tag: `kaizen-${task.id}`,
                    requireInteraction: false,
                });

                markNotified(task.id);
            }
        }
    }, [tasks, enabled]);

    // Run check immediately and then on interval
    useEffect(() => {
        if (!enabled) return;

        checkAndNotify();
        const interval = setInterval(checkAndNotify, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [checkAndNotify, enabled]);
}
