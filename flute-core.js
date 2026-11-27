/*
 * flute-core.js — pure, testable core for Digital Flute.
 *
 * Single source of truth for notes, frequencies, songs, audio
 * parameters, song validation, and the song-progress state machine.
 * Loaded as a classic script in the browser (window.FluteCore) and
 * via require() in Node tests. No DOM or Web Audio dependencies.
 */
(function (global) {
  "use strict";

  // Display order: top (highest) to bottom (lowest), as rendered.
  var NOTES = [
    { note: "E5", freq: 659.25 },
    { note: "D5", freq: 587.33 },
    { note: "C5", freq: 523.25 },
    { note: "B4", freq: 493.88 },
    { note: "A4", freq: 440.0 },
    { note: "G4", freq: 392.0 },
    { note: "F4", freq: 349.23 },
    { note: "E4", freq: 329.63 },
    { note: "D4", freq: 293.66 },
    { note: "C4", freq: 261.63 },
  ];

  var NOTE_MAP = {};
  NOTES.forEach(function (n) {
    NOTE_MAP[n.note] = n.freq;
  });

  var SONGS = {
    rickroll: [
      { note: "G4", lyric: "Ne-", dur: 220 },
      { note: "A4", lyric: "ver", dur: 220 },
      { note: "C5", lyric: "gon-", dur: 220 },
      { note: "A4", lyric: "na", dur: 220 },
      { note: "E5", lyric: "give", dur: 420 },
      { note: "E5", lyric: "you", dur: 420 },
      { note: "D5", lyric: "up", dur: 600 },
      { note: "G4", lyric: "Ne-", dur: 220 },
      { note: "A4", lyric: "ver", dur: 220 },
      { note: "C5", lyric: "gon-", dur: 220 },
      { note: "A4", lyric: "na", dur: 220 },
      { note: "D5", lyric: "let", dur: 420 },
      { note: "D5", lyric: "you", dur: 420 },
      { note: "C5", lyric: "down", dur: 600 },
      { note: "G4", lyric: "Ne-", dur: 220 },
      { note: "A4", lyric: "ver", dur: 220 },
      { note: "C5", lyric: "gon-", dur: 220 },
      { note: "A4", lyric: "na", dur: 220 },
      { note: "C5", lyric: "run", dur: 320 },
      { note: "D5", lyric: "a-", dur: 320 },
      { note: "B4", lyric: "round", dur: 320 },
      { note: "A4", lyric: "and", dur: 240 },
      { note: "G4", lyric: "de-", dur: 240 },
      { note: "D5", lyric: "sert", dur: 320 },
      { note: "C5", lyric: "you", dur: 650 },
    ],
    twinkle: [
      { note: "C4", lyric: "Twin-", dur: 350 },
      { note: "C4", lyric: "kle", dur: 350 },
      { note: "G4", lyric: "twin-", dur: 350 },
      { note: "G4", lyric: "kle", dur: 350 },
      { note: "A4", lyric: "lit-", dur: 350 },
      { note: "A4", lyric: "tle", dur: 350 },
      { note: "G4", lyric: "star", dur: 600 },
      { note: "F4", lyric: "how", dur: 350 },
      { note: "F4", lyric: "I", dur: 350 },
      { note: "E4", lyric: "won-", dur: 350 },
      { note: "E4", lyric: "der", dur: 350 },
      { note: "D4", lyric: "what", dur: 350 },
      { note: "D4", lyric: "you", dur: 350 },
      { note: "C4", lyric: "are", dur: 600 },
    ],
    brahms: [
      { note: "E4", lyric: "Lul-", dur: 350 },
      { note: "E4", lyric: "la-", dur: 350 },
      { note: "G4", lyric: "by", dur: 600 },
      { note: "E4", lyric: "and", dur: 350 },
      { note: "E4", lyric: "good", dur: 350 },
      { note: "G4", lyric: "night", dur: 600 },
      { note: "E4", lyric: "in", dur: 250 },
      { note: "G4", lyric: "the", dur: 250 },
      { note: "C5", lyric: "sky", dur: 450 },
      { note: "B4", lyric: "stars", dur: 350 },
      { note: "A4", lyric: "are", dur: 350 },
      { note: "A4", lyric: "shi-", dur: 350 },
      { note: "G4", lyric: "ning", dur: 700 },
    ],
    ode: [
      { note: "E4", lyric: "Ode", dur: 350 },
      { note: "E4", lyric: "to", dur: 350 },
      { note: "F4", lyric: "joy", dur: 350 },
      { note: "G4", lyric: "re-", dur: 350 },
      { note: "G4", lyric: "sound-", dur: 350 },
      { note: "F4", lyric: "ing", dur: 350 },
      { note: "E4", lyric: "voic-", dur: 350 },
      { note: "D4", lyric: "es", dur: 350 },
      { note: "C4", lyric: "hear", dur: 350 },
      { note: "C4", lyric: "the", dur: 350 },
      { note: "D4", lyric: "song", dur: 350 },
      { note: "E4", lyric: "of", dur: 350 },
      { note: "E4", lyric: "all", dur: 450 },
      { note: "D4", lyric: "man-", dur: 220 },
      { note: "D4", lyric: "kind", dur: 600 },
    ],
  };

  // Audio synthesis parameters (single place to tune).
  var AUDIO = {
    masterGain: 0.65,
    envPeak: 0.85,
    envAttack: 0.03, // seconds (was 0.045 — snappier, less mud on glissando)
    envRelease: 0.06, // seconds (was 0.08)
    envReleaseFast: 0.03, // for glissando / panic stops
    harmonicGain: 0.16, // 2nd harmonic (octave) level
    vibratoRate: 5, // Hz
    vibratoDepthRatio: 0.005, // fraction of freq (scales per note; was fixed 1.5 Hz)
    noiseGain: 0.035,
    noiseFilterRatio: 1.5, // bandpass centre = freq * ratio
    noiseFilterQ: 3,
    noiseBufferSeconds: 2,
    noiseCrossfadeSeconds: 0.1, // loop crossfade to avoid click
    compressor: {
      threshold: -12,
      knee: 20,
      ratio: 12,
      attack: 0.003,
      release: 0.25,
    },
  };

  /**
   * Validate that every song note exists in the note map and every
   * entry has a positive duration. Returns an array of human-readable
   * error strings (empty = valid). Pure function — unit tested.
   */
  function validateSongs(notes, songs) {
    var errors = [];
    var known = {};
    (notes || []).forEach(function (n) {
      known[n.note] = true;
    });
    Object.keys(songs || {}).forEach(function (songId) {
      var song = songs[songId];
      if (!Array.isArray(song) || song.length === 0) {
        errors.push(songId + ": song is empty or not an array");
        return;
      }
      song.forEach(function (item, i) {
        if (!item || typeof item.note !== "string") {
          errors.push(songId + "[" + i + "]: missing note");
        } else if (!known[item.note]) {
          errors.push(
            songId + "[" + i + "]: unknown note '" + item.note + "'"
          );
        }
        if (!item || typeof item.dur !== "number" || !(item.dur > 0)) {
          errors.push(songId + "[" + i + "]: dur must be a positive number");
        }
      });
    });
    return errors;
  }

  /**
   * Song-progress state machine.
   * advance(note) -> "correct" | "wrong" | "complete"
   * "complete" is returned on the final correct note and thereafter
   * until reset() is called. Callers should reset() and re-advance
   * if they want to restart after completion.
   */
  function createSongTracker(song) {
    var steps = Array.isArray(song) ? song : [];
    var step = 0;
    return {
      get step() {
        return step;
      },
      get length() {
        return steps.length;
      },
      get current() {
        return step < steps.length ? steps[step] : null;
      },
      isComplete: function () {
        return step >= steps.length;
      },
      advance: function (note) {
        if (step >= steps.length) return "complete";
        if (steps[step].note === note) {
          step += 1;
          return step >= steps.length ? "complete" : "correct";
        }
        return "wrong";
      },
      reset: function () {
        step = 0;
      },
    };
  }

  var api = {
    NOTES: NOTES,
    NOTE_MAP: NOTE_MAP,
    SONGS: SONGS,
    AUDIO: AUDIO,
    validateSongs: validateSongs,
    createSongTracker: createSongTracker,
  };

  global.FluteCore = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
