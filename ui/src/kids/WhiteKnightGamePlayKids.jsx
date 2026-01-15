import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Flag, Hand, RotateCw, Clock, Zap, X, AlertTriangle, List } from 'lucide-react';
import ChessBoard from '../components/ChessBoard.jsx';
import DebugConsole from '../components/DebugConsole.jsx';
import { useChessGame } from '../hooks/useChessGame.js';
import { useTheme } from '../context/ThemeContext';

// Fallback components
const SafeChessBoard = ChessBoard || (() => <div style={{ color: 'red' }}>ChessBoard UNDEFINED!</div>);
const SafeDebugConsole = DebugConsole || (() => null);

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    KIDS DESIGN - LIVE GAME MODULE                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🎮 Same functionality as Adult, colorful Kids styling                       ║
║  🎨 Gradient background, emojis, fun countdown                               ║
║  📐 Responsive design matching Adult breakpoints                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

// --- KIDS THEME ---
const KIDS_THEME = {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#ffd93d',
    secondary: '#4ecdc4',
    purple: '#a855f7',
    pink: '#ff6b9d',
    green: '#22c55e',
    red: '#ef4444',
    panelBg: 'rgba(0,0,0,0.4)',
    panelBorder: 'rgba(255,217,61,0.2)',
    textMain: 'white',
    textMuted: '#94a3b8'
};

// --- KIDS COUNTDOWN COMPONENT ---
const KidsCountdown = ({ onComplete }) => {
    const [count, setCount] = useState(3);
    const [showGo, setShowGo] = useState(false);

    const countColors = ['#ef4444', '#ffd93d', '#22c55e'];
    const countEmojis = ['🔴', '🟡', '🟢'];

    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => setCount(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowGo(true);
            const timer = setTimeout(() => {
                console.log('[KidsCountdown] GO! Calling onComplete...');
                onComplete();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [count, onComplete]);

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ textAlign: 'center' }}>
                {showGo ? (
                    <div style={{
                        fontSize: '80px', fontWeight: '800',
                        background: 'linear-gradient(90deg, #ffd93d, #ff9f43, #ef4444, #a855f7, #4ecdc4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'fade-out 0.8s forwards'
                    }}>
                        🚀 GO!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '40px' }}>{countEmojis[3 - count - 1] || '🎮'}</div>
                        <div style={{
                            fontSize: '140px', fontWeight: '800',
                            color: countColors[3 - count - 1] || '#ffd93d',
                            textShadow: `0 0 60px ${countColors[3 - count - 1] || '#ffd93d'}40`,
                            animation: 'ping 1s infinite',
                            fontFamily: 'system-ui, sans-serif'
                        }}>
                            {count}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '16px', fontWeight: '600' }}>
                            Get Ready! 🎯
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- LOADING COMPONENT ---
const KidsLoading = () => (
    <div style={{
        height: '100%', width: '100%',
        background: KIDS_THEME.bg,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center'
    }}>
        <div style={{
            width: '60px', height: '60px',
            borderRadius: '50%',
            border: '4px solid rgba(255,217,61,0.2)',
            borderTopColor: KIDS_THEME.accent,
            animation: 'spin 1s linear infinite'
        }} />
        <div style={{ marginTop: '24px', color: KIDS_THEME.accent, fontSize: '16px', fontWeight: '700' }}>
            🧙‍♂️ LOADING ENGINE...
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
);

// --- UTILITY ---
const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

// Helper to parse timeControl (handles both object and string formats)
const getTimeInSeconds = (tc) => {
    if (!tc) return 600; // default 10 min
    if (typeof tc === 'object' && tc.minutes !== undefined) {
        return tc.minutes * 60;
    }
    if (typeof tc === 'string') {
        return parseInt(tc.split('+')[0]) * 60;
    }
    return 600;
};

const formatTimeControl = (tc) => {
    if (!tc) return '10+0';
    if (typeof tc === 'object' && tc.minutes !== undefined) {
        return `${tc.minutes}+${tc.increment || 0}`;
    }
    return tc;
};

// --- MAIN COMPONENT ---
export default function WhiteKnightGamePlayKids({ settings, onGameEnd, isMobile }) {
    const { toggleTheme } = useTheme();

    const {
        gameState, isReady, makeMove, resign, offerDraw, startGame, stopClock, getLegalMoves
    } = useChessGame();

    const [boardOrientation, setBoardOrientation] = useState('white');
    const initialTimeSeconds = getTimeInSeconds(settings?.timeControl);
    const [whiteTime, setWhiteTime] = useState(initialTimeSeconds);
    const [blackTime, setBlackTime] = useState(initialTimeSeconds);
    const [clocks, setClocks] = useState({ w: initialTimeSeconds, b: initialTimeSeconds });
    const [gameStarted, setGameStarted] = useState(false);
    const [showResignConfirm, setShowResignConfirm] = useState(false);

    const moveListRef = useRef(null);
    const hasGameEndedRef = useRef(false);
    const playerColorRef = useRef(null);
    const gameInitializedRef = useRef(false);

    const botInfo = settings?.bot || { name: 'Casual', rating: 1200, emoji: '😊' };

    const playerColor = useMemo(() => {
        const colorSetting = settings?.color;
        if (colorSetting === 'random') return Math.random() > 0.5 ? 'w' : 'b';
        if (colorSetting === 'black' || colorSetting === 'b') return 'b';
        return 'w';
    }, [settings?.color]);

    useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);

    // Initialize board orientation
    useEffect(() => {
        if (isReady && !gameInitializedRef.current) {
            const timer = setTimeout(() => {
                setBoardOrientation(playerColor === 'b' ? 'black' : 'white');
            }, 100);
            const initialSeconds = getTimeInSeconds(settings?.timeControl);
            setWhiteTime(initialSeconds);
            setBlackTime(initialSeconds);
            setClocks({ w: initialSeconds, b: initialSeconds });
            return () => clearTimeout(timer);
        }
    }, [isReady, settings, playerColor]);

    // Countdown completion
    const handleCountdownComplete = useCallback(() => {
        if (!gameInitializedRef.current) {
            gameInitializedRef.current = true;
            const tc = formatTimeControl(settings?.timeControl);
            startGame({
                botLevel: botInfo.name.toLowerCase(),
                playerColor: playerColor,
                timeControl: tc
            });
        }
        setGameStarted(true);
    }, [settings, startGame, botInfo, playerColor]);

    // Timer logic
    useEffect(() => {
        if (!gameStarted || gameState?.isGameOver) return;
        const timer = setInterval(() => {
            setClocks(prev => {
                const turn = gameState?.turn || 'w';
                const newTime = Math.max(0, prev[turn] - 1);
                if (newTime === 0 && !hasGameEndedRef.current) {
                    hasGameEndedRef.current = true;
                    stopClock?.();
                }
                return { ...prev, [turn]: newTime };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, gameState?.turn, gameState?.isGameOver, stopClock]);

    // Game end detection
    useEffect(() => {
        if ((gameState?.isGameOver || gameState?.gameOver) && !hasGameEndedRef.current) {
            hasGameEndedRef.current = true;
            const result = gameState?.result || gameState?.gameResult || 'unknown';
            setTimeout(() => onGameEnd?.(result, gameState?.moves || []), 500);
        }
    }, [gameState?.isGameOver, gameState?.gameOver, gameState?.result, gameState?.gameResult, gameState?.moves, onGameEnd]);

    // Auto-scroll moves
    useEffect(() => {
        if (moveListRef.current) {
            moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
        }
    }, [gameState?.moves]);

    const handleMove = useCallback((from, to) => {
        if (gameState?.isGameOver || !gameStarted) return false;
        return makeMove(from, to);
    }, [makeMove, gameState?.isGameOver, gameStarted]);

    const activeTurn = gameState?.turn || 'w';
    const currentClocks = { w: clocks.w, b: clocks.b };

    const onResignClick = () => setShowResignConfirm(true);
    const onResignConfirm = () => {
        setShowResignConfirm(false);
        resign();
    };
    const onOfferDraw = async () => { await offerDraw(); };

    // Clock display component
    const ClockDisplay = ({ time, isActive }) => {
        const isLow = time < 30;
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: isActive ? 'linear-gradient(135deg, #ffd93d, #ff9f43)' : 'rgba(0,0,0,0.4)',
                padding: '8px 16px', borderRadius: '20px',
                border: isActive ? 'none' : '2px solid rgba(255,255,255,0.1)',
                boxShadow: isActive ? '0 4px 20px rgba(255,217,61,0.4)' : 'none'
            }}>
                <span style={{ fontSize: '14px' }}>{isActive ? '⏱️' : '🕐'}</span>
                <span style={{
                    fontWeight: '700', fontSize: '18px', fontFamily: 'monospace',
                    color: isActive ? '#1a1a2e' : (isLow ? '#ef4444' : 'white')
                }}>
                    {formatTime(time)}
                </span>
            </div>
        );
    };

    // --- RENDER ---
    if (!isReady) return <KidsLoading />;

    return (
        <div style={{
            height: '100%', width: '100%',
            background: KIDS_THEME.bg,
            color: 'white', fontFamily: 'system-ui, sans-serif',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Stars background */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
                backgroundImage: `
                    radial-gradient(2px 2px at 20px 30px, #ffd93d, transparent),
                    radial-gradient(2px 2px at 40px 70px, #4ecdc4, transparent),
                    radial-gradient(2px 2px at 90px 40px, #a855f7, transparent)
                `,
                backgroundSize: '200px 200px'
            }} />

            <style>{`
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                @keyframes fade-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.5); } }
                @keyframes ping { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
                .kids-scrollbar::-webkit-scrollbar { width: 6px; }
                .kids-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .kids-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,217,61,0.3); border-radius: 3px; }
            `}</style>

            {/* COUNTDOWN OVERLAY */}
            {!gameStarted && <KidsCountdown onComplete={handleCountdownComplete} />}

            {/* HEADER */}
            <header style={{
                height: '64px',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                borderBottom: '2px solid rgba(255,217,61,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', flexShrink: 0, zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase'
                    }}>
                        <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: '#22c55e', boxShadow: '0 0 12px #22c55e',
                            animation: 'pulse 2s infinite'
                        }} />
                        <span style={{ fontSize: '14px' }}>🎮 LIVE GAME</span>
                    </div>
                    {!isMobile && (
                        <>
                            <div style={{ height: '20px', width: '2px', background: 'rgba(255,217,61,0.3)' }} />
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '12px', color: '#ffd93d', fontWeight: '600'
                            }}>
                                <Zap size={16} style={{ animation: 'pulse 2s infinite' }} />
                                🧙‍♂️ Coach is thinking...
                            </div>
                        </>
                    )}
                </div>
                <button onClick={() => onGameEnd?.('abandoned', [])} style={{
                    padding: '10px', background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer'
                }}>
                    <X size={22} />
                </button>
            </header>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* BOARD PANEL */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    padding: isMobile ? '16px' : '24px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: isMobile ? '100%' : '520px',
                        display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                        {/* OPPONENT CARD */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 16px',
                            background: activeTurn !== (gameState?.playerColor || 'w') ? 'rgba(168,85,247,0.2)' : 'rgba(0,0,0,0.3)',
                            borderRadius: '16px',
                            border: activeTurn !== (gameState?.playerColor || 'w') ? '2px solid rgba(168,85,247,0.4)' : '2px solid transparent',
                            transition: 'all 0.3s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px'
                                }}>
                                    {botInfo.emoji || '🤖'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{botInfo.name || 'White Knight'} Casual</div>
                                    <div style={{ color: '#a855f7', fontSize: '12px' }}>Rating: ~{botInfo.rating || 1200}</div>
                                </div>
                            </div>
                            <ClockDisplay
                                time={gameState?.playerColor === 'w' ? currentClocks.b : currentClocks.w}
                                isActive={activeTurn !== (gameState?.playerColor || 'w')}
                            />
                        </div>

                        {/* BOARD */}
                        <div style={{
                            width: '100%', aspectRatio: '1/1',
                            position: 'relative', borderRadius: '12px', overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            border: '3px solid rgba(255,217,61,0.2)'
                        }}>
                            <SafeChessBoard
                                position={gameState?.fen || 'start'}
                                orientation={boardOrientation}
                                onMove={handleMove}
                                getValidMoves={getLegalMoves}
                                highlightSquares={gameState?.moves?.length > 0 ? [gameState.moves[gameState.moves.length - 1].from, gameState.moves[gameState.moves.length - 1].to] : []}
                                disabled={!gameStarted || gameState?.isGameOver}
                                playerColor={gameState?.playerColor || playerColorRef.current}
                            />
                        </div>

                        {/* PLAYER CARD */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 16px',
                            background: activeTurn === (gameState?.playerColor || 'w') ? 'rgba(255,217,61,0.15)' : 'rgba(0,0,0,0.3)',
                            borderRadius: '16px',
                            border: activeTurn === (gameState?.playerColor || 'w') ? '2px solid rgba(255,217,61,0.4)' : '2px solid transparent',
                            transition: 'all 0.3s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '18px', fontWeight: '800', color: '#1a1a2e'
                                }}>
                                    WK
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>Hero User</div>
                                    <div style={{ color: '#22c55e', fontSize: '11px', animation: 'pulse 2s infinite' }}>⭐ Playing...</div>
                                </div>
                            </div>
                            <ClockDisplay
                                time={gameState?.playerColor === 'w' ? currentClocks.w : currentClocks.b}
                                isActive={activeTurn === (gameState?.playerColor || 'w')}
                            />
                        </div>

                        {/* ACTION BUTTONS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                            <button onClick={onResignClick} style={{
                                padding: '14px', background: 'rgba(239,68,68,0.15)',
                                border: '2px solid rgba(239,68,68,0.3)', borderRadius: '14px',
                                color: '#ef4444', fontWeight: '700', fontSize: '12px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}>
                                🏳️ RESIGN
                            </button>
                            <button onClick={onOfferDraw} style={{
                                padding: '14px', background: 'rgba(78,205,196,0.15)',
                                border: '2px solid rgba(78,205,196,0.3)', borderRadius: '14px',
                                color: '#4ecdc4', fontWeight: '700', fontSize: '12px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}>
                                🤝 DRAW
                            </button>
                            <button onClick={() => setTimeout(() => setBoardOrientation(p => p === 'white' ? 'black' : 'white'), 50)} style={{
                                padding: '14px', background: 'rgba(168,85,247,0.15)',
                                border: '2px solid rgba(168,85,247,0.3)', borderRadius: '14px',
                                color: '#a855f7', fontWeight: '700', fontSize: '12px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}>
                                🔄 FLIP
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: MOVE HISTORY (Desktop) */}
                {!isMobile && (
                    <aside style={{
                        width: '360px', flexShrink: 0,
                        background: 'rgba(0,0,0,0.4)',
                        borderLeft: '2px solid rgba(255,217,61,0.1)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '2px solid rgba(255,217,61,0.1)',
                            background: 'rgba(0,0,0,0.3)'
                        }}>
                            <span style={{
                                fontSize: '13px', fontWeight: '700', color: '#ffd93d',
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                📜 Move History
                            </span>
                        </div>

                        <div ref={moveListRef} className="kids-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                            <div style={{
                                display: 'grid', gridTemplateColumns: '50px 1fr 1fr',
                                fontSize: '11px', fontWeight: '700', color: '#64748b',
                                borderBottom: '1px solid rgba(255,217,61,0.1)',
                                padding: '8px 0', textAlign: 'center',
                                position: 'sticky', top: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5
                            }}>
                                <span>#</span><span>⬜ WHITE</span><span>⬛ BLACK</span>
                            </div>

                            {gameState?.moves && (() => {
                                const rows = [];
                                for (let i = 0; i < gameState.moves.length; i += 2) {
                                    rows.push({
                                        num: (i / 2) + 1,
                                        w: gameState.moves[i],
                                        b: gameState.moves[i + 1]
                                    });
                                }
                                return rows.map((row, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid', gridTemplateColumns: '50px 1fr 1fr',
                                        padding: '10px 0', textAlign: 'center',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        fontSize: '13px'
                                    }}>
                                        <span style={{ color: '#ffd93d', fontWeight: '700' }}>{row.num}</span>
                                        <span style={{ color: 'white' }}>{row.w?.san || ''}</span>
                                        <span style={{ color: '#a855f7' }}>{row.b?.san || ''}</span>
                                    </div>
                                ));
                            })()}
                        </div>

                        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,217,61,0.1)', textAlign: 'center' }}>
                            <span style={{ color: '#22c55e', fontSize: '11px' }}>🟢 Connection Stable</span>
                        </div>
                    </aside>
                )}
            </div>

            {/* RESIGN CONFIRM MODAL */}
            {showResignConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        borderRadius: '24px', padding: '32px', width: '340px',
                        border: '3px solid rgba(239,68,68,0.4)', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏳️</div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Resign Game?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
                            Are you sure you want to resign? This will count as a loss.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowResignConfirm(false)} style={{
                                flex: 1, padding: '14px', background: 'rgba(255,255,255,0.1)',
                                border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px',
                                color: 'white', fontWeight: '700', cursor: 'pointer'
                            }}>
                                Cancel
                            </button>
                            <button onClick={onResignConfirm} style={{
                                flex: 1, padding: '14px', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                border: 'none', borderRadius: '12px',
                                color: 'white', fontWeight: '700', cursor: 'pointer'
                            }}>
                                Yes, Resign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
