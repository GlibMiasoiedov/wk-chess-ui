/**
 * StockfishWorker.js - Web Worker wrapper for Stockfish WASM
 * Handles UCI protocol communication
 */

const STOCKFISH_WASM_URL = 'https://whiteknight.academy/wp-content/uploads/stockfish/stockfish-17.1-lite-single-03e3232.wasm';

class StockfishWorker {
    constructor() {
        this.worker = null;
        this.ready = false;
        this.listeners = [];
        this.skillLevel = 10;
        this.moveTime = 1000; // ms
    }

    async init() {
        if (this.worker) return;

        return new Promise((resolve, reject) => {
            try {
                // Create inline worker that loads Stockfish WASM
                const workerCode = `
                    let stockfish = null;
                    
                    self.onmessage = async function(e) {
                        const { type, data } = e.data;
                        
                        if (type === 'init') {
                            try {
                                // Load Stockfish WASM module
                                importScripts('https://cdn.jsdelivr.net/npm/stockfish.wasm@0.10.0/stockfish.js');
                                stockfish = await Stockfish();
                                stockfish.addMessageListener((msg) => {
                                    self.postMessage({ type: 'message', data: msg });
                                });
                                // Initialize UCI protocol
                                stockfish.postMessage('uci');
                                self.postMessage({ type: 'ready' });
                            } catch (err) {
                                self.postMessage({ type: 'error', data: err.message });
                            }
                        } else if (type === 'command') {
                            if (stockfish) {
                                stockfish.postMessage(data);
                            }
                        }
                    };
                `;

                const blob = new Blob([workerCode], { type: 'application/javascript' });
                this.worker = new Worker(URL.createObjectURL(blob));

                this.worker.onmessage = (e) => {
                    const { type, data } = e.data;

                    if (type === 'ready') {
                        this.ready = true;
                        resolve();
                    } else if (type === 'error') {
                        reject(new Error(data));
                    } else if (type === 'message') {
                        this.handleMessage(data);
                    }
                };

                this.worker.postMessage({ type: 'init' });
            } catch (err) {
                reject(err);
            }
        });
    }

    handleMessage(message) {
        // Notify all listeners
        this.listeners.forEach(callback => callback(message));
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    send(command) {
        if (this.worker && this.ready) {
            this.worker.postMessage({ type: 'command', data: command });
        }
    }

    setSkillLevel(level) {
        // Stockfish skill level 0-20
        this.skillLevel = Math.max(0, Math.min(20, level));
        this.send(`setoption name Skill Level value ${this.skillLevel}`);

        // Adjust move overhead based on skill
        const limitStrength = level < 20;
        this.send(`setoption name UCI_LimitStrength value ${limitStrength}`);

        // Map skill to approximate ELO
        const eloMap = {
            1: 800, 3: 1200, 8: 1500, 12: 1800, 17: 2200, 18: 2400, 20: 3200
        };
        const elo = eloMap[level] || 1500;
        if (limitStrength) {
            this.send(`setoption name UCI_Elo value ${elo}`);
        }
    }

    setMoveTime(ms) {
        this.moveTime = ms;
    }

    async getBestMove(fen, depth = null) {
        return new Promise((resolve) => {
            const listener = (msg) => {
                if (msg.startsWith('bestmove')) {
                    this.removeListener(listener);
                    const parts = msg.split(' ');
                    resolve({
                        move: parts[1],
                        ponder: parts[3] || null
                    });
                }
            };

            this.addListener(listener);
            this.send(`position fen ${fen}`);

            if (depth) {
                this.send(`go depth ${depth}`);
            } else {
                this.send(`go movetime ${this.moveTime}`);
            }
        });
    }

    async analyze(fen, depth = 20) {
        return new Promise((resolve) => {
            const analysis = {
                depth: 0,
                score: 0,
                pv: [],
                mate: null
            };

            const listener = (msg) => {
                if (msg.startsWith('info depth')) {
                    const parts = msg.split(' ');
                    const depthIdx = parts.indexOf('depth');
                    const scoreIdx = parts.indexOf('score');
                    const pvIdx = parts.indexOf('pv');
                    const mateIdx = parts.indexOf('mate');

                    if (depthIdx > -1) {
                        analysis.depth = parseInt(parts[depthIdx + 1]);
                    }
                    if (scoreIdx > -1) {
                        if (mateIdx > -1) {
                            analysis.mate = parseInt(parts[mateIdx + 1]);
                            analysis.score = analysis.mate > 0 ? 10000 : -10000;
                        } else {
                            const cpIdx = parts.indexOf('cp');
                            if (cpIdx > -1) {
                                analysis.score = parseInt(parts[cpIdx + 1]) / 100;
                            }
                        }
                    }
                    if (pvIdx > -1) {
                        analysis.pv = parts.slice(pvIdx + 1);
                    }
                }

                if (msg.startsWith('bestmove')) {
                    this.removeListener(listener);
                    const parts = msg.split(' ');
                    analysis.bestMove = parts[1];
                    resolve(analysis);
                }
            };

            this.addListener(listener);
            this.send(`position fen ${fen}`);
            this.send(`go depth ${depth}`);
        });
    }

    stop() {
        this.send('stop');
    }

    destroy() {
        if (this.worker) {
            this.send('quit');
            this.worker.terminate();
            this.worker = null;
            this.ready = false;
        }
    }
}

export default StockfishWorker;
