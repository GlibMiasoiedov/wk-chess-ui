/**
 * StockfishAnalyzer.js - Stockfish-based game analysis
 * Evaluates positions to identify mistakes, blunders, and best moves
 */

import { isBookMove, findOpening } from './OpeningBook.js';
import { Chess } from 'chess.js';

const STOCKFISH_JS = '/wp-content/uploads/stockfish/stockfish-17.1-lite-single-03e3232.js';

/**
 * Convert UCI move notation to SAN
 * @param {string} fen - Current position FEN
 * @param {string} uciMove - Move in UCI format (e.g., "g1f3")
 * @returns {string} Move in SAN format (e.g., "Nf3")
 */
function convertUciToSan(fen, uciMove) {
    if (!fen || !uciMove) return uciMove;
    try {
        const chess = new Chess(fen);
        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

        // Make the move to get SAN
        const move = chess.move({ from, to, promotion });
        return move ? move.san : uciMove;
    } catch (e) {
        return uciMove; // Return original if conversion fails
    }
}

// Move classification thresholds (in pawns, not centipawns)
// Note: These are the LOSS thresholds. Positive evalDiff means loss.
const THRESHOLDS = {
    brilliant: 1.5,   // Made a move much better than expected
    best: 0.15,       // Within 0.15 pawn of best move
    good: 0.4,        // Within 0.4 pawns  
    inaccuracy: 0.75, // Lost 0.4-0.75 pawns
    mistake: 1.5,     // Lost 0.75-1.5 pawns
    blunder: 2.5      // Lost 1.5+ pawns
};

class StockfishAnalyzer {
    constructor() {
        this.engine = null;
        this.engineReady = false;
        this.analysisQueue = [];
        this.currentResolve = null;
    }

    async init() {
        return new Promise((resolve) => {
            try {
                this.engine = new Worker(STOCKFISH_JS);

                this.engine.onmessage = (e) => {
                    const msg = e.data;
                    if (typeof msg !== 'string') return;

                    if (msg === 'uciok' || msg === 'readyok') {
                        this.engineReady = true;
                        resolve(true);
                    }

                    // Parse evaluation info
                    if (msg.startsWith('info depth') && msg.includes('score')) {
                        this.parseEvaluation(msg);
                    }

                    // Parse best move response
                    if (msg.startsWith('bestmove')) {
                        this.handleBestMove(msg);
                    }
                };

                this.engine.onerror = () => {
                    this.engineReady = true;
                    resolve(true);
                };

                this.engine.postMessage('uci');
                this.engine.postMessage('isready');

                // Timeout fallback
                setTimeout(() => {
                    if (!this.engineReady) {
                        this.engineReady = true;
                        resolve(true);
                    }
                }, 5000);

            } catch (err) {
                console.error('StockfishAnalyzer init error:', err);
                resolve(false);
            }
        });
    }

    lastEval = null;
    lastPv = null;

    parseEvaluation(msg) {
        // Extract score
        const cpMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);

        // Determine turn from FEN to normalize to White's perspective
        // FEN: rnbqk... w KQkq - 0 1
        // Token 1 is turn (w/b)
        let turn = 'w';
        if (this.currentFen) {
            const parts = this.currentFen.split(' ');
            if (parts.length >= 2) turn = parts[1];
        }

        // Multiplier: If Black to move, engine score is relative to Black.
        // We want relative to White. So negate if Black.
        const mod = turn === 'b' ? -1 : 1;

        if (cpMatch) {
            // cp 100 = 1 pawn.
            this.lastEval = (parseInt(cpMatch[1]) * mod) / 100;
        } else if (mateMatch) {
            const mateIn = parseInt(mateMatch[1]);
            // Positive mate means side to move wins. 
            // If turn=b (Black), positive mate means Black wins (-100 for White).
            // So: (100 * -1) = -100. Correct.
            this.lastEval = (mateIn > 0 ? 100 : -100) * mod;
        }

        // Extract principal variation (best line)
        const pvMatch = msg.match(/pv (.+)/);
        if (pvMatch) {
            this.lastPv = pvMatch[1].split(' ');
        }
    }

    handleBestMove(msg) {
        // Match standard move or (none) for checkmate/stalemate
        const match = msg.match(/bestmove\s+(\S+)/);
        if (match && this.currentResolve) {
            let bestMove = match[1];
            if (bestMove === '(none)') bestMove = null;

            console.log('[StockfishAnalyzer] Got bestmove:', bestMove, 'eval:', this.lastEval);
            this.currentResolve({
                bestMove,
                eval: this.lastEval,
                pv: this.lastPv
            });
            this.currentResolve = null;
            this.lastEval = null;
            this.lastPv = null;
        }
    }

    // Analyze a single position
    async analyzePosition(fen, depth = 15) {
        if (!this.engineReady || !this.engine) {
            console.warn('[StockfishAnalyzer] Engine not ready, returning default eval');
            return { eval: 0, bestMove: null, pv: [] };
        }

        // console.log('[StockfishAnalyzer] Analyzing position:', fen.substring(0, 40) + '...', 'depth:', depth);

        // Save FEN for parsing context (perspective normalization)
        this.currentFen = fen;

        return new Promise((resolve) => {
            this.currentResolve = resolve;
            this.lastEval = null;
            this.lastPv = null;

            this.engine.postMessage('ucinewgame');
            this.engine.postMessage(`position fen ${fen}`);
            this.engine.postMessage(`go depth ${depth}`);

            // Timeout - increased to allow more complex positions
            setTimeout(() => {
                if (this.currentResolve === resolve) {
                    console.warn('[StockfishAnalyzer] Timeout! No response for position, using lastEval:', this.lastEval);
                    // Use lastEval if available (partial result), otherwise 0
                    resolve({ eval: this.lastEval || 0, bestMove: null, pv: [] });
                    this.currentResolve = null;
                }
            }, 15000);
        });
    }


    // Analyze entire game - returns array of move evaluations
    async analyzeGame(moves, depth = 15, onProgress = null) {
        const analysis = [];

        // We need FEN for each position
        // moves array should contain {fen, san, from, to, color} for each move

        let prevEval = 0;
        let lastBookMoveIndex = -1;

        // First pass: find where book moves end
        for (let i = 0; i < moves.length; i++) {
            if (isBookMove(moves, i)) {
                lastBookMoveIndex = i;
            }
        }

        const opening = findOpening(moves, lastBookMoveIndex);
        console.log(`[Analysis] Opening: ${opening?.name || 'None'}, lastBookMoveIndex: ${lastBookMoveIndex}`);

        // Track previous FEN for best move analysis
        let previousFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

        // If there are book moves, get the eval of the position AFTER the last book move
        // This will be our starting prevEval for the first non-book move
        let needsInitialEval = lastBookMoveIndex >= 0;

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const afterFen = move.fen; // FEN after the move
            const beforeFen = previousFen; // FEN before the move

            if (!afterFen) {
                previousFen = afterFen;
                continue;
            }

            // Check if this is a book move
            const isBook = i <= lastBookMoveIndex;

            if (isBook) {
                // Book move - no Stockfish analysis needed
                analysis.push({
                    moveIndex: i,
                    san: move.san,
                    fen: afterFen,
                    fenBefore: beforeFen,
                    eval: 0,
                    evalDiff: 0,
                    bestMove: null,
                    bestMoveSan: null,
                    pv: [],
                    classification: 'book',
                    symbol: '📖',
                    isBook: true,
                    opening: opening
                });

                // Progress callback
                if (onProgress) {
                    onProgress(Math.round((i + 1) / moves.length * 100));
                }
                previousFen = afterFen;

                // If this is the last book move, get the eval for prevEval
                if (i === lastBookMoveIndex) {
                    const lastBookResult = await this.analyzePosition(afterFen, depth);
                    prevEval = lastBookResult.eval || 0;
                    console.log(`[Analysis] Last book position eval: ${prevEval}`);
                }

                continue;
            }

            // Analyze position BEFORE the move to get best move recommendation
            const beforeResult = await this.analyzePosition(beforeFen, depth);

            // Get position evaluation AFTER the move was made
            const afterResult = await this.analyzePosition(afterFen, depth);

            // Eval after the move
            const currentEval = afterResult.eval || 0;

            // Convert best move from UCI to SAN (use beforeFen since that's the position)
            const bestMoveUci = beforeResult.bestMove;
            const bestMoveSan = bestMoveUci ? convertUciToSan(beforeFen, bestMoveUci) : null;

            // Calculate eval difference to classify move
            // prevEval was the eval BEFORE this move (set by previous iteration)
            // currentEval is eval AFTER this move
            // If white moved and eval decreased = bad for white
            const evalDiff = move.color === 'w'
                ? prevEval - currentEval
                : currentEval - prevEval;

            console.log(`[Analysis] Move ${i} (${move.san}): beforeEval=${beforeResult.eval}, afterEval=${currentEval}, prevEval=${prevEval}, evalDiff=${evalDiff.toFixed(2)}, color=${move.color}`);

            // Classify the move based on eval loss
            let classification = 'good';
            let symbol = '';

            if (evalDiff > THRESHOLDS.blunder) {
                classification = 'blunder';
                symbol = '??';
            } else if (evalDiff > THRESHOLDS.mistake) {
                classification = 'mistake';
                symbol = '?';
            } else if (evalDiff > THRESHOLDS.inaccuracy) {
                classification = 'inaccuracy';
                symbol = '?!';
            } else if (evalDiff < -THRESHOLDS.brilliant) {
                classification = 'brilliant';
                symbol = '!!';
            } else if (Math.abs(evalDiff) < THRESHOLDS.best) {
                classification = 'best';
                symbol = '';
            }

            console.log(`[Analysis] -> Classification: ${classification}, symbol: ${symbol}`);

            analysis.push({
                moveIndex: i,
                san: move.san,
                fen: afterFen,
                fenBefore: beforeFen,
                eval: currentEval,
                evalDiff: evalDiff,
                bestMove: bestMoveUci,
                bestMoveSan: bestMoveSan,
                pv: beforeResult.pv,
                classification,
                symbol,
                isBook: false,
                opening: null
            });

            prevEval = currentEval;
            previousFen = afterFen;

            // Progress callback
            if (onProgress) {
                onProgress(Math.round((i + 1) / moves.length * 100));
            }
        }

        return analysis;
    }

    // Generate summary statistics
    generateSummary(analysis, playerColor) {
        const stats = {
            brilliant: 0,
            best: 0,
            good: 0,
            book: 0,
            inaccuracy: 0,
            mistake: 0,
            blunder: 0,
            averageEval: 0,
            accuracy: 0
        };

        let playerMoves = 0;
        let totalAccuracy = 0;
        let botMoves = 0;
        let totalBotAccuracy = 0;

        for (const move of analysis) {
            const isPlayerMove = (playerColor === 'w' && move.moveIndex % 2 === 0) ||
                (playerColor === 'b' && move.moveIndex % 2 === 1);

            if (isPlayerMove) {
                if (move.classification === 'book') {
                    stats.book++;
                    totalAccuracy += 100; // Book moves are perfect
                } else {
                    stats[move.classification]++;
                    // Calculate accuracy based on eval loss (max 100 for no loss)
                    const accuracy = Math.max(0, Math.min(100, 100 - Math.abs(move.evalDiff) * 50));
                    totalAccuracy += accuracy;
                }
                playerMoves++;
            } else {
                // Calculate Bot Accuracy
                let accuracy = 0;
                if (move.classification === 'book') {
                    accuracy = 100;
                } else {
                    // Bot accuracy logic same as player
                    accuracy = Math.max(0, Math.min(100, 100 - Math.abs(move.evalDiff) * 50));
                }
                totalBotAccuracy += accuracy;
                botMoves++;
            }
        }

        stats.averageEval = analysis.length > 0
            ? analysis[analysis.length - 1].eval
            : 0;

        stats.accuracy = playerMoves > 0
            ? Math.round(totalAccuracy / playerMoves)
            : 0;

        stats.botAccuracy = botMoves > 0
            ? Math.round(totalBotAccuracy / botMoves)
            : 0;

        return stats;
    }

    // Get estimated rating based on performance
    estimateRating(stats) {
        // Simple rating estimation based on accuracy and mistakes
        const baseRating = 1200;

        let rating = baseRating;
        rating += stats.accuracy * 8; // Up to +800 for 100% accuracy
        rating -= stats.blunder * 100;
        rating -= stats.mistake * 50;
        rating -= stats.inaccuracy * 20;
        rating += stats.brilliant * 50;
        rating += stats.best * 10;

        return Math.max(400, Math.min(2800, Math.round(rating)));
    }

    destroy() {
        if (this.engine) {
            try {
                this.engine.postMessage('quit');
                this.engine.terminate();
            } catch (e) { }
            this.engine = null;
        }
    }
}

// Singleton
let analyzerInstance = null;

export const getStockfishAnalyzer = async () => {
    if (!analyzerInstance) {
        analyzerInstance = new StockfishAnalyzer();
        await analyzerInstance.init();
    }
    return analyzerInstance;
};

export default StockfishAnalyzer;
