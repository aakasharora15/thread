// settings.js wraps the classic game's save object to extract global settings 
// (sound, cosmetics) so the isolated games can stay in sync without tampering 
// with the classic engine.

export const Settings = {
  get: function() {
    try {
      const stored = localStorage.getItem('THREAD_SAVE');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          sound: parsed.sound !== false,
          cosmetics: parsed.cosmetics || { color: 'default', audio: 'default' }
        };
      }
    } catch(e) {}
    return { sound: true, cosmetics: { color: 'default', audio: 'default' } };
  }
};
