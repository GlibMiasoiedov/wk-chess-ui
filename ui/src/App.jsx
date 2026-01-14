import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import WhiteKnightNewGame from "./WhiteKnightNewGame";
import WhiteKnightGamePlay from "./WhiteKnightGamePlay";
import WhiteKnightAnalysis from "./WhiteKnightAnalysis";
import WhiteKnightLearningHub from "./WhiteKnightLearningHub";

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [gameSettings, setGameSettings] = useState({
    bot: null,
    timeControl: null,
    color: null,
  });
  const [gameData, setGameData] = useState(null);
  const [closeHovered, setCloseHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync game active state with WordPress popup
  useEffect(() => {
    if (window.WKChessUI) {
      window.WKChessUI.setGameActive(screen === 'playing');
    }
  }, [screen]);

  const handleStartGame = (settings) => {
    setGameSettings(settings);
    setGameData(null);
    setScreen('playing');
  };

  const handleGameEnd = (data) => {
    // Store game data for analysis
    console.log('[App] handleGameEnd called with:', data);
    setGameData(data);
    setScreen('analysis');
    console.log('[App] Screen set to analysis');

    // Save game stats to localStorage for session persistence (non-logged users)
    try {
      const existingStats = JSON.parse(localStorage.getItem('wk_session_stats') || '{"games": 0, "wins": 0, "losses": 0, "draws": 0, "rating": 1200}');

      // Determine result
      const result = data.result;
      let outcome = 'draw'; // default
      if (result?.winner) {
        outcome = result.winner === data.playerColor ? 'win' : 'loss';
      } else if (result?.reason === 'checkmate') {
        // If it's checkmate, the person who just moved won
        const lastMoverColor = data.moves?.length % 2 === 0 ? 'b' : 'w'; // odd moves = white last
        outcome = lastMoverColor === data.playerColor ? 'win' : 'loss';
      } else if (result?.reason === 'resignation') {
        outcome = result.loser === data.playerColor ? 'loss' : 'win';
      } else if (result?.reason === 'timeout') {
        outcome = result.loser === data.playerColor ? 'loss' : 'win';
      }

      // Update stats
      existingStats.games += 1;
      if (outcome === 'win') existingStats.wins += 1;
      if (outcome === 'loss') existingStats.losses += 1;
      if (outcome === 'draw') existingStats.draws += 1;

      // Proper Elo rating calculation
      const botRating = gameSettings?.bot?.rating || 1200;
      const myRating = existingStats.rating;
      const totalGames = existingStats.games;

      // K-Factor: 40 for new players (<30 games), 20 for established
      const K = totalGames < 30 ? 40 : 20;

      // Actual score: 1 for win, 0.5 for draw, 0 for loss
      const actualScore = outcome === 'win' ? 1 : (outcome === 'draw' ? 0.5 : 0);

      // Expected score based on rating difference
      // Formula: Ea = 1 / (1 + 10^((Rb - Ra) / 400))
      const expectedScore = 1 / (1 + Math.pow(10, (botRating - myRating) / 400));

      // New rating: New = Old + K * (Actual - Expected)
      const ratingChange = Math.round(K * (actualScore - expectedScore));
      existingStats.rating = myRating + ratingChange;

      // Clamp rating between 400 and 3000
      existingStats.rating = Math.max(400, Math.min(3000, existingStats.rating));

      console.log(`[App] Elo calculation: My ${myRating} vs Bot ${botRating}, Score: ${actualScore}, Expected: ${expectedScore.toFixed(3)}, Change: ${ratingChange}, New: ${existingStats.rating}`);

      localStorage.setItem('wk_session_stats', JSON.stringify(existingStats));
      console.log('[App] Session stats saved to localStorage:', existingStats);
    } catch (e) {
      console.error('[App] Error saving session stats:', e);
    }
  };

  const handleNewGame = () => {
    setGameData(null);
    setScreen('setup');
  };

  const handleOpenLearning = () => {
    setScreen('learning');
  };

  const handleClose = () => {
    console.log('Close button clicked');
    if (window.WKChessUI) {
      window.WKChessUI.close();
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0B0E14',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {screen === 'setup' && (
          <WhiteKnightNewGame
            onStartGame={handleStartGame}
            onOpenLearning={handleOpenLearning}
            isMobile={isMobile}
          />
        )}
        {screen === 'playing' && (
          <WhiteKnightGamePlay
            settings={gameSettings}
            onGameEnd={handleGameEnd}
            isMobile={isMobile}
          />
        )}
        {screen === 'analysis' && (
          <WhiteKnightAnalysis
            onNewGame={handleNewGame}
            isMobile={isMobile}
            gameData={gameData}
            settings={gameSettings}
          />
        )}
        {screen === 'learning' && (
          <WhiteKnightLearningHub
            onBack={handleNewGame}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}
