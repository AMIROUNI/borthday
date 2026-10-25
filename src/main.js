import * as THREE from "three";
import gsap from "gsap";
import { createHallway } from "./scenes/hallway.js";
import { createScaryRoom } from "./scenes/scaryRoom.js";
import { createPartyRoom } from "./scenes/partyRoom.js";
import { createMaze } from "./scenes/maze.js";
import { AudioManager } from "./audio/AudioManager.js";
import { CONFIG } from "./config.js";
import "./style.css";

const canvas = document.getElementById("scene");
const loadingEl = document.getElementById("loading");
const brandEl = document.getElementById("brand");
const toastEl = document.getElementById("toast");
const dialogueEl = document.getElementById("dialogue");
const dialogueText = document.getElementById("dialogueText");
const hintEl = document.getElementById("sceneHint");
const letterEl = document.getElementById("letter");
const letterText = document.getElementById("letterText");
const letterClose = document.getElementById("letterClose");
const backBtn = document.getElementById("backBtn");
const blowBtn = document.getElementById("blowBtn");
const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");
const wipeEl = document.getElementById("wipe");
const wipePath = wipeEl.querySelector("path");
const giftNoteEl = document.getElementById("giftNote");
const giftNoteText = document.getElementById("giftNoteText");
const giftNoteClose = document.getElementById("giftNoteClose");
const debugPanel = document.getElementById("debugPanel");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* audio                                                               */
/* ------------------------------------------------------------------ */

let audioCtx = null;
let audioManager = null;
let muted = false;
try {
  muted = localStorage.getItem("arnouba-muted") === "1";
} catch (e) {
  muted = false;
}

function ensureAudio() {
  if (muted) return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    audioManager?.attach(audioCtx);
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function beep({ freq = 660, dur = 0.1, type = "sine", gain = 0.035, delay = 0, slideTo = null }) {
  if (!audioCtx || muted) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playTap() {
  beep({ freq: 760, dur: 0.06, gain: 0.022 });
  beep({ freq: 1040, dur: 0.08, gain: 0.016, delay: 0.045 });
}

function playPop() {
  beep({ freq: 420, dur: 0.07, type: "square", gain: 0.018, slideTo: 900 });
}

function playWhoosh() {
  beep({ freq: 220, dur: 0.35, type: "triangle", gain: 0.02, slideTo: 720 });
}

function playSuccess() {
  [523, 659, 784, 1046, 1318].forEach((f, i) => {
    beep({ freq: f, dur: 0.32, type: "sine", gain: 0.028, delay: i * 0.11 });
  });
}

function noiseBurst({ dur = 0.3, gain = 0.025, freq = 1200, delay = 0, q = 1 }) {
  if (!audioCtx || muted) return;
  const t0 = audioCtx.currentTime + delay;
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  source.connect(filter).connect(g).connect(audioCtx.destination);
  source.start(t0);
  source.stop(t0 + dur + 0.02);
}

function playDrumroll() {
  for (let i = 0; i < 22; i++) {
    beep({ freq: 70 + i * 3, dur: 0.055, type: "triangle", gain: 0.018, delay: i * 0.055 });
  }
}

function playPshh() {
  noiseBurst({ dur: 0.18, gain: 0.018, freq: 900, q: 0.7 });
  beep({ freq: 420, dur: 0.1, type: "sine", gain: 0.012, slideTo: 260 });
}

function playFffhh() {
  noiseBurst({ dur: 0.38, gain: 0.02, freq: 420, q: 0.8 });
}

function playDing() {
  beep({ freq: 1046, dur: 0.5, type: "sine", gain: 0.026 });
  beep({ freq: 1568, dur: 0.65, type: "sine", gain: 0.018, delay: 0.08 });
}

function playMusicBox() {
  const notes = [523, 659, 784, 1046, 880, 784, 659, 523, 587, 698, 880, 1046];
  notes.forEach((f, i) => {
    beep({ freq: f, dur: 0.42, type: "triangle", gain: 0.014, delay: i * 0.32 });
    beep({ freq: f * 2, dur: 0.28, type: "sine", gain: 0.006, delay: i * 0.32 });
  });
}

function playApplause() {
  noiseBurst({ dur: 1.4, gain: 0.022, freq: 1700, q: 0.5 });
  for (let i = 0; i < 26; i++) {
    beep({ freq: 900 + Math.random() * 900, dur: 0.035, type: "square", gain: 0.006, delay: i * 0.045 });
  }
}

function playPoof() {
  noiseBurst({ dur: 0.28, gain: 0.02, freq: 260, q: 0.6 });
}

function playCheer() {
  [523, 659, 784, 1046].forEach((f, i) => {
    beep({ freq: f, dur: 0.4, type: "triangle", gain: 0.018, delay: i * 0.12 });
  });
}

function playScratch() {
  noiseBurst({ dur: 0.09, gain: 0.012, freq: 2200 + Math.random() * 900, q: 1.4 });
  beep({ freq: 1200 + Math.random() * 400, dur: 0.04, type: "square", gain: 0.004 });
}

function playStamp() {
  noiseBurst({ dur: 0.22, gain: 0.045, freq: 180, q: 0.6 });
  beep({ freq: 92, dur: 0.3, type: "sine", gain: 0.05, slideTo: 48 });
}

function playKey() {
  [880, 1174, 1568].forEach((f, i) => {
    beep({ freq: f, dur: 0.35, type: "sine", gain: 0.026, delay: i * 0.09 });
  });
}

function playHeartbeat() {
  beep({ freq: 62, dur: 0.16, type: "sine", gain: 0.055, slideTo: 38 });
  beep({ freq: 54, dur: 0.2, type: "sine", gain: 0.04, slideTo: 32, delay: 0.18 });
}

function playGrowl() {
  beep({ freq: 120, dur: 0.6, type: "sawtooth", gain: 0.028, slideTo: 58 });
  noiseBurst({ dur: 0.5, gain: 0.016, freq: 220, q: 0.8 });
}

function playWhisper() {
  noiseBurst({ dur: 0.75, gain: 0.014, freq: 1400, q: 2.2 });
  beep({ freq: 240, dur: 0.5, type: "triangle", gain: 0.008, slideTo: 180 });
}

function playCreak() {
  beep({ freq: 170, dur: 0.7, type: "sawtooth", gain: 0.016, slideTo: 95 });
  noiseBurst({ dur: 0.35, gain: 0.012, freq: 500, q: 1.6 });
}

function playScream() {
  beep({ freq: 1300, dur: 0.55, type: "sawtooth", gain: 0.05, slideTo: 260 });
  noiseBurst({ dur: 0.5, gain: 0.035, freq: 1800, q: 0.6 });
  beep({ freq: 420, dur: 0.4, type: "square", gain: 0.025, slideTo: 130, delay: 0.08 });
}

function playSqueak() {
  beep({ freq: 1600, dur: 0.09, type: "square", gain: 0.014, slideTo: 2400 });
  beep({ freq: 1200, dur: 0.12, type: "sine", gain: 0.012, delay: 0.1, slideTo: 700 });
}

function playBats() {
  for (let i = 0; i < 9; i++) {
    beep({ freq: 1800 + Math.random() * 900, dur: 0.045, type: "triangle", gain: 0.008, delay: i * 0.055 });
  }
  noiseBurst({ dur: 0.4, gain: 0.008, freq: 2600, q: 1.8 });
}

function playSplash() {
  noiseBurst({ dur: 0.55, gain: 0.035, freq: 900, q: 0.6 });
  beep({ freq: 180, dur: 0.3, type: "sine", gain: 0.02, slideTo: 90 });
}

const sfxMap = {
  drumroll: playDrumroll,
  pshh: playPshh,
  fffhh: playFffhh,
  ding: playDing,
  musicBox: playMusicBox,
  applause: playApplause,
  poof: playPoof,
  cheer: playCheer,
  success: playSuccess,
  tap: playTap,
  pop: playPop,
  whoosh: playWhoosh,
  scratch: playScratch,
  stamp: playStamp,
  key: playKey,
  heartbeat: playHeartbeat,
  growl: playGrowl,
  whisper: playWhisper,
  creak: playCreak,
  scream: playScream,
  squeak: playSqueak,
  bats: playBats,
  splash: playSplash,
};

function sfx(name) {
  ensureAudio();
  const fn = sfxMap[name];
  if (fn) fn();
}

function refreshMuteButton() {
  muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.title = muted ? "Unmute" : "Mute";
  muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
}
refreshMuteButton();

muteBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  muted = !muted;
  try {
    localStorage.setItem("arnouba-muted", muted ? "1" : "0");
  } catch (e) {
    /* ignore */
  }
  audioManager?.setMuted(muted);
  refreshMuteButton();
  if (!muted) {
    ensureAudio();
    playTap();
  }
  toast(muted ? "Sound off 🔇" : "Sound on 🔊", 1200);
  resetIdle();
});

/* ------------------------------------------------------------------ */
/* renderer / camera                                                   */
/* ------------------------------------------------------------------ */

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 80);
audioManager = new AudioManager({ camera, ensureContext: ensureAudio });
const lookTarget = new THREE.Vector3(0, 1.2, -2);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

/* ------------------------------------------------------------------ */
/* dialogue                                                            */
/* ------------------------------------------------------------------ */

const dialogue = {
  queue: [],
  open: false,
  lines: [],
  index: 0,
  typing: false,
  timer: null,
  resolve: null,
  full: "",
  charIndex: 0,
};

function say(lines) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return new Promise((resolve) => {
    dialogue.queue.push({ lines: arr, resolve });
    if (!dialogue.open) runDialogue();
  });
}

function runDialogue() {
  if (dialogue.open || dialogue.queue.length === 0) return;
  const item = dialogue.queue.shift();
  dialogue.open = true;
  dialogue.lines = item.lines;
  dialogue.index = 0;
  dialogue.resolve = item.resolve;
  hideHint();
  dialogueEl.hidden = false;
  dialogueEl.classList.remove("next-ready");
  showDialogueLine();
}

function showDialogueLine() {
  const line = dialogue.lines[dialogue.index] ?? "";
  dialogue.full = line;
  dialogue.charIndex = 0;
  dialogue.typing = true;
  dialogueText.textContent = "";
  dialogueEl.classList.remove("next-ready");
  clearInterval(dialogue.timer);
  const chars = Array.from(line);
  dialogue.timer = setInterval(() => {
    if (!dialogue.typing) return;
    dialogue.charIndex += 1;
    dialogueText.textContent = chars.slice(0, dialogue.charIndex).join("");
    if (dialogue.charIndex >= chars.length) {
      clearInterval(dialogue.timer);
      dialogue.typing = false;
      dialogueEl.classList.add("next-ready");
    }
  }, 21);
}

function advanceDialogue() {
  if (!dialogue.open) return;
  ensureAudio();
  resetIdle();
  if (dialogue.typing) {
    clearInterval(dialogue.timer);
    dialogue.typing = false;
    dialogueText.textContent = dialogue.full;
    dialogueEl.classList.add("next-ready");
    return;
  }
  dialogue.index += 1;
  if (dialogue.index < dialogue.lines.length) {
    showDialogueLine();
    playTap();
    return;
  }
  dialogueEl.hidden = true;
  dialogueEl.classList.remove("next-ready");
  dialogue.open = false;
  const resolve = dialogue.resolve;
  dialogue.resolve = null;
  if (resolve) resolve();
  setTimeout(() => {
    if (!dialogue.open) runDialogue();
  }, 120);
}

dialogueEl.addEventListener("pointerup", (event) => {
  event.stopPropagation();
  advanceDialogue();
});

/* ------------------------------------------------------------------ */
/* toast / hint / letter / back                                        */
/* ------------------------------------------------------------------ */

let toastTimer = null;

function toast(text, ms = 1800) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, ms);
}

function hint(text) {
  hintEl.textContent = text;
  hintEl.hidden = false;
}

function hideHint() {
  hintEl.hidden = true;
}

let letterResolver = null;
let letterTimer = null;

function showLetter() {
  return new Promise((resolve) => {
    if (letterResolver) {
      resolve();
      return;
    }
    letterResolver = resolve;
    hideBlowButton();
    hideBack();
    letterEl.hidden = false;
    const chars = Array.from(CONFIG.texts.finalLetter);
    let index = 0;
    letterText.textContent = "";
    clearInterval(letterTimer);
    letterTimer = setInterval(() => {
      index += 2;
      letterText.textContent = chars.slice(0, index).join("");
      if (index >= chars.length) {
        clearInterval(letterTimer);
        letterTimer = null;
      }
    }, 22);
    ensureAudio();
    playSuccess();
    resetIdle();
  });
}

function closeLetter() {
  if (letterEl.hidden) return;
  clearInterval(letterTimer);
  letterTimer = null;
  letterEl.hidden = true;
  const resolve = letterResolver;
  letterResolver = null;
  playTap();
  if (resolve) resolve();
}

letterClose.addEventListener("click", (event) => {
  event.stopPropagation();
  closeLetter();
});

letterEl.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

let giftNoteResolver = null;

function showGiftNote(text) {
  return new Promise((resolve) => {
    if (!giftNoteEl) {
      resolve();
      return;
    }
    giftNoteResolver = resolve;
    giftNoteText.textContent = text;
    giftNoteEl.hidden = false;
    hideBack();
    hideBlowButton();
    ensureAudio();
    playSuccess();
  });
}

function closeGiftNote() {
  if (!giftNoteEl || giftNoteEl.hidden) return;
  giftNoteEl.hidden = true;
  const resolve = giftNoteResolver;
  giftNoteResolver = null;
  playTap();
  if (resolve) resolve();
}

giftNoteClose?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeGiftNote();
});

giftNoteEl?.addEventListener("pointerdown", (event) => event.stopPropagation());

let backCallback = null;

function showBack(cb) {
  backCallback = cb;
  backBtn.hidden = false;
}

function hideBack() {
  backCallback = null;
  backBtn.hidden = true;
}

let blowCallback = null;

function showBlowButton(cb) {
  blowCallback = cb;
  blowBtn.hidden = false;
}

function hideBlowButton() {
  blowCallback = null;
  blowBtn.hidden = true;
}

blowBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  resetIdle();
  ensureAudio();
  playTap();
  const cb = blowCallback;
  if (cb) cb();
});

let anyTapCallback = null;

function anyTap(cb) {
  anyTapCallback = cb;
}

backBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  resetIdle();
  if (dialogue.open || transitioning || !letterEl.hidden) return;
  ensureAudio();
  playTap();
  if (backCallback) backCallback();
});

resetBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  ensureAudio();
  location.reload();
});

/* ------------------------------------------------------------------ */
/* scenes                                                              */
/* ------------------------------------------------------------------ */

const sceneCache = new Map();
let current = null;
let currentName = null;
let transitioning = false;
let loadingDone = false;
let idleTime = 0;
let elapsed = 0;

const ctx = {
  say,
  toast,
  hint,
  hideHint,
  transition,
  showBack,
  hideBack,
  showBlowButton,
  hideBlowButton,
  anyTap,
  sfx,
  audio: audioManager,
  showLetter,
  showGiftNote,
  getAudio() {
    ensureAudio();
    return { ctx: audioCtx, muted, manager: audioManager };
  },
};

function getScene(name) {
  if (sceneCache.has(name)) return sceneCache.get(name);
  let created;
  if (name === "hallway") created = createHallway(ctx);
  else if (name === "scary") created = createScaryRoom(ctx);
  else if (name === "party") created = createPartyRoom(ctx);
  else if (name === "maze") created = createMaze(ctx);
  else throw new Error(`Unknown scene: ${name}`);
  sceneCache.set(name, created);
  return created;
}

function snapCamera(sceneObj) {
  const aspect = window.innerWidth / window.innerHeight;
  const pose = sceneObj.getCameraPose(aspect, 0);
  camera.position.copy(pose.position);
  camera.fov = pose.fov;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  lookTarget.copy(pose.target);
  camera.lookAt(lookTarget);
}

function activateScene(name, prev, meta) {
  const next = getScene(name);
  current = next;
  currentName = name;
  ctx.hideBack();
  ctx.hideHint();
  ctx.hideBlowButton();
  anyTap(null);
  snapCamera(next);
  if (next.onEnter) next.onEnter(prev, meta);
}

function tween(target, vars) {
  return new Promise((resolve) => {
    gsap.to(target, { ...vars, onComplete: resolve });
  });
}

async function transition(name, meta = {}) {
  if (transitioning) return;
  transitioning = true;
  resetIdle();
  hideHint();
  playWhoosh();
  wipeEl.style.visibility = "visible";
  const prev = currentName;
  try {
    await tween(wipePath, { scale: 4, duration: 0.5, ease: "power2.inOut" });
    const next = getScene(name);
    current = next;
    currentName = name;
    ctx.hideBack();
    ctx.hideHint();
    ctx.hideBlowButton();
    anyTap(null);
    snapCamera(next);
    await wait(100);
    await tween(wipePath, { scale: 0.001, duration: 0.55, ease: "power2.inOut" });
  } finally {
    wipeEl.style.visibility = "hidden";
    transitioning = false;
  }
  if (current && current.onEnter) current.onEnter(prev, meta);
}

/* ------------------------------------------------------------------ */
/* input                                                               */
/* ------------------------------------------------------------------ */

function sceneTap(clientX, clientY) {
  if (!current || !loadingDone || dialogue.open || transitioning || !letterEl.hidden) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(current.interactives, true);
  for (const hit of hits) {
    let obj = hit.object;
    while (obj && !obj.userData?.onTap) obj = obj.parent;
    if (!obj || !obj.userData?.onTap) continue;
    let visible = true;
    let p = obj;
    while (p) {
      if (!p.visible) {
        visible = false;
        break;
      }
      p = p.parent;
    }
    if (!visible) continue;
    ensureAudio();
    playTap();
    resetIdle();
    obj.userData.onTap();
    return;
  }
  if (anyTapCallback) {
    const cb = anyTapCallback;
    anyTapCallback = null;
    cb();
  }
}

function interactiveUnder(clientX, clientY) {
  if (!current || !loadingDone || dialogue.open || transitioning || !letterEl.hidden) return false;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(current.interactives, true);
  for (const hit of hits) {
    let obj = hit.object;
    while (obj && !obj.userData?.onTap) obj = obj.parent;
    if (!obj) continue;
    let visible = true;
    let p = obj;
    while (p) {
      if (!p.visible) {
        visible = false;
        break;
      }
      p = p.parent;
    }
    if (visible) return true;
  }
  return false;
}

let pointerDown = null;

canvas.addEventListener("pointerdown", (event) => {
  ensureAudio();
  resetIdle();
  console.debug("[canvas] pointerdown", Math.round(event.clientX), Math.round(event.clientY));
  pointerDown = { x: event.clientX, y: event.clientY, t: performance.now() };
});

canvas.addEventListener("pointerup", (event) => {
  if (!pointerDown) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  const held = performance.now() - pointerDown.t;
  pointerDown = null;
  if (moved > 14 || held > 900) return;
  sceneTap(event.clientX, event.clientY);
});

canvas.addEventListener("pointercancel", () => {
  pointerDown = null;
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  canvas.style.cursor = interactiveUnder(event.clientX, event.clientY) ? "pointer" : "default";
});

canvas.addEventListener("pointerleave", () => {
  canvas.style.cursor = "default";
});

window.addEventListener("keydown", (event) => {
  if (!letterEl.hidden) {
    if (event.key === "Escape") closeLetter();
    return;
  }
  if (dialogue.open && (event.key === " " || event.key === "Enter")) {
    event.preventDefault();
    advanceDialogue();
  }
});

function resetIdle() {
  idleTime = 0;
}

function updateIdle(dt) {
  if (!loadingDone || dialogue.open || transitioning || !letterEl.hidden) return;
  idleTime += dt;
  if (idleTime < 11) return;
  idleTime = 0;
  if (currentName === "hallway") {
    if (current?.requestHint) current.requestHint();
  } else if (currentName === "scary") {
    hint("Tap the arrow or the button to go back ⬅️");
  } else if (currentName === "party") {
    if (current?.phase === "BLOW") hint(CONFIG.texts.wishHint);
  }
}

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

/* ------------------------------------------------------------------ */
/* loop                                                                */
/* ------------------------------------------------------------------ */

let lastTime = performance.now();

function updateCamera(dt) {
  if (!current) return;
  const aspect = window.innerWidth / window.innerHeight;
  const pose = current.getCameraPose(aspect, elapsed);
  const k = 1 - Math.exp(-5.5 * dt);
  camera.position.lerp(pose.position, k);
  lookTarget.lerp(pose.target, k);
  const targetFov = pose.fov;
  camera.fov += (targetFov - camera.fov) * k;
  if (Math.abs(camera.fov - targetFov) > 0.002) camera.updateProjectionMatrix();
  camera.lookAt(lookTarget);
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  elapsed += dt;
  if (!current) return;
  current.update(dt);
  updateCamera(dt);
  audioManager?.update();
  renderer.render(current.scene, camera);
  updateIdle(dt);
}

/* ------------------------------------------------------------------ */
/* boot                                                                */
/* ------------------------------------------------------------------ */

async function boot() {
  gsap.set(wipePath, { scale: 0.001, transformOrigin: "center center", transformBox: "fill-box" });
  try {
    await Promise.race([document.fonts.ready, wait(2600)]);
  } catch (e) {
    /* fonts are optional */
  }

  current = getScene("hallway");
  currentName = "hallway";
  const params = new URLSearchParams(location.search);
  const debugMaze = params.has("debug") && params.get("debug") !== "0";
  if (debugMaze) {
    current = getScene("maze");
    currentName = "maze";
    current.onEnter?.(null, { debug: true });
  }
  snapCamera(current);
  renderer.render(current.scene, camera);
  lastTime = performance.now();
  requestAnimationFrame(loop);

  await wait(350);
  loadingEl.classList.add("hide");
  loadingDone = true;
  setTimeout(() => brandEl.classList.add("show"), 500);
  setTimeout(() => {
    if (current === sceneCache.get("hallway") && !dialogue.open) {
      current.onEnter?.(null);
    }
  }, 850);
}

boot().catch((error) => {
  console.error(error);
  toast("Hmm, something went wrong loading the party 😢", 5000);
});

window.__arnouba = {
  get current() {
    return current;
  },
  get currentName() {
    return currentName;
  },
  get transitioning() {
    return transitioning;
  },
  transition,
  ctx,
  audio: audioManager,
  camera,
  renderer,
};
