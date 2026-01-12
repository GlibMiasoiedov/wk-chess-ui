import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
    Crown, Zap, ChevronRight, Target, Shield, Sword,
    GraduationCap, Play, Clock, Flame, Rabbit, X,
    LayoutGrid, ChevronDown, Settings, Dna, HelpCircle
} from 'lucide-react';

// --- THEME CONSTANTS ---
const THEME = {
    bg: '#0B0E14',
    panel: '#151922',
    panelBorder: '#2A303C',
    accent: '#D4AF37',
    textMain: '#E2E8F0',
    textMuted: '#94A3B8',
};

// --- DATA: BOTS ---
const BOTS = [
    { id: 0, name: 'Rookie', rating: 400, icon: <Shield size={28} />, desc: "Just learning rules. Makes frequent mistakes." },
    { id: 1, name: 'Beginner', rating: 800, icon: <Shield size={28} />, desc: "Knows basic patterns but leaves pieces hanging." },
    { id: 2, name: 'Casual', rating: 1200, icon: <Sword size={28} />, desc: "Solid fundamentals. Can spot simple tactics." },
    { id: 3, name: 'Intermediate', rating: 1600, icon: <Sword size={28} />, desc: "Strong tactical awareness and opening knowledge." },
    { id: 4, name: 'Advanced', rating: 2000, icon: <Target size={28} />, desc: "Excellent positional understanding. Rarely blunders." },
    { id: 5, name: 'Master', rating: 2400, icon: <Crown size={28} />, desc: "Expert calculation skills. Very hard to beat." },
    { id: 6, name: 'Grandmaster', rating: 2800, icon: <Crown size={28} />, desc: "Superhuman performance. Good luck." },
    { id: 7, name: 'Engine', rating: 3200, icon: <Zap size={28} />, desc: "Perfect play. Maximum punishment for errors." },
];

// --- DATA: TIME CONTROLS ---
const TIME_CATEGORIES = {
    bullet: [
        { label: '1 min', val: '1+0' },
        { label: '1 | 1', val: '1+1' },
        { label: '2 | 1', val: '2+1' }
    ],
    blitz: [
        { label: '3 min', val: '3+0' },
        { label: '3 | 2', val: '3+2' }, // Default
        { label: '5 min', val: '5+0' }
    ],
    rapid: [
        { label: '10 min', val: '10+0' },
        { label: '15 | 10', val: '15+10' },
        { label: '30 min', val: '30+0' }
    ]
};

// Flattened list for cycling logic
const ALL_TIME_OPTS = [
    ...TIME_CATEGORIES.bullet,
    ...TIME_CATEGORIES.blitz,
    ...TIME_CATEGORIES.rapid
];

export default function WhiteKnightNewGame({ onStartGame, onOpenLearning, isMobile }) {

    const [selectedBotIndex, setSelectedBotIndex] = useState(2); // Default Casual
    const [selectedTime, setSelectedTime] = useState('3+2'); // Default 3|2
    const [customTimeState, setCustomTimeState] = useState({ min: 10, inc: 0 }); // Custom values
    const [isTimeExpanded, setIsTimeExpanded] = useState(false);
    const [selectedColor, setSelectedColor] = useState('random');
    const [gameMode, setGameMode] = useState('standard'); // 'standard' | '960'

    // Hover states for JS-based hover effects
    const [hoveredStart, setHoveredStart] = useState(false);
    const [hoveredLearn, setHoveredLearn] = useState(false);
    const [hoveredClose, setHoveredClose] = useState(false);
    const [hoveredBot, setHoveredBot] = useState(false);
    const [hoveredUnknown, setHoveredUnknown] = useState(false);
    const [hoveredInteractive, setHoveredInteractive] = useState({}); // { id: boolean }

    const activeBot = BOTS[selectedBotIndex];

    // Refs for scrolling to sections if needed
    const timeSectionRef = useRef(null);

    // --- HANDLERS ---

    const handleStartGame = () => {
        const finalTime = selectedTime === 'custom'
            ? `${customTimeState.min}+${customTimeState.inc}`
            : selectedTime;

        // Ensure color is correct
        const finalColor = selectedColor || 'w';

        // Construct config object
        const gameConfig = {
            bot: activeBot,
            rating: activeBot.rating,
            timeControl: finalTime,
            color: finalColor,
            variant: gameMode
        };

        console.log("🚀 [NewGame] START PRESSED", JSON.stringify(gameConfig, null, 2));

        if (onStartGame) {
            try {
                onStartGame(gameConfig);
                console.log("✅ [NewGame] onStartGame executed successfully");
            } catch (err) {
                console.error("❌ [NewGame] Error in onStartGame:", err);
            }
        } else {
            console.error("❌ [NewGame] onStartGame prop is MISSING!");
        }
    };

    // Helper to find label for selected time
    const getSelectedTimeLabel = () => {
        if (selectedTime === 'custom') {
            return `${customTimeState.min} | ${customTimeState.inc}`;
        }
        const found = ALL_TIME_OPTS.find(t => t.val === selectedTime);
        return found ? found.label : selectedTime;
    };

    // --- INTERACTIVE SUMMARY HANDLERS ---
    const cycleDifficulty = () => {
        console.log('[NewGame] Cycling difficulty');
        setSelectedBotIndex((prev) => (prev + 1) % BOTS.length);
    };

    const cycleSide = () => {
        const sides = ['w', 'random', 'b']; // Unified format
        const current = selectedColor; // Use local state
        const currentIndex = sides.indexOf(current);
        const next = sides[(currentIndex + 1) % sides.length];

        console.log('[NewGame] Cycling side:', { current, next });
        setSelectedColor(next);
    };

    const toggleMode = () => setGameMode(prev => prev === 'standard' ? '960' : 'standard');

    const cycleTime = () => {
        const currentIndex = ALL_TIME_OPTS.findIndex(t => t.val === selectedTime);
        if (currentIndex === -1) {
            setSelectedTime(ALL_TIME_OPTS[0].val);
        } else {
            const nextIndex = (currentIndex + 1) % ALL_TIME_OPTS.length;
            setSelectedTime(ALL_TIME_OPTS[nextIndex].val);
        }
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
            height: '64px',
            borderBottom: `1px solid ${THEME.panelBorder}`,
            backgroundColor: '#0B0E14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 24px',
            flexShrink: 0,
            zIndex: 50
        },
        headerIconBox: {
            backgroundColor: 'rgba(212,175,55,0.1)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(212,175,55,0.2)',
            boxShadow: '0 0 10px rgba(212,175,55,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        headerTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '0.15em',
            textTransform: 'uppercase'
        },
        learnButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: hoveredLearn ? THEME.accent : '#94A3B8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s'
        },
        closeButton: {
            padding: '8px',
            color: hoveredClose ? 'white' : '#64748B',
            background: hoveredClose ? '#1A1E26' : 'transparent',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        leftPanel: {
            flex: 1,
            backgroundColor: '#080A0F',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isMobile ? '32px 16px 120px 16px' : '48px 32px',
            position: 'relative',
            overflow: 'hidden',
            overflowY: isMobile ? 'auto' : 'hidden'
        },
        rightPanel: {
            width: '500px',
            backgroundColor: THEME.panel,
            borderLeft: `1px solid ${THEME.panelBorder}`,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
            zIndex: 20,
            height: '100%'
        },
        botAvatarLarge: {
            width: isMobile ? '160px' : '192px',
            height: isMobile ? '160px' : '192px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1A1E26, #0B0E14)',
            border: `1px solid ${THEME.panelBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(0,0,0,0.5)',
            position: 'relative',
            marginBottom: '32px',
            transition: 'transform 0.5s',
            transform: hoveredBot ? 'scale(1.05)' : 'scale(1)',
            cursor: 'pointer'
        },
        summaryGrid: {
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginTop: 'auto'
        },
        summaryCard: (id) => ({
            backgroundColor: '#151922',
            border: hoveredInteractive[id] ? `1px solid ${THEME.accent}` : `1px solid ${THEME.panelBorder}`,
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }),
        startGameBtn: {
            width: '100%',
            backgroundColor: THEME.accent,
            color: '#0f172a',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(212,175,55,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '16px',
            transition: 'transform 0.2s',
            transform: hoveredStart ? 'scale(1.02)' : 'scale(1)'
        },
        label: {
            color: '#64748B',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 'bold',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }
    };

    return (
        <div style={styles.container}>

            {/* HEADER */}
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={styles.headerIconBox}>
                        <Crown size={20} color={THEME.accent} />
                    </div>
                    <div>
                        <div style={styles.headerTitle}>CHESS ACADEMY</div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>Powered by Stockfish 16</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button
                        style={styles.learnButton}
                        onMouseEnter={() => setHoveredLearn(true)}
                        onMouseLeave={() => setHoveredLearn(false)}
                        onClick={onOpenLearning}
                    >
                        <GraduationCap size={18} />
                        {!isMobile && "LEARN BASICS"}
                    </button>
                    <button
                        style={styles.closeButton}
                        onMouseEnter={() => setHoveredClose(true)}
                        onMouseLeave={() => setHoveredClose(false)}
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT PANEL: AVATAR & VISUALS */}
                <div style={styles.leftPanel}>
                    <div
                        style={styles.botAvatarLarge}
                        onMouseEnter={() => setHoveredBot(true)}
                        onMouseLeave={() => setHoveredBot(false)}
                        onClick={cycleDifficulty}
                    >
                        <div style={{ color: THEME.accent }}>
                            {activeBot.icon}
                        </div>
                        {/* Status Ring */}
                        <div style={{
                            position: 'absolute', inset: '-4px', borderRadius: '50%',
                            border: `2px solid ${THEME.accent}`, opacity: 0.3,
                            animation: 'pulse 3s infinite'
                        }} />
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '32px', width: '100%', maxWidth: '320px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                            WHITE KNIGHT <span style={{ color: THEME.accent }}>{activeBot.name.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.5 }}>
                            {activeBot.desc}
                        </div>
                    </div>

                    {/* Interactive Summary Grid (Visible on Mobile/Desktop) */}
                    <div style={styles.summaryGrid}>
                        {/* Difficulty Tile */}
                        <div
                            style={styles.summaryCard('diff')}
                            onMouseEnter={() => setHoveredInteractive(p => ({ ...p, diff: true }))}
                            onMouseLeave={() => setHoveredInteractive(p => ({ ...p, diff: false }))}
                            onClick={cycleDifficulty}
                        >
                            <span style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Difficulty</span>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{activeBot.name}</span>
                        </div>

                        {/* Side Tile */}
                        <div
                            style={styles.summaryCard('side')}
                            onMouseEnter={() => setHoveredInteractive(p => ({ ...p, side: true }))}
                            onMouseLeave={() => setHoveredInteractive(p => ({ ...p, side: false }))}
                            onClick={cycleSide}
                        >
                            <span style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Playing As</span>
                            <span style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {selectedColor === 'w' && <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'white' }} />}
                                {selectedColor === 'b' && <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#333' }} />}
                                {selectedColor === 'random' && <Dna size={14} />}
                                {selectedColor === 'random' ? 'Random' : (selectedColor === 'w' ? 'White' : 'Black')}
                            </span>
                        </div>

                        {/* Game Type Tile */}
                        <div
                            style={styles.summaryCard('mode')}
                            onMouseEnter={() => setHoveredInteractive(p => ({ ...p, mode: true }))}
                            onMouseLeave={() => setHoveredInteractive(p => ({ ...p, mode: false }))}
                            onClick={toggleMode}
                        >
                            <span style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Game Type</span>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>
                                {gameMode === '960' ? 'Chess 960' : 'Standard'}
                            </span>
                        </div>

                        {/* Time Tile */}
                        <div
                            style={styles.summaryCard('time')}
                            onMouseEnter={() => setHoveredInteractive(p => ({ ...p, time: true }))}
                            onMouseLeave={() => setHoveredInteractive(p => ({ ...p, time: false }))}
                            onClick={cycleTime}
                        >
                            <span style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Time Control</span>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{getSelectedTimeLabel()}</span>
                        </div>
                    </div>

                    {/* START BUTTON */}
                    <div style={{ width: '100%', maxWidth: '400px', marginTop: 'auto' }}>
                        <button
                            style={styles.startGameBtn}
                            onMouseEnter={() => setHoveredStart(true)}
                            onMouseLeave={() => setHoveredStart(false)}
                            onClick={handleStartGame}
                        >
                            <Play size={20} fill="#0f172a" />
                            START GAME
                        </button>

                        <div style={{
                            marginTop: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            color: '#64748B',
                            fontSize: '11px',
                            cursor: 'pointer',
                            opacity: hoveredUnknown ? 1 : 0.7,
                            transition: 'opacity 0.2s'
                        }}
                            onMouseEnter={() => setHoveredUnknown(true)}
                            onMouseLeave={() => setHoveredUnknown(false)}
                        >
                            <HelpCircle size={12} />
                            <span>I don't know how to play</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: CONFIGURATION (Desktop Only) */}
                {/* Simplified or kept for logic - ensuring no DebugConsole here */}
                {!isMobile && (
                    <div style={styles.rightPanel}>
                        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>

                            {/* Section: Guidance */}
                            <div style={{
                                backgroundColor: '#1A1E26',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '32px',
                                border: `1px solid ${THEME.panelBorder}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <Rabbit size={24} color={THEME.accent} />
                                    <div style={{ fontWeight: 'bold', color: 'white' }}>Quick Start</div>
                                </div>
                                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>
                                    Select your difficulty and time control. For beginners, we recommend <b>Casual</b> difficulty with <b>10 min</b> timer.
                                </p>
                            </div>

                            {/* Section: Difficulty Scroller - Visual only since we use Cycle above for main interaction */}
                            {/* We could duplicate the list here for detailed selection */}

                            {/* Section: Time Control */}
                            <div style={{ marginBottom: '32px' }} ref={timeSectionRef}>
                                <div style={styles.label}>
                                    <Clock size={14} /> Time Control
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {ALL_TIME_OPTS.slice(0, 6).map((opt) => (
                                        <button
                                            key={opt.val}
                                            onClick={() => setSelectedTime(opt.val)}
                                            style={{
                                                padding: '12px 0',
                                                backgroundColor: selectedTime === opt.val ? THEME.accent : '#151922',
                                                color: selectedTime === opt.val ? '#0f172a' : '#94A3B8',
                                                fontWeight: 'bold',
                                                border: `1px solid ${selectedTime === opt.val ? THEME.accent : THEME.panelBorder}`,
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Game Type */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={styles.label}>
                                    <LayoutGrid size={14} /> Game Type
                                </div>
                                <div style={{ display: 'flex', gap: '12px', backgroundColor: '#151922', padding: '4px', borderRadius: '12px', border: `1px solid ${THEME.panelBorder}` }}>
                                    <button
                                        onClick={() => setGameMode('standard')}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                                            backgroundColor: gameMode === 'standard' ? '#1A1E26' : 'transparent',
                                            color: gameMode === 'standard' ? 'white' : '#64748B',
                                            boxShadow: gameMode === 'standard' ? '0 2px 10px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                    >
                                        STANDARD
                                    </button>
                                    <button
                                        onClick={() => setGameMode('960')}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                                            backgroundColor: gameMode === '960' ? '#1A1E26' : 'transparent',
                                            color: gameMode === '960' ? 'white' : '#64748B',
                                            boxShadow: gameMode === '960' ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}
                                    >
                                        CHESS 960 <span style={{ fontSize: '9px', backgroundColor: THEME.accent, color: 'black', padding: '1px 4px', borderRadius: '4px' }}>NEW</span>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '32px', borderTop: `1px solid ${THEME.panelBorder}` }}>
                                <Settings size={14} color="#64748B" />
                                <span style={{ fontSize: '12px', color: '#64748B' }}>
                                    Game settings will be saved for your next session.
                                </span>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.1); opacity: 0.1; }
                    100% { transform: scale(1); opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
