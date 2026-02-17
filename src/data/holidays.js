/**
 * holidays.js — Public holidays data for the Kaizen Calendar.
 *
 * Major international + Indian holidays.
 * Each entry has { month (1-indexed), day, name, emoji }.
 * Variable-date holidays (like Easter) use approximate fixed dates.
 */

const FIXED_HOLIDAYS = [
    // --- International / Global ---
    { month: 1, day: 1, name: "New Year's Day", emoji: '🎆' },
    { month: 2, day: 14, name: "Valentine's Day", emoji: '💕' },
    { month: 3, day: 8, name: "International Women's Day", emoji: '♀️' },
    { month: 4, day: 22, name: "Earth Day", emoji: '🌍' },
    { month: 5, day: 1, name: "May Day / Labour Day", emoji: '⚒️' },
    { month: 6, day: 5, name: "World Environment Day", emoji: '🌿' },
    { month: 10, day: 31, name: "Halloween", emoji: '🎃' },
    { month: 12, day: 25, name: "Christmas Day", emoji: '🎄' },
    { month: 12, day: 31, name: "New Year's Eve", emoji: '🎉' },

    // --- India ---
    { month: 1, day: 26, name: "Republic Day", emoji: '🇮🇳' },
    { month: 8, day: 15, name: "Independence Day", emoji: '🇮🇳' },
    { month: 10, day: 2, name: "Gandhi Jayanti", emoji: '🕊️' },

    // --- US ---
    { month: 7, day: 4, name: "Independence Day (US)", emoji: '🇺🇸' },
    { month: 11, day: 11, name: "Veterans Day", emoji: '🎖️' },

    // Notable approximate*
    { month: 3, day: 17, name: "St. Patrick's Day", emoji: '☘️' },
    { month: 11, day: 5, name: "Diwali (approx.)", emoji: '🪔' },
    { month: 3, day: 25, name: "Holi (approx.)", emoji: '🎨' },
    { month: 4, day: 10, name: "Eid al-Fitr (approx.)", emoji: '🌙' },
    { month: 1, day: 14, name: "Makar Sankranti", emoji: '🪁' },
    { month: 1, day: 15, name: "Pongal", emoji: '🍚' },
    { month: 4, day: 14, name: "Baisakhi", emoji: '🌾' },
    { month: 8, day: 21, name: "Raksha Bandhan (approx.)", emoji: '🧵' },
    { month: 9, day: 7, name: "Janmashtami (approx.)", emoji: '🦚' },
    { month: 10, day: 12, name: "Dussehra (approx.)", emoji: '🏹' },
];

/**
 * Get holidays for a specific month & year.
 * Returns array of { day, name, emoji, dateStr }.
 */
export function getHolidaysForMonth(year, month) {
    return FIXED_HOLIDAYS
        .filter(h => h.month === month + 1) // month is 0-indexed from callers
        .map(h => ({
            day: h.day,
            name: h.name,
            emoji: h.emoji,
            dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
        }));
}

/**
 * Get holidays for a full year.
 * Returns a Map<dateStr, { name, emoji }> for fast lookup.
 */
export function getHolidaysForYear(year) {
    const map = new Map();
    for (const h of FIXED_HOLIDAYS) {
        const dateStr = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
        map.set(dateStr, { name: h.name, emoji: h.emoji });
    }
    return map;
}

/**
 * Check if a specific date string is a holiday. Returns the holiday or null.
 */
export function getHoliday(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const match = FIXED_HOLIDAYS.find(h => h.month === m && h.day === d);
    return match ? { name: match.name, emoji: match.emoji } : null;
}
