// Theme configuration for Adult and Kids modes
// ═══════════════════════════════════════════════════════════════════════════

export const ADULT_THEME = {
    name: 'adult',

    // Colors
    colors: {
        background: '#0B0E14',
        backgroundSecondary: '#151922',
        backgroundTertiary: '#1A1E26',
        accent: '#D4AF37',
        accentHover: '#F0C75E',
        text: '#E2E8F0',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        border: '#2A303C',
        borderAccent: 'rgba(212,175,55,0.3)',
    },

    // Typography
    fonts: {
        primary: 'system-ui, -apple-system, sans-serif',
        mono: 'Monaco, Consolas, monospace',
    },

    // Borders & Shadows
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },

    // Component-specific styles
    header: {
        background: 'rgba(11,14,20,0.95)',
        borderColor: '#2A303C',
    },

    panel: {
        background: 'rgba(26,30,38,0.95)',
        borderColor: '#2A303C',
    },

    button: {
        primary: {
            background: '#D4AF37',
            color: '#0B0E14',
            hover: '#F0C75E',
        },
        secondary: {
            background: 'rgba(212,175,55,0.1)',
            color: '#D4AF37',
            borderColor: 'rgba(212,175,55,0.3)',
        },
    },

    // Bot configuration (adult)
    bots: [
        { name: 'Beginner', rating: 400, icon: '♟️', color: '#4ADE80' },
        { name: 'Easy', rating: 600, icon: '♟️', color: '#22C55E' },
        { name: 'Casual', rating: 800, icon: '♟️', color: '#D4AF37' },
        { name: 'Intermediate', rating: 1000, icon: '♟️', color: '#F59E0B' },
        { name: 'Hard', rating: 1200, icon: '♟️', color: '#EF4444' },
        { name: 'Advanced', rating: 1600, icon: '♟️', color: '#A855F7' },
        { name: 'Expert', rating: 2000, icon: '♟️', color: '#EC4899' },
        { name: 'Master', rating: 2400, icon: '♟️', color: '#DC2626' },
    ],
};

export const KIDS_THEME = {
    name: 'kids',

    // Colors - bright and playful
    colors: {
        background: '#1a1a2e',
        backgroundSecondary: '#16213e',
        backgroundTertiary: '#0f3460',
        accent: '#ffd93d',
        accentHover: '#ffeb8a',
        text: '#ffffff',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#ff9f43',
        border: 'rgba(255,217,61,0.2)',
        borderAccent: 'rgba(255,217,61,0.4)',
        pink: '#ff6b9d',
        teal: '#4ecdc4',
        purple: '#a855f7',
        orange: '#ff9f43',
    },

    // Typography
    fonts: {
        primary: 'system-ui, -apple-system, sans-serif',
        mono: 'Monaco, Consolas, monospace',
    },

    // Borders & Shadows - more rounded
    borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
    },

    // Component-specific styles
    header: {
        background: 'rgba(0,0,0,0.5)',
        borderColor: 'rgba(255,217,61,0.2)',
    },

    panel: {
        background: 'rgba(0,0,0,0.3)',
        borderColor: 'rgba(255,217,61,0.1)',
    },

    button: {
        primary: {
            background: 'linear-gradient(90deg, #ffd93d, #ff9f43)',
            color: '#1a1a2e',
            hover: 'linear-gradient(90deg, #ffeb8a, #ffb366)',
        },
        secondary: {
            background: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            borderColor: 'rgba(255,255,255,0.2)',
        },
    },

    // Bot configuration (kids - with emojis)
    bots: [
        { name: 'Baby', rating: 400, emoji: '👶', color: '#4ecdc4', level: 1 },
        { name: 'Chick', rating: 600, emoji: '🐣', color: '#22c55e', level: 2 },
        { name: 'Happy', rating: 800, emoji: '😊', color: '#ffd93d', level: 3 },
        { name: 'Thinker', rating: 1000, emoji: '🤔', color: '#ff9f43', level: 4 },
        { name: 'Fighter', rating: 1200, emoji: '😤', color: '#ff6b9d', level: 5 },
        { name: 'Wizard', rating: 1400, emoji: '🧙‍♂️', color: '#a855f7', level: 6 },
        { name: 'King', rating: 1600, emoji: '👑', color: '#f59e0b', level: 7 },
        { name: 'Robot', rating: 2000, emoji: '🤖', color: '#ef4444', level: 8 },
    ],

    // Time controls with emojis
    timeControls: [
        { label: '1m', value: '1|0', emoji: '⚡' },
        { label: '3m', value: '3|0', emoji: '🏃' },
        { label: '5m', value: '5|0', emoji: '🚶' },
        { label: '10m', value: '10|0', emoji: '🧘' },
        { label: '3+2', value: '3|2', emoji: '⏱️' },
        { label: '5+3', value: '5|3', emoji: '⏰' },
    ],
};

// Helper to get theme by name
export const getTheme = (themeName) => {
    return themeName === 'kids' ? KIDS_THEME : ADULT_THEME;
};
