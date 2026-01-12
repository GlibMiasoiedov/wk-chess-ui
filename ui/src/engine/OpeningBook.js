/**
 * OpeningBook.js - Chess opening recognition
 * Identifies common chess openings from move sequences
 */

// Opening book database - maps move sequences to opening names
const OPENINGS = {
    // Queen's Pawn Openings
    "d4": { name: "Queen's Pawn Game", eco: "A40" },
    "d4 d5": { name: "Closed Game", eco: "D00" },
    "d4 d5 c4": { name: "Queen's Gambit", eco: "D06" },
    "d4 d5 c4 e6": { name: "Queen's Gambit Declined", eco: "D30" },
    "d4 d5 c4 c6": { name: "Slav Defense", eco: "D10" },
    "d4 d5 c4 dxc4": { name: "Queen's Gambit Accepted", eco: "D20" },
    "d4 d5 c4 e6 Nc3 Nf6": { name: "Queen's Gambit Declined", eco: "D37" },
    "d4 d5 c4 c6 Nf3 Nf6 Nc3": { name: "Semi-Slav Defense", eco: "D43" },

    // King's Pawn Openings
    "e4": { name: "King's Pawn Game", eco: "B00" },
    "e4 e5": { name: "Open Game", eco: "C20" },
    "e4 e5 Nf3": { name: "King's Knight Opening", eco: "C40" },
    "e4 e5 Nf3 Nc6": { name: "King's Knight Opening", eco: "C44" },
    "e4 e5 Nf3 Nc6 Bb5": { name: "Ruy Lopez", eco: "C60" },
    "e4 e5 Nf3 Nc6 Bb5 a6": { name: "Ruy Lopez, Morphy Defense", eco: "C78" },
    "e4 e5 Nf3 Nc6 Bc4": { name: "Italian Game", eco: "C50" },
    "e4 e5 Nf3 Nc6 Bc4 Bc5": { name: "Giuoco Piano", eco: "C53" },
    "e4 e5 Nf3 Nc6 Bc4 Nf6": { name: "Two Knights Defense", eco: "C55" },
    "e4 e5 Nf3 Nf6": { name: "Petrov Defense", eco: "C42" },
    "e4 e5 Nf3 d6": { name: "Philidor Defense", eco: "C41" },
    "e4 e5 d4": { name: "Center Game", eco: "C21" },
    "e4 e5 Bc4": { name: "Bishop's Opening", eco: "C23" },
    "e4 e5 f4": { name: "King's Gambit", eco: "C30" },
    "e4 e5 Nc3": { name: "Vienna Game", eco: "C25" },

    // Sicilian Defense
    "e4 c5": { name: "Sicilian Defense", eco: "B20" },
    "e4 c5 Nf3": { name: "Sicilian Defense, Open", eco: "B27" },
    "e4 c5 Nf3 d6": { name: "Sicilian Defense", eco: "B50" },
    "e4 c5 Nf3 d6 d4": { name: "Sicilian Defense, Open", eco: "B54" },
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3": { name: "Sicilian Najdorf", eco: "B90" },
    "e4 c5 Nf3 Nc6": { name: "Sicilian Defense", eco: "B30" },
    "e4 c5 Nf3 e6": { name: "Sicilian Defense", eco: "B40" },
    "e4 c5 c3": { name: "Sicilian, Alapin Variation", eco: "B22" },

    // French Defense
    "e4 e6": { name: "French Defense", eco: "C00" },
    "e4 e6 d4": { name: "French Defense", eco: "C01" },
    "e4 e6 d4 d5": { name: "French Defense", eco: "C10" },
    "e4 e6 d4 d5 Nc3": { name: "French Defense, Classical", eco: "C11" },
    "e4 e6 d4 d5 e5": { name: "French Defense, Advance", eco: "C02" },
    "e4 e6 d4 d5 exd5": { name: "French Defense, Exchange", eco: "C01" },

    // Caro-Kann Defense
    "e4 c6": { name: "Caro-Kann Defense", eco: "B10" },
    "e4 c6 d4": { name: "Caro-Kann Defense", eco: "B12" },
    "e4 c6 d4 d5": { name: "Caro-Kann Defense", eco: "B12" },
    "e4 c6 d4 d5 Nc3": { name: "Caro-Kann, Classical", eco: "B18" },
    "e4 c6 d4 d5 e5": { name: "Caro-Kann, Advance", eco: "B12" },

    // Other defenses
    "e4 d5": { name: "Scandinavian Defense", eco: "B01" },
    "e4 d6": { name: "Pirc Defense", eco: "B07" },
    "e4 g6": { name: "Modern Defense", eco: "B06" },
    "e4 Nf6": { name: "Alekhine Defense", eco: "B02" },

    // Indian Defenses
    "d4 Nf6": { name: "Indian Defense", eco: "A45" },
    "d4 Nf6 c4": { name: "Indian Defense", eco: "A50" },
    "d4 Nf6 c4 g6": { name: "King's Indian Defense", eco: "E60" },
    "d4 Nf6 c4 g6 Nc3": { name: "King's Indian Defense", eco: "E61" },
    "d4 Nf6 c4 g6 Nc3 Bg7": { name: "King's Indian Defense", eco: "E70" },
    "d4 Nf6 c4 e6": { name: "Indian Defense", eco: "E10" },
    "d4 Nf6 c4 e6 Nc3": { name: "Indian Defense", eco: "E20" },
    "d4 Nf6 c4 e6 Nc3 Bb4": { name: "Nimzo-Indian Defense", eco: "E20" },
    "d4 Nf6 c4 e6 Nc3 Bb4 e3": { name: "Nimzo-Indian, Rubinstein", eco: "E40" },
    "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O": { name: "Nimzo-Indian, Rubinstein", eco: "E41" },
    "d4 Nf6 c4 e6 Nc3 Bb4 e3 c5": { name: "Nimzo-Indian, Hübner", eco: "E42" },
    "d4 Nf6 c4 e6 Nc3 Bb4 e3 d5": { name: "Nimzo-Indian, Rubinstein", eco: "E40" },
    "d4 Nf6 c4 e6 Nc3 Bb4 Qc2": { name: "Nimzo-Indian, Classical", eco: "E32" },
    "d4 Nf6 c4 e6 Nc3 Bb4 Bg5": { name: "Nimzo-Indian, Leningrad", eco: "E30" },
    "d4 Nf6 c4 e6 Nc3 Bb4 a3": { name: "Nimzo-Indian, Sämisch", eco: "E24" },
    "d4 Nf6 c4 e6 g3": { name: "Catalan Opening", eco: "E00" },
    "d4 Nf6 c4 c5": { name: "Benoni Defense", eco: "A60" },

    // English Opening
    "c4": { name: "English Opening", eco: "A10" },
    "c4 e5": { name: "English Opening, Reversed Sicilian", eco: "A20" },
    "c4 c5": { name: "English Opening, Symmetrical", eco: "A30" },
    "c4 Nf6": { name: "English Opening", eco: "A15" },

    // Flank Openings
    "Nf3": { name: "Réti Opening", eco: "A04" },
    "Nf3 d5": { name: "Réti Opening", eco: "A05" },
    "Nf3 d5 c4": { name: "Réti Opening", eco: "A09" },
    "g3": { name: "Hungarian Opening", eco: "A00" },
    "b3": { name: "Larsen's Opening", eco: "A01" },

    // London System
    "d4 d5 Bf4": { name: "London System", eco: "D00" },
    "d4 Nf6 Bf4": { name: "London System", eco: "A45" },
    "d4 d5 Nf3 Nf6 Bf4": { name: "London System", eco: "D02" },
};

/**
 * Get move sequence string from moves array
 */
const getMoveSequence = (moves, upToIndex) => {
    return moves.slice(0, upToIndex + 1).map(m => m.san).join(' ');
};

/**
 * Find the longest matching opening for a move sequence
 */
export const findOpening = (moves, moveIndex) => {
    if (!moves || moveIndex < 0) return null;

    // Try progressively longer sequences
    let bestMatch = null;

    for (let i = 0; i <= moveIndex && i < moves.length; i++) {
        const sequence = getMoveSequence(moves, i);
        if (OPENINGS[sequence]) {
            bestMatch = {
                ...OPENINGS[sequence],
                lastBookMove: i
            };
        }
    }

    return bestMatch;
};

/**
 * Check if a specific move is still within opening theory (book move)
 */
export const isBookMove = (moves, moveIndex) => {
    if (!moves || moveIndex < 0 || moveIndex >= moves.length) return false;

    const sequence = getMoveSequence(moves, moveIndex);

    // Check if this exact sequence or any extension of it is in the book
    for (const key of Object.keys(OPENINGS)) {
        if (key === sequence || key.startsWith(sequence + ' ')) {
            return true;
        }
    }
    return false;
};

/**
 * Get opening info for display
 */
export const getOpeningInfo = (moves, moveIndex) => {
    const opening = findOpening(moves, moveIndex);
    const isBook = isBookMove(moves, moveIndex);

    return {
        opening,
        isBook,
        isTheory: isBook || (opening && moveIndex <= opening.lastBookMove)
    };
};

export default { findOpening, isBookMove, getOpeningInfo };
