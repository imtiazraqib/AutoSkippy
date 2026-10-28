const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const script = readFileSync(`${__dirname}/../code/script.js`, "utf8");
const popup = readFileSync(`${__dirname}/../code/popup.js`, "utf8");

function page(preferences = { muteNetflixAds: true }) {
  const state = { preferences, ad: true, videos: [{ muted: false }, { muted: true }] };
  const intervals = new Map();
  const listeners = [];
  let nextId = 0;
  const context = vm.createContext({
    window: { location: { href: "https://www.netflix.com/watch/1" } },
    document: {
      querySelector: (selector) => selector === '[data-uia="ads-info-text"]' && state.ad,
      querySelectorAll: () => state.videos,
    },
    chrome: {
      storage: {
        sync: { get: async () => ({ ...state.preferences }) },
        onChanged: { addListener: (listener) => listeners.push(listener) },
      },
    },
    console: { log() {}, error: console.error },
    setInterval: (callback) => { intervals.set(++nextId, callback); return nextId; },
    clearInterval: (id) => intervals.delete(id),
    setTimeout() {},
  });
  return {
    state, context, intervals, listeners,
    async inject() { vm.runInContext(script, context); await Promise.resolve(); },
    async update(preferences) {
      state.preferences = preferences;
      listeners.forEach((listener) => listener());
      await Promise.resolve();
    },
    tick() { intervals.forEach((callback) => callback()); },
  };
}

test("reinjection preserves ownership and restores only videos muted by AutoSkippy", async () => {
  const p = page();
  await p.inject();
  p.tick();
  assert.deepEqual(p.state.videos.map((v) => v.muted), [true, true]);
  const muteState = p.context.window.adMuteState;
  await p.inject();
  await p.inject();
  assert.equal(p.context.window.adMuteState, muteState);
  assert.equal(p.listeners.length, 1);
  assert.equal(p.intervals.size, 1);
  assert.equal(p.state.videos[0].muted, true);
  p.state.ad = false;
  p.tick();
  assert.deepEqual(p.state.videos.map((v) => v.muted), [false, true]);
  assert.equal(muteState.mutedVideos.size, 0);
});

test("disabling mute restores audio while other enabled features continue", async () => {
  const p = page();
  await p.inject();
  p.tick();
  await p.update({ muteNetflixAds: false, skipIntro: true });
  assert.deepEqual(p.state.videos.map((v) => v.muted), [false, true]);
  assert.equal(p.intervals.size, 1);
  p.tick();
  assert.equal(p.state.videos[0].muted, false);
  await p.update({ muteNetflixAds: true });
  p.tick();
  await p.update({ muteNetflixAds: false });
  assert.deepEqual(p.state.videos.map((v) => v.muted), [false, true]);
  assert.equal(p.intervals.size, 0);
});

test("remuting and replacement videos retain per-video ownership", async () => {
  const p = page();
  await p.inject();
  p.tick();
  const original = p.state.videos[0];
  original.muted = false;
  p.tick();
  assert.equal(original.muted, true);
  const replacement = { muted: false };
  p.state.videos = [replacement];
  p.tick();
  assert.equal(replacement.muted, true);
  p.state.videos = [];
  p.state.ad = false;
  p.tick();
  assert.equal(original.muted, false);
  assert.equal(replacement.muted, false);
  assert.equal(p.context.window.adMuteState.mutedVideos.size, 0);
});

test("popup legacy migration keeps muting opt-in and toggle-off uses storage cleanup", async () => {
  for (const muteNetflixAds of [undefined, true]) {
    const elements = new Map();
    const writes = [];
    const injections = [];
    const context = vm.createContext({
      document: { getElementById(id) {
        if (!elements.has(id)) elements.set(id, {
          checked: false, parentElement: { parentElement: { style: {} } },
          classList: { add() {} }, addEventListener(event, listener) { this.change = listener; },
        });
        return elements.get(id);
      } },
      chrome: {
        storage: { sync: {
          get: async () => ({ extensionEnabled: true, muteNetflixAds }),
          set: (value) => writes.push(value), remove() {},
        } },
        tabs: { query: (options, callback) => callback([{}]) },
        scripting: { executeScript: (options) => injections.push(options) },
      },
      console,
    });
    vm.runInContext(popup, context);
    await Promise.resolve();
    const toggle = elements.get("mute-netflix-ads-toggle");
    assert.equal(toggle.checked, muteNetflixAds ?? false);
    assert.equal(Object.hasOwn(writes[0], "muteNetflixAds"), false);
    toggle.checked = false;
    toggle.change();
    assert.equal(writes.at(-1).muteNetflixAds, false);
    assert.equal(injections.length, 0);
  }
});
