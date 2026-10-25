import * as THREE from "three";
import gsap from "gsap";
import {
  COLORS,
  PASTELS,
  mat,
  basicMat,
  emissiveMat,
  canvasTexture,
  makeCanvasTextTexture,
  makeHeartShape,
  makeStarShape,
  makeGlowTexture,
  makeSprayParticles,
  makeLabelSprite,
  roundedBoxGeometry,
  tubeFromPoints,
  disposeGroup,
  roundRect,
  rand,
  pick,
} from "./props.js";

/* ------------------------------------------------------------------ */
/* cake table                                                         */
/* ------------------------------------------------------------------ */

export function createCakeTable() {
  const group = new THREE.Group();
  const white = mat(0xfffdfb, { roughness: 0.65 });
  const cream = mat(0xfff3e4, { roughness: 0.8 });
  const gold = mat(COLORS.gold, { roughness: 0.32, metalness: 0.35 });
  const pink = mat(0xffb6d5, { roughness: 0.7 });

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.07, 48), white);
  top.position.y = 0.76;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  const clothTop = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.025, 48), cream);
  clothTop.position.y = 0.8;
  clothTop.receiveShadow = true;
  group.add(clothTop);

  const skirtPts = [
    new THREE.Vector2(0.96, 0.8),
    new THREE.Vector2(1.0, 0.72),
    new THREE.Vector2(1.035, 0.6),
    new THREE.Vector2(1.0, 0.55),
  ];
  const skirt = new THREE.Mesh(
    new THREE.LatheGeometry(skirtPts, 48),
    new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 0.9, side: THREE.DoubleSide })
  );
  skirt.castShadow = true;
  group.add(skirt);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const scallop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), cream);
    scallop.position.set(Math.cos(a) * 1.015, 0.56, Math.sin(a) * 1.015);
    scallop.scale.set(1.25, 0.45, 1);
    group.add(scallop);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), pink);
    dot.position.set(Math.cos(a) * 1.0, 0.66, Math.sin(a) * 1.0);
    dot.scale.z = 0.4;
    group.add(dot);
  }

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.66, 24), white);
  pedestal.position.y = 0.38;
  pedestal.castShadow = true;
  group.add(pedestal);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.08, 32), white);
  base.position.y = 0.04;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  const baseTrim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.018, 8, 32), gold);
  baseTrim.rotation.x = Math.PI / 2;
  baseTrim.position.y = 0.08;
  group.add(baseTrim);

  // ribbon around the table edge
  const ribbon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.97, 0.97, 0.055, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xff5c9e, roughness: 0.55, side: THREE.DoubleSide })
  );
  ribbon.position.y = 0.79;
  group.add(ribbon);
  for (const side of [-1, 1]) {
    const bowLoop = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 6, 12), pink);
    bowLoop.position.set(side * 0.05, 0.79, 0.96);
    bowLoop.rotation.z = side * 0.5;
    group.add(bowLoop);
  }

  return { group, topY: 0.815 };
}

/* ------------------------------------------------------------------ */
/* balloons                                                           */
/* ------------------------------------------------------------------ */

export function createBalloons() {
  const group = new THREE.Group();
  const colors = [0xffb6d5, 0xc9a7ff, 0xa8f0d1, 0xffd1a8, 0xa8d8ff, 0xff9ec9, 0xffd66b];
  const positions = [
    [-2.9, 2.45, -1.3],
    [-2.5, 2.05, 1.2],
    [-3.2, 2.75, 0.1],
    [2.9, 2.35, -1.5],
    [2.5, 2.05, 1.1],
    [3.2, 2.65, 0.2],
    [-1.85, 2.85, -2.5],
    [1.9, 2.95, -2.6],
    [-2.1, 1.95, 2.5],
    [2.25, 2.15, 2.6],
    [-3.35, 2.25, -2.1],
    [3.35, 2.45, -2.3],
  ];
  const balloons = [];
  const bodyGeo = new THREE.SphereGeometry(0.17, 24, 18);
  const knotGeo = new THREE.ConeGeometry(0.03, 0.055, 8);
  const highlightGeo = new THREE.SphereGeometry(0.035, 10, 8);
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });

  positions.forEach(([x, y, z], i) => {
    const color = colors[i % colors.length];
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1, 1.24, 0.92);
    body.castShadow = true;
    g.add(body);
    const knot = new THREE.Mesh(knotGeo, mat(color, { roughness: 0.5 }));
    knot.position.y = -0.225;
    knot.rotation.z = Math.PI;
    g.add(knot);
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.position.set(-0.06, 0.08, 0.13);
    highlight.scale.set(1, 1.6, 0.5);
    g.add(highlight);
    const stringPts = [
      new THREE.Vector3(0, -0.25, 0),
      new THREE.Vector3(0.03, -0.5, 0.01),
      new THREE.Vector3(-0.02, -0.78, 0),
      new THREE.Vector3(0.01, -1.02, 0.01),
    ];
    const string = new THREE.Mesh(tubeFromPoints(stringPts, 0.004, 20, 4), mat(0xd9c8d0, { roughness: 0.9 }));
    g.add(string);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 10, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hit.position.y = 0.03;
    hit.userData.type = "balloon";
    hit.userData.balloonIndex = i;
    g.add(hit);

    group.add(g);
    balloons.push({
      group: g,
      hit,
      base: new THREE.Vector3(x, y, z),
      phase: Math.random() * Math.PI * 2,
      speed: 0.55 + Math.random() * 0.35,
      popped: false,
      index: i,
    });
  });

  const confetti = makeSprayParticles("confetti", { count: 100 });
  group.add(confetti.object3D);
  let time = 0;
  const riseState = { value: 0 };

  function rise(amount = 0.22, duration = 2.2) {
    return new Promise((resolve) => {
      gsap.to(riseState, { value: amount, duration, ease: "sine.inOut", onComplete: resolve });
    });
  }

  function pop(i) {
    const b = balloons[i];
    if (!b || b.popped) return Promise.resolve();
    b.popped = true;
    const p = new THREE.Vector3();
    b.group.getWorldPosition(p);
    p.y += 0.1;
    confetti.burst(p, { count: 28, speed: 2.4, upward: 2.2, spread: 0.2, life: 1.6, colors: [0xffb6d5, 0xffd66b, 0xa8d8ff, 0xa8f0d1, 0xc9a7ff] });
    b.group.visible = false;
    return Promise.resolve();
  }

  function update(dt) {
    time += dt;
    for (const b of balloons) {
      if (b.popped) continue;
      b.group.position.x = b.base.x + Math.sin(time * b.speed + b.phase) * 0.11;
      b.group.position.y = b.base.y + riseState.value + Math.sin(time * b.speed * 0.8 + b.phase * 1.7) * 0.08;
      b.group.position.z = b.base.z + Math.cos(time * b.speed * 0.6 + b.phase) * 0.06;
      b.group.rotation.z = Math.sin(time * b.speed + b.phase) * 0.09;
      b.group.rotation.x = Math.cos(time * b.speed * 0.7 + b.phase) * 0.04;
    }
    confetti.update(dt);
  }

  function dispose() {
    confetti.dispose();
    disposeGroup(group);
  }

  return {
    group,
    update,
    pop,
    rise,
    interactives: balloons.map((b) => b.hit),
    balloons,
    dispose,
    get poppedCount() {
      return balloons.filter((b) => b.popped).length;
    },
  };
}

/* ------------------------------------------------------------------ */
/* gifts                                                              */
/* ------------------------------------------------------------------ */

export function createGifts(notes = []) {
  const group = new THREE.Group();
  const definitions = [
    { pos: [-2.6, 0, -1.8], size: 0.46, colors: [0xffb6d5, 0xff5c9e], rot: 0.2 },
    { pos: [2.5, 0, -1.6], size: 0.4, colors: [0xc9a7ff, 0xffd66b], rot: -0.3 },
    { pos: [-2.95, 0, -0.35], size: 0.36, colors: [0xa8f0d1, 0xfff3e4], rot: 0.45 },
    { pos: [2.9, 0, 0.2], size: 0.44, colors: [0xa8d8ff, 0xff9ec9], rot: -0.15 },
    { pos: [-1.75, 0, -2.8], size: 0.34, colors: [0xffd1a8, 0xc9a7ff], rot: 0.8 },
  ];
  const gifts = [];
  const sparkles = makeSprayParticles("sparkles", { count: 120 });
  group.add(sparkles.object3D);

  definitions.forEach((def, i) => {
    const g = new THREE.Group();
    g.position.set(def.pos[0], 0, def.pos[2]);
    g.rotation.y = def.rot;
    const s = def.size;
    const boxMat = mat(def.colors[0], { roughness: 0.55 });
    const ribbonMat = mat(def.colors[1], { roughness: 0.4 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.8, s * 0.8), boxMat);
    box.position.y = s * 0.4;
    box.castShadow = true;
    box.receiveShadow = true;
    g.add(box);
    const lid = new THREE.Group();
    lid.position.y = s * 0.8;
    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.08, s * 0.16, s * 0.88), boxMat);
    lidMesh.castShadow = true;
    lid.add(lidMesh);
    const lidRibbon = new THREE.Mesh(new THREE.BoxGeometry(s * 0.16, s * 0.17, s * 0.9), ribbonMat);
    lidRibbon.position.y = 0.001;
    lid.add(lidRibbon);
    const lidRibbon2 = new THREE.Mesh(new THREE.BoxGeometry(s * 1.09, s * 0.17, s * 0.15), ribbonMat);
    lidRibbon2.position.y = 0.002;
    lid.add(lidRibbon2);
    for (const side of [-1, 1]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(s * 0.1, s * 0.026, 6, 12), ribbonMat);
      loop.position.set(side * s * 0.09, s * 0.16, 0);
      loop.rotation.z = side * 0.55;
      loop.scale.y = 0.8;
      lid.add(loop);
    }
    g.add(lid);

    // vertical ribbons on box
    for (const [w, d] of [
      [s * 0.15, s * 0.82],
      [s * 0.82, s * 0.15],
    ]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(w, s * 0.8, d), ribbonMat);
      r.position.y = s * 0.4;
      g.add(r);
    }

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(s * 1.25, s * 1.1, s * 1.1),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hit.position.y = s * 0.5;
    hit.userData.type = "gift";
    hit.userData.giftIndex = i;
    g.add(hit);

    const note = makeLabelSprite(notes[i] || "Kol 3am w nti 7abiba 💗", {
      width: 512,
      height: 240,
      font: "600 58px Caveat, cursive",
      scale: 0.6,
      bg: "rgba(255,248,251,0.98)",
      border: "#ff7eb6",
      color: "#8a3e63",
    });
    note.position.set(0, s * 1.5, 0);
    note.visible = false;
    note.scale.setScalar(0.001);
    g.add(note);

    group.add(g);
    gifts.push({ group: g, lid, hit, note, opened: false, index: i, baseY: 0 });
  });

  function open(i) {
    const gift = gifts[i];
    if (!gift || gift.opened) return Promise.resolve();
    gift.opened = true;
    const p = new THREE.Vector3();
    gift.group.getWorldPosition(p);
    p.y += 0.4;
    sparkles.burst(p, { count: 20, speed: 1.2, life: 1.1, spread: 0.4, colors: [0xffd66b, 0xffb6d5, 0xffffff, 0xc9a7ff] });
    gsap.to(gift.lid.position, { y: 0.8, duration: 0.35, ease: "back.out(2)" });
    gsap.to(gift.lid.rotation, { x: -0.35, z: 0.18, duration: 0.35, ease: "back.out(2)" });
    gift.note.visible = true;
    gsap.to(gift.note.scale, { x: 0.6, y: 0.28, z: 0.6, duration: 0.45, ease: "back.out(2.2)" });
    gsap.to(gift.note.position, { y: 1.15, duration: 0.5, ease: "back.out(2)" });
    return Promise.resolve();
  }

  function update(dt) {
    sparkles.update(dt);
    const t = performance.now() * 0.001;
    gifts.forEach((gift, i) => {
      if (gift.opened) {
        gift.note.position.y = 1.15 + Math.sin(t * 1.8 + i) * 0.035;
      }
    });
  }

  function dispose() {
    gifts.forEach((g) => {
      gsap.killTweensOf(g.lid.position);
      gsap.killTweensOf(g.lid.rotation);
      gsap.killTweensOf(g.note.scale);
      gsap.killTweensOf(g.note.position);
    });
    sparkles.dispose();
    disposeGroup(group);
  }

  return {
    group,
    update,
    open,
    interactives: gifts.map((g) => g.hit),
    gifts,
    dispose,
    get allOpened() {
      return gifts.every((g) => g.opened);
    },
  };
}

/* ------------------------------------------------------------------ */
/* fox plush                                                          */
/* ------------------------------------------------------------------ */

export function createFox() {
  const group = new THREE.Group();
  const orange = mat(0xf59e5b, { roughness: 0.9 });
  const orangeDark = mat(0xd9793c, { roughness: 0.9 });
  const cream = mat(0xfff2e0, { roughness: 0.95 });
  const dark = mat(0x3b241d, { roughness: 0.7 });
  const pink = mat(0xff9ec9, { roughness: 0.8 });

  // cushion
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.11, 24), pink);
  cushion.position.y = 0.055;
  cushion.receiveShadow = true;
  group.add(cushion);
  const cushionTop = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 24), mat(0xffc2dd));
  cushionTop.rotation.x = Math.PI / 2;
  cushionTop.position.y = 0.11;
  group.add(cushionTop);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 18), orange);
  body.position.y = 0.33;
  body.scale.set(1, 1.1, 0.9);
  body.castShadow = true;
  group.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), cream);
  belly.position.set(0, 0.3, 0.12);
  belly.scale.set(1, 1.1, 0.55);
  group.add(belly);

  const head = new THREE.Group();
  head.position.y = 0.63;
  group.add(head);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), orange);
  headMesh.scale.set(1.05, 0.95, 0.95);
  headMesh.castShadow = true;
  head.add(headMesh);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), cream);
  muzzle.position.set(0, -0.035, 0.145);
  muzzle.scale.set(1.1, 0.8, 0.8);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), dark);
  nose.position.set(0, 0.005, 0.235);
  nose.scale.set(1.2, 0.9, 0.8);
  head.add(nose);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), dark);
    eye.position.set(side * 0.075, 0.045, 0.17);
    eye.scale.set(1, 1.15, 0.7);
    head.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 5), basicMat(0xffffff));
    shine.position.set(side * 0.085, 0.06, 0.19);
    head.add(shine);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), cream);
    cheek.position.set(side * 0.145, -0.045, 0.1);
    cheek.scale.set(1.2, 0.7, 0.6);
    head.add(cheek);
    // white fluff cones
    for (let f = 0; f < 3; f++) {
      const fluff = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.09, 5), cream);
      fluff.position.set(side * (0.18 + f * 0.012), -0.035 + f * 0.03, 0.07 - f * 0.012);
      fluff.rotation.z = side * (Math.PI / 2 - 0.2 + f * 0.2);
      head.add(fluff);
    }
    // ears
    const ear = new THREE.Group();
    ear.position.set(side * 0.12, 0.15, -0.01);
    ear.rotation.z = side * -0.22;
    const earMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.19, 6), orangeDark);
    earMesh.position.y = 0.07;
    ear.add(earMesh);
    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 6), pink);
    earInner.position.set(0, 0.06, 0.025);
    ear.add(earInner);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.06, 6), dark);
    tip.position.y = 0.16;
    ear.add(tip);
    head.add(ear);
  }

  // legs + paws
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.1, 4, 8), orange);
    leg.position.set(side * 0.11, 0.12, 0.14);
    leg.rotation.x = 0.8;
    group.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), cream);
    paw.position.set(side * 0.11, 0.07, 0.24);
    paw.scale.set(1, 0.7, 1.2);
    group.add(paw);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.12, 4, 8), orange);
    arm.position.set(side * 0.21, 0.36, 0.08);
    arm.rotation.z = side * 0.5;
    group.add(arm);
  }

  // tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.3, -0.19);
  tail.rotation.x = -0.5;
  const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 12), orange);
  tailMesh.position.y = -0.18;
  tailMesh.rotation.x = Math.PI;
  tail.add(tailMesh);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), cream);
  tailTip.position.y = -0.38;
  tailTip.scale.set(0.9, 1.2, 0.9);
  tail.add(tailTip);
  group.add(tail);

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 1.0, 0.55),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  hit.position.y = 0.48;
  hit.userData.type = "fox";
  group.add(hit);

  const hearts = makeSprayParticles("hearts", { count: 16 });
  group.add(hearts.object3D);
  let time = 0;
  let jumping = false;

  function jump() {
    if (jumping) return Promise.resolve();
    jumping = true;
    const tl = gsap.timeline();
    tl.to(group.scale, { x: 1.08, y: 0.9, z: 1.08, duration: 0.09, ease: "power2.out" })
      .to(group.position, { y: 0.26, duration: 0.24, ease: "power2.out" }, 0.06)
      .to(group.scale, { x: 0.94, y: 1.08, z: 0.94, duration: 0.12 }, 0.08)
      .to(group.position, { y: 0, duration: 0.22, ease: "power2.in" }, 0.32)
      .to(group.scale, { x: 1.06, y: 0.92, z: 1.06, duration: 0.08 }, 0.5)
      .to(group.scale, { x: 1, y: 1, z: 1, duration: 0.25, ease: "elastic.out(1,0.5)" }, 0.58);
    const p = new THREE.Vector3();
    group.getWorldPosition(p);
    p.y += 0.8;
    hearts.burst(p, { count: 5 });
    return new Promise((resolve) => tl.eventCallback("onComplete", () => {
      jumping = false;
      resolve();
    }));
  }

  function update(dt) {
    time += dt;
    if (!jumping) {
      group.scale.y = 1 + Math.sin(time * 2.3) * 0.012;
      group.scale.x = 1 - Math.sin(time * 2.3) * 0.006;
    }
    tail.rotation.z = Math.sin(time * 2.6) * 0.22;
    head.rotation.z = Math.sin(time * 0.9) * 0.035;
    head.rotation.y = Math.sin(time * 0.6) * 0.08;
    hearts.update(dt);
  }

  function dispose() {
    gsap.killTweensOf(group.position);
    gsap.killTweensOf(group.scale);
    hearts.dispose();
    disposeGroup(group);
  }

  return { group, update, jump, hit, interactives: [hit], dispose };
}

/* ------------------------------------------------------------------ */
/* armchair + plushies                                                */
/* ------------------------------------------------------------------ */

export function createArmchair() {
  const group = new THREE.Group();
  const pink = mat(0xff9ec9, { roughness: 0.9 });
  const pinkLight = mat(0xffc2dd, { roughness: 0.9 });
  const gold = mat(COLORS.gold, { roughness: 0.35, metalness: 0.3 });
  const seat = new THREE.Mesh(roundedBoxGeometry(1.15, 0.34, 0.9, 0.14), pink);
  seat.position.y = 0.4;
  seat.castShadow = true;
  group.add(seat);
  const back = new THREE.Mesh(roundedBoxGeometry(1.1, 1.0, 0.28, 0.14), pink);
  back.position.set(0, 0.85, -0.32);
  back.rotation.x = -0.08;
  back.castShadow = true;
  group.add(back);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(roundedBoxGeometry(0.28, 0.55, 0.95, 0.13), pink);
    arm.position.set(side * 0.65, 0.52, 0);
    arm.castShadow = true;
    group.add(arm);
    const armTop = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), pinkLight);
    armTop.position.set(side * 0.65, 0.77, 0.12);
    armTop.scale.set(1, 0.55, 1.2);
    group.add(armTop);
    for (const z of [-0.32, 0.32]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.18, 8), gold);
      leg.position.set(side * 0.52, 0.13, z);
      group.add(leg);
    }
  }
  const cushion = new THREE.Mesh(roundedBoxGeometry(0.78, 0.14, 0.66, 0.1), pinkLight);
  cushion.position.set(0, 0.6, 0.06);
  group.add(cushion);

  // heart throw pillow
  const pillow = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeHeartShape(0.34, 0.3), {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.03,
      bevelThickness: 0.02,
      curveSegments: 16,
    }),
    mat(0xff5c9e, { roughness: 0.9 })
  );
  pillow.position.set(0.18, 0.78, -0.18);
  pillow.rotation.z = -0.18;
  pillow.rotation.x = -0.2;
  group.add(pillow);

  return group;
}

export function createPlushStack() {
  const group = new THREE.Group();
  const brown = mat(0xb9855b, { roughness: 0.95 });
  const brownLight = mat(0xd9a77a, { roughness: 0.95 });
  const cream = mat(0xfff2e0, { roughness: 1 });
  const black = basicMat(0x35241c);

  // bear
  const bear = new THREE.Group();
  bear.position.set(-0.22, 0.68, 0.06);
  const bearBody = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), brown);
  bearBody.position.y = 0.12;
  bear.add(bearBody);
  const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), brown);
  bearHead.position.y = 0.28;
  bear.add(bearHead);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), cream);
  muzzle.position.set(0, 0.26, 0.09);
  bear.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), black);
  nose.position.set(0, 0.275, 0.13);
  bear.add(nose);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 5), black);
    eye.position.set(side * 0.04, 0.31, 0.09);
    bear.add(eye);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), brownLight);
    ear.position.set(side * 0.085, 0.36, 0);
    bear.add(ear);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), brown);
    arm.position.set(side * 0.12, 0.13, 0.02);
    bear.add(arm);
  }
  bear.rotation.z = 0.12;
  group.add(bear);

  // cloud
  const cloud = new THREE.Group();
  cloud.position.set(0.24, 0.72, -0.02);
  for (const [x, y, s] of [
    [0, 0, 0.09],
    [0.09, 0.02, 0.07],
    [-0.09, 0.01, 0.065],
    [0.03, 0.06, 0.07],
  ]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), cream);
    puff.position.set(x, y, 0);
    cloud.add(puff);
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.01, 5, 4), black);
    eye.position.set(side * 0.03, 0.015, 0.075);
    cloud.add(eye);
  }
  group.add(cloud);

  // heart cushion
  const heart = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeHeartShape(0.25, 0.22), {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      curveSegments: 14,
    }),
    mat(0xffb6d5, { roughness: 0.9 })
  );
  heart.position.set(0.02, 0.68, 0.18);
  heart.rotation.x = -1.1;
  group.add(heart);

  return group;
}

/* ------------------------------------------------------------------ */
/* bunny mirror                                                       */
/* ------------------------------------------------------------------ */

export function createBunnyMirror() {
  const group = new THREE.Group();
  const gold = mat(COLORS.gold, { roughness: 0.25, metalness: 0.45 });
  const pink = mat(0xffc2dd, { roughness: 0.6 });
  const reflection = canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#dff1ff");
    g.addColorStop(0.5, "#ffe8f3");
    g.addColorStop(1, "#e7d6ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(rand(60, w - 60), rand(60, h - 60), rand(40, 100), rand(14, 30), rand(-0.5, 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.random() * 0.6})`;
      ctx.beginPath();
      ctx.arc(rand(0, w), rand(0, h), rand(1, 3), 0, Math.PI * 2);
      ctx.fill();
    }
    const sheen = ctx.createLinearGradient(0, 0, w, h);
    sheen.addColorStop(0, "rgba(255,255,255,0.45)");
    sheen.addColorStop(0.4, "rgba(255,255,255,0)");
    sheen.addColorStop(0.7, "rgba(255,255,255,0.2)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
  });
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.47, 40),
    new THREE.MeshBasicMaterial({ map: reflection, toneMapped: false })
  );
  glass.position.z = 0.015;
  group.add(glass);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.035, 10, 48), gold);
  group.add(frame);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.455, 0.012, 8, 40), pink);
  innerRing.position.z = 0.02;
  group.add(innerRing);
  for (const side of [-1, 1]) {
    const earFrame = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.032, 8, 30), gold);
    earFrame.position.set(side * 0.22, 0.62, 0);
    earFrame.scale.set(0.5, 1.25, 1);
    earFrame.rotation.z = side * -0.18;
    group.add(earFrame);
    const earInner = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.014, 6, 24), pink);
    earInner.position.set(side * 0.22, 0.62, 0.02);
    earInner.scale.set(0.46, 1.2, 1);
    earInner.rotation.z = side * -0.18;
    group.add(earInner);
  }
  for (let i = 0; i < 5; i++) {
    const star = new THREE.Mesh(
      new THREE.ExtrudeGeometry(makeStarShape(0.035, 0.015), { depth: 0.01, bevelEnabled: false }),
      gold
    );
    const a = (i / 5) * Math.PI * 2 + 0.4;
    star.position.set(Math.cos(a) * 0.57, Math.sin(a) * 0.57, 0.03);
    group.add(star);
  }
  const hit = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 16),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  hit.position.set(0, 0.25, 0.06);
  hit.userData.type = "mirror";
  group.add(hit);
  const sparkles = makeSprayParticles("sparkles", { count: 80 });
  group.add(sparkles.object3D);
  return {
    group,
    hit,
    interactives: [hit],
    sparkle(pos) {
      sparkles.burst(pos, { count: 26, speed: 1.2, life: 1.2, spread: 0.5, colors: [0xffd66b, 0xffffff, 0xffb6d5] });
    },
    update(dt) {
      sparkles.update(dt);
    },
    dispose() {
      sparkles.dispose();
      disposeGroup(group);
    },
  };
}

/* ------------------------------------------------------------------ */
/* vases                                                              */
/* ------------------------------------------------------------------ */

export function createVase(petalColors = [0xff9ec9, 0xffd66b, 0xc9a7ff]) {
  const group = new THREE.Group();
  const potMat = mat(0xfff3f8, { roughness: 0.5 });
  const pts = [
    new THREE.Vector2(0.06, 0),
    new THREE.Vector2(0.11, 0.02),
    new THREE.Vector2(0.13, 0.12),
    new THREE.Vector2(0.1, 0.26),
    new THREE.Vector2(0.07, 0.32),
    new THREE.Vector2(0.09, 0.34),
  ];
  const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), potMat);
  vase.castShadow = true;
  group.add(vase);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 18), mat(0xffd66b));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.34;
  group.add(rim);
  const stemMat = mat(0x5c9b73);
  const flowerHeads = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const h = 0.45 + (i % 3) * 0.1;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, h, 4), stemMat);
    stem.position.set(Math.cos(a) * 0.05, 0.32 + h / 2, Math.sin(a) * 0.05);
    stem.rotation.z = Math.cos(a) * 0.18;
    stem.rotation.x = Math.sin(a) * 0.18;
    group.add(stem);
    const head = new THREE.Group();
    head.position.set(Math.cos(a) * 0.09, 0.34 + h, Math.sin(a) * 0.09);
    const color = petalColors[i % petalColors.length];
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(color, { roughness: 0.8 }));
      petal.position.set(Math.cos(pa) * 0.035, Math.sin(pa) * 0.035, 0);
      petal.scale.set(1.3, 0.8, 0.5);
      head.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat(0xffd66b));
    center.position.z = 0.015;
    head.add(center);
    head.rotation.y = a;
    group.add(head);
    flowerHeads.push(head);
  }
  let time = 0;
  return {
    group,
    update(dt) {
      time += dt;
      flowerHeads.forEach((h, i) => {
        h.rotation.z = Math.sin(time * 0.9 + i) * 0.05;
      });
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

/* ------------------------------------------------------------------ */
/* shelf with books + snow globe                                      */
/* ------------------------------------------------------------------ */

export function createShelf() {
  const group = new THREE.Group();
  const wood = mat(0xc79a76, { roughness: 0.8 });
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.32), wood);
  shelf.castShadow = true;
  group.add(shelf);
  for (const side of [-1, 1]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.26), wood);
    bracket.position.set(side * 0.66, -0.17, -0.02);
    group.add(bracket);
  }
  const bookColors = [0xff9ec9, 0xa8d8ff, 0xffd66b, 0xa8f0d1, 0xc9a7ff, 0xffb6d5];
  for (let i = 0; i < 7; i++) {
    const w = 0.07 + (i % 3) * 0.015;
    const h = 0.24 + (i % 4) * 0.035;
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.18),
      mat(bookColors[i % bookColors.length], { roughness: 0.7 })
    );
    book.position.set(-0.6 + i * 0.09, 0.035 + h / 2, 0);
    if (i === 6) book.rotation.z = 0.28;
    book.castShadow = true;
    group.add(book);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, h * 0.92, 0.02), mat(0xfff8ee));
    pages.position.set(book.position.x, book.position.y, 0.1);
    group.add(pages);
  }
  // snow globe
  const globe = new THREE.Group();
  globe.position.set(0.5, 0.06, 0);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.07, 16), mat(0xc9a7ff, { roughness: 0.5 }));
  base.position.y = 0.035;
  globe.add(base);
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    new THREE.MeshPhysicalMaterial({ color: 0xdff1ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1 })
  );
  glass.position.y = 0.2;
  globe.add(glass);
  const snowman = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(0xfff8ee));
  snowman.position.y = 0.17;
  globe.add(snowman);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 8), mat(0xff5c9e));
  hat.position.y = 0.22;
  globe.add(hat);
  const snowGeo = new THREE.BufferGeometry();
  const snowPos = new Float32Array(18 * 3);
  for (let i = 0; i < 18; i++) {
    snowPos[i * 3] = rand(-0.09, 0.09);
    snowPos[i * 3 + 1] = rand(0.1, 0.28);
    snowPos[i * 3 + 2] = rand(-0.09, 0.09);
  }
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.014, transparent: true, opacity: 0.9, depthWrite: false })
  );
  globe.add(snow);
  group.add(globe);

  return { group };
}

/* ------------------------------------------------------------------ */
/* "one more year" star mobile                                        */
/* ------------------------------------------------------------------ */

export function createStarMobile() {
  const group = new THREE.Group();
  const gold = mat(COLORS.gold, { roughness: 0.3, metalness: 0.35 });
  const pink = mat(0xffb6d5, { roughness: 0.6 });
  const stringMat = mat(0xd9c8d0, { roughness: 0.9 });
  const center = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeStarShape(0.22, 0.095), { depth: 0.04, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.01, bevelThickness: 0.01 }),
    gold
  );
  group.add(center);
  const labelTex = makeCanvasTextTexture("1 more year", {
    width: 512,
    height: 180,
    font: "700 78px Caveat, cursive",
    color: "#e75a9a",
    stroke: "#fff8fb",
    strokeWidth: 10,
    shadow: false,
  });
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.22),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.DoubleSide })
  );
  label.position.set(0, -0.12, 0.05);
  group.add(label);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const star = new THREE.Mesh(
      new THREE.ExtrudeGeometry(makeStarShape(0.09, 0.04), { depth: 0.02, bevelEnabled: false }),
      i % 2 ? pink : gold
    );
    star.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.18, Math.sin(a) * 0.15);
    star.rotation.z = a;
    group.add(star);
    stars.push(star);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.5, 3), stringMat);
    str.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.09, Math.sin(a) * 0.075);
    str.rotation.z = Math.PI / 2 - a;
    group.add(str);
  }
  const topString = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.1, 3), stringMat);
  topString.position.y = 0.58;
  group.add(topString);
  let time = 0;
  return {
    group,
    update(dt) {
      time += dt;
      group.rotation.y = Math.sin(time * 0.4) * 0.35;
      stars.forEach((s, i) => {
        s.rotation.z += Math.sin(time * 0.6 + i) * 0.002;
      });
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

/* ------------------------------------------------------------------ */
/* fairy light garland                                                */
/* ------------------------------------------------------------------ */

export function createFairyLights(points, bulbCount = 22, colors = [0xff9ec9, 0xffd66b, 0xa8d8ff, 0xc9a7ff]) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points);
  const wire = new THREE.Mesh(tubeFromPoints(points, 0.006, 90, 4), mat(0x9d8ca9, { roughness: 0.9 }));
  group.add(wire);
  const mats = [];
  const bulbGeo = new THREE.SphereGeometry(0.026, 8, 6);
  for (let i = 0; i < bulbCount; i++) {
    const p = curve.getPoint(i / (bulbCount - 1));
    const color = colors[i % colors.length];
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.5,
      roughness: 0.4,
    });
    const bulb = new THREE.Mesh(bulbGeo, m);
    bulb.position.copy(p);
    group.add(bulb);
    mats.push(m);
  }
  let time = 0;
  return {
    group,
    update(dt) {
      time += dt;
      for (let i = 0; i < mats.length; i++) {
        mats[i].emissiveIntensity = 1.05 + Math.sin(time * 2.2 + i * 0.7) * 0.5;
      }
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

/* ------------------------------------------------------------------ */
/* arched starry window                                               */
/* ------------------------------------------------------------------ */

export function createPartyWindow() {
  const group = new THREE.Group();
  const tex = canvasTexture(640, 820, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const pad = 26;
    const archTop = 260;
    const radius = (w - pad * 2) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(pad, archTop);
    ctx.arc(w / 2, archTop, radius, Math.PI, 0, false);
    ctx.lineTo(w - pad, h - pad);
    ctx.closePath();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#17103a");
    g.addColorStop(0.55, "#2c1b58");
    g.addColorStop(1, "#6b3a78");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 190; i++) {
      const x = rand(pad, w - pad);
      const y = rand(0, h - pad);
      const r = rand(0.6, 2.3);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.65})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const mx = w * 0.7;
    const my = h * 0.24;
    const halo = ctx.createRadialGradient(mx, my, 10, mx, my, 150);
    halo.addColorStop(0, "rgba(255,244,200,0.4)");
    halo.addColorStop(1, "rgba(255,244,200,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(mx - 160, my - 160, 320, 320);
    ctx.fillStyle = "#fff2c4";
    ctx.beginPath();
    ctx.arc(mx, my, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2c1b58";
    ctx.beginPath();
    ctx.arc(mx - 26, my - 14, 56, 0, Math.PI * 2);
    ctx.fill();
    // soft clouds
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.beginPath();
      ctx.ellipse(rand(pad, w - pad), rand(h * 0.55, h * 0.85), rand(50, 100), rand(14, 30), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // frame
    ctx.lineWidth = 24;
    ctx.strokeStyle = "#fffdfb";
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(pad, archTop);
    ctx.arc(w / 2, archTop, radius, Math.PI, 0, false);
    ctx.lineTo(w - pad, h - pad);
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#ffd1e5";
    ctx.stroke();
    // mullions
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#fffdfb";
    ctx.beginPath();
    ctx.moveTo(w / 2, archTop - radius + 12);
    ctx.lineTo(w / 2, h - pad);
    ctx.moveTo(pad + 10, h * 0.56);
    ctx.lineTo(w - pad - 10, h * 0.56);
    ctx.stroke();
    // sparkle at top
    ctx.fillStyle = "#ffd66b";
    ctx.beginPath();
    ctx.arc(w / 2, 46, 10, 0, Math.PI * 2);
    ctx.fill();
  });
  const windowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.8),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
  );
  group.add(windowPlane);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.12, 0.28), mat(0xfffdfb, { roughness: 0.6 }));
  sill.position.set(0, -1.45, 0.12);
  sill.castShadow = true;
  group.add(sill);
  const sillTrim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.025, 8, 24), mat(0xffd1e5, { roughness: 0.6 }));
  sillTrim.rotation.x = Math.PI / 2;
  sillTrim.position.set(0, -1.39, 0.12);
  sillTrim.scale.z = 0.2;
  group.add(sillTrim);
  for (const side of [-1, 1]) {
    const curtain = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xffc2dd, roughness: 0.9, side: THREE.DoubleSide })
    );
    curtain.position.set(side * 1.28, 0, 0.2);
    curtain.rotation.y = side * 0.22;
    group.add(curtain);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 12), mat(0xffd66b));
    tie.position.set(side * 1.2, -0.35, 0.28);
    tie.rotation.y = side * 0.22;
    group.add(tie);
  }
  return { group };
}

/* ------------------------------------------------------------------ */
/* banner                                                             */
/* ------------------------------------------------------------------ */

export function createBanner(text = "HAPPY BIRTHDAY ARNOUBA") {
  const group = new THREE.Group();
  const letters = text.split("");
  const width = 6.2;
  const start = new THREE.Vector3(-width / 2, 3.15, 0);
  const end = new THREE.Vector3(width / 2, 3.15, 0);
  const curvePts = [
    start,
    new THREE.Vector3(-width * 0.25, 2.9, 0.05),
    new THREE.Vector3(0, 2.82, 0.1),
    new THREE.Vector3(width * 0.25, 2.9, 0.05),
    end,
  ];
  const curve = new THREE.CatmullRomCurve3(curvePts);
  const string = new THREE.Mesh(tubeFromPoints(curvePts, 0.012, 80, 5), mat(0xfff3f8, { roughness: 0.7 }));
  group.add(string);

  const colors = [0xff7eb6, 0xc9a7ff, 0xff9ec9, 0xa8f0d1, 0xffb6d5, 0xa8d8ff, 0xffd1a8];
  const flags = [];
  const letterMeshes = [];
  const visible = letters.filter((c) => c !== " ");
  const step = 1 / (visible.length + 1);
  let vi = 0;
  letters.forEach((ch) => {
    if (ch === " ") return;
    const t = step * (vi + 1);
    const p = curve.getPoint(t);
    const color = colors[vi % colors.length];
    const tex = makeCanvasTextTexture(ch, {
      width: 160,
      height: 200,
      font: "700 150px Fredoka, sans-serif",
      color: "#" + new THREE.Color(color).getHexString(),
      stroke: "#fffdfb",
      strokeWidth: 16,
      shadow: false,
    });
    const letter = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.42),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false })
    );
    letter.position.set(p.x, p.y - 0.28, p.z);
    letter.rotation.z = Math.sin(t * Math.PI) * 0.04;
    letter.userData.baseScale = 1;
    group.add(letter);
    letterMeshes.push(letter);
    const drop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.14, 3),
      mat(0xd9c8d0)
    );
    drop.position.set(p.x, p.y - 0.07, p.z);
    group.add(drop);
    // little triangular flag between letters
    if (vi % 2 === 0) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.13, 0);
      shape.lineTo(0.065, -0.16);
      shape.closePath();
      const flag = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color: colors[(vi + 2) % colors.length], side: THREE.DoubleSide })
      );
      flag.position.set(p.x + 0.14, p.y - 0.02, p.z);
      group.add(flag);
      flags.push(flag);
    }
    vi++;
  });
  // tassels
  for (const side of [-1, 1]) {
    const tassel = new THREE.Group();
    tassel.position.set(side * width / 2, 3.1, 0);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xffd66b));
    tassel.add(top);
    for (let i = 0; i < 4; i++) {
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.003, 0.2, 3), mat(0xff9ec9));
      strand.position.set((i - 1.5) * 0.012, -0.13, 0);
      strand.rotation.z = (i - 1.5) * 0.12;
      tassel.add(strand);
    }
    group.add(tassel);
  }
  let time = 0;
  function twinkle() {
    letterMeshes.forEach((letter, i) => {
      gsap.fromTo(
        letter.scale,
        { x: 1, y: 1, z: 1 },
        {
          x: 1.32,
          y: 1.32,
          z: 1.32,
          duration: 0.24,
          delay: i * 0.075,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        }
      );
    });
  }
  return {
    group,
    twinkle,
    update(dt) {
      time += dt;
      group.rotation.z = Math.sin(time * 0.35) * 0.005;
      flags.forEach((f, i) => {
        f.rotation.y = Math.sin(time * 1.2 + i) * 0.25;
      });
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

/* ------------------------------------------------------------------ */
/* confetti cannon                                                    */
/* ------------------------------------------------------------------ */

export function createConfettiCannon(color = 0xff9ec9) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.75, 18),
    mat(color, { roughness: 0.4, metalness: 0.1 })
  );
  body.rotation.z = 0.65;
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.175, 0.02, 6, 18),
      mat(0xfff3f8, { roughness: 0.5 })
    );
    stripe.rotation.x = Math.PI / 2;
    stripe.position.set(0, 0.2 + i * 0.16, 0);
    stripe.rotation.z = 0.65;
    group.add(stripe);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 8, 20), mat(COLORS.gold));
  rim.rotation.x = Math.PI / 2;
  rim.rotation.z = 0.65;
  rim.position.set(-0.27, 0.67, 0);
  group.add(rim);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.09, 18), mat(0xc9a7ff, { roughness: 0.6 }));
  stand.position.y = 0.045;
  group.add(stand);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(-0.32, 0.75, 0);
  group.add(muzzle);
  return {
    group,
    muzzle,
    dispose() {
      disposeGroup(group);
    },
  };
}

/* ------------------------------------------------------------------ */
/* floating heart / sparkle ambience                                   */
/* ------------------------------------------------------------------ */

export function createPartyAmbience() {
  const group = new THREE.Group();
  const hearts = makeSprayParticles("hearts", { count: 28 });
  const sparkles = makeSprayParticles("sparkles", { count: 160 });
  const confetti = makeSprayParticles("confetti", { count: 160 });
  group.add(hearts.object3D, sparkles.object3D, confetti.object3D);
  let timer = 1;
  const tmp = new THREE.Vector3();
  return {
    group,
    update(dt) {
      hearts.update(dt);
      sparkles.update(dt);
      confetti.update(dt);
      timer -= dt;
      if (timer <= 0) {
        timer = 2.8 + Math.random() * 3.5;
        tmp.set(rand(-2.5, 2.5), rand(0.8, 2.5), rand(-2.5, 1.5));
        hearts.burst(tmp, { count: 1 });
        sparkles.burst(tmp, { count: 4, speed: 0.25, life: 2.2, spread: 1.2, colors: [0xffd66b, 0xffffff, 0xffb6d5] });
      }
    },
    burstConfetti(pos, count = 40) {
      confetti.burst(pos, { count, speed: 4, upward: 4, spread: 0.5, life: 2.5 });
    },
    burstHearts(pos, count = 8) {
      hearts.burst(pos, { count });
    },
    burstSparkles(pos, count = 20) {
      sparkles.burst(pos, { count, speed: 1.4, life: 1.5, spread: 0.5 });
    },
    dispose() {
      hearts.dispose();
      sparkles.dispose();
      confetti.dispose();
      disposeGroup(group);
    },
  };
}
