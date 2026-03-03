import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to manage Supabase auth state.
 * Provides the current user and sign-in/sign-up/sign-out methods.
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session (offline-safe)
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setUser(session?.user ?? null);
                setLoading(false);
            })
            .catch(() => {
                // Offline — continue without auth
                setUser(null);
                setLoading(false);
            });

        // Listen for auth changes
        let subscription;
        try {
            const result = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setUser(session?.user ?? null);
                    setLoading(false);
                }
            );
            subscription = result.data.subscription;
        } catch {
            // Offline — no listener needed
        }

        return () => subscription?.unsubscribe();
    }, []);

    const signUp = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });
        if (error) throw error;
        return data;
    }, []);

    const signIn = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }, []);

    return { user, loading, signUp, signIn, signOut };
}

/**
 * Hook to manage tasks via Supabase.
 * Provides CRUD operations that sync with the database.
 * Falls back to localStorage when not authenticated.
 */
export function useTasks(user) {
    const STORAGE_KEY = 'kaizen_calendar_tasks';
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load tasks
    useEffect(() => {
        if (!user) {
            // Fallback: load from localStorage
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                setTasks(raw ? JSON.parse(raw) : []);
            } catch {
                setTasks([]);
            }
            setLoading(false);
            return;
        }

        // Load from Supabase (with offline fallback)
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .order('date', { ascending: true });

                if (error) {
                    console.error('Failed to load tasks:', error);
                    // Fallback to localStorage
                    const raw = localStorage.getItem(STORAGE_KEY);
                    setTasks(raw ? JSON.parse(raw) : []);
                } else {
                    setTasks(data.map(dbToTask));
                }
            } catch {
                // Network error — use localStorage
                const raw = localStorage.getItem(STORAGE_KEY);
                setTasks(raw ? JSON.parse(raw) : []);
            }
            setLoading(false);
        })();
    }, [user]);

    // Save to localStorage as backup (always)
    useEffect(() => {
        if (tasks.length > 0 || !loading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        }
    }, [tasks, loading]);

    const addTask = useCallback(async (taskData) => {
        const id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const newTask = { ...taskData, id };

        // Optimistic update
        setTasks(prev => [...prev, newTask]);

        if (user) {
            const { error } = await supabase.from('tasks').insert(taskToDb(newTask, user.id));
            if (error) {
                console.error('Failed to save task:', error);
                // Keep optimistic update — localStorage still has it
            }
        }

        return newTask;
    }, [user]);

    const updateTask = useCallback(async (taskData) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskData.id ? { ...taskData } : t));

        if (user) {
            const { error } = await supabase
                .from('tasks')
                .update(taskToDb(taskData, user.id))
                .eq('id', taskData.id);

            if (error) {
                console.error('Failed to update task:', error);
            }
        }
    }, [user]);

    const deleteTask = useCallback(async (taskId) => {
        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== taskId));

        if (user) {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) {
                console.error('Failed to delete task:', error);
            }
        }
    }, [user]);

    const deleteByCategory = useCallback(async (catId) => {
        // Optimistic update
        setTasks(prev => prev.filter(t => t.category !== catId));

        if (user) {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('user_id', user.id)
                .eq('category', catId);

            if (error) {
                console.error('Failed to delete category tasks:', error);
            }
        }
    }, [user]);

    return { tasks, setTasks, loading, addTask, updateTask, deleteTask, deleteByCategory };
}

/**
 * Hook to manage user preferences via Supabase.
 */
export function usePreferences(user) {
    const THEME_KEY = 'kaizen_theme';
    const ALERTS_KEY = 'kaizen_alerts_enabled';

    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [alertsEnabled, setAlertsEnabled] = useState(() => {
        const saved = localStorage.getItem(ALERTS_KEY);
        return saved === null ? true : saved === 'true';
    });

    // Load preferences from Supabase (offline-safe)
    useEffect(() => {
        if (!user) return;

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (!error && data) {
                    setTheme(data.theme);
                    setAlertsEnabled(data.alerts_enabled);
                } else if (error && error.code === 'PGRST116') {
                    await supabase.from('user_preferences').insert({
                        user_id: user.id,
                        theme,
                        alerts_enabled: alertsEnabled,
                    }).catch(() => { });
                }
            } catch {
                // Offline — use local preferences
            }
        })();
    }, [user]);

    // Persist locally and to Supabase
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem(ALERTS_KEY, String(alertsEnabled));
    }, [alertsEnabled]);

    const updateTheme = useCallback(async (newTheme) => {
        setTheme(newTheme);
        if (user) {
            await supabase
                .from('user_preferences')
                .update({ theme: newTheme, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
        }
    }, [user]);

    const updateAlerts = useCallback(async (enabled) => {
        setAlertsEnabled(enabled);
        if (user) {
            await supabase
                .from('user_preferences')
                .update({ alerts_enabled: enabled, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
        }
    }, [user]);

    return { theme, alertsEnabled, updateTheme, updateAlerts };
}

// --- Helpers: map between app format and DB format ---

function taskToDb(task, userId) {
    return {
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description || '',
        date: task.date,
        start_time: task.startTime || '',
        end_time: task.endTime || '',
        category: task.category || 'personal',
        completed: task.completed || false,
        recurrence: task.recurrence || 'none',
        recurrence_end: task.recurrenceEnd || null,
        created_at: task.createdAt || new Date().toISOString(),
    };
}

function dbToTask(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        category: row.category,
        completed: row.completed,
        recurrence: row.recurrence,
        recurrenceEnd: row.recurrence_end || '',
        createdAt: row.created_at,
    };
}
