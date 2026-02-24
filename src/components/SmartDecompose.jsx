import { useState, useEffect, useRef } from 'react';
import './SmartDecompose.css';

/** Category colors for the preview cards. */
const CAT_COLORS = {
    personal: '#7986cb',
    work: '#039be5',
    health: '#33b679',
    learning: '#f6bf26',
};

/**
 * Format today's date as YYYY-MM-DD.
 */
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

/**
 * Build the prompt for the LLM.
 */
function buildPrompt(goal, startDate) {
    return `You are a task planning assistant for a calendar app. The user has a goal they want to accomplish. Break it into exactly 10 practical, actionable sub-tasks.

For each sub-task, return a JSON object with these fields:
- "title": short action-oriented title (2-6 words)
- "date": date in "YYYY-MM-DD" format, spread logically starting from ${startDate}
- "startTime": suggested start time in "HH:MM" 24-hour format
- "endTime": suggested end time in "HH:MM" 24-hour format
- "category": one of "personal", "work", "health", or "learning"
- "description": one short sentence explaining what to do

Rules:
- Spread tasks over the next 2-4 weeks from the start date
- Order them chronologically by when they should realistically be done
- Keep times realistic (business hours for work, flexible for personal)
- Make titles concise and action-oriented
- Return ONLY a valid JSON array of 10 objects, no markdown fences, no explanation

Goal: "${goal}"`;
}

/**
 * Call OpenRouter directly using the build-time API key from Vercel env.
 */
async function decomposeGoal(goal, startDate) {
    if (!API_KEY) {
        throw new Error('AI features are not configured on this deployment.');
    }

    const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Kaizen Calendar',
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'user', content: buildPrompt(goal, startDate) }
            ],
            temperature: 0.7,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('No response from the model.');
    }

    // Parse the JSON array (strip markdown fences if present)
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const tasks = JSON.parse(cleaned);

    if (!Array.isArray(tasks)) {
        throw new Error('Expected an array of tasks from the model.');
    }

    return tasks.map((t, i) => ({
        title: t.title || `Task ${i + 1}`,
        date: t.date || startDate,
        startTime: t.startTime || '09:00',
        endTime: t.endTime || '10:00',
        category: ['personal', 'work', 'health', 'learning'].includes(t.category) ? t.category : 'personal',
        description: t.description || '',
        included: true,
    }));
}

/**
 * SmartDecompose — AI-powered goal breakdown modal.
 * Uses a serverless proxy to decompose a goal into 10 actionable sub-tasks.
 */
export function SmartDecompose({ onAddTasks, onClose }) {
    const inputRef = useRef(null);

    // Main state
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState(todayStr());
    const [phase, setPhase] = useState('input'); // 'input' | 'loading' | 'preview'
    const [error, setError] = useState('');
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 150);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    /** Trigger the decomposition. */
    const handleDecompose = async () => {
        if (!goal.trim()) {
            inputRef.current?.focus();
            return;
        }

        setError('');
        setPhase('loading');

        try {
            const result = await decomposeGoal(goal.trim(), startDate);
            setTasks(result);
            setPhase('preview');
        } catch (err) {
            setError(err.message || 'Something went wrong.');
            setPhase('input');
        }
    };

    /** Toggle a task's inclusion. */
    const toggleTask = (index) => {
        setTasks(prev => prev.map((t, i) =>
            i === index ? { ...t, included: !t.included } : t
        ));
    };

    /** Update a task field. */
    const updateTask = (index, field, value) => {
        setTasks(prev => prev.map((t, i) =>
            i === index ? { ...t, [field]: value } : t
        ));
    };

    /** Add all included tasks to the calendar. */
    const handleAddAll = () => {
        const included = tasks
            .filter(t => t.included)
            .map(({ included, ...rest }) => ({
                ...rest,
                completed: false,
                recurrence: 'none',
                recurrenceEnd: '',
            }));

        if (included.length > 0) {
            onAddTasks(included);
        }
        onClose();
    };

    const includedCount = tasks.filter(t => t.included).length;

    return (
        <div className="smart-decompose-overlay" onClick={onClose}>
            <div className="smart-decompose-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sd-header">
                    <div className="sd-header-left">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <h3>Smart Decompose</h3>
                    </div>
                    <button className="sd-close-btn" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="sd-body">
                    {/* === INPUT PHASE === */}
                    {phase === 'input' && (
                        <div className="sd-input-section">
                            {/* Goal input */}
                            <input
                                ref={inputRef}
                                className="sd-goal-input"
                                type="text"
                                placeholder='Type a goal… e.g. "Plan Trip to Japan"'
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleDecompose()}
                            />

                            {/* Options row */}
                            <div className="sd-options-row">
                                <div className="sd-field">
                                    <label>Start date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="sd-decompose-btn"
                                    onClick={handleDecompose}
                                    disabled={!goal.trim()}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
                                    Decompose
                                </button>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="sd-error">
                                    <span className="material-symbols-outlined">error</span>
                                    <span>{error}</span>
                                </div>
                            )}

                        </div>
                    )}

                    {/* === LOADING PHASE === */}
                    {phase === 'loading' && (
                        <div className="sd-loading">
                            <div className="sd-loading-spinner" />
                            <div className="sd-loading-text">
                                Breaking down your goal…
                            </div>
                            <div className="sd-loading-sub">
                                AI is generating 10 actionable sub-tasks
                            </div>
                        </div>
                    )}

                    {/* === PREVIEW PHASE === */}
                    {phase === 'preview' && (
                        <>
                            <div className="sd-preview-header">
                                <span className="sd-preview-title">
                                    ✨ Generated Sub-Tasks for: "{goal}"
                                </span>
                                <span className="sd-preview-count">
                                    {includedCount} of {tasks.length} selected
                                </span>
                            </div>

                            <div className="sd-task-list">
                                {tasks.map((task, i) => (
                                    <div
                                        key={i}
                                        className={`sd-task-card ${!task.included ? 'excluded' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="sd-task-check"
                                            checked={task.included}
                                            onChange={() => toggleTask(i)}
                                        />
                                        <div className="sd-task-content">
                                            <input
                                                type="text"
                                                className="sd-task-title-input"
                                                value={task.title}
                                                onChange={e => updateTask(i, 'title', e.target.value)}
                                            />
                                            <div className="sd-task-meta">
                                                <input
                                                    type="date"
                                                    value={task.date}
                                                    onChange={e => updateTask(i, 'date', e.target.value)}
                                                />
                                                <input
                                                    type="time"
                                                    value={task.startTime}
                                                    onChange={e => updateTask(i, 'startTime', e.target.value)}
                                                />
                                                <span>–</span>
                                                <input
                                                    type="time"
                                                    value={task.endTime}
                                                    onChange={e => updateTask(i, 'endTime', e.target.value)}
                                                />
                                                <span className="sd-task-category">
                                                    <span className="cat-dot" style={{ background: CAT_COLORS[task.category] }} />
                                                    {task.category}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <div className="sd-task-desc">{task.description}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {phase === 'preview' && (
                    <div className="sd-footer">
                        <button
                            className="sd-retry"
                            onClick={() => {
                                setPhase('input');
                                setTasks([]);
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                            Try again
                        </button>
                        <button className="sd-footer-btn secondary" onClick={onClose}>Cancel</button>
                        <button
                            className="sd-footer-btn primary"
                            onClick={handleAddAll}
                            disabled={includedCount === 0}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_task</span>
                            Add {includedCount} Tasks
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
