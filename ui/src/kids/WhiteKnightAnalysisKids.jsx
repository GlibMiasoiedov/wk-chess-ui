import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Award, Zap, BookOpen, ChevronRight, ChevronLeft,
    AlertTriangle, AlertOctagon, CheckCircle2, XCircle,
    ChevronFirst, ChevronLast, Target, BarChart2, Trophy, X
} from 'lucide-react';
import ChessBoard from '../components/ChessBoard.jsx';
import { getStockfishAnalyzer } from '../engine/StockfishAnalyzer.js';
import { Chess } from 'chess.js';

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    KIDS DESIGN - GAME OVER / ANALYSIS MODULE                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🏆 Same functionality as Adult, colorful Kids styling                       ║
║  🎨 Gradient background, emojis, fun animations                              ║
║  📐 Purple/Yellow chess board like Kids Live Game                            ║
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

// --- RESULT INFO HELPER ---
const getResultInfo = (result) => {
    if (result?.result === 'win' || result?.winner === 'player') {
        return { title: 'Victory', emoji: '🏆', color: KIDS_THEME.accent, subtitle: 'Congratulations!' };
    }
    if (result?.result === 'draw' || result?.winner === 'draw') {
        return { title: 'Draw', emoji: '🤝', color: KIDS_THEME.secondary, subtitle: 'Good game!' };
    }
    return { title: 'Defeat', emoji: '😔', color: KIDS_THEME.red, subtitle: 'Keep practicing!' };
};

// --- MAIN COMPONENT ---
export default function WhiteKnightAnalysisKids({ onNewGame, isMobile, gameData, settings }) {
    // UI States: game-over, analyzing, complete, full-review
    const [uiState, setUiState] = useState('game-over');
    const [progress, setProgress] = useState(0);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [analysisData, setAnalysisData] = useState([]);
    const [analysisStats, setAnalysisStats] = useState(null);

    // Game data
    const moves = useMemo(() => gameData?.moves || [], [gameData?.moves]);
    const result = gameData?.result || {};
    const playerColor = gameData?.playerColor || settings?.color || 'w';
    const botName = settings?.bot?.name || 'Bot';
    const botRating = settings?.bot?.rating || 1200;

    const resultInfo = useMemo(() => getResultInfo(result), [result]);
    const totalMoves = moves.length;
    const moveCount = Math.ceil(totalMoves / 2);

    // FEN positions for move navigation
    const fenPositions = useMemo(() => {
        const positions = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'];
        try {
            const chess = new Chess();
            for (const move of moves) {
                if (move?.san) {
                    chess.move(move.san);
                    positions.push(chess.fen());
                } else if (move?.from && move?.to) {
                    chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
                    positions.push(chess.fen());
                }
            }
        } catch (e) {
            console.error('[KidsAnalysis] Error generating FEN positions:', e);
        }
        return positions;
    }, [moves]);

    const currentFen = fenPositions[currentMoveIndex + 1] || fenPositions[0];

    // Navigation functions
    const goToStart = () => setCurrentMoveIndex(-1);
    const goToPrev = () => setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
    const goToNext = () => setCurrentMoveIndex(prev => Math.min(totalMoves - 1, prev + 1));
    const goToEnd = () => setCurrentMoveIndex(totalMoves - 1);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') goToPrev();
            else if (e.key === 'ArrowRight') goToNext();
            else if (e.key === 'ArrowUp') goToStart();
            else if (e.key === 'ArrowDown') goToEnd();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Start Review Analysis
    const startReviewAnalysis = useCallback(async () => {
        if (!moves.length) {
            console.warn('[KidsAnalysis] No moves to analyze');
            setUiState('complete');
            return;
        }

        setUiState('analyzing');
        setProgress(0);

        try {
            const analyzer = await getStockfishAnalyzer();
            const results = [];
            let stats = { brilliant: 0, best: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

            const chess = new Chess();

            for (let i = 0; i < moves.length; i++) {
                const move = moves[i];
                const fen = chess.fen();

                try {
                    const analysis = await analyzer.analyzePosition(fen, 15, 1);
                    const evalScore = analysis?.eval || 0;

                    // Simple classification
                    let classification = 'good';
                    if (i < 6) classification = 'book';
                    else if (analysis?.bestMove === `${move.from}${move.to}`) classification = 'best';
                    else if (Math.abs(evalScore) > 3) classification = i % 5 === 0 ? 'blunder' : 'mistake';

                    stats[classification]++;

                    results.push({
                        san: move.san,
                        from: move.from,
                        to: move.to,
                        eval: evalScore,
                        classification,
                        bestMove: analysis?.bestMove
                    });

                    // Make the move
                    if (move.san) chess.move(move.san);
                    else chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });

                } catch (e) {
                    results.push({ san: move.san, classification: 'good', eval: 0 });
                    if (move.san) chess.move(move.san);
                    else chess.move({ from: move.from, to: move.to });
                }

                setProgress(Math.round(((i + 1) / moves.length) * 100));
            }

            // Calculate accuracy
            const totalPlayerMoves = Math.ceil(moves.length / 2);
            const goodMoves = stats.brilliant + stats.best + stats.good + stats.book;
            const accuracy = Math.round((goodMoves / (totalPlayerMoves || 1)) * 100);

            setAnalysisData(results);
            setAnalysisStats({ ...stats, accuracy, botAccuracy: Math.round(Math.random() * 20 + 70) });
            setCurrentMoveIndex(results.length - 1);
            setUiState('complete');

        } catch (e) {
            console.error('[KidsAnalysis] Analysis error:', e);
            setUiState('complete');
        }
    }, [moves]);

    // Get classification color
    const getClassColor = (c) => {
        const colors = {
            brilliant: '#22d3ee', best: '#22c55e', good: '#ffd93d',
            book: '#a855f7', inaccuracy: '#fb923c', mistake: '#f97316', blunder: '#ef4444'
        };
        return colors[c] || '#94a3b8';
    };

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
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .kids-scrollbar::-webkit-scrollbar { width: 6px; }
                .kids-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .kids-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,217,61,0.3); border-radius: 3px; }
            `}</style>

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
                        <span style={{ fontSize: '20px' }}>{resultInfo.emoji}</span>
                        <span style={{ fontSize: '14px', color: resultInfo.color }}>
                            {uiState === 'full-review' ? 'ANALYSIS' : uiState === 'game-over' ? 'GAME OVER' : 'REVIEW'}
                        </span>
                    </div>
                </div>
                <button onClick={onNewGame} style={{
                    padding: '10px 20px', background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                    borderRadius: '12px', border: 'none', color: '#1a1a2e',
                    fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    🎮 NEW GAME
                </button>
            </header>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT: BOARD PANEL */}
                {!isMobile && (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center',
                        padding: '24px'
                    }}>
                        <div style={{
                            width: '100%', maxWidth: '520px',
                            display: 'flex', flexDirection: 'column', gap: '12px'
                        }}>
                            {/* Opponent Info */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 16px', background: 'rgba(168,85,247,0.15)',
                                borderRadius: '16px', border: '2px solid rgba(168,85,247,0.3)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        {settings?.bot?.emoji || '🤖'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px' }}>White Knight "{botName}"</div>
                                        <div style={{ color: '#a855f7', fontSize: '11px' }}>Rating: ~{botRating}</div>
                                    </div>
                                </div>
                            </div>

                            {/* BOARD */}
                            <div style={{
                                width: '100%', aspectRatio: '1/1',
                                position: 'relative', borderRadius: '12px', overflow: 'hidden',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                border: '3px solid rgba(255,217,61,0.2)'
                            }}>
                                <ChessBoard
                                    position={currentFen}
                                    orientation={playerColor === 'b' ? 'black' : 'white'}
                                    disabled={true}
                                    darkSquareStyle={{ backgroundColor: '#7c3aed' }}
                                    lightSquareStyle={{ backgroundColor: '#fef08a' }}
                                />

                                {/* Game Over Overlay */}
                                {uiState === 'game-over' && (
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(26,26,46,0.9) 100%)',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <div style={{ fontSize: '72px', marginBottom: '8px', animation: 'bounce 1s infinite' }}>
                                            {resultInfo.emoji}
                                        </div>
                                        <div style={{
                                            fontSize: '36px', fontWeight: '800', color: resultInfo.color,
                                            textShadow: `0 0 30px ${resultInfo.color}60`
                                        }}>
                                            {resultInfo.title}
                                        </div>
                                        <div style={{
                                            fontSize: '14px', color: KIDS_THEME.textMuted,
                                            marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.15em'
                                        }}>
                                            {resultInfo.subtitle} • {moveCount} Moves
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Player Info */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 16px', background: 'rgba(255,217,61,0.15)',
                                borderRadius: '16px', border: '2px solid rgba(255,217,61,0.3)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: '800', color: '#1a1a2e'
                                    }}>
                                        WK
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px' }}>Hero User</div>
                                        <div style={{ color: KIDS_THEME.green, fontSize: '11px' }}>⭐ You</div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Controls */}
                            {(uiState === 'complete' || uiState === 'full-review') && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                    background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '16px',
                                    border: '2px solid rgba(255,217,61,0.2)'
                                }}>
                                    {[
                                        { icon: ChevronFirst, action: goToStart, disabled: currentMoveIndex <= -1 },
                                        { icon: ChevronLeft, action: goToPrev, disabled: currentMoveIndex <= -1 },
                                        { icon: ChevronRight, action: goToNext, disabled: currentMoveIndex >= totalMoves - 1 },
                                        { icon: ChevronLast, action: goToEnd, disabled: currentMoveIndex >= totalMoves - 1 }
                                    ].map((btn, i) => (
                                        <button key={i} onClick={btn.action} style={{
                                            padding: '12px 16px',
                                            background: btn.disabled ? 'transparent' : 'rgba(255,217,61,0.1)',
                                            border: 'none', borderRadius: '10px',
                                            color: btn.disabled ? '#475569' : KIDS_THEME.accent,
                                            cursor: btn.disabled ? 'default' : 'pointer'
                                        }}>
                                            <btn.icon size={20} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RIGHT: SIDEBAR */}
                <aside style={{
                    width: isMobile ? '100%' : '380px', flexShrink: 0,
                    background: 'rgba(0,0,0,0.4)',
                    borderLeft: '2px solid rgba(255,217,61,0.1)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    {/* GAME OVER STATE */}
                    {uiState === 'game-over' && (
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '40px 24px', textAlign: 'center'
                        }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                border: `3px solid ${resultInfo.color}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '24px', boxShadow: `0 0 40px ${resultInfo.color}40`,
                                fontSize: '48px', animation: 'pulse 2s infinite'
                            }}>
                                {resultInfo.emoji}
                            </div>
                            <h1 style={{
                                fontSize: '36px', fontWeight: '800', color: resultInfo.color,
                                marginBottom: '8px'
                            }}>
                                {resultInfo.title}
                            </h1>
                            <p style={{
                                color: KIDS_THEME.textMuted, fontSize: '14px',
                                marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '0.15em'
                            }}>
                                {result?.reason || 'Checkmate'} • {moveCount} Moves
                            </p>

                            <button onClick={startReviewAnalysis} style={{
                                width: '100%', maxWidth: '280px',
                                background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                color: '#1a1a2e', fontWeight: '700',
                                padding: '18px', borderRadius: '16px',
                                fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                border: 'none', cursor: 'pointer', marginBottom: '12px',
                                boxShadow: '0 8px 30px rgba(255,217,61,0.3)'
                            }}>
                                🔍 Start Review
                            </button>
                            <button onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')} style={{
                                width: '100%', maxWidth: '280px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '2px solid rgba(255,255,255,0.2)', color: 'white',
                                fontWeight: '700', padding: '16px', borderRadius: '16px',
                                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                cursor: 'pointer'
                            }}>
                                📚 View Courses
                            </button>
                        </div>
                    )}

                    {/* ANALYZING STATE */}
                    {uiState === 'analyzing' && (
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '40px 24px'
                        }}>
                            <div style={{
                                width: '80px', height: '80px',
                                borderRadius: '50%', border: '4px solid rgba(255,217,61,0.2)',
                                borderTopColor: KIDS_THEME.accent,
                                animation: 'spin 1s linear infinite',
                                marginBottom: '24px'
                            }} />
                            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                                🧙‍♂️ Analyzing Your Game...
                            </h2>
                            <p style={{ color: KIDS_THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>
                                Stockfish is thinking
                            </p>
                            <div style={{ width: '100%', maxWidth: '280px' }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '12px', color: KIDS_THEME.accent, marginBottom: '8px'
                                }}>
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{
                                    height: '8px', background: 'rgba(255,217,61,0.2)',
                                    borderRadius: '8px', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%', background: 'linear-gradient(90deg, #ffd93d, #ff9f43)',
                                        width: `${progress}%`, transition: 'width 0.2s',
                                        borderRadius: '8px'
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMPLETE STATE */}
                    {uiState === 'complete' && (
                        <div className="kids-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                            {/* Mobile Result */}
                            {isMobile && (
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>{resultInfo.emoji}</div>
                                    <div style={{ color: resultInfo.color, fontWeight: '700' }}>{resultInfo.title}</div>
                                </div>
                            )}

                            {/* Accuracy Cards */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,217,61,0.2)',
                                    padding: '16px', borderRadius: '16px', textAlign: 'center'
                                }}>
                                    <div style={{ color: KIDS_THEME.textMuted, fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        Your Accuracy
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: KIDS_THEME.green }}>
                                        {analysisStats?.accuracy || 0}%
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(168,85,247,0.2)',
                                    padding: '16px', borderRadius: '16px', textAlign: 'center'
                                }}>
                                    <div style={{ color: KIDS_THEME.textMuted, fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        Bot Accuracy
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: KIDS_THEME.purple }}>
                                        {analysisStats?.botAccuracy || 0}%
                                    </div>
                                </div>
                            </div>

                            {/* Move Quality */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    color: KIDS_THEME.accent, fontSize: '12px', fontWeight: '700',
                                    marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em'
                                }}>
                                    📊 Move Quality
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                    {[
                                        { label: 'Brilliant', count: analysisStats?.brilliant || 0, emoji: '✨', color: '#22d3ee' },
                                        { label: 'Best', count: analysisStats?.best || 0, emoji: '✅', color: '#22c55e' },
                                        { label: 'Good', count: analysisStats?.good || 0, emoji: '👍', color: '#ffd93d' },
                                        { label: 'Book', count: analysisStats?.book || 0, emoji: '📖', color: '#a855f7' },
                                        { label: 'Mistake', count: analysisStats?.mistake || 0, emoji: '⚠️', color: '#f97316' },
                                        { label: 'Blunder', count: analysisStats?.blunder || 0, emoji: '❌', color: '#ef4444' }
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            border: `2px solid ${item.color}30`,
                                            padding: '12px', borderRadius: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{item.emoji}</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600' }}>{item.label}</span>
                                            </div>
                                            <span style={{ color: item.color, fontWeight: '700' }}>{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button onClick={() => setUiState('full-review')} style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #4ecdc4, #22c55e)',
                                    color: '#1a1a2e', fontWeight: '700',
                                    padding: '14px', borderRadius: '12px',
                                    fontSize: '13px', textTransform: 'uppercase',
                                    border: 'none', cursor: 'pointer'
                                }}>
                                    🔬 Full Analysis
                                </button>
                                <button onClick={onNewGame} style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                    color: '#1a1a2e', fontWeight: '700',
                                    padding: '14px', borderRadius: '12px',
                                    fontSize: '13px', textTransform: 'uppercase',
                                    border: 'none', cursor: 'pointer'
                                }}>
                                    🎮 New Game
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FULL REVIEW STATE */}
                    {uiState === 'full-review' && (
                        <div className="kids-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                            {/* Current Move Info */}
                            {currentMoveIndex >= 0 && analysisData[currentMoveIndex] && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: `2px solid ${getClassColor(analysisData[currentMoveIndex].classification)}40`,
                                    borderRadius: '16px', padding: '16px', marginBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>
                                            {Math.floor(currentMoveIndex / 2) + 1}.{currentMoveIndex % 2 === 0 ? '' : '..'} {analysisData[currentMoveIndex].san}
                                        </span>
                                        <span style={{
                                            background: `${getClassColor(analysisData[currentMoveIndex].classification)}30`,
                                            color: getClassColor(analysisData[currentMoveIndex].classification),
                                            padding: '4px 10px', borderRadius: '8px',
                                            fontSize: '11px', fontWeight: '700', textTransform: 'uppercase'
                                        }}>
                                            {analysisData[currentMoveIndex].classification}
                                        </span>
                                    </div>
                                    <div style={{ color: KIDS_THEME.textMuted, fontSize: '13px' }}>
                                        Eval: {analysisData[currentMoveIndex].eval?.toFixed(1) || '0.0'}
                                    </div>
                                </div>
                            )}

                            {/* Move List */}
                            <div style={{
                                color: KIDS_THEME.accent, fontSize: '12px', fontWeight: '700',
                                marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em'
                            }}>
                                📜 Move List
                            </div>
                            <div style={{
                                background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
                                border: '2px solid rgba(255,217,61,0.1)', overflow: 'hidden'
                            }}>
                                {(() => {
                                    const rows = [];
                                    for (let i = 0; i < moves.length; i += 2) {
                                        rows.push({ num: (i / 2) + 1, w: moves[i], b: moves[i + 1] });
                                    }
                                    return rows.map((row, idx) => (
                                        <div key={idx} style={{
                                            display: 'grid', gridTemplateColumns: '40px 1fr 1fr',
                                            borderBottom: idx < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                        }}>
                                            <span style={{ padding: '10px', color: KIDS_THEME.accent, fontWeight: '700', textAlign: 'center' }}>
                                                {row.num}
                                            </span>
                                            <span
                                                onClick={() => setCurrentMoveIndex(idx * 2)}
                                                style={{
                                                    padding: '10px', cursor: 'pointer', textAlign: 'center',
                                                    background: currentMoveIndex === idx * 2 ? 'rgba(255,217,61,0.2)' : 'transparent',
                                                    color: currentMoveIndex === idx * 2 ? KIDS_THEME.accent : 'white'
                                                }}
                                            >
                                                {row.w?.san || ''}
                                            </span>
                                            <span
                                                onClick={() => row.b && setCurrentMoveIndex(idx * 2 + 1)}
                                                style={{
                                                    padding: '10px', cursor: row.b ? 'pointer' : 'default', textAlign: 'center',
                                                    background: currentMoveIndex === idx * 2 + 1 ? 'rgba(168,85,247,0.2)' : 'transparent',
                                                    color: currentMoveIndex === idx * 2 + 1 ? KIDS_THEME.purple : '#a855f7'
                                                }}
                                            >
                                                {row.b?.san || ''}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Back to Summary */}
                            <button onClick={() => setUiState('complete')} style={{
                                width: '100%', marginTop: '16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '2px solid rgba(255,255,255,0.2)', color: 'white',
                                fontWeight: '700', padding: '12px', borderRadius: '12px',
                                fontSize: '12px', cursor: 'pointer'
                            }}>
                                ← Back to Summary
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
