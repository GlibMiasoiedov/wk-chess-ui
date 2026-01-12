/**
 * useChessGame.js - React hook for chess game state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getChessEngine, BOT_LEVELS } from '../engine/ChessEngine.js';

export { BOT_LEVELS };

export function useChessGame() {
    const engineRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [gameState, setGameState] = useState(null);
    const [clocks, setClocks] = useState({ w: 600, b: 600 });
    const [error, setError] = useState(null);

    // Initialize engine
    useEffect(() => {
        let mounted = true;

        const initEngine = async () => {
            try {
                setIsLoading(true);
                const engine = await getChessEngine();

                if (!mounted) return;

                engineRef.current = engine;

                // Set up callbacks
                engine.onMove((state) => {
                    console.log('[useChessGame] onMove callback received:', { fen: state?.fen, turn: state?.turn, moveCount: state?.moves?.length });
                    if (mounted) setGameState({ ...state });
                });

                engine.onClockUpdate((clocks) => {
                    if (mounted) setClocks({ ...clocks });
                });

                engine.onGameOver((result) => {
                    console.log('[useChessGame] onGameOver callback received:', result);
                    if (mounted) {
                        setGameState(prev => prev ? { ...prev, gameOver: result } : null);
                    }
                });

                setIsReady(true);
                setIsLoading(false);
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                    setIsLoading(false);
                    // Still mark as ready so game can proceed
                    setIsReady(true);
                }
            }
        };

        initEngine();

        return () => {
            mounted = false;
        };
    }, []);

    // Start a new game
    const startGame = useCallback((options = {}) => {
        if (!engineRef.current) return null;

        const state = engineRef.current.newGame(options);
        setGameState({ ...state });
        setClocks({
            w: options.timeControl?.initial || 600,
            b: options.timeControl?.initial || 600
        });

        // Start clock
        engineRef.current.startClock();

        return state;
    }, []);

    // Make a move
    const makeMove = useCallback((from, to, promotion) => {
        if (!engineRef.current) return { valid: false };
        return engineRef.current.makeMove(from, to, promotion);
    }, []);

    // Check if move is legal
    const isLegalMove = useCallback((from, to) => {
        if (!engineRef.current) return false;
        return engineRef.current.isLegalMove(from, to);
    }, []);

    // Get legal moves for a square
    const getLegalMoves = useCallback((square) => {
        if (!engineRef.current) return [];
        return engineRef.current.getLegalMoves(square);
    }, []);

    // Check if promotion is needed
    const needsPromotion = useCallback((from, to) => {
        if (!engineRef.current) return false;
        return engineRef.current.needsPromotion(from, to);
    }, []);

    // Resign
    const resign = useCallback(() => {
        if (!engineRef.current) return;
        engineRef.current.resign();
    }, []);

    // Offer draw
    const offerDraw = useCallback(() => {
        if (!engineRef.current) return false;
        return engineRef.current.offerDraw();
    }, []);

    // Stop clocks
    const stopClock = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.stopClock();
        }
    }, []);

    const startClock = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.startClock();
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (engineRef.current) {
                engineRef.current.stopClock();
            }
        };
    }, []);

    return {
        isReady,
        isLoading,
        error,
        gameState,
        clocks,
        startGame,
        makeMove,
        isLegalMove,
        getLegalMoves,
        needsPromotion,
        resign,
        offerDraw,
        stopClock,
        startClock
    };
}

export default useChessGame;
