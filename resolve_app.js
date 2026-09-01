const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Conflict 1: clearAllProgress
code = code.replace(/<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>>.*?$/m, (match, p1) => {
  return `    save = { lane: save.lane, sound: save.sound, cosmetics: { color: 'default', audio: 'default' },
             easy: mkLane(), medium: mkLane(), hard: mkLane(), snip: mkLane(), loom: mkLane() };
    applyCosmetics();`;
});

// Conflict 2: signedOut
code = code.replace(/<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>>.*?$/m, (match, p1) => {
  return `      save = { lane: 'medium', seq: 0, updatedAt: 0, cosmetics: { color: 'default', audio: 'default' },
               easy: mkLane(), medium: mkLane(), hard: mkLane(), snip: mkLane(), loom: mkLane() };
      applyCosmetics();`;
});

// Conflict 3: totalStars
code = code.replace(/<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>>.*?$/m, (match, p1) => {
  return `      // Unlocked looks.
      var c = cosmetics();
      var totalStars = ['easy', 'medium', 'hard', 'snip', 'loom'].reduce(function (acc, lane) {
        return acc + countStars(save[lane]);`;
});

// Conflict 4: stats.innerHTML
code = code.replace(/<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>>.*?$/m, (match, p1) => {
  return `      stats.innerHTML = ['easy', 'medium', 'hard', 'snip', 'loom'].map(lane => {`;
});

fs.writeFileSync('app.js', code);
