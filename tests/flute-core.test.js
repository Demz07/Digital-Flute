"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const core = require("../flute-core.js");

test("NOTES has 10 holes C4..E5 with correct frequencies", () => {
  assert.equal(core.NOTES.length, 10);
  assert.equal(core.NOTE_MAP.C4, 261.63);
  assert.equal(core.NOTE_MAP.A4, 440.0);
  assert.equal(core.NOTE_MAP.E5, 659.25);
  // Display order is descending pitch.
  for (let i = 1; i < core.NOTES.length; i++) {
    assert.ok(core.NOTES[i].freq < core.NOTES[i - 1].freq, "notes must descend");
  }
});

test("all song notes exist in NOTE_MAP and durations are positive", () => {
  assert.deepEqual(core.validateSongs(core.NOTES, core.SONGS), []);
  for (const [id, song] of Object.entries(core.SONGS)) {
    assert.ok(song.length > 0, `${id} non-empty`);
    for (const item of song) {
      assert.ok(item.note in core.NOTE_MAP, `${id}: ${item.note} known`);
      assert.ok(item.dur > 0, `${id}: dur positive`);
    }
  }
});

test("validateSongs catches unknown notes and bad durations", () => {
  const bad = { broken: [{ note: "Z9", lyric: "x", dur: -1 }] };
  const errors = core.validateSongs(core.NOTES, bad);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /unknown note/);
  assert.match(errors[1], /dur/);
});

test("song tracker advances, flags wrong notes, completes, and resets", () => {
  const tracker = core.createSongTracker(core.SONGS.twinkle);
  assert.equal(tracker.current.note, "C4");
  assert.equal(tracker.advance("G4"), "wrong");
  assert.equal(tracker.step, 0, "wrong note must not advance");
  assert.equal(tracker.advance("C4"), "correct");
  assert.equal(tracker.step, 1);
  // Play the rest.
  let result;
  for (const item of core.SONGS.twinkle.slice(1)) result = tracker.advance(item.note);
  assert.equal(result, "complete");
  assert.ok(tracker.isComplete());
  assert.equal(tracker.advance("C4"), "complete", "stays complete until reset");
  tracker.reset();
  assert.equal(tracker.step, 0);
  assert.equal(tracker.advance("C4"), "correct");
});

test("song tracker handles repeated notes (Twinkle C4 C4)", () => {
  const tracker = core.createSongTracker(core.SONGS.twinkle);
  assert.equal(tracker.advance("C4"), "correct");
  assert.equal(tracker.advance("C4"), "correct");
  assert.equal(tracker.step, 2);
});

test("empty song tracker is immediately complete", () => {
  const tracker = core.createSongTracker([]);
  assert.ok(tracker.isComplete());
  assert.equal(tracker.current, null);
});
