import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Flag, Hand, RotateCw, Clock,
    Zap, Shield, Sword, X, AlertTriangle,
    List, Menu
} from 'lucide-react';
import ChessBoard from './components/ChessBoard.jsx';
import DebugConsole from './components/DebugConsole.jsx';
import { useChessGame } from './hooks/useChessGame.js';
import { formatTime } from './utils/timeFormat.js';

// --- THEME CONSTANTS ---
const THEME = {
    bg: "#0B0E14",
    panel: "#151922",
    panelBorder: "#2A303C",
    accent: "#D4AF37",
    textMain: "#E2E8F0",
    textMuted: "#94A3B8",
};

// --- STYLES ---
const styles = {
    container: {
        height: '100%',
        width: '100%',
        backgroundColor: THEME.bg,
        color: THEME.textMain,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    header: {
        height: '56px',
        borderBottom: `1px solid ${THEME.panelBorder}`,
        backgroundColor: '#0B0E14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 50
    },
    headerTitle: {
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: '0.1em',
        fontSize: '14px',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    liveIndicator: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#EF4444',
        boxShadow: '0 0 10px #EF4444',
        animation: 'pulse 2s infinite'
    },
    coachStatus: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: '#94A3B8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    mainContent: (isMobile) => ({
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden'
    }),
    boardPanel: (isMobile) => ({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: isMobile ? '16px' : '24px',
        backgroundColor: '#080A0F',
        position: 'relative',
        overflowY: isMobile ? 'auto' : 'hidden'
    }),
    gameWrapper: (isMobile) => ({
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: isMobile ? '100%' : 'min(calc(100vh - 340px), 600px)', // Strict constraint to ensure buttons visible
        gap: '10px'
    }),
    playerCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 4px',
        marginBottom: '4px'
    },
    avatarBox: (isUser, isActive) => ({
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: isUser ? THEME.accent : '#1A1E26',
        color: isUser ? '#000' : '#94A3B8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isUser ? `1px solid ${THEME.accent}` : `1px solid ${THEME.panelBorder}`,
        boxShadow: isUser ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
        position: 'relative'
    }),
    userInfo: {
        marginLeft: '12px'
    },
    userName: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 1,
        marginBottom: '4px'
    },
    userRating: {
        fontSize: '11px',
        color: '#94A3B8',
        fontFamily: 'monospace'
    },
    clock: (isActive, isLowTime) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '12px',
        border: `1px solid ${isActive ? (isLowTime ? '#EF4444' : THEME.accent) : THEME.panelBorder}`,
        backgroundColor: isActive ? '#1A1E26' : '#0F1116',
        boxShadow: isActive ? `0 0 20px ${isLowTime ? 'rgba(239,68,68,0.25)' : 'rgba(212,175,55,0.25)'}` : 'none',
        transition: 'all 0.3s',
        opacity: isActive ? 1 : 0.6
    }),
    clockTime: (isActive, isLowTime) => ({
        fontFamily: 'monospace',
        fontSize: '20px',
        fontWeight: 'bold',
        color: isActive ? (isLowTime ? '#EF4444' : 'white') : '#64748B'
    }),
    actionButton: {
        backgroundColor: '#1A1E26',
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '14px',
        borderRadius: '12px',
        border: `1px solid ${THEME.panelBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.2s',
        flex: 1
    },
    rightPanel: {
        width: '400px',
        backgroundColor: THEME.panel,
        borderLeft: `1px solid ${THEME.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
        zIndex: 20
    }
};

// --- COUNTDOWN COMPONENT ---
const GameStartCountdown = ({ onComplete }) => {
    const [count, setCount] = useState(3);
    const [showStart, setShowStart] = useState(false);

    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => setCount(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowStart(true);
            const timer = setTimeout(() => {
                console.log('[Countdown] Calling onComplete callback...');
                onComplete();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [count, onComplete]);

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 100,
            backgroundColor: 'rgba(11,14,20,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ textAlign: 'center' }}>
                {showStart ? (
                    <div style={{
                        fontSize: '64px', fontWeight: 'bold', color: THEME.accent,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        animation: 'fade-out 0.8s forwards'
                    }}>
                        START
                    </div>
                ) : (
                    <div style={{
                        fontSize: '120px', fontWeight: 'bold', color: 'white',
                        fontFamily: 'monospace', textShadow: '0 0 40px rgba(255,255,255,0.2)',
                        animation: 'ping 1s infinite'
                    }}>
                        {count}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function WhiteKnightGamePlay({ settings, onGameEnd, isMobile }) {
    // --- STATE ---
    const {
        gameState,
        isReady,
        makeMove,
        resign,
        offerDraw,
        startGame,
        stopClock
    } = useChessGame();

    const [boardOrientation, setBoardOrientation] = useState('white');
    const [whiteTime, setWhiteTime] = useState(settings?.timeControl ? parseInt(settings.timeControl.split('+')[0]) * 60 : 600);
    const [blackTime, setBlackTime] = useState(settings?.timeControl ? parseInt(settings.timeControl.split('+')[0]) * 60 : 600);
    const [clocks, setClocks] = useState({ w: whiteTime, b: blackTime });

    // Countdown state
    const [gameStarted, setGameStarted] = useState(false);

    // Modals
    const [showResignConfirm, setShowResignConfirm] = useState(false);
    const [showExitWarning, setShowExitWarning] = useState(false);

    // Auto-scroll
    const moveListRef = useRef(null);
    const hasGameEndedRef = useRef(false);

    // Bot Info
    const botInfo = settings?.bot || { name: 'Casual', rating: 1200 };

    // Convert color setting to engine format: 'black'->'b', 'white'->'w', 'random'->random
    // Convert color setting to engine format: 'black'->'b', 'white'->'w', 'random'->random
    const playerColor = useMemo(() => {
        const colorSetting = settings?.color;
        console.log('[LiveGame] Determining player color from settings:', colorSetting);
        if (colorSetting === 'random') return Math.random() > 0.5 ? 'w' : 'b';
        if (colorSetting === 'black' || colorSetting === 'b') return 'b';
        return 'w'; // default to white
    }, [settings?.color]);

    // Shim for wp.i18n to prevent external script errors (tutor.js)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.wp = window.wp || {};
            if (!window.wp.i18n) {
                window.wp.i18n = {
                    __: (s) => s,
                    _x: (s) => s,
                    _n: (s) => s,
                    sprintf: (s) => s
                };
            }
        }
    }, []);

    // --- EFFECTS ---

    // Store the computed playerColor in a ref so it doesn't change on re-render
    const playerColorRef = useRef(playerColor);
    const gameInitializedRef = useRef(false);

    // Keep ref in sync
    useEffect(() => {
        playerColorRef.current = playerColor;
    }, [playerColor]);

    // 1. Initialize board orientation ONLY (game starts after countdown)
    useEffect(() => {
        if (isReady && !gameInitializedRef.current) {
            // Delay orientation setting to ensure ChessBoard is mounted
            const timer = setTimeout(() => {
                const orientation = playerColor === 'b' ? 'black' : 'white';
                console.log('[LiveGame] Setting initial board orientation:', orientation);
                setBoardOrientation(orientation);
            }, 100);

            // Parse initial time for local state
            const tc = settings?.timeControl || '10+0';
            const initialSeconds = parseInt(tc.split('+')[0]) * 60;
            setWhiteTime(initialSeconds);
            setBlackTime(initialSeconds);
            setClocks({ w: initialSeconds, b: initialSeconds });

            return () => clearTimeout(timer);
        }
    }, [isReady, settings, playerColor]);

    // 2. Countdown Completion - NOW we start the game
    const handleCountdownComplete = useCallback(() => {
        console.log('[LiveGame] handleCountdownComplete called, gameInitializedRef:', gameInitializedRef.current);
        if (!gameInitializedRef.current) {
            gameInitializedRef.current = true;
            const tc = settings?.timeControl || '10+0';
            console.log('[LiveGame] Starting game with:', { botLevel: botInfo.name, playerColor, tc });
            startGame({
                botLevel: botInfo.name.toLowerCase(),
                playerColor: playerColor,
                timeControl: tc
            });
        }
        setGameStarted(true);
        console.log('[LiveGame] gameStarted set to true');
    }, [settings, startGame, botInfo, playerColor]);

    // 3. Timer Logic & Timeout Check
    useEffect(() => {
        if (!gameStarted || gameState?.isGameOver || gameState?.gameOver) return;

        const timer = setInterval(() => {
            setClocks(prev => {
                const turn = gameState?.turn || 'w';
                const newTime = Math.max(0, prev[turn] - 1);

                // Local Timeout detection
                if (newTime === 0) {
                    clearInterval(timer);
                    // Force game over state locally to trigger end effect
                    if (onGameEnd) {
                        const result = turn === 'w' ? 'black_won_timeout' : 'white_won_timeout'; // simplified result code
                        // We defer this slightly to ensure render cycle updates
                        setTimeout(() => {
                            stopClock();
                            onGameEnd({
                                fen: gameState.fen,
                                moves: gameState.moves || [],
                                result: result,
                                playerColor: gameState.playerColor,
                                moveCount: Math.ceil((gameState.moves?.length || 0) / 2),
                                clocks: { ...prev, [turn]: 0 }
                            });
                        }, 100);
                    }
                }

                return { ...prev, [turn]: newTime };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameStarted, gameState?.turn, gameState?.isGameOver, gameState?.gameOver, onGameEnd, stopClock]);

    // 4. Handle Game Over & Resign Fix
    // Monitor Game Over status (Checkmate, Stalemate, OR Resign/Timeout)
    useEffect(() => {
        const isEngineGameOver = gameState?.gameOver; // From Resign/Timeout
        const isBoardGameOver = gameState?.isGameOver; // From Checkmate/Draw

        // Only log when there's a game over event (reduce spam)
        if (isEngineGameOver || isBoardGameOver) {
            console.log('[LiveGame] Game Over check:', { isEngineGameOver, isBoardGameOver, hasEnded: hasGameEndedRef.current });
        }

        if ((isEngineGameOver || isBoardGameOver) && !hasGameEndedRef.current) {
            console.log('[LiveGame] Game Over detected! Triggering onGameEnd...');
            hasGameEndedRef.current = true;
            stopClock();

            // Delay slightly to show the move
            setTimeout(() => {
                if (onGameEnd) {
                    const gameEndData = {
                        fen: gameState.fen,
                        moves: gameState.moves || [],
                        result: gameState.gameOver || (isBoardGameOver ? { result: 'draw', reason: 'repetition' } : null), // Fallback
                        playerColor: gameState.playerColor,
                        moveCount: Math.ceil((gameState.moves?.length || 0) / 2),
                        clocks: clocks // Use clocks state directly (not currentClocks)
                    };
                    console.log('[LiveGame] Calling onGameEnd with:', gameEndData);
                    onGameEnd(gameEndData);
                }
            }, 500);
        }
    }, [gameState?.isGameOver, gameState?.gameOver, onGameEnd, stopClock, clocks]);

    // 5. Auto-scroll moves
    useEffect(() => {
        if (moveListRef.current) {
            moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
        }
    }, [gameState?.moves?.length]);

    // --- ACTIONS ---
    const activeTurn = gameState?.turn || 'w';

    // Use last known clocks to avoid flicker
    const currentClocks = clocks;

    const handleMove = useCallback((from, to) => {
        if (!gameStarted) return false;

        // Optimistic update handled by ChessBoard, real update by makeMove
        const result = makeMove(from, to, 'q'); // Auto-queen for simplicity in this view

        // Critical Fix: check result.valid property. makeMove always returns an object.
        return result?.valid === true;
    }, [gameStarted, makeMove]);

    const onResignClick = () => setShowResignConfirm(true);

    const onResignConfirm = () => {
        console.log('[LiveGame] onResignConfirm called');
        setShowResignConfirm(false);
        resign(); // Calls engine resign
        console.log('[LiveGame] resign() called, waiting for gameOver state...');
        // Engine state update will trigger useEffect above
    };

    const onOfferDraw = async () => {
        await offerDraw();
    };

    const ClockDisplay = ({ time, isActive }) => {
        const isLow = time < 30;
        return (
            <div style={styles.clock(isActive, isLow)}>
                <Clock size={18} color={isActive ? (isLow ? '#EF4444' : '#D4AF37') : '#64748B'} />
                <span style={styles.clockTime(isActive, isLow)}>
                    {formatTime(time)}
                </span>
            </div>
        );
    };

    // --- RENDER ---

    if (!isReady) {
        return (
            <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                    width: '40px', height: '40px',
                    borderRadius: '50%', border: '3px solid #2A303C', borderTopColor: THEME.accent,
                    animation: 'spin 1s linear infinite'
                }} />
                <div style={{ marginTop: '20px', color: '#94A3B8', fontSize: '14px', letterSpacing: '0.05em' }}>
                    INITIALIZING ENGINE...
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <style>{`
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                @keyframes fade-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.5); } }
                @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(1.5); opacity: 0; } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0B0E14; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #2A303C; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>

            {/* COUNTDOWN OVERLAY */}
            {!gameStarted && <GameStartCountdown onComplete={handleCountdownComplete} />}

            {/* HEADER */}
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={styles.headerTitle}>
                        <div style={styles.liveIndicator}></div>
                        LIVE GAME (RESTORED)
                    </div>
                    {!isMobile && (
                        <>
                            <div style={{ height: '16px', width: '1px', backgroundColor: '#2A303C' }}></div>
                            <div style={styles.coachStatus}>
                                <Zap size={14} color={THEME.accent} style={{ animation: 'pulse 2s infinite' }} />
                                Coach is analyzing...
                            </div>
                        </>
                    )}
                </div>
                <button
                    onClick={() => setShowExitWarning(true)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '8px' }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div style={styles.mainContent(isMobile)}>

                {/* LEFT: BOARD AREA */}
                <div style={styles.boardPanel(isMobile)}>
                    <div style={styles.gameWrapper(isMobile)}>

                        {/* OPPONENT CARD */}
                        <div style={styles.playerCard}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={styles.avatarBox(false, activeTurn !== (gameState?.playerColor || 'w'))}>
                                    <Shield size={24} />
                                </div>
                                <div style={styles.userInfo}>
                                    <div style={styles.userName}>White Knight {botInfo.name}</div>
                                    <div style={styles.userRating}>Rating: ~{botInfo.rating}</div>
                                </div>
                            </div>
                            <ClockDisplay
                                time={gameState?.playerColor === 'w' ? currentClocks.b : currentClocks.w}
                                isActive={activeTurn !== (gameState?.playerColor || 'w')}
                            />
                        </div>

                        {/* BOARD */}
                        <div style={{
                            width: '100%',
                            aspectRatio: '1/1',
                            maxHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 280px)',
                            position: 'relative',
                            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.5)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#151922'
                        }}>
                            <ChessBoard
                                position={gameState?.fen || 'start'}
                                orientation={boardOrientation}
                                onMove={handleMove}
                                highlightSquares={gameState?.moves?.length > 0 ? [gameState.moves[gameState.moves.length - 1].from, gameState.moves[gameState.moves.length - 1].to] : []}
                                disabled={!gameStarted || gameState?.isGameOver}
                                playerColor={gameState?.playerColor || playerColorRef.current}
                            />
                        </div>

                        {/* PLAYER CARD */}
                        <div style={styles.playerCard}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={styles.avatarBox(true, activeTurn === (gameState?.playerColor || 'w'))}>
                                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>WK</span>
                                </div>
                                <div style={styles.userInfo}>
                                    <div style={styles.userName}>Hero User</div>
                                    <div style={{ ...styles.userRating, animation: 'pulse 2s infinite' }}>Calculating...</div>
                                </div>
                            </div>
                            <ClockDisplay
                                time={gameState?.playerColor === 'w' ? currentClocks.w : currentClocks.b}
                                isActive={activeTurn === (gameState?.playerColor || 'w')}
                            />
                        </div>

                        {/* ACTIONS - MOBILE/DESKTOP */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px', marginBottom: isMobile ? '24px' : '12px', paddingBottom: isMobile ? '60px' : '0' }}>
                            <button onClick={onResignClick} style={{ ...styles.actionButton, '&:hover': { color: '#EF4444', borderColor: '#EF4444' } }}>
                                <Flag size={16} /> Resign
                            </button>
                            <button onClick={onOfferDraw} style={styles.actionButton}>
                                <Hand size={16} /> Draw
                            </button>
                            <button onClick={() => {
                                // Delay flip slightly to avoid chessboard queue conflict
                                setTimeout(() => {
                                    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
                                }, 50);
                            }} style={styles.actionButton}>
                                <RotateCw size={16} /> Flip
                            </button>
                        </div>

                    </div>

                    {/* Debug Console - Desktop Only (Fixed Position) */}
                    {!isMobile && (
                        <div style={{ position: 'fixed', bottom: '16px', left: '16px', width: '400px', maxHeight: '300px', zIndex: 1000, opacity: 0.9 }}>
                            <DebugConsole
                                botLevel={botInfo.name}
                                playerColor={gameState?.playerColor}
                                gameInfo={{
                                    moveCount: gameState?.moveHistory?.length || 0,
                                    currentTurn: activeTurn,
                                    isGameOver: gameState?.isGameOver
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT: INFO PANEL (Desktop Only) */}
                {!isMobile && (
                    <div style={styles.rightPanel}>
                        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${THEME.panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#151922' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <List size={14} color={THEME.accent} /> Move History
                            </span>
                        </div>

                        <div ref={moveListRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0B0E14', display: 'flex', flexDirection: 'column' }}>
                            {/* MOVES */}
                            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', fontSize: '11px', fontWeight: 'bold', color: '#64748B', borderBottom: `1px solid ${THEME.panelBorder}`, padding: '8px 0', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: '#0B0E14', zIndex: 10 }}>
                                <span>#</span><span>WHITE</span><span>BLACK</span>
                            </div>

                            {gameState?.moves && (function () {
                                const moves = [];
                                // Use gameState.moves instead of .moveHistory
                                for (let i = 0; i < gameState.moves.length; i += 2) {
                                    moves.push({
                                        num: (i / 2) + 1,
                                        w: gameState.moves[i],
                                        b: gameState.moves[i + 1]
                                    });
                                }
                                return moves.map((m, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', fontSize: '14px', fontFamily: 'monospace', color: '#E2E8F0', padding: '8px 0', borderBottom: '1px solid #1A1E26', backgroundColor: i % 2 === 0 ? 'transparent' : '#12141A' }}>
                                        <span style={{ color: '#64748B', textAlign: 'center', borderRight: '1px solid #2A303C' }}>{m.num}.</span>
                                        <span style={{ paddingLeft: '16px' }}>{m.w.san || m.w}</span>
                                        <span style={{ paddingLeft: '16px', borderLeft: '1px solid #2A303C' }}>{m.b?.san || m.b || ''}</span>
                                    </div>
                                ));
                            })()}
                        </div>

                        <div style={{ padding: '16px', borderTop: `1px solid ${THEME.panelBorder}`, backgroundColor: '#151922', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11px', color: '#94A3B8' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }}></div>
                                Connection Stable
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* MODALS */}
            {/* RESIGN CONFIRM */}
            {showResignConfirm && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ backgroundColor: '#151922', border: `1px solid ${THEME.panelBorder}`, borderRadius: '16px', padding: '32px', maxWidth: '320px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
                        <AlertTriangle size={32} color={THEME.accent} style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Are you sure?</h3>
                        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.5 }}>
                            Do you really want to resign the game? This counts as a loss.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowResignConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.panelBorder}`, backgroundColor: 'transparent', color: '#94A3B8', fontWeight: 'bold', cursor: 'pointer' }}>
                                CANCEL
                            </button>
                            <button onClick={onResignConfirm} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: THEME.accent, color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>
                                RESIGN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EXIT WARNING */}
            {showExitWarning && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ backgroundColor: '#151922', border: `1px solid ${THEME.panelBorder}`, borderRadius: '16px', padding: '32px', maxWidth: '320px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
                        <AlertTriangle size={32} color="#EF4444" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Game in Progress</h3>
                        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.5 }}>
                            The game will continue in background. You might lose on time.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowExitWarning(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.panelBorder}`, backgroundColor: 'transparent', color: '#94A3B8', fontWeight: 'bold', cursor: 'pointer' }}>
                                STAY
                            </button>
                            <button onClick={() => { setShowExitWarning(false); window.location.reload(); }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                LEAVE
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
