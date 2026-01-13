import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
    Crown, Zap, ChevronRight, Target, Shield, Sword,
    GraduationCap, Play, Clock, Flame, Rabbit, X,
    LayoutGrid, ChevronDown, Settings, Dna, HelpCircle, Lock, User
} from 'lucide-react';
import DebugConsole from './components/DebugConsole.jsx';
import WhiteKnightProfilePanel from './components/WhiteKnightProfilePanel.jsx';

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
    // 👇 TEST BOARD STATE
    const [testGame, setTestGame] = useState(new Chess());

    function onTestDrop(sourceSquare, targetSquare) {
        try {
            const gameCopy = new Chess(testGame.fen());
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (move === null) return false;

            setTestGame(gameCopy);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    const [selectedBotIndex, setSelectedBotIndex] = useState(2); // Default Casual
    const [selectedTime, setSelectedTime] = useState('3+2'); // Default 3|2
    const [customTimeState, setCustomTimeState] = useState({ min: 10, inc: 0 }); // Custom values
    const [isTimeExpanded, setIsTimeExpanded] = useState(false);
    const [selectedColor, setSelectedColor] = useState('random');
    const [gameMode, setGameMode] = useState('standard'); // 'standard' | '960'

    const [showAuthModal, setShowAuthModal] = useState(false);

    // --- RESPONSIVE STATE ---
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [showRightPanel, setShowRightPanel] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isTablet = windowWidth >= 768 && windowWidth < 1200;

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
        // OPTIONS TOGGLE (Tablet Only)
        optionsToggle: {
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: THEME.panel,
            border: `1px solid ${THEME.panelBorder}`,
            borderRight: 'none',
            borderRadius: '12px 0 0 12px',
            padding: '16px 8px',
            cursor: 'pointer',
            zIndex: 40,
            display: isTablet && !showRightPanel ? 'flex' : 'none',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.2)'
        },
        leftPanel: {
            flex: 1,
            backgroundColor: '#080A0F',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isMobile ? '32px 16px 120px 16px' : '24px 32px',
            position: 'relative',
            overflow: 'hidden',
            overflowY: isMobile ? 'auto' : 'hidden'
        },
        rightPanel: {
            width: isTablet ? '50%' : isMobile ? '100%' : '500px',
            backgroundColor: THEME.panel,
            borderLeft: `1px solid ${THEME.panelBorder}`,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
            zIndex: 60,
            height: '100%',
            position: isTablet ? 'absolute' : 'relative',
            right: 0,
            top: 0,
            transform: isTablet && !showRightPanel ? 'translateX(100%)' : 'translateX(0)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
            marginBottom: '0px',
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

    const handleInteractiveEnter = (id) => setHoveredInteractive(prev => ({ ...prev, [id]: true }));
    const handleInteractiveLeave = (id) => setHoveredInteractive(prev => ({ ...prev, [id]: false }));

    return (
        <div style={styles.container}>



            {/* --- HEADER --- */}
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={styles.headerIconBox}>
                        <LayoutGrid size={18} style={{ color: THEME.accent }} />
                    </div>
                    <span style={styles.headerTitle}>
                        New Game v2.10
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        style={styles.learnButton}
                        onMouseEnter={() => setHoveredLearn(true)}
                        onMouseLeave={() => setHoveredLearn(false)}
                        onClick={onOpenLearning}
                    >
                        <GraduationCap size={18} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: isMobile ? 'none' : 'block' }}>Learn Basics</span>
                    </button>

                    {!isMobile && <div style={{ height: '16px', width: '1px', backgroundColor: '#2A303C' }}></div>}

                    <button
                        onClick={() => setShowAuthModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#94A3B8',
                            background: 'none',
                            border: '1px solid #2A303C',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            transition: 'all 0.2s'
                        }}
                    >
                        <User size={16} />
                        <span>Log In</span>
                    </button>

                    <button
                        style={styles.closeButton}
                        onMouseEnter={() => setHoveredClose(true)}
                        onMouseLeave={() => setHoveredClose(false)}
                        onClick={() => window.location.reload()}
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* --- CONTENT ROW --- */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* NEW LEFT: PROFILE & STATS PANEL (Desktop Only) */}
                {!isMobile && (
                    <div style={{ width: isTablet ? '50%' : '480px', flexShrink: 0, height: '100%', borderRight: `1px solid ${THEME.panelBorder}` }}>
                        <WhiteKnightProfilePanel isMobile={isMobile} />
                    </div>
                )}

                {/* CENTER: VISUAL PREVIEW & SUMMARY (Was Left Panel) */}
                <div style={styles.leftPanel}>

                    {/* Background Decoration */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.05 }}>
                        <div style={{ position: 'absolute', top: '25%', left: '25%', width: '384px', height: '384px', backgroundColor: THEME.accent, borderRadius: '50%', filter: 'blur(150px)' }}></div>
                    </div>

                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '384px', gap: '24px' }}>

                        {/* Match Title */}
                        <div style={{ textAlign: 'center' }}>
                            <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                                White Knight <span style={{ color: THEME.accent }}>{activeBot.name}</span>
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>vs Hero User</p>
                        </div>

                        {/* Bot Avatar Large */}
                        <div
                            style={styles.botAvatarLarge}
                            onClick={cycleDifficulty}
                            onMouseEnter={() => setHoveredBot(true)}
                            onMouseLeave={() => setHoveredBot(false)}
                        >
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${THEME.accent}`, opacity: hoveredBot ? 0.4 : 0.2, filter: 'blur(1px)', transition: 'opacity 0.5s' }}></div>

                            <div style={{ color: THEME.accent, transform: hoveredBot ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.5s' }}>
                                {activeBot.icon}
                            </div>

                            {/* Level Badge */}
                            <div style={{ position: 'absolute', bottom: '-12px', backgroundColor: THEME.accent, color: 'black', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '999px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                Rating: {activeBot.rating}
                            </div>
                        </div>

                        {/* INTERACTIVE SUMMARY GRID */}
                        <div style={styles.summaryGrid}>

                            {/* Time Control */}
                            <div
                                onClick={cycleTime}
                                onMouseEnter={() => handleInteractiveEnter('time')}
                                onMouseLeave={() => handleInteractiveLeave('time')}
                                style={styles.summaryCard('time')}
                            >
                                <span style={{ color: hoveredInteractive['time'] ? THEME.accent : '#64748B', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '4px', transition: 'color 0.2s' }}>Time</span>
                                <span style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px' }}>{getSelectedTimeLabel()}</span>
                            </div>

                            {/* Game Mode */}
                            <div
                                onClick={toggleMode}
                                onMouseEnter={() => handleInteractiveEnter('mode')}
                                onMouseLeave={() => handleInteractiveLeave('mode')}
                                style={styles.summaryCard('mode')}
                            >
                                <span style={{ color: hoveredInteractive['mode'] ? THEME.accent : '#64748B', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '4px', transition: 'color 0.2s' }}>Mode</span>
                                <span style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', textTransform: 'uppercase' }}>{gameMode}</span>
                            </div>

                            {/* Side */}
                            <div
                                onClick={cycleSide}
                                onMouseEnter={() => handleInteractiveEnter('side')}
                                onMouseLeave={() => handleInteractiveLeave('side')}
                                style={styles.summaryCard('side')}
                            >
                                <span style={{ color: hoveredInteractive['side'] ? THEME.accent : '#64748B', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '4px', transition: 'color 0.2s' }}>Side</span>
                                <span style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', textTransform: 'capitalize' }}>
                                    {selectedColor === 'w' ? 'White' : selectedColor === 'b' ? 'Black' : 'Random'}
                                </span>
                            </div>

                            {/* Difficulty */}
                            <div
                                onClick={cycleDifficulty}
                                onMouseEnter={() => handleInteractiveEnter('diff')}
                                onMouseLeave={() => handleInteractiveLeave('diff')}
                                style={styles.summaryCard('diff')}
                            >
                                <span style={{ color: hoveredInteractive['diff'] ? THEME.accent : '#64748B', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '4px', transition: 'color 0.2s' }}>Diff</span>
                                <span style={{ color: THEME.accent, fontFamily: 'monospace', fontSize: '14px' }}>{activeBot.name}</span>
                            </div>
                        </div>

                        {/* START GAME BUTTON (Desktop Location) */}
                        <button
                            onClick={handleStartGame}
                            onMouseEnter={() => setHoveredStart(true)}
                            onMouseLeave={() => setHoveredStart(false)}
                            style={styles.startGameBtn}
                        >
                            <Play size={20} fill="currentColor" /> Start Game
                        </button>

                    </div>

                    {/* Debug Console - Desktop Only */}
                    {!isMobile && (
                        <DebugConsole
                            botLevel={activeBot.name}
                            playerColor={selectedColor}
                            gameInfo={{
                                moveCount: 0,
                                hasAnalysis: false,
                                selectedBotIndex: selectedBotIndex,
                                selectedTime: selectedTime,
                                screen: 'new-game-desktop'
                            }}
                        />
                    )}

                    {/* TABLET: OPTIONS TOGGLE */}
                    <div style={styles.optionsToggle} onClick={() => setShowRightPanel(true)}>
                        <Settings size={20} style={{ color: THEME.accent }} className="animate-spin-slow" />
                        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px', color: '#64748B', fontWeight: 'bold', letterSpacing: '0.1em' }}>OPTIONS</span>
                    </div>

                </div>

                {/* RIGHT: SETTINGS PANEL */}
                <div style={styles.rightPanel}>

                    {/* TABLET BACK BUTTON */}
                    {isTablet && (
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${THEME.panelBorder}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => setShowRightPanel(false)} style={styles.closeButton}>
                                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                            </button>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>GAME OPTIONS</span>
                        </div>
                    )}

                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '24px 16px' : '32px 30px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* 0. LEARNING BANNER */}
                        <div
                            onClick={onOpenLearning}
                            onMouseEnter={() => setHoveredUnknown(true)}
                            onMouseLeave={() => setHoveredUnknown(false)}
                            style={{
                                background: 'linear-gradient(to right, #1A1E26, #0F1116)',
                                border: '1px solid rgba(212,175,55,0.3)',
                                borderRadius: '12px',
                                padding: '24px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: hoveredUnknown ? '0 0 20px rgba(212,175,55,0.1)' : '0 4px 12px rgba(0,0,0,0.2)',
                                transform: hoveredUnknown ? 'scale(1.02)' : 'scale(1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 10 }}>
                                <div style={{ backgroundColor: 'rgba(212,175,55,0.2)', padding: '8px', borderRadius: '8px', color: THEME.accent }}>
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <h4 style={{ color: THEME.accent, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>I don't know how to play</h4>
                                    <p style={{ color: '#94A3B8', fontSize: '10px' }}>Learn the rules in our Academy</p>
                                </div>
                            </div>
                            <ChevronRight size={16} style={{ color: '#64748B', position: 'relative', zIndex: 10 }} />
                        </div>

                        {/* 1. GAME TYPE SWITCHER */}
                        <div>
                            <label style={styles.label}>
                                <Target size={14} style={{ color: THEME.accent }} /> Game Type
                            </label>
                            <div style={{ display: 'flex', backgroundColor: '#0B0E14', padding: '4px', borderRadius: '8px', border: `1px solid ${THEME.panelBorder}` }}>
                                <button
                                    onClick={() => setGameMode('standard')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: gameMode === 'standard' ? THEME.accent : 'transparent', color: gameMode === 'standard' ? 'black' : '#64748B', boxShadow: gameMode === 'standard' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' }}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => setGameMode('960')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: gameMode === '960' ? '#E2E8F0' : 'transparent', color: gameMode === '960' ? 'black' : '#64748B', boxShadow: gameMode === '960' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' }}
                                >
                                    Chess 960
                                </button>
                            </div>
                        </div>

                        {/* 2. OPPONENT SELECTOR */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <label style={{ ...styles.label, marginBottom: 0 }}>
                                    <Sword size={14} style={{ color: THEME.accent }} /> Difficulty
                                </label>
                                <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#1A1E26', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${THEME.panelBorder}` }}>{activeBot.name}</span>
                            </div>

                            {/* Slider */}
                            <div style={{ padding: '0 4px', marginBottom: '16px' }}>
                                <input
                                    type="range"
                                    min="0"
                                    max={BOTS.length - 1}
                                    step="1"
                                    value={selectedBotIndex}
                                    onChange={(e) => setSelectedBotIndex(parseInt(e.target.value))}
                                    style={{ width: '100%', height: '8px', backgroundColor: '#2A303C', borderRadius: '8px', appearance: 'none', cursor: 'pointer', accentColor: THEME.accent }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9px', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <span>Easy</span>
                                    <span>Medium</span>
                                    <span>Hard</span>
                                </div>
                            </div>

                            {/* Compact Bot Info */}
                            <div style={{ backgroundColor: '#0B0E14', border: `1px solid ${THEME.panelBorder}`, borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1A1E26', color: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${THEME.panelBorder}` }}>
                                    {activeBot.icon}
                                </div>
                                <p style={{ color: '#94A3B8', fontSize: '12px', lineHeight: 1.4, margin: 0 }}>{activeBot.desc}</p>
                            </div>
                        </div>

                        {/* 3. TIME CONTROL (Expanded Accordion) */}
                        <div ref={timeSectionRef}>
                            <label style={styles.label}>
                                <Clock size={14} style={{ color: THEME.accent }} /> Time Control
                            </label>

                            {/* Default/Selected Display (Collapsible Header) */}
                            <div
                                onClick={() => setIsTimeExpanded(!isTimeExpanded)}
                                style={{ backgroundColor: '#1A1E26', border: `1px solid ${THEME.panelBorder}`, borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '8px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ backgroundColor: 'rgba(212,175,55,0.1)', padding: '6px', borderRadius: '4px', color: THEME.accent }}>
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{getSelectedTimeLabel()}</span>
                                        <span style={{ display: 'block', color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected</span>
                                    </div>
                                </div>
                                <ChevronDown size={16} style={{ color: '#64748B', transform: isTimeExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>

                            {/* Expanded Options */}
                            {isTimeExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
                                    {/* Bullet */}
                                    <div>
                                        <p style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={10} color="#F87171" /> Bullet</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {TIME_CATEGORIES.bullet.map(t => (
                                                <button key={t.val} onClick={() => { setSelectedTime(t.val); }} style={{ padding: '8px', borderRadius: '4px', border: `1px solid ${selectedTime === t.val ? THEME.accent : '#2A303C'}`, backgroundColor: selectedTime === t.val ? THEME.accent : '#0B0E14', color: selectedTime === t.val ? 'black' : '#94A3B8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.15s' }}>{t.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Blitz */}
                                    <div>
                                        <p style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Rabbit size={10} color="#FBBF24" /> Blitz</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {TIME_CATEGORIES.blitz.map(t => (
                                                <button key={t.val} onClick={() => { setSelectedTime(t.val); }} style={{ padding: '8px', borderRadius: '4px', border: `1px solid ${selectedTime === t.val ? THEME.accent : '#2A303C'}`, backgroundColor: selectedTime === t.val ? THEME.accent : '#0B0E14', color: selectedTime === t.val ? 'black' : '#94A3B8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.15s' }}>{t.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Rapid */}
                                    <div>
                                        <p style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} color="#34D399" /> Rapid</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {TIME_CATEGORIES.rapid.map(t => (
                                                <button key={t.val} onClick={() => { setSelectedTime(t.val); }} style={{ padding: '8px', borderRadius: '4px', border: `1px solid ${selectedTime === t.val ? THEME.accent : '#2A303C'}`, backgroundColor: selectedTime === t.val ? THEME.accent : '#0B0E14', color: selectedTime === t.val ? 'black' : '#94A3B8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.15s' }}>{t.label}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom */}
                                    <div style={{ borderTop: '1px solid #2A303C', paddingTop: '12px' }}>
                                        <button
                                            onClick={() => setSelectedTime('custom')}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '4px', border: `1px solid ${selectedTime === 'custom' ? THEME.accent : '#2A303C'}`, backgroundColor: selectedTime === 'custom' ? THEME.accent : '#0B0E14', color: selectedTime === 'custom' ? 'black' : '#94A3B8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '12px' }}
                                        >
                                            <Settings size={14} /> Custom Time
                                        </button>

                                        {selectedTime === 'custom' && (
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Minutes</label>
                                                    <input
                                                        type="number" min="1" max="180"
                                                        value={customTimeState.min}
                                                        onChange={(e) => setCustomTimeState({ ...customTimeState, min: e.target.value })}
                                                        style={{ width: '100%', backgroundColor: '#1A1E26', border: '1px solid #2A303C', borderRadius: '4px', padding: '8px', color: 'white', fontSize: '14px', fontFamily: 'monospace', textAlign: 'center' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Increment</label>
                                                    <input
                                                        type="number" min="0" max="60"
                                                        value={customTimeState.inc}
                                                        onChange={(e) => setCustomTimeState({ ...customTimeState, inc: e.target.value })}
                                                        style={{ width: '100%', backgroundColor: '#1A1E26', border: '1px solid #2A303C', borderRadius: '4px', padding: '8px', color: 'white', fontSize: '14px', fontFamily: 'monospace', textAlign: 'center' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. COLOR SELECTION */}
                        <div>
                            <label style={{ ...styles.label, marginBottom: '16px' }}>
                                <Dna size={14} style={{ color: THEME.accent }} /> Play As (Selected: {selectedColor === 'w' ? 'White' : selectedColor === 'b' ? 'Black' : 'Random'})
                            </label>
                            <div style={{ display: 'flex', backgroundColor: '#0B0E14', padding: '4px', borderRadius: '12px', border: `1px solid ${THEME.panelBorder}` }}>
                                <button
                                    onClick={() => setSelectedColor('w')}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: selectedColor === 'w' ? '#E2E8F0' : 'transparent', color: selectedColor === 'w' ? 'black' : '#64748B', boxShadow: selectedColor === 'w' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' }}
                                >
                                    White
                                </button>
                                <button
                                    onClick={() => setSelectedColor('random')}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: selectedColor === 'random' ? THEME.accent : 'transparent', color: selectedColor === 'random' ? 'black' : '#64748B', boxShadow: selectedColor === 'random' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' }}
                                >
                                    Random
                                </button>
                                <button
                                    onClick={() => setSelectedColor('b')}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: selectedColor === 'b' ? '#1E293B' : 'transparent', color: selectedColor === 'b' ? 'white' : '#64748B', boxShadow: selectedColor === 'b' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' }}
                                >
                                    Black
                                </button>
                            </div>
                        </div>

                        {/* TABLET START BUTTON IN MENU */}
                        {isTablet && (
                            <button
                                onClick={handleStartGame}
                                style={{ ...styles.startGameBtn, marginTop: 'auto' }}
                            >
                                <Play size={20} fill="currentColor" /> Start Game
                            </button>
                        )}

                    </div>

                    {/* MOBILE ONLY: START BUTTON */}
                    {isMobile && (
                        <div style={{ padding: '24px', borderTop: '1px solid #2A303C', backgroundColor: '#151922', flexShrink: 0 }}>
                            <button
                                onClick={handleStartGame}
                                style={{ ...styles.startGameBtn, marginTop: 0 }}
                            >
                                <Play size={20} fill="currentColor" /> Start Game
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* AUTH MODAL */}
            {showAuthModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', padding: '16px' }}>
                    <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', padding: '24px', borderRadius: '8px', maxWidth: '340px', width: '100%', position: 'relative' }}>
                        <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '12px', right: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '1px solid rgba(212,175,55,0.3)' }}>
                                <Lock size={24} style={{ color: '#D4AF37' }} />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Unlock Full Experience</h2>
                            <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.4' }}>
                                Sign up to play with unlimited AI analysis and get free access to the White Knight Academy Beginner Course.
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input type="email" placeholder="Email address" style={{ width: '100%', backgroundColor: '#0B0E14', border: '1px solid #2A303C', padding: '10px 12px', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
                            <button onClick={() => setShowAuthModal(false)} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}>
                                Create Account
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#2A303C' }}></div>
                                <span style={{ fontSize: '12px', color: '#64748B' }}>or</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#2A303C' }}></div>
                            </div>

                            <button
                                onClick={() => setShowAuthModal(false)}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#1A1E26',
                                    border: '1px solid #2A303C',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4" />
                                    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853" />
                                    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
                                    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
                                </svg>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Continue with Google
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
