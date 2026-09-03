export const Audio = (function () {
  var ctx = null, bus = null, musicBus = null, sfxBus = null, echo = null;
  var playing = false, loop = null, nextNote = 0, step = 0;
  var SCALE = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77];
  var CHORDS = [
    [110.00, 164.81, 277.18],
    [92.50, 138.59, 220.00],
    [73.42, 110.00, 185.00],
    [82.41, 123.47, 207.65]
  ];
  var MEL = [0, -1, 2, -1, 4, -1, 3, -1, 2, -1, 5, -1, 3, -1, 1, -1];
  var BEAT = 0.42;
  var audioTheme = 'sine'; // Supports 'sine' (default) and 'square' (retro 8-bit)

  let getConfig = () => ({ soundEnabled: true });
  function vibe(ms) { if (navigator.vibrate) try { navigator.vibrate(ms); } catch(e){} }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
    bus = ctx.createGain(); bus.gain.value = 0.9; bus.connect(ctx.destination);
    echo = ctx.createDelay(1.0); echo.delayTime.value = 0.33;
    var echoGain = ctx.createGain(); echoGain.gain.value = 0.25;
    echo.connect(echoGain); echoGain.connect(echo); echoGain.connect(bus);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(bus);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(bus);
    return ctx;
  }

  function wake() {
    ensure();
    if (!ctx) return false;
    if (ctx.state !== 'running') ctx.resume().catch(function(){});
    return true;
  }

  function blip(dest, freq, t, dur, vol, type) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = type || audioTheme;
    osc.frequency.setValueAtTime(freq, t);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.1);
    g.gain.setTargetAtTime(0, t + dur * 0.1, dur * 0.3);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur * 2);
  }

  function on() { return getConfig().soundEnabled !== false; }

  function schedule() {
    if (!on() || !playing || !ctx) return;
    var t = ctx.currentTime + 0.1;
    var chord = CHORDS[step % CHORDS.length];
    chord.forEach(function (f) { blip(musicBus, f, t, BEAT * 1.5, 0.04, audioTheme); });
    var m = MEL[nextNote % MEL.length];
    if (m >= 0) blip(musicBus, SCALE[m] * 2, t, BEAT * 0.5, 0.05, audioTheme);
    nextNote++;
    if (nextNote % 4 === 0) step++;
  }

  return {
    init: function (configFn) { getConfig = configFn; },
    setTheme: function (theme) { audioTheme = theme === '8bit' ? 'square' : 'sine'; },
    play: function () {
      if (!on() || !wake()) return;
      if (playing) return;
      playing = true;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 2.2);
      schedule();
      loop = setInterval(schedule, 70);
    },
    stop: function () {
      if (!ctx || !playing) return;
      playing = false;
      clearInterval(loop);
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    },
    playing: function () { return playing; },
    step: function (k) {
      if (!on() || !wake()) return;
      vibe(10);
      var note = SCALE[k % SCALE.length];
      var oct = Math.floor(k / SCALE.length);
      var mult = Math.pow(2, oct % 3);
      blip(sfxBus, note * mult, ctx.currentTime, 0.13, 0.13, 'triangle');
    },
    erase: function () {
      if (!on() || !wake()) return;
      vibe(15);
      blip(sfxBus, 300, ctx.currentTime, 0.11, 0.09, audioTheme);
    },
    mark: function (n) {
      if (!on() || !wake()) return;
      var t = ctx.currentTime;
      vibe([15, 30, 15]);
      blip(sfxBus, SCALE[n % 5] * 2, t, 0.2, 0.16, audioTheme);
      blip(sfxBus, SCALE[(n + 2) % 5] * 4, t + 0.09, 0.28, 0.1, audioTheme);
    },
    win: function () {
      if (!on() || !wake()) return;
      var t = ctx.currentTime;
      [0, 2, 4, 5].forEach(function (k, i) {
        vibe([30, 50, 30, 50, 30]);
        blip(sfxBus, SCALE[k] * 2, t + i * 0.11, 0.5, 0.15, 'triangle');
      });
    },
    fail: function () {
      if (!on() || !wake()) return;
      var t = ctx.currentTime;
      vibe([50, 100, 50]);
      blip(sfxBus, 330, t, 0.3, 0.12, audioTheme);
      blip(sfxBus, 247, t + 0.16, 0.5, 0.1, audioTheme);
    },
    blocked: function () {
      if (!on() || !wake()) return;
      vibe(30);
      blip(sfxBus, 180, ctx.currentTime, 0.09, 0.08, 'square');
    }
  };
})();
