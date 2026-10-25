import * as THREE from "three";
import gsap from "gsap";
import { createRabbit } from "../models/rabbit.js";
import { createCake } from "../models/cake.js";
import { createAnimal } from "../models/animals.js";
import { createPhotoGallery } from "../models/photoGallery.js";
import { createKridiBook } from "../models/kridiBook.js";
import {
  createCakeTable,
  createBalloons,
  createGifts,
  createArmchair,
  createPlushStack,
  createBunnyMirror,
  createVase,
  createShelf,
  createStarMobile,
  createFairyLights,
  createPartyWindow,
  createBanner,
  createConfettiCannon,
  createPartyAmbience,
} from "../models/partyProps.js";
import {
  mat,
  makeFloorTexture,
  makePrettyWallpaper,
  makePrettyCarpetTexture,
  roundedBoxGeometry,
  disposeGroup,
  pick,
  rand,
} from "../models/props.js";
import { CONFIG } from "../config.js";

const PHASE = {
  ENTER: "ENTER",
  CAKE_DELIVERY: "CAKE_DELIVERY",
  WISH: "WISH",
  BLOW: "BLOW",
  CELEBRATE: "CELEBRATE",
  LETTER: "LETTER",
  KRIDI: "KRIDI",
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createPartyRoom(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a1838);

  const state = {
    phase: PHASE.ENTER,
    time: 0,
    busy: true,
    entered: false,
    candlesOut: false,
    blowing: false,
    celebrated: false,
    freePlay: false,
    freePlayTimer: 25,
    letterShown: false,
    kridiStarted: false,
    kridiActive: false,
    kridiResolved: false,
    mazePromptOpen: false,
    partyWin: false,
    cakePush: false,
    disposed: false,
    fireworks: 0,
    fireworkTimer: 0,
    trolleyMoving: false,
    mic: null,
    micSustained: 0,
  };

  const hemi = new THREE.HemisphereLight(0xfff6ec, 0x9a6a80, 0.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0c4, 0.06);
  sun.position.set(4, 6, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -2;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 22;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ map: makeFloorTexture(), color: 0xffe8ef, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallTex = makePrettyWallpaper();
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
  for (const [x, z, ry] of [
    [0, -4, 0],
    [-4, 0, Math.PI / 2],
    [4, 0, -Math.PI / 2],
  ]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.5), wallMat);
    wall.position.set(x, 1.75, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    scene.add(wall);
  }
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff1f7, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.5;
  scene.add(ceiling);

  const white = mat(0xfffdfb, { roughness: 0.7 });
  const railMat = mat(0xffd1e5, { roughness: 0.6 });
  for (const w of [
    { size: [8, 0.9, 0.04], pos: [0, 0.45, -3.97] },
    { size: [8, 0.9, 0.04], pos: [0, 0.45, 3.97] },
    { size: [0.04, 0.9, 8], pos: [-3.97, 0.45, 0] },
    { size: [0.04, 0.9, 8], pos: [3.97, 0.45, 0] },
  ]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...w.size), white);
    mesh.position.set(...w.pos);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  for (const r of [
    { size: [8, 0.06, 0.08], pos: [0, 0.92, -3.95] },
    { size: [8, 0.06, 0.08], pos: [0, 0.92, 3.95] },
    { size: [0.08, 0.06, 8], pos: [-3.95, 0.92, 0] },
    { size: [0.08, 0.06, 8], pos: [3.95, 0.92, 0] },
    { size: [8, 0.12, 0.1], pos: [0, 0.06, -3.95] },
    { size: [0.1, 0.12, 8], pos: [-3.95, 0.06, 0] },
    { size: [0.1, 0.12, 8], pos: [3.95, 0.06, 0] },
  ]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...r.size), railMat);
    mesh.position.set(...r.pos);
    scene.add(mesh);
  }

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 4.2),
    new THREE.MeshStandardMaterial({ map: makePrettyCarpetTexture(), roughness: 1 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, -0.5);
  rug.receiveShadow = true;
  scene.add(rug);

  for (const [x, z, ry] of [
    [0, -3.96, 0],
    [0, 3.96, 0],
    [-3.96, 0, Math.PI / 2],
    [3.96, 0, Math.PI / 2],
  ]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(8, 0.09, 0.08), railMat);
    trim.position.set(x, 3.42, z);
    trim.rotation.y = ry;
    scene.add(trim);
  }

  const partyWindow = createPartyWindow();
  partyWindow.group.position.set(-2.05, 1.65, -3.93);
  scene.add(partyWindow.group);
  const windowLight = new THREE.PointLight(0xc9a7ff, 0.35, 6.5, 2);
  windowLight.position.set(-2.0, 2.15, -2.8);
  scene.add(windowLight);

  const banner = createBanner("HAPPY BIRTHDAY ARNOUBA");
  banner.group.position.set(0, 0.12, -3.82);
  banner.group.scale.setScalar(0.94);
  scene.add(banner.group);

  const fairyA = createFairyLights(
    [
      new THREE.Vector3(-3.85, 2.95, -3.6),
      new THREE.Vector3(-3.85, 2.55, -1.6),
      new THREE.Vector3(-3.85, 2.75, 0.6),
      new THREE.Vector3(-3.85, 2.5, 2.6),
      new THREE.Vector3(-3.85, 2.85, 3.8),
    ],
    20
  );
  scene.add(fairyA.group);
  const fairyB = createFairyLights(
    [
      new THREE.Vector3(3.85, 2.9, -3.6),
      new THREE.Vector3(3.85, 2.55, -1.6),
      new THREE.Vector3(3.85, 2.8, 0.6),
      new THREE.Vector3(3.85, 2.5, 2.6),
      new THREE.Vector3(3.85, 2.85, 3.8),
    ],
    20
  );
  scene.add(fairyB.group);

  const mobile = createStarMobile();
  mobile.group.position.set(1.9, 2.55, -0.55);
  mobile.group.scale.setScalar(0.85);
  scene.add(mobile.group);
  const mobileLight = new THREE.PointLight(0xffd66b, 0.2, 5, 2);
  mobileLight.position.set(1.9, 2.5, -0.4);
  scene.add(mobileLight);

  const fillLight = new THREE.PointLight(0xffd9e6, 0.08, 7, 2);
  fillLight.position.set(0, 2.9, 2.4);
  scene.add(fillLight);

  const table = createCakeTable();
  table.group.position.set(0.9, 0, -2.9);
  scene.add(table.group);

  const cake = createCake();
  cake.setLitAll(false);
  const cakeHit = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 16, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  cakeHit.position.y = 1.28;
  cakeHit.userData.type = "candles";
  cake.group.add(cakeHit);

  const trolley = createCakeTrolley();
  trolley.group.position.set(2.75, 0, -3.45);
  scene.add(trolley.group);
  trolley.group.add(cake.group);
  cake.group.position.set(0, trolley.topY, 0);

  const curtain = createCurtain();
  curtain.group.position.set(2.68, 0, -3.92);
  scene.add(curtain.group);

  const balloons = createBalloons();
  scene.add(balloons.group);

  const gifts = createGifts(CONFIG.texts.gifts);
  const giftPositions = [
    [-3.05, -2.75],
    [2.85, -2.2],
    [-3.2, 0.25],
    [3.1, 0.55],
    [-1.65, -2.6],
  ];
  gifts.gifts.forEach((g, i) => {
    const [x, z] = giftPositions[i];
    g.group.position.set(x, 0, z);
  });
  scene.add(gifts.group);

  const armchair = createArmchair();
  armchair.position.set(-2.9, 0, -1.35);
  armchair.rotation.y = Math.PI / 2 - 0.18;
  scene.add(armchair);
  const plush = createPlushStack();
  plush.position.set(-2.86, -0.06, -1.32);
  plush.rotation.y = Math.PI / 2 - 0.18;
  scene.add(plush);

  const mirror = createBunnyMirror();
  mirror.group.position.set(3.9, 1.75, -1.4);
  mirror.group.rotation.y = -Math.PI / 2;
  scene.add(mirror.group);

  const shelf = createShelf();
  shelf.group.position.set(3.88, 1.45, 2.0);
  shelf.group.rotation.y = -Math.PI / 2;
  scene.add(shelf.group);
  const vase = createVase([0xff9ec9, 0xffd66b, 0xc9a7ff]);
  vase.group.position.set(3.78, 1.49, 1.55);
  scene.add(vase.group);

  const cannonL = createConfettiCannon(0xff9ec9);
  cannonL.group.position.set(-2.65, 0, 2.15);
  cannonL.group.rotation.y = -0.35;
  scene.add(cannonL.group);
  const cannonR = createConfettiCannon(0xa8d8ff);
  cannonR.group.position.set(2.65, 0, 2.15);
  cannonR.group.rotation.y = 0.35;
  scene.add(cannonR.group);

  const ambience = createPartyAmbience();
  scene.add(ambience.group);

  const gallery = createPhotoGallery();
  scene.add(gallery.group);

  const kridiBook = createKridiBook();
  scene.add(kridiBook.group);
  kridiBook.setScratchCallback(() => ctx.sfx("scratch"));
  const kridiPanel = document.getElementById("kridiPanel");
  const kridiTotal = document.getElementById("kridiTotal");
  const kridiAdd = document.getElementById("kridiAdd");
  const kridiClose = document.getElementById("kridiClose");
  const mazePromptOverlay = document.getElementById("mazePromptOverlay");
  const mazeEnterBtn = document.getElementById("mazeEnterBtn");
  const mazeNotNowBtn = document.getElementById("mazeNotNowBtn");

  const rabbit = createRabbit();
  rabbit.setOutfit("party");
  rabbit.group.position.set(-0.95, 0, 1.15);
  rabbit.group.rotation.y = Math.PI + 0.18;
  scene.add(rabbit.group);
  scene.add(rabbit.effects);

  const animalSpecs = [
    ["fox", 2.55, -3.62, 0.95],
    ["bear", 2.2, -3.48, 1.06],
    ["cat", 2.92, -3.72, 0.88],
    ["penguin", 3.08, -3.55, 0.82],
    ["hedgehog", 2.52, -3.8, 0.78],
    ["duck", 2.88, -3.86, 0.76],
    ["panda", 2.32, -3.84, 1],
    ["bunny", 2.68, -3.9, 0.58],
    ["bunny", 2.48, -3.92, 0.56],
  ];
  const animals = animalSpecs.map(([type, x, z, scale], i) => {
    const animal = createAnimal(type, { scale });
    animal.group.position.set(x, 0, z);
    animal.group.rotation.y = 0;
    animal.hit.userData.animalIndex = i;
    scene.add(animal.group);
    return animal;
  });
  const bunnyA = animals[7];
  const bunnyB = animals[8];

  const cakePos = new THREE.Vector3(0.9, 1.7, -2.9);
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const lightMood = { window: 0.35, mobile: 0.2, photo: 0.25 };

  function setPhase(phase) {
    state.phase = phase;
    console.log("[party] phase:", phase);
  }

  function playBirthdaySong() {
    const audio = ctx.audio;
    if (!audio) return;
    audio.unlock();
    const start = () => audio.play("birthday-song", { volume: 0.8, fadeIn: 0.12 });
    if (audio.ready) {
      start();
      return;
    }
    const loading = audio.preload();
    if (loading?.then) loading.then(start).catch(() => {});
  }

  function setRoomMood(mood, duration = 0.8) {
    const values = {
      dim: { hemi: 0.2, sun: 0.06, fill: 0.08, window: 0.35, mobile: 0.2, photo: 0.25, bg: 0x2a1838 },
      warm: { hemi: 0.95, sun: 1.15, fill: 0.48, window: 1.05, mobile: 0.7, photo: 0.65, bg: 0xffe7f1 },
      party: { hemi: 1.18, sun: 1.5, fill: 0.72, window: 1.25, mobile: 0.9, photo: 0.8, bg: 0xffe7f1 },
      dark: { hemi: 0.08, sun: 0.02, fill: 0.03, window: 0.15, mobile: 0.08, photo: 0.1, bg: 0x1d1228 },
    }[mood];
    gsap.to(hemi, { intensity: values.hemi, duration });
    gsap.to(sun, { intensity: values.sun, duration });
    gsap.to(fillLight, { intensity: values.fill, duration });
    gsap.to(lightMood, { window: values.window, mobile: values.mobile, photo: values.photo, duration });
    const bg = new THREE.Color(values.bg);
    gsap.to(scene.background, { r: bg.r, g: bg.g, b: bg.b, duration });
  }

  cakeHit.userData.onTap = () => {
    if (state.phase === PHASE.BLOW) blowCandles();
    else if (state.freePlay) ctx.toast("El cake mte3ek 💗", 1300);
  };
  gifts.interactives.forEach((hit, i) => {
    hit.userData.onTap = () => onGift(i);
  });
  balloons.interactives.forEach((hit, i) => {
    hit.userData.onTap = () => onBalloon(i);
  });
  mirror.hit.userData.onTap = () => onMirror();
  rabbit.interactive.userData.onTap = () => {
    if (state.kridiResolved && !state.mazePromptOpen && !state.busy) {
      askOtherDoor();
      return;
    }
    rabbit.giggle();
    ctx.toast(CONFIG.texts.rabbitTapLine, 2000);
  };
  animals.forEach((animal) => {
    animal.hit.userData.onTap = () => onAnimal(animal);
  });

  async function onCandle(index) {
    if (state.phase !== PHASE.BLOW || state.candlesOut) return;
    await cake.blowCandle(index);
    if (state.candlesOut) return;
    if (cake.litCount > 0) ctx.toast(`Fffff… ${cake.litCount} left 🕯️`, 900);
    else blowCandles();
  }

  function onGift(index) {
    if (!state.freePlay) return;
    gifts.open(index);
    ctx.toast("Surprise! 🎁", 1500);
    gifts.gifts[index].group.getWorldPosition(tmp);
    tmp.y += 0.8;
    ambience.burstSparkles(tmp, 12);
    if (gifts.allOpened) setTimeout(maybeLetter, 900);
  }

  function onBalloon(index) {
    if (!state.freePlay) return;
    balloons.pop(index);
    ctx.toast(CONFIG.texts.balloonLine, 900);
  }

  function onAnimal(animal) {
    if (!state.freePlay) return;
    animal.talkFor(1.8);
    animal.jump();
    const lines = CONFIG.texts.animalLines[animal.type] || CONFIG.texts.animalLines.bunny;
    ctx.toast(pick(lines), 2200);
  }

  function onMirror() {
    if (!state.freePlay) return;
    mirror.sparkle(new THREE.Vector3(3.55, 1.75, -1.4));
    ctx.toast(CONFIG.texts.mirrorLine, 2200);
  }

  function onPhoto(index = 0) {
    if (!state.freePlay) return;
    ctx.hideHint();
    rabbit.lookAt(gallery.mainFrame.group.position);
    gallery.group.getWorldPosition(tmp);
    tmp.y += 0.35;
    ambience.burstHearts(tmp, 16);
    gallery.open(index);
    ctx.toast(CONFIG.texts.photoLine, 1400);
  }

  async function deliverCake() {
    setPhase(PHASE.CAKE_DELIVERY);
    ctx.sfx("drumroll");
    await wait(650);
    curtain.open();
    await wait(300);
    state.trolleyMoving = true;

    const paths = [
      animals[0].walkPath([{ x: 2.25, z: -3.05 }, { x: 1.55, z: -2.42 }, { x: -0.45, z: -2.15 }], 3.3, { rotation: 0 }),
      animals[1].walkPath([{ x: 2.05, z: -3.2 }, { x: 1.7, z: -3.02 }, { x: 2.2, z: -2.35 }], 3.3, { rotation: 0 }),
      animals[2].walkPath([{ x: 2.8, z: -3.1 }, { x: 2.95, z: -2.55 }, { x: -1.25, z: -2.55 }], 3.6, { rotation: 0 }),
      animals[3].walkPath([{ x: 3.0, z: -3.05 }, { x: 3.1, z: -2.5 }, { x: 2.95, z: -2.5 }], 3.6, { rotation: 0 }),
      animals[4].walkPath([{ x: 2.45, z: -3.15 }, { x: 2.2, z: -2.6 }, { x: -0.85, z: -1.8 }], 3.8, { rotation: 0 }),
      animals[5].walkPath([{ x: 2.85, z: -3.15 }, { x: 2.65, z: -2.45 }, { x: 2.55, z: -1.8 }], 3.8, { rotation: 0 }),
      animals[6].walkPath([{ x: 2.25, z: -3.15 }, { x: 2.05, z: -2.5 }, { x: 1.75, z: -1.62 }], 3.8, { rotation: 0 }),
      bunnyA.walkPath([{ x: 2.55, z: -3.2 }, { x: 1.9, z: -2.7 }, { x: 0.25, z: -1.72 }], 3.9, { rotation: 0, hop: true }),
      bunnyB.walkPath([{ x: 2.4, z: -3.2 }, { x: 1.6, z: -2.65 }, { x: 0.55, z: -1.5 }], 4.0, { rotation: 0, hop: true }),
    ];
    animals[1].setPush(true);
    const trolleyMove = new Promise((resolve) => {
      gsap.to(trolley.group.position, {
        x: 1.75,
        z: -2.95,
        duration: 3.2,
        ease: "sine.inOut",
        onComplete: resolve,
      });
    });

    await Promise.all([...paths, trolleyMove]);
    animals[1].setPush(false);
    state.trolleyMoving = false;

    scene.attach(cake.group);
    const lift = new Promise((resolve) => {
      gsap.to(cake.group.position, {
        x: 0.9,
        y: table.topY,
        z: -2.9,
        duration: 0.75,
        ease: "back.out(1.4)",
        onComplete: resolve,
      });
    });
    gsap.fromTo(cake.group.scale, { x: 1, y: 1, z: 1 }, { x: 1.05, y: 0.94, z: 1.05, duration: 0.2, yoyo: true, repeat: 1 });
    await lift;
    ctx.sfx("ding");
    ambience.burstSparkles(new THREE.Vector3(0.9, 1.65, -2.9), 30);
    await wait(250);

    const arm = animals[0].raiseArm(5.2);
    for (let i = 0; i < 5; i++) {
      await cake.lightCandle(i);
      ctx.sfx("pshh");
      await wait(260);
    }
    setRoomMood("warm", 1.1);
    await arm;
    gsap.to(trolley.group.position, { x: 2.9, z: -2.15, duration: 0.8, ease: "sine.inOut" });

    animals.forEach((animal) => animal.setSinging(true));
    ctx.sfx("musicBox");
    await wait(3800);
    animals.forEach((animal) => animal.setSinging(false));
    if (state.disposed) return;
    await ctx.say([CONFIG.texts.deliverySing, CONFIG.texts.wishLine]);
  }

  async function wishSequence() {
    setPhase(PHASE.WISH);
    state.cakePush = true;
    rabbit.lookAt(cakePos);
    rabbit.closeEyes(3.2);
    rabbit.group.getWorldPosition(tmp);
    tmp.y += 0.9;
    ambience.burstSparkles(tmp, 22);
    await wait(2000);
    if (state.disposed) return;
    ctx.hint(CONFIG.texts.wishHint);
    ctx.showBlowButton(blowCandles);
    setPhase(PHASE.BLOW);
    state.busy = false;
    startMic();
  }

  async function blowCandles() {
    if (state.phase !== PHASE.BLOW || state.candlesOut || state.blowing || state.disposed) return;
    state.blowing = true;
    ctx.hideBlowButton();
    ctx.hideHint();
    stopMic();
    console.log("[candles] out");
    for (let i = 0; i < 5; i++) {
      await cake.blowCandle(i);
      ctx.sfx("fffhh");
      await wait(150);
    }
    cake.setLitAll(false);
    state.candlesOut = true;
    ctx.sfx("poof");
    setRoomMood("dark", 0.35);
    await wait(1000);
    state.cakePush = false;
    state.blowing = false;
    setPhase(PHASE.CELEBRATE);
    await celebrate();
  }

  async function celebrate() {
    if (state.celebrated || state.disposed) return;
    state.celebrated = true;
    state.fireworks = 9;
    state.fireworkTimer = 0;
    setRoomMood("party", 0.7);
    playBirthdaySong();
    ctx.sfx("applause");
    animals.forEach((animal) => animal.clap(5));
    rabbit.happy().then(() => {
      if (!state.disposed) rabbit.jump();
    });

    for (const cannon of [cannonL, cannonR]) {
      cannon.muzzle.getWorldPosition(tmp);
      ambience.burstConfetti(tmp, 55);
      ambience.burstSparkles(tmp, 18);
    }
    ambience.burstConfetti(new THREE.Vector3(0.9, 2.8, -2.9), 80);
    ambience.burstHearts(new THREE.Vector3(-3.3, 2.15, -3.6), 18);
    balloons.rise(0.22, 2.4);
    banner.twinkle();
    gallery.glowAll();

    setTimeout(() => {
      if (state.disposed) return;
      animals[0].highFive();
      animals[1].highFive();
      animals[5].spin();
      animals[3].slide();
      animals[6].jump();
      bunnyA.backflip();
      bunnyB.backflip();
    }, 700);

    await wait(900);
    await ctx.say([CONFIG.texts.celebrateLine]);
    if (state.disposed) return;
    state.freePlay = true;
    state.freePlayTimer = 25;
    state.busy = false;
  }

  function updateKridiPanel() {
    if (!kridiTotal) return;
    kridiTotal.textContent = `${CONFIG.kridi.totalLabel} \u00b7 ${kridiBook.itemCount}`;
  }

  async function addKridiItem() {
    if (!state.kridiActive || state.busy || kridiAdd.disabled) return;
    kridiAdd.disabled = true;
    const line = pick(CONFIG.kridi.extra);
    await kridiBook.writeItem(line);
    if (state.disposed) return;
    updateKridiPanel();
    ctx.sfx("pop");
    kridiAdd.disabled = false;
  }

  async function startKridi() {
    if (state.kridiStarted || state.disposed) return;
    state.kridiStarted = true;
    setPhase(PHASE.KRIDI);
    state.freePlay = false;
    state.busy = true;
    ctx.hideBack();
    ctx.hideHint();
    ctx.hideBlowButton();
    stopMic();
    rabbit.lookAt(new THREE.Vector3(0.4, 1.9, 3.2));
    ctx.sfx("drumroll");
    await ctx.say([CONFIG.kridi.introLine]);
    if (state.disposed) return;
    ctx.sfx("whoosh");
    await kridiBook.open();
    if (state.disposed) return;
    await ctx.say([CONFIG.kridi.pullLine]);
    if (state.disposed) return;
    for (const item of CONFIG.kridi.items) {
      await kridiBook.writeItem(item);
      if (state.disposed) return;
      await wait(120);
    }
    await ctx.say([CONFIG.kridi.tellLine]);
    if (state.disposed) return;
    ctx.sfx("stamp");
    await kridiBook.stamp();
    if (state.disposed) return;
    await ctx.say([CONFIG.kridi.stampLine]);
    if (state.disposed) return;
    state.kridiActive = true;
    state.busy = false;
    updateKridiPanel();
    if (kridiPanel) kridiPanel.hidden = false;
    if (kridiAdd) kridiAdd.disabled = false;
    rabbit.lookAt(null);
  }

  async function finishKridi() {
    if (!state.kridiActive || state.busy || state.disposed) return;
    state.kridiActive = false;
    state.busy = true;
    if (kridiPanel) kridiPanel.hidden = true;
    ctx.sfx("whoosh");
    await kridiBook.close();
    if (state.disposed) return;
    await ctx.say([CONFIG.kridi.closeLine]);
    if (state.disposed) return;
    state.kridiResolved = true;
    state.busy = false;
    askOtherDoor();
  }

  async function askOtherDoor() {
    if (state.disposed || state.mazePromptOpen || state.partyWin) return;
    state.busy = true;
    state.freePlay = false;
    state.mazePromptOpen = true;
    ctx.hideBack();
    ctx.hideHint();
    rabbit.lookAt(new THREE.Vector3(0, 1.45, 4.8));
    await ctx.say([CONFIG.texts.otherDoorQuestion]);
    if (state.disposed) return;
    if (mazePromptOverlay) mazePromptOverlay.hidden = false;
  }

  if (kridiAdd) {
    kridiAdd.addEventListener("click", (event) => {
      event.stopPropagation();
      addKridiItem();
    });
  }
  if (kridiClose) {
    kridiClose.addEventListener("click", (event) => {
      event.stopPropagation();
      finishKridi();
    });
  }
  if (kridiPanel) {
    kridiPanel.addEventListener("pointerdown", (event) => event.stopPropagation());
  }

  async function partyVictory(meta = {}) {
    if (state.partyWin || state.disposed) return;
    state.partyWin = true;
    state.busy = true;
    state.freePlay = false;
    setPhase("PARTY_WIN");
    ctx.hideBack();
    ctx.hideHint();
    ctx.hideBlowButton();
    if (mazePromptOverlay) mazePromptOverlay.hidden = true;
    setRoomMood("party", 0.8);
    ctx.sfx("cheer");
    animals.forEach((animal) => animal.clap(5));
    animals[0]?.jump();
    rabbit.happy().then(() => {
      if (!state.disposed) rabbit.jump();
    });
    ambience.burstConfetti(new THREE.Vector3(0.9, 2.8, -2.9), 70);
    ambience.burstHearts(new THREE.Vector3(-3.3, 2.15, -3.6), 20);
    gallery.glowAll();
    const minutes = Math.floor((meta.time || 0) / 60);
    const seconds = Math.floor((meta.time || 0) % 60).toString().padStart(2, "0");
    ctx.toast(`Khrajt fi ${minutes}:${seconds}, ${meta.lives ?? state.lives} lives \u{1F497}`, 5000);
    await ctx.say([CONFIG.maze.victory, CONFIG.maze.foxTwist]);
    if (state.disposed) return;
    await ctx.showGiftNote(CONFIG.finalGift.text);
    if (state.disposed) return;
    state.busy = false;
    state.freePlay = true;
  }

  if (mazeEnterBtn) {
    mazeEnterBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (state.disposed) return;
      if (mazePromptOverlay) mazePromptOverlay.hidden = true;
      state.mazePromptOpen = false;
      state.busy = true;
      ctx.hideBack();
      await ctx.transition("hallway", { scenario3: true });
      if (!state.disposed) state.busy = false;
    });
  }
  if (mazeNotNowBtn) {
    mazeNotNowBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.disposed) return;
      if (mazePromptOverlay) mazePromptOverlay.hidden = true;
      state.mazePromptOpen = false;
      state.busy = false;
      state.freePlay = true;
      ctx.toast(CONFIG.texts.otherDoorNo, 3200);
    });
  }
  if (mazePromptOverlay) {
    mazePromptOverlay.addEventListener("pointerdown", (event) => event.stopPropagation());
  }

  function maybeLetter() {
    if (!state.freePlay || state.letterShown || state.disposed) return;
    state.letterShown = true;
    state.freePlay = false;
    setPhase(PHASE.LETTER);
    state.busy = true;
    ctx.hideHint();
    ctx.hideBlowButton();
    ctx.hideBack();
    stopMic();
    ctx.showLetter().then(() => {
      if (state.disposed) return;
      startKridi();
    });
  }

  async function startMic() {
    if (!CONFIG.micBlowEnabled || state.mic || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (state.phase !== PHASE.BLOW || state.disposed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const audio = new AC();
      const source = audio.createMediaStreamSource(stream);
      const analyser = audio.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      state.mic = { stream, audio, analyser, data: new Uint8Array(analyser.fftSize) };
    } catch (error) {
      state.mic = null;
    }
  }

  function stopMic() {
    if (!state.mic) return;
    state.mic.stream.getTracks().forEach((track) => track.stop());
    state.mic.audio.close().catch(() => {});
    state.mic = null;
    state.micSustained = 0;
  }

  function checkMic(dt) {
    if (!state.mic || state.phase !== PHASE.BLOW || state.candlesOut) return;
    const { analyser, data } = state.mic;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    if (rms > 0.12) state.micSustained += dt;
    else state.micSustained = 0;
    if (state.micSustained > 0.4) blowCandles();
  }

  async function onEnter(prev, meta = {}) {
    if (state.disposed) return;
    if (meta?.mazeWin) {
      state.entered = true;
      await partyVictory(meta);
      return;
    }
    if (meta?.mazeQuit) {
      state.entered = true;
      state.busy = false;
      state.freePlay = true;
      if (mazePromptOverlay) mazePromptOverlay.hidden = true;
      state.mazePromptOpen = false;
      ctx.toast("Rja3t lel party \u{1F497}", 1800);
      return;
    }
    if (state.entered) {
      state.busy = false;
      return;
    }
    state.entered = true;
    state.busy = true;
    ctx.hideBack();
    ctx.hideHint();
    ctx.hideBlowButton();
    rabbit.idle();
    setPhase(PHASE.ENTER);
    await wait(350);
    if (state.disposed) return;
    await ctx.say([CONFIG.texts.partyEnter]);
    if (state.disposed) return;
    await deliverCake();
    if (state.disposed) return;
    await wishSequence();
  }

  function update(dt) {
    if (state.disposed) return;
    state.time += dt;
    const t = state.time;
    rabbit.update(dt);
    cake.update(dt);
    balloons.update(dt);
    gifts.update(dt);
    mirror.update(dt);
    vase.update(dt);
    mobile.update(dt);
    fairyA.update(dt);
    fairyB.update(dt);
    banner.update(dt);
    ambience.update(dt);
    gallery.update(dt);
    kridiBook.update(dt);
    animals.forEach((animal) => animal.update(dt));

    if (state.trolleyMoving) {
      trolley.wheels.forEach((wheel) => {
        wheel.rotation.x += dt * 5;
      });
    }

    windowLight.intensity = lightMood.window + Math.sin(t * 1.7) * 0.06;
    mobileLight.intensity = lightMood.mobile + Math.sin(t * 2.3) * 0.08;

    if (state.phase === PHASE.BLOW) checkMic(dt);

    if (state.freePlay && !state.letterShown) {
      state.freePlayTimer -= dt;
      if (state.freePlayTimer <= 0) maybeLetter();
    }

    if (state.fireworks > 0) {
      state.fireworkTimer -= dt;
      if (state.fireworkTimer <= 0) {
        state.fireworkTimer = 0.26 + Math.random() * 0.2;
        state.fireworks -= 1;
        tmp.set(rand(-2.5, 2.5), rand(2.0, 3.15), rand(-3.55, -3.2));
        ambience.burstSparkles(tmp, 22);
        ambience.burstConfetti(tmp, 14);
      }
    }
  }

  function getCameraPose(aspect, t) {
    if (state.cakePush) {
      return {
        position: new THREE.Vector3(0.95 + Math.sin(t * 0.4) * 0.03, 1.95, -0.9),
        target: new THREE.Vector3(0.9, 1.55, -2.9),
        fov: 42,
      };
    }
    const portrait = aspect < 0.82;
    const pos = new THREE.Vector3(
      Math.sin(t * 0.32) * 0.07,
      (portrait ? 2.25 : 1.95) + Math.sin(t * 0.45) * 0.03,
      portrait ? 5.25 : 4.8
    );
    const target = new THREE.Vector3(
      0.08 + Math.sin(t * 0.27) * 0.04,
      (portrait ? 1.35 : 1.2) + Math.sin(t * 0.4) * 0.02,
      -1.25
    );
    return { position: pos, target, fov: portrait ? 70 : 55 };
  }

  function dispose() {
    state.disposed = true;
    stopMic();
    ctx.hideBack();
    ctx.hideHint();
    ctx.hideBlowButton();
    gsap.killTweensOf(hemi);
    gsap.killTweensOf(sun);
    gsap.killTweensOf(fillLight);
    gsap.killTweensOf(lightMood);
    gsap.killTweensOf(scene.background);
    rabbit.dispose();
    cake.dispose();
    balloons.dispose();
    gifts.dispose();
    mirror.dispose();
    vase.dispose();
    mobile.dispose();
    fairyA.dispose();
    fairyB.dispose();
    banner.dispose();
    ambience.dispose();
    gallery.dispose();
    kridiBook.dispose();
    if (kridiPanel) kridiPanel.hidden = true;
    animals.forEach((animal) => animal.dispose());
    cannonL.dispose();
    cannonR.dispose();
    curtain.dispose();
    trolley.dispose();
    disposeGroup(table.group);
    disposeGroup(armchair);
    disposeGroup(plush);
    disposeGroup(shelf.group);
    disposeGroup(partyWindow.group);
    disposeGroup(scene);
  }

  return {
    name: "party",
    scene,
    update,
    getCameraPose,
    onEnter,
    interactives: [
      cakeHit,
      ...animals.map((animal) => animal.hit),
      ...gifts.interactives,
      ...balloons.interactives,
      mirror.hit,
      rabbit.interactive,
      ...gallery.interactives,
    ],
    cake,
    onCandle,
    get phase() {
      return state.phase;
    },
    get busy() {
      return state.busy;
    },
    dispose,
  };
}

function createCurtain() {
  const group = new THREE.Group();
  const pink = mat(0xff9ec9, { roughness: 0.85 });
  const pinkLight = mat(0xffc2dd, { roughness: 0.9 });
  const gold = mat(0xffd66b, { roughness: 0.35, metalness: 0.35 });
  const opening = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 2.45),
    new THREE.MeshBasicMaterial({ color: 0x2a1838 })
  );
  opening.position.set(0, 1.28, -0.045);
  group.add(opening);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.55, 10), gold);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, 2.53, 0.02);
  group.add(rod);
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), gold);
    cap.position.set(side * 0.78, 2.53, 0.02);
    group.add(cap);
  }
  const valance = new THREE.Mesh(roundedBoxGeometry(1.5, 0.22, 0.08, 0.05), pinkLight);
  valance.position.set(0, 2.38, 0.03);
  group.add(valance);
  const panels = [];
  for (const side of [-1, 1]) {
    const panel = new THREE.Group();
    panel.position.set(side * 0.31, 1.25, 0.04);
    const cloth = new THREE.Mesh(roundedBoxGeometry(0.61, 2.3, 0.06, 0.04), pink);
    cloth.castShadow = true;
    panel.add(cloth);
    for (let i = 0; i < 4; i++) {
      const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 2.2, 5), pinkLight);
      fold.position.set((i - 1.5) * 0.14, 0, 0.035);
      panel.add(fold);
    }
    group.add(panel);
    panels.push(panel);
  }
  return {
    group,
    open() {
      gsap.to(panels[0].position, { x: -0.95, duration: 0.8, ease: "power2.inOut" });
      gsap.to(panels[1].position, { x: 0.95, duration: 0.8, ease: "power2.inOut" });
    },
    dispose() {
      gsap.killTweensOf(panels[0].position);
      gsap.killTweensOf(panels[1].position);
      disposeGroup(group);
    },
  };
}

function createCakeTrolley() {
  const group = new THREE.Group();
  const pink = mat(0xffb6d5, { roughness: 0.6 });
  const white = mat(0xfffdfb, { roughness: 0.7 });
  const gold = mat(0xffd66b, { roughness: 0.3, metalness: 0.4 });
  const base = new THREE.Mesh(roundedBoxGeometry(0.98, 0.13, 0.64, 0.06), pink);
  base.position.y = 0.32;
  base.castShadow = true;
  group.add(base);
  const top = new THREE.Mesh(roundedBoxGeometry(0.94, 0.07, 0.6, 0.04), white);
  top.position.y = 0.43;
  top.castShadow = true;
  group.add(top);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.18, 24, 1, true), pink);
  skirt.position.y = 0.24;
  skirt.scale.z = 0.64;
  group.add(skirt);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), gold);
    dot.position.set(Math.cos(a) * 0.48, 0.44, Math.sin(a) * 0.31);
    group.add(dot);
  }
  const wheels = [];
  for (const x of [-0.36, 0.36]) {
    for (const z of [-0.2, 0.2]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 14), gold);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.12, z);
      group.add(wheel);
      wheels.push(wheel);
    }
  }
  const handle = new THREE.Group();
  handle.position.set(0, 0.58, -0.32);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), gold);
  bar.rotation.z = Math.PI / 2;
  handle.add(bar);
  for (const side of [-1, 1]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.35, 8), gold);
    stem.position.set(side * 0.34, -0.16, 0);
    handle.add(stem);
  }
  group.add(handle);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xffd66b, side: THREE.DoubleSide })
  );
  banner.position.set(0, 0.27, 0.33);
  group.add(banner);
  return {
    group,
    wheels,
    topY: 0.48,
    dispose() {
      disposeGroup(group);
    },
  };
}
