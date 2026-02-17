import { useState, useRef, useEffect } from 'react';
import './ThemePicker.css';

/**
 * All available themes with preview colors and descriptions.
 */
export const THEMES = [
    {
        id: 'light',
        label: 'Light',
        desc: 'Clean & classic',
        icon: 'light_mode',
        bg: '#ffffff',
        accent: '#1a73e8',
    },
    {
        id: 'dark',
        label: 'Dark',
        desc: 'Easy on the eyes',
        icon: 'dark_mode',
        bg: '#1e1e1e',
        accent: '#8ab4f8',
    },
    {
        id: 'material-black',
        label: 'Material Black',
        desc: 'Pure AMOLED black',
        icon: 'contrast',
        bg: '#000000',
        accent: '#bb86fc',
    },
    {
        id: 'tokyo-night',
        label: 'Tokyo Night',
        desc: 'Purple & blue aesthetic',
        icon: 'nights_stay',
        bg: '#1a1b26',
        accent: '#7aa2f7',
    },
    {
        id: 'neon',
        label: 'Neon Glow',
        desc: 'Cyberpunk vibes',
        icon: 'electric_bolt',
        bg: '#0d0d0d',
        accent: '#ff2d95',
    },
    {
        id: 'anime',
        label: 'Anime Pastel',
        desc: 'Soft kawaii colors',
        icon: 'favorite',
        bg: '#fff5f7',
        accent: '#ff8fab',
    },
    {
        id: '80s-retro',
        label: '80s Retrowave',
        desc: 'Synthwave sunset',
        icon: 'music_note',
        bg: '#1b0a2e',
        accent: '#f72585',
    },
    {
        id: 'stone-age',
        label: 'Stone Age',
        desc: 'Earthy & warm',
        icon: 'landscape',
        bg: '#f5efe6',
        accent: '#a0765a',
    },
    {
        id: 'royal',
        label: 'Royal',
        desc: 'Gold & purple luxury',
        icon: 'diamond',
        bg: '#1a1025',
        accent: '#d4af37',
    },
    {
        id: 'ocean-deep',
        label: 'Ocean Deep',
        desc: 'Teal & navy waves',
        icon: 'water',
        bg: '#0c1929',
        accent: '#22d3ee',
    },
    {
        id: 'forest',
        label: 'Forest',
        desc: 'Deep green canopy',
        icon: 'forest',
        bg: '#162016',
        accent: '#4ade80',
    },
    {
        id: 'lavender',
        label: 'Lavender Bloom',
        desc: 'Soft purple light',
        icon: 'spa',
        bg: '#faf8ff',
        accent: '#7c3aed',
    },
    {
        id: 'mint',
        label: 'Mint Garden',
        desc: 'Fresh green light',
        icon: 'eco',
        bg: '#f0fdf4',
        accent: '#059669',
    },
    {
        id: 'sunset',
        label: 'Sunset Glow',
        desc: 'Warm orange coral',
        icon: 'wb_twilight',
        bg: '#fffaf5',
        accent: '#ea580c',
    },
    {
        id: 'ocean-breeze',
        label: 'Ocean Breeze',
        desc: 'Light teal seafoam',
        icon: 'sailing',
        bg: '#f0fdfa',
        accent: '#0891b2',
    },
    {
        id: 'rose-gold',
        label: 'Rose Gold',
        desc: 'Luxurious warm pink',
        icon: 'local_florist',
        bg: '#fff5f8',
        accent: '#be185d',
    },
];

/**
 * ThemePicker — Dropdown component for selecting themes.
 * Shows a color swatch preview for each theme.
 */
export function ThemePicker({ currentTheme, onThemeChange }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open]);

    const handleSelect = (themeId) => {
        onThemeChange(themeId);
        setOpen(false);
    };

    return (
        <div className="theme-picker-wrapper" ref={wrapperRef}>
            {/* Trigger button */}
            <button
                className="theme-picker-btn"
                onClick={() => setOpen(!open)}
                title="Change theme"
            >
                <span className="material-symbols-outlined">palette</span>
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    <div className="theme-picker-backdrop" onClick={() => setOpen(false)} />
                    <div className="theme-picker-dropdown">
                        <div className="theme-picker-title">Choose Theme</div>
                        {THEMES.map(theme => (
                            <button
                                key={theme.id}
                                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                                onClick={() => handleSelect(theme.id)}
                            >
                                {/* Color swatch */}
                                <div className="theme-swatch">
                                    <div className="theme-swatch-inner">
                                        <div className="theme-swatch-half" style={{ background: theme.bg }} />
                                        <div className="theme-swatch-half" style={{ background: theme.accent }} />
                                    </div>
                                </div>

                                {/* Label + description */}
                                <div className="theme-info">
                                    <span className="theme-label">{theme.label}</span>
                                    <span className="theme-desc">{theme.desc}</span>
                                </div>

                                {/* Active check */}
                                {currentTheme === theme.id && (
                                    <div className="theme-check">
                                        <span className="material-symbols-outlined">check</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
