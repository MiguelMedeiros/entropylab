import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/js/app.js");
const css = read("src/css/styles.css");

test("microphone is a first-class entropy input mode", () => {
  assert.match(app, /\["dice","audio","hex","seed","key"\]/);
  assert.match(app, /e==="audio"\?"Microphone"/);
  assert.match(app, /id="audio-start"/);
  assert.match(app, /id="audio-capture"/);
  assert.match(app, /id="audio-waveform"/);
});

test("microphone capture mixes samples, timing, and system randomness", () => {
  assert.match(app, /getUserMedia\(\{audio:\{echoCancellation:!1,noiseSuppression:!1,autoGainControl:!1\},video:!1\}\)/);
  assert.match(app, /createMediaStreamSource\(stream\)/);
  assert.match(app, /getByteTimeDomainData\(timeSamples\)/);
  assert.match(app, /getByteFrequencyData\(frequencies\)/);
  assert.match(app, /crypto\.getRandomValues\(systemRandom\)/);
  assert.match(app, /pool=Z\(hodlJoinAudioEntropy\(pool,timeSamples,frequencies,timing\)\)/);
  assert.match(app, /state\.fields\.hex=hex/);
  assert.match(app, /hodlSetMode\("hex"\)/);
});

test("microphone access is bounded and visibly private", () => {
  assert.match(app, /slices=120/);
  assert.match(app, /getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
  assert.match(app, /recording never leaves this page and is never saved/i);
  assert.match(app, /nearly silent/);
  assert.match(css, /\.audio-stage canvas/);
});
