import React from 'react';

try {
    const App = require('./src/KidsChessQuest.jsx'); // Correct path relative to where I'll run it
    console.log("KidsChessQuest imported");
} catch (e) {
    console.error("Import failed:", e);
}
