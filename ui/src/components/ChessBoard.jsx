import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard({
    position = 'start',
    orientation = 'white',
    onMove = null,
    disabled = false,
    playerColor = 'w',
    highlightSquares = [],
    allowAllColors = false,
    style = {},
    customBoardStyle = {},
    showMoveHints = false,
    getValidMoves = null,
    boardWidth // passed from parent or calculated locally if missing
}) {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(400);
    const [moveHintSquares, setMoveHintSquares] = useState([]);

    // Responsive sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const size = Math.min(width, height);
                if (size > 0) setContainerWidth(size);
            }
        };

        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Width to use: prop or calculated
    const width = boardWidth || containerWidth;

    // Generate custom square styles
    const customSquareStyles = useMemo(() => {
        const styles = {};
        if (highlightSquares?.length) {
            highlightSquares.forEach(sq => {
                if (sq) styles[sq] = { backgroundColor: 'rgba(186, 166, 121, 0.55)' };
            });
        }
        if (moveHintSquares?.length) {
            moveHintSquares.forEach(sq => {
                if (sq) {
                    styles[sq] = {
                        ...styles[sq],
                        background: styles[sq]?.backgroundColor
                            ? `radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%), ${styles[sq].backgroundColor}`
                            : 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)',
                        backgroundSize: '100% 100%'
                    };
                }
            });
        }
        return styles;
    }, [highlightSquares, moveHintSquares]);

    // Handlers
    const onPieceDragBegin = (piece, sourceSquare) => {
        if (showMoveHints && getValidMoves) {
            const valid = getValidMoves(sourceSquare);
            if (valid?.length) setMoveHintSquares(valid);
        }
    };

    const onPieceDragEnd = () => setMoveHintSquares([]);

    const onDrop = (source, target, piece) => {
        setMoveHintSquares([]);
        if (disabled) return false;

        // Color validation
        if (!allowAllColors) {
            const pieceColor = piece?.[0]?.toLowerCase();
            if (pieceColor && pieceColor !== playerColor) return false;
        }

        if (onMove) {
            const result = onMove(source, target);
            return result !== false;
        }
        return true;
    };

    const isDraggablePiece = ({ piece }) => {
        if (disabled) return false;
        if (allowAllColors) return true;
        const pieceColor = piece?.[0]?.toLowerCase();
        return pieceColor === playerColor;
    };

    const boardId = useMemo(() => `board-${Math.random().toString(36).substring(2, 9)}`, []);

    return (
        <div ref={containerRef} className="wk-chessboard-container" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
            <div style={{ position: 'absolute', top: 5, right: 5, color: 'lime', fontSize: '10px', pointerEvents: 'none' }}>v9: RESTORED</div>
            <Chessboard
                id={boardId}
                boardWidth={width}
                position={position}
                boardOrientation={orientation}
                onPieceDrop={onDrop}
                onPieceDragBegin={onPieceDragBegin}
                onPieceDragEnd={onPieceDragEnd}
                isDraggablePiece={isDraggablePiece}
                customSquareStyles={customSquareStyles}
                customBoardStyle={customBoardStyle}
                customDarkSquareStyle={{ backgroundColor: '#779556' }}
                customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                animationDuration={200}
                arePiecesDraggable={!disabled}
                key={`${orientation}-${position}`} // Force Remount on critical changes
            />
        </div>
    );
}
