// The two smaller games read the player's sound and look choices from the
// classic game's save, so one toggle governs the whole app. Read-only: the
// classic engine stays the only writer.
import { loadClassic } from './progress.js';

const DEFAULTS = { sound: true, cosmetics: { color: 'default', audio: 'default' } };

export const Settings = {
  get() {
    const save = loadClassic();
    if (!save) return DEFAULTS;
    return {
      sound: save.sound !== false,
      cosmetics: save.cosmetics || DEFAULTS.cosmetics
    };
  }
};
