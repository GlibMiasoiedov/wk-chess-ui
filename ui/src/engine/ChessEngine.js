/**
 * ChessEngine.js - Central chess game service
 * Uses user's Stockfish JS file and chess.js for game logic
 */

import { Chess } from 'chess.js';

// Stockfish JS file on user's server
const STOCKFISH_JS = '/wp-content/uploads/stockfish/stockfish-17.1-lite-single-03e3232.js';

// Skill level mapping
export const BOT_LEVELS = {
    rookie: { name: 'Rookie', skill: 0, depth: 1, rating: 400, description: 'Complete beginner' },
    beginner: { name: 'Beginner', skill: 1, depth: 2, rating: 800, description: 'Learning the basics' },
    novice: { name: 'Novice', skill: 1, depth: 2, rating: 800, description: 'Complete beginner' },
    casual: { name: 'Casual', skill: 3, depth: 4, rating: 1200, description: 'Beginner-friendly' },
    intermediate: { name: 'Intermediate', skill: 8, depth: 8, rating: 1500, description: 'Club player' },
    advanced: { name: 'Advanced', skill: 12, depth: 12, rating: 1800, description: 'Strong amateur' },
    master: { name: 'Master', skill: 17, depth: 15, rating: 2200, description: 'Expert level' },
    gm: { name: 'GM', skill: 18, depth: 16, rating: 2800, description: 'Grandmaster strength' },
    expert: { name: 'Expert', skill: 18, depth: 16, rating: 2400, description: 'Near-master' },
    grandmaster: { name: 'Grandmaster', skill: 20, depth: 18, rating: 2800, description: 'Maximum strength' },
    engine: { name: 'Engine', skill: 20, depth: 20, rating: 3200, description: 'Perfect play' }
};

class ChessEngine {
    constructor() {
        this.chess = new Chess();
        this.engine = null;
        this.engineReady = false;
        this.moveHistory = [];
        this.historyFen = [];
        this.currentPly = 0;
        this.onMoveCallback = null;
        this.onGameOverCallback = null;
        this.onEngineReadyCallback = null;
        this.botLevel = 'casual';
        this.playerColor = 'w';
        this.timeControl = { initial: 600, increment: 0 };
        this.clocks = { w: 600, b: 600 };
        this.clockInterval = null;
        this.onClockUpdateCallback = null;
        this.gameActive = false;
        this.gameEnded = false;
    }

    async init() {
        return new Promise((resolve) => {
            try {
                // Load Stockfish as Web Worker directly from JS file
                this.engine = new Worker(STOCKFISH_JS);

                this.engine.onmessage = (e) => {
                    const msg = e.data;
                    if (typeof msg !== 'string') return;

                    if (msg === 'uciok' || msg === 'readyok') {
                        this.engineReady = true;
                        console.log('Stockfish engine ready!');
                        if (this.onEngineReadyCallback) {
                            this.onEngineReadyCallback();
                        }
                        resolve(true);
                    }

                    // Handle bestmove response
                    if (msg.startsWith('bestmove')) {
                        this.handleBestMove(msg);
                    }
                };

                this.engine.onerror = (err) => {
                    console.warn('Stockfish error:', err);
                    this.engineReady = true; // Allow game to proceed with random moves
                    resolve(true);
                };

                // Initialize UCI
                this.engine.postMessage('uci');
                this.engine.postMessage('isready');

                // Timeout fallback
                setTimeout(() => {
                    if (!this.engineReady) {
                        console.warn('Stockfish timeout - using fallback');
                        this.engineReady = true;
                        resolve(true);
                    }
                }, 5000);

            } catch (err) {
                console.error('Failed to load Stockfish:', err);
                this.engineReady = true;
                resolve(true);
            }
        });
    }

    pendingBotMoveCallback = null;

    handleBestMove(msg) {
        const match = msg.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (match && this.pendingBotMoveCallback) {
            const moveStr = match[1];
            const callback = this.pendingBotMoveCallback;
            this.pendingBotMoveCallback = null;
            callback(moveStr);
        }
    }

    sendEngine(cmd) {
        if (this.engine && this.engineReady) {
            this.engine.postMessage(cmd);
        }
    }

    // Game setup
    newGame(options = {}) {
        const {
            botLevel = 'casual',
            playerColor = 'w',
            timeControl = { initial: 600, increment: 0 },
            fen = null
        } = options;

        this.chess = new Chess(fen || undefined);
        this.botLevel = botLevel;
        this.playerColor = playerColor;
        this.timeControl = timeControl;
        this.clocks = { w: timeControl.initial, b: timeControl.initial };
        this.moveHistory = [];
        this.historyFen = [this.chess.fen()];
        this.currentPly = 0;
        this.gameActive = true;
        this.gameEnded = false;

        // Configure Stockfish skill level
        if (this.engine && this.engineReady) {
            const level = BOT_LEVELS[botLevel] || BOT_LEVELS.casual;
            console.log('[ChessEngine] newGame() - Bot level config:', {
                requestedLevel: botLevel,
                resolvedLevel: level,
                BOT_LEVELS_KEYS: Object.keys(BOT_LEVELS),
                matchFound: !!BOT_LEVELS[botLevel]
            });
            this.sendEngine('ucinewgame');
            this.sendEngine('isready');
            this.sendEngine(`setoption name Skill Level value ${level.skill}`);
            console.log(`[ChessEngine] Stockfish Skill Level set to: ${level.skill}, depth will be: ${level.depth}`);
        } else {
            console.warn('[ChessEngine] Engine not ready! Using random moves.');
        }

        // If player is black, bot makes first move
        if (playerColor === 'b') {
            setTimeout(() => this.makeBotMove(), 500);
        }

        return this.getState();
    }

    // Get current game state
    getState() {
        return {
            fen: this.chess.fen(),
            turn: this.chess.turn(),
            isCheck: this.chess.isCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isStalemate: this.chess.isStalemate(),
            isDraw: this.chess.isDraw(),
            isGameOver: this.chess.isGameOver(),
            moves: this.moveHistory,
            legalMoves: this.chess.moves({ verbose: true }),
            clocks: { ...this.clocks },
            playerColor: this.playerColor,
            botLevel: this.botLevel,
            gameActive: this.gameActive,
            gameEnded: this.gameEnded
        };
    }

    // Make a move (returns true if valid)
    makeMove(from, to, promotion = 'q') {
        if (!this.gameActive || this.gameEnded) {
            return { valid: false, move: null };
        }

        try {
            const move = this.chess.move({ from, to, promotion });
            if (move) {
                this.moveHistory.push({
                    san: move.san,
                    from: move.from,
                    to: move.to,
                    piece: move.piece,
                    color: move.color,
                    captured: move.captured,
                    promotion: move.promotion,
                    fen: this.chess.fen()
                });

                this.historyFen.push(this.chess.fen());
                this.currentPly = this.historyFen.length - 1;

                // Add increment to player who made the move
                this.clocks[move.color] += this.timeControl.increment;

                if (this.onMoveCallback) {
                    this.onMoveCallback(this.getState());
                }

                // Check for game over
                if (this.chess.isGameOver()) {
                    this.handleGameOver();
                } else if (this.chess.turn() !== this.playerColor) {
                    // Bot's turn - delay for natural feel
                    const delay = 600 + Math.random() * 900;
                    setTimeout(() => this.makeBotMove(), delay);
                }

                return { valid: true, move };
            }
        } catch (e) {
            // console.error('Move error:', e); // Suppressed as per user request
        }
        return { valid: false, move: null };
    }

    // Request bot move from Stockfish
    makeBotMove() {
        if (!this.gameActive || this.gameEnded || this.chess.isGameOver()) return;

        const level = BOT_LEVELS[this.botLevel] || BOT_LEVELS.casual;
        const fen = this.chess.fen();

        console.log('[ChessEngine] makeBotMove():', {
            botLevel: this.botLevel,
            levelConfig: level,
            engineReady: this.engineReady,
            depth: level.depth
        });

        if (this.engine && this.engineReady) {
            this.pendingBotMoveCallback = (moveStr) => {
                this.executeBotMove(moveStr);
            };

            this.sendEngine(`position fen ${fen}`);
            this.sendEngine(`go depth ${level.depth}`);

            // Timeout fallback removed as per user request (wait for engine indefinitely)
            // setTimeout(() => {
            //     if (this.pendingBotMoveCallback) {
            //         console.warn('Bot move timeout - using random');
            //         this.pendingBotMoveCallback = null;
            //         this.makeRandomMove();
            //     }
            // }, 10000);
        } else {
            // Fallback to random move
            this.makeRandomMove();
        }
    }

    executeBotMove(moveStr) {
        if (!this.gameActive || this.chess.isGameOver()) return;

        const from = moveStr.substring(0, 2);
        const to = moveStr.substring(2, 4);
        const promo = moveStr.length > 4 ? moveStr[4] : undefined;

        try {
            const move = this.chess.move({ from, to, promotion: promo });
            if (move) {
                this.moveHistory.push({
                    san: move.san,
                    from: move.from,
                    to: move.to,
                    piece: move.piece,
                    color: move.color,
                    captured: move.captured,
                    promotion: move.promotion,
                    fen: this.chess.fen()
                });

                this.historyFen.push(this.chess.fen());
                this.currentPly = this.historyFen.length - 1;

                // Add increment to bot who made the move
                this.clocks[move.color] += this.timeControl.increment;

                if (this.onMoveCallback) {
                    this.onMoveCallback(this.getState());
                }

                if (this.chess.isGameOver()) {
                    this.handleGameOver();
                }
            }
        } catch (e) {
            console.error('Bot move error:', e);
            this.makeRandomMove();
        }
    }

    makeRandomMove() {
        const moves = this.chess.moves({ verbose: true });
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            this.executeBotMove(randomMove.from + randomMove.to + (randomMove.promotion || ''));
        }
    }

    // Validate if a move is legal
    isLegalMove(from, to) {
        const moves = this.chess.moves({ square: from, verbose: true });
        return moves.some(m => m.to === to);
    }

    // Get legal moves for a square
    getLegalMoves(square) {
        return this.chess.moves({ square, verbose: true });
    }

    // Needs promotion check
    needsPromotion(from, to) {
        const piece = this.chess.get(from);
        if (!piece || piece.type !== 'p') return false;

        const toRank = to[1];
        return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1');
    }

    // Clock management
    startClock() {
        this.stopClock();

        this.clockInterval = setInterval(() => {
            if (!this.gameActive || this.gameEnded) return;

            const turn = this.chess.turn();
            if (this.clocks[turn] > 0) {
                this.clocks[turn] -= 1;

                if (this.onClockUpdateCallback) {
                    this.onClockUpdateCallback(this.clocks);
                }

                if (this.clocks[turn] <= 0) {
                    this.handleTimeout(turn);
                }
            }
        }, 1000);
    }

    stopClock() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    handleTimeout(color) {
        this.stopClock();
        this.gameActive = false;
        this.gameEnded = true;

        if (this.onGameOverCallback) {
            this.onGameOverCallback({
                result: color === this.playerColor ? 'loss' : 'win',
                reason: 'timeout',
                winner: color === 'w' ? 'black' : 'white'
            });
        }
    }

    handleGameOver() {
        this.stopClock();
        this.gameActive = false;
        this.gameEnded = true;

        let result = 'draw';
        let reason = 'draw';

        if (this.chess.isCheckmate()) {
            const loser = this.chess.turn();
            result = loser === this.playerColor ? 'loss' : 'win';
            reason = 'checkmate';
        } else if (this.chess.isStalemate()) {
            reason = 'stalemate';
        } else if (this.chess.isThreefoldRepetition()) {
            reason = 'repetition';
        } else if (this.chess.isInsufficientMaterial()) {
            reason = 'insufficient';
        }

        if (this.onGameOverCallback) {
            this.onGameOverCallback({ result, reason });
        }
    }

    // Resign
    resign() {
        this.stopClock();
        this.gameActive = false;
        this.gameEnded = true;

        if (this.onGameOverCallback) {
            this.onGameOverCallback({
                result: 'loss',
                reason: 'resignation'
            });
        }
    }

    // Offer draw - bot evaluates position before accepting
    async offerDraw() {
        // Get current position evaluation using Stockfish
        return new Promise((resolve) => {
            if (!this.engine || !this.engineReady) {
                // Fallback: accept draw if game is long and roughly equal material
                resolve(this.moveHistory.length > 30);
                return;
            }

            // Set up evaluation callback
            let evalScore = 0;
            const onEval = (e) => {
                const msg = e.data;
                if (typeof msg !== 'string') return;

                // Parse score
                const cpMatch = msg.match(/score cp (-?\d+)/);
                const mateMatch = msg.match(/score mate (-?\d+)/);

                if (cpMatch) {
                    evalScore = parseInt(cpMatch[1]) / 100;
                } else if (mateMatch) {
                    evalScore = parseInt(mateMatch[1]) > 0 ? 100 : -100;
                }

                if (msg.startsWith('bestmove')) {
                    this.engine.removeEventListener('message', onEval);

                    // Bot plays opposite color to player
                    const botColor = this.playerColor === 'w' ? 'b' : 'w';
                    // Adjust eval from bot's perspective
                    const botEval = botColor === 'w' ? evalScore : -evalScore;

                    // Accept draw if position is equal (within ±0.5) or bad for bot
                    if (botEval <= 0.5) {
                        this.stopClock();
                        this.gameActive = false;
                        this.gameEnded = true;

                        if (this.onGameOverCallback) {
                            this.onGameOverCallback({
                                result: 'draw',
                                reason: 'agreement'
                            });
                        }
                        resolve(true);
                    } else {
                        // Bot is winning, decline draw
                        console.log('Draw declined - bot evaluation:', botEval);
                        resolve(false);
                    }
                }
            };

            this.engine.addEventListener('message', onEval);
            this.engine.postMessage(`position fen ${this.chess.fen()}`);
            this.engine.postMessage('go depth 8');

            // Timeout
            setTimeout(() => {
                this.engine.removeEventListener('message', onEval);
                resolve(false);
            }, 5000);
        });
    }

    // Event callbacks
    onMove(callback) {
        this.onMoveCallback = callback;
    }

    onGameOver(callback) {
        this.onGameOverCallback = callback;
    }

    onClockUpdate(callback) {
        this.onClockUpdateCallback = callback;
    }

    onEngineReady(callback) {
        this.onEngineReadyCallback = callback;
        if (this.engineReady && callback) {
            callback();
        }
    }

    // Cleanup
    destroy() {
        this.stopClock();
        if (this.engine) {
            try {
                this.engine.postMessage('quit');
                this.engine.terminate();
            } catch (e) { }
            this.engine = null;
        }
    }
}

// Singleton instance
let engineInstance = null;

export const getChessEngine = async () => {
    if (!engineInstance) {
        engineInstance = new ChessEngine();
        await engineInstance.init();
    }
    return engineInstance;
};

export default ChessEngine;
