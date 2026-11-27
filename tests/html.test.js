"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("index.html has no innerHTML (status is built with textContent)", () => {
  assert.ok(!html.includes("innerHTML"), "must not use innerHTML");
});

test("index.html has no empty catch blocks", () => {
  assert.ok(!/catch\s*\([^)]*\)\s*\{\s*\}/.test(html), "empty catch hides failures");
});

test("touch-action is scoped to .flute/.hole, not global *", () => {
  assert.ok(!/\*\s*\{[^}]*touch-action/.test(html), "global touch-action breaks select/zoom");
  assert.match(html, /\.flute\s*\{[^}]*touch-action:\s*none/);
});

test("viewport allows zoom (no user-scalable=no)", () => {
  assert.ok(!html.includes("user-scalable=no"));
});

test("panic stop handlers are wired (blur + visibilitychange)", () => {
  assert.match(html, /addEventListener\("blur"/);
  assert.match(html, /visibilitychange/);
  assert.match(html, /stopAllHoles/);
});

test("keyboard support is wired", () => {
  assert.match(html, /KEY_FOR_NOTE/);
  assert.match(html, /addEventListener\("keydown"/);
  assert.match(html, /aria-label/);
});

test("AudioContext is feature-detected and resume is awaited", () => {
  assert.match(html, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(html, /await ctx\.resume\(\)/);
});

test("holes are generated from FluteCore NOTES (single source of truth)", () => {
  assert.match(html, /flute-core\.js/);
  assert.match(html, /NOTES\.forEach/);
  assert.ok(!html.includes('data-note="E5"'), "holes should not be hardcoded in HTML");
});

test("demo is scheduled on the audio clock", () => {
  assert.match(html, /ctx\.currentTime \+ 0\.15/);
  assert.match(html, /new FluteVoice\(freq, noteStart\)/);
});

test("voice cleanup disconnects all nodes and stop() is idempotent", () => {
  assert.match(html, /if \(this\.stopped\) return/);
  assert.match(html, /this\._nodes\.forEach/);
});

test("volume control and compressor settings exist", () => {
  assert.match(html, /id="volume"/);
  assert.match(html, /createDynamicsCompressor/);
});

test("favicon, manifest, and meta description are present", () => {
  assert.match(html, /favicon\.svg/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /name="description"/);
});
