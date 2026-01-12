import React, { useState } from 'react';
import {
    Crown, Zap, ChevronRight, ChevronLeft,
    Target, Shield, Sword, GraduationCap,
    HelpCircle, Play, CheckCircle2, Star,
    Clock, Flame, Rabbit, Menu
} from 'lucide-react';
import ChessBoard from './components/ChessBoard.jsx';
import DebugConsole from './components/DebugConsole.jsx';


// --- BOTS DATA ---
const BOTS = [
    { id: 0, name: 'Rookie', rating: 400, icon: <Shield size={20} />, desc: "Learning rules. Makes mistakes." },
    { id: 1, name: 'Beginner', rating: 800, icon: <Shield size={20} />, desc: "Basic patterns, leaves pieces." },
    { id: 2, name: 'Casual', rating: 1200, icon: <Sword size={20} />, desc: "Solid fundamentals." },
    { id: 3, name: 'Intermediate', rating: 1600, icon: <Sword size={20} />, desc: "Strong tactical awareness." },
    { id: 4, name: 'Advanced', rating: 2000, icon: <Target size={20} />, desc: "Excellent positional play." },
    { id: 5, name: 'Master', rating: 2400, icon: <Crown size={20} />, desc: "Expert calculation skills." },
    { id: 6, name: 'GM', rating: 2800, icon: <Crown size={20} />, desc: "Superhuman performance." },
    { id: 7, name: 'Engine', rating: 3200, icon: <Zap size={20} />, desc: "Perfect play." },
];

// --- TIME CONTROLS ---
const TIME_CONTROLS = [
    { label: '1 min', val: '1+0', type: 'Bullet', color: '#EF4444' },
    { label: '1 | 1', val: '1+1', type: 'Bullet', color: '#EF4444' },
    { label: '3 min', val: '3+0', type: 'Blitz', color: '#F59E0B' },
    { label: '3 | 2', val: '3+2', type: 'Blitz', color: '#F59E0B' },
    { label: '5 min', val: '5+0', type: 'Blitz', color: '#F59E0B' },
    { label: '10 min', val: '10+0', type: 'Rapid', color: '#10B981' },
    { label: '10 | 5', val: '10+5', type: 'Rapid', color: '#10B981' },
    { label: '15 | 10', val: '15+10', type: 'Rapid', color: '#10B981' },
    { label: '30 min', val: '30+0', type: 'Classical', color: '#3B82F6' },
];

// Time control icon based on type
const TimeIcon = ({ type, size = 12 }) => {
    if (type === 'Bullet') return <Flame size={size} style={{ color: '#EF4444' }} />;
    if (type === 'Blitz') return <Rabbit size={size} style={{ color: '#F59E0B' }} />;
    return <Clock size={size} style={{ color: '#10B981' }} />;
};

export default function WhiteKnightGameSetup({ onStartGame, isMobile }) {
    const [view, setView] = useState('setup');
    const [selectedBotIndex, setSelectedBotIndex] = useState(2);
    const [selectedTime, setSelectedTime] = useState('10+0');
    const [selectedColor, setSelectedColor] = useState('random');
    const activeBot = BOTS[selectedBotIndex];

    // Log initial load
    React.useEffect(() => {
        console.log('[Setup] Component loaded', {
            isMobile,
            defaultBot: BOTS[2].name,
            defaultTime: '10+0',
            defaultColor: 'random'
        });
    }, []);

    // Log bot level changes
    React.useEffect(() => {
        console.log('[Setup] Bot level changed:', {
            name: activeBot.name,
            rating: activeBot.rating,
            index: selectedBotIndex
        });
    }, [selectedBotIndex]);

    // Log time control changes
    React.useEffect(() => {
        console.log('[Setup] Time control changed:', selectedTime);
    }, [selectedTime]);

    // Log side/color changes
    React.useEffect(() => {
        console.log('[Setup] Side changed:', selectedColor);
    }, [selectedColor]);

    const handleStartGame = () => {
        console.log('[Setup] Starting game with:', {
            bot: activeBot.name,
            rating: activeBot.rating,
            timeControl: selectedTime,
            color: selectedColor
        });
        if (onStartGame) {
            onStartGame({ bot: activeBot, timeControl: selectedTime, color: selectedColor });
        }
    };

    // --- DESKTOP LAYOUT ---
    if (!isMobile) {
        // Tutorial view on desktop
        if (view === 'tutorial') {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', backgroundColor: '#0B0E14', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
                    {/* LEFT: Tutorial Board */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: '#0B0E14' }}>
                        <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#94A3B8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <span>Tutorial</span>
                            <span style={{ color: '#4ADE80', fontWeight: 'bold' }}>The Rook</span>
                        </div>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '500px', aspectRatio: '1/1', boxShadow: '0 0 60px rgba(0,0,0,0.6)', border: '1px solid #2A303C', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#151922' }}>
                            <ChessBoard position="start" disabled={true} />
                        </div>
                    </div>
                    {/* RIGHT: Tutorial Content */}
                    <div style={{ width: '400px', minWidth: '400px', backgroundColor: '#151922', borderLeft: '1px solid #2A303C', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.3)', zIndex: 20, height: '100%' }}>
                        <div style={{ height: '56px', borderBottom: '1px solid #2A303C', display: 'flex', alignItems: 'center', padding: '0 24px', backgroundColor: '#0B0E14' }}>
                            <span style={{ fontWeight: 'bold', color: '#D4AF37', letterSpacing: '0.1em', fontSize: '14px' }}>TUTORIAL</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ backgroundColor: '#1A1E26', border: '1px solid #2A303C', padding: '20px', borderRadius: '8px' }}>
                                <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '12px', margin: '0 0 12px 0' }}>The Rook</h2>
                                <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    The Rook moves in straight lines—forward, backward, left, or right. It can move as many squares as it wants in any of these directions, but cannot jump over other pieces.
                                </p>
                                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0B0E14', padding: '12px', borderRadius: '4px', border: '1px solid #2A303C' }}>
                                    <GraduationCap size={18} style={{ color: '#D4AF37' }} />
                                    <span style={{ fontSize: '12px', color: '#E2E8F0' }}><span style={{ color: '#D4AF37', fontWeight: 'bold' }}>Tip:</span> Rooks are most powerful on open files.</span>
                                </div>
                            </div>
                            <button onClick={() => setView('setup')} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '14px', borderRadius: '4px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <ChevronLeft size={18} /> Back to Setup
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Setup view on desktop
        return (
            <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', backgroundColor: '#0B0E14', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

                {/* LEFT: Real ChessBoard Preview */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: '#0B0E14' }}>
                    <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#94A3B8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <span>VS</span>
                        <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>{activeBot.name} ({activeBot.rating})</span>
                    </div>

                    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', aspectRatio: '1/1', boxShadow: '0 0 60px rgba(0,0,0,0.6)', border: '1px solid #2A303C', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#151922' }}>
                        <ChessBoard
                            position="start"
                            orientation={selectedColor === 'black' ? 'black' : 'white'}
                            disabled={true}
                        />
                    </div>

                    {/* Debug Console - Under Chess Board - Desktop Only */}
                    {!isMobile && (
                        <div style={{ width: '100%', maxWidth: '500px', marginTop: '24px' }}>
                            <DebugConsole
                                botLevel={activeBot.name}
                                playerColor={selectedColor}
                                gameInfo={{
                                    moveCount: 0,
                                    hasAnalysis: false,
                                    selectedBotIndex: selectedBotIndex,
                                    selectedTime: selectedTime,
                                    screen: 'setup-desktop'
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT: Settings Panel */}
                <div style={{ width: '400px', minWidth: '400px', backgroundColor: '#151922', borderLeft: '1px solid #2A303C', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.3)', zIndex: 20, height: '100%' }}>

                    {/* Header */}
                    <div style={{ height: '56px', borderBottom: '1px solid #2A303C', display: 'flex', alignItems: 'center', padding: '0 24px', backgroundColor: '#0B0E14' }}>
                        <span style={{ fontWeight: 'bold', color: '#D4AF37', letterSpacing: '0.1em', fontSize: '14px' }}>NEW GAME</span>
                    </div>

                    {/* Settings Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Tutorial Button */}
                        <button onClick={() => setView('tutorial')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)', backgroundColor: 'rgba(212,175,55,0.05)', padding: '14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <HelpCircle size={18} /> I don't know how chess moves
                        </button>

                        {/* Opponent Selection */}
                        <div style={{ backgroundColor: '#1A1E26', border: '1px solid #2A303C', borderRadius: '8px', padding: '16px' }}>
                            <label style={{ color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>Opponent Strength</label>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#D4AF37', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>
                                    {activeBot.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                        <span style={{ color: '#E2E8F0', fontWeight: 'bold', fontSize: '16px' }}>{activeBot.name}</span>
                                        <span style={{ color: '#D4AF37', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px' }}>{activeBot.rating}</span>
                                    </div>
                                    <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>{activeBot.desc}</p>
                                </div>
                            </div>

                            <input type="range" min="0" max={BOTS.length - 1} step="1" value={selectedBotIndex} onChange={(e) => setSelectedBotIndex(parseInt(e.target.value))} style={{ width: '100%', height: '6px', backgroundColor: '#2A303C', borderRadius: '8px', appearance: 'none', cursor: 'pointer', accentColor: '#D4AF37' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                <span>Easy</span><span>Mid</span><span>Hard</span>
                            </div>
                        </div>

                        {/* Time Control */}
                        <div>
                            <label style={{ color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Time Control</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {TIME_CONTROLS.map((tc) => (
                                    <button key={tc.val} onClick={() => setSelectedTime(tc.val)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', borderRadius: '4px', border: `1px solid ${selectedTime === tc.val ? '#D4AF37' : '#2A303C'}`, backgroundColor: selectedTime === tc.val ? '#D4AF37' : '#1A1E26', color: selectedTime === tc.val ? 'black' : '#94A3B8', cursor: 'pointer', transition: 'all 0.15s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                            <TimeIcon type={tc.type} size={10} />
                                            <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>{tc.type}</span>
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{tc.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Side to Play */}
                        <div>
                            <label style={{ color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Side</label>
                            <div style={{ display: 'flex', backgroundColor: '#1A1E26', borderRadius: '4px', border: '1px solid #2A303C', padding: '3px' }}>
                                {['white', 'random', 'black'].map((col) => (
                                    <button key={col} onClick={() => setSelectedColor(col)} style={{ flex: 1, padding: '12px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: selectedColor === col ? (col === 'white' ? '#E2E8F0' : col === 'random' ? '#D4AF37' : '#1e293b') : 'transparent', color: selectedColor === col ? (col === 'black' ? 'white' : 'black') : '#64748B', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                                        {col}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Start Game Button */}
                        <button onClick={handleStartGame} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '16px', borderRadius: '4px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', transition: 'all 0.2s' }}>
                            <Play size={18} fill="currentColor" /> Start Game
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- MOBILE LAYOUT ---
    return (
        <div style={{ height: '100%', width: '100%', backgroundColor: '#0B0E14', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ height: '52px', minHeight: '52px', borderBottom: '1px solid #2A303C', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', backgroundColor: '#0B0E14' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '10px' }}>WK</div>
                    <span style={{ fontWeight: 'bold', color: '#D4AF37', letterSpacing: '0.1em', fontSize: '14px' }}>
                        {view === 'setup' ? 'NEW GAME' : 'TUTORIAL'}
                    </span>
                </div>
                <button style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }}>
                    <Menu size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

                {/* SETUP VIEW */}
                {view === 'setup' && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Tutorial Button */}
                        <button onClick={() => setView('tutorial')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)', backgroundColor: 'rgba(212,175,55,0.05)', padding: '14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
                            <HelpCircle size={18} /> I don't know how to play
                        </button>

                        {/* Opponent */}
                        <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', borderRadius: '8px', padding: '14px' }}>
                            <label style={{ color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Opponent Strength</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#D4AF37', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{activeBot.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#E2E8F0', fontWeight: 'bold', fontSize: '15px' }}>{activeBot.name}</span>
                                        <span style={{ color: '#D4AF37', fontFamily: 'monospace', fontWeight: 'bold' }}>{activeBot.rating}</span>
                                    </div>
                                    <p style={{ color: '#94A3B8', fontSize: '11px', margin: 0 }}>{activeBot.desc}</p>
                                </div>
                            </div>
                            <input type="range" min="0" max={BOTS.length - 1} step="1" value={selectedBotIndex} onChange={(e) => setSelectedBotIndex(parseInt(e.target.value))} style={{ width: '100%', height: '6px', backgroundColor: '#2A303C', borderRadius: '8px', appearance: 'none', cursor: 'pointer', accentColor: '#D4AF37' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                <span>Easy</span><span>Mid</span><span>Hard</span>
                            </div>
                        </div>

                        {/* Time */}
                        <div>
                            <label style={{ color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Time Control</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                {TIME_CONTROLS.map((tc) => (
                                    <button key={tc.val} onClick={() => setSelectedTime(tc.val)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', borderRadius: '4px', border: `1px solid ${selectedTime === tc.val ? '#D4AF37' : '#2A303C'}`, backgroundColor: selectedTime === tc.val ? '#D4AF37' : '#1A1E26', color: selectedTime === tc.val ? 'black' : '#94A3B8', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                            <TimeIcon type={tc.type} size={10} />
                                            <span style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>{tc.type}</span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{tc.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Side */}
                        <div>
                            <label style={{ color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Side</label>
                            <div style={{ display: 'flex', backgroundColor: '#1A1E26', borderRadius: '4px', border: '1px solid #2A303C', padding: '3px' }}>
                                {['white', 'random', 'black'].map((col) => (
                                    <button key={col} onClick={() => setSelectedColor(col)} style={{ flex: 1, padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: selectedColor === col ? (col === 'white' ? '#E2E8F0' : col === 'random' ? '#D4AF37' : '#1e293b') : 'transparent', color: selectedColor === col ? (col === 'black' ? 'white' : 'black') : '#64748B', textTransform: 'capitalize' }}>
                                        {col}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Debug Console Panel - Mobile Setup */}
                        <DebugConsole
                            botLevel={activeBot.name}
                            playerColor={selectedColor}
                            gameInfo={{
                                moveCount: 0,
                                hasAnalysis: false,
                                selectedBotIndex: selectedBotIndex,
                                selectedTime: selectedTime,
                                screen: 'setup-mobile'
                            }}
                        />

                        {/* Start */}
                        <button onClick={handleStartGame} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '14px', borderRadius: '4px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Play size={18} fill="currentColor" /> Start Game
                        </button>
                    </div>
                )}

                {/* TUTORIAL VIEW */}
                {view === 'tutorial' && (
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#94A3B8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <span>Lesson</span>
                            <span style={{ color: '#4ADE80', fontWeight: 'bold' }}>The Rook</span>
                        </div>

                        <div style={{ width: '100%', aspectRatio: '1/1', maxWidth: '350px', margin: '0 auto', boxShadow: '0 0 40px rgba(0,0,0,0.5)', border: '1px solid #2A303C', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#151922' }}>
                            <ChessBoard position="start" disabled={true} />
                        </div>

                        <button onClick={() => setView('setup')} style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94A3B8', padding: '12px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <ChevronLeft size={16} /> Back to Setup
                        </button>

                        <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                            <h2 style={{ fontSize: '18px', color: 'white', marginBottom: '8px', margin: '0 0 8px 0' }}>The Rook</h2>
                            <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                                Moves in straight lines—forward, backward, left, or right. It can move as many squares as it wants.
                            </p>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0B0E14', padding: '8px', borderRadius: '4px', border: '1px solid #2A303C' }}>
                                <GraduationCap size={16} style={{ color: '#D4AF37' }} />
                                <span style={{ fontSize: '11px', color: '#E2E8F0' }}><span style={{ color: '#D4AF37', fontWeight: 'bold' }}>Action:</span> Tap the dots to move.</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
