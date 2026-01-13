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
