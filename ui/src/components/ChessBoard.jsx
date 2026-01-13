import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Chessboard } from '../lib/react-chessboard';
import * as ReactChessboardLib from '../lib/react-chessboard';
console.log('=== LIBRARY DEBUG ===');
console.log('All exports:', Object.keys(ReactChessboardLib));
console.log('Chessboard:', ReactChessboardLib.Chessboard);
console.log('default:', ReactChessboardLib.default);

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ChessBoard ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: '#EF4444', padding: '20px', backgroundColor: '#1A1E26', borderRadius: '8px', border: '1px solid #EF4444' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>ChessBoard Crashed</h3>
                    <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

function ChessBoardInternal({
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
    const [currentPosition, setCurrentPosition] = useState(position);
    const [moveFrom, setMoveFrom] = useState(null);

    // Sync local state when prop changes
    useEffect(() => {
        if (position !== currentPosition) {
            console.log('[ChessBoard] Prop position changed, syncing:', position);
            setCurrentPosition(position);
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

    // Custom square styles
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
        // Highlight selected piece (moveFrom)
        if (moveFrom) {
            styles[moveFrom] = {
                ...(styles[moveFrom] || {}),
                backgroundColor: 'rgba(255, 255, 0, 0.4)'
            };
        }

        return styles;
    }, [highlightSquares, moveHintSquares, moveFrom]);

    // Click handler for "Click to Move"
    const onSquareClick = useCallback((square) => {
        if (disabled) return;

        // Visual feedback helper
        const highlightMoves = (sq) => {
            if (getValidMoves) {
                const moves = getValidMoves(sq);
                if (moves && moves.length > 0) {
                    setMoveHintSquares(moves);
                    return true;
                }
            }
            return false;
        };

        // Case 1: No piece selected yet
        if (!moveFrom) {
            const moves = getValidMoves ? getValidMoves(square) : [];
            if (moves && moves.length > 0) {
                setMoveFrom(square);
                setMoveHintSquares(moves);
            }
            return;
        }

        // Case 2: Piece already selected (moveFrom)

        // Attempt move
        if (onMove) {
            const result = onMove(moveFrom, square);
            if (result === true || result?.valid === true) {
                // Move successful
                setMoveFrom(null);
                setMoveHintSquares([]);
                return;
            }
        }

        // Move invalid.
        // Check if user clicked on another friendly piece (change selection)
        const moves = getValidMoves ? getValidMoves(square) : [];
        if (moves && moves.length > 0) {
            setMoveFrom(square);
            setMoveHintSquares(moves);
        } else {
            // Deselect
            setMoveFrom(null);
            setMoveHintSquares([]);
        }
    }, [disabled, moveFrom, getValidMoves, onMove]);

    // Handlers
    const onPieceDragBegin = useCallback((piece, sourceSquare) => {
        setMoveFrom(sourceSquare);
        if (showMoveHints && getValidMoves) {
            const moves = getValidMoves(sourceSquare);
            if (moves?.length) {
                const newSquares = {};
                moves.forEach((moveSq) => {
                    newSquares[moveSq] = {
                        background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                        borderRadius: '50%'
                    };
                });
                newSquares[sourceSquare] = { background: 'rgba(255, 255, 0, 0.4)' };
                setOptionSquares(newSquares);
            }
        }
    }, [showMoveHints, getValidMoves]);

    const onPieceDragEnd = useCallback(() => {
        setMoveFrom(null);
        setOptionSquares({});
    }, []);

    // FIX v1.28: react-chessboard v5.x passes single object
    const onDrop = useCallback((dropData) => {
        // v5.x passes single object: { piece, sourceSquare, targetSquare }
        const sourceSquare = dropData?.sourceSquare;
        const targetSquare = dropData?.targetSquare;
        const piece = dropData?.piece;

        console.log('[ChessBoard] onDrop:', { sourceSquare, targetSquare, piece });

        setMoveFrom(null); // Clear selection on drop
        setOptionSquares({});

        if (disabled) return false;

        // Color validation
        if (!allowAllColors) {
            // piece is object like { isSparePiece, position, pieceType }
            const pieceType = typeof piece === 'string' ? piece : piece?.pieceType;
            const pieceColor = pieceType?.[0]?.toLowerCase(); // 'bP' -> 'b'

            if (pieceColor && pieceColor !== playerColor) {
                console.log('[ChessBoard] Move rejected: wrong color', pieceColor, playerColor);
                return false;
            }
        }

        if (onMove && sourceSquare && targetSquare) {
            const result = onMove(sourceSquare, targetSquare);
            if (result === true) return true;
            if (result === false) return false;
            if (result?.valid === true) return true;
            return !!result;
        }
        return false;
    }, [disabled, allowAllColors, playerColor, onMove]);

    const isDraggablePiece = useCallback(({ piece }) => {
        if (disabled) return false;
        if (allowAllColors) return true;
        const pieceColor = piece?.[0]?.toLowerCase();
        return pieceColor === playerColor;
    }, [disabled, allowAllColors, playerColor]);

    const boardId = useMemo(() => `board-${Math.random().toString(36).substring(2, 9)}`, []);

    return (
        <div ref={containerRef} className="wk-chessboard-container" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
            {/* FIX: Props passed directly, NOT via options={{}} */}
            <Chessboard
                id={boardId}
                position={currentPosition}
                boardOrientation={orientation}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
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
                showBoardNotation={true}
                boardWidth={width}
            />
        </div>
    );
}

export default function ChessBoard(props) {
    return (
        <ErrorBoundary>
            <ChessBoardInternal {...props} />
        </ErrorBoundary>
    );
}