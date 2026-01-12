import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';

const ChessBoard = React.memo(function ChessBoardInternal({
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

    // 👇 Counter for force re-render
    const [renderKey, setRenderKey] = useState(0);
    const prevPositionRef = useRef(position);

    // 👇 Detect position change and force re-render
    useEffect(() => {
        if (position !== prevPositionRef.current) {
            console.log('[ChessBoard] Position CHANGED!', {
                from: prevPositionRef.current,
                to: position
            });
            prevPositionRef.current = position;
            setRenderKey(k => k + 1);
        }
    }, [position]);

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
        console.log('[ChessBoard] onDrop called:', { source, target, piece });
        setMoveHintSquares([]);

        if (disabled) {
            console.log('[ChessBoard] REJECTED: disabled');
            return false;
        }

        // Strict Color Validation
        if (!allowAllColors) {
            const pieceColor = piece?.[0]?.toLowerCase();
            if (pieceColor && pieceColor !== normalizedPlayerColor) {
                console.log('[ChessBoard] REJECTED: wrong color', { pieceColor, normalizedPlayerColor });
                return false;
            }
        }

        if (onMove) {
            const result = onMove(source, target);
            console.log('[ChessBoard] onMove result:', result);

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

    // Stable board ID
    const boardId = useMemo(() => `board-${Math.random().toString(36).substring(2, 9)}`, []);

    // 👇 Log every render
    console.log('[ChessBoard] RENDER:', {
        position: typeof position === 'string' ? position.substring(0, 50) : position,
        orientation,
        playerColor: normalizedPlayerColor,
        renderKey,
        disabled
    });

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
                zIndex: 100,
                background: 'rgba(0,0,0,0.7)',
                padding: '2px 6px',
                borderRadius: '4px'
            }}>
                v1.28
            </div>

            <Chessboard
                id={boardId}
                key={`${boardId}-${renderKey}`}
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
}, (prevProps, nextProps) => {
    // Custom comparison to find what changed
    const changes = [];
    Object.keys(nextProps).forEach(key => {
        if (prevProps[key] !== nextProps[key]) {
            changes.push(key);
            // Ignore function references or simple array refs if we want to be strict,
            // but for now let's just log them.
        }
    });

    if (changes.length > 0) {
        console.log('[ChessBoard] PROPS CHANGED causing render:', changes);
        return false; // Allow render
    }

    return true; // Prevent render if no changes
});

export default ChessBoard;
