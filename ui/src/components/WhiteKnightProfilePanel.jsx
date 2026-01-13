import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Trophy, Calendar, MessageSquare, TrendingUp,
  Award, CheckCircle2, Zap, User, Star, X, Send, ChevronRight,
  Loader2, Video, Link2, Globe, ExternalLink, Unlink
} from 'lucide-react';

/* [INTEGRATION GUIDE FOR DEVELOPERS]
   =================================================================================
   This component serves as the "Command Center" for the user. It aggregates 
   profile stats, gamification, schedule, AI assistance, AND EXTERNAL ACCOUNTS.

   1. EXTERNAL ACCOUNTS INTEGRATION (Chess.com & Lichess)
      ------------------------------------------------------------------------------
      A) CHESS.COM (Public API - No OAuth)
         - **Endpoint:** `https://api.chess.com/pub/player/{username}/stats`
         - **Logic:**
           1. User enters username.
           2. Fetch public stats to verify existence.
           3. Save username to your DB linked to this user.
           4. **Note:** You cannot verify email ownership via API. This is a "soft link".
         - **Caching:** Cache responses for at least 1-2 hours (headers contain ETag).

      B) LICHESS (OAuth 2.0 - Recommended)
         - **Docs:** https://lichess.org/api#tag/OAuth
         - **Flow:**
           1. Redirect user to Lichess Authorization URL.
           2. Handle callback code in your backend.
           3. Exchange code for Access Token.
           4. Fetch user profile `https://lichess.org/api/account`.
           5. Save token/profile to your DB.
         - **Visuals:** The UI below simulates the "Connected" state showing Ratings.

   2. UPCOMING LIVE LESSONS (Calendar Integration)
      - **API Endpoint:** `https://whiteknight.academy/wp-json/tribe/events/v1/events`
      - **Method:** GET
      - **Logic:** Filter by user category slug. Show nearest future event.

   3. USER PROFILE & STATS
      - **Source:** Your User Database.

   4. AI ASSISTANT
      - **UI:** Expandable drawer.

   5. STYLING
      - Scoped CSS (.wk-) to prevent WordPress theme conflicts.
   =================================================================================
*/

// --- CSS STYLES ---
const cssStyles = `
  :root {
    --wk-bg: #0B0E14;
    --wk-panel: #151922;
    --wk-border: #2A303C;
    --wk-accent: #D4AF37;
    --wk-accent-hover: #C5A028;
    --wk-text-main: #F1F5F9; 
    --wk-text-muted: #94A3B8; 
    --wk-success: #4ADE80;
    --wk-shadow-glow: 0 0 15px rgba(212, 175, 55, 0.1);
  }

  /* SAFETY ANIMATION for Loader2 */
  @keyframes wk-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin { animation: wk-spin 1s linear infinite; }

  .wk-wrapper, .wk-wrapper * { box-sizing: border-box; }
  
  .wk-wrapper {
    height: 100vh;
    background-color: var(--wk-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    font-family: sans-serif;
  }

  .wk-panel {
    width: 500px;
    height: 95vh;
    background-color: var(--wk-panel);
    border: 1px solid var(--wk-border);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    position: relative;
  }

  .wk-scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--wk-border) var(--wk-bg);
  }

  /* 1. Profile Card */
  .wk-card-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 12px;
    background: linear-gradient(145deg, #1A1E26 0%, #111 100%);
    border: 1px solid var(--wk-border);
  }

  .wk-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--wk-accent) 0%, #B39352 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 20px;
    color: #000;
    position: relative;
    box-shadow: var(--wk-shadow-glow);
  }

  .wk-status-dot {
    position: absolute;
    bottom: 0; right: 0;
    width: 14px; height: 14px;
    background-color: var(--wk-success);
    border: 2px solid #1A1E26;
    border-radius: 50%;
  }

  /* 2. Stats Grid */
  .wk-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .wk-stat-box {
    background-color: var(--wk-bg);
    border: 1px solid var(--wk-border);
    padding: 12px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 90px;
    transition: all 0.2s;
  }
  .wk-stat-box:hover {
    border-color: rgba(212, 175, 55, 0.4);
    background-color: #12141A;
  }

  .wk-label-mini {
    color: var(--wk-text-muted);
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }

  .wk-value-large {
    color: var(--wk-text-main);
    font-family: monospace;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
  }

  .wk-trend {
    color: var(--wk-success);
    font-size: 10px;
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 4px;
    background-color: rgba(74, 222, 128, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }

  /* --- CONNECT ACCOUNTS (Top Bar) --- */
  .wk-connect-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
    width: 100%;
  }

  .wk-btn-connect {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px; /* Increased gap for better spacing */
    padding: 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800; /* Bolder text */
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    line-height: 1;
    text-align: center;
  }

  /* Chess.com Style */
  .wk-btn-chesscom {
    background-color: rgba(129, 182, 76, 0.1);
    color: #81b64c;
    border-color: rgba(129, 182, 76, 0.2);
  }
  .wk-btn-chesscom:hover {
    background-color: rgba(129, 182, 76, 0.2);
    border-color: #81b64c;
  }
  .wk-btn-chesscom.connected {
    background-color: #81b64c;
    color: #fff;
    border-color: #81b64c;
  }
  .wk-btn-chesscom.connected:hover {
    background-color: #6a963e; /* Darker green on hover for disconnect hint */
  }

  /* Lichess Style */
  .wk-btn-lichess {
    background-color: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    border-color: rgba(255, 255, 255, 0.2);
  }
  .wk-btn-lichess:hover {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: #fff;
  }
  .wk-btn-lichess.connected {
    background-color: #fff;
    color: #000;
    border-color: #fff;
  }
  .wk-btn-lichess.connected:hover {
    background-color: #e0e0e0;
  }

  /* MODAL FOR CHESS.COM */
  .wk-modal-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }
  
  .wk-modal {
    background-color: var(--wk-panel);
    border: 1px solid var(--wk-border);
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 320px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    position: relative;
    animation: slideUp 0.2s ease-out;
  }

  .wk-modal-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  }
  .wk-modal-title { color: white; font-weight: bold; font-size: 16px; }
  
  .wk-input-group { margin-bottom: 16px; }
  .wk-input-label { display: block; color: var(--wk-text-muted); font-size: 11px; margin-bottom: 6px; font-weight: bold; text-transform: uppercase; }
  .wk-text-input {
    width: 100%; background: #0B0E14; border: 1px solid var(--wk-border);
    border-radius: 8px; padding: 10px; color: white; font-size: 14px;
  }
  .wk-text-input:focus { outline: none; border-color: var(--wk-accent); }

  .wk-btn-primary {
    width: 100%; padding: 10px; background: var(--wk-accent); color: black;
    border: none; border-radius: 8px; font-weight: bold; font-size: 12px;
    cursor: pointer; text-transform: uppercase;
  }
  .wk-btn-primary:hover { background: var(--wk-accent-hover); }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }


  /* 3. Awards */
  .wk-awards-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .wk-award-item-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid var(--wk-border);
    background-color: var(--wk-bg);
    cursor: pointer;
    transition: all 0.2s;
  }
  .wk-award-item-compact:hover { border-color: rgba(212, 175, 55, 0.4); }
  
  .wk-award-icon-box {
    padding: 10px;
    border-radius: 8px;
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--wk-accent);
    margin-bottom: 6px;
  }

  /* 4. Schedule Card */
  .wk-schedule-card {
    background: linear-gradient(180deg, #1A1E26 0%, #0F1116 100%);
    border: 1px solid var(--wk-border);
    border-top: 3px solid var(--wk-accent);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.3);
  }
  
  .wk-schedule-bg {
    position: absolute;
    top: -10px; right: -20px;
    opacity: 0.05;
    transform: rotate(15deg);
    pointer-events: none;
    color: white;
  }

  .wk-schedule-header-group {
    margin-bottom: 20px;
    position: relative;
    z-index: 10;
  }

  .wk-schedule-title {
    color: var(--wk-accent);
    font-size: 15px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .wk-schedule-subtitle {
    color: var(--wk-text-muted);
    font-size: 13px; /* Increased font size */
    margin-left: 26px; 
    line-height: 1.4;
  }

  .wk-cat-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--wk-border);
    padding-bottom: 12px;
    position: relative; z-index: 10;
  }
  .wk-cat-tab {
    background: transparent;
    border: 1px solid transparent;
    color: var(--wk-text-muted);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .wk-cat-tab:hover { color: var(--wk-text-main); background: rgba(255,255,255,0.05); }
  .wk-cat-tab.active { 
    background-color: rgba(212, 175, 55, 0.15); 
    color: var(--wk-accent); 
    border-color: rgba(212, 175, 55, 0.3);
  }

  .wk-event-row {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 20px;
    position: relative; z-index: 10;
  }
  
  .wk-date-box-sm {
    text-align: center;
    background-color: var(--wk-bg);
    border: 1px solid var(--wk-border);
    border-radius: 12px;
    padding: 12px;
    min-width: 64px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  }
  
  .wk-event-info h4 {
    color: var(--wk-text-main);
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px 0;
    line-height: 1.3;
  }
  
  .wk-event-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--wk-text-muted);
    font-size: 12px;
  }

  .wk-btn-book {
    width: 100%;
    padding: 12px;
    background-color: var(--wk-accent);
    color: black;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
    position: relative; z-index: 10;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
  }
  .wk-btn-book:hover { 
    background-color: var(--wk-accent-hover); 
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
  }

  /* 5. AI Chat Widget */
  .wk-chat-widget {
    background-color: #0F1116;
    border: 1px solid var(--wk-border);
    border-radius: 12px;
    padding: 18px; /* Increased padding */
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: border-color 0.2s;
  }
  .wk-chat-widget:hover { border-color: var(--wk-accent); }

  /* Drawer & Chat */
  .wk-chat-drawer {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 85%;
    background-color: #0F1116;
    border-top: 1px solid var(--wk-accent);
    border-radius: 20px 20px 0 0;
    transform: translateY(110%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 100;
    display: flex; flex-direction: column;
  }
  .wk-chat-drawer.open { transform: translateY(0); }
  
  .wk-chat-header {
    padding: 18px;
    border-bottom: 1px solid var(--wk-border);
    display: flex; justify-content: space-between; align-items: center;
    background-color: #151922;
    border-radius: 20px 20px 0 0;
  }
  
  .wk-chat-body {
    flex: 1; overflow-y: auto; padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
    background-color: #0B0E14;
  }
  
  .wk-msg { 
    max-width: 85%; padding: 12px 16px; font-size: 14px; /* Increased font */
    line-height: 1.5;
  }
  .wk-msg-bot {
    align-self: flex-start; background: #1A1E26; color: var(--wk-text-main);
    border-radius: 12px 12px 12px 2px; border: 1px solid var(--wk-border);
  }
  .wk-msg-user {
    align-self: flex-end; background: rgba(212,175,55,0.15); color: white;
    border-radius: 12px 12px 2px 12px; border: 1px solid rgba(212,175,55,0.3);
  }

  .wk-chat-input-area {
    padding: 18px; background-color: #151922; border-top: 1px solid var(--wk-border);
    display: flex; gap: 10px;
  }
  
  .wk-input {
    flex: 1;
    background-color: #080A0F;
    border: 1px solid var(--wk-border);
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 15px; /* Increased font */
    color: white;
    transition: all 0.2s;
  }
  .wk-input:focus {
    outline: none;
    border-color: var(--wk-accent);
    background-color: #000;
    box-shadow: 0 0 0 1px var(--wk-accent);
  }

  .wk-btn-icon {
    width: 48px;
    background-color: var(--wk-accent);
    border-radius: 10px; border: none; color: black;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
`;

// --- DATA LOGIC ---
const CATEGORIES = [
  { id: 'beginner', label: 'Beginner', slug: 'beginner' },
  { id: 'middle', label: 'Middle', slug: 'middle' },
  { id: 'elite', label: 'Elite', slug: 'elite' },
  { id: 'trial', label: 'Trial', slug: 'trial' },
];

const MOCK_EVENTS = [
  { id: 1, title: 'Chess Basics: The Fork', date: new Date(Date.now() + 86400000), coach: 'GM Alex', category: 'beginner' },
  { id: 2, title: 'Advanced Endgames', date: new Date(Date.now() + 172800000), coach: 'IM Sarah', category: 'middle' },
  { id: 3, title: 'Grandmaster Prep', date: new Date(Date.now() + 259200000), coach: 'GM Magnus', category: 'elite' },
  { id: 4, title: 'Free Trial Class', date: new Date(Date.now() + 43200000), coach: 'Coach Mike', category: 'trial' },
];

export default function WhiteKnightProfilePanel() {
  const [userRating, setUserRating] = useState(1450); // Mock user rating
  const [activeCategory, setActiveCategory] = useState('middle');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // External Accounts State
  const [lichessConnected, setLichessConnected] = useState(false);
  const [chesscomConnected, setChesscomConnected] = useState(false);
  const [chesscomUsername, setChesscomUsername] = useState("");
  const [showChesscomModal, setShowChesscomModal] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hello! Ready for your game? Or do you need a quick warmup puzzle?" }
  ]);
  const msgsEndRef = useRef(null);

  // 1. Determine Category based on Rating
  useEffect(() => {
    let cat = 'trial';
    if (userRating > 0 && userRating < 1200) cat = 'beginner';
    else if (userRating >= 1200 && userRating < 1800) cat = 'middle';
    else if (userRating >= 1800) cat = 'elite';

    setActiveCategory(cat);
  }, [userRating]);

  // 2. Fetch Events (Simulation)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const filtered = MOCK_EVENTS.filter(e => e.category === activeCategory);
      setEvents(filtered);
      setLoading(false);
    }, 600);
  }, [activeCategory]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'user', text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: "I'm analyzing that..." }]);
    }, 1000);
  };

  useEffect(() => {
    if (isChatOpen) msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handleChesscomClick = () => {
    if (chesscomConnected) {
      if (window.confirm("Are you sure you want to disconnect Chess.com?")) {
        setChesscomConnected(false);
        setChesscomUsername("");
      }
    } else {
      setShowChesscomModal(true);
    }
  };

  const handleChesscomConnect = () => {
    if (chesscomUsername.trim().length > 2) {
      setChesscomConnected(true);
      setShowChesscomModal(false);
    }
  };

  const handleLichessClick = () => {
    if (lichessConnected) {
      if (window.confirm("Are you sure you want to disconnect Lichess?")) {
        setLichessConnected(false);
      }
    } else {
      // Simulate OAuth
      setLichessConnected(true);
    }
  };

  const nextEvent = events[0];

  return (
    <>
      <style>{cssStyles}</style>

      <div className="wk-wrapper">
        <div className="wk-panel">

          <div className="wk-scroll-content">

            {/* --- NEW: CONNECT BAR (CENTERED CONTENT) --- */}
            <div className="wk-connect-bar">
              <button
                className={`wk-btn-connect wk-btn-chesscom ${chesscomConnected ? 'connected' : ''}`}
                onClick={handleChesscomClick}
              >
                <Link2 size={12} /> {chesscomConnected ? chesscomUsername : 'Connect Chess.com'}
              </button>
              <button
                className={`wk-btn-connect wk-btn-lichess ${lichessConnected ? 'connected' : ''}`}
                onClick={handleLichessClick}
              >
                <Link2 size={12} /> {lichessConnected ? 'Lichess Linked' : 'Connect Lichess'}
              </button>
            </div>

            {/* HEADER */}
            <div className="wk-card-profile">
              <div className="wk-avatar">
                WK
                <div className="wk-status-dot"></div>
              </div>
              <div>
                <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>Hero User</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--wk-text-muted)' }}>ELO {userRating}</span>
                  <span style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--wk-accent)', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Pro</span>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="wk-grid-2">
              <div className="wk-stat-box">
                <span className="wk-label-mini">Rating</span>
                <span className="wk-value-large">{userRating}</span>
                <span className="wk-trend"><TrendingUp size={10} /> +12</span>
              </div>
              <div className="wk-stat-box">
                <span className="wk-label-mini">Games</span>
                <span className="wk-value-large">342</span>
                <span style={{ fontSize: '10px', color: 'var(--wk-text-muted)', marginTop: '4px' }}>Total</span>
              </div>
            </div>

            {/* AWARDS */}
            <div>
              <h4 style={{ color: 'var(--wk-text-muted)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={14} color="var(--wk-accent)" /> Recent Awards
              </h4>
              <div className="wk-awards-row">
                <div className="wk-award-item-compact">
                  <div className="wk-award-icon-box"><Award size={20} /></div>
                  <p style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Tactical Master</p>
                </div>
                <div className="wk-award-item-compact">
                  <div className="wk-award-icon-box" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--wk-success)' }}><CheckCircle2 size={20} /></div>
                  <p style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Streak x5</p>
                </div>
              </div>
            </div>

            {/* NEXT LESSON */}
            <div className="wk-schedule-card">
              <div className="wk-schedule-bg"><Video size={100} /></div>

              <div className="wk-schedule-header-group">
                <div className="wk-schedule-title">
                  <Calendar size={18} /> Upcoming Live Lessons
                </div>
                <div className="wk-schedule-subtitle">
                  Online training with a <span style={{ color: 'var(--wk-accent)', fontWeight: 'bold' }}>Real Human Coach</span>
                </div>
              </div>

              <div className="wk-cat-tabs">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`wk-cat-tab ${activeCategory === cat.slug ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.slug)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wk-text-muted)' }}>
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : nextEvent ? (
                <div className="wk-event-row">
                  <div className="wk-date-box-sm">
                    <span style={{ fontSize: '10px', color: 'var(--wk-text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>
                      {nextEvent.date.toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '24px', color: 'white', fontWeight: 'bold', display: 'block', marginTop: '2px' }}>
                      {nextEvent.date.getDate()}
                    </span>
                  </div>
                  <div className="wk-event-info">
                    <h4>{nextEvent.title}</h4>
                    <div className="wk-event-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} color="var(--wk-accent)" /> {nextEvent.coach}</span>
                      <span style={{ opacity: 0.3 }}>|</span>
                      <span>{nextEvent.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--wk-text-muted)', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '16px' }}>
                  No upcoming lessons found for this level.
                </div>
              )}

              <button className="wk-btn-book" onClick={() => window.open('https://whiteknight.academy/online-chess-lessons-calendar/', '_blank')}>
                Book Lesson <ChevronRight size={16} />
              </button>
            </div>

            {/* AI CHAT WIDGET */}
            <div className="wk-chat-widget" onClick={() => setIsChatOpen(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', color: 'var(--wk-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} fill="currentColor" />
                </div>
                <div>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', display: 'block' }}>AI Assistant</span>
                  <span style={{ color: 'var(--wk-text-muted)', fontSize: '12px' }}>Need help? Ask me!</span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--wk-text-muted)" />
            </div>

            <div style={{ minHeight: '10px' }}></div>

          </div>

          {/* --- MODAL FOR CHESS.COM --- */}
          {showChesscomModal && (
            <div className="wk-modal-overlay">
              <div className="wk-modal">
                <div className="wk-modal-header">
                  <span className="wk-modal-title">Link Chess.com</span>
                  <button onClick={() => setShowChesscomModal(false)} style={{ background: 'none', border: 'none', color: 'var(--wk-text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="wk-input-group">
                  <label className="wk-input-label">Username or Profile URL</label>
                  <input
                    type="text"
                    className="wk-text-input"
                    placeholder="e.g. Hikaru"
                    value={chesscomUsername}
                    onChange={(e) => setChesscomUsername(e.target.value)}
                  />
                </div>
                <button className="wk-btn-primary" onClick={handleChesscomConnect}>
                  Verify & Connect
                </button>
              </div>
            </div>
          )}

          {/* --- DRAWER --- */}
          <div className={`wk-chat-drawer ${isChatOpen ? 'open' : ''}`}>
            <div className="wk-chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--wk-accent)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} fill="currentColor" />
                </div>
                <div>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', display: 'block' }}>White Knight AI</span>
                  <span style={{ fontSize: '11px', color: 'var(--wk-success)' }}>● Online</span>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--wk-text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div className="wk-chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={msg.sender === 'bot' ? 'wk-msg wk-msg-bot' : 'wk-msg wk-msg-user'}>
                  {msg.text}
                </div>
              ))}
              <div ref={msgsEndRef} />
            </div>

            <div className="wk-chat-input-area">
              <input
                type="text"
                className="wk-input"
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="wk-btn-icon" onClick={handleSendMessage}>
                <Send size={20} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
