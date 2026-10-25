import * as THREE from "three";
import gsap from "gsap";
import { createRabbit } from "../models/rabbit.js";
import { createScaryDoor, createPrettyDoor } from "../models/doors.js";
import {
  COLORS,
  mat,
  basicMat,
  emissiveMat,
  canvasTexture,
  makeFloorTexture,
  makeScaryWallpaper,
  makePrettyWallpaper,
  makeHallwayWallTexture,
  makePrettyCarpetTexture,
  makeTatteredCarpetTexture,
  makeGlowTexture,
  makeStarTexture,
  makeSprayParticles,
  roundedBoxGeometry,
  disposeGroup,
  drawFlower,
  rand,
} from "../models/props.js";
import { CONFIG } from "../config.js";

function makeLantern(color, chain = 0.5) {
  const group = new THREE.Group();
  const metal = mat(0x5a4a63, { metalness: 0.45, roughness: 0.5 });
  const chainMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, chain, 6), metal);
  chainMesh.position.y = chain / 2;
  group.add(chainMesh);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 8), metal);
  cap.position.y = 0.01;
  group.add(cap);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.32, 8), metal);
  body.position.y = -0.16;
  group.add(body);
  const glassMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.72,
    roughness: 0.4,
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, 0.28, 8, 1, true), glassMat);
  glass.position.y = -0.16;
  group.add(glass);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), basicMat(0xfff0c0));
  flame.scale.set(0.7, 1.6, 0.7);
  flame.position.y = -0.15;
  group.add(flame);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(color === 0x7cff6b ? "124,255,107" : "255,194,221"),
      color,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(0.9, 0.9, 1);
  glow.position.y = -0.15;
  group.add(glow);
  const bottom = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.1, 8), metal);
  bottom.position.y = -0.34;
  bottom.rotation.z = Math.PI;
  group.add(bottom);
  return { group, glow, glassMat };
}

function makeSconce(color, warm = true) {
  const group = new THREE.Group();
  const metal = mat(warm ? COLORS.gold : 0x4a3a52, { metalness: 0.45, roughness: 0.45 });
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.18), metal);
  bracket.position.set(0, 0, -0.06);
  group.add(bracket);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.08, 10), metal);
  cup.position.set(0, 0.02, 0.1);
  group.add(cup);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8), mat(0xfff3e4));
  candle.position.set(0, 0.14, 0.1);
  group.add(candle);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 10, 8),
    emissiveMat(color, 2.6)
  );
  flame.scale.set(0.7, 1.7, 0.7);
  flame.position.set(0, 0.27, 0.1);
  group.add(flame);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(warm ? "255,194,140" : "124,255,107"),
      color,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.position.set(0, 0.27, 0.12);
  glow.scale.set(0.55, 0.55, 1);
  group.add(glow);
  return { group, flame, glow };
}

function makeWallFrame(kind = "cute") {
  const group = new THREE.Group();
  const frameMat = mat(kind === "cute" ? 0xfff3f8 : 0x2a1a3a, { roughness: 0.7 });
  const frame = new THREE.Mesh(roundedBoxGeometry(0.62, 0.78, 0.05, 0.04), frameMat);
  group.add(frame);
  const artTex = canvasTexture(256, 320, (ctx, w, h) => {
    if (kind === "cute") {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#ffe3f0");
      g.addColorStop(1, "#e7d6ff");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        drawFlower(ctx, 40 + i * 45, 70 + (i % 2) * 34, 18, "rgba(255,255,255,0.85)", "#ffd66b");
      }
      ctx.fillStyle = "#ff7eb6";
      ctx.beginPath();
      ctx.moveTo(w / 2, 250);
      ctx.bezierCurveTo(w / 2 - 70, 200, w / 2 - 50, 140, w / 2, 178);
      ctx.bezierCurveTo(w / 2 + 50, 140, w / 2 + 70, 200, w / 2, 250);
      ctx.fill();
    } else {
      ctx.fillStyle = "#24122f";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#3a2045";
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, 80, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d8c7e4";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7cff6b";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0d22";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
        ctx.stroke();
      }
    }
  });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.68), new THREE.MeshBasicMaterial({ map: artTex }));
  art.position.z = 0.031;
  group.add(art);
  return group;
}

function makeAmbientMotes(count = 70, color = 0xffd9a8) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-3.6, 3.6);
    positions[i * 3 + 1] = rand(0.3, 3.4);
    positions[i * 3 + 2] = rand(-4.2, 4.8);
    speeds.push({ x: rand(-0.05, 0.05), y: rand(0.02, 0.12), z: rand(-0.04, 0.04), phase: Math.random() * 10 });
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const tex = makeGlowTexture("255,240,220");
  const material = new THREE.PointsMaterial({
    size: 0.035,
    map: tex,
    color,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    toneMapped: false,
  });
  const points = new THREE.Points(geo, material);
  let time = 0;
  return {
    points,
    update(dt) {
      time += dt;
      const attr = geo.attributes.position;
      for (let i = 0; i < count; i++) {
        const s = speeds[i];
        let x = attr.getX(i) + s.x * dt;
        let y = attr.getY(i) + s.y * dt;
        let z = attr.getZ(i) + s.z * dt;
        if (y > 3.6) y = 0.3;
        if (x > 3.8) x = -3.8;
        if (x < -3.8) x = 3.8;
        if (z > 5.2) z = -4.2;
        if (z < -4.2) z = 5.2;
        attr.setXYZ(i, x, y, z);
      }
      attr.needsUpdate = true;
      material.opacity = 0.4 + Math.sin(time * 0.7) * 0.12;
    },
    dispose() {
      geo.dispose();
      material.dispose();
      tex.dispose();
    },
  };
}

export function createHallway(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x150d20);
  scene.fog = new THREE.FogExp2(0x1a1026, 0.026);

  const state = {
    time: 0,
    busy: false,
    scaryPeeked: false,
    visitedScary: false,
    prettyOpened: false,
    scenario3Ready: false,
    hintShown: false,
    entered: false,
    disposed: false,
  };

  /* ---------------- lighting ---------------- */
  const hemi = new THREE.HemisphereLight(0xffe6f2, 0x2a173b, 1.25);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff1e6, 2.2);
  dir.position.set(2.5, 6.5, 4.5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -5;
  dir.shadow.camera.right = 5;
  dir.shadow.camera.top = 5;
  dir.shadow.camera.bottom = -3;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 18;
  dir.shadow.bias = -0.0006;
  scene.add(dir);

  /* ---------------- room ---------------- */
  const floorTex = makeFloorTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 11),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.78, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 1);
  floor.receiveShadow = true;
  scene.add(floor);

  const leftWallTex = makeScaryWallpaper();
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 3.7),
    new THREE.MeshStandardMaterial({ map: leftWallTex, roughness: 0.95 })
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-4, 1.85, 1);
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWallTex = makePrettyWallpaper();
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 3.7),
    new THREE.MeshStandardMaterial({ map: rightWallTex, roughness: 0.95 })
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(4, 1.85, 1);
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  const farWall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 3.7),
    new THREE.MeshStandardMaterial({ map: makeHallwayWallTexture(), roughness: 0.92 })
  );
  farWall.position.set(0, 1.85, -4.5);
  farWall.receiveShadow = true;
  scene.add(farWall);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 11),
    new THREE.MeshStandardMaterial({ color: 0x241533, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 3.7, 1);
  scene.add(ceiling);

  // beams
  for (const z of [-3.1, 0.2, 3.4]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(8, 0.16, 0.22), mat(0x3a2430, { roughness: 0.95 }));
    beam.position.set(0, 3.6, z);
    beam.castShadow = true;
    scene.add(beam);
  }

  // baseboards + crown molding
  for (const side of [-1, 1]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 11), mat(side < 0 ? 0x1a0e24 : 0xfff3f8, { roughness: 0.9 }));
    base.position.set(side * 3.95, 0.08, 1);
    scene.add(base);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 11), mat(side < 0 ? 0x2a173b : 0xffe0ec, { roughness: 0.9 }));
    crown.position.set(side * 3.95, 3.55, 1);
    scene.add(crown);
  }

  /* ---------------- carpets ---------------- */
  const darkCarpet = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 7.1),
    new THREE.MeshStandardMaterial({ map: makeTatteredCarpetTexture(), transparent: true, roughness: 0.95, alphaTest: 0.2 })
  );
  darkCarpet.rotation.x = -Math.PI / 2;
  darkCarpet.position.set(-1.55, 0.012, -0.2);
  darkCarpet.receiveShadow = true;
  scene.add(darkCarpet);

  const prettyCarpet = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 7.1),
    new THREE.MeshStandardMaterial({ map: makePrettyCarpetTexture(), transparent: true, roughness: 0.95, alphaTest: 0.2 })
  );
  prettyCarpet.rotation.x = -Math.PI / 2;
  prettyCarpet.position.set(1.55, 0.012, -0.2);
  prettyCarpet.receiveShadow = true;
  scene.add(prettyCarpet);

  // little entrance rug joining the two paths
  const entryTex = canvasTexture(512, 192, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff3f8";
    ctx.beginPath();
    ctx.roundRect?.(8, 8, w - 16, h - 16, 36);
    if (!ctx.roundRect) ctx.rect(8, 8, w - 16, h - 16);
    ctx.fill();
    for (let x = 24; x < w - 24; x += 48) {
      ctx.fillStyle = (x / 48) % 2 === 0 ? "#ff5c9e" : "#fff3f8";
      ctx.fillRect(x, 24, 48, h - 48);
    }
    ctx.strokeStyle = "#ffd66b";
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);
  });
  const entryRug = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 1.4),
    new THREE.MeshStandardMaterial({ map: entryTex, transparent: true, roughness: 0.95 })
  );
  entryRug.rotation.x = -Math.PI / 2;
  entryRug.position.set(0, 0.014, 3.45);
  entryRug.receiveShadow = true;
  scene.add(entryRug);

  /* ---------------- doors ---------------- */
  const scaryDoor = createScaryDoor();
  scaryDoor.group.position.set(-1.55, 0, -3.92);
  scene.add(scaryDoor.group);

  const prettyDoor = createPrettyDoor();
  prettyDoor.group.position.set(1.55, 0, -3.92);
  scene.add(prettyDoor.group);

  /* ---------------- wall decor ---------------- */
  const frameL = makeWallFrame("scary");
  frameL.position.set(-3.9, 2.1, -1.2);
  frameL.rotation.y = Math.PI / 2;
  frameL.rotation.z = 0.03;
  scene.add(frameL);
  const frameL2 = makeWallFrame("scary");
  frameL2.position.set(-3.9, 1.95, 2.2);
  frameL2.rotation.y = Math.PI / 2;
  frameL2.rotation.z = -0.025;
  scene.add(frameL2);
  const frameR = makeWallFrame("cute");
  frameR.position.set(3.9, 2.05, -1.1);
  frameR.rotation.y = -Math.PI / 2;
  scene.add(frameR);
  const frameR2 = makeWallFrame("cute");
  frameR2.position.set(3.9, 2.15, 2.3);
  frameR2.rotation.y = -Math.PI / 2;
  frameR2.rotation.z = 0.02;
  scene.add(frameR2);

  const sconceL = makeSconce(COLORS.scaryGreen, false);
  sconceL.group.position.set(-3.85, 1.7, 0.5);
  sconceL.group.rotation.y = Math.PI / 2;
  scene.add(sconceL.group);
  const sconceR = makeSconce(0xffb36b, true);
  sconceR.group.position.set(3.85, 1.7, 0.6);
  sconceR.group.rotation.y = -Math.PI / 2;
  scene.add(sconceR.group);

  // flower vine along right wall
  const vinePts = [];
  for (let i = 0; i < 8; i++) {
    vinePts.push(new THREE.Vector3(3.93, 0.7 + i * 0.35, -2.7 + Math.sin(i * 1.7) * 0.1));
  }
  // (kept subtle; flowers placed directly)
  const flowerColors = [0xff9ec9, 0xffd66b, 0xffb6d5, 0xc9a7ff];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    g.position.set(3.91, 0.75 + i * 0.33, -2.55 + Math.sin(i * 1.3) * 0.08);
    g.rotation.y = -Math.PI / 2;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(flowerColors[i % flowerColors.length]));
      petal.position.set(Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0);
      petal.scale.set(1.2, 0.8, 0.4);
      g.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat(0xffd66b));
    center.position.z = 0.02;
    g.add(center);
    scene.add(g);
  }

  /* ---------------- lanterns ---------------- */
  const lanternL = makeLantern(COLORS.scaryGreen, 0.55);
  lanternL.group.position.set(-2.55, 3.1, -1.4);
  scene.add(lanternL.group);
  const lightL = new THREE.PointLight(0x7cff6b, 0.7, 5.5, 2);
  lightL.position.set(-2.55, 2.7, -1.4);
  scene.add(lightL);

  const lanternR = makeLantern(0xffc2dd, 0.4);
  lanternR.group.position.set(2.55, 3.25, -0.6);
  scene.add(lanternR.group);
  const lightR = new THREE.PointLight(0xffc2dd, 0.8, 5.5, 2);
  lightR.position.set(2.55, 2.85, -0.6);
  scene.add(lightR);

  /* ---------------- floating stars / wisps ---------------- */
  const starTex = makeStarTexture();
  const starSprites = [];
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: starTex, color: 0xffe6a8, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
    );
    s.position.set(rand(2.2, 3.6), rand(1.2, 3.2), rand(-3.8, 2.8));
    s.scale.setScalar(rand(0.08, 0.16));
    s.userData.phase = Math.random() * 10;
    s.userData.baseY = s.position.y;
    scene.add(s);
    starSprites.push(s);
  }
  const wispTex = makeGlowTexture("124,255,107");
  const wisps = [];
  for (let i = 0; i < 7; i++) {
    const w = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: wispTex, color: 0x7cff6b, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
    );
    w.position.set(rand(-3.5, -2.0), rand(0.8, 2.6), rand(-3.6, 2.6));
    w.scale.setScalar(rand(0.18, 0.4));
    w.userData.phase = Math.random() * 10;
    w.userData.base = w.position.clone();
    scene.add(w);
    wisps.push(w);
  }

  const dust = makeSprayParticles("dust", { count: 20 });
  scene.add(dust.object3D);
  const sparkles = makeSprayParticles("sparkles", { count: 80 });
  scene.add(sparkles.object3D);
  const motes = makeAmbientMotes(80);
  scene.add(motes.points);

  /* ---------------- rabbit ---------------- */
  const rabbit = createRabbit();
  rabbit.group.position.set(0, 0, 2.0);
  rabbit.group.rotation.y = Math.PI;
  scene.add(rabbit.group);
  scene.add(rabbit.effects);
  const rabbitShadow = null;
  rabbit.interactive.userData.onTap = () => {
    rabbit.giggle();
  };

  /* ---------------- interactions ---------------- */
  const tmp = new THREE.Vector3();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function clearHint() {
    state.hintShown = false;
    prettyDoor.hideHint();
    ctx.hideHint();
  }

  function requestHint() {
    if (state.busy || state.disposed) return;
    if (state.scenario3Ready) {
      ctx.hint(CONFIG.texts.scenario3Hint);
      state.hintShown = true;
      return;
    }
    if (state.prettyOpened) return;
    state.hintShown = true;
    prettyDoor.showHint();
    ctx.hint(CONFIG.texts.hallwayHint);
  }

  async function goPretty() {
    if (state.busy || state.prettyOpened) return;
    state.busy = true;
    clearHint();
    ctx.hideHint();
    try {
      await rabbit.walk(new THREE.Vector3(1.45, 0, -2.25), 1.8);
      rabbit.lookAt(new THREE.Vector3(1.55, 1.3, -3.9));
      await rabbit.happy();
      await prettyDoor.open();
      state.prettyOpened = true;
      ctx.toast("Yallah lel party! 🎉", 1600);
      await wait(900);
      await ctx.transition("party");
    } finally {
      state.busy = false;
    }
  }

  async function goScenario3() {
    if (state.busy || state.disposed) return;
    state.busy = true;
    clearHint();
    ctx.hideHint();
    ctx.hideBack();
    try {
      scaryDoor.unlock();
      await rabbit.walk(new THREE.Vector3(-1.45, 0, -2.25), 1.8);
      rabbit.lookAt(new THREE.Vector3(-1.55, 1.2, -3.9));
      await scaryDoor.crack();
      ctx.sfx("creak");
      await wait(450);
      if (state.disposed) return;
      await ctx.transition("maze", { difficulty: CONFIG.maze.difficulty });
    } finally {
      state.busy = false;
    }
  }

  async function goScary() {
    if (state.busy || state.disposed) return;
    if (state.scenario3Ready) {
      await goScenario3();
      return;
    }
    if (state.visitedScary) {
      ctx.toast("El bab msakker… el bab el hlou yestanek 💗", 2400);
      prettyDoor.pulse();
      return;
    }
    if (!state.scaryPeeked) {
      state.busy = true;
      clearHint();
      try {
        await rabbit.walk(new THREE.Vector3(-1.45, 0, -2.25), 1.8);
        rabbit.lookAt(new THREE.Vector3(-1.55, 1.2, -3.9));
        scaryDoor.setEyesTarget(rabbit.group.position.clone().setY(1.0));
        await scaryDoor.shake();
        await scaryDoor.crack();
        await rabbit.scare();
        await ctx.say(CONFIG.texts.scaryFirst);
        await scaryDoor.slam();
        state.scaryPeeked = true;
        ctx.hint(CONFIG.texts.scaryPeekHint);
        prettyDoor.pulse();
      } finally {
        state.busy = false;
      }
      return;
    }
    state.busy = true;
    clearHint();
    try {
      await scaryDoor.crack();
      await wait(450);
      await ctx.transition("scary");
    } finally {
      state.busy = false;
    }
  }

  scaryDoor.onClick(goScary);
  prettyDoor.onClick(goPretty);

  /* ---------------- scene API ---------------- */
  async function onEnter(prev = null, meta = {}) {
    state.busy = false;
    state.hintShown = false;
    if (meta?.scenario3) {
      state.entered = true;
      state.prettyOpened = true;
      state.scenario3Ready = true;
      state.visitedScary = true;
      state.busy = true;
      scaryDoor.unlock();
      ctx.hideBack();
      ctx.hideHint();
      rabbit.setPosition(0, 0, 2.0);
      rabbit.group.rotation.y = Math.PI;
      rabbit.lookAt(new THREE.Vector3(-1.55, 1.2, -3.9));
      try {
        await wait(350);
        if (state.disposed) return;
        await ctx.say(CONFIG.texts.hallwayReturn);
        if (state.disposed) return;
        await rabbit.walk(new THREE.Vector3(-1.45, 0, -2.25), 1.8);
        if (state.disposed) return;
        rabbit.lookAt(new THREE.Vector3(-1.55, 1.2, -3.9));
        await scaryDoor.shake();
        if (state.disposed) return;
        ctx.hint(CONFIG.texts.scenario3Hint);
        state.hintShown = true;
      } finally {
        state.busy = false;
      }
      return;
    }
    if (!state.entered) {
      state.entered = true;
      rabbit.setPosition(0, 0, 2.0);
      rabbit.group.rotation.y = Math.PI;
      rabbit.lookAt(new THREE.Vector3(0, 1.2, -3.9));
      await wait(350);
      await ctx.say(CONFIG.texts.hallwayIntro);
      if (state.disposed) return;
      ctx.hint(CONFIG.texts.hallwayHint);
      state.hintShown = true;
      prettyDoor.pulse();
      prettyDoor.showHint();
      return;
    }
    if (prev === "scary") {
      state.visitedScary = true;
      state.scaryPeeked = true;
      scaryDoor.lockClosed();
      rabbit.setPosition(0.2, 0, 1.5);
      rabbit.group.rotation.y = Math.PI;
      rabbit.idle();
      prettyDoor.pulse();
      if (!state.prettyOpened) {
        ctx.hint(CONFIG.texts.hallwayHint);
        state.hintShown = true;
        prettyDoor.showHint();
      }
    } else {
      rabbit.setPosition(0, 0, 2.0);
      rabbit.group.rotation.y = Math.PI;
      if (!state.prettyOpened) {
        ctx.hint(CONFIG.texts.hallwayHint);
        state.hintShown = true;
        prettyDoor.showHint();
      }
    }
    rabbit.lookAt(new THREE.Vector3(0, 1.2, -3.9));
  }

  function lockScary() {
    state.visitedScary = true;
    state.scaryPeeked = true;
    scaryDoor.lockClosed();
    prettyDoor.pulse();
    requestHint();
  }

  function update(dt) {
    if (state.disposed) return;
    state.time += dt;
    const t = state.time;
    rabbit.update(dt);
    scaryDoor.update(dt);
    prettyDoor.update(dt);
    dust.update(dt);
    sparkles.update(dt);
    motes.update(dt);

    // eyes track the rabbit when not locked
    if (!scaryDoor.locked) {
      rabbit.group.getWorldPosition(tmp);
      tmp.y += 0.95;
      scaryDoor.setEyesTarget(tmp);
    } else {
      scaryDoor.setEyesTarget(null);
    }

    // lanterns sway
    lanternL.group.rotation.z = Math.sin(t * 0.7) * 0.05;
    lanternR.group.rotation.z = Math.sin(t * 0.9 + 1) * 0.04;
    lanternL.glow.material.opacity = 0.38 + Math.sin(t * 3.1) * 0.12;
    lanternR.glow.material.opacity = 0.4 + Math.sin(t * 2.3 + 1) * 0.1;
    lightL.intensity = 0.55 + Math.sin(t * 2.7) * 0.14;
    lightR.intensity = 0.7 + Math.sin(t * 2.1) * 0.1;
    sconceL.glow.material.opacity = 0.3 + Math.sin(t * 4.2) * 0.12;
    sconceR.glow.material.opacity = 0.35 + Math.sin(t * 3.4 + 1) * 0.1;

    // floating stars
    for (const s of starSprites) {
      s.position.y = s.userData.baseY + Math.sin(t * 0.8 + s.userData.phase) * 0.14;
      s.material.opacity = 0.55 + Math.sin(t * 2.2 + s.userData.phase) * 0.3;
      s.scale.setScalar(0.1 + Math.sin(t * 1.6 + s.userData.phase) * 0.025);
    }
    for (const w of wisps) {
      w.position.x = w.userData.base.x + Math.sin(t * 0.5 + w.userData.phase) * 0.2;
      w.position.y = w.userData.base.y + Math.sin(t * 0.7 + w.userData.phase) * 0.16;
      w.material.opacity = 0.18 + Math.sin(t * 1.8 + w.userData.phase) * 0.12;
    }

    // ambient particles
    if (Math.random() < dt * 2.2) {
      tmp.set(rand(-3.4, -1.8), rand(0.2, 2.8), rand(-3.4, 2.8));
      dust.burst(tmp, { count: 1 });
    }
    if (Math.random() < dt * 1.6) {
      tmp.set(rand(1.8, 3.6), rand(0.6, 3.2), rand(-3.4, 3.0));
      sparkles.burst(tmp, { count: 1, speed: 0.2, life: 1.8, spread: 0.5, colors: [0xffd66b, 0xffffff, 0xffb6d5] });
    }
  }

  function getCameraPose(aspect, t) {
    const portrait = aspect < 0.82;
    const advance = THREE.MathUtils.clamp(2.0 - rabbit.position.z, 0, 4.4);
    const baseZ = portrait ? 6.9 : 5.7;
    const z = baseZ - advance * 0.2;
    const x = rabbit.position.x * 0.28 + Math.sin(t * 0.35) * 0.04;
    const y = (portrait ? 2.65 : 2.42) + Math.sin(t * 0.55) * 0.025;
    const target = new THREE.Vector3(
      rabbit.position.x * 0.36,
      portrait ? 1.12 : 1.18,
      -1.5 - advance * 0.08
    );
    return { position: new THREE.Vector3(x, y, z), target, fov: portrait ? 66 : 55 };
  }

  function dispose() {
    state.disposed = true;
    rabbit.dispose();
    scaryDoor.dispose();
    prettyDoor.dispose();
    dust.dispose();
    sparkles.dispose();
    motes.dispose();
    disposeGroup(scene);
  }

  return {
    name: "hallway",
    scene,
    update,
    getCameraPose,
    onEnter,
    lockScary,
    requestHint,
    clearHint,
    interactives: [scaryDoor.hit, prettyDoor.hit, rabbit.interactive],
    get busy() {
      return state.busy;
    },
    get prettyOpened() {
      return state.prettyOpened;
    },
    get visitedScary() {
      return state.visitedScary;
    },
    dispose,
  };
}
