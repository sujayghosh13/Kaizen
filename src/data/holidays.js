/**
 * holidays.js — Public holidays data for the Kaizen Calendar.
 *
 * Major international + Indian holidays.
 * Each entry has { month (1-indexed), day, name, emoji }.
 */

const FIXED_GLOBAL_HOLIDAYS = [
    { month: 1, day: 1, name: "New Year's Day", emoji: '🎆' },
    { month: 2, day: 14, name: "Valentine's Day", emoji: '💕' },
    { month: 3, day: 8, name: "International Women's Day", emoji: '♀️' },
    { month: 4, day: 22, name: "Earth Day", emoji: '🌍' },
    { month: 5, day: 1, name: "May Day / Labour Day", emoji: '⚒️' },
    { month: 6, day: 5, name: "World Environment Day", emoji: '🌿' },
    { month: 10, day: 31, name: "Halloween", emoji: '🎃' },
    { month: 12, day: 25, name: "Christmas Day", emoji: '🎄' },
    { month: 12, day: 31, name: "New Year's Eve", emoji: '🎉' },
];

/** Holidays that are always on the same date in India */
const FIXED_INDIA_HOLIDAYS = [
    { month: 1, day: 26, name: "Republic Day", emoji: '🇮🇳' },
    { month: 8, day: 15, name: "Independence Day", emoji: '🇮🇳' },
    { month: 10, day: 2, name: "Gandhi Jayanti", emoji: '🕊️' },
    { month: 4, day: 14, name: "Ambedkar Jayanti", emoji: '⚖️' },
];

/** 
 * Year-specific holidays for variable dates (Lunar/Solar calendars).
 */
const YEARLY_HOLIDAYS = {
    2026: [
        { month: 1, day: 14, name: "Makar Sankranti", emoji: '🪁' },
        { month: 2, day: 15, name: "Maha Shivaratri", emoji: '�' },
        { month: 3, day: 3, name: "Holika Dahan", emoji: '🔥' },
        { month: 3, day: 4, name: "Holi", emoji: '🎨' },
        { month: 3, day: 21, name: "Eid al-Fitr", emoji: '�' },
        { month: 3, day: 26, name: "Ram Navami", emoji: '�' },
        { month: 5, day: 27, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 9, day: 14, name: "Ganesh Chaturthi", emoji: '�' },
        { month: 11, day: 8, name: "Diwali", emoji: '🪔' },
    ],
    2027: [
        { month: 1, day: 14, name: "Makar Sankranti", emoji: '🪁' },
        { month: 3, day: 10, name: "Eid al-Fitr", emoji: '🌙' },
        { month: 3, day: 22, name: "Holi", emoji: '🎨' },
        { month: 5, day: 17, name: "Eid-ul-Adha", emoji: '�' },
        { month: 9, day: 4, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 10, day: 29, name: "Diwali", emoji: '🪔' },
    ],
    2028: [
        { month: 2, day: 26, name: "Eid al-Fitr", emoji: '🌙' },
        { month: 3, day: 11, name: "Holi", emoji: '🎨' },
        { month: 5, day: 5, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 8, day: 23, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 10, day: 17, name: "Diwali", emoji: '🪔' },
    ],
    2029: [
        { month: 2, day: 14, name: "Eid al-Fitr", emoji: '🌙' },
        { month: 3, day: 1, name: "Holi", emoji: '🎨' },
        { month: 4, day: 24, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 9, day: 11, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 11, day: 5, name: "Diwali", emoji: '🪔' },
    ],
    2030: [
        { month: 2, day: 4, name: "Eid al-Fitr", emoji: '�' },
        { month: 3, day: 20, name: "Holi", emoji: '🎨' },
        { month: 4, day: 14, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 9, day: 1, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 10, day: 26, name: "Diwali", emoji: '🪔' },
    ],
    2031: [
        { month: 1, day: 24, name: "Eid al-Fitr", emoji: '🌙' },
        { month: 3, day: 9, name: "Holi", emoji: '🎨' },
        { month: 4, day: 3, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 9, day: 20, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 11, day: 14, name: "Diwali", emoji: '🪔' },
    ],
    2032: [
        { month: 1, day: 14, name: "Eid al-Fitr", emoji: '🌙' },
        { month: 2, day: 28, name: "Holi", emoji: '�' },
        { month: 3, day: 22, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 9, day: 8, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 11, day: 2, name: "Diwali", emoji: '�' },
    ],
    2033: [
        { month: 1, day: 2, name: "Eid al-Fitr", emoji: '🌙' },
        { month: 3, day: 12, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 3, day: 16, name: "Holi", emoji: '🎨' },
        { month: 8, day: 28, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 10, day: 22, name: "Diwali", emoji: '🪔' },
    ],
    2034: [
        { month: 3, day: 1, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 3, day: 6, name: "Holi", emoji: '🎨' },
        { month: 9, day: 16, name: "Ganesh Chaturthi", emoji: '�' },
        { month: 11, day: 10, name: "Diwali", emoji: '🪔' },
        { month: 12, day: 22, name: "Eid al-Fitr", emoji: '�' },
    ],
    2035: [
        { month: 2, day: 18, name: "Eid-ul-Adha", emoji: '🐐' },
        { month: 3, day: 24, name: "Holi", emoji: '🎨' },
        { month: 9, day: 5, name: "Ganesh Chaturthi", emoji: '🐘' },
        { month: 10, day: 30, name: "Diwali", emoji: '🪔' },
        { month: 12, day: 1, name: "Eid al-Fitr", emoji: '🌙' },
    ]
};

/**
 * Get merged holiday list for a specific year.
 */
function getCombinedHolidays(year) {
    const yearly = YEARLY_HOLIDAYS[year] || [];
    return [...FIXED_GLOBAL_HOLIDAYS, ...FIXED_INDIA_HOLIDAYS, ...yearly];
}

/**
 * Get holidays for a specific month & year.
 * Returns array of { day, name, emoji, dateStr }.
 */
export function getHolidaysForMonth(year, month) {
    const list = getCombinedHolidays(year);
    return list
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
    const list = getCombinedHolidays(year);
    const map = new Map();
    for (const h of list) {
        const dateStr = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
        map.set(dateStr, { name: h.name, emoji: h.emoji });
    }
    return map;
}

/**
 * Check if a specific date string is a holiday. Returns the holiday or null.
 */
export function getHoliday(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    const list = getCombinedHolidays(y);
    const match = list.find(h => h.month === m && h.day === d);
    return match ? { name: match.name, emoji: match.emoji } : null;
}
