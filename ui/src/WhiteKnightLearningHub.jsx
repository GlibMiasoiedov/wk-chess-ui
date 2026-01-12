import React, { useState, useEffect } from 'react';
import {
    BookOpen, Star, ChevronRight, RotateCcw,
    HelpCircle, CheckCircle2, AlertTriangle,
    Play, Lock, ArrowRight, X, List,
    Target, GraduationCap, Zap, Trophy, Shield,
    Layout, Sword, Clock, MousePointerClick,
    Crown, Sparkles, LayoutGrid, Save, XCircle, User, Plus, MessageCircle
} from 'lucide-react';

// --- THEME CONSTANTS ---
const THEME = {
    bg: '#0B0E14',
    panel: '#151922',
    panelBorder: '#2A303C',
    accent: '#D4AF37',
    textMain: '#E2E8F0',
    textMuted: '#94A3B8',
    success: '#4ADE80',
    error: '#EF4444',
};

// --- REAL CHESS PIECE IMAGES ---
const Piece = ({ type, color }) => {
    if (!type) return null;
    const c = color === 'w' ? 'l' : 'd';
    const t = type.toLowerCase();

    const url = `https://upload.wikimedia.org/wikipedia/commons/thumb/${c === 'l'
        ? { p: '4/45/Chess_plt45.svg', r: '7/72/Chess_rlt45.svg', n: '7/70/Chess_nlt45.svg', b: 'b/b1/Chess_blt45.svg', q: '1/15/Chess_qlt45.svg', k: '4/42/Chess_klt45.svg' }[t]
        : { p: 'c/c7/Chess_pdt45.svg', r: 'f/ff/Chess_rdt45.svg', n: 'e/ef/Chess_ndt45.svg', b: '9/98/Chess_bdt45.svg', q: '4/47/Chess_qdt45.svg', k: 'f/f0/Chess_kdt45.svg' }[t]
        }/100px-Chess_${t}${c}t45.svg.png`;

    return (
        <img
            src={url}
            alt={`${color} ${type}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.3))' }}
        />
    );
};

// --- DATA ---
const BASIC_MODULES = [
    { id: 'b1', title: "The Rook", icon: 'r', desc: "Moves in straight lines.", type: 'basics', progress: 100, stars: 3, status: 'completed' },
    { id: 'b2', title: "The Bishop", icon: 'b', desc: "Masters of diagonals.", type: 'basics', progress: 40, stars: 1, status: 'active' },
    { id: 'b3', title: "The Queen", icon: 'q', desc: "Ultimate power.", type: 'basics', progress: 0, stars: 0, status: 'locked' },
    { id: 'b4', title: "The Knight", icon: 'n', desc: "Jumping over obstacles.", type: 'basics', progress: 0, stars: 0, status: 'locked' },
    { id: 'b5', title: "The King", icon: 'k', desc: "Protect at all costs.", type: 'basics', progress: 0, stars: 0, status: 'locked' },
    { id: 'b6', title: "The Pawn", icon: 'p', desc: "Small but mighty.", type: 'basics', progress: 0, stars: 0, status: 'locked' },
];

const OPENING_MODULES = [
    { id: 'o1', title: "Opening Goals", desc: "Control center, develop pieces.", type: 'opening', iconComp: <Target size={20} />, progress: 100, status: "completed" },
    { id: 'o2', title: "Central Pawns", desc: "Why push e4/d4 first?", type: 'opening', iconComp: <Layout size={20} />, progress: 40, status: "active" },
    { id: 'o3', title: "Active Pieces", desc: "Knights before Bishops.", type: 'opening', iconComp: <Sword size={20} />, progress: 0, status: "locked" },
    { id: 'o4', title: "Tempo Rule", desc: "Don't move twice.", type: 'opening', iconComp: <Clock size={20} />, progress: 20, status: "review" },
    { id: 'o5', title: "Castling", desc: "King safety first.", type: 'opening', iconComp: <Shield size={20} />, progress: 0, status: "locked" },
];

const LESSON_ROOK = {
    instruction: "The Rook moves in straight lines. Capture the stars!",
    goal: "Capture all stars",
    board: {
        piece: { type: 'r', color: 'w', pos: [7, 0] }, // a1
        stars: [[7, 7], [0, 7]], // h1, h8
    }
};

const LESSON_OPENING = {
    instruction: "Occupying the center allows your pieces to move freely.",
    goal: "Control the center",
    correctMoves: ["e4", "d4"],
    passiveMoves: ["h3", "a3", "g3"],
};

export default function WhiteKnightLearningHub({ onBack, isMobile }) {
    const [view, setView] = useState('catalog');
    const [activeTab, setActiveTab] = useState('basics');

    const [activeModule, setActiveModule] = useState(null);
    const [lessonState, setLessonState] = useState('idle');
    const [feedback, setFeedback] = useState("");
    const [basicsBoard, setBasicsBoard] = useState(null);

    // Popups
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showAuthPopup, setShowAuthPopup] = useState(false);


    // States for hovering
    const [hoveredModule, setHoveredModule] = useState(null);
    const [hoveredTab, setHoveredTab] = useState(null);

    // --- ACTIONS ---
    const startModule = (module) => {
        setActiveModule(module);
        setView('lesson');
        resetLesson();
        if (module.type === 'basics') {
            setBasicsBoard({ ...LESSON_ROOK.board, stars: [...LESSON_ROOK.board.stars] });
        }
    };

    const resetLesson = () => {
        setLessonState('idle');
        setFeedback("");
        if (activeModule?.type === 'basics') {
            setBasicsBoard({ ...LESSON_ROOK.board, stars: [...LESSON_ROOK.board.stars] });
        }
    };

    const handleSquareClick = (r, c) => {
        if (!activeModule) return;

        if (activeModule.type === 'basics') {
            const [pr, pc] = basicsBoard.piece.pos;
            const isValid = (r === pr || c === pc) && !(r === pr && c === pc);

            if (!isValid) {
                setLessonState('illegal');
                setFeedback("Rooks move in straight lines only.");
                setTimeout(() => setLessonState('idle'), 1200);
                return;
            }

            const newStars = basicsBoard.stars.filter(s => !(s[0] === r && s[1] === c));
            const captured = newStars.length < basicsBoard.stars.length;

            setBasicsBoard({
                ...basicsBoard,
                piece: { ...basicsBoard.piece, pos: [r, c] },
                stars: newStars
            });

            if (captured) {
                const isComplete = newStars.length === 0;
                setFeedback(isComplete ? "Level Complete!" : "Star Captured!");
                setLessonState(isComplete ? 'success' : 'idle');
            } else {
                setLessonState('idle');
                setFeedback("");
            }
        } else {
            const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
            if (LESSON_OPENING.correctMoves.includes(squareName)) {
                setLessonState('success');
                setFeedback("Excellent! You control the center.");
            } else if (LESSON_OPENING.passiveMoves.includes(squareName)) {
                setLessonState('wrong');
                setFeedback("Too passive. Fight for the center!");
            } else {
                setLessonState('idle');
            }
        }
    };

    // --- STLYES ---
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
            padding: '0 24px',
            flexShrink: 0,
            zIndex: 50
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        },
        headerBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
            height: '36px'
        },
        headerBtnNewGame: {
            backgroundColor: '#1E232E',
            color: '#E2E8F0',
            border: '1px solid #2A303C',
        },
        headerBtnCoach: {
            backgroundColor: 'transparent',
            color: '#D4AF37',
            border: '1px solid #D4AF37',
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
        closeButton: {
            padding: '8px',
            color: '#64748B',
            background: 'transparent',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
        },
        content: {
            flex: 1,
            overflowY: 'auto',
            backgroundColor: THEME.bg,
            padding: isMobile ? '16px' : '48px',
        },
        moduleCard: (status, id) => ({
            position: 'relative',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid',
            borderColor: status === 'locked' ? '#1F2937' : hoveredModule === id ? 'rgba(212,175,55,0.5)' : '#2A303C',
            backgroundColor: status === 'locked' ? '#0B0E14' : '#151922',
            background: status === 'locked' ? '#0B0E14' : 'linear-gradient(to bottom, #151922, #0B0E14)',
            opacity: status === 'locked' ? 0.6 : 1,
            cursor: status === 'locked' ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '200px',
            boxShadow: hoveredModule === id && status !== 'locked' ? '0 0 30px rgba(212,175,55,0.08)' : 'none'
        })
    };

    const PersonalPlanBanner = () => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <div
                onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    background: 'linear-gradient(to right, #151922, #0F1116)',
                    borderLeft: `4px solid ${THEME.accent}`,
                    borderTop: '1px solid rgba(212,175,55,0.3)',
                    borderRight: '1px solid rgba(212,175,55,0.3)',
                    borderBottom: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isHovered ? '0 8px 30px rgba(212,175,55,0.15)' : '0 4px 20px rgba(0,0,0,0.2)',
                    transform: isHovered ? 'scale(1.01)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ backgroundColor: 'rgba(212,175,55,0.1)', padding: '12px', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.3)', color: THEME.accent }}>
                            <Crown size={24} />
                        </div>
                        <div>
                            <h4 style={{ color: THEME.accent, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Personal Plan <span style={{ backgroundColor: THEME.accent, color: 'black', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PRO</span>
                            </h4>
                            <p style={{ color: '#94A3B8', fontSize: '12px', lineHeight: 1.5, maxWidth: '400px' }}>
                                Get a customized training schedule with a <span style={{ color: 'white', fontWeight: 'bold' }}>Real Human Coach</span> tailored to your level.
                            </p>
                        </div>
                    </div>

                    {!isMobile && (
                        <button style={{ backgroundColor: THEME.accent, color: '#0f172a', fontWeight: 'bold', padding: '10px 24px', borderRadius: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transform: isHovered ? 'translateX(5px)' : 'none', transition: 'transform 0.3s' }}>
                            View Plan <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.container}>

            {/* HEADER */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.headerIconBox}>
                        <GraduationCap size={18} style={{ color: THEME.accent }} />
                    </div>
                    <span style={styles.headerTitle}>
                        Academy
                    </span>

                    {!isMobile && (
                        <>
                            <div style={{ height: '24px', width: '1px', backgroundColor: '#2A303C', margin: '0 8px' }}></div>

                            <button
                                onClick={onBack}
                                style={{ ...styles.headerBtn, ...styles.headerBtnNewGame }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.backgroundColor = '#2A303C'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A303C'; e.currentTarget.style.backgroundColor = '#1E232E'; }}
                            >
                                <Plus size={16} /> New Game
                            </button>

                            <button
                                onClick={() => window.open('https://whiteknight.academy/courses/', '_blank')}
                                style={{ ...styles.headerBtn, ...styles.headerBtnCoach }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <BookOpen size={16} /> Real Human Coach
                            </button>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        style={styles.closeButton}
                        onClick={() => setShowExitConfirm(true)}
                    >
                        <X size={24} />
                    </button>

                    <button
                        onClick={() => setShowAuthPopup(true)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#151922',
                            color: '#94A3B8',
                            border: '1px solid #2A303C',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}
                        className="hover:text-white hover:border-[#D4AF37]"
                    >
                        <Save size={16} /> Save
                    </button>
                </div>
            </div>

            {/* EXIT CONFIRM POPUP */}
            {showExitConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: '16px' }}>
                    <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', borderRadius: '16px', padding: '24px', maxWidth: '320px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', color: '#EF4444', marginBottom: '16px' }}>
                                <AlertTriangle size={32} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Unsaved Progress</h3>
                            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.5 }}>
                                If you exit now, your lesson progress may be lost. Save to keep your achievements!
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => { setShowExitConfirm(false); setShowAuthPopup(true); }}
                                style={{ width: '100%', backgroundColor: THEME.accent, color: 'black', fontWeight: 'bold', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px' }}
                            >
                                Stay & Save
                            </button>
                            <button
                                onClick={onBack}
                                style={{ width: '100%', backgroundColor: 'transparent', color: '#EF4444', fontWeight: 'bold', padding: '14px', borderRadius: '8px', border: '1px solid #EF4444', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px' }}
                            >
                                Confirm Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUTH POPUP */}
            {showAuthPopup && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', padding: '16px' }}>
                    <div style={{ backgroundColor: '#151922', border: '1px solid #2A303C', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '100%', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <button onClick={() => setShowAuthPopup(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <XCircle size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(212,175,55,0.3)' }}>
                                <Lock size={32} style={{ color: '#D4AF37' }} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px', fontFamily: 'serif' }}>Save Your Progress</h2>
                            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.5 }}>
                                To access all Academy features and save your progress, please register or log in.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                <input type="email" placeholder="Email address" style={{ width: '100%', backgroundColor: '#0B0E14', border: '1px solid #2A303C', padding: '14px 14px 14px 40px', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '14px' }} />
                            </div>
                            <button style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0f172a', fontWeight: 'bold', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', transition: 'transform 0.1s', transform: 'scale(1)' }}>
                                Create Account / Log In
                            </button>
                            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '12px', marginTop: '8px' }}>
                                Already have an account? <span style={{ color: '#D4AF37', cursor: 'pointer', fontWeight: 'bold' }}>Sign In</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT */}
            {view === 'catalog' ? (
                <div style={styles.content}>

                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: '48px', gap: '24px' }}>
                            <div>
                                <h1 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 'bold', fontFamily: 'serif', color: 'white', marginBottom: '16px', letterSpacing: '-0.02em' }}>Academy</h1>
                                <p style={{ color: '#94A3B8', fontSize: '16px', lineHeight: 1.6, maxWidth: '500px' }}>
                                    Master the game through interactive challenges. Start with the basics or dive into advanced strategies.
                                </p>
                            </div>

                            {/* Tab Switcher */}
                            <div style={{ display: 'flex', backgroundColor: '#151922', padding: '6px', borderRadius: '16px', border: `1px solid ${THEME.panelBorder}`, width: isMobile ? '100%' : 'auto' }}>
                                {['basics', 'opening'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        onMouseEnter={() => setHoveredTab(tab)}
                                        onMouseLeave={() => setHoveredTab(null)}
                                        style={{
                                            flex: isMobile ? 1 : 'none',
                                            padding: '14px 32px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            backgroundColor: activeTab === tab ? (tab === 'basics' ? THEME.accent : 'white') : 'transparent',
                                            color: activeTab === tab ? 'black' : (hoveredTab === tab ? 'white' : '#94A3B8'),
                                            transition: 'all 0.2s',
                                            boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                    >
                                        {tab === 'basics' ? <GraduationCap size={18} /> : <BookOpen size={18} />}
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <PersonalPlanBanner />

                        {/* Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                            {(activeTab === 'basics' ? BASIC_MODULES : OPENING_MODULES).map(m => (
                                <div
                                    key={m.id}
                                    style={styles.moduleCard(m.status, m.id)}
                                    onClick={() => m.status !== 'locked' && startModule(m)}
                                    onMouseEnter={() => setHoveredModule(m.id)}
                                    onMouseLeave={() => setHoveredModule(null)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '16px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: m.status === 'locked' ? '#1A1E26' : '#0B0E14',
                                            border: '1px solid',
                                            borderColor: m.status === 'locked' ? '#2A303C' : (hoveredModule === m.id ? THEME.accent : '#2A303C'),
                                            color: m.status === 'locked' ? '#64748B' : THEME.accent,
                                            transition: 'all 0.3s'
                                        }}>
                                            {m.type === 'basics'
                                                ? <div style={{ width: '40px', height: '40px' }}><Piece type={m.icon} color="w" /></div>
                                                : m.iconComp
                                            }
                                        </div>

                                        {m.status === 'completed' && <div style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ADE80', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(74, 222, 128, 0.2)' }}><CheckCircle2 size={12} /> DONE</div>}
                                        {m.status === 'locked' && <Lock size={18} color="#4B5563" />}
                                    </div>

                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'serif', color: m.status === 'locked' ? '#64748B' : 'white', marginBottom: '8px' }}>{m.title}</h3>
                                    <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px', flex: 1, borderTop: '1px solid #2A303C', paddingTop: '12px' }}>{m.desc}</p>

                                    {m.status !== 'locked' && (
                                        <div style={{ marginTop: 'auto' }}>
                                            {m.type === 'basics' ? (
                                                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0B0E14', padding: '8px', borderRadius: '8px', border: `1px solid ${THEME.panelBorder}`, width: 'fit-content' }}>
                                                    {[1, 2, 3].map(s => (
                                                        <Star key={s} size={14} fill={s <= m.stars ? THEME.accent : '#1F2937'} color={s <= m.stars ? THEME.accent : '#1F2937'} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ backgroundColor: '#0B0E14', padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.panelBorder}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                                                        <span>Progress</span>
                                                        <span style={{ color: 'white' }}>{m.progress}%</span>
                                                    </div>
                                                    <div style={{ height: '6px', width: '100%', backgroundColor: '#1F2937', borderRadius: '99px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${m.progress}%`, backgroundColor: m.status === 'completed' ? '#4ADE80' : THEME.accent, borderRadius: '99px' }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // LESSON VIEW
                <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '0', overflow: 'hidden' }}>

                    {/* BOARD AREA */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: '#0B0E14', position: 'relative' }}>

                        {/* Breadcrumb Mobile */}
                        {isMobile && (
                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <button onClick={() => setView('catalog')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back
                                </button>
                                <span style={{ color: THEME.accent, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{activeModule.title}</span>
                            </div>
                        )}

                        <div style={{ width: '100%', maxWidth: '600px', aspectRatio: '1/1', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.7)', border: '8px solid #151922', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}>
                                {[...Array(64)].map((_, i) => {
                                    const r = Math.floor(i / 8);
                                    const c = i % 8;
                                    const isBlack = (r + c) % 2 === 1;

                                    let content = null;
                                    let overlay = null;

                                    if (activeModule.type === 'basics' && basicsBoard) {
                                        const isPiece = r === basicsBoard.piece.pos[0] && c === basicsBoard.piece.pos[1];
                                        const isStar = basicsBoard.stars.some(s => s[0] === r && s[1] === c);

                                        if (isPiece) content = <div style={{ width: '100%', height: '100%', padding: '4px', zIndex: 20 }}><Piece type={basicsBoard.piece.type} color={basicsBoard.piece.color} /></div>;
                                        if (isStar) content = <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><Star size={32} fill={THEME.accent} color={THEME.accent} style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.6))' }} /></div>;
                                    } else {
                                        // Simple Opening Demo
                                        if (r === 6 && c === 4) content = <div style={{ width: '100%', height: '100%', padding: '4px', opacity: lessonState === 'success' ? 0 : 1, transition: 'opacity 0.5s' }}><Piece type="p" color="w" /></div>;
                                        if (r === 4 && c === 4) {
                                            if (lessonState === 'success') content = <div style={{ width: '100%', height: '100%', padding: '4px' }}><Piece type="p" color="w" /></div>;
                                        }
                                    }

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => handleSquareClick(r, c)}
                                            style={{
                                                backgroundColor: isBlack ? '#2F3746' : '#9CA3AF',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                position: 'relative', cursor: 'pointer'
                                            }}
                                        >
                                            {content}
                                            {/* Coords */}
                                            {c === 0 && <span style={{ position: 'absolute', top: 2, left: 4, fontSize: '9px', fontWeight: 'bold', opacity: 0.6, color: isBlack ? 'white' : 'black' }}>{8 - r}</span>}
                                            {r === 7 && <span style={{ position: 'absolute', bottom: 0, right: 4, fontSize: '9px', fontWeight: 'bold', opacity: 0.6, color: isBlack ? 'white' : 'black' }}>{String.fromCharCode(97 + c)}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div style={{ width: isMobile ? '100%' : '480px', backgroundColor: '#151922', borderLeft: `1px solid ${THEME.panelBorder}`, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.5)', zIndex: 20 }}>

                        {/* Sidebar Header */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #2A303C', display: 'flex', items: 'center', justifyContent: 'space-between', backgroundColor: '#1A1E26' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#0B0E14', border: '1px solid #2A303C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.accent }}>
                                    {activeModule.type === 'basics' ? <div style={{ width: '24px', height: '24px' }}><Piece type="r" color="w" /></div> : <Target size={20} />}
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>{activeModule.type === 'basics' ? 'Piece Mastery' : 'Strategy'}</span>
                                    <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{activeModule.title}</span>
                                </div>
                            </div>

                            {!isMobile && (
                                <button onClick={() => setView('catalog')} style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#0B0E14', border: '1px solid #2A303C', color: '#94A3B8', cursor: 'pointer' }}>
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Sidebar Content */}
                        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

                            {/* Mission Card */}
                            <div style={{ background: 'linear-gradient(135deg, #1A1E26, #0B0E14)', border: '1px solid #2A303C', borderRadius: '16px', padding: '24px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: THEME.accent }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: THEME.accent, marginBottom: '12px' }}>
                                    <MousePointerClick size={18} />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Mission</span>
                                </div>
                                <p style={{ fontSize: '20px', fontFamily: 'serif', color: '#E2E8F0', lineHeight: 1.5 }}>
                                    {activeModule.type === 'basics' ? LESSON_ROOK.goal : LESSON_OPENING.goal}
                                </p>
                            </div>

                            {/* Feedback Area */}
                            {lessonState === 'idle' && (
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ backgroundColor: '#2A303C', padding: '10px', borderRadius: '50%', color: '#94A3B8', flexShrink: 0 }}><BookOpen size={20} /></div>
                                    <div>
                                        <h4 style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Instructions</h4>
                                        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6 }}>{activeModule.type === 'basics' ? LESSON_ROOK.instruction : LESSON_OPENING.instruction}</p>
                                    </div>
                                </div>
                            )}

                            {lessonState === 'success' && (
                                <div style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '16px', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', padding: '6px', borderRadius: '50%', color: '#4ADE80' }}><CheckCircle2 size={16} /></div>
                                        <span style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: '16px' }}>Brilliant!</span>
                                    </div>
                                    <p style={{ color: '#E2E8F0', fontSize: '14px', marginBottom: '20px' }}>{feedback || "Level Complete!"}</p>
                                    <button style={{ width: '100%', backgroundColor: '#4ADE80', color: 'black', fontWeight: 'bold', padding: '16px', borderRadius: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Next Level <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}

                            {(lessonState === 'wrong' || lessonState === 'illegal') && (
                                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '6px', borderRadius: '50%', color: '#EF4444' }}><AlertTriangle size={16} /></div>
                                        <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '16px' }}>Oops!</span>
                                    </div>
                                    <p style={{ color: '#E2E8F0', fontSize: '14px', marginBottom: '20px' }}>{feedback}</p>
                                    <button onClick={resetLesson} style={{ width: '100%', backgroundColor: '#2A303C', color: 'white', fontWeight: 'bold', padding: '16px', borderRadius: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <RotateCcw size={16} /> Retry
                                    </button>
                                </div>
                            )}

                        </div>

                        {/* Helper Footer */}
                        <div style={{ padding: '24px', borderTop: '1px solid #2A303C', backgroundColor: '#0B0E14' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', backgroundColor: '#151922', border: '1px solid #2A303C', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ backgroundColor: 'rgba(212,175,55,0.1)', padding: '10px', borderRadius: '50%', color: THEME.accent }}><Zap size={18} /></div>
                                    <div>
                                        <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Need help?</p>
                                        <p style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>Ask a Real Coach</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} color="#64748B" />
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
