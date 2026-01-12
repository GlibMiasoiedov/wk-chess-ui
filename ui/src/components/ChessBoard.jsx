import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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
    boardWidth
}) {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(400);
    const [moveHintSquares, setMoveHintSquares] = useState([]);

    // Expects 'w' or 'b' directly now
    const normalizedPlayerColor = playerColor;

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

    const width = boardWidth || containerWidth;

    // Custom Styles
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
    const onPieceDragBegin = useCallback((piece, sourceSquare) => {
        if (showMoveHints && getValidMoves) {
            const valid = getValidMoves(sourceSquare);
            if (valid?.length) setMoveHintSquares(valid);
        }
    }, [showMoveHints, getValidMoves]);

    const onPieceDragEnd = useCallback(() => {
        setMoveHintSquares([]);
    }, []);

    const onDrop = useCallback((source, target, piece) => {
        setMoveHintSquares([]);

        if (disabled) return false;

        // Strict Color Validation
        if (!allowAllColors) {
            const pieceColor = piece?.[0]?.toLowerCase();
            if (pieceColor && pieceColor !== normalizedPlayerColor) {
                return false;
            }
        }

        if (onMove) {
            const result = onMove(source, target);
            // Strict boolean return
            if (result === true) return true;
            if (result === false) return false;
            if (result?.valid === true) return true;
            if (result?.valid === false) return false;
            return !!result;
        }

        return true;
    }, [disabled, allowAllColors, normalizedPlayerColor, onMove]);

    const isDraggablePiece = useCallback(({ piece }) => {
        if (disabled) return false;
        if (allowAllColors) return true;
        const pieceColor = piece?.[0]?.toLowerCase();
        return pieceColor === normalizedPlayerColor;
    }, [disabled, allowAllColors, normalizedPlayerColor]);

    // Stable board ID (good practice, but not for forcing resets anymore)
    const boardId = useMemo(() => `board-${Math.random().toString(36).substring(2, 9)}`, []);

    return (
        <div
            ref={containerRef}
            className="wk-chessboard-container"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                ...style
            }}
        >
            <div style={{
                position: 'absolute',
                top: 5,
                right: 5,
                color: 'lime',
                fontSize: '10px',
                pointerEvents: 'none',
                zIndex: 100
            }}>
                v1.8 (Unified 'w'/'b') | {normalizedPlayerColor}
            </div>

            {/* DEBUG BUTTON KEPT FOR VERIFICATION */}
            <button
                onClick={() => {
                    const info = `Pos: ${typeof position === 'string' ? position : 'Obj'}\nColor: ${normalizedPlayerColor}`;
                    alert(info);
                }}
                style={{
                    position: 'absolute', top: 5, left: 5, zIndex: 1000,
                    fontSize: '10px', background: 'rgba(255,0,0,0.5)', color: 'white',
                    padding: '4px', border: 'none', borderRadius: '4px', pointerEvents: 'auto', cursor: 'pointer'
                }}
            >
                DEBUG
            </button>

            <Chessboard
                id={boardId}
                // REMOVED KEY PROP - relying on library to handle updates!
                boardWidth={width}
                position={position}
                boardOrientation={orientation}
                onPieceDrop={onDrop}
                onPieceDragBegin={onPieceDragBegin}
                onPieceDragEnd={onPieceDragEnd}
                isDraggablePiece={isDraggablePiece}
                customSquareStyles={customSquareStyles}
                customBoardStyle={{
                    borderRadius: '4px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    ...customBoardStyle
                }}
                customDarkSquareStyle={{ backgroundColor: '#779556' }}
                customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                animationDuration={200}
                arePiecesDraggable={!disabled}
            />
        </div>
    );
}
