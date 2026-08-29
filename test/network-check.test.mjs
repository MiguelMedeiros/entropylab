// Tests for src/js/network-check.js using Node's built-in test runner.
// The module is a browser IIFE, so each test executes it inside a sandbox
// with stubbed document/navigator/window globals and asserts how it treats
// the #network-status tag.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), "utf8");
const src = read("src/js/network-check.js");

const loadModule = ({ onLine, withConnectionApi = false, hasElement = true }) => {
  const el = {
    dataset: { state: "online" },
    textContent: "Online",
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  const listeners = {};
  const connectionListeners = {};
  const nav = { onLine };
  if (withConnectionApi) {
    nav.connection = { addEventListener: (type, fn) => { connectionListeners[type] = fn; } };
  }
  const sandbox = {
    document: { getElementById: (id) => (hasElement && id === "network-status" ? el : null) },
    navigator: nav,
    window: { addEventListener: (type, fn) => { listeners[type] = fn; } },
  };
  new Function(...Object.keys(sandbox), src)(...Object.values(sandbox));
  return { el, listeners, connectionListeners, nav };
};

test("never generates network traffic", () => {
  assert.doesNotMatch(src, /\bfetch\b|XMLHttpRequest|WebSocket|RTCPeerConnection|sendBeacon|WebTransport/);
});

// The tag's three faces move together, so each check reads all of them: a
// state the colour follows, the visible word, and the label screen readers get.
const assertOnline = (el) => {
  assert.equal(el.dataset.state, "online");
  assert.equal(el.textContent, "Online");
  assert.equal(el.attributes["aria-label"], "Network status: online");
};

const assertOffline = (el) => {
  assert.equal(el.dataset.state, "offline");
  assert.equal(el.textContent, "Offline");
  assert.equal(el.attributes["aria-label"], "Network status: offline");
};

test("reads online when a network adapter is available", () => {
  assertOnline(loadModule({ onLine: true }).el);
});

test("reads offline when no network adapter is available", () => {
  assertOffline(loadModule({ onLine: false }).el);
});

test("reads online when the online event fires", () => {
  const { el, listeners, nav } = loadModule({ onLine: false });
  assertOffline(el);
  nav.onLine = true;
  listeners.online();
  assertOnline(el);
});

test("reads offline when the offline event fires", () => {
  const { el, listeners, nav } = loadModule({ onLine: true });
  assertOnline(el);
  nav.onLine = false;
  listeners.offline();
  assertOffline(el);
});

test("re-checks when the Network Information API reports a change", () => {
  const { el, connectionListeners, nav } = loadModule({ onLine: true, withConnectionApi: true });
  assertOnline(el);
  assert.equal(typeof connectionListeners.change, "function");
  nav.onLine = false;
  connectionListeners.change();
  assertOffline(el);
});

test("works without the Network Information API (Firefox/Safari)", () => {
  assertOnline(loadModule({ onLine: true, withConnectionApi: false }).el);
});

test("never leaves a stale offline tag standing when the adapter returns", () => {
  // The dangerous direction: a tag still reading OFFLINE on a machine that has
  // come back online would vouch for an air gap that no longer exists.
  const { el, listeners, nav } = loadModule({ onLine: false });
  assertOffline(el);
  nav.onLine = true;
  listeners.online();
  assertOnline(el);
  nav.onLine = false;
  listeners.offline();
  assertOffline(el);
});

test("does not throw when the status tag is missing", () => {
  assert.doesNotThrow(() => loadModule({ onLine: true, hasElement: false }));
  assert.doesNotThrow(() => loadModule({ onLine: false, hasElement: false }));
});

test("the status tag ships online, sits in the header, and is wired to the build", () => {
  const template = read("src/index.html");
  const app = read("src/js/app.js");
  const build = read("scripts/build.mjs");
  const css = read("src/css/styles.css");
  const live = (markup) => markup.replace(/<!--[\s\S]*?-->/g, "");
  for (const markup of [template, app]) {
    const doc = live(markup);
    const tag = doc.match(/<span[^>]*id="network-status"[^>]*>/)?.[0];
    assert.ok(tag, "the network status tag is missing from the live document");
    // Ships in the cautionary state: a script-less or not-yet-checked render
    // must never claim an air gap that nothing has verified.
    assert.match(tag, /data-state="online"/);
    assert.match(tag, /role="status"/);
    assert.match(doc, /id="network-status"[^>]*>Online</);
    // It belongs to the header, not the page body the banner used to sit in.
    const header = doc.indexOf('<div class="site-header no-print">');
    const wrapper = doc.indexOf('<div class="wrap">');
    const tagAt = doc.indexOf('id="network-status"');
    assert.ok(header < tagAt && tagAt < wrapper, "the status tag must sit inside the header");
    // The banner it replaced is gone from the live document; only the TODO
    // comment keeps its copy, for the modal that is to come.
    assert.doesNotMatch(doc, /id="network-warning"/);
    assert.match(markup, /TODO:[\s\S]*?air-gapped computer\." -->/);
  }
  assert.match(template, /\/\*@@JS_NETWORK@@\*\//);
  assert.match(build, /network-check\.js/);
  // The safety state belongs to the identity group and uses a quiet text label
  // plus a state-coloured dot, rather than masquerading as a navigation item.
  for (const markup of [template, app]) {
    assert.match(markup, /class="site-identity"[\s\S]*?class="site-brand"[\s\S]*?id="network-status"/);
  }
  assert.match(css, /\.site-identity \{[^}]*display: flex; align-items: center;/s);
  assert.match(css, /\.network-status \{[^}]*position: static;[^}]*border-left: 1px solid var\(--border\);[^}]*background: transparent;/s);
  assert.match(css, /\.network-status\[data-state="offline"\]::before \{[^}]*background: var\(--ok\);/s);
  assert.match(css, /\.network-status\[data-state="online"\]::before \{[^}]*background: var\(--danger-bright\);/s);
  // On phones the word collapses but the safety dot remains visible.
  const phone = css.slice(css.indexOf("@media (max-width: 480px)"));
  assert.match(phone, /\.network-status \{[^}]*width: 18px;[^}]*height: 28px;[^}]*font-size: 0;/s);
  assert.match(css, /\.network-status::before \{[^}]*background: currentColor;/s);
  // The old banner's rules went with the banner.
  assert.doesNotMatch(css, /\.network-warning/);
});

test("CSP keeps connect-src locked down to 'none'", () => {
  const csp = read("src/index.html").match(/connect-src[^;"]*/)?.[0] ?? "";
  assert.equal(csp.trim(), "connect-src 'none'");
});
