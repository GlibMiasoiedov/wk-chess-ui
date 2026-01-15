import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ADULT_THEME, KIDS_THEME } from '../styles/themes';

// ═══════════════════════════════════════════════════════════════════════════
// Theme Context - Global theme state management
// ═══════════════════════════════════════════════════════════════════════════

const ThemeContext = createContext(null);

const STORAGE_KEY = 'wk_theme_mode';

export function ThemeProvider({ children }) {
    // Initialize from localStorage or default to 'adult'
    const [themeName, setThemeName] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored === 'kids' ? 'kids' : 'adult';
        } catch {
            return 'adult';
        }
    });

    // Get the full theme object
    const theme = useMemo(() => {
        return themeName === 'kids' ? KIDS_THEME : ADULT_THEME;
    }, [themeName]);

    // Persist to localStorage when theme changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, themeName);
            console.log('[Theme] Switched to:', themeName);
        } catch (e) {
            console.error('[Theme] Error saving theme:', e);
        }
    }, [themeName]);

    // Toggle function
    const toggleTheme = () => {
        setThemeName(prev => prev === 'kids' ? 'adult' : 'kids');
    };

    // Set specific theme
    const setTheme = (name) => {
        if (name === 'kids' || name === 'adult') {
            setThemeName(name);
        }
    };

    const value = useMemo(() => ({
        theme,
        themeName,
        isKidsMode: themeName === 'kids',
        isAdultMode: themeName === 'adult',
        toggleTheme,
        setTheme,
    }), [theme, themeName]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Custom hook to use theme
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
