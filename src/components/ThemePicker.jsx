import React from 'react';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
    // ── Immersive Themes ──
    {
        id: 'living-sky',
        label: '🌅 Living Sky',
        desc: 'Time-synced gradient sky',
        icon: 'wb_twilight',
        bg: '#42a5f5',
        accent: '#ffb347',
        immersive: true,
    },
    {
        id: 'zero-g',
        label: '🚀 Zero-G',
        desc: 'Floating in space',
        icon: 'rocket_launch',
        bg: '#030810',
        accent: '#64b5f6',
        immersive: true,
    },
    {
        id: 'vaporwave',
        label: '🌆 Vaporwave City',
        desc: 'Neon retro dreamscape',
        icon: 'nightlife',
        bg: '#0a0020',
        accent: '#ff71ce',
        immersive: true,
    },
    {
        id: 'caveman',
        label: '🪨 Caveman',
        desc: 'Stone age vibes',
        icon: 'landscape',
        bg: '#d4c4a8',
        accent: '#b8860b',
        immersive: true,
    },
    {
        id: 'netrunner',
        label: '⚡ Netrunner',
        desc: 'Cyberpunk rain & glitch',
        icon: 'terminal',
        bg: '#04060c',
        accent: '#00f3ff',
        immersive: true,
    },
    {
        id: 'terminal',
        label: '💻 Terminal_01',
        desc: 'Green monospace CLI',
        icon: 'code',
        bg: '#000000',
        accent: '#00ff41',
        immersive: true,
    },
    {
        id: 'shonen',
        label: '⚔️ Shonen Jump',
        desc: 'Manga action panels',
        icon: 'auto_stories',
        bg: '#f0f0f0',
        accent: '#ff1744',
        immersive: true,
    },
    {
        id: 'detective',
        label: '🔍 The Detective',
        desc: 'Noir corkboard & pins',
        icon: 'search',
        bg: '#222222',
        accent: '#cc0000',
        immersive: true,
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

    const [dropdownStyle, setDropdownStyle] = useState({});

    // Calculate position when opening
    useLayoutEffect(() => {
        if (open && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownStyle({
                top: `${rect.bottom + 8}px`,
                right: `${window.innerWidth - rect.right}px`,
                maxHeight: 'min(520px, 80vh)' // Prevent going off-screen vertically
            });
        }
    }, [open]);

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
                    <div className="theme-picker-dropdown" style={dropdownStyle}>
                        <div className="theme-picker-title">Choose Theme</div>
                        {THEMES.map((theme, idx) => {
                            const showSep = theme.immersive && (idx === 0 || !THEMES[idx - 1].immersive);
                            return (
                                <React.Fragment key={theme.id}>
                                    {showSep && (
                                        <div className="theme-section-label">✨ Immersive</div>
                                    )}
                                    <button
                                        className={`theme-option ${currentTheme === theme.id ? 'active' : ''} ${theme.immersive ? 'immersive' : ''}`}
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
                                </React.Fragment>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
