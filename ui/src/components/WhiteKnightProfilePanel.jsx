import React, { useState, useRef, useEffect } from 'react';
import {
  Trophy, Calendar, MessageSquare, TrendingUp,
  Award, CheckCircle2, Zap, User, Star, X, Send, ChevronRight,
  Loader2, Video, Link2
} from 'lucide-react';

/* [INTEGRATION GUIDE FOR DEVELOPERS]
   =================================================================================
   This component serves as the "Command Center" for the user. It aggregates 
   profile stats, gamification, schedule, AI assistance, AND EXTERNAL ACCOUNTS.
   
   FIXED FOR WORDPRESS EMBEDDING - v2.0
   - Strong CSS isolation with !important where needed
   - All styles scoped with .wkp- prefix
   - Flexbox/Grid with explicit properties
   =================================================================================
*/

// --- CSS STYLES - WORDPRESS SAFE ---
const cssStyles = `
  /* ============================================
     WK PROFILE PANEL - ISOLATED STYLES
     Prefix: .wkp- (WhiteKnight Profile)
     ============================================ */

  /* CSS Variables - Scoped */
  .wkp-root {
    --wkp-bg: #0B0E14;
    --wkp-panel: #151922;
    --wkp-border: #2A303C;
    --wkp-accent: #D4AF37;
    --wkp-accent-hover: #C5A028;
    --wkp-text-main: #F1F5F9; 
    --wkp-text-muted: #94A3B8; 
    --wkp-success: #4ADE80;
  }

  /* Animation */
  @keyframes wkp-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Reset & Container */
  .wkp-root,
  .wkp-root *,
  .wkp-root *::before,
  .wkp-root *::after {
    box-sizing: border-box !important;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
  }

  .wkp-root {
    all: initial;
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    height: 100% !important;
    background-color: var(--wkp-panel) !important;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: var(--wkp-text-main) !important;
    line-height: 1.5 !important;
    overflow: hidden !important;
    position: relative !important;
  }

  /* Scrollable Content */
  .wkp-scroll {
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 20px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
    scrollbar-width: thin;
    scrollbar-color: var(--wkp-border) var(--wkp-bg);
  }

  .wkp-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .wkp-scroll::-webkit-scrollbar-track {
    background: var(--wkp-bg);
  }
  .wkp-scroll::-webkit-scrollbar-thumb {
    background: var(--wkp-border);
    border-radius: 3px;
  }

  /* Connect Buttons Row */
  .wkp-connect-row {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .wkp-btn-connect {
    flex: 1 1 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    padding: 10px 8px !important;
    border-radius: 6px !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    border: 1px solid transparent !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    background: none !important;
  }

  .wkp-btn-chesscom {
    background-color: rgba(129, 182, 76, 0.1) !important;
    color: #81b64c !important;
    border-color: rgba(129, 182, 76, 0.2) !important;
  }
  .wkp-btn-chesscom:hover {
    background-color: rgba(129, 182, 76, 0.2) !important;
    border-color: #81b64c !important;
  }
  .wkp-btn-chesscom.connected {
    background-color: #81b64c !important;
    color: #fff !important;
  }

  .wkp-btn-lichess {
    background-color: rgba(255, 255, 255, 0.08) !important;
    color: #e0e0e0 !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
  }
  .wkp-btn-lichess:hover {
    background-color: rgba(255, 255, 255, 0.15) !important;
    border-color: #fff !important;
  }
  .wkp-btn-lichess.connected {
    background-color: #fff !important;
    color: #000 !important;
  }

  /* Profile Card */
  .wkp-profile-card {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 14px !important;
    border-radius: 10px !important;
    background: linear-gradient(145deg, #1A1E26 0%, #111 100%) !important;
    border: 1px solid var(--wkp-border) !important;
  }

  .wkp-avatar {
    width: 48px !important;
    height: 48px !important;
    min-width: 48px !important;
    border-radius: 50% !important;
    background: linear-gradient(135deg, var(--wkp-accent) 0%, #B39352 100%) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 700 !important;
    font-size: 16px !important;
    color: #000 !important;
    position: relative !important;
  }

  .wkp-status-dot {
    position: absolute !important;
    bottom: 0 !important;
    right: 0 !important;
    width: 12px !important;
    height: 12px !important;
    background-color: var(--wkp-success) !important;
    border: 2px solid #1A1E26 !important;
    border-radius: 50% !important;
  }

  .wkp-profile-info h3 {
    color: white !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    margin: 0 0 4px 0 !important;
    line-height: 1.2 !important;
  }

  .wkp-profile-meta {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
  }

  .wkp-elo {
    font-size: 10px !important;
    color: var(--wkp-text-muted) !important;
  }

  .wkp-badge {
    background: rgba(212,175,55,0.1) !important;
    color: var(--wkp-accent) !important;
    font-size: 9px !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
  }

  /* Stats Grid */
  .wkp-stats-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 10px !important;
  }

  .wkp-stat-box {
    background-color: var(--wkp-bg) !important;
    border: 1px solid var(--wkp-border) !important;
    padding: 12px !important;
    border-radius: 8px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    min-height: 70px !important;
    transition: border-color 0.2s ease !important;
  }

  .wkp-stat-box:hover {
    border-color: rgba(212, 175, 55, 0.4) !important;
  }

  .wkp-stat-label {
    color: var(--wkp-text-muted) !important;
    font-size: 9px !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
    margin-bottom: 4px !important;
  }

  .wkp-stat-value {
    color: var(--wkp-text-main) !important;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    line-height: 1.1 !important;
  }

  .wkp-trend {
    color: var(--wkp-success) !important;
    font-size: 9px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 2px !important;
    margin-top: 4px !important;
    background-color: rgba(74, 222, 128, 0.1) !important;
    padding: 2px 6px !important;
    border-radius: 3px !important;
  }

  .wkp-stat-sub {
    font-size: 9px !important;
    color: var(--wkp-text-muted) !important;
    margin-top: 4px !important;
  }

  /* Section Header */
  .wkp-section-header {
    color: var(--wkp-text-muted) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    margin-bottom: 8px !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
  }

  /* Awards Grid */
  .wkp-awards-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  .wkp-award-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
    padding: 12px 8px !important;
    border-radius: 8px !important;
    border: 1px solid var(--wkp-border) !important;
    background-color: var(--wkp-bg) !important;
    cursor: pointer !important;
    transition: border-color 0.2s ease !important;
  }

  .wkp-award-item:hover {
    border-color: rgba(212, 175, 55, 0.4) !important;
  }

  .wkp-award-icon {
    padding: 8px !important;
    border-radius: 6px !important;
    background-color: rgba(212, 175, 55, 0.1) !important;
    color: var(--wkp-accent) !important;
    margin-bottom: 6px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .wkp-award-icon.success {
    background-color: rgba(74, 222, 128, 0.1) !important;
    color: var(--wkp-success) !important;
  }

  .wkp-award-name {
    color: white !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }

  /* Schedule Card */
  .wkp-schedule-card {
    background: linear-gradient(180deg, #1A1E26 0%, #0F1116 100%) !important;
    border: 1px solid var(--wkp-border) !important;
    border-top: 3px solid var(--wkp-accent) !important;
    border-radius: 10px !important;
    padding: 16px !important;
    position: relative !important;
    overflow: hidden !important;
  }

  .wkp-schedule-bg {
    position: absolute !important;
    top: -10px !important;
    right: -15px !important;
    opacity: 0.03 !important;
    transform: rotate(15deg) !important;
    pointer-events: none !important;
    color: white !important;
  }

  .wkp-schedule-header {
    margin-bottom: 12px !important;
    position: relative !important;
    z-index: 10 !important;
  }

  .wkp-schedule-title {
    color: var(--wkp-accent) !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    margin-bottom: 2px !important;
  }

  .wkp-schedule-subtitle {
    color: var(--wkp-text-muted) !important;
    font-size: 10px !important;
    margin-left: 22px !important;
    line-height: 1.3 !important;
  }

  .wkp-schedule-subtitle span {
    color: var(--wkp-accent) !important;
    font-weight: 700 !important;
  }

  /* Category Tabs */
  .wkp-cat-tabs {
    display: flex !important;
    gap: 4px !important;
    margin-bottom: 12px !important;
    border-bottom: 1px solid var(--wkp-border) !important;
    padding-bottom: 10px !important;
    position: relative !important;
    z-index: 10 !important;
    overflow-x: auto !important;
  }

  .wkp-cat-tabs::-webkit-scrollbar {
    display: none !important;
  }

  .wkp-cat-tab {
    background: transparent !important;
    border: 1px solid transparent !important;
    color: var(--wkp-text-muted) !important;
    font-size: 9px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    cursor: pointer !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
  }

  .wkp-cat-tab:hover {
    color: var(--wkp-text-main) !important;
    background: rgba(255,255,255,0.05) !important;
  }

  .wkp-cat-tab.active {
    background-color: rgba(212, 175, 55, 0.15) !important;
    color: var(--wkp-accent) !important;
    border-color: rgba(212, 175, 55, 0.3) !important;
  }

  /* Event Row */
  .wkp-event-row {
    display: flex !important;
    gap: 12px !important;
    align-items: center !important;
    margin-bottom: 12px !important;
    position: relative !important;
    z-index: 10 !important;
  }

  .wkp-date-box {
    text-align: center !important;
    background-color: var(--wkp-bg) !important;
    border: 1px solid var(--wkp-border) !important;
    border-radius: 8px !important;
    padding: 8px !important;
    min-width: 50px !important;
  }

  .wkp-date-month {
    font-size: 9px !important;
    color: var(--wkp-text-muted) !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
    display: block !important;
  }

  .wkp-date-day {
    font-size: 20px !important;
    color: white !important;
    font-weight: 700 !important;
    display: block !important;
    margin-top: 2px !important;
  }

  .wkp-event-info h4 {
    color: var(--wkp-text-main) !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    margin: 0 0 4px 0 !important;
    line-height: 1.2 !important;
  }

  .wkp-event-meta {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    color: var(--wkp-text-muted) !important;
    font-size: 10px !important;
    flex-wrap: wrap !important;
  }

  .wkp-event-meta-item {
    display: inline-flex !important;
    align-items: center !important;
    gap: 3px !important;
  }

  .wkp-event-meta-divider {
    opacity: 0.3 !important;
  }

  /* Loading State */
  .wkp-loading {
    height: 70px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: var(--wkp-text-muted) !important;
  }

  .wkp-spin {
    animation: wkp-spin 1s linear infinite !important;
  }

  /* Empty State */
  .wkp-empty {
    text-align: center !important;
    padding: 16px 10px !important;
    color: var(--wkp-text-muted) !important;
    font-size: 11px !important;
    background: rgba(255,255,255,0.02) !important;
    border-radius: 6px !important;
    margin-bottom: 12px !important;
  }

  /* Book Button */
  .wkp-btn-book {
    width: 100% !important;
    padding: 10px !important;
    background-color: var(--wkp-accent) !important;
    color: black !important;
    border: none !important;
    border-radius: 6px !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    transition: background-color 0.2s ease !important;
    position: relative !important;
    z-index: 10 !important;
  }

  .wkp-btn-book:hover {
    background-color: var(--wkp-accent-hover) !important;
  }

  /* AI Chat Widget */
  .wkp-chat-widget {
    background-color: #0F1116 !important;
    border: 1px solid var(--wkp-border) !important;
    border-radius: 8px !important;
    padding: 12px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    transition: border-color 0.2s ease !important;
  }

  .wkp-chat-widget:hover {
    border-color: var(--wkp-accent) !important;
  }

  .wkp-chat-widget-left {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  }

  .wkp-chat-icon {
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    background: rgba(212,175,55,0.1) !important;
    color: var(--wkp-accent) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .wkp-chat-title {
    color: white !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    display: block !important;
  }

  .wkp-chat-subtitle {
    color: var(--wkp-text-muted) !important;
    font-size: 11px !important;
  }

  /* Modal Overlay */
  .wkp-modal-overlay {
    position: absolute !important;
    inset: 0 !important;
    background-color: rgba(0,0,0,0.85) !important;
    backdrop-filter: blur(4px) !important;
    z-index: 100 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 16px !important;
  }

  .wkp-modal {
    background-color: var(--wkp-panel) !important;
    border: 1px solid var(--wkp-border) !important;
    border-radius: 12px !important;
    padding: 20px !important;
    width: 100% !important;
    max-width: 280px !important;
  }

  .wkp-modal-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 16px !important;
  }

  .wkp-modal-title {
    color: white !important;
    font-weight: 700 !important;
    font-size: 14px !important;
  }

  .wkp-modal-close {
    background: none !important;
    border: none !important;
    color: var(--wkp-text-muted) !important;
    cursor: pointer !important;
    padding: 4px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .wkp-modal-close:hover {
    color: white !important;
  }

  .wkp-input-group {
    margin-bottom: 16px !important;
  }

  .wkp-input-label {
    display: block !important;
    color: var(--wkp-text-muted) !important;
    font-size: 10px !important;
    margin-bottom: 6px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
  }

  .wkp-text-input {
    width: 100% !important;
    background: var(--wkp-bg) !important;
    border: 1px solid var(--wkp-border) !important;
    border-radius: 6px !important;
    padding: 10px !important;
    color: white !important;
    font-size: 13px !important;
    font-family: inherit !important;
  }

  .wkp-text-input:focus {
    outline: none !important;
    border-color: var(--wkp-accent) !important;
  }

  .wkp-btn-primary {
    width: 100% !important;
    padding: 10px !important;
    background: var(--wkp-accent) !important;
    color: black !important;
    border: none !important;
    border-radius: 6px !important;
    font-weight: 700 !important;
    font-size: 11px !important;
    cursor: pointer !important;
    text-transform: uppercase !important;
  }

  .wkp-btn-primary:hover {
    background: var(--wkp-accent-hover) !important;
  }

  /* Chat Drawer */
  .wkp-chat-drawer {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 85% !important;
    background-color: #0F1116 !important;
    border-top: 1px solid var(--wkp-accent) !important;
    border-radius: 14px 14px 0 0 !important;
    transform: translateY(110%) !important;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    z-index: 100 !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .wkp-chat-drawer.open {
    transform: translateY(0) !important;
  }

  .wkp-drawer-header {
    padding: 14px !important;
    border-bottom: 1px solid var(--wkp-border) !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    background-color: #151922 !important;
    border-radius: 14px 14px 0 0 !important;
  }

  .wkp-drawer-header-left {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  }

  .wkp-drawer-avatar {
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    background: var(--wkp-accent) !important;
    color: black !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .wkp-drawer-title {
    color: white !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    display: block !important;
  }

  .wkp-drawer-status {
    font-size: 10px !important;
    color: var(--wkp-success) !important;
  }

  .wkp-drawer-close {
    background: none !important;
    border: none !important;
    color: var(--wkp-text-muted) !important;
    cursor: pointer !important;
    padding: 4px !important;
  }

  .wkp-chat-messages {
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    padding: 14px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    background-color: var(--wkp-bg) !important;
  }

  .wkp-msg {
    max-width: 85% !important;
    padding: 10px 12px !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
    border-radius: 10px !important;
  }

  .wkp-msg-bot {
    align-self: flex-start !important;
    background: #1A1E26 !important;
    color: var(--wkp-text-main) !important;
    border-radius: 10px 10px 10px 2px !important;
    border: 1px solid var(--wkp-border) !important;
  }

  .wkp-msg-user {
    align-self: flex-end !important;
    background: rgba(212,175,55,0.15) !important;
    color: white !important;
    border-radius: 10px 10px 2px 10px !important;
    border: 1px solid rgba(212,175,55,0.3) !important;
  }

  .wkp-chat-input-area {
    padding: 12px !important;
    background-color: #151922 !important;
    border-top: 1px solid var(--wkp-border) !important;
    display: flex !important;
    gap: 8px !important;
  }

  .wkp-chat-input {
    flex: 1 1 auto !important;
    background-color: #080A0F !important;
    border: 1px solid var(--wkp-border) !important;
    border-radius: 8px !important;
    padding: 10px 12px !important;
    font-size: 13px !important;
    color: white !important;
    font-family: inherit !important;
  }

  .wkp-chat-input:focus {
    outline: none !important;
    border-color: var(--wkp-accent) !important;
  }

  .wkp-btn-send {
    width: 40px !important;
    min-width: 40px !important;
    background-color: var(--wkp-accent) !important;
    border-radius: 8px !important;
    border: none !important;
    color: black !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .wkp-btn-send:hover {
    background-color: var(--wkp-accent-hover) !important;
  }

  /* Spacer */
  .wkp-spacer {
    height: 10px !important;
  }

  /* MEDIA QUERIES FOR SMALLER SCREENS (e.g. Laptops 1366x768) */
  @media (max-height: 900px) {
    .wkp-scroll {
      gap: 10px !important;
      padding: 14px !important;
    }
    .wkp-profile-card {
      padding: 10px !important;
      gap: 10px !important;
    }
    .wkp-avatar {
      width: 42px !important;
      height: 42px !important;
      min-width: 42px !important;
    }
    .wkp-profile-info h3 { font-size: 14px !important; }
    .wkp-stats-grid { gap: 8px !important; }
    .wkp-stat-box { 
      min-height: 60px !important; 
      padding: 8px !important; 
    }
    .wkp-stat-value { font-size: 18px !important; }
    .wkp-awards-grid { gap: 6px !important; }
    .wkp-award-item { padding: 8px !important; }
    .wkp-schedule-card { padding: 12px !important; }
    .wkp-schedule-bg { width: 60px !important; height: 60px !important; }
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

export default function WhiteKnightProfilePanel({ isMobile }) {
  const [userRating] = useState(1450);
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

  // Determine Category based on Rating
  useEffect(() => {
    let cat = 'trial';
    if (userRating > 0 && userRating < 1200) cat = 'beginner';
    else if (userRating >= 1200 && userRating < 1800) cat = 'middle';
    else if (userRating >= 1800) cat = 'elite';
    setActiveCategory(cat);
  }, [userRating]);

  // Fetch Events (Simulation)
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
      setLichessConnected(true);
    }
  };

  const nextEvent = events[0];

  return (
    <>
      <style>{cssStyles}</style>

      <div className="wkp-root">
        <div className="wkp-scroll">

          {/* Connect Buttons */}
          <div className="wkp-connect-row">
            <button
              className={`wkp-btn-connect wkp-btn-chesscom ${chesscomConnected ? 'connected' : ''}`}
              onClick={handleChesscomClick}
            >
              <Link2 size={12} />
              {chesscomConnected ? chesscomUsername : 'Chess.com'}
            </button>
            <button
              className={`wkp-btn-connect wkp-btn-lichess ${lichessConnected ? 'connected' : ''}`}
              onClick={handleLichessClick}
            >
              <Link2 size={12} />
              {lichessConnected ? 'Lichess ✓' : 'Lichess'}
            </button>
          </div>

          {/* Profile Card */}
          <div className="wkp-profile-card">
            <div className="wkp-avatar">
              WK
              <div className="wkp-status-dot"></div>
            </div>
            <div className="wkp-profile-info">
              <h3>Hero User</h3>
              <div className="wkp-profile-meta">
                <span className="wkp-elo">ELO {userRating}</span>
                <span className="wkp-badge">Pro</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="wkp-stats-grid">
            <div className="wkp-stat-box">
              <span className="wkp-stat-label">Rating</span>
              <span className="wkp-stat-value">{userRating}</span>
              <span className="wkp-trend">
                <TrendingUp size={10} /> +12
              </span>
            </div>
            <div className="wkp-stat-box">
              <span className="wkp-stat-label">Games</span>
              <span className="wkp-stat-value">342</span>
              <span className="wkp-stat-sub">Total</span>
            </div>
          </div>

          {/* Awards */}
          <div>
            <div className="wkp-section-header">
              <Trophy size={14} color="#D4AF37" /> Recent Awards
            </div>
            <div className="wkp-awards-grid">
              <div className="wkp-award-item">
                <div className="wkp-award-icon">
                  <Award size={18} />
                </div>
                <span className="wkp-award-name">Tactical Master</span>
              </div>
              <div className="wkp-award-item">
                <div className="wkp-award-icon success">
                  <CheckCircle2 size={18} />
                </div>
                <span className="wkp-award-name">Streak x5</span>
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="wkp-schedule-card">
            <div className="wkp-schedule-bg">
              <Video size={80} />
            </div>

            <div className="wkp-schedule-header">
              <div className="wkp-schedule-title">
                <Calendar size={16} /> Upcoming Live Lessons
              </div>
              <div className="wkp-schedule-subtitle">
                Online training with a <span>Real Human Coach</span>
              </div>
            </div>

            <div className="wkp-cat-tabs">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`wkp-cat-tab ${activeCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.slug)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="wkp-loading">
                <Loader2 className="wkp-spin" size={20} />
              </div>
            ) : nextEvent ? (
              <div className="wkp-event-row">
                <div className="wkp-date-box">
                  <span className="wkp-date-month">
                    {nextEvent.date.toLocaleString('en-US', { month: 'short' })}
                  </span>
                  <span className="wkp-date-day">
                    {nextEvent.date.getDate()}
                  </span>
                </div>
                <div className="wkp-event-info">
                  <h4>{nextEvent.title}</h4>
                  <div className="wkp-event-meta">
                    <span className="wkp-event-meta-item">
                      <User size={10} color="#D4AF37" /> {nextEvent.coach}
                    </span>
                    <span className="wkp-event-meta-divider">|</span>
                    <span>{nextEvent.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="wkp-empty">
                No upcoming lessons found for this level.
              </div>
            )}

            <button
              className="wkp-btn-book"
              onClick={() => window.open('https://whiteknight.academy/online-chess-lessons-calendar/', '_blank')}
            >
              Book Lesson <ChevronRight size={14} />
            </button>
          </div>

          {/* AI Chat Widget */}
          <div className="wkp-chat-widget" onClick={() => setIsChatOpen(true)}>
            <div className="wkp-chat-widget-left">
              <div className="wkp-chat-icon">
                <Zap size={16} fill="currentColor" />
              </div>
              <div>
                <span className="wkp-chat-title">AI Assistant</span>
                <span className="wkp-chat-subtitle">Need help? Ask me!</span>
              </div>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </div>

          <div className="wkp-spacer"></div>

        </div>

        {/* Chess.com Modal */}
        {showChesscomModal && (
          <div className="wkp-modal-overlay">
            <div className="wkp-modal">
              <div className="wkp-modal-header">
                <span className="wkp-modal-title">Link Chess.com</span>
                <button className="wkp-modal-close" onClick={() => setShowChesscomModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="wkp-input-group">
                <label className="wkp-input-label">Username or Profile URL</label>
                <input
                  type="text"
                  className="wkp-text-input"
                  placeholder="e.g. Hikaru"
                  value={chesscomUsername}
                  onChange={(e) => setChesscomUsername(e.target.value)}
                />
              </div>
              <button className="wkp-btn-primary" onClick={handleChesscomConnect}>
                Verify & Connect
              </button>
            </div>
          </div>
        )}

        {/* Chat Drawer */}
        <div className={`wkp-chat-drawer ${isChatOpen ? 'open' : ''}`}>
          <div className="wkp-drawer-header">
            <div className="wkp-drawer-header-left">
              <div className="wkp-drawer-avatar">
                <Zap size={16} fill="currentColor" />
              </div>
              <div>
                <span className="wkp-drawer-title">White Knight AI</span>
                <span className="wkp-drawer-status">● Online</span>
              </div>
            </div>
            <button className="wkp-drawer-close" onClick={() => setIsChatOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="wkp-chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={msg.sender === 'bot' ? 'wkp-msg wkp-msg-bot' : 'wkp-msg wkp-msg-user'}>
                {msg.text}
              </div>
            ))}
            <div ref={msgsEndRef} />
          </div>

          <div className="wkp-chat-input-area">
            <input
              type="text"
              className="wkp-chat-input"
              placeholder="Type your question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button className="wkp-btn-send" onClick={handleSendMessage}>
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
