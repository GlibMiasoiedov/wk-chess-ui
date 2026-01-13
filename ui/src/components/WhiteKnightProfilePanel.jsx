import React from 'react';
import {
    Trophy, Calendar, MessageSquare, TrendingUp,
    Award, CheckCircle2, Zap, User, Star
} from 'lucide-react';

/* [Integation Instruction]
   - Uses Tailwind CSS.
   - Panel width fixed w-[350px] on desktop, hidden on mobile (handled by parent or media queries).
   - Data sources are mocked for now as placeholders.
*/

// --- THEME CONSTANTS (Matching existing app) ---
const THEME = {
    bg: "bg-[#0B0E14]",         // Darkest background
    panel: "bg-[#151922]",      // Panel background
    panelBorder: "border-[#2A303C]", // Border color
    accent: "text-[#D4AF37]",   // Gold text
    accentBg: "bg-[#D4AF37]",   // Gold background
    textMain: "text-[#E2E8F0]", // Main text
    textMuted: "text-[#94A3B8]", // Muted text
};

export default function WhiteKnightProfilePanel({ isMobile }) {
    if (isMobile) return null; // Hidden on mobile for now

    return (
        // Panel Container
        <div className={`w-[320px] ${THEME.panel} border-r border-[#2A303C] flex flex-col shadow-2xl z-20 h-full`}>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {/* 1. PROFILE SUMMARY */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-[#2A303C] bg-[#1A1E26]/50 shadow-inner">
                    <div className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] relative">
                        WK
                        {/* Online Status */}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4ADE80] border-2 border-[#1A1E26] rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base">Hero User</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                Pro Member
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. STATS GRID */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Rating Card */}
                    <div className="bg-[#0B0E14] border border-[#2A303C] p-4 rounded-xl flex flex-col items-center hover:border-[#D4AF37]/30 transition-colors group cursor-pointer">
                        <span className="text-[#64748B] text-[10px] uppercase font-bold mb-1 tracking-wider group-hover:text-[#D4AF37] transition-colors">Rating</span>
                        <span className="text-white font-mono font-bold text-2xl">1450</span>
                        <span className="text-[#4ADE80] text-[10px] flex items-center gap-1 mt-1 bg-[#4ADE80]/10 px-1.5 rounded">
                            <TrendingUp size={12} /> +12
                        </span>
                    </div>
                    {/* Games Card */}
                    <div className="bg-[#0B0E14] border border-[#2A303C] p-4 rounded-xl flex flex-col items-center hover:border-[#D4AF37]/30 transition-colors group cursor-pointer">
                        <span className="text-[#64748B] text-[10px] uppercase font-bold mb-1 tracking-wider group-hover:text-[#D4AF37] transition-colors">Games</span>
                        <span className="text-white font-mono font-bold text-2xl">342</span>
                        <span className="text-[#94A3B8] text-[10px] mt-1">Total Played</span>
                    </div>
                </div>

                {/* 3. RECENT AWARDS */}
                <div>
                    <h4 className="text-[#64748B] text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2 pl-1">
                        <Trophy size={14} className="text-[#D4AF37]" /> Recent Awards
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#2A303C] bg-[#0B0E14] hover:border-[#D4AF37]/50 transition-all cursor-pointer group">
                            <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors"><Award size={18} /></div>
                            <div className="flex-1">
                                <p className="text-white text-xs font-bold group-hover:text-[#D4AF37] transition-colors">Tactical Master</p>
                                <p className="text-[#64748B] text-[10px]">Solved 50 puzzles</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#2A303C] bg-[#0B0E14] hover:border-[#4ADE80]/50 transition-all cursor-pointer group">
                            <div className="p-2 rounded-lg bg-[#4ADE80]/10 text-[#4ADE80] group-hover:bg-[#4ADE80] group-hover:text-black transition-colors"><CheckCircle2 size={18} /></div>
                            <div className="flex-1">
                                <p className="text-white text-xs font-bold group-hover:text-[#4ADE80] transition-colors">Winning Streak</p>
                                <p className="text-[#64748B] text-[10px]">Won 5 games in a row</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. SCHEDULE / NEXT LESSON */}
                <div className="bg-gradient-to-br from-[#1A1E26] to-[#0F1116] border border-[#D4AF37]/30 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Calendar size={80} /></div>

                    <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                        <Calendar size={14} /> Next Lesson
                    </h4>

                    <div className="flex gap-4 mb-4 relative z-10">
                        {/* Date Block */}
                        <div className="text-center bg-[#0B0E14] border border-[#D4AF37]/20 rounded-lg p-2 min-w-[60px] shadow-lg">
                            <span className="block text-[#64748B] text-[9px] uppercase font-bold tracking-wider">Oct</span>
                            <span className="block text-white text-2xl font-bold font-serif">24</span>
                        </div>

                        {/* Lesson Details */}
                        <div>
                            <p className="text-white text-sm font-bold leading-tight mb-1">Endgame Strategy</p>
                            <div className="flex items-center gap-1.5 mb-1">
                                <User size={10} className="text-[#D4AF37]" />
                                <p className="text-[#94A3B8] text-xs">GM Alexander</p>
                            </div>
                            <div className="inline-block bg-[#D4AF37]/10 px-2 py-0.5 rounded text-[#D4AF37] text-[10px] font-mono border border-[#D4AF37]/20">
                                18:00 - 19:00
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-2.5 rounded-lg border border-[#2A303C] text-[#94A3B8] text-[10px] uppercase font-bold hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all relative z-10">
                        Manage Schedule
                    </button>
                </div>

                {/* 5. AI COACH CHAT (Placeholder) */}
                <div className="bg-[#0B0E14] border border-[#2A303C] rounded-xl p-4 flex flex-col relative group hover:border-[#D4AF37]/50 transition-colors shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">
                                <Zap size={14} fill="currentColor" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-white block">AI Assistant</span>
                                <span className="text-[9px] text-[#4ADE80] flex items-center gap-1">Online <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></span></span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1E26] p-3 rounded-lg mb-3 border border-[#2A303C]/50">
                        <p className="text-[#94A3B8] text-xs italic leading-relaxed">
                            "Ready to warm up? I prepared a puzzle based on your last game!"
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ask a question..."
                            className="w-full bg-[#1A1E26] border border-[#2A303C] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#D4AF37] transition-colors"
                            disabled
                        />
                        <button className="p-2 bg-[#D4AF37] rounded-lg text-black hover:bg-[#C5A028] transition-colors shadow-lg shadow-[#D4AF37]/20">
                            <MessageSquare size={16} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
