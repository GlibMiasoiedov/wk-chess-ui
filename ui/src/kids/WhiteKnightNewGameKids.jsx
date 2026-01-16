import React, { useState, useEffect, useRef } from 'react';
import { Settings, Zap, X, Send, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    KIDS DESIGN - NEW GAME MODULE                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🎨 Panel sizing matched to Adult layout:                                    ║
║     • Left panel: 480px (desktop) / 50% (tablet)                             ║
║     • Right panel: 500px (desktop) / 50% (tablet)                            ║
║  📐 Same responsive breakpoints as Adult                                     ║
║  💬 AI Chat with expandable drawer                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

const bots = [
    { name: 'Baby', level: 1, rating: 400, emoji: '👶', color: '#4ecdc4', difficulty: 0.1 },
    { name: 'Chick', level: 2, rating: 600, emoji: '🐣', color: '#22c55e', difficulty: 0.2 },
    { name: 'Happy', level: 3, rating: 800, emoji: '😊', color: '#ffd93d', difficulty: 0.35 },
    { name: 'Thinker', level: 4, rating: 1000, emoji: '🤔', color: '#ff9f43', difficulty: 0.5 },
    { name: 'Fighter', level: 5, rating: 1200, emoji: '😤', color: '#ff6b9d', difficulty: 0.65 },
    { name: 'Wizard', level: 6, rating: 1400, emoji: '🧙‍♂️', color: '#a855f7', difficulty: 0.75 },
    { name: 'King', level: 7, rating: 1600, emoji: '👑', color: '#f59e0b', difficulty: 0.85 },
    { name: 'Robot', level: 8, rating: 2000, emoji: '🤖', color: '#ef4444', difficulty: 0.9 },
    { name: 'Master', level: 9, rating: 2400, emoji: '🏆', color: '#8b5cf6', difficulty: 0.95 },
    { name: 'Champion', level: 10, rating: 2800, emoji: '⭐', color: '#facc15', difficulty: 0.98 },
    { name: 'Engine', level: 11, rating: 3200, emoji: '💥', color: '#dc2626', difficulty: 1.0 },
];

const timeControls = [
    { label: '1m', value: '1|0', emoji: '⚡' },
    { label: '3m', value: '3|0', emoji: '🏃' },
    { label: '5m', value: '5|0', emoji: '🚶' },
    { label: '10m', value: '10|0', emoji: '🧘' },
    { label: '3+2', value: '3|2', emoji: '⏱️' },
    { label: '5+3', value: '5|3', emoji: '⏰' },
];

export default function WhiteKnightNewGameKids({ onStartGame, onOpenLearning, onClose, isMobile: isMobileProp }) {
    const { toggleTheme } = useTheme();
    const [selectedBotIndex, setSelectedBotIndex] = useState(2);
    const [selectedTime, setSelectedTime] = useState('5|0');
    const [selectedSide, setSelectedSide] = useState('RANDOM');
    const [gameType, setGameType] = useState('STANDARD');
    const [showHelp, setShowHelp] = useState(false);

    // --- RESPONSIVE STATE (same as Adult) ---
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [showRightPanel, setShowRightPanel] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isTablet = windowWidth >= 768 && windowWidth < 1200;
    const isMobile = windowWidth < 768;

    // --- CHAT STATE (same as Adult ProfilePanel) ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: "Hi! Ready for your game? 🎉 Need a quick puzzle to warm up?" }
    ]);
    const msgsEndRef = useRef(null);

    // --- SESSION STATS (shared with Adult) ---
    const [sessionStats, setSessionStats] = useState({ games: 0, rating: 0, wins: 0, losses: 0, draws: 0, lastRatingChange: 0 });

    useEffect(() => {
        try {
            const savedStats = localStorage.getItem('wk_session_stats');
            if (savedStats) {
                setSessionStats(JSON.parse(savedStats));
            }
        } catch (e) {
            console.error('[KidsNewGame] Error loading session stats:', e);
        }
    }, []);

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setMessages([...messages, { id: Date.now(), sender: 'user', text: chatInput }]);
        setChatInput("");
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: "Great question! Let me think... 🤔" }]);
        }, 1000);
    };

    useEffect(() => {
        if (isChatOpen) msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatOpen]);

    const selectedBot = bots[selectedBotIndex];

    // Derived values for proper re-rendering (fixes stale closure issue)
    const selectedTimeEmoji = timeControls.find(t => t.value === selectedTime)?.emoji || '⏱️';
    const selectedTimeDisplay = selectedTime.replace('|0', 'm').replace('|', '+');
    const selectedSideEmoji = selectedSide === 'WHITE' ? '♔' : selectedSide === 'BLACK' ? '♚' : '🎲';
    const selectedGameTypeEmoji = gameType === 'STANDARD' ? '♟️' : '🎲';
    const selectedGameTypeDisplay = gameType === 'STANDARD' ? 'Standard' : '960';

    const handleNextBot = () => {
        setSelectedBotIndex((prev) => (prev < bots.length - 1 ? prev + 1 : 0));
    };

    const handleStartGame = () => {
        const [minutes, increment] = selectedTime.split('|').map(Number);

        onStartGame({
            bot: {
                name: selectedBot.name,
                rating: selectedBot.rating,
                emoji: selectedBot.emoji,
                difficulty: selectedBot.difficulty
            },
            timeControl: { minutes, increment },
            color: selectedSide === 'RANDOM' ? (Math.random() > 0.5 ? 'w' : 'b') : (selectedSide === 'WHITE' ? 'w' : 'b'),
            gameType: gameType,
        });
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Stars background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, #ffd93d, transparent),
          radial-gradient(2px 2px at 40px 70px, #4ecdc4, transparent),
          radial-gradient(2px 2px at 90px 40px, #a855f7, transparent),
          radial-gradient(2px 2px at 130px 80px, #ffd93d, transparent)
        `,
                backgroundSize: '200px 200px',
                opacity: 0.4,
                pointerEvents: 'none'
            }} />

            {/* Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowHelp(false)}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        borderRadius: '24px', padding: '32px', width: '380px', border: '3px solid #a855f7',
                        textAlign: 'center'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '72px', marginBottom: '16px' }}>🎓</div>
                        <h2 style={{ fontSize: '24px', margin: '0 0 24px 0' }}>NEW TO CHESS?</h2>
                        <button onClick={() => { setShowHelp(false); onOpenLearning?.(); }} style={{
                            width: '100%', padding: '18px', background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                            border: 'none', borderRadius: '16px', color: 'white', fontWeight: '700',
                            fontSize: '16px', cursor: 'pointer'
                        }}>🚀 LEARN NOW</button>
                    </div>
                </div>
            )}

            {/* ═══════════════════ HEADER ═══════════════════ */}
            <header style={{
                height: '64px',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                borderBottom: '2px solid rgba(255,217,61,0.2)',
                position: 'relative',
                zIndex: 100,
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>♞</div>
                    <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>NEW GAME</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>v2.42</span>
                    <ThemeToggle />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onOpenLearning} style={{
                        padding: '8px 16px', background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                        border: 'none', borderRadius: '16px', color: 'white', fontWeight: '700',
                        fontSize: '12px', cursor: 'pointer', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '6px'
                    }}>📚 LEARN BASICS</button>

                    {/* Login Button */}
                    <button onClick={() => alert('Login feature coming soon!')} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(255,217,61,0.1)', border: '2px solid rgba(255,217,61,0.3)',
                        borderRadius: '12px', padding: '6px 12px',
                        color: '#ffd93d', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        <User size={16} />
                        <span style={{ display: isMobile ? 'none' : 'block' }}>Log In</span>
                    </button>

                    <button onClick={() => { console.log('Close clicked'); if (onClose) onClose(); else window.location.reload(); }} style={{
                        padding: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <X size={22} />
                    </button>
                </div>
            </header>

            {/* ═══════════════════ MAIN AREA (3 columns) ═══════════════════ */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

                {/* ═══════════════════ LEFT PANEL (480px - same as Adult) ═══════════════════ */}
                {!isMobile && (
                    <aside style={{
                        width: isTablet ? '50%' : '480px',
                        flexShrink: 0,
                        height: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        borderRight: '2px solid rgba(255,217,61,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Scrollable content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Profile Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(255,217,61,0.15), rgba(255,159,67,0.1))',
                                borderRadius: '16px', padding: '16px', border: '2px solid rgba(255,217,61,0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px', fontWeight: '800', color: '#1a1a2e'
                                    }}>WK</div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '16px' }}>HERO USER</div>
                                        <div style={{ color: '#ffd93d', fontSize: '12px' }}>⭐ PRO MEMBER</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffd93d' }}>{sessionStats.rating || 0}</div>
                                        <div style={{ color: sessionStats.lastRatingChange >= 0 ? '#22c55e' : '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                                            {sessionStats.lastRatingChange >= 0 ? '📈' : '📉'} {sessionStats.lastRatingChange >= 0 ? '+' : ''}{sessionStats.lastRatingChange || 0}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>RATING</div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '800' }}>{sessionStats.games || 0}</div>
                                        <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px' }}>🎮 GAMES</div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Awards */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#ffd93d', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    🏆 RECENT AWARDS
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                    <div style={{ background: 'rgba(168,85,247,0.2)', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid rgba(168,85,247,0.3)' }}>
                                        <div style={{ fontSize: '28px' }}>🎯</div>
                                        <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '6px' }}>Tactical Master</div>
                                    </div>
                                    <div style={{ background: 'rgba(78,205,196,0.2)', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid rgba(78,205,196,0.3)' }}>
                                        <div style={{ fontSize: '28px' }}>🔥</div>
                                        <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '6px' }}>Streak x5</div>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Sessions */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(34,197,94,0.1))',
                                borderRadius: '14px', padding: '16px', border: '2px solid rgba(78,205,196,0.2)',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '11px', color: '#4ecdc4', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    📅 UPCOMING LIVE SESSIONS
                                </div>
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ background: '#ffd93d', borderRadius: '10px', padding: '8px 14px', textAlign: 'center', color: '#1a1a2e', flexShrink: 0 }}>
                                        <div style={{ fontSize: '9px', fontWeight: '700' }}>JAN</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800' }}>17</div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ADVANCED ENDGAMES</div>
                                        <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>👩‍🏫 Real Human Coach</div>
                                    </div>
                                </div>
                                <button style={{
                                    width: '100%', marginTop: '12px', padding: '12px',
                                    background: 'rgba(78,205,196,0.2)',
                                    border: '1px solid rgba(78,205,196,0.4)',
                                    borderRadius: '10px', color: '#4ecdc4', fontWeight: '700',
                                    fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em'
                                }}>
                                    BOOK LESSON →
                                </button>
                            </div>
                        </div>

                        {/* AI Chat Widget (clickable to expand) */}
                        <div
                            onClick={() => setIsChatOpen(true)}
                            style={{
                                margin: '16px',
                                background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(168,85,247,0.2))',
                                borderRadius: '14px', padding: '14px',
                                border: '2px solid rgba(255,107,157,0.3)',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px', height: '36px', background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                                }}>
                                    <Zap size={18} fill="currentColor" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: '700', fontSize: '12px' }}>AI Assistant</span>
                                    <div style={{ color: '#64748b', fontSize: '10px' }}>Need help? Ask me! 🎉</div>
                                </div>
                                <span style={{ color: '#a855f7', fontSize: '18px' }}>›</span>
                            </div>
                        </div>

                        {/* Chat Drawer (overlay when open) */}
                        {isChatOpen && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                                display: 'flex', flexDirection: 'column',
                                zIndex: 50
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: '16px', borderBottom: '1px solid rgba(255,217,61,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
                                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Zap size={18} fill="currentColor" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '13px' }}>White Knight AI</div>
                                            <div style={{ color: '#22c55e', fontSize: '10px' }}>● Online</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsChatOpen(false)} style={{
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}>
                                        <X size={22} />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {messages.map(msg => (
                                        <div key={msg.id} style={{
                                            alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                                            background: msg.sender === 'bot' ? 'rgba(168,85,247,0.2)' : 'rgba(255,217,61,0.2)',
                                            border: msg.sender === 'bot' ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,217,61,0.3)',
                                            borderRadius: '12px', padding: '10px 14px', maxWidth: '80%',
                                            fontSize: '13px'
                                        }}>
                                            {msg.text}
                                        </div>
                                    ))}
                                    <div ref={msgsEndRef} />
                                </div>

                                {/* Input */}
                                <div style={{ padding: '12px', borderTop: '1px solid rgba(255,217,61,0.2)', display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Type your question..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        style={{
                                            flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '10px', padding: '12px', color: 'white', fontSize: '13px', outline: 'none'
                                        }}
                                    />
                                    <button onClick={handleSendMessage} style={{
                                        background: 'linear-gradient(135deg, #ffd93d, #ff9f43)', border: 'none',
                                        borderRadius: '10px', width: '50px', height: '48px', color: '#1a1a2e', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: '700'
                                    }}>
                                        ➤
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
                    position: 'relative'
                }}>
                    <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '800', margin: '0 0 24px 0', textAlign: 'center' }}>
                        <span style={{ color: '#ffd93d' }}>WHITE KNIGHT</span>{' '}
                        <span style={{ color: selectedBot.color }}>{selectedBot.name.toUpperCase()}</span>
                    </h1>

                    {/* Bot Avatar */}
                    <button onClick={handleNextBot} style={{
                        width: isMobile ? '140px' : '180px',
                        height: isMobile ? '140px' : '180px',
                        background: `radial-gradient(circle, ${selectedBot.color}33 0%, transparent 70%)`,
                        border: `4px solid ${selectedBot.color}`,
                        borderRadius: '50%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: `0 0 50px ${selectedBot.color}40`,
                        marginBottom: '40px'
                    }}>
                        <div style={{ fontSize: isMobile ? '50px' : '70px' }}>{selectedBot.emoji}</div>
                        <div style={{
                            position: 'absolute', bottom: '-16px',
                            background: '#ffd93d', padding: '6px 20px', borderRadius: '20px',
                            color: '#1a1a2e', fontWeight: '800', fontSize: '12px'
                        }}>Rating: {selectedBot.rating}</div>
                    </button>

                    {/* Settings Grid */}
                    <div style={{
                        width: '100%',
                        maxWidth: '340px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                    }}>
                        <button onClick={() => {
                            const times = timeControls.map(t => t.value);
                            const idx = times.indexOf(selectedTime);
                            setSelectedTime(times[(idx + 1) % times.length]);
                        }} style={{
                            padding: '14px', background: 'rgba(255,255,255,0.05)',
                            border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                            cursor: 'pointer', textAlign: 'center', color: 'white'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}>TIME</div>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                {selectedTimeEmoji} {selectedTimeDisplay}
                            </div>
                        </button>
                        <button onClick={() => setGameType(g => g === 'STANDARD' ? 'CHESS960' : 'STANDARD')} style={{
                            padding: '14px', background: 'rgba(255,255,255,0.05)',
                            border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                            cursor: 'pointer', textAlign: 'center', color: 'white'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}>MODE</div>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                {selectedGameTypeEmoji} {selectedGameTypeDisplay}
                            </div>
                        </button>
                        <button onClick={() => {
                            const sides = ['WHITE', 'RANDOM', 'BLACK'];
                            const idx = sides.indexOf(selectedSide);
                            setSelectedSide(sides[(idx + 1) % sides.length]);
                        }} style={{
                            padding: '14px', background: 'rgba(255,255,255,0.05)',
                            border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                            cursor: 'pointer', textAlign: 'center', color: 'white'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}>SIDE</div>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                {selectedSideEmoji} {selectedSide}
                            </div>
                        </button>
                        <button onClick={handleNextBot} style={{
                            padding: '14px', background: 'rgba(255,255,255,0.05)',
                            border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                            cursor: 'pointer', textAlign: 'center', color: 'white'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}>DIFF</div>
                            <div style={{ color: selectedBot.color, fontSize: '16px', fontWeight: '700' }}>
                                {selectedBot.emoji} {selectedBot.name}
                            </div>
                        </button>
                    </div>

                    {/* Start Button */}
                    <button onClick={handleStartGame} style={{
                        width: '100%',
                        maxWidth: '340px',
                        marginTop: '24px',
                        padding: '18px 40px',
                        background: 'linear-gradient(90deg, #ffd93d, #ff9f43)',
                        border: 'none',
                        borderRadius: '20px',
                        color: '#1a1a2e',
                        fontWeight: '800',
                        fontSize: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 6px 30px rgba(255,217,61,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                        ▶ START GAME
                    </button>
                </main>

                {/* ═══════════════════ OPTIONS TOGGLE (Tablet) ═══════════════════ */}
                {isTablet && !showRightPanel && (
                    <div onClick={() => setShowRightPanel(true)} style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'linear-gradient(135deg, rgba(255,217,61,0.2), rgba(255,159,67,0.2))',
                        border: '2px solid rgba(255,217,61,0.3)',
                        borderRight: 'none',
                        borderRadius: '16px 0 0 16px',
                        padding: '16px 12px',
                        cursor: 'pointer',
                        zIndex: 40,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '-4px 0 12px rgba(0,0,0,0.2)'
                    }}>
                        <Settings size={20} style={{ color: '#ffd93d' }} />
                        <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '11px', fontWeight: '700', color: '#ffd93d' }}>
                            OPTIONS
                        </span>
                    </div>
                )}

                {/* ═══════════════════ RIGHT PANEL (500px - same as Adult) ═══════════════════ */}
                {!isMobile && (
                    <aside style={{
                        width: isTablet ? '50%' : '500px',
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        borderLeft: '2px solid rgba(255,217,61,0.2)',
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
                        padding: '20px',
                        overflowY: 'auto'
                    }}>
                        {/* Close button for tablet */}
                        {isTablet && showRightPanel && (
                            <button onClick={() => setShowRightPanel(false)} style={{
                                position: 'absolute', top: '16px', right: '16px',
                                padding: '10px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer'
                            }}>
                                <X size={22} />
                            </button>
                        )}

                        {/* Help Button */}
                        <button onClick={() => setShowHelp(true)} style={{
                            width: '100%', padding: '16px', marginBottom: '20px',
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2))',
                            border: '2px solid rgba(168,85,247,0.3)', borderRadius: '16px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <div style={{
                                width: '44px', height: '44px', background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                            }}>🤔</div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>I DON'T KNOW HOW TO PLAY</div>
                                <div style={{ color: '#64748b', fontSize: '11px' }}>Learn the rules in our Academy</div>
                            </div>
                            <span style={{ color: '#64748b', fontSize: '20px' }}>›</span>
                        </button>

                        {/* Game Type */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚙️ GAME TYPE</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['STANDARD', 'CHESS960'].map(type => (
                                    <button key={type} onClick={() => setGameType(type)} style={{
                                        flex: 1, padding: '14px',
                                        background: gameType === type ? '#ffd93d' : 'rgba(255,255,255,0.05)',
                                        border: 'none', borderRadius: '12px',
                                        color: gameType === type ? '#1a1a2e' : 'white',
                                        fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                    }}>{type === 'STANDARD' ? '♟️' : '🎲'} {type === 'CHESS960' ? '960' : type}</button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty Slider */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🎯 DIFFICULTY</div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px' }}>
                                <input type="range" min="0" max={bots.length - 1} value={selectedBotIndex}
                                    onChange={(e) => setSelectedBotIndex(parseInt(e.target.value))}
                                    style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'linear-gradient(90deg, #4ecdc4, #ffd93d, #ef4444)', WebkitAppearance: 'none', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px' }}>
                                    <span style={{ color: '#4ecdc4' }}>EASY</span>
                                    <span style={{ color: '#ffd93d' }}>MEDIUM</span>
                                    <span style={{ color: '#ef4444' }}>HARD</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                                    <span style={{ fontSize: '28px' }}>{selectedBot.emoji}</span>
                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{selectedBot.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Time Control */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>⏱️ TIME CONTROL</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {timeControls.map(time => (
                                    <button key={time.value} onClick={() => setSelectedTime(time.value)} style={{
                                        padding: '12px 8px',
                                        background: selectedTime === time.value ? '#ffd93d' : 'rgba(255,255,255,0.05)',
                                        border: 'none', borderRadius: '12px',
                                        color: selectedTime === time.value ? '#1a1a2e' : 'white',
                                        fontWeight: '600', fontSize: '11px', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                                    }}>
                                        <span style={{ fontSize: '16px' }}>{time.emoji}</span>
                                        <span>{time.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Side Selection */}
                        <div>
                            <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>✨ PLAY AS (SELECTED: {selectedSide})</div>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                                {[{ v: 'WHITE', e: '⬜' }, { v: 'RANDOM', e: '🎲' }, { v: 'BLACK', e: '⬛' }].map(s => (
                                    <button key={s.v} onClick={() => setSelectedSide(s.v)} style={{
                                        flex: 1, padding: '14px', border: 'none',
                                        background: selectedSide === s.v ? '#4ecdc4' : 'transparent',
                                        color: selectedSide === s.v ? '#1a1a2e' : 'white',
                                        fontWeight: '700', fontSize: '11px', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                                    }}>
                                        <span style={{ fontSize: '18px' }}>{s.e}</span>
                                        <span>{s.v}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
