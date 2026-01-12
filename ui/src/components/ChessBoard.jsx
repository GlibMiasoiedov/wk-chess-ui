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
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748B' }}>v1.29</span>
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
    boardWidth,
    ...rest // Capture all other props
}) {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(400);
    const [moveHintSquares, setMoveHintSquares] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(position);

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
        return styles;
    }, [highlightSquares, moveHintSquares]);

    // Handlers
    const onPieceDragBegin = useCallback((piece, sourceSquare) => {
        if (showMoveHints && getValidMoves) {
            const valid = getValidMoves(sourceSquare);
            if (valid?.length) setMoveHintSquares(valid);
        }
    }, [showMoveHints, getValidMoves]);

    const onPieceDragEnd = useCallback(() => setMoveHintSquares([]), []);

    // FIX v1.28: react-chessboard v5.x onPieceDrop signature handles object
    const onDrop = useCallback((dropData) => {
        // Handle both signatures for robustness
        let sourceSquare, targetSquare, piece;

        if (typeof dropData === 'object' && dropData.sourceSquare) {
            // v5.x passes single object: { piece, sourceSquare, targetSquare }
            sourceSquare = dropData.sourceSquare;
            targetSquare = dropData.targetSquare;
            piece = dropData.piece;
        } else {
            // Fallback for (source, target, piece)
            sourceSquare = arguments[0];
            targetSquare = arguments[1];
            piece = arguments[2];
        }

        console.log('[ChessBoard] onDrop:', { sourceSquare, targetSquare, piece });

        setMoveHintSquares([]);

        if (disabled) return false;

        // Color validation
        if (!allowAllColors) {
            const pieceType = typeof piece === 'string' ? piece : piece?.pieceType;
            const pieceColor = pieceType?.[0]?.toLowerCase(); // 'wP' -> 'w'
            if (pieceColor && pieceColor !== playerColor) {
                console.log('[ChessBoard] Move rejected: wrong color', pieceColor, playerColor);
                return false;
            }
        }

        if (onMove) {
            const result = onMove(sourceSquare, targetSquare);
            if (result === true) return true;
            if (result === false) return false;
            if (result?.valid === true) return true;
            return !!result;
        }
        return true;
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
            <div style={{ position: 'absolute', top: 5, right: 5, color: 'lime', fontSize: '10px', pointerEvents: 'none' }}>v1.28</div>
            {/* FIX: Props passed directly, NOT via options={{}} */}
            <Chessboard
                id={boardId}
                position={currentPosition}
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
                showBoardNotation={true}
                boardWidth={width}
                // Pass through all other props to enable full v5 capabilities
                {...rest}
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