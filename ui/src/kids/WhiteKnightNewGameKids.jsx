import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    KIDS DESIGN - NEW GAME MODULE                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🎨 Colorful, emoji-based, playful design for children                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

const bots = [
    { name: 'Baby', level: 1, rating: 400, emoji: '👶', color: '#4ecdc4', difficulty: 0.1 },
    { name: 'Chick', level: 2, rating: 600, emoji: '🐣', color: '#22c55e', difficulty: 0.2 },
    { name: 'Happy', level: 3, rating: 800, emoji: '😊', color: '#ffd93d', difficulty: 0.35 },
    { name: 'Thinker', level: 4, rating: 1000, emoji: '🤔', color: '#ff9f43', difficulty: 0.5 },
    { name: 'Fighter', level: 5, rating: 1200, emoji: '😤', color: '#ff6b9d', difficulty: 0.65 },
    { name: 'Wizard', level: 6, rating: 1400, emoji: '🧙‍♂️', color: '#a855f7', difficulty: 0.8 },
    { name: 'King', level: 7, rating: 1600, emoji: '👑', color: '#f59e0b', difficulty: 0.9 },
    { name: 'Robot', level: 8, rating: 2000, emoji: '🤖', color: '#ef4444', difficulty: 1.0 },
];

const timeControls = [
    { label: '1m', value: '1|0', emoji: '⚡' },
    { label: '3m', value: '3|0', emoji: '🏃' },
    { label: '5m', value: '5|0', emoji: '🚶' },
    { label: '10m', value: '10|0', emoji: '🧘' },
    { label: '3+2', value: '3|2', emoji: '⏱️' },
    { label: '5+3', value: '5|3', emoji: '⏰' },
];

export default function WhiteKnightNewGameKids({ onStartGame, onOpenLearning, onClose }) {
    const { toggleTheme } = useTheme();
    const [selectedBotIndex, setSelectedBotIndex] = useState(2);
    const [selectedTime, setSelectedTime] = useState('5|0');
    const [selectedSide, setSelectedSide] = useState('RANDOM');
    const [gameType, setGameType] = useState('STANDARD');
    const [showHelp, setShowHelp] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const selectedBot = bots[selectedBotIndex];

    const handleNextBot = () => {
        setSelectedBotIndex((prev) => (prev < bots.length - 1 ? prev + 1 : 0));
    };

    const handleStartGame = () => {
        // Parse time control
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
            position: 'relative',
            overflow: 'hidden'
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

            {/* ═══════════════════ HELP MODAL ═══════════════════ */}
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

            {/* ═══════════════════ TOP BAR ═══════════════════ */}
            <header style={{
                height: '56px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', borderBottom: '2px solid rgba(255,217,61,0.2)', position: 'relative', zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>♞</div>
                    <span style={{ fontWeight: '800', fontSize: '14px' }}>NEW GAME</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>v2.25</span>
                    <ThemeToggle />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={onOpenLearning} style={{
                        padding: '8px 16px', background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                        border: 'none', borderRadius: '16px', color: 'white', fontWeight: '700',
                        fontSize: '11px', cursor: 'pointer'
                    }}>📚 LEARN</button>
                    <button onClick={() => setShowLogin(true)} style={{
                        padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)', borderRadius: '16px',
                        color: 'white', fontWeight: '600', fontSize: '11px', cursor: 'pointer'
                    }}>👤 LOG IN</button>
                    <button onClick={onClose} style={{
                        width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)',
                        border: 'none', borderRadius: '10px', color: '#64748b', fontSize: '18px', cursor: 'pointer'
                    }}>×</button>
                </div>
            </header>

            {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ═══════════════════ LEFT PANEL ═══════════════════ */}
                <aside style={{
                    width: '260px', background: 'rgba(0,0,0,0.3)', padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    borderRight: '2px solid rgba(255,217,61,0.1)', overflowY: 'auto'
                }}>
                    {/* Profile */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255,217,61,0.15), rgba(255,159,67,0.1))',
                        borderRadius: '16px', padding: '16px', border: '2px solid rgba(255,217,61,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{
                                width: '44px', height: '44px', background: 'linear-gradient(135deg, #ffd93d, #ff9f43)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', fontWeight: '800', color: '#1a1a2e'
                            }}>WK</div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>HERO</div>
                                <div style={{ color: '#ffd93d', fontSize: '11px' }}>⭐ 1450</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{
                                background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffd93d' }}>1346</div>
                                <div style={{ color: '#22c55e', fontSize: '10px' }}>📈 +39</div>
                            </div>
                            <div style={{
                                background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: '800' }}>13</div>
                                <div style={{ color: '#64748b', fontSize: '10px' }}>🎮 games</div>
                            </div>
                        </div>
                    </div>

                    {/* Awards */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{
                            flex: 1, background: 'rgba(168,85,247,0.2)', borderRadius: '12px',
                            padding: '12px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '24px' }}>🎯</div>
                            <div style={{ fontSize: '9px', fontWeight: '600' }}>Tactician</div>
                        </div>
                        <div style={{
                            flex: 1, background: 'rgba(78,205,196,0.2)', borderRadius: '12px',
                            padding: '12px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '24px' }}>🔥</div>
                            <div style={{ fontSize: '9px', fontWeight: '600' }}>Streak x5</div>
                        </div>
                    </div>

                    {/* Next Lesson */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(34,197,94,0.1))',
                        borderRadius: '14px', padding: '14px', border: '2px solid rgba(78,205,196,0.2)'
                    }}>
                        <div style={{ fontSize: '10px', color: '#4ecdc4', fontWeight: '700', marginBottom: '10px' }}>
                            📅 NEXT LESSON
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px',
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <div style={{
                                background: '#ffd93d', borderRadius: '8px', padding: '6px 10px',
                                textAlign: 'center', color: '#1a1a2e'
                            }}>
                                <div style={{ fontSize: '8px', fontWeight: '700' }}>JAN</div>
                                <div style={{ fontSize: '16px', fontWeight: '800' }}>17</div>
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '12px' }}>ENDGAMES</div>
                                <div style={{ color: '#64748b', fontSize: '9px' }}>👩‍🏫 Coach Sarah</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Chat */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255,107,157,0.15), rgba(168,85,247,0.1))',
                        borderRadius: '14px', padding: '14px', border: '2px solid rgba(255,107,157,0.2)',
                        marginTop: 'auto'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{
                                width: '32px', height: '32px', background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                            }}>🤖</div>
                            <span style={{ fontWeight: '700', fontSize: '12px' }}>AI Helper</span>
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', fontSize: '12px'
                        }}>Hi! Need help? 🎉</div>
                    </div>
                </aside>

                {/* ═══════════════════ CENTER PANEL ═══════════════════ */}
                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '24px'
                }}>
                    {/* Title */}
                    <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 24px 0', textAlign: 'center' }}>
                        <span style={{ color: '#ffd93d' }}>WHITE KNIGHT</span>{' '}
                        <span style={{ color: '#64748b' }}>CASUAL</span>
                    </h1>

                    {/* Big Bot Button */}
                    <button onClick={handleNextBot} style={{
                        width: '180px', height: '180px',
                        background: `radial-gradient(circle, ${selectedBot.color}33 0%, transparent 70%)`,
                        border: `4px solid ${selectedBot.color}`, borderRadius: '50%',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', position: 'relative', boxShadow: `0 0 50px ${selectedBot.color}40`
                    }}>
                        <div style={{ fontSize: '70px' }}>{selectedBot.emoji}</div>
                        <div style={{
                            position: 'absolute', bottom: '-16px',
                            background: '#ffd93d', padding: '6px 20px', borderRadius: '20px',
                            color: '#1a1a2e', fontWeight: '800', fontSize: '13px'
                        }}>Rating: {selectedBot.rating}</div>
                    </button>

                    {/* Settings Grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px', width: '300px', marginTop: '40px'
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
                            <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '4px' }}>TIME</div>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                {timeControls.find(t => t.value === selectedTime)?.emoji} {selectedTime.replace('|0', 'm').replace('|', '+')}
                            </div>
                        </button>
                        <button onClick={() => setGameType(g => g === 'STANDARD' ? 'CHESS960' : 'STANDARD')} style={{
                            padding: '14px', background: 'rgba(255,255,255,0.05)',
                            border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                            cursor: 'pointer', textAlign: 'center', color: 'white'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '4px' }}>MODE</div>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                {gameType === 'STANDARD' ? '♟️' : '🎲'} {gameType === 'STANDARD' ? 'Standard' : '960'}
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
                            <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '4px' }}>SIDE</div>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                {selectedSide === 'WHITE' ? '⬜' : selectedSide === 'BLACK' ? '⬛' : '🎲'} {selectedSide}
                            </div>
                        </button>
                        <button onClick={handleNextBot} style={{
                            padding: '14px', background: 'rgba(255,255,255,0.05)',
                            border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                            cursor: 'pointer', textAlign: 'center', color: 'white'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '4px' }}>DIFF</div>
                            <div style={{ color: selectedBot.color, fontSize: '16px', fontWeight: '700' }}>
                                {selectedBot.emoji} {selectedBot.name}
                            </div>
                        </button>
                    </div>

                    {/* Start Button */}
                    <button onClick={handleStartGame} style={{
                        marginTop: '28px', padding: '18px 70px',
                        background: 'linear-gradient(90deg, #ffd93d, #ff9f43)',
                        border: 'none', borderRadius: '20px', color: '#1a1a2e',
                        fontWeight: '800', fontSize: '18px', cursor: 'pointer',
                        boxShadow: '0 6px 30px rgba(255,217,61,0.5)'
                    }}>▶ START GAME</button>
                </main>

                {/* ═══════════════════ RIGHT PANEL ═══════════════════ */}
                <aside style={{
                    width: '280px', background: 'rgba(0,0,0,0.3)', padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                    borderLeft: '2px solid rgba(255,217,61,0.1)', overflowY: 'auto'
                }}>
                    {/* Help Button */}
                    <button onClick={() => setShowHelp(true)} style={{
                        width: '100%', padding: '14px',
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2))',
                        border: '2px solid rgba(168,85,247,0.3)', borderRadius: '14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                        }}>🤔</div>
                        <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>NEW TO CHESS?</span>
                        <span style={{ marginLeft: 'auto', color: '#64748b' }}>›</span>
                    </button>

                    {/* Game Type */}
                    <div>
                        <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '8px' }}>⚙️ GAME TYPE</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['STANDARD', 'CHESS 960'].map(type => (
                                <button key={type} onClick={() => setGameType(type.replace(' ', ''))} style={{
                                    flex: 1, padding: '12px',
                                    background: gameType === type.replace(' ', '') ? '#ffd93d' : 'rgba(255,255,255,0.05)',
                                    border: 'none', borderRadius: '10px',
                                    color: gameType === type.replace(' ', '') ? '#1a1a2e' : 'white',
                                    fontWeight: '700', fontSize: '10px', cursor: 'pointer'
                                }}>{type === 'STANDARD' ? '♟️' : '🎲'} {type}</button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Slider */}
                    <div>
                        <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '8px' }}>🎯 DIFFICULTY</div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px' }}>
                            <input type="range" min="0" max={bots.length - 1} value={selectedBotIndex}
                                onChange={(e) => setSelectedBotIndex(parseInt(e.target.value))}
                                style={{
                                    width: '100%', height: '8px', borderRadius: '4px',
                                    background: 'linear-gradient(90deg, #4ecdc4, #ffd93d, #ef4444)',
                                    WebkitAppearance: 'none', cursor: 'pointer'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '8px' }}>
                                <span style={{ color: '#4ecdc4' }}>EASY</span>
                                <span style={{ color: '#ffd93d' }}>MEDIUM</span>
                                <span style={{ color: '#ef4444' }}>HARD</span>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px',
                                padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px'
                            }}>
                                <span style={{ fontSize: '24px' }}>{selectedBot.emoji}</span>
                                <span style={{ fontWeight: '700', fontSize: '12px' }}>{selectedBot.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Time Control */}
                    <div>
                        <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '8px' }}>⏱️ TIME</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                            {timeControls.map(time => (
                                <button key={time.value} onClick={() => setSelectedTime(time.value)} style={{
                                    padding: '10px 6px',
                                    background: selectedTime === time.value ? '#ffd93d' : 'rgba(255,255,255,0.05)',
                                    border: 'none', borderRadius: '10px',
                                    color: selectedTime === time.value ? '#1a1a2e' : 'white',
                                    fontWeight: '600', fontSize: '10px', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                                }}>
                                    <span style={{ fontSize: '14px' }}>{time.emoji}</span>
                                    <span>{time.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Side Selection */}
                    <div>
                        <div style={{ color: '#64748b', fontSize: '9px', marginBottom: '8px' }}>✨ PLAY AS</div>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            {[
                                { v: 'WHITE', e: '⬜' },
                                { v: 'RANDOM', e: '🎲' },
                                { v: 'BLACK', e: '⬛' }
                            ].map(s => (
                                <button key={s.v} onClick={() => setSelectedSide(s.v)} style={{
                                    flex: 1, padding: '12px', border: 'none',
                                    background: selectedSide === s.v ? '#4ecdc4' : 'transparent',
                                    color: selectedSide === s.v ? '#1a1a2e' : 'white',
                                    fontWeight: '700', fontSize: '10px', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                                }}>
                                    <span style={{ fontSize: '16px' }}>{s.e}</span>
                                    <span>{s.v}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
