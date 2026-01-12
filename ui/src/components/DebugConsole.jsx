/**
 * DebugConsole.jsx - Visual debug panel for frontend logging
 * Captures console.log/warn/error and displays in a collapsible panel
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Trash2, Copy, Bug } from 'lucide-react';

// Global log storage
let globalLogs = [];
let logListeners = [];

// Override console methods to capture logs
const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

const addLog = (type, args) => {
    const message = args.map(a => {
        if (typeof a === 'object') {
            try {
                return JSON.stringify(a, null, 2);
            } catch {
                return String(a);
            }
        }
        return String(a);
    }).join(' ');

    // Filter out irrelevant logs from external plugins
    const IGNORED_PHRASES = [
        'wp.i18n',
        'tutor.js',
        'jQuery.Deferred exception',
        'Cannot destructure property'
    ];

    if (IGNORED_PHRASES.some(phrase => message.includes(phrase))) {
        return;
    }

    const entry = {
        id: Date.now() + Math.random(),
        type,
        message,
        timestamp: new Date().toISOString().split('T')[1].slice(0, 12)
    };

    globalLogs.push(entry);
    // Keep last 200 logs
    if (globalLogs.length > 200) {
        globalLogs = globalLogs.slice(-200);
    }

    // Notify listeners
    logListeners.forEach(fn => fn([...globalLogs]));
};

// Install console interceptors
console.log = (...args) => {
    originalLog(...args);
    addLog('log', args);
};

console.warn = (...args) => {
    originalWarn(...args);
    addLog('warn', args);
};

console.error = (...args) => {
    originalError(...args);
    addLog('error', args);
};

const DebugConsole = ({ botLevel, playerColor, gameInfo }) => {
    const [isExpanded, setIsExpanded] = useState(true); // Start expanded
    const [logs, setLogs] = useState([...globalLogs]);
    const logsEndRef = useRef(null);

    useEffect(() => {
        // Subscribe to log updates
        const handler = (newLogs) => setLogs(newLogs);
        logListeners.push(handler);

        return () => {
            logListeners = logListeners.filter(fn => fn !== handler);
        };
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom
        if (isExpanded && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isExpanded]);

    const clearLogs = () => {
        globalLogs = [];
        setLogs([]);
    };

    const copyLogs = () => {
        const systemInfo = `
=== SYSTEM INFO ===
Bot Level: ${botLevel || 'unknown'}
Player Color: ${playerColor || 'unknown'}
Game Info: ${JSON.stringify(gameInfo || {}, null, 2)}
Time: ${new Date().toISOString()}

=== LOGS ===
`;
        const logText = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(systemInfo + logText);
        alert('Logs copied to clipboard!');
    };

    const getLogColor = (type) => {
        if (type === 'error') return '#EF4444';
        if (type === 'warn') return '#FB923C';
        return '#94A3B8';
    };

    return (
        <div style={{
            backgroundColor: '#151922',
            border: '1px solid #2A303C',
            borderRadius: '6px',
            marginTop: '12px',
            overflow: 'hidden',
            fontSize: '12px'
        }}>
            {/* Header with Action Buttons */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#1A1E26',
                    borderBottom: isExpanded ? '1px solid #2A303C' : 'none'
                }}
            >
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <Bug size={14} style={{ color: '#D4AF37' }} />
                    <span style={{ color: '#D4AF37', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>
                        Debug
                    </span>
                    <span style={{ color: '#64748B', fontSize: '10px' }}>
                        ({logs.length})
                    </span>
                    {isExpanded ? <ChevronUp size={14} color="#64748B" /> : <ChevronDown size={14} color="#64748B" />}
                </div>

                {/* Action buttons - Always visible in header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); clearLogs(); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: '#2A303C',
                            color: '#94A3B8',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '10px'
                        }}
                    >
                        <Trash2 size={12} /> Clear
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); copyLogs(); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: '#D4AF37',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}
                    >
                        <Copy size={12} /> Copy All Logs
                    </button>
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div style={{ padding: '8px' }}>
                    {/* System info */}
                    <div style={{
                        backgroundColor: '#0B0E14',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: '#64748B'
                    }}>
                        <strong style={{ color: '#D4AF37' }}>System Info:</strong><br />
                        • Bot Level: <span style={{ color: '#4ADE80' }}>{botLevel}</span><br />
                        • Player Color: <span style={{ color: '#4ADE80' }}>{playerColor}</span><br />
                        • Moves: <span style={{ color: '#4ADE80' }}>{gameInfo?.moveCount || 0}</span><br />
                        • Analysis Data: <span style={{ color: gameInfo?.hasAnalysis ? '#4ADE80' : '#EF4444' }}>{gameInfo?.hasAnalysis ? 'Yes' : 'No'}</span>
                    </div>

                    {/* Log entries */}
                    <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: '#0B0E14',
                        borderRadius: '4px',
                        padding: '8px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        lineHeight: 1.4
                    }}>
                        {logs.length === 0 ? (
                            <div style={{ color: '#64748B', textAlign: 'center', padding: '16px' }}>
                                No logs yet. Play a game or run analysis to see logs.
                            </div>
                        ) : (
                            logs.map(log => (
                                <div
                                    key={log.id}
                                    style={{
                                        color: getLogColor(log.type),
                                        marginBottom: '4px',
                                        padding: '2px 0',
                                        borderBottom: '1px solid #1A1E26',
                                        wordBreak: 'break-all'
                                    }}
                                >
                                    <span style={{ color: '#64748B' }}>[{log.timestamp}]</span>
                                    {' '}
                                    <span style={{ color: log.type === 'error' ? '#EF4444' : log.type === 'warn' ? '#FB923C' : '#4ADE80' }}>
                                        [{log.type.toUpperCase()}]
                                    </span>
                                    {' '}{log.message}
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugConsole;
