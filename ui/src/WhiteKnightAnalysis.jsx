import React, { useState, useEffect, useMemo } from 'react';
import {
    Award, Zap, BookOpen, ChevronRight, ChevronLeft,
    AlertTriangle, AlertOctagon,
    CheckCircle2, XCircle, Lock, Mail,
    RotateCcw, Play, ChevronFirst, ChevronLast, ChevronDown, ChevronUp, Menu,
    Frown, Minus, Sparkles, Target, TrendingUp, BarChart2, Activity,
    X, Eye, EyeOff, Layers, User, Clock, Flag
} from 'lucide-react';
import ChessBoard from './components/ChessBoard.jsx';
import { getStockfishAnalyzer } from './engine/StockfishAnalyzer.js';

// --- SVG CHESS PIECES ---
const Piece = ({ type, color }) => {
    const isWhite = color === 'w';
    const fill = isWhite ? '#F8FAFC' : '#1E293B';
    const stroke = isWhite ? '#1E293B' : '#F8FAFC';
    if (!type) return null;
    const paths = {
        p: "M12 20V10M8 14h8M10 6a2 2 0 114 0 2 2 0 01-4 0z",
        r: "M6 20V8h12v12M4 8h16M8 4h8v4H8z",
        n: "M14.5 4.5l-2.5 7L7 16l-3-1 2-5 3-4h5.5z",
        b: "M12 20l-4-12 4-5 4 5-4 12zM12 3v2",
        q: "M6 20l2-8 4-3 4 3 2 8M12 2v4",
        k: "M12 20V8M8 8h8M12 4v4M9 6l6 0"
    };
    return (
        <svg viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.5" style={{ width: '85%', height: '85%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] || paths.p} />
        </svg>
    );
};

// --- MOCK DATA ---
const initialBoard = [
    ['r', null, 'b', 'q', 'k', null, null, 'r'],
    ['p', 'p', 'p', null, null, 'p', 'p', 'p'],
    [null, null, 'n', null, null, 'n', null, null],
    [null, null, null, 'p', 'p', null, null, null],
    [null, null, 'B', null, 'P', null, null, null],
    [null, null, null, null, null, 'N', null, null],
    ['P', 'P', 'P', 'P', null, 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', null, 'R', 'K', null],
];

const mockMoves = [
    { w: "e4", b: "e5" }, { w: "Nf3", b: "Nc6" }, { w: "Bc4", b: "d6" },
    { w: "c3", b: "Bg4" }, { w: "d3", b: "Qd7" }, { w: "h3", b: "Bh5??" },
    { w: "Nxe5!", b: "Bxd1??" }, { w: "Bxf7+", b: "Ke7" }, { w: "Bg5#", b: "" }
];

export default function WhiteKnightAnalysis({ onNewGame, isMobile, gameData, settings }) {
    // States: 'game-over' -> 'analyzing' -> 'complete' -> 'auth-modal' -> 'check-inbox' -> 'full-analyzing' -> 'full-review'
    const [uiState, setUiState] = useState('game-over');
    const [progress, setProgress] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showBestMove, setShowBestMove] = useState(false);
    const [panelExpanded, setPanelExpanded] = useState(true);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(() => {
        // Initialize to last move
        return (gameData?.moves?.length || 0) - 1;
    });
    const [currentFen, setCurrentFen] = useState(gameData?.fen || 'start');

    // Real analysis data from Stockfish
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisStats, setAnalysisStats] = useState(null);
    const [estimatedRating, setEstimatedRating] = useState(null);


    // Interactive Analysis / Exploration Mode State
    const [isExploring, setIsExploring] = useState(false);
    const [explorationFen, setExplorationFen] = useState(null);
    const [explorationAnalysis, setExplorationAnalysis] = useState(null);

    // Pro Mode and Exit Confirm State (for new design)
    const [isProMode, setIsProMode] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [showFinalPosition, setShowFinalPosition] = useState(true); // Start with Final Position overlay visible

    // Initialize position when gameData changes
    useEffect(() => {
        if (gameData?.moves?.length > 0) {
            const lastIndex = gameData.moves.length - 1;
            setCurrentMoveIndex(lastIndex);
            setCurrentFen(gameData.moves[lastIndex]?.fen || gameData.fen || 'start');
        }
    }, [gameData]);

    // Handle Final Position auto-dismiss timer
    useEffect(() => {
        if (showFinalPosition) {
            const timer = setTimeout(() => {
                setShowFinalPosition(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [showFinalPosition]);

    // Get real moves from game data or use mock
    const gameMoves = gameData?.moves || mockMoves;
    const moveCount = gameData?.moveCount || Math.ceil(gameMoves.length / 2);
    const result = gameData?.result || { winner: 'player', reason: 'checkmate' };
    const playerColor = gameData?.playerColor || 'w';
    const clocks = gameData?.clocks || { w: 600, b: 600 };

    // Bot Info
    const botInfo = settings?.bot || { name: 'Casual', rating: 1200 };
    const botName = botInfo.name;
    const botRating = botInfo.rating;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isTimeout = result.reason === 'timeout';
    const botTime = clocks[playerColor === 'w' ? 'b' : 'w'] || 0;
    const playerTime = clocks[playerColor] || 0;

    const getMoveColor = (classification) => {
        if (!classification) return '#E2E8F0';
        if (classification === 'brilliant') return '#22D3EE'; // Cyan
        if (classification === 'best') return '#4ADE80';  // Green
        if (classification === 'good') return '#D4AF37';  // Gold
        if (classification === 'book') return '#8B5CF6';  // Purple
        if (classification === 'inaccuracy') return '#FB923C'; // Orange
        if (classification === 'mistake') return '#F97316';  // Deep Orange
        if (classification === 'blunder') return '#EF4444'; // Red
        return '#E2E8F0';
    };

    // Get icon for classification - matches Game Review stats panel
    const getClassificationIcon = (classification) => {
        if (classification === 'brilliant') return <Sparkles size={10} style={{ color: '#22D3EE' }} />;
        if (classification === 'best') return <CheckCircle2 size={10} style={{ color: '#4ADE80' }} />;
        if (classification === 'good') return <Target size={10} style={{ color: '#D4AF37' }} />;
        if (classification === 'book') return <BookOpen size={10} style={{ color: '#8B5CF6' }} />;
        if (classification === 'inaccuracy') return <AlertTriangle size={10} style={{ color: '#FB923C' }} />;
        if (classification === 'mistake') return <AlertTriangle size={10} style={{ color: '#F97316' }} />;
        if (classification === 'blunder') return <AlertOctagon size={10} style={{ color: '#EF4444' }} />;
        return null;
    };

    // Format moves into pairs like mockMoves
    const formattedMoves = React.useMemo(() => {
        if (gameData?.moves) {
            const pairs = [];
            for (let i = 0; i < gameData.moves.length; i += 2) {
                pairs.push({
                    w: gameData.moves[i]?.san || '',
                    b: gameData.moves[i + 1]?.san || ''
                });
            }
            return pairs;
        }
        return mockMoves;
    }, [gameData]);

    // Get result text
    const getResultText = () => {
        if (!result) return { title: 'Game Over', subtitle: `${moveCount} Moves`, icon: Minus };

        // ChessEngine sends result: 'win', 'loss', or 'draw'
        const gameResult = result.result || result;
        const reason = result.reason || 'checkmate';
        const reasonText = reason.charAt(0).toUpperCase() + reason.slice(1);

        if (gameResult === 'win') return { title: 'Victory', subtitle: `${reasonText} • ${moveCount} Moves`, icon: Award };
        if (gameResult === 'draw') return { title: 'Draw', subtitle: `${reasonText} • ${moveCount} Moves`, icon: Minus };
        return { title: 'Defeat', subtitle: `${reasonText} • ${moveCount} Moves`, icon: Frown };
    };
    const resultInfo = getResultText();

    // Move navigation functions
    const totalMoves = gameData?.moves?.length || 0;
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
            } else if (gameData?.moves?.[newIndex]?.fen) {
                setCurrentFen(gameData.moves[newIndex].fen);
            }
        }
    };

    const goToNext = () => {
        if (currentMoveIndex < totalMoves - 1) {
            const newIndex = currentMoveIndex + 1;
            setCurrentMoveIndex(newIndex);
            if (gameData?.moves?.[newIndex]?.fen) {
                setCurrentFen(gameData.moves[newIndex].fen);
            }
        }
    };

    const goToEnd = () => {
        if (totalMoves > 0) {
            const lastIndex = totalMoves - 1;
            setCurrentMoveIndex(lastIndex);
            if (gameData?.moves?.[lastIndex]?.fen) {
                setCurrentFen(gameData.moves[lastIndex].fen);
            }
        } else if (gameData?.fen) {
            setCurrentFen(gameData.fen);
        }
    };

    // Go to specific move
    const goToMove = (index) => {
        if (index < 0) {
            goToStart();
        } else if (index >= totalMoves) {
            goToEnd();
        } else {
            setCurrentMoveIndex(index);
            if (gameData?.moves?.[index]?.fen) {
                setCurrentFen(gameData.moves[index].fen);
            }
        }
    };

    // Keyboard navigation for arrow keys
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPrev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    goToNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    goToEnd();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    goToStart();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentMoveIndex, totalMoves, gameData]);

    // Start Review - run real Stockfish analysis
    const startReviewAnalysis = async () => {
        setUiState('analyzing');
        setProgress(0);

        if (!gameData?.moves || gameData.moves.length === 0) {
            // No moves to analyze, show complete with placeholder stats
            setAnalysisStats({
                brilliant: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, accuracy: 0
            });
            setEstimatedRating(1200);
            setTimeout(() => setUiState('complete'), 300);
            return;
        }

        try {
            const analyzer = await getStockfishAnalyzer();

            // Run analysis with progress callback
            const analysis = await analyzer.analyzeGame(
                gameData.moves,
                15, // depth 15 for better quality
                (percent) => setProgress(percent),
                isProMode ? 3 : 2 // multiPV: 3 for Pro, 2 for Standard
            );

            // Generate statistics
            const stats = analyzer.generateSummary(analysis, playerColor);
            const rating = analyzer.estimateRating(stats);

            setAnalysisData(analysis);
            setAnalysisStats(stats);
            setEstimatedRating(rating);

            setTimeout(() => setUiState('complete'), 300);
        } catch (err) {
            console.error('Analysis error:', err);
            // Fallback to complete with placeholder
            setAnalysisStats({
                brilliant: 0, best: 2, good: 5, inaccuracy: 1, mistake: 0, blunder: 0, accuracy: 85
            });
            setEstimatedRating(1400);
            setTimeout(() => setUiState('complete'), 300);
        }
    };

    // Full Analysis flow
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

    const handleNewGame = () => {
        if (onNewGame) onNewGame();
    };

    // Interactive Analysis - Handle user exploration moves
    const handleExplorationMove = async (move) => {
        if (!move || !move.from || !move.to) return false;

        try {
            // Use chess.js to validate and apply the move
            const { Chess } = await import('chess.js');
            const startPosition = isExploring ? explorationFen : currentFen;
            const chess = new Chess(startPosition);

            const result = chess.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion || 'q'
            });

            if (!result) {
                console.log('[Analysis] Invalid exploration move');
                return false;
            }

            const newFen = chess.fen();
            setIsExploring(true);
            setExplorationFen(newFen);

            // Run Stockfish analysis on the new position at highest depth
            const analyzer = await getStockfishAnalyzer();
            const analysis = await analyzer.analyzePosition(newFen, 20);

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

                    // Convert PV (principal variation) to SAN
                    if (analysis.pv && analysis.pv.length > 0) {
                        const pvChess = new Chess(newFen);
                        for (const uciMove of analysis.pv.slice(0, 5)) {
                            try {
                                const pvResult = pvChess.move({
                                    from: uciMove.slice(0, 2),
                                    to: uciMove.slice(2, 4),
                                    promotion: uciMove.length > 4 ? uciMove[4] : undefined
                                });
                                if (pvResult) {
                                    pvSan.push(pvResult.san);
                                }
                            } catch (e) { break; }
                        }
                    }
                } catch (e) {
                    console.error('[Analysis] Error converting UCI to SAN:', e);
                }
            }

            setExplorationAnalysis({
                san: result.san,
                fen: newFen,
                eval: analysis.eval,
                bestMove: analysis.bestMove,
                bestMoveSan: bestMoveSan,
                pv: analysis.pv,
                pvSan: pvSan
            });

            console.log(`[Analysis] Exploration: ${result.san}, eval: ${analysis.eval?.toFixed(2)}, best: ${analysis.bestMove}`);
            return true;
        } catch (err) {
            console.error('[Analysis] Exploration move error:', err);
            return false;
        }
    };

    // Exit exploration mode and return to game analysis
    const exitExploration = () => {
        setIsExploring(false);
        setExplorationFen(null);
        setExplorationAnalysis(null);
    };

    // --- RESPONSIVE LAYOUT (Unified) ---
    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#0B0E14', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

                {/* TOP NAVIGATION BAR (Full Analysis Mode) */}
                {uiState === 'full-review' && (
                    <div style={{
                        height: '56px',
                        borderBottom: '1px solid #2A303C',
                        backgroundColor: '#0B0E14',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 20px',
                        flexShrink: 0,
                        zIndex: 50
                    }}>
                        {/* Left: Back, Title, New Game, Re-analyze */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                                onClick={() => setUiState('complete')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#94A3B8',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}
                            >
                                <ChevronLeft size={16} />
                                Back to Review
                            </button>

                            <div style={{ height: '16px', width: '1px', backgroundColor: '#2A303C' }}></div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    backgroundColor: 'rgba(212,175,55,0.1)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(212,175,55,0.2)',
                                    boxShadow: '0 0 10px rgba(212,175,55,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Target size={14} style={{ color: '#D4AF37' }} />
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>
                                    Full Analysis
                                </span>
                            </div>

                            <div style={{ height: '16px', width: '1px', backgroundColor: '#2A303C' }}></div>

                            {/* Action Buttons */}
                            <button onClick={handleNewGame} style={{
                                backgroundColor: '#1A1E26',
                                color: '#E2E8F0',
                                fontSize: '10px',
                                fontWeight: '600',
                                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #2A303C',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <RotateCcw size={12} /> New Game
                            </button>
                            <button
                                onClick={async () => {
                                    setIsReanalyzing(true);
                                    try {
                                        const analyzer = await getStockfishAnalyzer();
                                        const fen = isExploring ? explorationFen : currentFen;
                                        const analysis = await analyzer.analyzePosition(fen, 20);
                                        console.log('[Analysis] Re-analyzed position:', analysis);
                                    } catch (e) {
                                        console.error('[Analysis] Re-analyze error:', e);
                                    }
                                    setIsReanalyzing(false);
                                }}
                                style={{
                                    backgroundColor: '#1A1E26',
                                    color: '#E2E8F0',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #2A303C',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                <Layers size={12} style={{ animation: isReanalyzing ? 'spin 1s linear infinite' : 'none' }} /> Re-analyze
                            </button>
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1 }}></div>

                        {/* Right: Pro Mode Toggle */}
                        <div
                            onClick={() => setIsProMode(!isProMode)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                backgroundColor: '#1A1E26',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: '1px solid #2A303C'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '16px',
                                borderRadius: '8px',
                                backgroundColor: isProMode ? '#D4AF37' : '#2A303C',
                                position: 'relative',
                                transition: 'background-color 0.2s'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: isProMode ? '16px' : '2px',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }}></div>
                            </div>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: isProMode ? '#D4AF37' : '#64748B'
                            }}>
                                Pro Mode
                            </span>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            style={{
                                minWidth: '36px',
                                minHeight: '36px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: '#1A1E26',
                                border: '1px solid #2A303C',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                marginLeft: '12px',
                                color: '#E2E8F0',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                                padding: 0
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A303C'; e.currentTarget.style.color = '#E2E8F0'; }}
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                )
                }

                {/* TOP NAVIGATION BAR (Game Review / Complete Mode / Game Over) */}
                {(uiState === 'complete' || uiState === 'game-over') && (
                    <div style={{
                        height: '56px',
                        borderBottom: '1px solid #2A303C',
                        backgroundColor: '#0B0E14',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isMobile ? '0 12px' : '0 20px',
                        flexShrink: 0,
                        zIndex: 50
                    }}>
                        {/* Left: Title + Separator + Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    backgroundColor: uiState === 'game-over' ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: `1px solid ${uiState === 'game-over' ? 'rgba(239,68,68,0.2)' : 'rgba(212,175,55,0.2)'}`,
                                    boxShadow: `0 0 10px ${uiState === 'game-over' ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {uiState === 'game-over' ?
                                        <Flag size={18} style={{ color: '#EF4444' }} /> :
                                        <Activity size={18} style={{ color: '#D4AF37' }} />
                                    }
                                </div>
                                <span style={{
                                    fontSize: isMobile ? '11px' : '12px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    display: isMobile ? 'none' : 'block'
                                }}>
                                    {uiState === 'game-over' ? 'Game Over' : 'Game Review'}
                                </span>
                            </div>

                            {/* Separator */}
                            <div style={{ height: '16px', width: '1px', backgroundColor: '#2A303C' }}></div>

                            {/* Action Buttons */}
                            <button onClick={handleNewGame} style={{
                                backgroundColor: '#1A1E26',
                                color: '#E2E8F0',
                                fontSize: '10px',
                                fontWeight: '600',
                                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                                padding: isMobile ? '6px 8px' : '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #2A303C',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <RotateCcw size={12} /> {isMobile ? '' : 'New Game'}
                            </button>

                            {uiState === 'game-over' ? (
                                <button onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')} style={{
                                    backgroundColor: '#1A1E26',
                                    color: '#D4AF37',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                                    padding: isMobile ? '6px 8px' : '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #D4AF37',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    <BookOpen size={12} /> {isMobile ? 'Coach' : 'Real Human Coach'}
                                </button>
                            ) : (
                                <button onClick={handleFullAnalysis} style={{
                                    backgroundColor: '#D4AF37',
                                    color: '#0B0E14',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                                    padding: isMobile ? '6px 8px' : '8px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 0 20px rgba(212,175,55,0.2)'
                                }}>
                                    <Target size={12} /> {isMobile ? 'Full Analysis' : 'Start Full Analysis'}
                                </button>
                            )}
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1 }}></div>

                        {/* Right: Close */}
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            style={{
                                minWidth: '36px',
                                minHeight: '36px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: '#1A1E26',
                                border: '1px solid #2A303C',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#E2E8F0',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                                padding: 0
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A303C'; e.currentTarget.style.color = '#E2E8F0'; }}
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                {/* EXIT CONFIRMATION MODAL */}
                {
                    showExitConfirm && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                            <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', borderRadius: '16px', padding: isMobile ? '20px' : '32px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', backgroundColor: '#EF4444' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#EF4444' }}>
                                    <AlertTriangle size={28} />
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>Leave Analysis?</h3>
                                </div>
                                <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
                                    Your game analysis data may be lost. Are you sure you want to close?
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => setShowExitConfirm(false)}
                                            style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #2A303C', backgroundColor: 'transparent', color: '#94A3B8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.1em' }}
                                        >
                                            Stay
                                        </button>
                                        <button
                                            onClick={() => { setShowExitConfirm(false); window.history.back(); }}
                                            style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#EF4444', color: 'white', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.1em', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setShowExitConfirm(false); window.open('https://whiteknight.academy/courses/', '_blank'); }}
                                        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.1em' }}
                                    >
                                        Train with Real Coach
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* SEMI-TRANSPARENT BACKDROP for full-review mode */}
                {
                    uiState === 'full-review' && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 5, pointerEvents: 'none' }}></div>
                    )
                }

                {/* MAIN CONTENT ROW - Expands to fill screen */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    overflow: 'hidden',
                    ...(uiState === 'full-review' ? {
                        margin: isMobile ? '0' : '8px',
                        borderRadius: isMobile ? '0' : '12px',
                        border: isMobile ? 'none' : '1px solid #2A303C',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                        zIndex: 10
                    } : {})
                }}>

                    {/* AUTH MODAL */}
                    {uiState === 'auth-modal' && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '16px' }}>
                            <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', padding: isMobile ? '24px' : '32px', borderRadius: '12px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative', textAlign: 'center' }}>
                                {/* X Close Button */}
                                <button
                                    onClick={() => setUiState('complete')}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1A1E26',
                                        border: '1px solid #2A303C',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#64748B',
                                        transition: 'all 0.2s',
                                        padding: 0
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A303C'; e.currentTarget.style.color = '#64748B'; }}
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>

                                {/* Lock Icon */}
                                <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(212,175,55,0.3)' }}>
                                    <Lock size={28} style={{ color: '#D4AF37' }} />
                                </div>

                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Unlock Full Analysis</h2>
                                <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>Join White Knight Academy to see move-by-move<br />evaluation.</p>

                                {/* Email Input */}
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#0B0E14',
                                        border: '1px solid #2A303C',
                                        padding: '14px 16px',
                                        color: 'white',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        fontSize: '14px',
                                        marginBottom: '12px',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
                                    onBlur={(e) => e.target.style.borderColor = '#2A303C'}
                                />

                                {/* Continue Button */}
                                <button onClick={handleCreateAccount} style={{
                                    width: '100%',
                                    backgroundColor: '#D4AF37',
                                    color: '#0f172a',
                                    fontWeight: 'bold',
                                    padding: '14px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    fontSize: '13px',
                                    marginBottom: '16px',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 12px rgba(212,175,55,0.3)'; }}
                                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                                >
                                    Continue
                                </button>

                                {/* Divider */}
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: '#2A303C' }}></div>
                                    <span style={{ color: '#64748B', fontSize: '12px', padding: '0 12px' }}>or</span>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: '#2A303C' }}></div>
                                </div>

                                {/* Google Login Button */}
                                <button
                                    onClick={() => { /* TODO: Implement Google OAuth */ setUiState('check-inbox'); }}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#1A1E26',
                                        color: 'white',
                                        fontWeight: '600',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid #2A303C',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.borderColor = '#64748B'}
                                    onMouseLeave={(e) => e.target.style.borderColor = '#2A303C'}
                                >
                                    {/* Google G Icon */}
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>
                        </div>
                    )}

                    {/* CHECK INBOX */}
                    {uiState === 'check-inbox' && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}>
                            <style>{`
                                    @keyframes bounce {
                                        0%, 100% { transform: translateY(0); }
                                        50% { transform: translateY(-10px); }
                                    }
                                `}</style>
                            <div style={{ textAlign: 'center' }}>
                                {/* Bouncing Email Icon */}
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 28px',
                                    animation: 'bounce 1s ease-in-out infinite'
                                }}>
                                    <Mail size={56} style={{ color: '#D4AF37' }} />
                                </div>
                                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Check your inbox</h2>
                                <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '32px' }}>We sent a verification link.</p>

                                {/* Skip for Demo Button */}
                                <button
                                    onClick={() => setUiState('full-analyzing')}
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: '#D4AF37',
                                        fontWeight: 'bold',
                                        fontSize: '13px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.15em',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '12px 24px',
                                        transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                                >
                                    Skip for Demo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FULL ANALYZING LOADING SCREEN (Shared with initial Analysis) */}
                    {(uiState === 'full-analyzing' || uiState === 'analyzing') && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0E14' }}>
                            <style>{`
                                    @keyframes spin {
                                        0% { transform: rotate(0deg); }
                                        100% { transform: rotate(360deg); }
                                    }
                                    @keyframes pulse {
                                        0%, 100% { transform: scale(1); opacity: 1; }
                                        50% { transform: scale(1.1); opacity: 0.8; }
                                    }
                                `}</style>
                            <div style={{ textAlign: 'center' }}>
                                {/* Spinning Circle with Pulsing Icon */}
                                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 32px' }}>
                                    {/* Spinning Ring */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        border: '3px solid #1A1E26',
                                        borderTopColor: '#D4AF37',
                                        borderRadius: '50%',
                                        animation: 'spin 1.2s linear infinite'
                                    }} />
                                    {/* Pulsing Center Icon */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        animation: 'pulse 1.5s ease-in-out infinite'
                                    }}>
                                        <Target size={32} style={{ color: '#D4AF37' }} />
                                    </div>
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Analyzing your game...</h2>
                                <p style={{ color: '#64748B', fontSize: '14px' }}>Stockfish</p>
                            </div>
                            {/* Auto-transition ONLY for full-analyzing demo flow */}
                            {uiState === 'full-analyzing' && setTimeout(() => setUiState('full-review'), 2000) && null}
                        </div>
                    )}

                    {/* LEFT: Board - constrained to viewport height */}
                    <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#0B0E14', display: isMobile ? 'none' : 'flex', height: '100%' }}>
                        <div style={{ margin: '0 auto', paddingTop: '20px', paddingBottom: '15px', paddingLeft: '16px', paddingRight: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '700px' }}>

                            {/* Personal Plan is now in the RIGHT sidebar only - removed from here */}

                            <div style={{ width: '100%', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                {/* Eval Bar with Badge */}
                                <div style={{ width: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                                    {/* Eval Bar */}
                                    <div style={{ width: '24px', flex: 1, borderRadius: '4px', overflow: 'hidden', backgroundColor: '#1A1E26', display: 'flex', flexDirection: 'column-reverse', position: 'relative' }}>
                                        {(() => {
                                            const rawEval = isExploring
                                                ? (explorationAnalysis?.eval || 0)
                                                : (analysisData?.[currentMoveIndex]?.eval || 0);
                                            const clampedEval = Math.max(-10, Math.min(10, rawEval));
                                            const percent = ((clampedEval + 10) / 20) * 100;
                                            return (
                                                <>
                                                    <div style={{ width: '100%', height: `${percent}%`, backgroundColor: 'white', transition: 'height 0.5s ease' }} />
                                                    {/* Eval Badge - positioned above the white section */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: `${percent}%`,
                                                        left: '50%',
                                                        transform: 'translate(-50%, -4px)',
                                                        backgroundColor: 'transparent',
                                                        padding: '2px 0',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <span style={{
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                                                            color: 'white'
                                                        }}>
                                                            {rawEval >= 0 ? `+${rawEval.toFixed(1)}` : rawEval.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Board Column - contains opponent info, board, and player info */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 'min(calc(100vh - 220px), 650px)' }}>

                                    {/* Opponent Info (Bot) - aligned with board */}
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                backgroundColor: '#1A1E26',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #2A303C',
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                <User size={18} style={{ color: '#94A3B8' }} />
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontSize: '15px', fontWeight: 'bold', marginBottom: '2px' }}>White Knight "{botName}"</div>
                                                <div style={{ color: '#94A3B8', fontSize: '12px', fontFamily: 'monospace' }}>Rating: ~{botRating}</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 14px',
                                            backgroundColor: '#0F1116',
                                            borderRadius: '10px',
                                            border: '1px solid #2A303C'
                                        }}>
                                            <Clock size={14} style={{ color: '#64748B' }} />
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                color: '#64748B',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {formatTime(botTime)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chess Board with Final Position Overlay */}
                                    <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', boxShadow: '0 0 60px rgba(0,0,0,0.6)', border: '1px solid #2A303C', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#151922' }}>
                                        {/* Board with B&W filter when showing Final Position */}
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            filter: showFinalPosition ? 'grayscale(100%) brightness(0.5)' : 'none',
                                            transition: 'filter 0.5s ease'
                                        }}>
                                            <ChessBoard
                                                position={isExploring ? explorationFen : currentFen}
                                                orientation={playerColor === 'b' ? 'black' : 'white'}
                                                disabled={uiState !== 'full-review' || showFinalPosition}
                                                onMove={uiState === 'full-review' ? (from, to) => handleExplorationMove({ from, to }) : null}
                                                allowAllColors={uiState === 'full-review'}
                                            />
                                        </div>

                                        {/* Final Position Overlay with Auto-Dismiss */}
                                        {showFinalPosition && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(11,14,20,0.85) 100%)',
                                                    animation: 'overlayFade 2.5s ease forwards'
                                                }}
                                            >
                                                <style>{`
                                                        @keyframes overlayFade {
                                                            0% { opacity: 1; }
                                                            80% { opacity: 1; }
                                                            100% { opacity: 0; pointer-events: none; }
                                                        }
                                                    `}</style>
                                                {/* Result Emoji */}
                                                <div style={{
                                                    fontSize: '56px',
                                                    marginBottom: '8px'
                                                }}>
                                                    {result.result === 'win' || result.winner === 'player' ? '🏆' :
                                                        result.result === 'draw' || result.winner === 'draw' ? '🤝' : '😔'}
                                                </div>
                                                {/* Result Text */}
                                                <div style={{
                                                    fontSize: '36px',
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    marginBottom: '4px',
                                                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                                                }}>
                                                    {result.result === 'win' || result.winner === 'player' ? 'Victory' :
                                                        result.result === 'draw' || result.winner === 'draw' ? 'Draw' : 'Defeat'}
                                                </div>
                                                {/* Subtitle */}
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#D4AF37',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.2em',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Final Position
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    {/* Player Info - aligned with board */}
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                backgroundColor: '#D4AF37',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #D4AF37',
                                                boxShadow: '0 0 15px rgba(212,175,55,0.3)',
                                                color: '#0B0E14',
                                                fontWeight: 'bold',
                                                fontSize: '11px'
                                            }}>
                                                WK
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontSize: '15px', fontWeight: 'bold', marginBottom: '2px' }}>Hero User</div>
                                                <div style={{ color: '#94A3B8', fontSize: '12px', fontFamily: 'monospace' }}>Rating: ~1200</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 14px',
                                            backgroundColor: '#1A1E26',
                                            borderRadius: '10px',
                                            border: '1px solid #D4AF37',
                                            boxShadow: '0 0 15px rgba(212,175,55,0.2)',
                                            transform: 'scale(1.02)'
                                        }}>
                                            <Clock size={14} style={{ color: '#D4AF37' }} />
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {formatTime(playerTime)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>



                        </div>
                    </div>

                    {/* RIGHT: Sidebar */}
                    <div style={{ width: isMobile ? '100%' : '380px', minWidth: isMobile ? '0' : '380px', backgroundColor: '#151922', borderLeft: isMobile ? 'none' : '1px solid #2A303C', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.3)', zIndex: 20, height: '100%' }}>

                        {/* Scrollable Content Area - No separate header in full-review mode */}
                        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0B0E14', display: 'flex', flexDirection: 'column' }}>

                            {/* GAME OVER STATE */}
                            {uiState === 'game-over' && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${resultInfo.title === 'Victory' ? '#D4AF37' : resultInfo.title === 'Draw' ? '#94A3B8' : '#EF4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: `0 0 30px ${resultInfo.title === 'Victory' ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.15)'}` }}>
                                        <resultInfo.icon size={40} style={{ color: resultInfo.title === 'Victory' ? '#D4AF37' : resultInfo.title === 'Draw' ? '#94A3B8' : '#EF4444' }} />
                                    </div>
                                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{resultInfo.title}</h1>
                                    <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{resultInfo.subtitle}</p>

                                    <button onClick={startReviewAnalysis} style={{ width: '100%', maxWidth: '280px', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '16px', borderRadius: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', marginBottom: '12px' }}>
                                        Start Review
                                    </button>
                                    <button onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')} style={{ width: '100%', maxWidth: '280px', backgroundColor: '#1A1E26', border: '1px solid #2A303C', color: 'white', fontWeight: 'bold', padding: '16px', borderRadius: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                                        View Courses
                                    </button>
                                </div>
                            )}

                            {/* ANALYZING STATE */}
                            {(uiState === 'analyzing' || uiState === 'full-analyzing') && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                                    <div style={{ width: '100%', maxWidth: '300px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#D4AF37', marginBottom: '10px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            <span>Calculating</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div style={{ height: '6px', width: '100%', backgroundColor: '#2A303C', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', backgroundColor: '#D4AF37', width: `${progress}%`, transition: 'width 0.1s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* COMPLETE STATE - Game Review Dashboard */}
                            {uiState === 'complete' && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

                                    {/* Fixed Top Section: Status + Coach + Personal + Rating + Accuracy */}
                                    <div style={{ flexShrink: 0, padding: isMobile ? '12px 16px' : '16px 20px 12px' }}>

                                        {/* Mobile: Emoji Status */}
                                        {isMobile && (
                                            <div style={{ textAlign: 'center', fontSize: '32px', marginBottom: '4px' }}>
                                                {result.result === 'win' || result.winner === 'player' ? '🏆' : result.result === 'draw' || result.winner === 'draw' ? '🤝' : '😔'}
                                            </div>
                                        )}

                                        {/* 1. Status Text */}
                                        <p style={{ color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 'bold', margin: '0 0 14px 0', textAlign: 'center' }}>
                                            {result.result === 'win' || result.winner === 'player' ? 'Victory' : result.result === 'draw' || result.winner === 'draw' ? 'Draw' : 'Defeat'} • {moveCount} Moves
                                        </p>

                                        {/* 2. Coach Insight + Personal Plan (Combined Box) */}
                                        <div style={{ background: 'linear-gradient(135deg, #1A1E26 0%, #0F1116 100%)', border: '1px solid #2A303C', borderRadius: '10px', position: 'relative', overflow: 'hidden', marginBottom: '16px' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: '#D4AF37' }} />

                                            {/* Coach Insight Section */}
                                            <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #2A303C' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Zap size={16} style={{ color: '#D4AF37' }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                            <span style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Coach Insight</span>
                                                            <span style={{ color: '#64748B', fontSize: '11px' }}>• Game Analysis</span>
                                                        </div>
                                                        <p style={{ fontSize: '15px', color: '#E2E8F0', lineHeight: 1.5, fontStyle: 'italic', margin: 0, wordWrap: 'break-word' }}>
                                                            {/* Dynamic AI Coach text - will be replaced with actual AI insights */}
                                                            {analysisStats?.coachInsight ||
                                                                (analysisStats?.blunder > 0
                                                                    ? `"You made ${analysisStats.blunder} blunder${analysisStats.blunder > 1 ? 's' : ''} in this game. Blunders typically happen when we rush our moves. Take more time on critical positions, especially when pieces are under attack or when your opponent has active threats."`
                                                                    : analysisStats?.mistake > 0
                                                                        ? `"Good effort! You had ${analysisStats.mistake} mistake${analysisStats.mistake > 1 ? 's' : ''} but avoided major blunders. Focus on improving your calculation by looking two moves ahead before committing to a move."`
                                                                        : `"Solid opening play! You controlled the center well. However, you missed a few tactical opportunities in the middlegame. Let's fix that."`)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Personal Plan Section */}
                                            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>Personal Plan</div>
                                                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>Training with a <span style={{ color: '#D4AF37' }}>Real Human Coach</span></div>
                                                </div>
                                                <button style={{ backgroundColor: '#1A1E26', color: '#D4AF37', fontWeight: 'bold', padding: '8px 18px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase', border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', flexShrink: 0 }}>View Plan</button>
                                            </div>
                                        </div>

                                        {/* 4. Rating + Accuracy Cards (side by side) */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                            {/* Rating Card */}
                                            <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                                                <p style={{ color: '#64748B', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px 0' }}>Est. Rating</p>
                                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', lineHeight: 1 }}>{estimatedRating || 1200}</div>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', backgroundColor: 'rgba(74,222,128,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(74,222,128,0.2)' }}>
                                                    <Zap size={10} style={{ color: '#4ADE80' }} />
                                                    <span style={{ color: '#4ADE80', fontSize: '9px', fontWeight: 'bold' }}>+200 pts</span>
                                                </div>
                                            </div>

                                            {/* Accuracy Card */}
                                            <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', padding: '14px', borderRadius: '8px' }}>
                                                <p style={{ color: '#64748B', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px 0', textAlign: 'center' }}>Accuracy</p>
                                                {/* You */}
                                                <div style={{ marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                                                        <span style={{ color: 'white', fontWeight: 'bold' }}>You</span>
                                                        <span style={{ color: '#4ADE80', fontWeight: 'bold' }}>{analysisStats?.accuracy || 0}%</span>
                                                    </div>
                                                    <div style={{ height: '6px', backgroundColor: '#0B0E14', borderRadius: '3px', overflow: 'hidden' }}><div style={{ height: '100%', backgroundColor: '#4ADE80', width: `${analysisStats?.accuracy || 0}%` }} /></div>
                                                </div>
                                                {/* Opponent */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                                                        <span style={{ color: '#64748B' }}>Opponent</span>
                                                        <span style={{ color: '#64748B' }}>{analysisStats?.botAccuracy || 0}%</span>
                                                    </div>
                                                    <div style={{ height: '6px', backgroundColor: '#0B0E14', borderRadius: '3px', overflow: 'hidden' }}><div style={{ height: '100%', backgroundColor: '#475569', width: `${analysisStats?.botAccuracy || 0}%` }} /></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Move Quality (Scrollable) */}
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 12px', minHeight: 0 }}>
                                        <p style={{ color: '#94A3B8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <BarChart2 size={12} style={{ color: '#D4AF37' }} /> Move Quality
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                            {[
                                                { icon: <Award size={12} style={{ color: '#22D3EE' }} />, label: 'Brilliant', count: analysisStats?.brilliant || 0 },
                                                { icon: <CheckCircle2 size={12} style={{ color: '#4ADE80' }} />, label: 'Best Move', count: analysisStats?.best || 0 },
                                                { icon: <Target size={12} style={{ color: '#A3E635' }} />, label: 'Good', count: analysisStats?.good || 0 },
                                                { icon: <BookOpen size={12} style={{ color: '#D4AF37' }} />, label: 'Book', count: analysisStats?.book || 0 },
                                                { icon: <AlertTriangle size={12} style={{ color: '#FB923C' }} />, label: 'Mistake', count: analysisStats?.mistake || 0 },
                                                { icon: <AlertOctagon size={12} style={{ color: '#EF4444' }} />, label: 'Blunder', count: analysisStats?.blunder || 0 },
                                            ].map((item, i) => (
                                                <div key={i} style={{ backgroundColor: '#0B0E14', border: '1px solid #2A303C', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {item.icon}
                                                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.label}</span>
                                                    </div>
                                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 6. Navigation Controls (Fixed at bottom - styled like Full Analysis) */}
                                    <div style={{ flexShrink: 0, padding: '16px 24px 24px', borderTop: '1px solid #2A303C' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', backgroundColor: '#1A1E26', padding: '6px', borderRadius: '8px', border: '1px solid #2A303C' }}>
                                            <button onClick={goToStart} style={{ padding: '10px 12px', color: currentMoveIndex > -1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', transition: 'color 0.2s' }}>
                                                <ChevronFirst size={18} />
                                            </button>
                                            <button onClick={goToPrev} style={{ padding: '10px 12px', color: currentMoveIndex > -1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', transition: 'color 0.2s' }}>
                                                <ChevronLeft size={18} />
                                            </button>
                                            <button onClick={goToNext} style={{ padding: '10px 12px', color: currentMoveIndex < totalMoves - 1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', transition: 'color 0.2s' }}>
                                                <ChevronRight size={18} />
                                            </button>
                                            <button onClick={goToEnd} style={{ padding: '10px 12px', color: currentMoveIndex < totalMoves - 1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', transition: 'color 0.2s' }}>
                                                <ChevronLast size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FULL REVIEW STATE */}
                            {uiState === 'full-review' && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

                                    {/* A. CURRENT MOVE CONTEXT (Fixed Top) */}
                                    {(() => {
                                        const currentAnalysis = analysisData?.[currentMoveIndex];
                                        const moveNum = Math.floor(currentMoveIndex / 2) + 1;
                                        const isWhiteMove = currentMoveIndex % 2 === 0;
                                        const moveLabel = `${moveNum}.${isWhiteMove ? '' : '..'} ${currentAnalysis?.san || ''}`;

                                        const getClassificationColor = (c) => {
                                            if (c === 'book') return '#8B5CF6';
                                            if (c === 'brilliant') return '#22D3EE';
                                            if (c === 'best') return '#4ADE80';
                                            if (c === 'good') return '#D4AF37';
                                            if (c === 'inaccuracy') return '#FB923C';
                                            if (c === 'mistake') return '#F97316';
                                            if (c === 'blunder') return '#EF4444';
                                            return '#94A3B8';
                                        };

                                        const getClassificationLabel = (c) => {
                                            if (c === 'book') return 'BOOK MOVE';
                                            if (c === 'brilliant') return 'BRILLIANT';
                                            if (c === 'best') return 'BEST MOVE';
                                            if (c === 'good') return 'GOOD';
                                            if (c === 'inaccuracy') return 'INACCURACY';
                                            if (c === 'mistake') return 'MISTAKE';
                                            if (c === 'blunder') return 'BLUNDER';
                                            return '';
                                        };

                                        const getMoveDescription = (c) => {
                                            if (c === 'brilliant') return 'An exceptional and creative move!';
                                            if (c === 'best') return 'You found the best move! This maintains or improves your position.';
                                            if (c === 'good') return 'A solid move that keeps the position balanced.';
                                            if (c === 'book') return 'This is a standard theoretical move from opening theory.';
                                            if (c === 'inaccuracy') return 'A slightly imprecise move. There was a better option.';
                                            if (c === 'mistake') return 'This move loses some advantage. Consider alternatives.';
                                            if (c === 'blunder') return 'A critical error that significantly worsens the position.';
                                            return '';
                                        };

                                        const classification = currentAnalysis?.classification || 'good';
                                        const classColor = getClassificationColor(classification);
                                        const evalValue = currentAnalysis?.eval || 0;

                                        return (
                                            <div style={{ flexShrink: 0, padding: '16px 20px', borderBottom: '1px solid #2A303C', backgroundColor: '#1A1E26', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: '#D4AF37' }}></div>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                                    <div style={{ backgroundColor: 'rgba(212,175,55,0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 0 15px rgba(212,175,55,0.1)' }}>
                                                        <Award size={26} style={{ color: '#D4AF37' }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', fontFamily: 'serif' }}>{moveLabel}</span>
                                                            {getClassificationLabel(classification) && (
                                                                <span style={{
                                                                    backgroundColor: `${classColor}20`,
                                                                    color: classColor,
                                                                    border: `1px solid ${classColor}40`,
                                                                    fontSize: '9px',
                                                                    fontWeight: 'bold',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '4px',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em'
                                                                }}>
                                                                    {getClassificationLabel(classification)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.5, margin: 0, marginBottom: '8px' }}>
                                                            {getMoveDescription(classification)}
                                                        </p>
                                                        <button style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            color: '#D4AF37', fontSize: '11px', fontWeight: 'bold',
                                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                                            background: 'none', border: 'none', padding: 0, cursor: 'pointer'
                                                        }}>
                                                            <Zap size={12} /> Ask Coach Why
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* B. ENGINE ANALYSIS LINES (Fixed) */}
                                    <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid #2A303C', backgroundColor: '#0B0E14' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Layers size={14} style={{ color: '#D4AF37' }} />
                                                <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em' }}>Engine Analysis</span>
                                            </div>
                                            <span style={{ backgroundColor: '#1A1E26', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace', color: '#64748B', border: '1px solid #2A303C' }}>Stockfish 16 • Depth 15</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {(() => {
                                                // Get variations from current analysis data
                                                const currentAnalysis = analysisData?.[currentMoveIndex];
                                                // If exploring, we use the single exploration result, otherwise we use the stored MultiPV variations
                                                let variations = [];

                                                if (isExploring && explorationAnalysis) {
                                                    // Exploration currently returns single best line, wrap it
                                                    variations = [{
                                                        eval: explorationAnalysis.eval,
                                                        pvSan: explorationAnalysis.pvSan,
                                                        bestMove: explorationAnalysis.bestMove
                                                    }];
                                                    // If we add MultiPV to exploration later, this adapts automatically
                                                    if (explorationAnalysis.variations) {
                                                        variations = explorationAnalysis.variations;
                                                    }
                                                } else if (currentAnalysis) {
                                                    variations = currentAnalysis.variations || [];
                                                    // Fallback if variations array is missing but we have main line
                                                    if (!variations.length && currentAnalysis.bestMove) {
                                                        variations = [{
                                                            eval: currentAnalysis.eval,
                                                            pvSan: currentAnalysis.pvSan,
                                                            bestMove: currentAnalysis.bestMove
                                                        }];
                                                    }
                                                }

                                                if (!variations || variations.length === 0) {
                                                    return <div style={{ color: '#64748B', fontSize: '11px', padding: '8px', fontStyle: 'italic' }}>Waiting for engine...</div>;
                                                }

                                                // Limit to 2 lines (or 3 for Pro)
                                                return variations.slice(0, isProMode ? 3 : 2).map((variation, index) => {
                                                    // Determine color based on index (Best=Green, 2nd=Yellow, 3rd=Blue)
                                                    const color = index === 0 ? '#4ADE80' : index === 1 ? '#FACC15' : '#3B82F6';
                                                    const bgColor = index === 0 ? 'rgba(74, 222, 128, 0.1)' : index === 1 ? 'rgba(250, 204, 21, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                                                    const borderColor = index === 0 ? 'rgba(74, 222, 128, 0.2)' : index === 1 ? 'rgba(250, 204, 21, 0.2)' : 'rgba(59, 130, 246, 0.2)';

                                                    // Sanitize Evaluation
                                                    const evalNum = typeof variation.eval === 'number' ? variation.eval : 0;
                                                    const evalText = evalNum > 0 ? `+${evalNum.toFixed(2)}` : evalNum.toFixed(2);

                                                    // Sanitize PV
                                                    // Logic: PV might be stored as UCI array in 'pv' or SAN array in 'pvSan'.
                                                    // We need SAN for display. If only UCI is available, we might need to convert or show generic text.
                                                    // In 'analyzeGame', we passed 'variations' from 'analyzePosition'.
                                                    // 'analyzePosition' logic in StockfishAnalyzer currently only returns UCI 'pv'.
                                                    // MISSING LINK: We need to convert UCI variations to SAN!
                                                    // For now, if pvSan is missing, show "Loading..." or raw moves if acceptable? 
                                                    // Actually, 'analyzeGame' loop does convert the *main* line to SAN. But the *variations* inside it might just be UCI.

                                                    let moveText = '';
                                                    if (variation.pvSan && variation.pvSan.length) {
                                                        moveText = variation.pvSan.slice(0, 5).join(' ');
                                                    } else if (variation.pv && variation.pv.length) {
                                                        // Fallback to displaying UCI if SAN conversion missing for 2nd/3rd lines
                                                        // Ideally we fix this in backend, but for UI resilience:
                                                        moveText = variation.pv.slice(0, 5).join(' ');
                                                    }

                                                    return (
                                                        <div key={index} style={{
                                                            backgroundColor: '#151922',
                                                            border: '1px solid #2A303C',
                                                            borderLeft: `2px solid ${color}`,
                                                            borderRadius: '6px',
                                                            padding: '10px 12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            cursor: 'pointer'
                                                        }}>
                                                            <span style={{
                                                                color: color,
                                                                fontWeight: 'bold',
                                                                fontSize: '12px',
                                                                fontFamily: 'monospace',
                                                                backgroundColor: bgColor,
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                minWidth: '50px',
                                                                textAlign: 'right'
                                                            }}>
                                                                {evalText}
                                                            </span>
                                                            <span style={{ flex: 1, color: '#E2E8F0', fontSize: '12px', fontFamily: 'monospace', opacity: 0.9 }}>
                                                                {moveText} {variation.pv?.length > 5 ? '...' : ''}
                                                            </span>
                                                            <span style={{ color: '#64748B', fontSize: '9px', fontWeight: 'bold' }}>D:15</span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    {/* Exploration Mode Panel (shown when exploring) */}
                                    {isExploring && (
                                        <div style={{ flexShrink: 0, backgroundColor: '#0B0E14', borderBottom: '1px solid #4ADE80' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: 'rgba(74, 222, 128, 0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '14px' }}>🔍</span>
                                                    <span style={{ color: '#4ADE80', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                        Exploring Alternate Lines
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={exitExploration}
                                                    style={{
                                                        backgroundColor: '#2A303C',
                                                        color: '#94A3B8',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #3A404C',
                                                        cursor: 'pointer',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}
                                                >
                                                    ← Back to Game
                                                </button>
                                            </div>
                                            {explorationAnalysis && (
                                                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px' }}>
                                                    <div>
                                                        <span style={{ color: '#64748B' }}>You played: </span>
                                                        <span style={{ color: 'white', fontWeight: 'bold', fontFamily: 'monospace' }}>{explorationAnalysis.san}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748B' }}>Eval: </span>
                                                        <span style={{
                                                            color: explorationAnalysis.eval >= 0 ? '#4ADE80' : '#EF4444',
                                                            fontWeight: 'bold',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {explorationAnalysis.eval >= 0 ? '+' : ''}{explorationAnalysis.eval?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {explorationAnalysis.bestMoveSan && (
                                                        <div>
                                                            <span style={{ color: '#64748B' }}>Best: </span>
                                                            <span style={{ color: '#4ADE80', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                                {explorationAnalysis.bestMoveSan}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* C. MOVE HISTORY (Scrollable) */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0B0E14', overflow: 'hidden', minHeight: 0 }}>

                                        {/* Header with Return Button */}
                                        <div style={{ flexShrink: 0, padding: '10px 20px', backgroundColor: '#151922', borderBottom: '1px solid #2A303C', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <BookOpen size={14} style={{ color: '#D4AF37' }} />
                                                <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.08em' }}>Move History</span>
                                            </div>

                                            {isExploring && (
                                                <button
                                                    onClick={exitExploration}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        fontSize: '10px', fontWeight: 'bold', color: '#D4AF37',
                                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                                        backgroundColor: 'rgba(212,175,55,0.1)',
                                                        padding: '5px 10px', borderRadius: '4px',
                                                        border: '1px solid rgba(212,175,55,0.2)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <RotateCcw size={12} /> Return to Main Line
                                                </button>
                                            )}
                                        </div>

                                        {/* Grid Header */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', borderBottom: '1px solid #2A303C', backgroundColor: '#0F1116', flexShrink: 0 }}>
                                            <div style={{ padding: '8px', textAlign: 'center', fontSize: '10px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</div>
                                            <div style={{ padding: '8px 12px', fontSize: '10px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>White</div>
                                            <div style={{ padding: '8px 12px', fontSize: '10px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Black</div>
                                        </div>

                                        {/* Scrollable Move List */}
                                        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                            {formattedMoves.map((m, i) => {
                                                const wMoveIndex = i * 2;
                                                const bMoveIndex = i * 2 + 1;
                                                const wAnalysis = analysisData?.[wMoveIndex];
                                                const bAnalysis = analysisData?.[bMoveIndex];
                                                const isWhiteSelected = currentMoveIndex === wMoveIndex;
                                                const isBlackSelected = currentMoveIndex === bMoveIndex;

                                                const getSymbol = (classification) => {
                                                    if (classification === 'brilliant') return '!!';
                                                    if (classification === 'best') return '★';
                                                    if (classification === 'good') return '';
                                                    if (classification === 'inaccuracy') return '?!';
                                                    if (classification === 'mistake') return '?';
                                                    if (classification === 'blunder') return '??';
                                                    return '';
                                                };

                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '40px 1fr 1fr',
                                                            fontSize: '12px',
                                                            fontFamily: 'monospace',
                                                            borderBottom: '1px solid rgba(42, 48, 60, 0.3)',
                                                            backgroundColor: i % 2 === 0 ? '#0B0E14' : '#0F1116',
                                                            transition: 'background-color 0.1s'
                                                        }}
                                                    >
                                                        <div style={{ padding: '10px 8px', textAlign: 'center', color: '#64748B', backgroundColor: 'rgba(21, 25, 34, 0.5)', borderRight: '1px solid rgba(42, 48, 60, 0.3)' }}>{i + 1}.</div>

                                                        {/* White Move */}
                                                        <div
                                                            onClick={() => goToMove(wMoveIndex)}
                                                            style={{
                                                                padding: '10px 12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                cursor: 'pointer',
                                                                backgroundColor: isWhiteSelected ? 'rgba(212,175,55,0.1)' : 'transparent',
                                                                boxShadow: isWhiteSelected ? 'inset 3px 0 0 #D4AF37' : 'none',
                                                                color: getMoveColor(wAnalysis?.classification),
                                                                fontWeight: isWhiteSelected ? 'bold' : 'normal',
                                                                transition: 'all 0.15s'
                                                            }}
                                                        >
                                                            {m.w}
                                                            {getSymbol(wAnalysis?.classification) && (
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    padding: '1px 4px',
                                                                    borderRadius: '3px',
                                                                    backgroundColor: '#2A303C',
                                                                    color: getMoveColor(wAnalysis?.classification),
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {getSymbol(wAnalysis?.classification)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Black Move */}
                                                        <div
                                                            onClick={() => m.b && goToMove(bMoveIndex)}
                                                            style={{
                                                                padding: '10px 12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                cursor: m.b ? 'pointer' : 'default',
                                                                backgroundColor: isBlackSelected ? 'rgba(212,175,55,0.1)' : 'transparent',
                                                                boxShadow: isBlackSelected ? 'inset 3px 0 0 #D4AF37' : 'none',
                                                                color: getMoveColor(bAnalysis?.classification),
                                                                fontWeight: isBlackSelected ? 'bold' : 'normal',
                                                                borderLeft: '1px solid rgba(42, 48, 60, 0.3)',
                                                                transition: 'all 0.15s'
                                                            }}
                                                        >
                                                            {m.b}
                                                            {getSymbol(bAnalysis?.classification) && (
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    padding: '1px 4px',
                                                                    borderRadius: '3px',
                                                                    backgroundColor: '#2A303C',
                                                                    color: getMoveColor(bAnalysis?.classification),
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {getSymbol(bAnalysis?.classification)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons - Fixed at bottom of right panel (hide for complete state since it has its own, and hide for mobile game-over) */}
                        {uiState !== 'complete' && !(isMobile && uiState === 'game-over') && (
                            <div style={{ flexShrink: 0, padding: '12px', borderTop: '1px solid #2A303C', backgroundColor: '#151922', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A1E26', borderRadius: '8px', border: '1px solid #2A303C', overflow: 'hidden' }}>
                                    <button onClick={goToStart} style={{ padding: '12px 14px', color: currentMoveIndex > -1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}><ChevronFirst size={18} /></button>
                                    <button onClick={goToPrev} style={{ padding: '12px 12px', color: currentMoveIndex > -1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}><ChevronLeft size={18} /></button>
                                    <button onClick={goToNext} style={{ padding: '12px 12px', color: currentMoveIndex < totalMoves - 1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}><ChevronRight size={18} /></button>
                                    <button onClick={goToEnd} style={{ padding: '12px 14px', color: currentMoveIndex < totalMoves - 1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}><ChevronLast size={18} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            </div >

            {/* Debug Console removed - was causing crash (undefined component) */}
        </>
    );
    // } (Removed Desktop only check)


    // --- MOBILE LAYOUT ---

    // For full-review state, use new mobile Full Analysis layout
    if (uiState === 'full-review') {
        const currentMoveData = analysisData?.[currentMoveIndex] || {};
        const rawEval = currentMoveData.eval || 0;
        const evalPercent = Math.max(0, Math.min(100, ((rawEval + 10) / 20) * 100));

        // Classification colors
        const classification = currentMoveData.classification || 'good';
        const classColors = {
            brilliant: { bg: '#3B82F6', text: 'BRILLIANT' },
            great: { bg: '#22C55E', text: 'GREAT' },
            best: { bg: '#22C55E', text: 'BEST' },
            good: { bg: '#22C55E', text: 'GOOD' },
            book: { bg: '#6366F1', text: 'BOOK' },
            inaccuracy: { bg: '#F59E0B', text: 'INACCURACY' },
            mistake: { bg: '#EF4444', text: 'MISTAKE' },
            blunder: { bg: '#DC2626', text: 'BLUNDER' }
        };
        const classInfo = classColors[classification] || classColors.good;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#0B0E14', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

                {/* 1. HEADER */}
                <div style={{ height: '44px', minHeight: '44px', borderBottom: '1px solid #2A303C', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', backgroundColor: '#0B0E14', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => setShowExitConfirm(true)} style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
                        <span style={{ fontWeight: 'bold', color: '#D4AF37', fontSize: '13px', textTransform: 'uppercase' }}>Full Analysis</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={handleNewGame} style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}><RotateCcw size={16} /></button>
                        <button onClick={handleReAnalyze} style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}><Layers size={16} /></button>
                        <button onClick={() => setShowExitConfirm(true)} style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}><X size={18} /></button>
                    </div>
                </div>

                {/* 2. HORIZONTAL EVAL BAR */}
                <div style={{ height: '24px', minHeight: '24px', backgroundColor: '#1A1E26', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${evalPercent}%`, backgroundColor: '#FFFFFF', transition: 'width 0.3s ease' }} />
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 'bold', color: evalPercent > 50 ? '#1A1E26' : '#FFF', fontFamily: 'monospace', zIndex: 1 }}>
                        {rawEval >= 0 ? `+${rawEval.toFixed(2)}` : rawEval.toFixed(2)}
                    </span>
                </div>

                {/* 3. MOVE EVALUATION PANEL */}
                <div style={{ backgroundColor: '#151922', borderBottom: '1px solid #2A303C', padding: '10px 12px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: classInfo.bg + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${classInfo.bg}`, flexShrink: 0 }}>
                            {classification === 'brilliant' && <Sparkles size={16} style={{ color: classInfo.bg }} />}
                            {classification === 'good' && <CheckCircle2 size={16} style={{ color: classInfo.bg }} />}
                            {classification === 'mistake' && <AlertTriangle size={16} style={{ color: classInfo.bg }} />}
                            {classification === 'blunder' && <XCircle size={16} style={{ color: classInfo.bg }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'white' }}>{currentMoveIndex >= 0 ? `${Math.floor(currentMoveIndex / 2) + 1}. ${gameMoves[currentMoveIndex]?.san || '...'}` : '0...'}</span>
                                <span style={{ backgroundColor: classInfo.bg, color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>{classInfo.text}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{currentMoveData.description || 'A solid move that keeps position balanced.'}</p>
                            <button style={{ marginTop: '4px', color: '#D4AF37', background: 'transparent', border: 'none', padding: 0, fontSize: '10px', cursor: 'pointer' }}>✨ Ask Coach Why</button>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: rawEval >= 0 ? '#22C55E' : '#EF4444', fontFamily: 'monospace' }}>{rawEval >= 0 ? `+${rawEval.toFixed(2)}` : rawEval.toFixed(2)}</span>
                    </div>
                </div>

                {/* 4. ENGINE ANALYSIS LINE */}
                <div style={{ height: '28px', minHeight: '28px', backgroundColor: '#0B0E14', borderBottom: '1px solid #2A303C', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '6px', flexShrink: 0 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingUp size={10} style={{ color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '10px', color: '#94A3B8' }}>
                        {currentMoveData.bestLine?.slice(0, 5).join(' ') || 'Analyzing...'}
                    </div>
                </div>

                {/* 5. BOARD SECTION */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    {/* Bot info */}
                    <div style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#1A1E26', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={10} style={{ color: '#94A3B8' }} /></div>
                            <span style={{ fontSize: '10px', color: '#94A3B8' }}>{botName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', backgroundColor: '#1A1E26', borderRadius: '4px' }}>
                            <Clock size={9} style={{ color: '#64748B' }} />
                            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>{formatTime(botTime)}</span>
                        </div>
                    </div>
                    {/* Board */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', minHeight: 0 }}>
                        <div style={{ width: '100%', maxWidth: 'min(100vw - 8px, 100vh - 260px)', aspectRatio: '1/1', boxShadow: '0 0 30px rgba(0,0,0,0.4)', border: '1px solid #2A303C', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#151922' }}>
                            <ChessBoard position={currentFen} orientation={playerColor === 'b' ? 'black' : 'white'} disabled={true} />
                        </div>
                    </div>
                    {/* Player info */}
                    <div style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B0E14', fontWeight: 'bold', fontSize: '7px' }}>WK</div>
                            <span style={{ fontSize: '10px', color: 'white' }}>Hero User</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', backgroundColor: '#1A1E26', borderRadius: '4px', border: '1px solid #D4AF37' }}>
                            <Clock size={9} style={{ color: '#D4AF37' }} />
                            <span style={{ fontSize: '10px', color: 'white', fontFamily: 'monospace' }}>{formatTime(playerTime)}</span>
                        </div>
                    </div>
                </div>

                {/* 6. MOVE NOTATION BAR */}
                <div style={{ height: '40px', minHeight: '40px', backgroundColor: '#151922', borderTop: '1px solid #2A303C', display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0 }}>
                    <button onClick={goToPrev} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentMoveIndex > -1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        {gameMoves.map((move, i) => (
                            <React.Fragment key={i}>
                                {i % 2 === 0 && <span style={{ fontSize: '9px', color: '#475569', marginLeft: i > 0 ? '4px' : 0 }}>{Math.floor(i / 2) + 1}.</span>}
                                <button onClick={() => goToMove(i)} style={{ padding: '3px 5px', fontSize: '10px', fontWeight: i === currentMoveIndex ? 'bold' : 'normal', backgroundColor: i === currentMoveIndex ? '#D4AF37' : 'transparent', color: i === currentMoveIndex ? '#0B0E14' : '#94A3B8', border: 'none', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{move.san}</button>
                            </React.Fragment>
                        ))}
                    </div>
                    <button onClick={goToNext} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentMoveIndex < totalMoves - 1 ? '#E2E8F0' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer' }}><ChevronRight size={18} /></button>
                </div>

                {/* Exit Modal */}
                {showExitConfirm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: '16px' }}>
                        <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', borderRadius: '12px', padding: '20px', maxWidth: '280px', width: '100%' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '8px', textAlign: 'center' }}>Exit Analysis?</h3>
                            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px', textAlign: 'center' }}>Your progress will be saved.</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setShowExitConfirm(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2A303C', backgroundColor: '#1A1E26', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Stay</button>
                                <button onClick={() => { setShowExitConfirm(false); window.history.back(); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Exit</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // For other mobile states (game-over, analyzing, complete, etc.) - original layout
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#0B0E14', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

            {/* AUTH MODAL */}
            {uiState === 'auth-modal' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', padding: '16px' }}>
                    <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', padding: '24px', borderRadius: '8px', maxWidth: '340px', width: '100%', position: 'relative' }}>
                        <button onClick={() => setUiState('complete')} style={{ position: 'absolute', top: '12px', right: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={20} /></button>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '1px solid rgba(212,175,55,0.3)' }}>
                                <Lock size={24} style={{ color: '#D4AF37' }} />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Unlock Full Analysis</h2>
                            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Join White Knight Academy</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input type="email" placeholder="Email address" style={{ width: '100%', backgroundColor: '#0B0E14', border: '1px solid #2A303C', padding: '10px 12px', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
                            <button onClick={handleCreateAccount} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}>
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div style={{ height: '48px', minHeight: '48px', borderBottom: '1px solid #2A303C', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', backgroundColor: '#0B0E14' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>WK</div>
                    <span style={{ fontWeight: 'bold', color: '#D4AF37', letterSpacing: '0.1em', fontSize: '12px', textTransform: 'uppercase' }}>
                        {uiState === 'full-review' ? 'Analysis' : 'Review'}
                    </span>
                </div>
                <button style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }}>
                    <Menu size={18} />
                </button>
            </div>

            {/* TOP: Collapsible Panel */}
            <div style={{ backgroundColor: '#151922', borderBottom: '1px solid #2A303C' }}>
                <div onClick={() => setPanelExpanded(!panelExpanded)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 'bold', color: '#D4AF37', letterSpacing: '0.1em', fontSize: '12px' }}>
                        {uiState === 'full-review' ? 'ANALYSIS' : uiState === 'game-over' ? 'GAME OVER' : 'REVIEW'}
                    </span>
                    {panelExpanded ? <ChevronUp size={18} style={{ color: '#94A3B8' }} /> : <ChevronDown size={18} style={{ color: '#94A3B8' }} />}
                </div>

                {panelExpanded && (
                    <div style={{ padding: '0 16px 16px', maxHeight: '45vh', overflowY: 'auto' }}>

                        {uiState === 'game-over' && (
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <Award size={32} style={{ color: '#D4AF37' }} />
                                </div>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Victory</h1>
                                <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}>Checkmate • 32 Moves</p>
                                <button onClick={startReviewAnalysis} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '12px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase', border: 'none', cursor: 'pointer', marginBottom: '8px' }}>
                                    Start Review
                                </button>
                                <button style={{ width: '100%', backgroundColor: '#1A1E26', border: '1px solid #2A303C', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>
                                    View Courses
                                </button>
                            </div>
                        )}

                        {(uiState === 'analyzing' || uiState === 'full-analyzing') && (
                            <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#D4AF37', marginBottom: '8px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                    <span>Calculating</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ height: '4px', backgroundColor: '#2A303C', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', backgroundColor: '#D4AF37', width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        {uiState === 'complete' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                                    <div style={{ backgroundColor: '#1A1E26', border: '1px solid #2A303C', padding: '10px', textAlign: 'center', borderRadius: '4px', minWidth: '80px' }}>
                                        <p style={{ color: '#64748B', fontSize: '8px', textTransform: 'uppercase', marginBottom: '2px' }}>Rating</p>
                                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>1450</div>
                                        <span style={{ color: '#4ADE80', fontSize: '9px', fontWeight: 'bold' }}>Advanced</span>
                                    </div>
                                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                        {[
                                            { icon: <Award size={10} style={{ color: '#22D3EE' }} />, label: 'Brill', count: 2 },
                                            { icon: <CheckCircle2 size={10} style={{ color: '#4ADE80' }} />, label: 'Best', count: 14 },
                                            { icon: <BookOpen size={10} style={{ color: '#D4AF37' }} />, label: 'Book', count: 8 },
                                            { icon: <XCircle size={10} style={{ color: '#F87171' }} />, label: 'Miss', count: 1 },
                                            { icon: <AlertTriangle size={10} style={{ color: '#FB923C' }} />, label: 'Mist', count: 3 },
                                            { icon: <AlertOctagon size={10} style={{ color: '#EF4444' }} />, label: 'Blun', count: 1 },
                                        ].map((item, i) => (
                                            <div key={i} style={{ backgroundColor: '#1A1E26', border: '1px solid #2A303C', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {item.icon}
                                                    <span style={{ fontSize: '8px', color: '#94A3B8' }}>{item.label}</span>
                                                </div>
                                                <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>{item.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleFullAnalysis} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', padding: '12px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>
                                    Full Game Analysis
                                </button>
                            </div>
                        )}

                        {uiState === 'full-review' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ backgroundColor: '#1A1E26', border: '1px solid #2A303C', borderRadius: '6px', padding: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div>
                                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>6. Bh5 </span>
                                            <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '3px' }}>??</span>
                                        </div>
                                        <div style={{ color: '#EF4444', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>-4.50</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => setShowBestMove(false)} style={{ flex: 1, padding: '6px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', backgroundColor: !showBestMove ? '#151922' : 'transparent', color: !showBestMove ? 'white' : '#64748B', border: 'none', borderBottom: !showBestMove ? '2px solid #EF4444' : 'none', cursor: 'pointer', borderRadius: '3px 3px 0 0' }}>Played</button>
                                        <button onClick={() => setShowBestMove(true)} style={{ flex: 1, padding: '6px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', backgroundColor: showBestMove ? '#151922' : 'transparent', color: showBestMove ? '#4ADE80' : '#64748B', border: 'none', borderBottom: showBestMove ? '2px solid #4ADE80' : 'none', cursor: 'pointer', borderRadius: '3px 3px 0 0' }}>Best</button>
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
                                        {showBestMove ? (
                                            <span><span style={{ color: '#4ADE80', fontWeight: 'bold' }}>Nxe5!</span> was the best move.</span>
                                        ) : (
                                            <span>You played <span style={{ color: 'white', fontWeight: 'bold' }}>Bh5</span>, losing material.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CENTER: Board */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', minHeight: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 'min(100vw - 16px, 100vh - 250px)', aspectRatio: '1/1', boxShadow: '0 0 30px rgba(0,0,0,0.4)', border: '1px solid #2A303C', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#151922' }}>
                    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}>
                        {initialBoard.map((row, r) => row.map((piece, c) => {
                            const isBlack = (r + c) % 2 === 1;
                            const bg = isBlack ? '#2F3746' : '#9CA3AF';
                            return (
                                <div key={`${r}-${c}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
                                    {c === 0 && <span style={{ position: 'absolute', top: '1px', left: '2px', fontSize: '6px', fontWeight: 'bold', color: isBlack ? '#9CA3AF' : '#2F3746' }}>{8 - r}</span>}
                                    {r === 7 && <span style={{ position: 'absolute', bottom: '0', right: '2px', fontSize: '6px', fontWeight: 'bold', color: isBlack ? '#9CA3AF' : '#2F3746' }}>{String.fromCharCode(97 + c)}</span>}
                                    {uiState === 'full-review' && !showBestMove && r === 5 && c === 7 && (
                                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(239,68,68,0.4)' }}></div>
                                    )}
                                    {piece && <Piece type={piece.toLowerCase()} color={piece === piece.toUpperCase() ? 'w' : 'b'} />}
                                </div>
                            );
                        }))}
                    </div>
                </div>
            </div>

            {/* BOTTOM: Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#0B0E14', borderTop: '1px solid #2A303C' }}>
                <button onClick={handleNewGame} style={{ backgroundColor: '#1A1E26', color: '#E2E8F0', fontSize: '11px', fontWeight: 'bold', padding: '8px 12px', borderRadius: '4px', border: '1px solid #2A303C', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <RotateCcw size={14} /> New Game
                </button>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A1E26', borderRadius: '4px', border: '1px solid #2A303C', overflow: 'hidden' }}>
                    <button style={{ padding: '8px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer' }}><ChevronFirst size={16} /></button>
                    <button style={{ padding: '8px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                    <button style={{ padding: '8px', color: '#E2E8F0', background: 'transparent', border: 'none', cursor: 'pointer' }}><Play size={16} fill="currentColor" /></button>
                    <button style={{ padding: '8px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                    <button style={{ padding: '8px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer' }}><ChevronLast size={16} /></button>
                </div>
            </div>
        </div>
    );
}
