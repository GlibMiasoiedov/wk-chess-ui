import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { playMoveSound, playSound as playRealSound } from '../utils/ChessSounds';

/**
 * Enhanced ChessBoard (v2.1)
 * Integrates Sound Effects, Illegal Move Feedback, and Strict Validation.
 * FIX: Removed Debug Overlay to prevent React Error #130.
 */
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

    // Internal state for visual feedback
    const [errorSquares, setErrorSquares] = useState({});

    // 👇 Counter for force re-render
    const [renderKey, setRenderKey] = useState(0);
    const prevPositionRef = useRef(position);

    const normalizedPlayerColor = playerColor;

    // 👇 Detect position change and force re-render
    useEffect(() => {
        if (position !== prevPositionRef.current) {
            prevPositionRef.current = position;
            setRenderKey(k => k + 1);
        }
    }, [position]);

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

    // --- VISUAL FEEDBACK HELPERS ---

    const flashError = useCallback((square) => {
        if (!square) return;
        playRealSound('check'); // Error sound

        setErrorSquares(prev => ({ ...prev, [square]: { backgroundColor: 'rgba(255, 0, 0, 0.5)' } }));
        setTimeout(() => {
            setErrorSquares(prev => {
                const next = { ...prev };
                delete next[square];
                return next;
            });
        }, 400);
    }, []);

    const flashKing = useCallback((gameFen) => {
        try {
            const tempGame = new Chess(gameFen || position);
            const turn = tempGame.turn();
            const board = tempGame.board();
            let kingSquare = null;

            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = board[r][c];
                    if (piece && piece.type === 'k' && piece.color === turn) {
                        kingSquare = piece.square;
                    }
                }
            }
            if (kingSquare) flashError(kingSquare);
        } catch (e) {
            console.warn('[ChessBoard] Failed to flash king', e);
        }
    }, [position, flashError]);


    // --- STYLES ---

    const customSquareStyles = useMemo(() => {
        const styles = { ...errorSquares }; // Start with errors (high priority)

        if (highlightSquares?.length) {
            highlightSquares.forEach(sq => {
                if (sq && !styles[sq]) { // Don't override error
                    styles[sq] = { backgroundColor: 'rgba(186, 166, 121, 0.55)' };
                }
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
    }, [highlightSquares, moveHintSquares, errorSquares]);

    // --- HANDLERS ---

    const onPieceDragBegin = useCallback((piece, sourceSquare) => {
        if (showMoveHints && getValidMoves) {
            const valid = getValidMoves(sourceSquare);
            if (valid?.length) setMoveHintSquares(valid);
        }
    }, [showMoveHints, getValidMoves]);

    const onPieceDragEnd = useCallback(() => {
        setMoveHintSquares([]);
    }, []);

    const onDrop = useCallback((dropData, targetArg, pieceArg) => {
        // FIX v1.17: react-chessboard v5.x API compatibility
        let source, target, piece;

        if (typeof dropData === 'object' && dropData !== null && dropData.sourceSquare) {
            source = dropData.sourceSquare;
            target = dropData.targetSquare;
            piece = dropData.piece?.pieceType || dropData.piece;
        } else {
            source = dropData;
            target = targetArg;
            piece = pieceArg;
        }

        setMoveHintSquares([]);

        if (disabled) return false;

        // Strict Color Validation
        if (!allowAllColors) {
            const pieceCode = typeof piece === 'object' ? piece?.pieceType : piece;
            const pieceColor = (typeof pieceCode === 'string') ? pieceCode[0]?.toLowerCase() : null;
            if (pieceColor && pieceColor !== normalizedPlayerColor) return false;
        }

        // --- ENHANCED VALIDATION & SOUNDS ---
        let isMoveValidLocally = true;
        let moveDetails = null;
        let tempGame = null;

        try {
            const fen = position === 'start' ? undefined : position;
            tempGame = new Chess(fen);
            const moves = tempGame.moves({ verbose: true });
            moveDetails = moves.find(m => m.from === source && m.to === target);

            if (!moveDetails) {
                isMoveValidLocally = false;
            }
        } catch (e) {
            console.warn('[ChessBoard] Validation check failed', e);
        }

        if (onMove) {
            const result = onMove(source, target);
            const success = (result === true || result?.valid === true);

            if (success) {
                if (moveDetails) {
                    playMoveSound(moveDetails);
                } else {
                    playRealSound('move');
                }
                return true;
            } else {
                console.log('[ChessBoard] Move Rejected:', { source, target });
                flashError(source);

                if (tempGame && tempGame.in_check()) {
                    flashKing(position);
                }
                return false;
            }
        }

        return true;
    }, [disabled, allowAllColors, normalizedPlayerColor, onMove, position, flashError, flashKing]);

    const isDraggablePiece = useCallback(({ piece }) => {
        if (disabled) return false;
        if (allowAllColors) return true;
        const pieceColor = piece?.[0]?.toLowerCase();
        return pieceColor === normalizedPlayerColor;
    }, [disabled, allowAllColors, normalizedPlayerColor]);

    // Stable board ID
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
    if (prevProps.position !== nextProps.position) return false;
    if (prevProps.orientation !== nextProps.orientation) return false;
    return true;
});

export default ChessBoard;
