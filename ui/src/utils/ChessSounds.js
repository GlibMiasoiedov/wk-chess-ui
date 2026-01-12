/**
 * ChessSounds.js - Audio feedback for chess moves
 * Using simple HTML5 Audio with Lichess-style sounds
 */

const SOUND_URLS = {
    move: 'https://lichess1.org/assets/sound/standard/Move.mp3',
    capture: 'https://lichess1.org/assets/sound/standard/Capture.mp3',
    check: 'https://lichess1.org/assets/sound/standard/Check.mp3',
    castle: 'https://lichess1.org/assets/sound/standard/Castle.mp3',
    promote: 'https://lichess1.org/assets/sound/standard/Promote.mp3',
    gameStart: 'https://lichess1.org/assets/sound/standard/GenericNotify.mp3',
    gameEnd: 'https://lichess1.org/assets/sound/standard/Victory.mp3'
};

let audioCache = {};
let isMuted = false;

/**
 * Preload sounds into cache
 */
export const preloadSounds = () => {
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
        try {
            audioCache[key] = new Audio(url);
            audioCache[key].volume = 0.5;
            audioCache[key].load();
        } catch (e) {
            console.warn('Could not preload sound:', key);
        }
    });
};

/**
 * Play a sound by name
 */
export const playSound = (soundName) => {
    if (isMuted) return;

    try {
        let audio = audioCache[soundName];
        if (!audio) {
            const url = SOUND_URLS[soundName];
            if (url) {
                audio = new Audio(url);
                audio.volume = 0.5;
                audioCache[soundName] = audio;
            }
        }
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => { });
        }
    } catch (e) {
        // Sound playback error - ignore silently
    }
};

/**
 * Play sound based on move result
 */
export const playMoveSound = (move) => {
    if (!move) return;

    if (move.san?.includes('#')) {
        playSound('gameEnd'); // Checkmate
    } else if (move.san?.includes('+')) {
        playSound('check'); // Check
    } else if (move.san?.includes('O-O')) {
        playSound('castle'); // Castling
    } else if (move.promotion) {
        playSound('promote'); // Promotion
    } else if (move.captured) {
        playSound('capture'); // Capture
    } else {
        playSound('move'); // Regular move
    }
};

/**
 * Toggle mute
 */
export const toggleMute = () => {
    isMuted = !isMuted;
    return isMuted;
};

export const setMuted = (mute) => {
    isMuted = mute;
};

// Preload sounds on import
if (typeof window !== 'undefined') {
    preloadSounds();
}

export default { playSound, playMoveSound, toggleMute, setMuted, preloadSounds };
