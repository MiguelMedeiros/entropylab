import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/js/app.js");
const css = read("src/css/styles.css");
const template = read("src/index.html");

test("webcam is a first-class entropy input mode", () => {
  assert.match(app, /\["dice","camera","hex","seed","key"\]/);
  assert.match(app, /e==="camera"\?"Webcam"/);
  assert.match(app, /id="camera-start"/);
  assert.match(app, /id="camera-capture"/);
  assert.match(app, /Create \$\{config\.bits\} bits of entropy/);
});

test("camera entropy mixes multiple local frames and capture timing", () => {
  assert.match(app, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(app, /audio:!1/);
  assert.match(app, /frames=48/);
  assert.match(app, /canvas\.width=96;canvas\.height=72/);
  assert.match(app, /getImageData\(0,0,canvas\.width,canvas\.height\)\.data/);
  assert.match(app, /pool=Z\(hodlJoinCameraEntropy\(pool,pixels,timing\)\)/);
  assert.match(app, /state\.fields\.hex=hex/);
  assert.match(app, /hodlSetMode\("hex"\)/);
});

test("camera access is bounded and visibly private", () => {
  assert.match(app, /getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
  assert.match(app, /The camera image never leaves this page/);
  assert.match(template, /media-src 'self' blob:/);
  assert.match(css, /\.camera-stage/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
