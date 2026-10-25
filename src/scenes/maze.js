import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config.js";
import { createRabbit } from "../models/rabbit.js";
import { createScaryFox } from "../models/scaryFox.js";
import {
  createMazeWorld,
  createKeyMesh,
  createHidingSpot,
  createRoomSet,
  createExitDoor,
  createFakeExit,
  createPainting,
  createBearFriend,
  createDoll,
  createWallWriting,
  createRadio,
  createPowerUp,
  createSlamDoor,
  createFallingShelf,
} from "../models/mazeProps.js";
import { createGhost, GHOST_TYPES } from "../models/ghosts.js";
import {
  createCursedFrame,
  createMirror,
  createCRT,
  createCeilingFace,
  createScreamerEnemy,
  createCheckpointCandle,
  createDoorFace,
} from "../models/screamer.js";
import { ScreamerSystem } from "../game/screamers.js";
import { generateMaze, MAZE_CELL } from "../game/mazeGen.js";
import { AUDIO_FALLBACKS } from "../audio/audioMap.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DIFFICULTY = {
  easy: { lives: 5, foxSpeed: 2.65, name: "Easy" },
  normal: { lives: 3, foxSpeed: 3.45, name: "Normal" },
  hard: { lives: 2, foxSpeed: 4.05, name: "Hard" },
};

function angleLerp(from, to, t) {
  let delta = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

function findPath(maze, start, end) {
  const key = (r, c) => `${r},${c}`;
  const queue = [start];
  const seen = new Set([key(start.r, start.c)]);
  const prev = new Map();
  const dirs = [
    ["n", -1, 0],
    ["e", 0, 1],
    ["s", 1, 0],
    ["w", 0, -1],
  ];
  while (queue.length) {
    const cell = queue.shift();
    if (cell.r === end.r && cell.c === end.c) break;
    for (const [dir, dr, dc] of dirs) {
      if (maze.grid[cell.r][cell.c][dir]) continue;
      const nr = cell.r + dr;
      const nc = cell.c + dc;
      if (nr < 0 || nr >= maze.size || nc < 0 || nc >= maze.size) continue;
      const k = key(nr, nc);
      if (seen.has(k)) continue;
      seen.add(k);
      prev.set(k, cell);
      queue.push({ r: nr, c: nc });
    }
  }
  if (!seen.has(key(end.r, end.c))) return [];
  const path = [];
  let cur = end;
  while (!(cur.r === start.r && cur.c === start.c)) {
    path.unshift(cur);
    cur = prev.get(key(cur.r, cur.c));
    if (!cur) return [];
  }
  return path;
}

export function createMaze(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0610);
  scene.fog = new THREE.FogExp2(0x0b0610, 0.045);

  const maze = generateMaze(CONFIG.maze.size, CONFIG.maze.seed);
  const startCell = (() => {
    const { r, c } = maze.start;
    const next = maze.grid[r]?.[c + 1];
    if (next && !maze.grid[r][c].e) return { r, c: c + 1 };
    return { r, c };
  })();
  const world = createMazeWorld(maze);
  scene.add(world.group);

  const horror = new ScreamerSystem({
    scene,
    camera: window.__arnouba?.camera || null,
    audio: ctx.audio,
    onShake: (amount) => {
      state.shakeTimer = Math.max(state.shakeTimer, 0.75 + amount * 0.55);
      document.body.classList.add("maze-shake");
    },
    onLifeLoss: () => screamerLifeLoss(),
    onBuild: () => {
      ctx.audio?.setMusicState("calm", { force: true, fade: 0.2 });
      world.lamps.forEach((lamp, i) => {
        gsap.to(lamp.light, { intensity: 0.04, duration: 0.18, yoyo: true, repeat: 4, delay: i * 0.02 });
      });
    },
    onAftermath: () => {
      showVignette(1200);
      showPrompt(CONFIG.maze.texts.scareAfter, 2200);
    },
    onDone: () => {
      if (state.screamerLifeLoss) {
        state.screamerLifeLoss = false;
        if (state.lives <= 0) failGame();
        else respawn();
      }
    },
  });

  const hemi = new THREE.HemisphereLight(0x7a4c62, 0x160b12, 0.55);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x5a3040, 0.32);
  scene.add(ambient);

  const rabbit = createRabbit();
  rabbit.setOutfit("casual");
  rabbit.group.scale.setScalar(0.88);
  scene.add(rabbit.group);
  scene.add(rabbit.effects);

  const fox = createScaryFox();
  fox.group.scale.setScalar(1.05);
  scene.add(fox.group);

  const flashlight = new THREE.SpotLight(0xffd6e4, 22, 15, 0.52, 0.5, 1.0);
  flashlight.castShadow = false;
  scene.add(flashlight);
  scene.add(flashlight.target);
  const torchGlow = new THREE.PointLight(0xff9fc4, 0.8, 4, 1.2);
  scene.add(torchGlow);

  const keys = maze.keys.map((def, i) => {
    const mesh = createKeyMesh(i);
    const pos = maze.cellToWorld(def.c, def.r);
    mesh.group.position.set(pos.x, 1.0, pos.z);
    scene.add(mesh.group);
    return { def, mesh, initial: pos, collected: false };
  });

  const hidingSpots = maze.hidingSpots.map((def, i) => {
    const spot = createHidingSpot(def.type);
    const pos = maze.cellToWorld(def.c, def.r);
    const offset = i % 2 ? 0.55 : -0.55;
    spot.group.position.set(pos.x + offset, 0, pos.z - offset);
    spot.group.rotation.y = i % 2 ? -0.3 : 0.25;
    scene.add(spot.group);
    return { ...def, mesh: spot, x: spot.group.position.x, z: spot.group.position.z };
  });

  const roomObjects = [];
  for (const room of maze.rooms) {
    const pos = maze.cellToWorld(room.c, room.r);
    const set = createRoomSet(room.type);
    set.group.position.set(pos.x, 0, pos.z);
    set.group.rotation.y = room.type === "library" ? Math.PI : 0;
    scene.add(set.group);
    roomObjects.push({ ...room, set, x: pos.x, z: pos.z });
  }

  const exitPos = maze.cellToWorld(maze.exit.c, maze.exit.r);
  const exitDoor = createExitDoor();
  exitDoor.group.position.set(exitPos.x, 0, exitPos.z + 0.9);
  exitDoor.group.rotation.y = Math.PI;
  exitDoor.setLocks(0);
  scene.add(exitDoor.group);

  const fakeRoom = maze.rooms.find((r) => r.type === "toyroom") || maze.rooms[0];
  const fakePos = fakeRoom ? maze.cellToWorld(fakeRoom.c, fakeRoom.r) : { x: 0, z: 0 };
  const fakeExit = createFakeExit();
  fakeExit.group.position.set(fakePos.x, 0, fakePos.z + 0.7);
  fakeExit.group.rotation.y = Math.PI;
  scene.add(fakeExit.group);

  const libraryRoom = roomObjects.find((r) => r.type === "library") || roomObjects[0];
  const painting =createPainting(CONFIG.photos[0]?.src || `${import.meta.env.BASE_URL}photos/na_ou_arnouba.jpg`);
  if (libraryRoom) {
    painting.group.position.set(libraryRoom.x, 0, libraryRoom.z - 1.1);
    painting.group.rotation.y = 0;
  }
  scene.add(painting.group);

  const kitchenRoom = roomObjects.find((r) => r.type === "kitchen");
  const bear = createBearFriend();
  if (kitchenRoom) {
    bear.group.position.set(kitchenRoom.x + 0.7, 0, kitchenRoom.z + 0.45);
    bear.group.rotation.y = -0.4;
  }
  scene.add(bear.group);

  const bedroomRoom = roomObjects.find((r) => r.type === "bedroom");
  const doll = createDoll();
  if (bedroomRoom) {
    doll.group.position.set(bedroomRoom.x - 0.8, 0.25, bedroomRoom.z + 0.2);
    doll.group.rotation.y = 0.3;
  }
  scene.add(doll.group);

  const radio = createRadio();
  const toyRoom = roomObjects.find((r) => r.type === "toyroom");
  if (toyRoom) {
    radio.group.position.set(toyRoom.x + 0.7, 0.65, toyRoom.z - 0.6);
  }
  scene.add(radio.group);

  const slamDoor = createSlamDoor();
  if (kitchenRoom) {
    slamDoor.group.position.set(kitchenRoom.x - 1.2, 0, kitchenRoom.z - 0.8);
    slamDoor.group.rotation.y = 0.35;
  } else {
    slamDoor.group.position.set(exitPos.x - 1.4, 0, exitPos.z - 1.2);
  }
  scene.add(slamDoor.group);

  const fallingShelf = createFallingShelf();
  if (toyRoom) {
    fallingShelf.group.position.set(toyRoom.x - 1.1, 0, toyRoom.z + 0.7);
    fallingShelf.group.rotation.y = -0.3;
  } else {
    fallingShelf.group.position.set(fakePos.x - 1.2, 0, fakePos.z + 0.9);
  }
  scene.add(fallingShelf.group);

  const writings = [];
  const textCells = maze.wallTextCells.slice(0, 10);
  textCells.forEach(({ r, c }, i) => {
    const cell = maze.grid[r][c];
    const { x, z } = maze.cellToWorld(c, r);
    const writing = createWallWriting(CONFIG.maze.wallTexts[i % CONFIG.maze.wallTexts.length]);
    if (cell.n) {
      writing.mesh.position.set(x, 1.45, z - MAZE_CELL / 2 + 0.17);
    } else if (cell.w) {
      writing.mesh.position.set(x - MAZE_CELL / 2 + 0.17, 1.45, z);
      writing.mesh.rotation.y = Math.PI / 2;
    } else if (cell.e) {
      writing.mesh.position.set(x + MAZE_CELL / 2 - 0.17, 1.45, z);
      writing.mesh.rotation.y = -Math.PI / 2;
    } else {
      writing.mesh.position.set(x, 1.45, z + MAZE_CELL / 2 - 0.17);
      writing.mesh.rotation.y = Math.PI;
    }
    scene.add(writing.mesh);
    writings.push({ writing, revealed: false, x: writing.mesh.position.x, z: writing.mesh.position.z });
  });

  const spawnCells = [];
  for (let r = 0; r < maze.size; r += 1) {
    for (let c = 0; c < maze.size; c += 1) {
      if (maze.distance(r, c) < 4) continue;
      if (r === maze.exit.r && c === maze.exit.c) continue;
      spawnCells.push({ r, c });
    }
  }
  function cellFor(index, salt = 0) {
    if (!spawnCells.length) return { r: maze.start.r, c: maze.start.c };
    return spawnCells[(index * 13 + salt * 7) % spawnCells.length];
  }

  const hallwayFrame = createCursedFrame(horror.texture, { behavior: "lunge" });
  hallwayFrame.group.visible = false;
  scene.add(hallwayFrame.group);

  const mirror = createMirror(horror.texture);
  if (bedroomRoom) {
    mirror.group.position.set(bedroomRoom.x + 1.1, 0, bedroomRoom.z - 0.9);
    mirror.group.rotation.y = -0.5;
  } else {
    const mirrorCell = cellFor(4, 8);
    const mirrorPos = maze.cellToWorld(mirrorCell.c, mirrorCell.r);
    mirror.group.position.set(mirrorPos.x, 0, mirrorPos.z);
  }
  scene.add(mirror.group);

  const crt = createCRT(horror.texture);
  if (toyRoom) {
    crt.group.position.set(toyRoom.x - 0.8, 0, toyRoom.z + 0.6);
    crt.group.rotation.y = 0.5;
  } else {
    const crtCell = cellFor(6, 12);
    const crtPos = maze.cellToWorld(crtCell.c, crtCell.r);
    crt.group.position.set(crtPos.x, 0, crtPos.z);
  }
  scene.add(crt.group);

  const ceilingCell = cellFor(8, 14);
  const ceilingPos = maze.cellToWorld(ceilingCell.c, ceilingCell.r);
  const ceilingFace = createCeilingFace(horror.texture);
  ceilingFace.group.position.set(ceilingPos.x, 0, ceilingPos.z);
  scene.add(ceilingFace.group);

  const corridorFigure = createScreamerEnemy(horror.texture, { scale: 1.28 });
  scene.add(corridorFigure.group);
  const screamerEnemy = createScreamerEnemy(horror.texture, { scale: 1.1 });
  scene.add(screamerEnemy.group);
  const enemyState = { active: false, stunTimer: 0, respawnTimer: 0, lifeLoss: false, screamCooldown: 0 };

  const doorFace = createDoorFace(horror.texture);
  doorFace.group.position.set(exitPos.x, 0, exitPos.z + 0.45);
  doorFace.group.rotation.y = Math.PI;
  scene.add(doorFace.group);

  const checkpointCandles = [];
  function addCheckpointCandle(x, z, r, c, zone) {
    const candle = createCheckpointCandle();
    candle.group.position.set(x, 0, z);
    scene.add(candle.group);
    checkpointCandles.push({ candle, r, c, zone });
  }
  addCheckpointCandle(startCell ? maze.cellToWorld(startCell.c, startCell.r).x : 0, startCell ? maze.cellToWorld(startCell.c, startCell.r).z : 0, startCell.r, startCell.c, 1);
  if (libraryRoom) addCheckpointCandle(libraryRoom.x - 1.0, libraryRoom.z + 1.0, libraryRoom.r, libraryRoom.c, 2);
  if (kitchenRoom) addCheckpointCandle(kitchenRoom.x + 1.0, kitchenRoom.z + 1.0, kitchenRoom.r, kitchenRoom.c, 2);
  addCheckpointCandle(exitPos.x - 1.2, exitPos.z - 1.4, maze.exit.r, maze.exit.c, 3);

  mirror.onScare = () => triggerScreamer("mirror");
  crt.onScare = () => triggerScreamer("tv");
  ceilingFace.onScare = () => triggerScreamer("ceiling");

  const ghostTypes = GHOST_TYPES.filter((type) => type !== "boss");
  const ghostCount = CONFIG.maze.ghostCounts[CONFIG.maze.difficulty] || CONFIG.maze.ghostCounts.normal;
  const ghostEntries = [];
  for (let i = 0; i < ghostCount; i += 1) {
    const type = ghostTypes[i % ghostTypes.length];
    const model = createGhost(type);
    const cell = cellFor(i, 3);
    const pos = maze.cellToWorld(cell.c, cell.r);
    model.resetAt(pos.x, pos.z);
    model.group.visible = false;
    model.state.active = false;
    scene.add(model.group);
    ghostEntries.push({
      model,
      type,
      home: { x: pos.x, z: pos.z },
      cell,
      mode: "IDLE_FLOAT",
      timer: 0,
      path: [],
      repath: 0,
      soundTimer: 1 + Math.random() * 2.5,
      respawnTimer: 0,
      active: true,
      wanderTarget: null,
    });
  }
  const boss = createGhost("boss");
  boss.group.visible = false;
  boss.state.active = false;
  scene.add(boss.group);

  const powerTypes = ["battery", "boots", "heart", "shield"];
  const powerUps = [];
  for (let i = 0; i < (CONFIG.maze.powerUps || 6); i += 1) {
    const type = powerTypes[i % powerTypes.length];
    const model = createPowerUp(type);
    const cell = cellFor(i, 9);
    const pos = maze.cellToWorld(cell.c, cell.r);
    model.group.position.set(pos.x, 0, pos.z);
    model.group.visible = false;
    scene.add(model.group);
    powerUps.push({
      model,
      type,
      home: { x: pos.x, z: pos.z },
      collected: false,
      bob: Math.random() * 6,
    });
  }

  const hud = {
    root: document.getElementById("mazeHud"),
    lives: document.getElementById("mazeLives"),
    keys: document.getElementById("mazeKeys"),
    timer: document.getElementById("mazeTimer"),
    score: document.getElementById("mazeScore"),
    combo: document.getElementById("mazeCombo"),
    stamina: document.getElementById("mazeStaminaFill"),
    battery: document.getElementById("mazeBatteryFill"),
    pause: document.getElementById("mazePauseBtn"),
    joystick: document.getElementById("mazeJoystick"),
    stick: document.getElementById("mazeStick"),
    actions: document.getElementById("mazeActions"),
    hide: document.getElementById("mazeHideBtn"),
    torch: document.getElementById("mazeTorchBtn"),
    run: document.getElementById("mazeRunBtn"),
    dash: document.getElementById("mazeDashBtn"),
    blast: document.getElementById("mazeBlastBtn"),
    interact: document.getElementById("mazeInteractBtn"),
    prompt: document.getElementById("mazePrompt"),
    arrow: document.getElementById("mazeHintArrow"),
    audioLoad: document.getElementById("mazeAudioLoad"),
    audioLoadText: document.getElementById("mazeAudioLoadText"),
    audioLoadFill: document.getElementById("mazeAudioLoadFill"),
    zone: document.getElementById("mazeZone"),
    objective: document.getElementById("mazeObjective"),
    controlHints: document.getElementById("mazeControlHints"),
    lookHint: document.getElementById("mazeLookHint"),
    debug: document.getElementById("mazeDebug"),
    warning: document.getElementById("mazeWarning"),
    warningTitle: document.getElementById("mazeWarningTitle"),
    warningText: document.getElementById("mazeWarningText"),
    warningGoal: document.getElementById("mazeWarningGoal"),
    warningControls: document.getElementById("mazeWarningControls"),
    start: document.getElementById("mazeStartBtn"),
    pauseOverlay: document.getElementById("mazePause"),
    pauseClose: document.getElementById("mazePauseClose"),
    fail: document.getElementById("mazeFail"),
    failClose: document.getElementById("mazeFailClose"),
    win: document.getElementById("mazeWin"),
    winClose: document.getElementById("mazeWinClose"),
    flash: document.getElementById("mazeFlash"),
    vignette: document.getElementById("mazeVignette"),
    dashFx: document.getElementById("mazeDashFx"),
    jumpscare: document.getElementById("mazeJumpscare"),
  };

  const state = {
    active: false,
    started: false,
    paused: false,
    leaving: false,
    caught: false,
    hidden: false,
    gameState: "TITLE",
    zone: 1,
    tutorialStep: 0,
    tutorialTimer: 0,
    tutorialTorch: false,
    tutorialHid: false,
    pad: { x: 0, y: 0 },
    gamepadPrev: [],
    controlHintsTimer: 20,
    camManualTimer: 0,
    pointerLocked: false,
    compassTimer: 0,
    lostShown: false,
    checkpointSaved: false,
    hideScareArmed: false,
    corridorStarted: false,
    corridorPhase: "idle",
    corridorTimer: 0,
    corridorFlicker: 0,
    enemySpawnTimer: 10,
    finalScareStarted: false,
    screamerLifeLoss: false,
    flashlightOn: true,
    keysFound: 0,
    lives: 3,
    maxLives: 3,
    time: 0,
    finalChase: false,
    finalTimer: 0,
    exitOpening: false,
    difficulty: "normal",
    checkpoint: { ...startCell },
    hintTimer: 0,
    promptTimer: 0,
    promptUntil: 0,
    shakeTimer: 0,
    blackout: 0,
    scares: {},
    bearGaveKey: false,
    dollFallen: false,
    fakeOpened: false,
    paintingActive: false,
    radioPlayed: false,
    duckPlayed: false,
    handsPlayed: false,
    batsPlayed: false,
    trapdoorPlayed: false,
    randomScare: false,
    debug: new URLSearchParams(location.search).has("debug"),
    fps: 0,
    fpsAccum: 0,
    fpsFrames: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    stamina: 1,
    battery: 1,
    runToggle: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashDir: { x: 0, z: -1 },
    invuln: 0,
    shield: 0,
    speedBoost: 0,
    blastCharge: 0,
    blastCharging: false,
    blastCooldown: 0,
    hitStop: 0,
    damageCooldown: 0,
    nearInteract: null,
    interactCooldown: 0,
    bossActive: false,
    bossStun: 0,
    bossRespawn: 0,
    foxStun: 0,
    finalChaseStarted: false,
    doorSlammed: false,
    shelfToppled: false,
    lightsFlicked: false,
    winReady: false,
    ghostAudioTimer: 0,
    footstepTimer: 0,
    foxGrowlTimer: 0,
    lastInteractKey: null,
    lastMove: { x: 0, z: -1 },
    debugInfo: { ix: 0, iz: 0, moveX: 0, moveZ: 0, screenX: 0 },
  };



  function screamerLifeLoss() {
    if (!state.active || state.hidden || state.leaving) return;
    state.lives = Math.max(0, state.lives - 1);
    state.damageCooldown = 2;
    state.invuln = 1.6;
    updateHud();
    ctx.audio?.duck(0.2, 500);
    playAudio("hurt");
    if (state.lives <= 0) {
      state.screamerLifeLoss = true;
    }
  }

  function triggerScreamer(type = "jump", options = {}) {
    if (!state.active || state.paused || state.leaving) return Promise.resolve(false);
    if (!options.force && state.gameState === "TUTORIAL") return Promise.resolve(false);
    return horror.trigger(type, options);
  }

  const MAZE_SAVE_KEY = "arnouba-maze-checkpoint-v1";

  function saveCheckpoint() {
    try {
      localStorage.setItem(
        MAZE_SAVE_KEY,
        JSON.stringify({
          r: state.checkpoint.r,
          c: state.checkpoint.c,
          zone: state.zone,
          keys: state.keysFound,
          lives: state.lives,
          time: state.time,
          keysCollected: keys.map((key) => key.collected),
        })
      );
    } catch {
      // Storage can be unavailable in private mode.
    }
  }

  function playAudio(key, options = {}) {
    const manager = ctx.audio;
    if (manager?.play(key, options)) return true;
    const fallback = AUDIO_FALLBACKS[key];
    if (fallback) ctx.sfx(fallback);
    return false;
  }

  function playAudioAt(key, position, options = {}) {
    return playAudio(key, { ...options, position });
  }

  function showAudioLoad() {
    if (hud.audioLoadText) hud.audioLoadText.textContent = CONFIG.maze.texts.audioLoading;
    if (hud.audioLoadFill) hud.audioLoadFill.style.width = "0%";
    if (hud.audioLoad) hud.audioLoad.hidden = false;
  }

  function setAudioLoadProgress(progress) {
    if (hud.audioLoadFill) {
      hud.audioLoadFill.style.width = `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;
    }
  }

  function hideAudioLoad() {
    if (hud.audioLoad) hud.audioLoad.hidden = true;
  }

  function startMazeAudio() {
    const manager = ctx.audio;
    if (!manager) {
      hideAudioLoad();
      return;
    }
    showAudioLoad();
    manager.onProgress = (progress) => setAudioLoadProgress(progress);
    manager.stopMaze();
    manager.startMaze();
    const result = manager.preload();
    if (result?.then) {
      result.then(hideAudioLoad).catch(hideAudioLoad);
    } else {
      hideAudioLoad();
    }
  }

  const player = {
    x: 0,
    z: 0,
    yaw: 0,
    camYaw: 0,
    camPitch: 0,
    speed: 0,
    running: false,
    moving: false,
  };

  const foxState = {
    mode: "PATROL",
    cell: { r: maze.exit.r, c: maze.exit.c },
    path: [],
    repath: 0,
    lastKnown: null,
    searchTimer: 0,
    patrolTimer: 0,
    cooldown: 0,
  };

  const keysDown = new Set();
  const joy = { x: 0, y: 0, active: false, id: null };
  const mouseLook = { dragging: false, id: null, lastX: 0, lastY: 0, moved: 0, charge: false, locked: false };
  const sceneCanvas = document.getElementById("scene");
  const cameraRaycaster = new THREE.Raycaster();
  const cameraRayOrigin = new THREE.Vector3();
  const cameraRayDir = new THREE.Vector3();

  function updateHud() {
    if (!hud.root) return;
    hud.lives.textContent = "\u{1F497}".repeat(Math.max(0, state.lives)) + "\u{1F5A4}".repeat(Math.max(0, state.maxLives - state.lives));
    hud.keys.textContent = `\u{1F511} ${state.keysFound} / ${CONFIG.maze.keys}`;
    if (hud.objective) {
      hud.objective.textContent = `${CONFIG.maze.texts.objective} (${state.keysFound}/${CONFIG.maze.keys})`;
    }
    if (hud.zone) {
      const zoneKey = `zone${Math.max(1, Math.min(3, state.zone))}`;
      hud.zone.textContent = CONFIG.maze.texts[zoneKey] || CONFIG.maze.texts.zone1;
    }
    const minutes = Math.floor(state.time / 60).toString().padStart(2, "0");
    const seconds = Math.floor(state.time % 60).toString().padStart(2, "0");
    hud.timer.textContent = `${minutes}:${seconds}`;
    if (hud.score) hud.score.textContent = String(state.score);
    if (hud.stamina) hud.stamina.style.width = `${Math.max(0, state.stamina) * 100}%`;
    if (hud.battery) hud.battery.style.width = `${Math.max(0, state.battery) * 100}%`;
    if (hud.combo) {
      hud.combo.hidden = state.combo < 2;
      hud.combo.textContent = `x${state.combo}`;
    }
    if (hud.torch) hud.torch.classList.toggle("active", state.flashlightOn);
    if (hud.hide) hud.hide.textContent = state.hidden ? "Come out" : "Hide";
    if (hud.run) hud.run.classList.toggle("active", player.running);
    if (hud.dash) {
      hud.dash.disabled = state.dashCooldown > 0 || state.dashTimer > 0;
      hud.dash.textContent = state.dashCooldown > 0 ? state.dashCooldown.toFixed(1) : "Dash";
    }
    if (hud.blast) hud.blast.disabled = state.battery < CONFIG.maze.battery.blastCost;
    if (hud.interact) hud.interact.textContent = state.nearInteract ? state.nearInteract.label : "Slam";
  }

  function showPrompt(text, ms = 2200) {
    if (!hud.prompt) return;
    hud.prompt.textContent = text;
    hud.prompt.hidden = false;
    state.promptUntil = performance.now() + ms;
    clearTimeout(state.promptTimer);
    state.promptTimer = setTimeout(() => {
      if (hud.prompt && performance.now() >= state.promptUntil - 20) hud.prompt.hidden = true;
    }, ms);
  }

  function addScore(points) {
    state.combo = state.comboTimer > 0 ? state.combo + 1 : 1;
    state.comboTimer = 4;
    state.score += points * state.combo;
    updateHud();
  }

  function showHintArrow(target) {
    if (!hud.arrow) return;
    const dx = target.x - player.x;
    const dz = target.z - player.z;
    const worldAngle = Math.atan2(dx, dz);
    const cameraForwardAngle = player.camYaw + Math.PI;
    const angle = worldAngle - cameraForwardAngle;
    hud.arrow.hidden = false;
    hud.arrow.style.transform = `translateX(-50%) rotate(${angle}rad)`;
    state.hintTimer = 3;
  }

  function setCheckpoint(r, c) {
    state.checkpoint = { r, c };
    const entry = checkpointCandles.find((item) => item.r === r && item.c === c);
    if (entry) {
      entry.candle.activate();
      state.zone = Math.max(state.zone, entry.zone);
    }
    state.checkpointSaved = true;
    saveCheckpoint();
    showPrompt(CONFIG.maze.texts.checkpoint, 2200);
  }

  function openYawForCell(r, c) {
    const cell = maze.grid[r]?.[c];
    if (!cell) return 0;
    if (!cell.s) return 0;
    if (!cell.e) return Math.PI / 2;
    if (!cell.n) return Math.PI;
    if (!cell.w) return -Math.PI / 2;
    return 0;
  }

  function resetPlayer() {
    const pos = maze.cellToWorld(state.checkpoint.c, state.checkpoint.r);
    const yaw = openYawForCell(state.checkpoint.r, state.checkpoint.c);
    player.x = pos.x;
    player.z = pos.z;
    player.yaw = yaw;
    player.camYaw = yaw - Math.PI;
    player.camPitch = 0;
    player.speed = 0;
    player.moving = false;
    player.running = false;
    state.dashTimer = 0;
    state.dashCooldown = 0;
    state.dashDir = { x: 0, z: -1 };
    state.lastMove = { x: 0, z: -1 };
    state.blastCharge = 0;
    state.blastCharging = false;
    rabbit.group.visible = true;
    rabbit.setPosition(pos.x, 0, pos.z);
    rabbit.group.rotation.y = yaw;
    rabbit.setWalking(false);
    state.hidden = false;
  }

  function resetFox() {
    const pos = maze.cellToWorld(maze.exit.c, maze.exit.r);
    fox.group.position.set(pos.x, 0, pos.z);
    fox.group.rotation.y = Math.PI;
    foxState.cell = { r: maze.exit.r, c: maze.exit.c };
    foxState.mode = "PATROL";
    foxState.path = [];
    foxState.repath = 0;
    foxState.lastKnown = null;
    foxState.searchTimer = 0;
    foxState.patrolTimer = 0;
    foxState.cooldown = 1.5;
    fox.setMode("PATROL");
  }

  function resetGame() {
    const diff = DIFFICULTY.normal;
    state.difficulty = "normal";
    state.maxLives = diff.lives;
    state.lives = diff.lives;
    state.keysFound = 0;
    state.time = 0;
    state.score = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.stamina = 1;
    state.battery = 1;
    state.runToggle = false;
    state.dashTimer = 0;
    state.dashCooldown = 0;
    state.invuln = 0;
    state.shield = 0;
    state.speedBoost = 0;
    state.blastCharge = 0;
    state.blastCharging = false;
    state.blastCooldown = 0;
    state.hitStop = 0;
    state.damageCooldown = 0;
    state.interactCooldown = 0;
    state.nearInteract = null;
    state.bossActive = false;
    state.bossStun = 0;
    state.bossRespawn = 0;
    state.foxStun = 0;
    state.finalChaseStarted = false;
    state.doorSlammed = false;
    state.shelfToppled = false;
    state.lightsFlicked = false;
    state.winReady = false;
    state.lastInteractKey = null;
    state.finalChase = false;
    state.finalTimer = 0;
    state.exitOpening = false;
    state.caught = false;
    state.paused = false;
    state.hidden = false;
    state.flashlightOn = true;
    state.checkpoint = { ...startCell };
    state.scares = {};
    state.gameState = "TITLE";
    state.zone = 1;
    state.tutorialStep = 0;
    state.tutorialTimer = 0;
    state.tutorialTorch = false;
    state.tutorialHid = false;
    state.pad = { x: 0, y: 0 };
    state.gamepadPrev = [];
    state.controlHintsTimer = 20;
    state.camManualTimer = 0;
    state.pointerLocked = false;
    state.compassTimer = 0;
    state.lostShown = false;
    state.checkpointSaved = false;
    state.hideScareArmed = false;
    state.corridorStarted = false;
    state.corridorPhase = "idle";
    state.corridorTimer = 0;
    state.corridorFlicker = 0;
    state.enemySpawnTimer = 10;
    state.finalScareStarted = false;
    state.screamerLifeLoss = false;
    state.bearGaveKey = false;
    state.dollFallen = false;
    state.fakeOpened = false;
    state.paintingActive = false;
    state.radioPlayed = false;
    state.duckPlayed = false;
    state.handsPlayed = false;
    state.batsPlayed = false;
    state.trapdoorPlayed = false;
    state.hintTimer = 0;
    state.footstepTimer = 0;
    state.foxGrowlTimer = 0;
    state.blackout = 0;
    keys.forEach((key) => {
      key.collected = false;
      key.def.collected = false;
      key.mesh.group.visible = true;
      key.mesh.group.scale.set(1, 1, 1);
      key.mesh.group.position.set(key.initial.x, 1.0, key.initial.z);
    });
    powerUps.forEach((power) => {
      power.collected = false;
      power.model.group.position.set(power.home.x, 0, power.home.z);
      power.model.reset();
    });
    resetGhosts();
    resetFox();
    slamDoor.reset();
    fallingShelf.reset();
    exitDoor.setLocks(0);
    exitDoor.group.visible = true;
    fakeExit.group.visible = true;
    painting.group.visible = true;
    doll.group.visible = true;
    doll.group.rotation.z = 0;
    bear.group.visible = true;
    writings.forEach((w) => {
      w.revealed = false;
      w.writing.mesh.material.opacity = 0;
    });
    resetPlayer();
    horror.cooldownUntil = 0;
    horror.busy = false;
    hallwayFrame.reset();
    hallwayFrame.group.visible = false;
    mirror.reset();
    crt.reset();
    ceilingFace.reset();
    corridorFigure.group.visible = false;
    corridorFigure.state.active = false;
    screamerEnemy.group.visible = false;
    screamerEnemy.state.active = false;
    enemyState.active = false;
    enemyState.stunTimer = 0;
    enemyState.respawnTimer = 0;
    enemyState.lifeLoss = false;
    enemyState.screamCooldown = 0;
    doorFace.hide();
    checkpointCandles.forEach((entry) => entry.candle.reset());
    document.body.classList.add("maze-active");
    if (hud.fail) hud.fail.hidden = true;
    if (hud.win) hud.win.hidden = true;
    if (hud.jumpscare) hud.jumpscare.hidden = true;
    if (hud.pauseOverlay) hud.pauseOverlay.hidden = true;
    if (hud.warning) hud.warning.hidden = true;
    if (hud.root) hud.root.hidden = false;
    if (hud.joystick) hud.joystick.hidden = false;
    if (hud.actions) hud.actions.hidden = false;
    if (hud.debug) hud.debug.hidden = !state.debug;
    updateHud();
  }

  function beginGame() {
    resetGame();
    state.started = true;
    state.active = true;
    state.leaving = false;
    state.gameState = "TUTORIAL";
    state.controlHintsTimer = 20;
    if (hud.warning) hud.warning.hidden = true;
    if (hud.root) hud.root.hidden = false;
    if (hud.controlHints) {
      hud.controlHints.hidden = false;
      hud.controlHints.textContent = CONFIG.maze.texts.hudControls;
      hud.controlHints.classList.remove("fade");
    }
    if (hud.lookHint) {
      hud.lookHint.hidden = false;
      hud.lookHint.textContent = CONFIG.maze.texts.lookHint;
    }
    startMazeAudio();
    showPrompt(CONFIG.maze.texts.tutorialMove, 3600);
    if (state.randomScare) {
      setTimeout(() => {
        if (state.active && !state.scares.random) {
          state.scares.random = true;
          triggerRandomScare();
        }
      }, 9000);
    }
  }

  function pauseGame(show = true) {
    if (!state.active || state.leaving) return;
    state.paused = show;
    if (hud.pauseOverlay) hud.pauseOverlay.hidden = !show;
    if (hud.actions) hud.actions.hidden = show;
    if (hud.joystick) hud.joystick.hidden = show;
    if (show) {
      ctx.audio?.setHeartbeat(0);
      ctx.audio?.setMusicState("calm");
    }
  }

  function failGame() {
    state.active = false;
    state.caught = false;
    state.gameState = "FAIL";
    if (hud.root) hud.root.hidden = true;
    if (hud.fail) hud.fail.hidden = false;
    document.body.classList.remove("maze-shake");
    ctx.audio?.setHeartbeat(0);
    if (ctx.audio?.ready) ctx.audio.setMusicState("gameover");
    else ctx.sfx("growl");
  }

  function retryFromCheckpoint() {
    state.lives = state.maxLives;
    state.caught = false;
    state.hidden = false;
    state.paused = false;
    state.leaving = false;
    state.active = true;
    state.started = true;
    state.winReady = false;
    state.finalScareStarted = false;
    state.exitOpening = false;
    state.finalChase = state.keysFound >= CONFIG.maze.keys;
    state.gameState = state.keysFound >= CONFIG.maze.keys ? "FINAL_CHASE" : `ZONE${Math.min(3, state.zone)}`;
    resetPlayer();
    resetFox();
    resetGhosts();
    state.bossActive = false;
    boss.group.visible = false;
    boss.state.active = false;
    screamerEnemy.group.visible = false;
    screamerEnemy.state.active = false;
    enemyState.active = false;
    enemyState.respawnTimer = 0;
    if (hud.fail) hud.fail.hidden = true;
    if (hud.jumpscare) hud.jumpscare.hidden = true;
    document.body.classList.remove("maze-shake");
    document.body.classList.add("maze-active");
    ctx.audio?.setMusicState("calm", { force: true, fade: 0.4 });
    ctx.audio?.setHeartbeat(0.15);
    updateHud();
    showPrompt(CONFIG.maze.texts.resumed, 2600);
  }

  function respawn() {
    state.caught = false;
    state.hidden = false;
    resetPlayer();
    resetFox();
    resetGhosts();
    state.bossActive = false;
    boss.group.visible = false;
    boss.state.active = false;
    if (hud.jumpscare) hud.jumpscare.hidden = true;
    document.body.classList.remove("maze-shake");
    if (state.lives <= 0) {
      failGame();
      return;
    }
    state.active = true;
    updateHud();
  }

  function caught() {
    if (state.caught || state.leaving) return;
    state.caught = true;
    state.lives -= 1;
    updateHud();
    ctx.audio?.setHeartbeat(0);
    ctx.audio?.duck(0.12, 900);
    playAudio("jumpscare");
    fox.lunge();
    if (hud.jumpscare) hud.jumpscare.hidden = false;
    document.body.classList.add("maze-shake");
    state.shakeTimer = 1.1;
    if (hud.root) hud.root.hidden = true;
    setTimeout(() => {
      if (hud.jumpscare) hud.jumpscare.hidden = true;
      document.body.classList.remove("maze-shake");
      if (state.lives <= 0) {
        state.caught = false;
        failGame();
      } else {
        respawn();
      }
    }, 1050);
  }

  function collectKey(key, source = "walk") {
    if (key.collected) return;
    key.collected = true;
    key.def.collected = true;
    state.keysFound += 1;
    state.zone = Math.min(3, 1 + state.keysFound);
    state.gameState = state.keysFound >= CONFIG.maze.keys ? "FINAL_CHASE" : `ZONE${state.zone}`;
    key.mesh.collect();
    playAudio("key-pickup");
    addScore(120);
    updateHud();
    showPrompt(`Mabrouk! Key ${state.keysFound} / ${CONFIG.maze.keys} \u{1F511}`, 1800);
    const cell = maze.worldToCell(player.x, player.z);
    setCheckpoint(cell.r, cell.c);
    const next = keys.find((k) => !k.collected);
    showHintArrow(next ? maze.cellToWorld(next.def.c, next.def.r) : exitPos);
    if (source === "bear") showPrompt("El bear 3tak key \u{1F43B}\u{1F497}", 2200);
    if (state.keysFound >= CONFIG.maze.keys) startFinalChase();
  }

  function isSafeZone() {
    if (!state.paintingActive) return false;
    return Math.hypot(player.x - painting.group.position.x, player.z - painting.group.position.z) < 2.2;
  }

  function triggerRandomScare() {
    ctx.audio?.duck(0.4, 500);
    playAudio("whisper");
    showPrompt("Arnouba\u2026 nchoufouk\u2026 \u{1F47B}", 2200);
    world.lamps.forEach((lamp) => {
      gsap.to(lamp.light, { intensity: 0.05, duration: 0.2, yoyo: true, repeat: 5 });
    });
  }

  function resetGhosts() {
    for (const entry of ghostEntries) {
      entry.model.resetAt(entry.home.x, entry.home.z);
      entry.model.setMode("IDLE_FLOAT");
      entry.mode = "IDLE_FLOAT";
      entry.timer = 0.8 + Math.random() * 2;
      entry.path = [];
      entry.repath = 0;
      entry.soundTimer = 1 + Math.random() * 3;
      entry.respawnTimer = 0;
      entry.wanderTarget = null;
    }
    boss.group.visible = false;
    boss.state.active = false;
    state.bossActive = false;
    state.bossStun = 0;
    state.bossRespawn = 0;
  }

  function spawnBoss() {
    const fx = -Math.sin(player.camYaw);
    const fz = -Math.cos(player.camYaw);
    let bx = player.x - fx * 4.2;
    let bz = player.z - fz * 4.2;
    if (!maze.canMove(bx, bz, 0.5)) {
      bx = exitPos.x;
      bz = exitPos.z;
    }
    boss.resetAt(bx, bz);
    boss.group.visible = true;
    boss.setMode("CHASE");
    state.bossActive = true;
    state.bossStun = 0;
    state.bossRespawn = 0;
    playAudioAt("ghost-wail", { x: bx, y: 1.4, z: bz }, { volume: 1 });
  }

  function startFinalChase() {
    if (state.finalChaseStarted) return;
    state.finalChaseStarted = true;
    state.finalChase = true;
    state.gameState = "FINAL_CHASE";
    state.finalTimer = 30;
    spawnBoss();
    foxState.mode = "CHASE";
    fox.setMode("CHASE");
    foxState.repath = 0;
    state.shakeTimer = 1.2;
    document.body.classList.add("maze-shake");
    world.lamps.forEach((lamp, i) => {
      gsap.to(lamp.light, { intensity: 0.08, duration: 0.12, yoyo: true, repeat: 7, delay: i * 0.04 });
    });
    showPrompt(CONFIG.maze.texts.finalChase, 3800);
    ctx.audio?.setMusicState("chase", { force: true, fade: 0.8 });
    playAudioAt("fox-growl", fox.group.position, { volume: 1 });
  }

  function flashScreen(kind = "blast", ms = 220) {
    if (!hud.flash) return;
    hud.flash.className = `maze-flash show${kind === "hit" ? " hit" : ""}`;
    hud.flash.hidden = false;
    setTimeout(() => {
      hud.flash.classList.remove("show");
      setTimeout(() => {
        if (hud.flash && !hud.flash.classList.contains("show")) hud.flash.hidden = true;
      }, 220);
    }, ms);
  }

  function showVignette(ms = 800) {
    if (!hud.vignette) return;
    hud.vignette.hidden = false;
    hud.vignette.classList.add("show");
    setTimeout(() => {
      hud.vignette.classList.remove("show");
      setTimeout(() => {
        if (hud.vignette && !hud.vignette.classList.contains("show")) hud.vignette.hidden = true;
      }, 300);
    }, ms);
  }

  function ghostAudio(entry, dist) {
    entry.soundTimer = 1.5 + Math.random() * 2.5;
    const key =
      entry.type === "kid"
        ? "ghost-giggle"
        : entry.type === "lantern"
          ? "ghost-wail"
          : Math.random() < 0.5
            ? "ghost-wail"
            : "whisper";
    playAudioAt(
      key,
      { x: entry.model.position.x, y: 1.15, z: entry.model.position.z },
      { volume: Math.max(0.35, 1 - dist / 12), rate: 0.92 + Math.random() * 0.16 }
    );
  }

  function stunNearby(x, z, radius, seconds = 2.4) {
    let count = 0;
    for (const entry of ghostEntries) {
      if (!entry.model.active) continue;
      if (Math.hypot(entry.model.position.x - x, entry.model.position.z - z) > radius) continue;
      entry.model.stun(seconds);
      entry.mode = "STUNNED";
      count += 1;
      addScore(70);
    }
    if (state.bossActive && boss.active && Math.hypot(boss.position.x - x, boss.position.z - z) < radius) {
      boss.stun(seconds);
      state.bossStun = seconds;
      count += 1;
      addScore(120);
    }
    if (enemyState.active && screamerEnemy.active && Math.hypot(screamerEnemy.position.x - x, screamerEnemy.position.z - z) < radius) {
      screamerEnemy.stun(seconds);
      enemyState.stunTimer = seconds;
      count += 1;
      addScore(140);
    }
    return count;
  }

  function damagePlayer(entry) {
    if (!state.active || state.hidden || state.invuln > 0 || state.damageCooldown > 0) return;
    state.damageCooldown = 1.4;
    state.invuln = 1.1;
    state.hitStop = 0.12;
    state.shakeTimer = 0.45;
    document.body.classList.add("maze-shake");
    flashScreen("hit", 260);
    showVignette(900);
    if (state.shield > 0) {
      state.shield = 0;
      playAudio("stun-zap");
      showPrompt(CONFIG.maze.texts.shieldBlock, 1800);
      return;
    }
    ctx.audio?.duck(0.25, 350);
    playAudio("hurt");
    state.lives -= 1;
    updateHud();
    const dx = player.x - entry.model.position.x;
    const dz = player.z - entry.model.position.z;
    const dist = Math.max(0.001, Math.hypot(dx, dz));
    const pushX = player.x + (dx / dist) * 1.2;
    const pushZ = player.z + (dz / dist) * 1.2;
    if (maze.canMove(pushX, player.z, 0.3)) player.x = pushX;
    if (maze.canMove(player.x, pushZ, 0.3)) player.z = pushZ;
    rabbit.setPosition(player.x, 0, player.z);
    entry.model.vanish(0.8);
    if (entry.isBoss) {
      state.bossStun = 1.2;
      state.bossRespawn = 4;
    } else {
      entry.respawnTimer = 5;
    }
    showPrompt(CONFIG.maze.texts.ghostHit, 2000);
    if (state.lives <= 0) {
      state.active = false;
      setTimeout(failGame, 550);
    }
  }

  function updateGhosts(dt) {
    for (const entry of ghostEntries) {
      const model = entry.model;
      if (!model.active) {
        entry.respawnTimer = Math.max(0, entry.respawnTimer - dt);
        if (entry.respawnTimer <= 0) {
          model.resetAt(entry.home.x, entry.home.z);
          entry.mode = "IDLE_FLOAT";
          entry.timer = 1 + Math.random() * 2;
        }
        continue;
      }
      if (entry.mode === "STUNNED") {
        model.update(dt, { maze, player });
        if (!model.active) {
          entry.respawnTimer = 5;
          entry.mode = "IDLE_FLOAT";
        }
        continue;
      }
      const dx = player.x - model.position.x;
      const dz = player.z - model.position.z;
      const dist = Math.hypot(dx, dz);
      const los = !state.hidden && maze.hasLineOfSight(model.position.x, model.position.z, player.x, player.z);

      if (entry.mode === "IDLE_FLOAT") {
        entry.timer -= dt;
        if (entry.timer <= 0 || !entry.wanderTarget) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 1.2 + Math.random() * 2.2;
          entry.wanderTarget = {
            x: entry.home.x + Math.cos(angle) * radius,
            z: entry.home.z + Math.sin(angle) * radius,
          };
          entry.timer = 2.2 + Math.random() * 2.6;
        }
        if (entry.wanderTarget) model.moveToward(entry.wanderTarget.x, entry.wanderTarget.z, model.state.speed * 0.32, dt);
        if (!state.hidden && dist < 6.2 && los) {
          entry.mode = "PEEK";
          entry.timer = 1.1;
          model.setMode("PEEK");
        }
      } else if (entry.mode === "PEEK") {
        entry.timer -= dt;
        if (!state.hidden && dist < 8) {
          model.group.rotation.y = Math.atan2(dx, dz);
        }
        if (entry.timer <= 0) {
          entry.mode = state.finalChase ? "CHASE" : "STALK";
          model.setMode(entry.mode);
        }
      } else if (entry.mode === "STALK") {
        model.moveToward(player.x, player.z, model.state.speed * 0.78, dt);
        if (state.hidden || dist > 10) {
          entry.mode = "IDLE_FLOAT";
          entry.timer = 0;
          model.setMode("IDLE_FLOAT");
        } else if (dist < 3.8) {
          entry.mode = "CHASE";
          model.setMode("CHASE");
        }
      } else if (entry.mode === "CHASE") {
        const speed = model.state.chaseSpeed * (state.finalChase ? 1.2 : 1);
        model.moveToward(player.x, player.z, speed, dt);
        if (state.hidden) {
          entry.mode = "SEARCH";
          entry.timer = 3;
          model.setMode("SEARCH");
        } else if (dist > 11) {
          entry.mode = "STALK";
          model.setMode("STALK");
        }
      } else if (entry.mode === "SEARCH") {
        entry.timer -= dt;
        if (los) {
          entry.mode = "CHASE";
          model.setMode("CHASE");
        } else if (entry.timer <= 0) {
          entry.mode = "IDLE_FLOAT";
          entry.timer = 0;
          model.setMode("IDLE_FLOAT");
        }
      }

      model.update(dt, { maze, player });

      if (!state.hidden && dist < (entry.type === "shadow" ? 1.0 : 0.86)) {
        damagePlayer(entry);
      }
      if (!state.hidden && dist < 9) {
        entry.soundTimer -= dt;
        if (entry.soundTimer <= 0) ghostAudio(entry, dist);
      }
    }
  }

  function updateBoss(dt) {
    if (!state.bossActive) return;
    if (state.bossStun > 0) {
      state.bossStun -= dt;
      boss.update(dt, { maze, player });
      if (state.bossStun <= 0) {
        boss.vanish(0.6);
        state.bossRespawn = 3.2;
      }
      return;
    }
    if (!boss.active) {
      state.bossRespawn = Math.max(0, state.bossRespawn - dt);
      if (state.bossRespawn <= 0) spawnBoss();
      return;
    }
    const dx = player.x - boss.position.x;
    const dz = player.z - boss.position.z;
    const dist = Math.hypot(dx, dz);
    boss.moveToward(player.x, player.z, 2.15, dt);
    boss.update(dt, { maze, player });
    if (!state.hidden && dist < 1.5) {
      damagePlayer({ model: boss, isBoss: true });
    }
  }

  function applyPowerUp(power) {
    state.battery = Math.min(1, state.battery + 0.6);
    state.stamina = 1;
    if (power.type === "boots") {
      state.speedBoost = 8;
      showPrompt(CONFIG.maze.texts.powerBoots, 1800);
    } else if (power.type === "heart") {
      state.lives += 1;
      state.maxLives = Math.max(state.maxLives, state.lives);
      showPrompt(CONFIG.maze.texts.powerHeart, 1800);
    } else if (power.type === "shield") {
      state.shield = 5;
      showPrompt(CONFIG.maze.texts.powerShield, 1800);
    } else {
      showPrompt(CONFIG.maze.texts.powerBattery, 1800);
    }
    addScore(60);
    playAudio(power.type === "battery" ? "battery-pickup" : "power-up");
    updateHud();
  }

  function updatePowerUps(dt) {
    for (const power of powerUps) {
      if (power.collected) continue;
      power.model.update(dt);
      if (Math.hypot(player.x - power.model.group.position.x, player.z - power.model.group.position.z) < 1.05) {
        power.collected = true;
        power.model.collect();
        applyPowerUp(power);
      }
    }
  }

  function updateInteractions() {
    let nearest = null;
    let best = 2.2;
    if (!state.doorSlammed) {
      const d = Math.hypot(player.x - slamDoor.group.position.x, player.z - slamDoor.group.position.z);
      if (d < best) {
        best = d;
        nearest = { type: "door", label: "Slam door" };
      }
    }
    if (!state.shelfToppled) {
      const d = Math.hypot(player.x - fallingShelf.group.position.x, player.z - fallingShelf.group.position.z);
      if (d < best) {
        best = d;
        nearest = { type: "shelf", label: "Topple shelf" };
      }
    }
    if (libraryRoom) {
      const d = Math.hypot(player.x - painting.group.position.x, player.z - painting.group.position.z);
      if (d < best) {
        nearest = { type: "lights", label: "Flick lights" };
      }
    }
    const key = nearest?.type || null;
    state.nearInteract = nearest;
    if (key && key !== state.lastInteractKey && performance.now() > state.promptUntil - 250) {
      showPrompt(`E: ${nearest.label} \u{1F4A1}`, 1400);
    }
    state.lastInteractKey = key;
  }

  function interact() {
    if (!state.active || state.paused || state.hidden || state.interactCooldown > 0) return;
    const target = state.nearInteract;
    if (!target) {
      showPrompt("Ma 9ribch mel door / shelf / switch \u{1F62C}", 1400);
      return;
    }
    state.interactCooldown = 0.8;
    if (target.type === "door") {
      state.doorSlammed = true;
      slamDoor.slam();
      const count = stunNearby(slamDoor.group.position.x, slamDoor.group.position.z, 3.4, 2.6);
      playAudioAt("door-slam", slamDoor.group.position, { volume: 0.9 });
      showPrompt(CONFIG.maze.texts.slam + (count ? ` (${count})` : ""), 1800);
      addScore(80);
    } else if (target.type === "shelf") {
      state.shelfToppled = true;
      fallingShelf.topple();
      const count = stunNearby(fallingShelf.group.position.x, fallingShelf.group.position.z, 3.4, 2.6);
      playAudioAt("shelf-crash", fallingShelf.group.position, { volume: 0.9 });
      showPrompt(CONFIG.maze.texts.shelf + (count ? ` (${count})` : ""), 1800);
      addScore(80);
    } else if (target.type === "lights") {
      state.lightsFlicked = !state.lightsFlicked;
      world.lamps.forEach((lamp, i) => {
        gsap.to(lamp.light, {
          intensity: state.lightsFlicked ? 0.05 : lamp.baseIntensity ?? 1.4,
          duration: 0.16,
          yoyo: true,
          repeat: 3,
          delay: i * 0.03,
        });
      });
      const count = stunNearby(painting.group.position.x, painting.group.position.z, 5.2, 2.2);
      playAudioAt("stun-zap", painting.group.position, { volume: 0.7 });
      showPrompt(CONFIG.maze.texts.lights + (count ? ` (${count})` : ""), 1800);
      addScore(50);
    }
    updateHud();
  }

  function startDash() {
    if (!state.active || state.paused || state.hidden || state.dashCooldown > 0 || state.dashTimer > 0) return;
    const cfg = CONFIG.maze.dash;
    let dirX = state.lastMove.x;
    let dirZ = state.lastMove.z;
    if (Math.hypot(dirX, dirZ) < 0.1) {
      dirX = -Math.sin(player.camYaw);
      dirZ = -Math.cos(player.camYaw);
    }
    const len = Math.max(0.001, Math.hypot(dirX, dirZ));
    state.dashDir = { x: dirX / len, z: dirZ / len };
    state.dashTimer = cfg.duration;
    state.dashCooldown = cfg.cooldown;
    state.invuln = Math.max(state.invuln, cfg.invuln);
    playAudio("dash-whoosh");
    if (hud.dashFx) {
      hud.dashFx.hidden = false;
      hud.dashFx.classList.add("show");
    }
    showPrompt(CONFIG.maze.texts.dashReady, 700);
    updateHud();
  }

  function releaseBlast() {
    if (!state.active || state.paused || state.hidden) return;
    const cfg = CONFIG.maze.battery;
    if (state.battery < cfg.blastCost) {
      state.blastCharging = false;
      state.blastCharge = 0;
      showPrompt(CONFIG.maze.texts.lowBattery, 1800);
      return;
    }
    const charge = Math.max(0.25, state.blastCharge);
    state.battery -= cfg.blastCost;
    state.blastCharging = false;
    state.blastCharge = 0;
    state.blastCooldown = 0.35;
    const range = cfg.blastRange * (0.72 + charge * 0.5);
    const fx = -Math.sin(player.camYaw);
    const fz = -Math.cos(player.camYaw);
    let hits = 0;
    for (const entry of ghostEntries) {
      if (!entry.model.active) continue;
      const dx = entry.model.position.x - player.x;
      const dz = entry.model.position.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range || dist < 0.001) continue;
      if ((dx * fx + dz * fz) / dist < Math.cos(cfg.blastAngle)) continue;
      entry.model.stun(3);
      entry.mode = "STUNNED";
      hits += 1;
      addScore(100);
    }
    if (enemyState.active && screamerEnemy.active) {
      const dx = screamerEnemy.position.x - player.x;
      const dz = screamerEnemy.position.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist < range && dist > 0.001 && (dx * fx + dz * fz) / dist >= Math.cos(cfg.blastAngle)) {
        screamerEnemy.stun(2.8);
        enemyState.stunTimer = 2.8;
        hits += 1;
        addScore(140);
      }
    }
    if (state.bossActive && boss.active) {
      const dx = boss.position.x - player.x;
      const dz = boss.position.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist < range && (dx * fx + dz * fz) / Math.max(0.001, dist) >= Math.cos(cfg.blastAngle)) {
        boss.stun(2.6);
        state.bossStun = 2.6;
        hits += 1;
        addScore(150);
      }
    }
    if (state.foxStun <= 0) {
      const dx = fox.group.position.x - player.x;
      const dz = fox.group.position.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist < range && (dx * fx + dz * fz) / Math.max(0.001, dist) >= Math.cos(cfg.blastAngle)) {
        state.foxStun = 3;
        fox.setMode("STUNNED");
        hits += 1;
        addScore(120);
      }
    }
    flashScreen("blast", 200);
    state.shakeTimer = 0.25;
    document.body.classList.add("maze-shake");
    playAudioAt("flashlight-blast", { x: player.x, y: 1.2, z: player.z }, { volume: 0.9 });
    showPrompt(hits ? CONFIG.maze.texts.blastStun : "Blast\u2026 ma sabet walou \u{1F4A5}", 1500);
    updateHud();
  }

  function winGame() {
    if (state.winReady || state.leaving) return;
    state.winReady = true;
    state.active = false;
    state.gameState = "WIN";
    state.exitOpening = true;
    exitDoor.setLocks(0);
    playAudio("lock-click");
    if (hud.root) hud.root.hidden = true;
    if (hud.actions) hud.actions.hidden = true;
    if (hud.joystick) hud.joystick.hidden = true;
    exitDoor.open().then(() => {
      ctx.audio?.setHeartbeat(0);
      if (ctx.audio?.ready) ctx.audio.setMusicState("victory");
      else ctx.sfx("success");
      if (hud.win) hud.win.hidden = false;
    });
  }

  async function finishWin() {
    if (state.leaving) return;
    state.leaving = true;
    if (hud.win) hud.win.hidden = true;
    document.body.classList.remove("maze-active");
    await ctx.transition("party", {
      mazeWin: true,
      time: state.time,
      lives: state.lives,
      difficulty: "normal",
      score: state.score,
    });
  }

  function updateTimers(dt) {
    state.dashCooldown = Math.max(0, state.dashCooldown - dt);
    state.dashTimer = Math.max(0, state.dashTimer - dt);
    state.invuln = Math.max(0, state.invuln - dt);
    state.damageCooldown = Math.max(0, state.damageCooldown - dt);
    state.speedBoost = Math.max(0, state.speedBoost - dt);
    state.shield = Math.max(0, state.shield - dt);
    state.blastCooldown = Math.max(0, state.blastCooldown - dt);
    state.interactCooldown = Math.max(0, state.interactCooldown - dt);
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0) state.combo = 0;
    state.battery = Math.min(1, state.battery + CONFIG.maze.battery.chargeRate * dt);
    if (state.blastCharging) state.blastCharge = Math.min(1, state.blastCharge + dt * 1.6);
    if (state.shakeTimer > 0) {
      state.shakeTimer -= dt;
      if (state.shakeTimer <= 0) document.body.classList.remove("maze-shake");
    }
    if (state.dashTimer <= 0 && hud.dashFx) {
      hud.dashFx.classList.remove("show");
      setTimeout(() => {
        if (hud.dashFx && !hud.dashFx.classList.contains("show")) hud.dashFx.hidden = true;
      }, 160);
    }
  }

  function updatePerception() {
    const dx = player.x - fox.group.position.x;
    const dz = player.z - fox.group.position.z;
    const dist = Math.hypot(dx, dz);
    const yaw = fox.group.rotation.y;
    const facing = Math.sin(yaw) * dx + Math.cos(yaw) * dz;
    const canSee =
      !state.hidden &&
      dist < 10 &&
      facing > dist * 0.45 &&
      maze.hasLineOfSight(fox.group.position.x, fox.group.position.z, player.x, player.z);
    const hearing = state.hidden ? 0 : player.running ? 9.5 : 5.5;
    const canHear = dist < hearing;
    if (canSee) {
      foxState.lastKnown = { x: player.x, z: player.z };
      if (foxState.mode !== "CHASE") {
        foxState.mode = "CHASE";
        fox.setMode("CHASE");
        foxState.repath = 0;
        playAudioAt("fox-growl", fox.group.position, { volume: 0.95 });
      }
    } else if (canHear && foxState.mode === "PATROL") {
      foxState.lastKnown = { x: player.x, z: player.z };
      foxState.mode = "SUSPECT";
      fox.setMode("SUSPECT");
      foxState.searchTimer = 3;
    }
    return { dist, canSee, canHear };
  }

  function choosePatrolTarget() {
    const r = Math.floor(Math.random() * maze.size);
    const c = Math.floor(Math.random() * maze.size);
    return { r, c };
  }

  function updateFox(dt) {
    if (state.foxStun > 0) {
      state.foxStun = Math.max(0, state.foxStun - dt);
      fox.update(dt);
      if (state.foxStun <= 0) {
        foxState.mode = state.finalChase ? "CHASE" : "PATROL";
        fox.setMode(foxState.mode);
        foxState.repath = 0;
        foxState.path = [];
      }
      return;
    }
    const info = updatePerception();
    foxState.cooldown = Math.max(0, foxState.cooldown - dt);
    const diff = DIFFICULTY[state.difficulty] || DIFFICULTY.normal;
    const speed = (state.finalChase ? 4.75 : diff.foxSpeed) * (foxState.mode === "CHASE" ? 1.05 : 0.8);

    if (state.caught || state.leaving) {
      fox.update(dt);
      return;
    }

    if (foxState.mode === "CHASE") {
      if (!info.canSee) {
        foxState.searchTimer -= dt;
        if (foxState.searchTimer <= 0) {
          foxState.mode = "SEARCH";
          fox.setMode("SEARCH");
          foxState.searchTimer = 6;
        }
      } else {
        foxState.searchTimer = 2.2;
      }
      foxState.repath -= dt;
      if (foxState.repath <= 0) {
        foxState.repath = 0.35;
        const target = maze.worldToCell(player.x, player.z);
        foxState.path = findPath(maze, foxState.cell, target);
      }
    } else if (foxState.mode === "SUSPECT") {
      foxState.searchTimer -= dt;
      if (!foxState.path.length) {
        const target = foxState.lastKnown
          ? maze.worldToCell(foxState.lastKnown.x, foxState.lastKnown.z)
          : choosePatrolTarget();
        foxState.path = findPath(maze, foxState.cell, target);
      }
      if (foxState.searchTimer <= 0) {
        foxState.mode = "SEARCH";
        fox.setMode("SEARCH");
        foxState.searchTimer = 5;
      }
    } else if (foxState.mode === "SEARCH") {
      foxState.searchTimer -= dt;
      if (info.canSee) {
        foxState.mode = "CHASE";
        fox.setMode("CHASE");
        foxState.searchTimer = 2;
      } else if (foxState.searchTimer <= 0) {
        foxState.mode = "PATROL";
        fox.setMode("PATROL");
        foxState.patrolTimer = 0;
      } else if (!foxState.path.length) {
        const base = foxState.lastKnown
          ? maze.worldToCell(foxState.lastKnown.x, foxState.lastKnown.z)
          : foxState.cell;
        const nearby = [
          { r: base.r + 1, c: base.c },
          { r: base.r - 1, c: base.c },
          { r: base.r, c: base.c + 1 },
          { r: base.r, c: base.c - 1 },
        ].filter((c) => c.r >= 0 && c.r < maze.size && c.c >= 0 && c.c < maze.size);
        const target = nearby[Math.floor(Math.random() * nearby.length)] || base;
        foxState.path = findPath(maze, foxState.cell, target);
      }
    } else {
      foxState.patrolTimer -= dt;
      if (info.canSee || info.canHear) {
        foxState.lastKnown = { x: player.x, z: player.z };
        foxState.mode = info.canSee ? "CHASE" : "SUSPECT";
        fox.setMode(foxState.mode);
        foxState.searchTimer = 2.5;
        foxState.path = [];
      } else if (!foxState.path.length || foxState.patrolTimer <= 0) {
        foxState.patrolTimer = 6 + Math.random() * 5;
        foxState.path = findPath(maze, foxState.cell, choosePatrolTarget());
      }
    }

    if (foxState.path.length) {
      const next = foxState.path[0];
      const targetPos = maze.cellToWorld(next.c, next.r);
      const dx = targetPos.x - fox.group.position.x;
      const dz = targetPos.z - fox.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.16) {
        fox.group.position.x = targetPos.x;
        fox.group.position.z = targetPos.z;
        foxState.cell = next;
        foxState.path.shift();
      } else {
        const step = Math.min(dist, speed * dt);
        fox.group.position.x += (dx / dist) * step;
        fox.group.position.z += (dz / dist) * step;
        fox.group.rotation.y = angleLerp(fox.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 7));
      }
    }

    fox.update(dt);

    if (
      !state.hidden &&
      !isSafeZone() &&
      info.dist < 1.05 &&
      foxState.mode === "CHASE" &&
      foxState.cooldown <= 0
    ) {
      caught();
    }
  }

  function updatePlayer(dt) {
    if (state.hidden) {
      player.moving = false;
      player.running = false;
      rabbit.setWalking(false);
      rabbit.update(dt);
      return;
    }
    let ix = (keysDown.has("KeyD") || keysDown.has("ArrowRight") ? 1 : 0) -
      (keysDown.has("KeyA") || keysDown.has("ArrowLeft") ? 1 : 0);
    let iz = (keysDown.has("KeyW") || keysDown.has("ArrowUp") ? 1 : 0) -
      (keysDown.has("KeyS") || keysDown.has("ArrowDown") ? 1 : 0);
    if (joy.active) {
      ix += joy.x;
      iz += joy.y;
    }
    if (state.pad) {
      ix += state.pad.x;
      iz += state.pad.y;
    }
    const length = Math.hypot(ix, iz);
    player.moving = length > 0.08;
    const wantsRun = keysDown.has("ShiftLeft") || keysDown.has("ShiftRight") || state.runToggle ||
      (joy.active && Math.hypot(joy.x, joy.y) > 0.82);

    if (state.dashTimer > 0) {
      const step = CONFIG.maze.dash.speed * dt;
      const nextX = player.x + state.dashDir.x * step;
      const nextZ = player.z + state.dashDir.z * step;
      if (maze.canMove(nextX, player.z, 0.32)) player.x = nextX;
      if (maze.canMove(player.x, nextZ, 0.32)) player.z = nextZ;
      player.yaw = angleLerp(player.yaw, Math.atan2(state.dashDir.x, state.dashDir.z), Math.min(1, dt * 18));
      rabbit.group.position.set(player.x, 0, player.z);
      rabbit.group.rotation.y = player.yaw;
      rabbit.setWalking(true, 2.6);
      rabbit.update(dt);
      player.speed = CONFIG.maze.dash.speed;
      player.running = true;
      state.debugInfo = { ix, iz, moveX: state.dashDir.x, moveZ: state.dashDir.z, screenX: state.debugInfo.screenX };
      return;
    }

    if (!player.moving) {
      player.speed = 0;
      player.running = false;
      state.stamina = Math.min(1, state.stamina + CONFIG.maze.stamina.regen * dt);
      rabbit.setWalking(false);
      rabbit.update(dt);
      state.debugInfo = { ix: 0, iz: 0, moveX: 0, moveZ: 0, screenX: state.debugInfo.screenX };
      return;
    }
    ix /= Math.max(1, length);
    iz /= Math.max(1, length);

    player.running = wantsRun && state.stamina > 0.03;
    if (player.running) {
      state.stamina = Math.max(0, state.stamina - CONFIG.maze.stamina.drain * dt);
    } else {
      state.stamina = Math.min(1, state.stamina + CONFIG.maze.stamina.regen * dt);
    }

    const forwardX = -Math.sin(player.camYaw);
    const forwardZ = -Math.cos(player.camYaw);
    const rightX = Math.cos(player.camYaw);
    const rightZ = -Math.sin(player.camYaw);
    let moveX = rightX * ix + forwardX * iz;
    let moveZ = rightZ * ix + forwardZ * iz;
    const moveLength = Math.hypot(moveX, moveZ);
    if (moveLength < 0.001) return;
    moveX /= moveLength;
    moveZ /= moveLength;
    state.lastMove = { x: moveX, z: moveZ };
    const speed = (player.running ? CONFIG.maze.stamina.sprintSpeed : CONFIG.maze.stamina.walkSpeed) +
      (state.speedBoost > 0 ? 0.75 : 0);
    player.speed = speed;
    const step = speed * dt;
    const nextX = player.x + moveX * step;
    const nextZ = player.z + moveZ * step;
    if (maze.canMove(nextX, player.z, 0.32)) player.x = nextX;
    if (maze.canMove(player.x, nextZ, 0.32)) player.z = nextZ;
    const targetYaw = Math.atan2(moveX, moveZ);
    player.yaw = angleLerp(player.yaw, targetYaw, Math.min(1, dt * 10));
    rabbit.group.position.set(player.x, 0, player.z);
    rabbit.group.rotation.y = player.yaw;
    rabbit.setWalking(true, speed / 2.5);
    rabbit.update(dt);
    state.debugInfo = { ix, iz, moveX, moveZ, screenX: state.debugInfo.screenX };
  }

  function updateCameraTargets() {
    const forwardX = -Math.sin(player.camYaw);
    const forwardZ = -Math.cos(player.camYaw);
    flashlight.position.set(player.x + forwardX * 0.15, 1.15, player.z + forwardZ * 0.15);
    flashlight.target.position.set(player.x + forwardX * 6, 0.6, player.z + forwardZ * 6);
    torchGlow.position.set(player.x - forwardX * 0.55, 1.45, player.z - forwardZ * 0.55);
    const flicker = state.flashlightOn ? 22 + Math.sin(state.time * 14) * 0.8 : 0;
    flashlight.intensity = state.blackout > 0 ? flicker * 0.18 : flicker;
    torchGlow.intensity = state.flashlightOn ? 0.8 : 0;
  }

  function updateKeysAndExit(dt = 0.016) {
    for (const key of keys) {
      key.mesh.update(dt);
      if (!key.collected && Math.hypot(player.x - key.initial.x, player.z - key.initial.z) < 1.1) {
        collectKey(key);
      }
    }
    const distExit = Math.hypot(player.x - exitPos.x, player.z - (exitPos.z + 0.9));
    if (state.keysFound >= CONFIG.maze.keys && distExit < 1.7 && !state.winReady && !state.finalScareStarted) {
      void triggerFinalScare();
    }
  }

  function updateWritings() {
    for (const entry of writings) {
      if (entry.revealed) continue;
      if (Math.hypot(player.x - entry.x, player.z - entry.z) < 3.2) {
        entry.revealed = true;
        entry.writing.reveal();
        if (!state.scares.writing) {
          state.scares.writing = true;
          playAudioAt("whisper", { x: entry.x, y: 1.4, z: entry.z });
        }
      }
    }
  }

  function updateScares(dt) {
    if (!state.scares.firstKey && state.keysFound >= 1) {
      state.scares.firstKey = true;
      state.blackout = 1.4;
      ctx.audio?.duck(0.45, 600);
      playAudio("door-creak");
      showPrompt("El dhouw yteffa\u2026 \u{1F56F}", 2000);
    }
    if (!state.scares.secondKey && state.keysFound >= 2) {
      state.scares.secondKey = true;
      playAudioAt("door-slam", { x: player.x, y: 1.2, z: player.z - 2.5 });
      showPrompt("Bab tsakker morak\u2026 bara bara \u{1F6AA}", 2200);
    }
    if (state.blackout > 0) state.blackout -= dt;

    if (bedroomRoom && !state.scares.doll && Math.hypot(player.x - bedroomRoom.x, player.z - bedroomRoom.z) < 2.4) {
      state.scares.doll = true;
      playAudioAt("duck-squeak", doll.group.position);
      setTimeout(() => {
        if (!state.dollFallen) {
          state.dollFallen = true;
          doll.fall();
          playAudioAt("door-creak", doll.group.position);
          showPrompt("El doll t7arrek\u2026 \u{1F9F8}", 1800);
        }
      }, 1200);
    }
    if (bedroomRoom) doll.update(player);

    if (libraryRoom && !state.scares.painting && Math.hypot(player.x - libraryRoom.x, player.z - libraryRoom.z) < 2.3) {
      state.scares.painting = true;
      state.paintingActive = true;
      painting.activate();
      setCheckpoint(libraryRoom.r, libraryRoom.c);
      ctx.audio?.setMusicState("safe", { force: true, fade: 0.6 });
      showPrompt("Tsawirtna! Safe zone + checkpoint \u{1F497}", 2600);
    }
    painting.update(player);

    if (kitchenRoom && !state.scares.bear && Math.hypot(player.x - kitchenRoom.x, player.z - kitchenRoom.z) < 2.2) {
      state.scares.bear = true;
      ctx.audio?.duck(0.18, 900);
      playAudioAt("jumpscare", bear.group.position);
      bear.reveal().then(() => {
        if (state.bearGaveKey) return;
        state.bearGaveKey = true;
        const kitchenKey = keys.find((k) => k.def.type === "kitchen" && !k.collected);
        if (kitchenKey) collectKey(kitchenKey, "bear");
        else if (state.keysFound < CONFIG.maze.keys) {
          const fallback = keys.find((k) => !k.collected);
          if (fallback) collectKey(fallback, "bear");
        }
        showPrompt("Tkhaft?? \u{1F43B} Khoudh key, sorry!", 2600);
      });
    }

    if (toyRoom && !state.radioPlayed && Math.hypot(player.x - toyRoom.x, player.z - toyRoom.z) < 2.2) {
      state.radioPlayed = true;
      playAudioAt("radio-static", radio.group.position);
      showPrompt("Arnouba\u2026 Arnouba\u2026 nchoufouk\u2026 \u{1F4FB}", 2600);
    }

    if (fakeRoom && !state.fakeOpened && Math.hypot(player.x - fakePos.x, player.z - (fakePos.z + 0.7)) < 1.6) {
      state.fakeOpened = true;
      state.scares.fakeExit = true;
      fakeExit.open().then(() => {
        showPrompt("bara bara \u{1F47B} mouch el bab hedha", 2600);
        playAudioAt("door-creak", fakeExit.group.position);
      });
    }

    if (!state.scares.hands && state.keysFound >= 2) {
      const cell = maze.worldToCell(player.x, player.z);
      if (maze.distance(cell.r, cell.c) > 6) {
        state.scares.hands = true;
        playAudioAt("whisper", { x: player.x, y: 1.5, z: player.z - 1.2 });
        showPrompt("Idin tla3ou mel 7it\u2026 \u{1F47B}", 2200);
      }
    }

    if (!state.scares.bats && state.keysFound >= 1 && state.time > 18) {
      state.scares.bats = true;
      playAudioAt("bats", {
        x: player.x + (Math.random() - 0.5) * 3,
        y: 2.2,
        z: player.z + (Math.random() - 0.5) * 3,
      });
      showPrompt("Chkoun tayr fik? \u{1F987}", 1800);
    }

    if (!state.scares.trapdoor && state.time > 35) {
      state.scares.trapdoor = true;
      playAudioAt("splash", { x: player.x, y: 0.1, z: player.z });
      showPrompt("El ardhia 7allet\u2026 splash! \u{1F30A}", 2200);
    }

    if (state.hintTimer > 0) {
      state.hintTimer -= dt;
      if (state.hintTimer <= 0 && hud.arrow) hud.arrow.hidden = true;
    }
  }

  function updateHidingPrompt() {
    if (state.hidden) {
      if (hud.prompt) hud.prompt.hidden = true;
      return;
    }
    let nearest = null;
    let best = 1.7;
    for (const spot of hidingSpots) {
      const dist = Math.hypot(player.x - spot.x, player.z - spot.z);
      if (dist < best) {
        best = dist;
        nearest = spot;
      }
    }
    state.nearHiding = nearest;
    if (nearest && !state.paused && performance.now() > state.promptUntil - 220) {
      showPrompt("E: hide \u{1F47B}", 650);
    }
  }

  function toggleHide() {
    if (!state.active || state.paused) return;
    if (state.hidden) {
      state.hidden = false;
      rabbit.group.visible = true;
      state.active = true;
      playAudio("ui-click");
      updateHud();
      showPrompt("Khrejt\u2026 bqaddek!", 1000);
      if (state.hideScareArmed && !state.scares.wardrobe) {
        state.scares.wardrobe = true;
        state.hideScareArmed = false;
        setTimeout(() => {
          if (state.active && !state.hidden) void triggerScreamer("wardrobe");
        }, 380);
      }
      return;
    }
    if (!state.nearHiding) {
      showPrompt("Ma 9ribch mel wardrobe/bed \u{1F62C}", 1400);
      return;
    }
    state.hidden = true;
    state.tutorialHid = true;
    if (state.gameState !== "TUTORIAL") state.hideScareArmed = true;
    player.x = state.nearHiding.x;
    player.z = state.nearHiding.z;
    rabbit.group.visible = false;
    rabbit.setWalking(false);
    updateHud();
    showPrompt("Tkhabba\u2026 t7ammes \u{1F497}", 1600);
    playAudio("ui-click");
    ctx.audio?.setHeartbeat(0.3);
  }

  function toggleTorch() {
    state.flashlightOn = !state.flashlightOn;
    if (state.gameState === "TUTORIAL" && !state.flashlightOn) state.tutorialTorch = true;
    updateHud();
    playAudio("flashlight-click");
  }

  function rotateCamera(delta) {
    player.camYaw += delta;
    state.camManualTimer = 0.7;
  }

  function recenterCamera() {
    player.camYaw = player.yaw - Math.PI;
    player.camPitch = 0;
    state.camManualTimer = 0;
    playAudio("ui-click", { volume: 0.35 });
  }

  function startBlastCharge() {
    if (!state.active || state.paused || state.hidden || state.blastCharging) return;
    state.blastCharging = true;
    state.blastCharge = 0;
    playAudio("flashlight-charge");
  }

  function onKeyDown(event) {
    if (!state.active || state.paused) return;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyF", "KeyQ", "KeyE", "KeyH", "KeyJ", "KeyR", "KeyM", "KeyP", "ControlLeft", "ControlRight"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat && ["Space", "KeyH", "KeyF", "KeyR", "KeyM", "KeyP", "ControlLeft", "ControlRight", "KeyJ"].includes(event.code)) return;
    if (event.code === "Space") {
      startDash();
      return;
    }
    if (event.code === "KeyQ") {
      rotateCamera(0.16);
      return;
    }
    if (event.code === "KeyE") {
      if (state.hidden || state.nearHiding || state.nearInteract) {
        if (state.hidden || state.nearHiding) toggleHide();
        else interact();
      } else {
        rotateCamera(-0.16);
      }
      return;
    }
    if (event.code === "KeyR") {
      recenterCamera();
      return;
    }
    if (event.code === "KeyM") {
      togglePointerLock();
      return;
    }
    if (event.code === "KeyP" || event.code === "Escape") {
      pauseGame(true);
      return;
    }
    if (event.code === "KeyH") {
      toggleHide();
      return;
    }
    if (event.code === "KeyF") {
      toggleTorch();
      return;
    }
    if (event.code === "ControlLeft" || event.code === "ControlRight" || event.code === "KeyJ") {
      startBlastCharge();
      return;
    }
    keysDown.add(event.code);
  }

  function onKeyUp(event) {
    keysDown.delete(event.code);
    if ((event.code === "ControlLeft" || event.code === "ControlRight" || event.code === "KeyJ") && state.blastCharging) {
      releaseBlast();
    }
  }

  function togglePointerLock() {
    if (document.pointerLockElement === sceneCanvas) {
      document.exitPointerLock?.();
      return;
    }
    sceneCanvas?.requestPointerLock?.();
  }

  function onMouseDown(event) {
    if (!state.active || state.paused || state.caught || state.leaving) return;
    if (event.pointerType === "touch") {
      if (event.clientX < window.innerWidth * 0.5) return;
    } else if (event.button !== 0) {
      return;
    }
    mouseLook.dragging = true;
    mouseLook.id = event.pointerId;
    mouseLook.lastX = event.clientX;
    mouseLook.lastY = event.clientY;
    mouseLook.moved = 0;
    mouseLook.charge = event.pointerType !== "touch";
    mouseLook.locked = document.pointerLockElement === sceneCanvas;
    if (mouseLook.charge) startBlastCharge();
    sceneCanvas?.setPointerCapture?.(event.pointerId);
  }

  function onMouseMove(event) {
    if (!state.active || state.paused || state.caught || state.leaving) return;
    const locked = document.pointerLockElement === sceneCanvas;
    if (locked) {
      const dx = event.movementX || 0;
      const dy = event.movementY || 0;
      if (Math.abs(dx) + Math.abs(dy) > 1) {
        mouseLook.moved += Math.abs(dx) + Math.abs(dy);
        if (mouseLook.moved > 6 && state.blastCharging) {
          state.blastCharging = false;
          state.blastCharge = 0;
        }
      }
      player.camYaw -= dx * 0.0045;
      player.camPitch = THREE.MathUtils.clamp(player.camPitch - dy * 0.003, -0.55, 0.6);
      state.camManualTimer = 0.7;
      return;
    }
    if (!mouseLook.dragging || event.pointerId !== mouseLook.id) return;
    const dx = event.clientX - mouseLook.lastX;
    const dy = event.clientY - mouseLook.lastY;
    mouseLook.lastX = event.clientX;
    mouseLook.lastY = event.clientY;
    mouseLook.moved += Math.abs(dx) + Math.abs(dy);
    if (mouseLook.moved > 6 && state.blastCharging) {
      state.blastCharging = false;
      state.blastCharge = 0;
    }
    player.camYaw -= dx * 0.005;
    player.camPitch = THREE.MathUtils.clamp(player.camPitch - dy * 0.0035, -0.5, 0.55);
    state.camManualTimer = 0.7;
  }

  function onMouseUp(event) {
    if (event.pointerId !== mouseLook.id) return;
    mouseLook.dragging = false;
    mouseLook.id = null;
    if (mouseLook.charge && mouseLook.moved <= 6 && state.blastCharging) releaseBlast();
    mouseLook.charge = false;
    mouseLook.locked = false;
    if (sceneCanvas?.hasPointerCapture?.(event.pointerId)) {
      sceneCanvas.releasePointerCapture(event.pointerId);
    }
  }

  function setupJoystick() {
    if (!hud.joystick || !hud.stick) return;
    const updateStick = (event) => {
      const rect = hud.joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = event.clientX - cx;
      let dy = event.clientY - cy;
      const max = rect.width * 0.36;
      const dist = Math.hypot(dx, dy);
      if (dist > max) {
        dx = (dx / dist) * max;
        dy = (dy / dist) * max;
      }
      joy.x = dx / max;
      joy.y = -dy / max;
      joy.active = true;
      hud.stick.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    hud.joystick.addEventListener("pointerdown", (event) => {
      if (!state.active || state.paused) return;
      event.preventDefault();
      event.stopPropagation();
      joy.id = event.pointerId;
      hud.joystick.setPointerCapture(event.pointerId);
      updateStick(event);
    });
    hud.joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId !== joy.id) return;
      event.preventDefault();
      updateStick(event);
    });
    const end = (event) => {
      if (event.pointerId !== joy.id) return;
      joy.id = null;
      joy.active = false;
      joy.x = 0;
      joy.y = 0;
      hud.stick.style.transform = "translate(0, 0)";
    };
    hud.joystick.addEventListener("pointerup", end);
    hud.joystick.addEventListener("pointercancel", end);
  }

  hud.start?.addEventListener("click", () => {
    beginGame();
  });
  hud.pause?.addEventListener("click", () => pauseGame(true));
  hud.pauseClose?.addEventListener("click", () => pauseGame(false));
  hud.failClose?.addEventListener("click", () => {
    if (hud.fail) hud.fail.hidden = true;
    retryFromCheckpoint();
  });
  hud.winClose?.addEventListener("click", finishWin);
  hud.hide?.addEventListener("click", toggleHide);
  hud.torch?.addEventListener("click", toggleTorch);
  hud.dash?.addEventListener("click", startDash);
  hud.interact?.addEventListener("click", interact);
  hud.run?.addEventListener("click", () => {
    state.runToggle = !state.runToggle;
    updateHud();
  });
  hud.blast?.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!state.active || state.paused || state.hidden) return;
    state.blastCharging = true;
    state.blastCharge = 0;
    playAudio("flashlight-charge");
    hud.blast.setPointerCapture?.(event.pointerId);
  });
  hud.blast?.addEventListener("pointerup", (event) => {
    event.preventDefault();
    if (state.blastCharging) releaseBlast();
  });
  hud.blast?.addEventListener("pointercancel", () => {
    state.blastCharging = false;
    state.blastCharge = 0;
  });
  function onPointerLockChange() {
    state.pointerLocked = document.pointerLockElement === sceneCanvas;
  }
  document.addEventListener("pointerlockchange", onPointerLockChange);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  sceneCanvas?.addEventListener("pointerdown", onMouseDown);
  window.addEventListener("pointermove", onMouseMove);
  window.addEventListener("pointerup", onMouseUp);
  window.addEventListener("pointercancel", onMouseUp);
  setupJoystick();

  if (state.debug && hud.debug) {
    hud.debug.hidden = false;
    hud.debug.innerHTML = `
      <div>input: <span id="dbgInput">0, 0</span></div>
      <div>yaw: <span id="dbgYaw">0.00</span></div>
      <div>move: <span id="dbgMove">0, 0</span></div>
      <div>rabbit screenX: <span id="dbgScreen">-</span></div>
      <div>state: <span id="dbgState">-</span></div>
      <div>zone: <span id="dbgZone">-</span></div>
      <div>tutorial: <span id="dbgTutorial">-</span></div>
      <div>fox: <span id="dbgFox">-</span></div>
      <div>ghosts: <span id="dbgGhost">-</span></div>
      <div>screamer: <span id="dbgScreamer">-</span></div>
      <div>music: <span id="dbgMusic">-</span></div>
      <div>audio: <span id="dbgAudio">-</span></div>
      <div>fps: <span id="dbgFps">-</span></div>
      <button id="dbgKey">+key</button>
      <button id="dbgStun">stun ghosts</button>
      <button id="dbgAudioState">cycle audio</button>
      <button id="dbgExit">exit</button>
      <div class="maze-debug-row">
        <button data-screamer="1">1 hall</button>
        <button data-screamer="2">2 wardrobe</button>
        <button data-screamer="3">3 mirror</button>
        <button data-screamer="4">4 tv</button>
      </div>
      <div class="maze-debug-row">
        <button data-screamer="5">5 chase</button>
        <button data-screamer="6">6 ceiling</button>
        <button data-screamer="7">7 enemy</button>
        <button data-screamer="8">8 final</button>
      </div>
      <div class="maze-debug-row">
        <button id="dbgZone2">zone 2</button>
        <button id="dbgZone3">zone 3</button>
        <button id="dbgFinal">final</button>
      </div>
    `;
    hud.debug.querySelector("#dbgKey")?.addEventListener("click", () => {
      const next = keys.find((k) => !k.collected);
      if (next) collectKey(next, "debug");
    });
    hud.debug.querySelector("#dbgStun")?.addEventListener("click", () => {
      stunNearby(player.x, player.z, 20, 4);
    });
    hud.debug.querySelector("#dbgAudioState")?.addEventListener("click", () => {
      const states = ["calm", "tension", "chase"];
      const current = ctx.audio?.debugState?.state;
      const next = states[(states.indexOf(current) + 1) % states.length];
      ctx.audio?.setMusicState(next, { force: true });
    });
    hud.debug.querySelector("#dbgExit")?.addEventListener("click", () => {
      while (state.keysFound < CONFIG.maze.keys) {
        const next = keys.find((k) => !k.collected);
        if (!next) break;
        collectKey(next, "debug");
      }
      player.x = exitPos.x;
      player.z = exitPos.z + 0.9;
    });
    const screamerTypes = ["hallway", "wardrobe", "mirror", "tv", "chase", "ceiling", "enemy", "final"];
    hud.debug.querySelectorAll("[data-screamer]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.screamer) - 1;
        void triggerScreamer(screamerTypes[index] || "jump", { force: true, lifeLoss: screamerTypes[index] === "enemy" || screamerTypes[index] === "chase" });
      });
    });
    hud.debug.querySelector("#dbgZone2")?.addEventListener("click", () => {
      state.zone = 2;
      state.gameState = "ZONE2";
      updateHud();
    });
    hud.debug.querySelector("#dbgZone3")?.addEventListener("click", () => {
      state.zone = 3;
      state.gameState = "ZONE3";
      updateHud();
    });
    hud.debug.querySelector("#dbgFinal")?.addEventListener("click", () => {
      state.zone = 3;
      state.gameState = "ZONE3";
      startCorridorChase();
    });
  }

  function updateDebug(dt) {
    if (!state.debug || !hud.debug) return;
    state.fpsAccum += dt;
    state.fpsFrames++;
    if (state.fpsAccum >= 0.5) {
      state.fps = Math.round(state.fpsFrames / state.fpsAccum);
      state.fpsAccum = 0;
      state.fpsFrames = 0;
      const s = hud.debug.querySelector("#dbgState");
      const zone = hud.debug.querySelector("#dbgZone");
      const tutorial = hud.debug.querySelector("#dbgTutorial");
      const screamer = hud.debug.querySelector("#dbgScreamer");
      const f = hud.debug.querySelector("#dbgFox");
      const g = hud.debug.querySelector("#dbgGhost");
      const music = hud.debug.querySelector("#dbgMusic");
      const audio = hud.debug.querySelector("#dbgAudio");
      const p = hud.debug.querySelector("#dbgFps");
      const input = hud.debug.querySelector("#dbgInput");
      const yaw = hud.debug.querySelector("#dbgYaw");
      const move = hud.debug.querySelector("#dbgMove");
      const screen = hud.debug.querySelector("#dbgScreen");
      if (s) s.textContent = state.active ? (state.paused ? "PAUSED" : state.hidden ? "HIDDEN" : state.gameState) : state.gameState;
      if (zone) zone.textContent = `${state.zone} (${state.keysFound} keys)`;
      if (tutorial) tutorial.textContent = `step ${state.tutorialStep} / ${state.controlHintsTimer.toFixed(0)}s`;
      if (screamer) screamer.textContent = horror.busy ? `BUSY ${horror.type || ""}` : `cd ${Math.ceil(horror.cooldownRemaining / 1000)}s`;
      if (f) f.textContent = state.foxStun > 0 ? "STUNNED" : foxState.mode;
      if (g) {
        const chasing = ghostEntries.filter((entry) => entry.mode === "CHASE").length;
        g.textContent = `${ghostEntries.filter((entry) => entry.model.active).length}/${ghostEntries.length} active · ${chasing} chasing`;
      }
      const audioState = ctx.audio?.debugState;
      if (music) music.textContent = audioState?.state ?? "-";
      if (audio) {
        audio.textContent = audioState
          ? `${audioState.ready ? "ready" : "loading"} ${Math.round((audioState.progress || 0) * 100)}% active:${audioState.active} hb:${(audioState.heartbeat || 0).toFixed(2)}`
          : "-";
      }
      if (p) p.textContent = String(state.fps);
      if (input) input.textContent = `${state.debugInfo.ix.toFixed(2)}, ${state.debugInfo.iz.toFixed(2)}`;
      if (yaw) yaw.textContent = player.camYaw.toFixed(2);
      if (move) move.textContent = `${state.debugInfo.moveX.toFixed(2)}, ${state.debugInfo.moveZ.toFixed(2)}`;
      if (screen) {
        const cam = window.__arnouba?.camera;
        if (cam) {
          const v = new THREE.Vector3(player.x, 1, player.z).project(cam);
          state.debugInfo.screenX = (v.x * 0.5 + 0.5) * window.innerWidth;
          screen.textContent = `${Math.round(state.debugInfo.screenX)}px`;
        }
      }
    }
  }

  function nearestThreatDistance() {
    let nearest = Infinity;
    const consider = (x, z) => {
      const distance = Math.hypot(player.x - x, player.z - z);
      if (distance < nearest) nearest = distance;
    };
    if (state.foxStun <= 0 && fox.group.visible) {
      consider(fox.group.position.x, fox.group.position.z);
    }
    for (const entry of ghostEntries) {
      if (!entry.model.active || entry.mode === "STUNNED") continue;
      consider(entry.model.position.x, entry.model.position.z);
    }
    if (state.bossActive && boss.active && state.bossStun <= 0) {
      consider(boss.position.x, boss.position.z);
    }
    if (enemyState.active && screamerEnemy.active && enemyState.stunTimer <= 0) {
      consider(screamerEnemy.position.x, screamerEnemy.position.z);
    }
    return nearest;
  }

  function updateAudio(dt) {
    const manager = ctx.audio;
    if (!manager) return;
    if (!state.active || state.paused || state.caught || state.leaving) {
      manager.setHeartbeat(0);
      return;
    }
    const nearest = nearestThreatDistance();
    const danger = Math.max(0, Math.min(1, 1 - nearest / 9));
    const safe = state.hidden || isSafeZone();
    const ghostChasing = ghostEntries.some((entry) => entry.model.active && entry.mode === "CHASE") || enemyState.active;
    let next = "calm";
    if (safe) next = "safe";
    else if (state.finalChase || foxState.mode === "CHASE" || ghostChasing || danger > 0.72) next = "chase";
    else if (danger > 0.28) next = "tension";
    manager.setMusicState(next);
    manager.setHeartbeat(safe ? 0 : Math.min(1, danger * 1.25));

    if (player.moving && !state.hidden) {
      state.footstepTimer -= dt;
      if (state.footstepTimer <= 0) {
        state.footstepTimer = player.running ? 0.27 : 0.43;
        manager.playFootstep(player.running, { x: player.x, y: 0.08, z: player.z });
      }
    } else {
      state.footstepTimer = 0;
    }

    state.foxGrowlTimer = Math.max(0, state.foxGrowlTimer - dt);
    if (!safe && state.foxStun <= 0 && fox.group.visible && state.foxGrowlTimer <= 0) {
      const foxDistance = Math.hypot(player.x - fox.group.position.x, player.z - fox.group.position.z);
      if (foxDistance < 7) {
        state.foxGrowlTimer = 4.5 + Math.random() * 3;
        playAudioAt("fox-growl", fox.group.position, { volume: 0.8 });
      }
    }
  }

  function updateTutorial(dt) {
    if (state.gameState !== "TUTORIAL") return;
    if (state.controlHintsTimer > 0) {
      state.controlHintsTimer -= dt;
      if (state.controlHintsTimer <= 0 && hud.controlHints) {
        hud.controlHints.classList.add("fade");
      }
    }
    if (state.time > 8 && hud.lookHint) hud.lookHint.hidden = true;
    if (state.tutorialStep === 0) {
      if (player.moving) state.tutorialTimer += dt;
      else state.tutorialTimer = Math.max(0, state.tutorialTimer - dt * 0.5);
      if (state.tutorialTimer > 1.1) {
        state.tutorialStep = 1;
        showPrompt(CONFIG.maze.texts.tutorialSprint, 3200);
      }
    } else if (state.tutorialStep === 1) {
      if (player.running) {
        state.tutorialStep = 2;
        showPrompt(CONFIG.maze.texts.tutorialTorch, 3200);
      }
    } else if (state.tutorialStep === 2) {
      if (state.tutorialTorch) {
        state.tutorialStep = 3;
        showPrompt(CONFIG.maze.texts.tutorialHide, 3400);
      }
    } else if (state.tutorialStep === 3) {
      if (state.tutorialHid) {
        state.tutorialStep = 4;
        state.gameState = "ZONE1";
        state.zone = 1;
        showPrompt(CONFIG.maze.texts.tutorialDone, 3200);
        updateHud();
      }
    }
  }

  function updateCameraControl(dt) {
    state.camManualTimer = Math.max(0, state.camManualTimer - dt);
    if (state.camManualTimer <= 0 && player.moving && !state.hidden) {
      const target = player.yaw - Math.PI;
      player.camYaw = angleLerp(player.camYaw, target, 1 - Math.exp(-3.4 * dt));
    }
  }

  function updateGamepad(dt) {
    const pads = navigator.getGamepads?.();
    const pad = pads?.[0];
    if (!pad || !state.active || state.paused) {
      state.pad.x = 0;
      state.pad.y = 0;
      return;
    }
    const dead = (value) => (Math.abs(value) < 0.18 ? 0 : value);
    state.pad.x = dead(pad.axes[0] || 0);
    state.pad.y = -dead(pad.axes[1] || 0);
    const rx = dead(pad.axes[2] || 0);
    if (Math.abs(rx) > 0) rotateCamera(-rx * dt * 1.9);
    const pressed = pad.buttons.map((button) => button?.pressed);
    const was = state.gamepadPrev;
    if (pressed[0] && !was[0]) startDash();
    if (pressed[1] && !was[1]) toggleTorch();
    if (pressed[2] && !was[2]) {
      if (state.hidden || state.nearHiding) toggleHide();
      else interact();
    }
    if (pressed[3] && !was[3]) startBlastCharge();
    if (!pressed[3] && was[3] && state.blastCharging) releaseBlast();
    if (pressed[8] && !was[8]) recenterCamera();
    if (pressed[9] && !was[9]) pauseGame(true);
    state.gamepadPrev = pressed;
  }

  function updateCompass(dt) {
    if (state.time < 60 || !state.active || state.hidden) return;
    if (!state.lostShown) {
      state.lostShown = true;
      showPrompt(CONFIG.maze.texts.lost, 2600);
    }
    state.compassTimer -= dt;
    if (state.compassTimer > 0 || state.hintTimer > 0) return;
    state.compassTimer = 0.4;
    const next = keys.find((key) => !key.collected);
    showHintArrow(next ? maze.cellToWorld(next.def.c, next.def.r) : exitPos);
  }

  function startHallwayScare() {
    if (state.scares.hallway || !state.active || state.hidden) return;
    state.scares.hallway = true;
    void (async () => {
      for (let i = 0; i < 3; i += 1) {
        if (!state.active || state.hidden) {
          hallwayFrame.group.visible = false;
          return;
        }
        const forwardX = -Math.sin(player.camYaw);
        const forwardZ = -Math.cos(player.camYaw);
        const distance = 5.2 - i * 1.05;
        hallwayFrame.group.position.set(player.x + forwardX * distance, 0, player.z + forwardZ * distance);
        hallwayFrame.group.rotation.y = Math.atan2(player.x - hallwayFrame.group.position.x, player.z - hallwayFrame.group.position.z);
        hallwayFrame.group.visible = true;
        world.lamps.forEach((lamp, index) => {
          gsap.to(lamp.light, { intensity: 0.05, duration: 0.12, yoyo: true, repeat: 3, delay: index * 0.03 });
        });
        playAudioAt("whisper", hallwayFrame.group.position, { volume: 0.8, rate: 0.8 });
        await wait(720);
      }
      hallwayFrame.group.visible = false;
      if (state.active && !state.hidden) await triggerScreamer("hallway");
    })();
  }

  function startCorridorChase() {
    state.scares.corridor = true;
    state.corridorStarted = true;
    state.corridorPhase = "flicker";
    state.corridorTimer = 0.7;
    state.corridorFlicker = 0;
    const forwardX = -Math.sin(player.camYaw);
    const forwardZ = -Math.cos(player.camYaw);
    corridorFigure.resetAt(player.x + forwardX * 6.2, player.z + forwardZ * 6.2);
    corridorFigure.setMode("CRAWL");
    showPrompt(CONFIG.maze.texts.corridor, 2400);
    playAudioAt("whisper", corridorFigure.position, { volume: 0.9, rate: 0.7 });
  }

  function updateCorridorChase(dt) {
    if (!state.corridorStarted) {
      if (state.gameState === "ZONE3" && state.time > 24 && !state.scares.corridor) startCorridorChase();
      return;
    }
    if (state.corridorPhase === "flicker") {
      state.corridorTimer -= dt;
      if (state.corridorTimer <= 0) {
        state.corridorFlicker += 1;
        state.corridorTimer = 0.7;
        world.lamps.forEach((lamp, index) => {
          gsap.to(lamp.light, { intensity: 0.04, duration: 0.1, yoyo: true, repeat: 2, delay: index * 0.02 });
        });
        if (state.corridorFlicker >= 3) {
          state.corridorPhase = "gone";
          state.corridorTimer = 0.8;
          corridorFigure.group.visible = false;
          corridorFigure.state.active = false;
        } else {
          const forwardX = -Math.sin(player.camYaw);
          const forwardZ = -Math.cos(player.camYaw);
          corridorFigure.group.position.set(
            player.x + forwardX * (5.2 - state.corridorFlicker * 1.1),
            0,
            player.z + forwardZ * (5.2 - state.corridorFlicker * 1.1)
          );
        }
      }
      return;
    }
    if (state.corridorPhase === "gone") {
      state.corridorTimer -= dt;
      if (state.corridorTimer <= 0) {
        const forwardX = -Math.sin(player.camYaw);
        const forwardZ = -Math.cos(player.camYaw);
        corridorFigure.resetAt(player.x - forwardX * 3.6, player.z - forwardZ * 3.6);
        corridorFigure.setMode("CHASE");
        state.corridorPhase = "chase";
        state.corridorTimer = 3.6;
        playAudioAt("fox-growl", corridorFigure.position, { volume: 1 });
      }
      return;
    }
    if (state.corridorPhase === "chase") {
      state.corridorTimer -= dt;
      corridorFigure.moveToward(player.x, player.z, 4.15, dt, maze);
      corridorFigure.update(dt, { player });
      const distance = Math.hypot(player.x - corridorFigure.position.x, player.z - corridorFigure.position.z);
      if (!state.hidden && distance < 1.25) {
        state.corridorPhase = "idle";
        state.corridorStarted = false;
        corridorFigure.vanish(0.25);
        void triggerScreamer("chase", { lifeLoss: true, force: true });
      } else if (state.corridorTimer <= 0 || state.hidden) {
        state.corridorPhase = "idle";
        state.corridorStarted = false;
        corridorFigure.vanish(0.6);
      }
    }
  }

  function spawnScreamerEnemy() {
    if (state.gameState === "TUTORIAL" || state.zone < 2 || state.hidden) return;
    const forwardX = -Math.sin(player.camYaw);
    const forwardZ = -Math.cos(player.camYaw);
    let x = player.x - forwardX * 4.2;
    let z = player.z - forwardZ * 4.2;
    if (!maze.canMove(x, z, 0.35)) {
      const cell = cellFor(11, 17);
      const pos = maze.cellToWorld(cell.c, cell.r);
      x = pos.x;
      z = pos.z;
    }
    screamerEnemy.resetAt(x, z);
    screamerEnemy.setMode("CRAWL");
    enemyState.active = true;
    enemyState.stunTimer = 0;
    enemyState.respawnTimer = 0;
    enemyState.lifeLoss = false;
    enemyState.screamCooldown = 0;
    playAudioAt("ghost-wail", screamerEnemy.position, { volume: 0.8, rate: 0.72 });
  }

  function updateScreamerEnemy(dt) {
    if (!enemyState.active) {
      if (state.gameState === "TUTORIAL" || state.zone < 2 || state.hidden) return;
      state.enemySpawnTimer -= dt;
      if (state.enemySpawnTimer <= 0) {
        state.enemySpawnTimer = 16 + Math.random() * 8;
        spawnScreamerEnemy();
      }
      return;
    }
    if (!screamerEnemy.active) {
      enemyState.active = false;
      enemyState.respawnTimer = 9;
      return;
    }
    const dx = player.x - screamerEnemy.position.x;
    const dz = player.z - screamerEnemy.position.z;
    const distance = Math.hypot(dx, dz);
    if (enemyState.stunTimer > 0) {
      enemyState.stunTimer -= dt;
      screamerEnemy.update(dt, { player });
      if (enemyState.stunTimer <= 0) screamerEnemy.setMode("CRAWL");
      return;
    }
    enemyState.screamCooldown = Math.max(0, enemyState.screamCooldown - dt);
    if (!state.hidden && distance < 7.5 && enemyState.screamCooldown <= 0) {
      enemyState.screamCooldown = 5;
      playAudioAt("whisper", screamerEnemy.position, { volume: 0.9, rate: 0.68 });
    }
    const forward = new THREE.Vector3();
    window.__arnouba?.camera?.getWorldDirection(forward);
    const looking = (forward.x * dx + forward.z * dz) / Math.max(0.001, distance) > 0.42;
    if (!looking || distance < 3.2) {
      screamerEnemy.moveToward(player.x, player.z, looking ? 3.3 : 2.35, dt, maze);
    }
    screamerEnemy.update(dt, { player });
    if (!state.hidden && distance < 1.15) {
      enemyState.active = false;
      screamerEnemy.vanish(0.25);
      void triggerScreamer("enemy", { lifeLoss: true, force: true });
    }
  }

  function updateScreamerScares(dt) {
    const camera = window.__arnouba?.camera;
    mirror.update(player, camera, dt);
    crt.update(player, camera, dt);
    ceilingFace.update(player, camera, dt);
    checkpointCandles.forEach((entry) => entry.candle.update(dt));
    if (state.gameState === "ZONE1" && state.time > 13 && !state.scares.hallway) startHallwayScare();
    updateCorridorChase(dt);
    updateScreamerEnemy(dt);
  }

  async function triggerFinalScare() {
    if (state.finalScareStarted || state.winReady) return;
    state.finalScareStarted = true;
    state.gameState = "FINAL_CHASE";
    state.exitOpening = true;
    state.invuln = 10;
    exitDoor.setLocks(0);
    doorFace.show();
    playAudio("door-creak");
    showPrompt(CONFIG.maze.texts.finalScare, 2600);
    await wait(520);
    for (let i = 0; i < 8 && horror.busy; i += 1) await wait(250);
    await triggerScreamer("final", { force: true });
    doorFace.hide();
    winGame();
  }

  function update(dt) {
    horror.update(dt);
    if (!state.started) {
      world.update(dt, true);
      rabbit.update(dt);
      return;
    }
    if (!state.active || state.paused || state.caught || state.leaving) {
      world.update(dt, state.flashlightOn);
      rabbit.update(dt);
      return;
    }
    state.time += dt;
    if (state.finalChase) {
      state.finalTimer = Math.max(0, state.finalTimer - dt);
    }
    world.update(dt, state.flashlightOn);
    if (state.hitStop > 0) {
      state.hitStop = Math.max(0, state.hitStop - dt);
      updateCameraTargets();
      updateHud();
      updateDebug(dt);
      return;
    }
    updateTimers(dt);
    updateGamepad(dt);
    updatePlayer(dt);
    updateCameraControl(dt);
    updateTutorial(dt);
    updateCompass(dt);
    updateKeysAndExit(dt);
    updateFox(dt);
    updateGhosts(dt);
    updateBoss(dt);
    updatePowerUps(dt);
    updateWritings();
    updateScares(dt);
    updateScreamerScares(dt);
    updateHidingPrompt();
    updateInteractions();
    updateCameraTargets();
    updateHud();
    updateAudio(dt);
    updateDebug(dt);
  }

  function getCameraPose() {
    const forwardX = -Math.sin(player.camYaw);
    const forwardZ = -Math.cos(player.camYaw);
    const desired = state.hidden ? 1.6 : 3.05;
    let safeDistance = 0.35;
    for (let d = 0.35; d <= desired; d += 0.12) {
      const cx = player.x - forwardX * d;
      const cz = player.z - forwardZ * d;
      if (!maze.canMove(cx, cz, 0.2)) break;
      safeDistance = d;
    }
    cameraRayOrigin.set(player.x, 1.28, player.z);
    cameraRayDir.set(-forwardX, 0, -forwardZ);
    cameraRaycaster.set(cameraRayOrigin, cameraRayDir);
    cameraRaycaster.far = desired + 0.3;
    const wallHits = cameraRaycaster.intersectObject(world.group, true);
    if (wallHits.length) {
      safeDistance = Math.max(0.32, Math.min(safeDistance, wallHits[0].distance - 0.14));
    }
    const firstPerson = !state.hidden && safeDistance < 1.05;
    const distance = state.hidden ? safeDistance : firstPerson ? 0.1 : safeDistance;
    const height = state.hidden ? 1.55 : firstPerson ? 1.62 : 2.3;
    const bob = state.hidden || firstPerson ? 0 : Math.sin(state.time * 10) * (player.moving ? 0.035 : 0.01);
    const horizontal = Math.cos(player.camPitch) * distance;
    const vertical = Math.sin(player.camPitch) * distance;
    rabbit.group.visible = !state.hidden && !firstPerson;
    return {
      position: new THREE.Vector3(
        player.x - forwardX * horizontal,
        height + bob + vertical,
        player.z - forwardZ * horizontal
      ),
      target: new THREE.Vector3(
        player.x + forwardX * 1.8,
        state.hidden ? 1.1 : firstPerson ? 1.4 : 1.25,
        player.z + forwardZ * 1.8
      ),
      fov: state.hidden ? 50 : firstPerson ? 68 : 62,
    };
  }

  function onEnter(prev, meta = {}) {
    state.difficulty = "normal";
    state.started = false;
    state.active = false;
    state.leaving = false;
    state.paused = false;
    state.randomScare = Math.random() < 0.05;
    state.gameState = "TITLE";
    ctx.audio?.stopMaze();
    hideAudioLoad();
    resetGame();
    document.body.classList.add("maze-active");
    if (hud.warningTitle) hud.warningTitle.textContent = CONFIG.maze.texts.startTitle;
    if (hud.warningText) hud.warningText.textContent = CONFIG.maze.texts.startBody;
    if (hud.warningGoal) hud.warningGoal.textContent = CONFIG.maze.texts.startGoal;
    if (hud.warningControls) hud.warningControls.textContent = CONFIG.maze.texts.startControls;
    if (hud.start) hud.start.textContent = CONFIG.maze.texts.startLabel || "Start";
    if (meta?.debug) {
      beginGame();
      return;
    }
    if (hud.root) hud.root.hidden = true;
    if (hud.warning) hud.warning.hidden = false;
    rabbit.idle();
  }

  function dispose() {
    state.active = false;
    ctx.audio?.stopMaze();
    hideAudioLoad();
    document.removeEventListener("pointerlockchange", onPointerLockChange);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    sceneCanvas?.removeEventListener("pointerdown", onMouseDown);
    window.removeEventListener("pointermove", onMouseMove);
    window.removeEventListener("pointerup", onMouseUp);
    window.removeEventListener("pointercancel", onMouseUp);
    document.exitPointerLock?.();
    document.body.classList.remove("maze-active", "maze-shake");
    if (hud.root) hud.root.hidden = true;
    if (hud.warning) hud.warning.hidden = true;
    if (hud.pauseOverlay) hud.pauseOverlay.hidden = true;
    if (hud.fail) hud.fail.hidden = true;
    if (hud.win) hud.win.hidden = true;
    if (hud.jumpscare) hud.jumpscare.hidden = true;
    keys.forEach((key) => key.mesh.dispose());
    hidingSpots.forEach((spot) => spot.mesh.dispose());
    roomObjects.forEach((room) => room.set.dispose());
    exitDoor.dispose();
    fakeExit.dispose();
    painting.dispose();
    bear.dispose();
    doll.dispose();
    radio.dispose();
    slamDoor.dispose();
    fallingShelf.dispose();
    writings.forEach((entry) => entry.writing.dispose());
    ghostEntries.forEach((entry) => entry.model.dispose());
    boss.dispose();
    hallwayFrame.dispose();
    mirror.dispose();
    crt.dispose();
    ceilingFace.dispose();
    corridorFigure.dispose();
    screamerEnemy.dispose();
    doorFace.dispose();
    checkpointCandles.forEach((entry) => entry.candle.dispose());
    horror.dispose();
    powerUps.forEach((power) => power.model.dispose());
    fox.dispose();
    rabbit.dispose();
    world.dispose();
    disposeGroupSafe(scene);
  }

  return {
    name: "maze",
    scene,
    update,
    getCameraPose,
    onEnter,
    interactives: [],
    get phase() {
      return state.active ? (state.paused ? "PAUSED" : "MAZE") : state.started ? "MAZE_IDLE" : "MAZE_INTRO";
    },
    get foxMode() {
      return foxState.mode;
    },
    get debugState() {
      return {
        active: state.active,
        started: state.started,
        paused: state.paused,
        caught: state.caught,
        hidden: state.hidden,
        keys: state.keysFound,
        lives: state.lives,
        gameState: state.gameState,
        zone: state.zone,
        tutorialStep: state.tutorialStep,
        screamer: horror.debugState,
        camYaw: player.camYaw,
        battery: state.battery,
        stamina: state.stamina,
        debug: state.debug,
        fps: state.fps,
        keysDown: [...keysDown],
        lastMove: { ...state.lastMove },
        debugInfo: { ...state.debugInfo },
        ghosts: ghostEntries.map((entry) => ({
          type: entry.type,
          mode: entry.mode,
          active: entry.model.active,
          x: Math.round(entry.model.position.x * 10) / 10,
          z: Math.round(entry.model.position.z * 10) / 10,
        })),
      };
    },
    dispose,
  };
}

function disposeGroupSafe(scene) {
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose?.();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (!mat) return;
        for (const value of Object.values(mat)) {
          if (value?.isTexture) value.dispose();
        }
        mat.dispose?.();
      });
    }
  });
}
