import React from 'react';
import { useTheme } from '../context/ThemeContext';

// ═══════════════════════════════════════════════════════════════════════════
// Theme Toggle Component - Switch between Adult and Kids modes
// ═══════════════════════════════════════════════════════════════════════════

export default function ThemeToggle({ style }) {
    const { isKidsMode, toggleTheme, theme } = useTheme();

    // Adult mode styles
    const adultStyles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
        },
        toggle: {
            width: '44px',
            height: '24px',
            background: '#2A303C',
            borderRadius: '12px',
            position: 'relative',
            transition: 'background 0.3s ease',
        },
        knob: {
            position: 'absolute',
            top: '2px',
            left: '2px',
            width: '20px',
            height: '20px',
            background: '#D4AF37',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
        },
        label: {
            fontSize: '11px',
            fontWeight: '600',
            color: '#94A3B8',
        },
    };

    // Kids mode styles
    const kidsStyles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(168,85,247,0.2))',
            border: '2px solid rgba(255,217,61,0.3)',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 10px rgba(255,217,61,0.2)',
        },
        toggle: {
            width: '44px',
            height: '24px',
            background: 'linear-gradient(90deg, #4ecdc4, #a855f7)',
            borderRadius: '12px',
            position: 'relative',
            transition: 'background 0.3s ease',
        },
        knob: {
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '20px',
            height: '20px',
            background: '#ffd93d',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        },
        label: {
            fontSize: '11px',
            fontWeight: '700',
            color: '#ffd93d',
        },
    };

    const styles = isKidsMode ? kidsStyles : adultStyles;

    return (
        <button
            onClick={toggleTheme}
            style={{ ...styles.container, border: 'none', ...style }}
            title={isKidsMode ? 'Switch to Adult Mode' : 'Switch to Kids Mode'}
        >
            <span style={styles.label}>
                {isKidsMode ? '👶 KIDS' : '🎓 ADULT'}
            </span>
            <div style={styles.toggle}>
                <div style={{
                    ...styles.knob,
                    left: isKidsMode ? 'auto' : '2px',
                    right: isKidsMode ? '2px' : 'auto',
                }}>
                    {isKidsMode ? '🌟' : '♟️'}
                </div>
            </div>
        </button>
    );
}
