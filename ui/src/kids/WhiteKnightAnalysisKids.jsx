import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Award, Zap, BookOpen, ChevronRight, ChevronLeft,
    AlertTriangle, AlertOctagon, CheckCircle2, XCircle, RotateCcw, Flag,
    ChevronFirst, ChevronLast, Target, BarChart2, Trophy, X, Activity
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

// --- MAIN COMPONENT ---
export default function WhiteKnightAnalysisKids({ onNewGame, isMobile, gameData, settings }) {
    // UI States: game-over, analyzing, complete, auth-modal, check-inbox, full-analyzing, full-review
    const [uiState, setUiState] = useState('game-over');
    const [progress, setProgress] = useState(0);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisStats, setAnalysisStats] = useState(null);
    const [estimatedRating, setEstimatedRating] = useState(null);
    const [ratingChange, setRatingChange] = useState(0);
    const [showFinalPosition, setShowFinalPosition] = useState(true);
    const [currentFen, setCurrentFen] = useState('start');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Exploration mode states
    const [isExploring, setIsExploring] = useState(false);
    const [explorationFen, setExplorationFen] = useState(null);
    const [explorationAnalysis, setExplorationAnalysis] = useState(null);

    // Game data
    const moves = useMemo(() => gameData?.moves || [], [gameData?.moves]);
    const result = gameData?.result || {};
    const playerColor = gameData?.playerColor || settings?.color || 'w';
    const botName = settings?.bot?.name || 'Bot';
    const botRating = settings?.bot?.rating || 1200;
    const totalMoves = moves.length;
    const moveCount = Math.ceil(totalMoves / 2);

    // Result detection - SAME LOGIC AS ADULT VERSION
    const getResultText = useCallback(() => {
        if (!result) return { title: 'Game Over', subtitle: `${moveCount} Moves`, emoji: '🎮', color: KIDS_THEME.textMuted };

        // ChessEngine sends result: 'win', 'loss', or 'draw'
        const gameResult = result.result || result;
        const reason = result.reason || 'checkmate';
        const reasonText = reason.charAt(0).toUpperCase() + reason.slice(1);

        if (gameResult === 'win') return { title: 'Victory', subtitle: `${reasonText} • ${moveCount} Moves`, emoji: '🏆', color: KIDS_THEME.accent };
        if (gameResult === 'draw') return { title: 'Draw', subtitle: `${reasonText} • ${moveCount} Moves`, emoji: '🤝', color: KIDS_THEME.secondary };
        return { title: 'Defeat', subtitle: `${reasonText} • ${moveCount} Moves`, emoji: '😔', color: KIDS_THEME.red };
    }, [result, moveCount]);

    const resultInfo = useMemo(() => getResultText(), [getResultText]);

    // Initialize position when gameData changes
    useEffect(() => {
        if (moves.length > 0) {
            const lastIndex = moves.length - 1;
            setCurrentMoveIndex(lastIndex);
            setCurrentFen(moves[lastIndex]?.fen || gameData?.fen || 'start');
        } else if (gameData?.fen) {
            setCurrentFen(gameData.fen);
        }
    }, [moves, gameData]);

    // Auto-dismiss Final Position overlay
    useEffect(() => {
        if (showFinalPosition) {
            const timer = setTimeout(() => setShowFinalPosition(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [showFinalPosition]);

    // Navigation functions
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const goToStart = () => {
        setCurrentMoveIndex(-1);
        setCurrentFen(startFen);
    };

    const goToPrev = () => {
        if (currentMoveIndex > -1) {
            const newIndex = currentMoveIndex - 1;
            setCurrentMoveIndex(newIndex);
            if (newIndex === -1) {
                setCurrentFen(startFen);
            } else if (moves[newIndex]?.fen) {
                setCurrentFen(moves[newIndex].fen);
            }
        }
    };

    const goToNext = () => {
        if (currentMoveIndex < totalMoves - 1) {
            const newIndex = currentMoveIndex + 1;
            setCurrentMoveIndex(newIndex);
            if (moves[newIndex]?.fen) {
                setCurrentFen(moves[newIndex].fen);
            }
        }
    };

    const goToEnd = () => {
        if (totalMoves > 0) {
            const lastIndex = totalMoves - 1;
            setCurrentMoveIndex(lastIndex);
            if (moves[lastIndex]?.fen) {
                setCurrentFen(moves[lastIndex].fen);
            }
        } else if (gameData?.fen) {
            setCurrentFen(gameData.fen);
        }
    };

    const goToMove = (index) => {
        if (index < 0) {
            goToStart();
        } else if (index >= totalMoves) {
            goToEnd();
        } else {
            setCurrentMoveIndex(index);
            if (moves[index]?.fen) {
                setCurrentFen(moves[index].fen);
            }
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); goToNext(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); goToEnd(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); goToStart(); }
            else if (e.key === 'Escape' && isExploring) { exitExploration(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentMoveIndex, totalMoves, moves, isExploring]);

    // Interactive Analysis - Handle user exploration moves
    const handleExplorationMove = async (from, to) => {
        if (!from || !to) return false;

        try {
            const { Chess } = await import('chess.js');
            const startPosition = isExploring ? explorationFen : currentFen;
            const chess = new Chess(startPosition);

            const result = chess.move({
                from: from,
                to: to,
                promotion: 'q' // Auto-promote to queen
            });

            if (!result) {
                console.log('[KidsAnalysis] Invalid exploration move');
                return false;
            }

            const newFen = chess.fen();
            setIsExploring(true);
            setExplorationFen(newFen);

            // Run Stockfish analysis on the new position
            const analyzer = await getStockfishAnalyzer();
            const analysis = await analyzer.analyzePosition(newFen, 18); // depth 18

            // Convert UCI bestMove to SAN notation
            let bestMoveSan = analysis.bestMove;
            let pvSan = [];
            if (analysis.bestMove && analysis.bestMove.length >= 4) {
                try {
                    const tempChess = new Chess(newFen);
                    const moveResult = tempChess.move({
                        from: analysis.bestMove.slice(0, 2),
                        to: analysis.bestMove.slice(2, 4),
                        promotion: analysis.bestMove.length > 4 ? analysis.bestMove[4] : undefined
                    });
                    if (moveResult) {
                        bestMoveSan = moveResult.san;
                    }

                    // Convert PV to SAN (up to 6 moves for display)
                    if (analysis.pv && analysis.pv.length > 0) {
                        const pvChess = new Chess(newFen);
                        for (const uciMove of analysis.pv.slice(0, 6)) {
                            try {
                                const pvResult = pvChess.move({
                                    from: uciMove.slice(0, 2),
                                    to: uciMove.slice(2, 4),
                                    promotion: uciMove.length > 4 ? uciMove[4] : undefined
                                });
                                if (pvResult) pvSan.push(pvResult.san);
                            } catch (e) { break; }
                        }
                    }
                } catch (e) {
                    console.error('[KidsAnalysis] Error converting UCI to SAN:', e);
                }
            }

            setExplorationAnalysis({
                san: result.san,
                fen: newFen,
                eval: analysis.eval,
                bestMove: analysis.bestMove,
                bestMoveSan: bestMoveSan,
                pv: analysis.pv,
                pvSan: pvSan,
                classification: analysis.eval > 0.5 ? 'good' : analysis.eval < -0.5 ? 'mistake' : 'book'
            });

            console.log(`[KidsAnalysis] Exploration: ${result.san}, eval: ${analysis.eval?.toFixed(2)}, best: ${analysis.bestMove}`);
            return true;
        } catch (err) {
            console.error('[KidsAnalysis] Exploration move error:', err);
            return false;
        }
    };

    // Exit exploration mode
    const exitExploration = () => {
        setIsExploring(false);
        setExplorationFen(null);
        setExplorationAnalysis(null);
    };

    // Start Review Analysis - SAME LOGIC AS ADULT VERSION
    const startReviewAnalysis = useCallback(async () => {
        setUiState('analyzing');
        setProgress(0);

        if (!moves || moves.length === 0) {
            setAnalysisStats({ brilliant: 0, best: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0, accuracy: 0 });
            setEstimatedRating(1200);
            setTimeout(() => setUiState('complete'), 300);
            return;
        }

        try {
            const analyzer = await getStockfishAnalyzer();

            // Run analysis with progress callback
            const analysis = await analyzer.analyzeGame(
                moves,
                15, // depth 15
                (percent) => setProgress(percent),
                2 // multiPV
            );

            // Generate statistics
            const stats = analyzer.generateSummary(analysis, playerColor);
            const rating = analyzer.estimateRating(stats);

            setAnalysisData(analysis);
            setAnalysisStats(stats);
            setEstimatedRating(rating);

            // Update session stats with FIDE Elo rating - SAME AS ADULT
            try {
                const sessionStats = JSON.parse(localStorage.getItem('wk_session_stats') || '{"games": 0, "wins": 0, "losses": 0, "draws": 0, "rating": 0, "lastRatingChange": 0}');

                const myRating = sessionStats.rating === 0 ? 1200 : sessionStats.rating;
                const pendingBotRating = sessionStats.pendingBotRating || botRating;
                const outcome = sessionStats.pendingOutcome || 'draw';
                const totalGames = sessionStats.games;

                // FIDE K-Factor
                let K;
                if (totalGames < 30) K = 40;
                else if (myRating < 2400) K = 20;
                else K = 10;

                const actualScore = outcome === 'win' ? 1 : (outcome === 'draw' ? 0.5 : 0);
                const expectedScore = 1 / (1 + Math.pow(10, (pendingBotRating - myRating) / 400));
                const finalRatingChange = Math.round(K * (actualScore - expectedScore));

                let newRating = myRating + finalRatingChange;
                if (sessionStats.rating === 0) newRating = 1200 + finalRatingChange;

                sessionStats.rating = Math.max(0, Math.min(3000, newRating));
                sessionStats.lastRatingChange = finalRatingChange;
                sessionStats.lastPerformanceRating = rating;

                setRatingChange(finalRatingChange);

                delete sessionStats.pendingOutcome;
                delete sessionStats.pendingBotRating;

                localStorage.setItem('wk_session_stats', JSON.stringify(sessionStats));
                console.log(`[KidsAnalysis] FIDE Elo: ${myRating} vs Bot ${pendingBotRating}, Change: ${finalRatingChange >= 0 ? '+' : ''}${finalRatingChange}`);
            } catch (e) {
                console.error('[KidsAnalysis] Error updating session rating:', e);
            }

            setTimeout(() => setUiState('complete'), 300);
        } catch (err) {
            console.error('[KidsAnalysis] Analysis error:', err);
            setAnalysisStats({ brilliant: 0, best: 2, good: 5, book: 0, inaccuracy: 1, mistake: 0, blunder: 0, accuracy: 85 });
            setEstimatedRating(1400);
            setTimeout(() => setUiState('complete'), 300);
        }
    }, [moves, playerColor, botRating]);

    // Get classification color
    const getClassColor = (c) => {
        const colors = { brilliant: '#22d3ee', best: '#22c55e', good: '#ffd93d', book: '#a855f7', inaccuracy: '#fb923c', mistake: '#f97316', blunder: '#ef4444' };
        return colors[c] || '#94a3b8';
    };

    // Full Analysis flow - Same as Adult version
    const handleFullAnalysis = () => {
        if (isLoggedIn) {
            startFullAnalysisAnimation();
        } else {
            setUiState('auth-modal');
        }
    };

    const handleCreateAccount = () => {
        setUiState('check-inbox');
        setTimeout(() => {
            setIsLoggedIn(true);
            startFullAnalysisAnimation();
        }, 2000);
    };

    const startFullAnalysisAnimation = () => {
        setUiState('full-analyzing');
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setUiState('full-review'), 300);
                    return 100;
                }
                return prev + 1;
            });
        }, 25);
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
                @keyframes overlayFade { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
                .kids-scrollbar::-webkit-scrollbar { width: 6px; }
                .kids-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .kids-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,217,61,0.3); border-radius: 3px; }
            `}</style>

            {/* HEADER - SAME LAYOUT AS ADULT */}
            <header style={{
                height: '56px',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                borderBottom: '2px solid rgba(255,217,61,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', flexShrink: 0, zIndex: 50
            }}>
                {/* Left: Title + Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Back to Review - only in full-review */}
                    {uiState === 'full-review' && (
                        <button onClick={() => setUiState('complete')} style={{
                            background: 'rgba(78,205,196,0.1)', border: '2px solid rgba(78,205,196,0.3)',
                            color: KIDS_THEME.secondary, fontSize: '11px', fontWeight: '700',
                            padding: '8px 14px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            <ChevronLeft size={14} /> {isMobile ? '' : 'Back to Review'}
                        </button>
                    )}

                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            background: uiState === 'game-over' ? 'rgba(239,68,68,0.15)' : uiState === 'full-review' ? 'rgba(168,85,247,0.15)' : 'rgba(255,217,61,0.15)',
                            padding: '8px', borderRadius: '10px',
                            border: `2px solid ${uiState === 'game-over' ? 'rgba(239,68,68,0.3)' : uiState === 'full-review' ? 'rgba(168,85,247,0.3)' : 'rgba(255,217,61,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {uiState === 'game-over' ? <Flag size={18} style={{ color: KIDS_THEME.red }} /> : uiState === 'full-review' ? <BarChart2 size={18} style={{ color: KIDS_THEME.purple }} /> : <Activity size={18} style={{ color: KIDS_THEME.accent }} />}
                        </div>
                        <span style={{
                            fontSize: '12px', fontWeight: '800', color: 'white',
                            textTransform: 'uppercase', letterSpacing: '0.15em',
                            display: isMobile ? 'none' : 'block'
                        }}>
                            {uiState === 'game-over' ? 'Game Over' : uiState === 'full-review' ? 'Full Analysis' : uiState === 'complete' ? 'Game Review' : 'Analysis'}
                        </span>
                    </div>

                    {/* Separator */}
                    <div style={{ height: '20px', width: '2px', background: 'rgba(255,217,61,0.3)' }} />

                    {/* Re-analyze - only in full-review */}
                    {uiState === 'full-review' && (
                        <button onClick={startReviewAnalysis} style={{
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.2))',
                            border: '2px solid rgba(168,85,247,0.4)',
                            color: KIDS_THEME.purple, fontSize: '11px', fontWeight: '700',
                            padding: '8px 14px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            <Zap size={14} /> {isMobile ? '' : 'Re-analyze'}
                        </button>
                    )}

                    {/* NEW GAME Button */}
                    <button onClick={onNewGame} style={{
                        background: 'rgba(255,217,61,0.1)', border: '2px solid rgba(255,217,61,0.3)',
                        color: KIDS_THEME.accent, fontSize: '11px', fontWeight: '700',
                        padding: '8px 14px', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        <RotateCcw size={14} /> {isMobile ? '' : 'New Game'}
                    </button>

                    {/* REAL HUMAN COACH Button - hide in full-review on mobile */}
                    {!(uiState === 'full-review' && isMobile) && (
                        <button onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')} style={{
                            background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(168,85,247,0.2))',
                            border: '2px solid rgba(255,107,157,0.4)',
                            color: KIDS_THEME.pink, fontSize: '11px', fontWeight: '700',
                            padding: '8px 14px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            <BookOpen size={14} /> {isMobile ? 'Coach' : 'Real Human Coach'}
                        </button>
                    )}
                </div>

                {/* Right: Close Button */}
                <button onClick={onNewGame} style={{
                    minWidth: '40px', maxWidth: '40px', width: '40px',
                    minHeight: '40px', maxHeight: '40px', height: '40px',
                    borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: KIDS_THEME.red, padding: 0
                }}>
                    <X size={18} strokeWidth={2.5} />
                </button>
            </header>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT: BOARD PANEL */}
                {!isMobile && (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center', padding: '24px'
                    }}>
                        <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                        <div style={{ color: KIDS_THEME.purple, fontSize: '11px' }}>Rating: ~{botRating}</div>
                                    </div>
                                </div>
                            </div>

                            {/* BOARD */}
                            <div style={{
                                width: '100%', aspectRatio: '1/1',
                                position: 'relative', borderRadius: '12px', overflow: 'hidden',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                border: isExploring ? '3px solid rgba(168,85,247,0.6)' : '3px solid rgba(255,217,61,0.2)'
                            }}>
                                <ChessBoard
                                    position={isExploring ? explorationFen : currentFen}
                                    orientation={playerColor === 'b' ? 'black' : 'white'}
                                    disabled={uiState !== 'full-review'}
                                    onMove={uiState === 'full-review' ? handleExplorationMove : undefined}
                                    allowAllColors={true}
                                    showMoveHints={uiState === 'full-review'}
                                    darkSquareStyle={{ backgroundColor: '#739552' }}
                                    lightSquareStyle={{ backgroundColor: '#ebecd0' }}
                                />

                                {/* Exploration Mode Indicator */}
                                {isExploring && (
                                    <div style={{
                                        position: 'absolute', top: '8px', left: '8px',
                                        background: 'rgba(168,85,247,0.9)', padding: '6px 12px',
                                        borderRadius: '8px', fontSize: '10px', fontWeight: '700',
                                        color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)'
                                    }} onClick={exitExploration}>
                                        🔮 Exploration • Click to Exit
                                    </div>
                                )}

                                {/* Final Position Overlay - SAME AS ADULT */}
                                {showFinalPosition && uiState === 'game-over' && (
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(26,26,46,0.9) 100%)',
                                        animation: 'overlayFade 2.5s ease forwards'
                                    }}>
                                        <div style={{ fontSize: '56px', marginBottom: '8px' }}>{resultInfo.emoji}</div>
                                        <div style={{ fontSize: '36px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                                            {resultInfo.title}
                                        </div>
                                        <div style={{ fontSize: '13px', color: resultInfo.color, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700' }}>
                                            Final Position
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
                                        <div style={{ color: KIDS_THEME.green, fontSize: '11px' }}>Rating: {estimatedRating ? `~${estimatedRating}` : 'Calculating...'}</div>
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
                            <h1 style={{ fontSize: '36px', fontWeight: '800', color: resultInfo.color, marginBottom: '8px' }}>
                                {resultInfo.title}
                            </h1>
                            <p style={{
                                color: KIDS_THEME.textMuted, fontSize: '14px',
                                marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '0.15em'
                            }}>
                                {resultInfo.subtitle}
                            </p>

                            <button onClick={startReviewAnalysis} style={{
                                width: '100%', maxWidth: '280px',
                                background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                color: '#1a1a2e', fontWeight: '700',
                                padding: '18px', borderRadius: '16px',
                                fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                border: 'none', cursor: 'pointer', marginBottom: '12px',
                                boxShadow: '0 8px 30px rgba(255,217,61,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}>
                                🔍 Start Review
                            </button>
                            <button onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')} style={{
                                width: '100%', maxWidth: '280px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '2px solid rgba(255,255,255,0.2)', color: 'white',
                                fontWeight: '700', padding: '16px', borderRadius: '16px',
                                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}>
                                📚 View Courses
                            </button>
                        </div>
                    )}

                    {/* ANALYZING STATE */}
                    {uiState === 'analyzing' && (
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', padding: '40px 24px'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                border: '4px solid rgba(255,217,61,0.2)',
                                borderTopColor: KIDS_THEME.accent,
                                animation: 'spin 1s linear infinite', marginBottom: '24px'
                            }} />
                            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: 'white' }}>
                                🧙‍♂️ Analyzing Your Game...
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
                                Stockfish is thinking
                            </p>
                            <div style={{ width: '100%', maxWidth: '280px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: KIDS_THEME.accent, marginBottom: '8px' }}>
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,217,61,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', background: 'linear-gradient(90deg, #ffd93d, #ff9f43)',
                                        width: `${progress}%`, transition: 'width 0.2s', borderRadius: '8px'
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
                                    <div style={{ color: resultInfo.color, fontWeight: '700', fontSize: '24px' }}>{resultInfo.title}</div>
                                    <div style={{ color: KIDS_THEME.textMuted, fontSize: '12px' }}>{resultInfo.subtitle}</div>
                                </div>
                            )}

                            {/* Rating + Accuracy Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,217,61,0.2)',
                                    padding: '16px', borderRadius: '16px', textAlign: 'center'
                                }}>
                                    <div style={{ color: KIDS_THEME.textMuted, fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase' }}>Est. Rating</div>
                                    <div style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{estimatedRating || 1200}</div>
                                    {ratingChange !== 0 && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px',
                                            background: ratingChange >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                                            padding: '3px 8px', borderRadius: '8px',
                                            border: ratingChange >= 0 ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(239,68,68,0.3)'
                                        }}>
                                            <Zap size={10} style={{ color: ratingChange >= 0 ? KIDS_THEME.green : KIDS_THEME.red }} />
                                            <span style={{ color: ratingChange >= 0 ? KIDS_THEME.green : KIDS_THEME.red, fontSize: '11px', fontWeight: '700' }}>
                                                {ratingChange >= 0 ? '+' : ''}{ratingChange} pts
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(34,197,94,0.2)',
                                    padding: '16px', borderRadius: '16px', textAlign: 'center'
                                }}>
                                    <div style={{ color: KIDS_THEME.textMuted, fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase' }}>Accuracy</div>
                                    <div style={{ fontSize: '28px', fontWeight: '800', color: KIDS_THEME.green }}>{analysisStats?.accuracy || 0}%</div>
                                </div>
                            </div>

                            {/* Move Quality */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ color: KIDS_THEME.accent, fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                                            background: 'rgba(0,0,0,0.3)', border: `2px solid ${item.color}30`,
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

                            {/* Coach Insight */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    color: KIDS_THEME.accent, fontSize: '12px', fontWeight: '700',
                                    marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em'
                                }}>
                                    <span style={{ fontSize: '16px' }}>🧙‍♂️</span>
                                    Coach Insight
                                    <span style={{
                                        fontSize: '9px', color: KIDS_THEME.textMuted,
                                        fontWeight: '500', textTransform: 'none', letterSpacing: '0'
                                    }}>Game Analysis</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255,217,61,0.05)',
                                    border: '2px solid rgba(255,217,61,0.2)',
                                    borderRadius: '12px', padding: '14px',
                                    color: '#e2e8f0', fontSize: '13px', lineHeight: '1.6'
                                }}>
                                    {analysisStats?.blunder > 0
                                        ? `⚠️ You made ${analysisStats.blunder} blunder${analysisStats.blunder > 1 ? 's' : ''} in this game. Blunders typically happen when we rush our moves. Take more time on critical positions, especially when pieces are under attack or when your opponent has active threats.`
                                        : analysisStats?.mistake > 0
                                            ? `👍 Good game! You avoided blunders but had ${analysisStats.mistake} mistake${analysisStats.mistake > 1 ? 's' : ''}. Focus on calculating one move deeper and you'll improve quickly!`
                                            : `✨ Excellent play! You made very accurate moves. Keep up the great work and challenge stronger opponents!`
                                    }
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button onClick={handleFullAnalysis} style={{
                                    width: '100%', background: 'linear-gradient(135deg, #4ecdc4, #22c55e)',
                                    color: '#1a1a2e', fontWeight: '700', padding: '14px', borderRadius: '12px',
                                    fontSize: '13px', textTransform: 'uppercase', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}>
                                    🔬 Full Analysis
                                </button>
                                <button onClick={onNewGame} style={{
                                    width: '100%', background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                    color: '#1a1a2e', fontWeight: '700', padding: '14px', borderRadius: '12px',
                                    fontSize: '13px', textTransform: 'uppercase', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}>
                                    🎮 New Game
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FULL REVIEW STATE */}
                    {uiState === 'full-review' && (
                        <div className="kids-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                            {/* Current Move Evaluation Panel */}
                            {currentMoveIndex >= 0 && analysisData?.[currentMoveIndex] && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: `2px solid ${getClassColor(analysisData[currentMoveIndex].classification)}40`,
                                    borderRadius: '16px', padding: '16px', marginBottom: '16px'
                                }}>
                                    {/* Move Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>
                                                {Math.floor(currentMoveIndex / 2) + 1}.{currentMoveIndex % 2 === 0 ? '' : '..'} {analysisData[currentMoveIndex].san}
                                            </span>
                                            <span style={{
                                                background: `${getClassColor(analysisData[currentMoveIndex].classification)}30`,
                                                color: getClassColor(analysisData[currentMoveIndex].classification),
                                                padding: '4px 10px', borderRadius: '8px',
                                                fontSize: '10px', fontWeight: '700', textTransform: 'uppercase'
                                            }}>
                                                {analysisData[currentMoveIndex].classification}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Move Description */}
                                    <div style={{
                                        color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px',
                                        background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px'
                                    }}>
                                        {analysisData[currentMoveIndex].classification === 'brilliant'
                                            ? '✨ Brilliant! You found an exceptional move that changes the evaluation significantly.'
                                            : analysisData[currentMoveIndex].classification === 'best'
                                                ? '✅ You found the best move! This maintains or improves your position.'
                                                : analysisData[currentMoveIndex].classification === 'good'
                                                    ? '👍 A good move. There might be a slightly better option available.'
                                                    : analysisData[currentMoveIndex].classification === 'book'
                                                        ? '📖 This is a known opening move from theory.'
                                                        : analysisData[currentMoveIndex].classification === 'inaccuracy'
                                                            ? '⚡ Inaccuracy. A small mistake that slightly worsens your position.'
                                                            : analysisData[currentMoveIndex].classification === 'mistake'
                                                                ? '⚠️ Mistake. This move significantly worsens your position.'
                                                                : analysisData[currentMoveIndex].classification === 'blunder'
                                                                    ? '❌ Blunder! This move loses material or a significant advantage.'
                                                                    : 'Analyzing this position...'
                                        }
                                    </div>

                                    {/* Ask Coach Why Button */}
                                    <button
                                        onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')}
                                        style={{
                                            width: '100%', padding: '10px',
                                            background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(34,197,94,0.2))',
                                            border: '2px solid rgba(78,205,196,0.4)',
                                            borderRadius: '10px', color: KIDS_THEME.secondary,
                                            fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}
                                    >
                                        🎓 Ask Coach Why
                                    </button>
                                </div>
                            )}

                            {/* Engine Analysis */}
                            {(isExploring ? explorationAnalysis : (currentMoveIndex >= 0 && analysisData?.[currentMoveIndex])) && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{
                                        color: isExploring ? KIDS_THEME.purple : KIDS_THEME.purple, fontSize: '11px', fontWeight: '700',
                                        marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <Target size={14} /> {isExploring ? '🔮 Exploration Analysis' : 'Engine Analysis'}
                                        <span style={{ color: KIDS_THEME.textMuted, fontSize: '9px', fontWeight: '500' }}>
                                            {isExploring ? 'Depth: 18 • Best response' : 'Depth: 15 • Best lines'}
                                        </span>
                                    </div>
                                    <div style={{
                                        background: isExploring ? 'rgba(168,85,247,0.1)' : 'rgba(0,0,0,0.3)',
                                        border: isExploring ? '2px solid rgba(168,85,247,0.4)' : '2px solid rgba(168,85,247,0.2)',
                                        borderRadius: '12px', overflow: 'hidden'
                                    }}>
                                        {/* Current eval + best line */}
                                        {(() => {
                                            const data = isExploring ? explorationAnalysis : analysisData?.[currentMoveIndex];
                                            if (!data) return null;
                                            const evalValue = data.eval || 0;
                                            return (
                                                <>
                                                    {/* Line 1: Position evaluation + Best move */}
                                                    <div style={{
                                                        padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                                                        display: 'flex', alignItems: 'center', gap: '10px'
                                                    }}>
                                                        <span style={{
                                                            background: evalValue > 0 ? 'rgba(34,197,94,0.25)' : evalValue < 0 ? 'rgba(239,68,68,0.25)' : 'rgba(148,163,184,0.2)',
                                                            color: evalValue > 0 ? KIDS_THEME.green : evalValue < 0 ? KIDS_THEME.red : KIDS_THEME.textMuted,
                                                            padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                                                            minWidth: '55px', textAlign: 'center'
                                                        }}>
                                                            {evalValue > 0 ? '+' : ''}{evalValue.toFixed(2)}
                                                        </span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>
                                                                Best: {isExploring && data.bestMoveSan ? data.bestMoveSan : data.bestMove || data.san}
                                                            </div>
                                                            {(isExploring && data.pvSan?.length > 0) && (
                                                                <div style={{ color: KIDS_THEME.textMuted, fontSize: '11px', fontFamily: 'monospace' }}>
                                                                    {data.pvSan.slice(0, 5).join(' → ')}
                                                                </div>
                                                            )}
                                                            {(!isExploring && data.pv?.length > 0) && (
                                                                <div style={{ color: KIDS_THEME.textMuted, fontSize: '11px', fontFamily: 'monospace' }}>
                                                                    {data.pv.slice(0, 4).join(' ')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Line 2: Alternative (show if not exploring) */}
                                                    {!isExploring && (
                                                        <div style={{
                                                            padding: '10px 12px',
                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                            background: 'rgba(255,255,255,0.02)'
                                                        }}>
                                                            <span style={{
                                                                background: 'rgba(148,163,184,0.15)',
                                                                color: KIDS_THEME.textMuted,
                                                                padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600',
                                                                minWidth: '55px', textAlign: 'center'
                                                            }}>
                                                                Alt
                                                            </span>
                                                            <span style={{ color: KIDS_THEME.textMuted, fontSize: '11px' }}>
                                                                {data.secondBest ? `${data.secondBest.move} (${data.secondBest.eval > 0 ? '+' : ''}${data.secondBest.eval?.toFixed(2)})` : 'Calculating...'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Exploration hint */}
                                                    {isExploring && (
                                                        <div style={{
                                                            padding: '10px 12px', background: 'rgba(168,85,247,0.1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                            fontSize: '10px', color: KIDS_THEME.purple, fontWeight: '600'
                                                        }}>
                                                            💡 Move a piece to continue exploring
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Move History */}
                            <div style={{ color: KIDS_THEME.accent, fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                📜 Move History
                            </div>
                            <div style={{
                                background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
                                border: '2px solid rgba(255,217,61,0.1)', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto'
                            }}>
                                {(() => {
                                    const rows = [];
                                    for (let i = 0; i < moves.length; i += 2) {
                                        rows.push({ num: (i / 2) + 1, w: moves[i], b: moves[i + 1], wIdx: i, bIdx: i + 1 });
                                    }
                                    return rows.map((row, idx) => (
                                        <div key={idx} style={{
                                            display: 'grid', gridTemplateColumns: '35px 1fr 1fr',
                                            borderBottom: idx < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                        }}>
                                            <span style={{ padding: '8px', color: KIDS_THEME.textMuted, fontWeight: '600', textAlign: 'center', fontSize: '11px' }}>{row.num}</span>
                                            <span
                                                onClick={() => goToMove(row.wIdx)}
                                                style={{
                                                    padding: '8px', cursor: 'pointer', textAlign: 'center', fontSize: '12px',
                                                    background: currentMoveIndex === row.wIdx ? 'rgba(255,217,61,0.2)' : 'transparent',
                                                    color: currentMoveIndex === row.wIdx ? KIDS_THEME.accent : 'white',
                                                    borderLeft: analysisData?.[row.wIdx] ? `3px solid ${getClassColor(analysisData[row.wIdx].classification)}` : 'none'
                                                }}
                                            >
                                                {row.w?.san || ''}
                                            </span>
                                            <span
                                                onClick={() => row.b && goToMove(row.bIdx)}
                                                style={{
                                                    padding: '8px', cursor: row.b ? 'pointer' : 'default', textAlign: 'center', fontSize: '12px',
                                                    background: currentMoveIndex === row.bIdx ? 'rgba(168,85,247,0.2)' : 'transparent',
                                                    color: currentMoveIndex === row.bIdx ? KIDS_THEME.purple : KIDS_THEME.textMuted,
                                                    borderLeft: analysisData?.[row.bIdx] ? `3px solid ${getClassColor(analysisData[row.bIdx].classification)}` : 'none'
                                                }}
                                            >
                                                {row.b?.san || ''}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* AUTH MODAL */}
            {uiState === 'auth-modal' && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '16px'
                }}>
                    <div style={{
                        backgroundColor: '#1a1a2e', border: '3px solid rgba(255,217,61,0.3)',
                        padding: '32px', borderRadius: '20px', maxWidth: '400px', width: '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative', textAlign: 'center'
                    }}>
                        {/* Close Button */}
                        <button onClick={() => setUiState('complete')} style={{
                            position: 'absolute', top: '16px', right: '16px',
                            minWidth: '32px', maxWidth: '32px', width: '32px',
                            minHeight: '32px', maxHeight: '32px', height: '32px',
                            borderRadius: '50%', flexShrink: 0, padding: 0,
                            background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: KIDS_THEME.red
                        }}>
                            <X size={14} strokeWidth={2.5} />
                        </button>

                        <div style={{
                            width: '60px', height: '60px', margin: '0 auto 20px',
                            background: 'rgba(255,217,61,0.1)', borderRadius: '50%',
                            border: '2px solid rgba(255,217,61,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <span style={{ fontSize: '28px' }}>🔒</span>
                        </div>

                        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px', color: 'white' }}>
                            Unlock Full Analysis
                        </h2>
                        <p style={{ color: KIDS_THEME.textMuted, fontSize: '14px', marginBottom: '24px' }}>
                            Join White Knight Academy to see move-by-move evaluation
                        </p>

                        <input
                            type="email"
                            placeholder="Email address"
                            style={{
                                width: '100%', padding: '14px', marginBottom: '12px',
                                background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,217,61,0.2)',
                                borderRadius: '12px', color: 'white', fontSize: '14px',
                                outline: 'none'
                            }}
                        />

                        <button onClick={handleCreateAccount} style={{
                            width: '100%', padding: '14px',
                            background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                            border: 'none', borderRadius: '12px',
                            color: '#1a1a2e', fontWeight: '700', fontSize: '13px',
                            textTransform: 'uppercase', cursor: 'pointer', marginBottom: '16px'
                        }}>
                            Continue
                        </button>

                        <div style={{ color: KIDS_THEME.textMuted, fontSize: '12px', marginBottom: '12px' }}>or</div>

                        <button onClick={handleCreateAccount} style={{
                            width: '100%', padding: '14px',
                            background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px', color: 'white', fontWeight: '600', fontSize: '13px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </div>
            )}

            {/* CHECK INBOX MODAL */}
            {uiState === 'check-inbox' && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.95)', padding: '24px', textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px', height: '80px', margin: '0 auto 24px',
                        background: 'rgba(255,217,61,0.1)', borderRadius: '50%',
                        border: '2px solid rgba(255,217,61,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '40px' }}>📧</span>
                    </div>
                    <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px', color: 'white' }}>
                        Check Your Inbox
                    </h2>
                    <p style={{ color: KIDS_THEME.textMuted, fontSize: '14px', marginBottom: '24px' }}>
                        We sent a verification link
                    </p>
                    <button onClick={startFullAnalysisAnimation} style={{
                        padding: '12px 24px',
                        background: 'transparent', border: '2px solid rgba(255,217,61,0.3)',
                        borderRadius: '10px', color: KIDS_THEME.accent,
                        fontWeight: '700', fontSize: '12px', textTransform: 'uppercase',
                        cursor: 'pointer'
                    }}>
                        Skip for Demo
                    </button>
                </div>
            )}

            {/* FULL ANALYZING MODAL */}
            {uiState === 'full-analyzing' && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.95)', padding: '24px', textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        border: '4px solid rgba(255,217,61,0.2)',
                        borderTopColor: KIDS_THEME.accent,
                        animation: 'spin 1s linear infinite', marginBottom: '24px'
                    }} />
                    <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'white' }}>
                        Analyzing Your Game...
                    </h2>
                    <p style={{ color: KIDS_THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>
                        Stockfish
                    </p>
                    <div style={{ width: '280px' }}>
                        <div style={{
                            height: '8px', background: 'rgba(255,217,61,0.2)',
                            borderRadius: '8px', overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%', background: 'linear-gradient(90deg, #ffd93d, #ff9f43)',
                                width: `${progress}%`, transition: 'width 0.1s', borderRadius: '8px'
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
