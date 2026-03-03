import { useEffect, useRef, useMemo } from 'react';
import './ThemeEffects.css';

/**
 * Themes that have animated background effects.
 * Each returns a React element or null.
 */
const EFFECT_THEMES = new Set([
    'living-sky', 'zero-g', 'vaporwave', 'netrunner',
    'detective', 'caveman'
]);

/**
 * Get the sky phase based on current hour.
 * Returns gradient colors for dawn, day, dusk, night.
 */
function getSkyGradient(hour) {
    if (hour >= 5 && hour < 8) {
        // Dawn
        return 'linear-gradient(180deg, #1a1a4e 0%, #4a3080 25%, #e06060 55%, #ffb347 80%, #ffe0a0 100%)';
    } else if (hour >= 8 && hour < 17) {
        // Day
        return 'linear-gradient(180deg, #1565c0 0%, #42a5f5 35%, #81d4fa 65%, #e1f5fe 100%)';
    } else if (hour >= 17 && hour < 20) {
        // Dusk
        return 'linear-gradient(180deg, #1a1a4e 0%, #5c3074 25%, #d45050 50%, #ff8c42 75%, #ffcc80 100%)';
    } else {
        // Night
        return 'linear-gradient(180deg, #0a0a2e 0%, #101040 40%, #1a1a50 70%, #252560 100%)';
    }
}

/**
 * ThemeEffects — Renders animated background layers and
 * overlays for immersive themes.
 */
export function ThemeEffects({ theme }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const skyRef = useRef(null);

    // Living Sky: update gradient based on time
    useEffect(() => {
        if (theme !== 'living-sky') return;

        function updateSky() {
            const hour = new Date().getHours();
            if (skyRef.current) {
                skyRef.current.style.background = getSkyGradient(hour);
            }
        }
        updateSky();
        const interval = setInterval(updateSky, 60000); // check every minute
        return () => clearInterval(interval);
    }, [theme]);

    // Netrunner: canvas rain effect
    useEffect(() => {
        if (theme !== 'netrunner') return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let drops = [];
        const COLS = 60;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drops = Array.from({ length: COLS }, () =>
                Math.random() * canvas.height
            );
        }
        resize();
        window.addEventListener('resize', resize);

        function draw() {
            ctx.fillStyle = 'rgba(8, 10, 16, 0.12)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(0, 255, 159, 0.12)';
            ctx.font = '12px monospace';

            const colWidth = canvas.width / COLS;
            for (let i = 0; i < COLS; i++) {
                const char = String.fromCharCode(0x30A0 + Math.random() * 96);
                ctx.fillText(char, i * colWidth, drops[i]);
                if (drops[i] > canvas.height && Math.random() > 0.98) {
                    drops[i] = 0;
                }
                drops[i] += 10 + Math.random() * 5;
            }
            animRef.current = requestAnimationFrame(draw);
        }
        draw();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [theme]);

    // Generate star positions for Zero-G (memoized, only changes with theme)
    const stars = useMemo(() => {
        if (theme !== 'zero-g') return [];
        return Array.from({ length: 200 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1 + Math.random() * 2.5,
            delay: Math.random() * 4,
            duration: 1.5 + Math.random() * 2.5,
        }));
    }, [theme]);

    if (!EFFECT_THEMES.has(theme)) return null;

    return (
        <div className="theme-effects-layer" data-effect-theme={theme}>
            {/* Living Sky — time-synced gradient bg */}
            {theme === 'living-sky' && (
                <div className="te-living-sky" ref={skyRef}>
                    <div className="te-clouds" />
                </div>
            )}

            {/* Zero-G — starfield */}
            {theme === 'zero-g' && (
                <div className="te-starfield">
                    {stars.map(s => (
                        <div
                            key={s.id}
                            className="te-star"
                            style={{
                                left: `${s.x}%`,
                                top: `${s.y}%`,
                                width: `${s.size}px`,
                                height: `${s.size}px`,
                                animationDelay: `${s.delay}s`,
                                animationDuration: `${s.duration}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Vaporwave — wireframe grid floor */}
            {theme === 'vaporwave' && (
                <div className="te-vaporwave">
                    <div className="te-vapor-sun" />
                    <div className="te-vapor-grid" />
                </div>
            )}

            {/* Netrunner — canvas rain */}
            {theme === 'netrunner' && (
                <canvas ref={canvasRef} className="te-rain-canvas" />
            )}

            {/* Detective — pin texture pattern */}
            {theme === 'detective' && (
                <div className="te-corkboard" />
            )}

            {/* Caveman — cinematic rock wall + flickering light */}
            {theme === 'caveman' && (
                <div className="te-caveman">
                    <div className="te-torchlight" />
                </div>
            )}
        </div>
    );
}
