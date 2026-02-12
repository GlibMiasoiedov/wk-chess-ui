import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Trophy, Star, Shield, Zap, RefreshCw,
    ChevronRight, Lock, Map, Settings as SettingsIcon,
    HelpCircle, X, Play, Heart, CheckCircle, Flame, Target,
    LogOut, User, Bell, Send, GraduationCap
} from 'lucide-react';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard.jsx';

/**
 * KIDS CHESS QUEST - MAIN COMPONENT
 * --------------------------------
 * This is the standalone React component for the Kids Mode.
 * It contains all game logic, animations, and the 60-mission dataset.
 * 
 * PROPS:
 * - onBack: Function to return to the main menu (WhiteKnightNewGame)
 */

// Helper to generate FEN from mission pieces
// chess.js requires both kings, so we add them on safe squares if missing
// Returns { fen, phantomKings } — phantomKings are squares with hidden kings
const generateFenFromMission = (pieces, side = 'white') => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    const occupied = new Set();
    let hasWhiteKing = false;
    let hasBlackKing = false;
    const phantomKings = []; // squares where we secretly place kings

    pieces.forEach(p => {
        const col = p.c.charCodeAt(0) - 97;
        const row = 8 - parseInt(p.c[1]);
        board[row][col] = p.p;
        occupied.add(p.c);
        if (p.p === 'K') hasWhiteKing = true;
        if (p.p === 'k') hasBlackKing = true;
    });

    const safeSquares = ['h1', 'a8', 'h8', 'a1', 'g1', 'b8', 'g8', 'b1'];
    if (!hasWhiteKing) {
        for (const sq of safeSquares) {
            if (!occupied.has(sq)) {
                const col = sq.charCodeAt(0) - 97;
                const row = 8 - parseInt(sq[1]);
                board[row][col] = 'K';
                occupied.add(sq);
                phantomKings.push(sq);
                break;
            }
        }
    }
    if (!hasBlackKing) {
        for (const sq of [...safeSquares].reverse()) {
            if (!occupied.has(sq)) {
                const col = sq.charCodeAt(0) - 97;
                const row = 8 - parseInt(sq[1]);
                board[row][col] = 'k';
                occupied.add(sq);
                phantomKings.push(sq);
                break;
            }
        }
    }

    const fenRows = board.map(row => {
        let fenRow = '';
        let empty = 0;
        row.forEach(cell => {
            if (cell) {
                if (empty > 0) { fenRow += empty; empty = 0; }
                fenRow += cell;
            } else {
                empty++;
            }
        });
        if (empty > 0) fenRow += empty;
        return fenRow;
    });

    const activeColor = side === 'black' ? 'b' : 'w';
    return { fen: `${fenRows.join('/')} ${activeColor} - - 0 1`, phantomKings };
};

// Helper: remove phantom kings from FEN for display (so students don't see them)
const removeSquaresFromFen = (fen, squares) => {
    if (!squares || squares.length === 0 || !fen || fen === 'start') return fen;
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    const newRows = rows.map((row, ri) => {
        let expanded = '';
        for (const ch of row) {
            if (ch >= '1' && ch <= '8') expanded += '0'.repeat(parseInt(ch));
            else expanded += ch;
        }
        const newExpanded = [...expanded].map((ch, ci) => {
            const sq = String.fromCharCode(97 + ci) + (8 - ri);
            return squares.includes(sq) ? '0' : ch;
        });
        // Compress back
        let compressed = '';
        let empty = 0;
        newExpanded.forEach(ch => {
            if (ch === '0') { empty++; }
            else { if (empty > 0) { compressed += empty; empty = 0; } compressed += ch; }
        });
        if (empty > 0) compressed += empty;
        return compressed;
    });
    return [newRows.join('/'), ...parts.slice(1)].join(' ');
};
const GAME_DATA = {
    "version": "1.0",
    "worlds": [
        {
            "id": "pawn", "title": "Pawn World", "icon": "♟️", "color": "#22c55e",
            "missions": [
                { "id": "P01", "type": "move_to", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "b2" }], "target": "b3", "correctMoves": ["b2b3"] },
                { "id": "P02", "type": "move_to", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "e2" }], "target": "e4", "correctMoves": ["e2e4"] },
                { "id": "P03", "type": "capture", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "e4" }, { "p": "p", "c": "d5" }], "targetCapture": "d5", "correctMoves": ["e4d5"] },
                { "id": "P04", "type": "capture", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "e4" }, { "p": "p", "c": "f5" }], "targetCapture": "f5", "correctMoves": ["e4f5"] },
                { "id": "P05", "type": "yes_no", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "e4" }, { "p": "p", "c": "e5" }], "question": "Can a pawn capture forward?", "answer": false },
                { "id": "P06", "type": "move_to", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "a2" }], "target": "a3", "correctMoves": ["a2a3"] },
                { "id": "P07", "type": "capture", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "b5" }, { "p": "p", "c": "a6" }], "targetCapture": "a6", "correctMoves": ["b5a6"] },
                { "id": "P08", "type": "capture", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "b5" }, { "p": "p", "c": "c6" }], "targetCapture": "c6", "correctMoves": ["b5c6"] },
                { "id": "P09", "type": "select_squares", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "d2" }], "selectCorrect": ["d3", "d4"] },
                { "id": "P10", "type": "move_to", "piece": "P", "side": "white", "pieces": [{ "p": "P", "c": "g2" }], "target": "g3", "correctMoves": ["g2g3"] }
            ]
        },
        {
            "id": "rook", "title": "Rook World", "icon": "♜", "color": "#a855f7",
            "missions": [
                { "id": "R01", "type": "move_to", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "a1" }], "target": "a6", "correctMoves": ["a1a6"] },
                { "id": "R02", "type": "move_to", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "h1" }], "target": "d1", "correctMoves": ["h1d1"] },
                { "id": "R03", "type": "capture", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "a4" }, { "p": "p", "c": "a7" }], "targetCapture": "a7", "correctMoves": ["a4a7"] },
                { "id": "R04", "type": "capture", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "e4" }, { "p": "p", "c": "e8" }], "targetCapture": "e8", "correctMoves": ["e4e8"] },
                { "id": "R05", "type": "yes_no", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "a1" }], "question": "Can a rook move diagonally?", "answer": false },
                { "id": "R06", "type": "select_squares", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "d4" }], "selectCorrect": ["d1", "d2", "d3", "d5", "d6", "d7", "d8", "a4", "b4", "c4", "e4", "f4", "g4", "h4"] },
                { "id": "R07", "type": "move_to", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "c3" }], "target": "c1", "correctMoves": ["c3c1"] },
                { "id": "R08", "type": "capture", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "g5" }, { "p": "p", "c": "b5" }], "targetCapture": "b5", "correctMoves": ["g5b5"] },
                { "id": "R09", "type": "move_to", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "f2" }], "target": "f7", "correctMoves": ["f2f7"] },
                { "id": "R10", "type": "capture", "piece": "R", "side": "white", "pieces": [{ "p": "R", "c": "d1" }, { "p": "p", "c": "d8" }], "targetCapture": "d8", "correctMoves": ["d1d8"] }
            ]
        },
        {
            "id": "bishop", "title": "Bishop World", "icon": "♝", "color": "#4ecdc4",
            "missions": [
                { "id": "B01", "type": "move_to", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "c1" }], "target": "g5", "correctMoves": ["c1g5"] },
                { "id": "B02", "type": "move_to", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "f1" }], "target": "b5", "correctMoves": ["f1b5"] },
                { "id": "B03", "type": "capture", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "d4" }, { "p": "p", "c": "g7" }], "targetCapture": "g7", "correctMoves": ["d4g7"] },
                { "id": "B04", "type": "capture", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "e3" }, { "p": "p", "c": "b6" }], "targetCapture": "b6", "correctMoves": ["e3b6"] },
                { "id": "B05", "type": "yes_no", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "c1" }], "question": "Can a bishop move straight?", "answer": false },
                { "id": "B06", "type": "select_squares", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "d4" }], "selectCorrect": ["a1", "b2", "c3", "e5", "f6", "g7", "h8", "a7", "b6", "c5", "e3", "f2", "g1", "h0"] },
                { "id": "B07", "type": "move_to", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "a1" }], "target": "d4", "correctMoves": ["a1d4"] },
                { "id": "B08", "type": "capture", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "h6" }, { "p": "p", "c": "e3" }], "targetCapture": "e3", "correctMoves": ["h6e3"] },
                { "id": "B09", "type": "move_to", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "b2" }], "target": "a3", "correctMoves": ["b2a3"] },
                { "id": "B10", "type": "capture", "piece": "B", "side": "white", "pieces": [{ "p": "B", "c": "c3" }, { "p": "p", "c": "a5" }], "targetCapture": "a5", "correctMoves": ["c3a5"] }
            ]
        },
        {
            "id": "knight", "title": "Knight World", "icon": "♞", "color": "#ff6b9d",
            "missions": [
                { "id": "N01", "type": "select_squares", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "d4" }], "selectCorrect": ["b3", "b5", "c2", "c6", "e2", "e6", "f3", "f5"] },
                { "id": "N02", "type": "move_to", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "b1" }], "target": "c3", "correctMoves": ["b1c3"] },
                { "id": "N03", "type": "move_to", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "g1" }], "target": "f3", "correctMoves": ["g1f3"] },
                { "id": "N04", "type": "capture", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "e4" }, { "p": "p", "c": "f6" }], "targetCapture": "f6", "correctMoves": ["e4f6"] },
                { "id": "N05", "type": "capture", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "e4" }, { "p": "p", "c": "d6" }], "targetCapture": "d6", "correctMoves": ["e4d6"] },
                { "id": "N06", "type": "yes_no", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "c3" }], "question": "Can a knight move to an adjacent square?", "answer": false },
                { "id": "N07", "type": "move_to", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "a2" }], "target": "b4", "correctMoves": ["a2b4"] },
                { "id": "N08", "type": "capture", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "d5" }, { "p": "p", "c": "f4" }], "targetCapture": "f4", "correctMoves": ["d5f4"] },
                { "id": "N09", "type": "move_to", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "f5" }], "target": "g7", "correctMoves": ["f5g7"] },
                { "id": "N10", "type": "capture", "piece": "N", "side": "white", "pieces": [{ "p": "N", "c": "h4" }, { "p": "p", "c": "f5" }], "targetCapture": "f5", "correctMoves": ["h4f5"] }
            ]
        },
        {
            "id": "queen", "title": "Queen World", "icon": "♛", "color": "#ef4444",
            "missions": [
                { "id": "Q01", "type": "move_to", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "d1" }], "target": "d6", "correctMoves": ["d1d6"] },
                { "id": "Q02", "type": "move_to", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "d1" }], "target": "h5", "correctMoves": ["d1h5"] },
                { "id": "Q03", "type": "capture", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "e4" }, { "p": "p", "c": "e8" }], "targetCapture": "e8", "correctMoves": ["e4e8"] },
                { "id": "Q04", "type": "capture", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "e4" }, { "p": "p", "c": "h7" }], "targetCapture": "h7", "correctMoves": ["e4h7"] },
                { "id": "Q05", "type": "yes_no", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "d1" }], "question": "Can a queen move like a rook and bishop?", "answer": true },
                { "id": "Q06", "type": "select_squares", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "d4" }], "selectCorrect": ["d1", "d2", "d3", "d5", "d6", "d7", "d8", "a4", "b4", "c4", "e4", "f4", "g4", "h4", "a1", "b2", "c3", "e5", "f6", "g7", "h8", "a7", "b6", "c5", "e3", "f2", "g1"] },
                { "id": "Q07", "type": "move_to", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "a4" }], "target": "a1", "correctMoves": ["a4a1"] },
                { "id": "Q08", "type": "move_to", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "c3" }], "target": "f6", "correctMoves": ["c3f6"] },
                { "id": "Q09", "type": "capture", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "b5" }, { "p": "p", "c": "g5" }], "targetCapture": "g5", "correctMoves": ["b5g5"] },
                { "id": "Q10", "type": "capture", "piece": "Q", "side": "white", "pieces": [{ "p": "Q", "c": "h4" }, { "p": "p", "c": "d8" }], "targetCapture": "d8", "correctMoves": ["h4d8"] }
            ]
        },
        {
            "id": "king", "title": "King World", "icon": "♚", "color": "#f59e0b",
            "missions": [
                { "id": "K01", "type": "select_squares", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "e4" }], "selectCorrect": ["d3", "e3", "f3", "d4", "f4", "d5", "e5", "f5"] },
                { "id": "K02", "type": "move_to", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "e2" }], "target": "e3", "correctMoves": ["e2e3"] },
                { "id": "K03", "type": "move_to", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "e2" }], "target": "f3", "correctMoves": ["e2f3"] },
                { "id": "K04", "type": "avoid_danger", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "e2" }, { "p": "r", "c": "e8" }], "rule": "king_must_be_safe", "prompt": "The enemy rook controls the file. Move safely.", "correctMoves": ["e2d2", "e2f2", "e2d1", "e2f1"] },
                { "id": "K05", "type": "avoid_danger", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "e4" }, { "p": "b", "c": "h7" }], "rule": "king_must_be_safe", "prompt": "Enemy bishop attacks diagonally. Find a safe square.", "correctMoves": ["e4d3", "e4e3", "e4f3", "e4d4", "e4f4", "e4d5", "e4e5"] },
                { "id": "K06", "type": "yes_no", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "e2" }, { "p": "r", "c": "e8" }], "question": "Can the King move to e3 if it's attacked?", "answer": false },
                { "id": "K07", "type": "move_to", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "g1" }], "target": "f2", "correctMoves": ["g1f2"] },
                { "id": "K08", "type": "avoid_danger", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "d4" }, { "p": "r", "c": "d8" }, { "p": "b", "c": "a1" }], "rule": "king_must_be_safe", "prompt": "Avoid the rook and bishop. Find safety.", "correctMoves": ["d4c5"] },
                { "id": "K09", "type": "move_to", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "c4" }], "target": "b5", "correctMoves": ["c4b5"] },
                { "id": "K10", "type": "avoid_danger", "piece": "K", "side": "white", "pieces": [{ "p": "K", "c": "e2" }, { "p": "r", "c": "e8" }], "rule": "escape_check", "prompt": "You are in check! Escape now.", "correctMoves": ["e2d1", "e2f1", "e2d2", "e2f2"] }
            ]
        }
    ]
};

// --- DESIGN SYSTEM CONSTANTS (matches Kids NEW GAME v2.47) ---
const THEME = {
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#ffd93d',
    accentGradient: 'linear-gradient(90deg, #ffd93d, #ff9f43)',
    textMain: 'white',
    textMuted: '#94A3B8',
    labelColor: '#64748b',
    panelBg: 'rgba(0,0,0,0.3)',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.1)',
    headerBorder: 'rgba(255,217,61,0.2)',
};

const BOTS = {
    baby: { name: "Baby", emoji: "👶", color: "#4ecdc4" },
    happy: { name: "Happy", emoji: "😊", color: "#ffd93d" },
    thinker: { name: "Thinker", emoji: "🤔", color: "#ff9f43" },
    robot: { name: "Robot", emoji: "🤖", color: "#ef4444" },
    king: { name: "King", emoji: "👑", color: "#f59e0b" },
};

// --- LOGIC HELPERS ---

const getSquareIndex = (coord) => {
    if (!coord) return -1;
    const fileMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
    const file = fileMap[coord[0]];
    const rank = parseInt(coord[1]);
    return (8 - rank) * 8 + file;
};

const getSquareCoord = (index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const rank = 8 - row;
    const file = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][col];
    return `${file}${rank}`;
};

// --- COMPONENTS ---

const PrimaryButton = ({ children, onClick, className = '', size = 'md' }) => (
    <button
        onClick={onClick}
        style={{
            background: THEME.accentGradient,
            color: '#1a1a2e',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 30px rgba(255,217,61,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'transform 0.2s, box-shadow 0.2s',
            padding: size === 'lg' ? '18px 40px' : '12px 24px',
            fontSize: size === 'lg' ? 16 : 14,
        }}
        className={className}
        onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; e.target.style.boxShadow = '0 6px 40px rgba(255,217,61,0.7)'; }}
        onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 6px 30px rgba(255,217,61,0.5)'; }}
    >
        {children}
    </button>
);

const GlassPanel = ({ children, className = '', active = false, borderColor = '', allowOverflow = false, style = {} }) => (
    <div
        className={className}
        style={{
            background: active
                ? `linear-gradient(135deg, ${borderColor ? borderColor + '33' : 'rgba(255,217,61,0.15)'}, ${borderColor ? borderColor + '1A' : 'rgba(255,159,67,0.1)'})`
                : THEME.cardBg,
            border: `2px solid ${active ? (borderColor ? borderColor + '66' : 'rgba(255,217,61,0.3)') : THEME.cardBorder}`,
            borderRadius: 16,
            position: 'relative',
            overflow: allowOverflow ? 'visible' : 'hidden',
            transition: 'all 0.2s',
            boxShadow: active ? `0 0 15px ${borderColor || THEME.accent}30` : 'none',
            ...style,
        }}
    >
        {children}
    </div>
);

// --- PARENT INFO POPUP ---
const ParentInfoModal = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#131522]/90 backdrop-blur-sm p-4 animate-fadeIn">
        <GlassPanel allowOverflow={true} className="max-w-md w-full p-8 relative border-yellow-400 bg-[#1e2130]">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>

            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/50">
                    <Shield size={32} className="text-yellow-400" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wide">Parent Information</h2>
            </div>

            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                    <strong className="text-white">Welcome to Kids Mode!</strong> This environment is specifically designed to teach chess mechanics through gamification rather than competitive pressure.
                </p>

                <div className="bg-[#131522] p-4 rounded-xl border border-[#2d3248] space-y-2">
                    <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span><strong>No ELO Rating:</strong> We focus on XP and levels to encourage progress without fear of losing points.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Safe Environment:</strong> No chat functionality and restricted interaction to ensure safety.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Skill Building:</strong> Missions focus on one concept at a time (movement, capture, defense).</span>
                    </div>
                </div>

                <p className="text-xs text-slate-500 text-center pt-2">
                    Designed by White Knight Chess Academy
                </p>
            </div>
        </GlassPanel>
    </div>
);

// --- AI ASSISTANT COMPONENT ---
const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const chatRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatRef.current && !chatRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [chatRef]);

    return (
        <div className="w-full relative" ref={chatRef}>
            {/* EXPANDED CHAT AREA */}
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-3 bg-[#1e2130] border border-[#2d3248] rounded-2xl shadow-2xl p-4 animate-fadeIn z-50 h-[550px] flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b border-[#2d3248] pb-3 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">
                                <Zap size={14} className="text-white" fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-white font-bold text-sm">White Knight AI</div>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-green-500 font-bold uppercase">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Chat Content */}
                    <div className="space-y-3 mb-4 overflow-y-auto custom-scrollbar flex-1">
                        <div className="bg-[#2d1f4e] p-3 rounded-2xl rounded-tl-none border border-[#a855f7]/30 text-xs text-slate-200 leading-relaxed">
                            Hi! Ready for your game? 🎉
                        </div>
                        <div className="bg-[#2d1f4e] p-3 rounded-2xl rounded-tl-none border border-[#a855f7]/30 text-xs text-slate-200 leading-relaxed">
                            Need a quick puzzle to warm up before we start the mission? 🧩
                        </div>
                        <div className="bg-[#2d1f4e] p-3 rounded-2xl rounded-tl-none border border-[#a855f7]/30 text-xs text-slate-200 leading-relaxed">
                            Remember, I'm here to help you learn! Just ask if you get stuck on a move.
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="relative shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className="w-full bg-[#131522] border border-[#2d3248] rounded-xl pl-4 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#a855f7] transition-colors"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ffc629] p-1.5 rounded-lg text-black hover:bg-[#ffd65c] transition-colors">
                            <Send size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-gradient-to-r from-[#2d1f4e] to-[#1e1e2e] border border-[#a855f7]/30 p-3 rounded-xl flex items-center gap-3 group hover:border-[#a855f7]/60 transition-all shadow-lg ${isOpen ? 'ring-2 ring-[#a855f7]' : ''}`}
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Zap size={20} className="text-white" fill="currentColor" />
                </div>
                <div className="text-left">
                    <div className="text-white font-bold text-sm group-hover:text-pink-200 transition-colors">AI Assistant</div>
                    <div className="text-[#a855f7] text-[10px] font-bold">Need help? Ask me! 🦄</div>
                </div>
            </button>
        </div>
    );
};

// --- MAIN APP ---

export default function KidsChessQuest({ onBack }) {
    const [view, setView] = useState('hub'); // hub, mission, result
    const [currentWorldIndex, setCurrentWorldIndex] = useState(0);
    const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
    const [missionState, setMissionState] = useState({ selected: [], status: 'playing', message: null }); // playing, success, failure
    const [showParentInfo, setShowParentInfo] = useState(false);
    const [user, setUser] = useState({ name: 'HERO USER', xp: 1250, streak: 5 });
    const [rewardFlying, setRewardFlying] = useState(false);
    const [hintSquares, setHintSquares] = useState({});

    const currentWorld = GAME_DATA.worlds[currentWorldIndex];
    const currentMission = currentWorld.missions[currentMissionIndex];

    const [fen, setFen] = useState('start');
    const [phantomKings, setPhantomKings] = useState([]);

    // Display FEN = full FEN minus phantom kings (so students don't see extra kings)
    const displayFen = useMemo(() => removeSquaresFromFen(fen, phantomKings), [fen, phantomKings]);

    // Initialize FEN when mission changes
    useEffect(() => {
        if (view === 'mission' && currentMission) {
            const result = generateFenFromMission(currentMission.pieces, currentMission.side);
            setFen(result.fen);
            setPhantomKings(result.phantomKings);
            setHintSquares({});
            // Clear selection
            setMissionState({ selected: [], status: 'playing', message: null });
        }
    }, [view, currentMission]);

    const handlePieceDrop = (source, target) => {
        if (missionState.status !== 'playing') return false;

        const moveString = `${source}${target}`;
        const isCorrect = currentMission?.correctMoves?.includes(moveString);

        if (isCorrect) {
            // Update position using chess.js
            try {
                const chess = new Chess(fen);
                const move = chess.move({ from: source, to: target, promotion: 'q' });
                if (move) {
                    setFen(chess.fen());
                }
            } catch (e) {
                // If chess.js can't handle it, just update FEN manually
                console.warn('[ChessQuest] chess.js move failed, proceeding anyway:', e);
            }
            handleSuccess();
            return true;
        } else {
            triggerShake();
            return false;
        }
    };

    // --- RESPONSIVE STATE (matches Kids NEW GAME v2.47) ---
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [showRightPanel, setShowRightPanel] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isTablet = windowWidth >= 768 && windowWidth < 1200;
    const isMobile = windowWidth < 768;

    // --- CHAT STATE (matches Kids NEW GAME v2.47) ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: "Hi! Ready for your quest? 🏰 Need a hint?" }
    ]);
    const msgsEndRef = useRef(null);

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setMessages([...messages, { id: Date.now(), sender: 'user', text: chatInput }]);
        setChatInput("");
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: "That's a brave move! Keep going! 🛡️" }]);
        }, 1000);
    };

    useEffect(() => {
        if (isChatOpen) msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatOpen]);



    // Animation trigger for rewards
    useEffect(() => {
        if (view === 'result') {
            const timer = setTimeout(() => {
                setRewardFlying(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setRewardFlying(false);
        }
    }, [view]);

    // getValidMoves — needed by ChessBoard for click-to-move hints
    const getValidMoves = useCallback((square) => {
        if (!fen || fen === 'start' || missionState.status !== 'playing') return [];
        try {
            const chess = new Chess(fen);
            return chess.moves({ square, verbose: true });
        } catch (e) {
            return [];
        }
    }, [fen, missionState.status]);

    // Click handler for select_squares missions (tap squares directly)
    const questSquareClick = useCallback((arg) => {
        if (missionState.status !== 'playing') return;
        if (!currentMission) return;

        // ChessBoard passes either string or { square, piece }
        const square = typeof arg === 'string' ? arg : arg?.square;
        if (!square) return;

        if (currentMission.type === 'select_squares') {
            const isCorrect = currentMission.selectCorrect?.includes(square);

            if (isCorrect && !missionState.selected.includes(square)) {
                const newSelected = [...missionState.selected, square];
                setMissionState(prev => ({ ...prev, selected: newSelected }));

                if (newSelected.length === currentMission.selectCorrect.length) {
                    handleSuccess();
                }
            } else if (!isCorrect) {
                triggerShake();
            }
        }
        // For move/capture missions, ChessBoard's internal click handler
        // (via getValidMoves + onMove) handles two-click moves automatically
    }, [missionState, currentMission]);

    const handleYesNo = (answer) => {
        if (answer === currentMission.answer) {
            handleSuccess();
        } else {
            triggerShake();
            setMissionState(prev => ({ ...prev, message: "Incorrect! Try again." }));
            setTimeout(() => setMissionState(prev => ({ ...prev, message: null })), 1500);
        }
    };

    const handleSuccess = () => {
        setMissionState(prev => ({ ...prev, status: 'success' }));
        setTimeout(() => setView('result'), 1000);
    };

    const triggerShake = () => {
        const el = document.getElementById('game-container');
        if (el) {
            el.classList.add('animate-shake');
            setTimeout(() => el.classList.remove('animate-shake'), 400);
        }
    };

    // --- HEADER COMPONENT (matches original layout + Kids styling) ---
    const TopBar = () => (
        <header style={{ height: 64, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `2px solid ${THEME.headerBorder}`, position: 'relative', zIndex: 100, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: THEME.accentGradient, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a2e', fontWeight: 800, fontSize: 14, padding: 0 }} title="Back to Main Menu">♞</button>
                </div>
                <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'white' }}>CHESS QUEST</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Online Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                    <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Online</span>
                </div>

                {/* Notification Bell */}
                <button style={{ position: 'relative', background: 'none', border: 'none', color: THEME.textMuted, cursor: 'pointer', padding: 4 }}>
                    <Bell size={20} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid #1a1a2e' }} />
                </button>

                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                        <div style={{ color: THEME.labelColor, fontSize: 10, textTransform: 'uppercase' }}>LEVEL 12</div>
                    </div>
                    <div style={{ width: 36, height: 36, background: THEME.accentGradient, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a2e', fontWeight: 800, fontSize: 12 }}>WK</div>
                </div>

                {/* Exit */}
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: THEME.textMuted, cursor: 'pointer', padding: 4 }} title="Exit">
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );

    // --- VIEWS ---

    const HubView = () => (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>

            {/* ═══════════════════ LEFT PANEL (480px) ═══════════════════ */}
            {!isMobile && (
                <aside style={{
                    width: isTablet ? '50%' : '480px',
                    flexShrink: 0,
                    height: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    borderRight: `2px solid ${THEME.headerBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: 11, color: THEME.labelColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>RECENT AWARDS</div>

                        <GlassPanel style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }} borderColor="#a855f7" active={true}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(168,85,247,0.4)' }}>
                                <Target size={20} style={{ color: '#a855f7' }} />
                            </div>
                            <div>
                                <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Tactical Master</div>
                                <div style={{ color: THEME.textMuted, fontSize: 11 }}>Completed 10 puzzles</div>
                            </div>
                        </GlassPanel>

                        <GlassPanel style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }} borderColor="#4ecdc4" active={true}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(78,205,196,0.3), rgba(78,205,196,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(78,205,196,0.4)' }}>
                                <Zap size={20} style={{ color: '#4ecdc4' }} />
                            </div>
                            <div>
                                <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Speed Demon</div>
                                <div style={{ color: THEME.textMuted, fontSize: 11 }}>Under 30 seconds</div>
                            </div>
                        </GlassPanel>

                        <GlassPanel style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.5 }} borderColor="#ff9f43">
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(255,159,67,0.3), rgba(255,159,67,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,159,67,0.4)' }}>
                                <Flame size={20} style={{ color: '#ff9f43' }} />
                            </div>
                            <div>
                                <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>On Fire</div>
                                <div style={{ color: THEME.textMuted, fontSize: 11 }}>5 Day Streak</div>
                            </div>
                        </GlassPanel>
                    </div>

                    {/* AI Chat Widget - Pinned to Bottom */}
                    <div style={{ padding: '16px', borderTop: `1px solid ${THEME.headerBorder}`, background: 'rgba(0,0,0,0.2)' }}>
                        <div
                            onClick={() => setIsChatOpen(true)}
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(168,85,247,0.2))',
                                borderRadius: '14px', padding: '14px',
                                border: '2px solid rgba(255,107,157,0.3)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #ff6b9d, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Zap size={18} fill="currentColor" color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: '700', fontSize: '12px', color: 'white', display: 'block' }}>AI Assistant</span>
                                <span style={{ color: THEME.textMuted, fontSize: 10 }}>Need help? Ask me! 🎉</span>
                            </div>
                            <ChevronRight size={18} color="#a855f7" />
                        </div>
                    </div>

                    {/* Chat Drawer Overlay */}
                    {isChatOpen && (
                        <div style={{ position: 'absolute', inset: 0, background: '#1a1a2e', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
                            <div style={{ padding: '16px', borderBottom: `1px solid ${THEME.headerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #ff6b9d, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Zap size={18} fill="currentColor" color="white" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'white' }}>White Knight AI</div>
                                        <div style={{ color: '#22c55e', fontSize: '10px' }}>● Online</div>
                                    </div>
                                </div>
                                <button onClick={(e) => { e.preventDefault(); setIsChatOpen(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={22} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {messages.map(msg => (
                                    <div key={msg.id} style={{
                                        alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                                        background: msg.sender === 'bot' ? 'rgba(168,85,247,0.2)' : 'rgba(255,217,61,0.2)',
                                        border: msg.sender === 'bot' ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,217,61,0.3)',
                                        borderRadius: '12px', padding: '10px 14px', maxWidth: '80%',
                                        fontSize: '13px', color: 'white'
                                    }}>
                                        {msg.text}
                                    </div>
                                ))}
                                <div ref={msgsEndRef} />
                            </div>

                            <div style={{ padding: '12px', borderTop: `1px solid ${THEME.headerBorder}`, display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Type..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px' }}
                                />
                                <button onClick={handleSendMessage} style={{ background: THEME.accent, border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#1a1a2e' }}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            )}

            {/* ═══════════════════ CENTER PANEL ═══════════════════ */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '24px 16px 100px' : '24px 32px',
                overflow: 'hidden',
                position: 'relative',
                height: '100%'
            }}>
                <div style={{ width: 140, height: 140, background: THEME.accentGradient, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(255,217,61,0.4)', marginBottom: 8 }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: '#1a1a2e' }}>WK</div>
                </div>

                <div style={{ background: '#ffd93d', padding: '4px 16px', borderRadius: 20, color: '#1a1a2e', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>PRO MEMBER</div>

                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{user.name}</h2>

                <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                    <div style={{ background: 'rgba(78,205,196,0.2)', border: '1px solid rgba(78,205,196,0.4)', borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#4ecdc4', fontWeight: 800, fontSize: 14 }}>{user.xp} XP</span>
                    </div>
                    <div style={{ background: 'rgba(255,159,67,0.2)', border: '1px solid rgba(255,159,67,0.4)', borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Flame size={14} style={{ color: '#ff9f43' }} fill="#ff9f43" />
                        <span style={{ color: '#ff9f43', fontWeight: 800, fontSize: 14 }}>{user.streak}</span>
                    </div>
                </div>

                <div style={{ textAlign: 'center', animation: 'float 3s ease-in-out infinite' }}>
                    <div style={{ color: THEME.labelColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>KIDS TEST QUEST</div>
                    <h1 style={{ fontSize: 42, fontWeight: 900, color: 'white', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>READY TO PLAY?</h1>
                    <p style={{ color: THEME.textMuted, fontSize: 14, margin: 0 }}>{currentWorld.title}: Mission {currentMissionIndex + 1}</p>
                    <p style={{ color: THEME.labelColor, fontSize: 13, margin: '4px 0 0 0', fontStyle: 'italic' }}>"{currentMission?.description || 'Move the piece!'}"</p>
                </div>

                <div style={{ marginTop: 28 }}>
                    <PrimaryButton size="lg" onClick={() => { setMissionState({ selected: [], status: 'playing', message: null }); setView('mission'); }}>
                        <Play size={20} fill="currentColor" /> START TEST
                    </PrimaryButton>
                </div>
            </main>

            {/* ═══════════════════ OPTIONS TOGGLE (Tablet) ═══════════════════ */}
            {isTablet && !showRightPanel && (
                <div onClick={() => setShowRightPanel(true)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'linear-gradient(135deg, rgba(255,217,61,0.2), rgba(255,159,67,0.2))', border: '2px solid rgba(255,217,61,0.3)', borderRight: 'none', borderRadius: '16px 0 0 16px', padding: '16px 12px', cursor: 'pointer', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '-4px 0 12px rgba(0,0,0,0.2)' }}>
                    <SettingsIcon size={20} style={{ color: '#ffd93d' }} />
                    <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '11px', fontWeight: '700', color: '#ffd93d' }}>OPTIONS</span>
                </div>
            )}

            {/* ═══════════════════ RIGHT PANEL (500px) ═══════════════════ */}
            {!isMobile && (
                <aside style={{
                    width: isTablet ? '50%' : '500px',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderLeft: `2px solid ${THEME.headerBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
                    zIndex: 60,
                    position: isTablet ? 'absolute' : 'relative',
                    right: 0,
                    top: 0,
                    height: '100%',
                    transform: isTablet && !showRightPanel ? 'translateX(100%)' : 'translateX(0)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>

                        {isTablet && showRightPanel && (
                            <button onClick={() => setShowRightPanel(false)} style={{ position: 'absolute', top: '16px', right: '16px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', zIndex: 20 }}>
                                <X size={22} />
                            </button>
                        )}

                        <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2))', borderRadius: 16, padding: 16, border: '2px solid rgba(168,85,247,0.3)', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #a855f7, #6366f1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤔</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>I DON'T KNOW HOW TO PLAY</div>
                                    <div style={{ color: THEME.textMuted, fontSize: 11 }}>Learn the rules in our Academy</div>
                                </div>
                                <ChevronRight style={{ color: THEME.textMuted }} />
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: THEME.labelColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>SELECT WORLD</div>
                            {/* VERTICAL LIST STYLE for Worlds */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {GAME_DATA.worlds.slice(0, 5).map((world, idx) => (
                                    <GlassPanel key={world.id} active={idx === currentWorldIndex} borderColor={world.color} className="cursor-pointer" onClick={() => setCurrentWorldIndex(idx)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, opacity: idx > 1 ? 0.5 : 1 }}>
                                        <div style={{ fontSize: 24, width: 32, display: 'flex', justifyContent: 'center' }}>{world.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: idx === currentWorldIndex ? world.color : 'white' }}>{world.title}</div>
                                        </div>
                                        {idx > 1 && <Lock size={16} style={{ color: THEME.textMuted }} />}
                                    </GlassPanel>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* PARENT INFO - Pinned to Bottom */}
                    <div style={{ padding: '20px', borderTop: `1px solid ${THEME.headerBorder}`, background: 'rgba(0,0,0,0.2)' }}>
                        <button style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${THEME.cardBorder}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: THEME.labelColor, fontSize: 11, fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowParentInfo(true)}>
                            <Shield size={14} /> FOR PARENTS
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );

    const MissionView = () => (
        <div id="game-container" style={{
            height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: isMobile ? '8px' : '16px',
            position: 'relative', zIndex: 10, overflow: 'hidden'
        }}>

            {/* HEADER for Mission */}
            <div style={{
                width: '100%', maxWidth: '900px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '8px', flexShrink: 0
            }}>
                <button onClick={() => setView('hub')} style={{
                    background: 'rgba(30,33,48,0.8)', color: 'white',
                    padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                    fontSize: '13px', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    border: '1px solid #2d3248', cursor: 'pointer'
                }}>
                    <X size={16} /> Quit
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!isMobile && (
                        <span style={{ color: '#facc15', fontWeight: 900, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {currentWorld.title}
                        </span>
                    )}
                    <span style={{
                        background: '#2a2e42', color: 'white', padding: '4px 10px',
                        borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        border: '1px solid #2d3248'
                    }}>Lvl {currentMissionIndex + 1}</span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <Heart size={20} style={{ color: '#ef4444', fill: '#ef4444' }} />
                    <Heart size={20} style={{ color: '#ef4444', fill: '#ef4444' }} />
                    <Heart size={20} style={{ color: 'rgba(239,68,68,0.3)' }} />
                </div>
            </div>

            {/* MISSION BANNER — centered above the board */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '12px', padding: '0 16px', width: '100%', maxWidth: '600px',
                margin: '0 auto'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(30,33,48,0.9)', backdropFilter: 'blur(10px)',
                    borderRadius: '14px', padding: '8px 16px',
                    border: '1px solid rgba(250,204,21,0.2)',
                    flex: 1, minWidth: 0
                }}>
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{BOTS.happy.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            color: '#facc15', fontWeight: 900, fontSize: '9px',
                            textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px'
                        }}>Mission</div>
                        <p style={{
                            color: 'white', fontWeight: 700,
                            fontSize: isMobile ? '12px' : '14px',
                            lineHeight: 1.3, margin: 0,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                            {currentMission?.question || currentMission?.prompt ||
                                (currentMission?.type === 'move_to' ? "Move the piece to the target!" :
                                    currentMission?.type === 'capture' ? "Capture the enemy piece!" :
                                        currentMission?.type === 'select_squares' ? "Tap all valid squares!" : "Solve the puzzle!")}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (!currentMission) return;
                        const styles = {};
                        const hintColor = 'radial-gradient(circle, rgba(250,204,21,0.6) 60%, transparent 60%)';
                        const hintBorder = '3px solid rgba(250,204,21,0.8)';
                        if (currentMission.type === 'move_to' && currentMission.target) {
                            styles[currentMission.target] = { background: hintColor, border: hintBorder, borderRadius: '50%' };
                        } else if (currentMission.type === 'capture' && currentMission.targetCapture) {
                            styles[currentMission.targetCapture] = { background: hintColor, border: hintBorder, borderRadius: '50%' };
                        } else if (currentMission.type === 'select_squares' && currentMission.selectCorrect) {
                            const remaining = currentMission.selectCorrect.filter(sq => !missionState.selected.includes(sq));
                            if (remaining.length > 0) {
                                styles[remaining[0]] = { background: hintColor, border: hintBorder, borderRadius: '50%' };
                            }
                        }
                        setHintSquares(styles);
                        setTimeout(() => setHintSquares({}), 2500);
                    }}
                    style={{
                        background: 'rgba(30,33,48,0.9)', backdropFilter: 'blur(10px)',
                        padding: '10px 14px',
                        borderRadius: '12px', color: '#94a3b8', fontWeight: 800,
                        textTransform: 'uppercase', fontSize: '10px',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        border: '1px solid #2d3248', cursor: 'pointer',
                        flexShrink: 0, transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <HelpCircle size={14} /> Hint
                </button>
            </div>

            {missionState.message && <div style={{ textAlign: 'center', color: '#f87171', fontWeight: 700, fontSize: '13px', animation: 'pulse 1s infinite' }}>{missionState.message}</div>}

            {/* BOARD — centered, main element */}
            <div style={{
                flex: 1, width: '100%', maxWidth: '600px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                minHeight: 0,
                margin: '0 auto'
            }}>
                <div style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: isMobile ? 'calc(100vh - 260px)' : '100%',
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    border: '3px solid rgba(255,217,61,0.2)',
                    alignSelf: 'center'
                }}>
                    <ChessBoard
                        position={displayFen}
                        onMove={handlePieceDrop}
                        onSquareClick={currentMission?.type === 'select_squares' ? questSquareClick : null}
                        getValidMoves={getValidMoves}
                        showMoveHints={currentMissionIndex < 5}
                        highlightSquares={Object.keys(hintSquares)}
                        orientation={currentMission?.side === 'black' ? 'black' : 'white'}
                        allowAllColors={true}
                        draggable={missionState.status === 'playing'}
                        customBoardStyle={{ borderRadius: '8px' }}
                        lightSquareStyle={{ backgroundColor: '#ebecd0' }}
                        darkSquareStyle={{ backgroundColor: '#739552' }}
                    />

                    {/* YES/NO OVERLAY */}
                    {currentMission?.type === 'yes_no' && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 20
                        }}>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <button onClick={() => handleYesNo(true)} style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: '#22c55e', color: 'white', fontWeight: 900,
                                    fontSize: '18px', border: '4px solid white',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>YES</button>
                                <button onClick={() => handleYesNo(false)} style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: '#ef4444', color: 'white', fontWeight: 900,
                                    fontSize: '18px', border: '4px solid white',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>NO</button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );

    const ResultView = () => (
        <div className="h-full flex items-center justify-center p-4 relative z-10">
            <div className="relative w-full max-w-sm text-center">
                <div className="absolute inset-0 bg-yellow-400/20 blur-[100px] rounded-full"></div>

                <GlassPanel allowOverflow={true} className="p-8 pb-10 border-2 border-yellow-400 bg-[#1a1a2e]/95 relative z-10 animate-fadeIn shadow-[0_0_50px_rgba(255,198,41,0.2)] mt-12">
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-9xl filter drop-shadow-2xl animate-bounce z-20">
                        🤩
                    </div>

                    <div className="mt-16 mb-8">
                        <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 tracking-tighter mb-2">GREAT!</h2>
                        <p className="text-[#94A3B8] font-bold uppercase tracking-widest text-xs">Mission Complete</p>
                    </div>

                    <div className="bg-[#131522] p-4 rounded-xl border border-yellow-400/30 flex items-center gap-4 text-left mb-8 shadow-inner relative">
                        <div
                            className={`w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-4xl shadow-lg border border-white/10 transform rotate-3 z-30
                   ${rewardFlying ? 'animate-fly-to-profile' : ''}`}
                        >
                            ⚔️
                        </div>
                        <div>
                            <div className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">New Sticker</div>
                            <div className="text-white font-black text-xl">First Blood</div>
                            <div className="text-slate-500 text-[10px] font-bold">+40 XP</div>
                        </div>
                    </div>

                    <PrimaryButton size="lg" className="w-full mb-4" onClick={() => {
                        if (currentMissionIndex < currentWorld.missions.length - 1) {
                            setCurrentMissionIndex(prev => prev + 1);
                            setMissionState({ selected: [], status: 'playing', message: null });
                            setView('mission');
                        } else {
                            setView('hub');
                        }
                    }}>
                        NEXT MISSION
                    </PrimaryButton>

                    <button onClick={() => setView('hub')} style={{
                        background: 'transparent',
                        border: '2px solid rgba(148,163,184,0.3)',
                        borderRadius: '12px',
                        padding: '10px 24px',
                        color: '#94a3b8',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        fontSize: '12px',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <Map size={14} /> Back to Map
                    </button>
                </GlassPanel>
            </div>
        </div>
    );

    return (
        <div style={{ width: '100%', height: '100%', background: THEME.bgGradient, fontFamily: 'system-ui, sans-serif', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

            {/* Colorful Stars (matching Kids NEW GAME) */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
                backgroundImage: `
                    radial-gradient(2px 2px at 20px 30px, #ffd93d, transparent),
                    radial-gradient(2px 2px at 40px 70px, #4ecdc4, transparent),
                    radial-gradient(2px 2px at 90px 40px, #a855f7, transparent),
                    radial-gradient(2px 2px at 130px 80px, #ffd93d, transparent)
                `,
                backgroundSize: '200px 200px'
            }} />

            {/* TOP HEADER */}
            <TopBar />

            {/* PARENT INFO MODAL */}
            {showParentInfo && <ParentInfoModal onClose={() => setShowParentInfo(false)} />}

            {/* VIEW RENDERER */}
            <div className="flex-1 overflow-hidden z-10 relative">
                {view === 'hub' && <HubView />}
                {view === 'mission' && <MissionView />}
                {view === 'result' && <ResultView />}
            </div>

            <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes fly-to-profile {
           0% { transform: translate(0, 0) scale(1) rotate(3deg); opacity: 1; }
           20% { transform: translate(0, -20px) scale(1.2); }
           90% { opacity: 1; }
           100% { transform: translate(40vw, -80vh) scale(0.2); opacity: 0; } 
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-fadeIn { animation: opacity 0.4s ease-out; }
        .animate-fly-to-profile { animation: fly-to-profile 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; pointer-events: none; z-index: 100; position: relative; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
        </div>
    );
}
