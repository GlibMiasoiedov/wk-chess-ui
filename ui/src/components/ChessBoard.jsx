import React, { useCallback, useMemo } from 'react';
import { Chessboard } from '../lib/react-chessboard';

/**
 * A simplified wrapper around react-chessboard v5.
 * Matches the official "Basic Example" pattern.
 * 
 * @param {string} position - FEN string
 * @param {function} onMove - Callback (source, target) => boolean
 * @param {string} orientation - 'white' or 'black'
 * @param {number} boardWidth - Optional width in pixels (parent should control size usually)
 * @param {object} props - Pass-through props for react-chessboard
 */
export default function ChessBoard({
    position = 'start',
    onMove,
    orientation = 'white',
    boardWidth,
    playerColor = 'w', // Used for validation if needed, though Strict Mode handles this logic
    disabled = false,
    ...rest
}) {
    // Adapter for onDrop to handle move logic
    const onPieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
        // console.log('[ChessBoard] onPieceDrop', { sourceSquare, targetSquare, piece });

        // v5 signature check: if first arg is object extraction
        if (typeof sourceSquare === 'object' && sourceSquare.sourceSquare) {
            const data = sourceSquare;
            // console.log('[ChessBoard] v5 Drop Data', data);
            if (onMove) {
                return onMove(data.sourceSquare, data.targetSquare);
            }
            return true;
        }

        // Standard signature
        if (onMove) {
            return onMove(sourceSquare, targetSquare, piece);
        }
        return true;
    }, [onMove]);

    // Simple container style - let parent control size
    const containerStyle = useMemo(() => ({
        width: boardWidth ? `${boardWidth}px` : '100%',
        height: boardWidth ? `${boardWidth}px` : '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }), [boardWidth]);

    return (
        <div className="wk-chessboard-wrapper" style={containerStyle}>
            <div style={{ position: 'absolute', top: 5, right: 5, color: '#4ADE80', fontSize: '10px', pointerEvents: 'none', zIndex: 10 }}>v1.30</div>
            <Chessboard
                id="WhiteKnightBoard"
                position={position}
                onPieceDrop={onPieceDrop}
                boardOrientation={orientation}
                boardWidth={boardWidth} // If undefined, library auto-resizes to container
                arePiecesDraggable={!disabled}
                animationDuration={200}
                customDarkSquareStyle={{ backgroundColor: '#779556' }}
                customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                customDropSquareStyle={{ boxShadow: 'inset 0 0 1px 6px rgba(212,175,55,0.4)' }} // Gold ring
                // Spread all other props (arrows, custom styles, etc.)
                {...rest}
            />
        </div>
    );
}