import * as THREE from "three";
import gsap from "gsap";
import {
  mat,
  basicMat,
  makeBlobShadow,
  tubeFromPoints,
  disposeGroup,
  rand,
} from "./props.js";

const TYPES = {
  fox: {
    body: 0xf59e5b,
    dark: 0xd9793c,
    light: 0xfff2e0,
    nose: 0x3b241d,
    scale: 0.95,
    ears: "pointy",
    tail: "fox",
  },
  bear: {
    body: 0xb9855b,
    dark: 0x8f5f3c,
    light: 0xfff2e0,
    nose: 0x3b241d,
    scale: 1.08,
    ears: "round",
    tail: "puff",
  },
  cat: {
    body: 0xc9b6e8,
    dark: 0xa98fd0,
    light: 0xfff3f8,
    nose: 0xff7eb6,
    scale: 0.88,
    ears: "pointy",
    tail: "cat",
  },
  penguin: {
    body: 0x2f2a3f,
    dark: 0x1d1a28,
    light: 0xfffdfb,
    nose: 0xffb13d,
    scale: 0.82,
    ears: "none",
    tail: "none",
    beak: 0xffb13d,
    feet: 0xffb13d,
  },
  hedgehog: {
    body: 0xd9a77a,
    dark: 0x6b4a35,
    light: 0xfff2e0,
    nose: 0x3b241d,
    scale: 0.78,
    ears: "round",
    tail: "puff",
    spikes: true,
  },
  duck: {
    body: 0xffd66b,
    dark: 0xf0b93d,
    light: 0xfff3c4,
    nose: 0xff9a3d,
    scale: 0.76,
    ears: "none",
    tail: "puff",
    beak: 0xff9a3d,
    feet: 0xff9a3d,
  },
  panda: {
    body: 0xfffdfb,
    dark: 0x2a2330,
    light: 0xffffff,
    nose: 0x2a2330,
    scale: 1.0,
    ears: "round",
    tail: "puff",
    panda: true,
  },
  bunny: {
    body: 0xfff3f8,
    dark: 0xffc2dd,
    light: 0xffffff,
    nose: 0xff7eb6,
    scale: 0.58,
    ears: "long",
    tail: "puff",
  },
};

export function createAnimal(type = "fox", opts = {}) {
  const cfg = TYPES[type] || TYPES.fox;
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);

  const bodyMat = mat(opts.body ?? cfg.body, { roughness: 0.9 });
  const darkMat = mat(cfg.dark, { roughness: 0.9 });
  const lightMat = mat(opts.light ?? cfg.light, { roughness: 0.95 });
  const blackMat = basicMat(0x2a2030);
  const blushMat = mat(0xff9ec9, { roughness: 0.9, transparent: true, opacity: 0.55 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.23, 20, 16), bodyMat);
  body.position.y = 0.38;
  body.scale.set(1.08, 1.12, 0.96);
  body.castShadow = true;
  rig.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), lightMat);
  belly.position.set(0, 0.35, 0.14);
  belly.scale.set(1, 1.18, 0.55);
  rig.add(belly);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.78;
  rig.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.205, 22, 18), bodyMat);
  head.scale.set(1.02, 0.98, 0.95);
  head.castShadow = true;
  headGroup.add(head);

  // muzzle
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 10), lightMat);
  muzzle.position.set(0, -0.05, 0.17);
  muzzle.scale.set(1.15, 0.7, 0.85);
  headGroup.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 6), basicMat(cfg.nose));
  nose.position.set(0, -0.01, 0.245);
  headGroup.add(nose);

  // eyes
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.029, 10, 8), blackMat);
    eye.position.set(side * 0.072, 0.035, 0.178);
    eye.scale.set(0.9, 1.1, 0.65);
    headGroup.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 5), basicMat(0xffffff));
    shine.position.set(side * 0.062, 0.05, 0.197);
    headGroup.add(shine);
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), blushMat);
    blush.position.set(side * 0.12, -0.05, 0.16);
    blush.scale.set(1.1, 0.6, 0.3);
    headGroup.add(blush);
  }

  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), basicMat(0x5a2a3a));
  mouth.position.set(0, -0.095, 0.225);
  mouth.scale.set(1.1, 0.5, 0.4);
  headGroup.add(mouth);

  // ears
  if (cfg.ears === "pointy") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.17, 8), bodyMat);
      ear.position.set(side * 0.13, 0.15, 0);
      ear.rotation.z = side * 0.26;
      headGroup.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.11, 6), mat(cfg.dark));
      inner.position.set(side * 0.13, 0.15, 0.025);
      inner.rotation.z = side * 0.26;
      headGroup.add(inner);
    }
  } else if (cfg.ears === "round") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 9), bodyMat);
      ear.position.set(side * 0.155, 0.13, 0);
      ear.scale.set(1, 1.05, 0.7);
      headGroup.add(ear);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), mat(cfg.dark));
      inner.position.set(side * 0.155, 0.13, 0.03);
      inner.scale.set(1, 1, 0.5);
      headGroup.add(inner);
    }
  } else if (cfg.ears === "long") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.18, 4, 8), bodyMat);
      ear.position.set(side * 0.085, 0.26, 0);
      ear.rotation.z = side * 0.12;
      headGroup.add(ear);
      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), mat(cfg.dark));
      inner.position.set(side * 0.085, 0.26, 0.03);
      inner.rotation.z = side * 0.12;
      headGroup.add(inner);
    }
  }

  // beak / bill
  if (cfg.beak) {
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 8), mat(cfg.beak, { roughness: 0.6 }));
    beak.position.set(0, -0.04, 0.25);
    beak.rotation.x = Math.PI / 2;
    headGroup.add(beak);
    nose.visible = false;
    muzzle.visible = false;
  }

  // panda patches
  if (cfg.panda) {
    for (const side of [-1, 1]) {
      const patch = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 9), darkMat);
      patch.position.set(side * 0.072, 0.035, 0.172);
      patch.scale.set(1.15, 1.3, 0.35);
      headGroup.add(patch);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 9), darkMat);
      ear.position.set(side * 0.16, 0.13, 0);
      ear.scale.set(1, 1, 0.7);
      headGroup.add(ear);
    }
  }

  // spikes
  if (cfg.spikes) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 5), darkMat);
      spike.position.set(Math.cos(a) * 0.17, 0.46 + Math.sin(i * 2.1) * 0.08, Math.sin(a) * 0.13 - 0.06);
      spike.rotation.z = -Math.cos(a) * 1.1;
      spike.rotation.x = Math.sin(a) * 1.1;
      rig.add(spike);
    }
  }

  // arms
  const arms = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.21, 0.55, 0);
    arm.rotation.z = side * 0.18;
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.13, 4, 8), cfg.panda ? darkMat : bodyMat);
    limb.position.y = -0.09;
    arm.add(limb);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), cfg.panda ? darkMat : bodyMat);
    hand.position.y = -0.19;
    arm.add(hand);
    rig.add(arm);
    arms[side < 0 ? "left" : "right"] = arm;
  }

  // legs
  const legs = {};
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.1, 0.24, 0);
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.1, 4, 8), cfg.panda ? darkMat : bodyMat);
    limb.position.y = -0.09;
    leg.add(limb);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), cfg.feet ? mat(cfg.feet, { roughness: 0.7 }) : (cfg.panda ? darkMat : bodyMat));
    foot.position.set(0, -0.18, 0.04);
    foot.scale.set(1.1, 0.55, 1.35);
    leg.add(foot);
    rig.add(leg);
    legs[side < 0 ? "left" : "right"] = leg;
  }

  // tail
  let tail = null;
  if (cfg.tail === "fox") {
    tail = new THREE.Group();
    tail.position.set(0, 0.35, -0.19);
    const shape = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 10), bodyMat);
    shape.position.set(0, 0.08, -0.12);
    shape.rotation.x = -1.0;
    tail.add(shape);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lightMat);
    tip.position.set(0, 0.22, -0.27);
    tip.scale.set(1, 0.9, 1.1);
    tail.add(tip);
    rig.add(tail);
  } else if (cfg.tail === "cat") {
    const pts = [
      new THREE.Vector3(0, 0.34, -0.19),
      new THREE.Vector3(0.12, 0.45, -0.28),
      new THREE.Vector3(0.22, 0.62, -0.24),
      new THREE.Vector3(0.18, 0.78, -0.15),
    ];
    const tube = new THREE.Mesh(tubeFromPoints(pts, 0.026, 24, 6), bodyMat);
    rig.add(tube);
    tail = tube;
  } else if (cfg.tail === "puff") {
    tail = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), lightMat);
    tail.position.set(0, 0.34, -0.2);
    rig.add(tail);
  }

  // accessories
  let held = null;
  if (type === "fox") {
    const horn = new THREE.Group();
    horn.position.set(0.11, 0.64, 0.2);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 8), mat(0xff9ec9, { roughness: 0.5 }));
    cone.rotation.x = Math.PI / 2;
    horn.add(cone);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5), mat(0xffd66b));
    stick.position.z = -0.11;
    stick.rotation.x = Math.PI / 2;
    horn.add(stick);
    rig.add(horn);
    held = horn;
  } else if (type === "cat" || type === "penguin") {
    held = new THREE.Group();
    held.position.set(-0.34, 0.5, 0.06);
    const colors = type === "cat" ? [0xff9ec9, 0xc9a7ff] : [0xa8d8ff, 0xffd66b];
    colors.forEach((c, i) => {
      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 12, 10),
        new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 0.8 })
      );
      balloon.position.set(i * 0.1 - 0.05, 0.22 + i * 0.08, 0);
      balloon.scale.set(1, 1.2, 0.9);
      held.add(balloon);
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.28, 3), mat(0xd9c8d0));
      string.position.set(i * 0.1 - 0.05, 0.04 + i * 0.08, 0);
      held.add(string);
    });
    rig.add(held);
  } else if (type === "panda") {
    held = new THREE.Group();
    held.position.set(0, 0.34, 0.26);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.16), mat(0xffb6d5, { roughness: 0.6 }));
    held.add(box);
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.17), mat(0xffd66b));
    held.add(ribbon);
    const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.18, 0.035), mat(0xffd66b));
    held.add(ribbon2);
    rig.add(held);
  } else if (type === "hedgehog" || type === "duck") {
    held = new THREE.Group();
    held.position.set(0.24, 0.4, 0.08);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.12), mat(0xc9a7ff, { roughness: 0.8 }));
    held.add(bag);
    const colors = [0xff9ec9, 0xffd66b, 0xa8d8ff, 0xa8f0d1];
    for (let i = 0; i < 5; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), mat(colors[i % colors.length]));
      dot.position.set(rand(-0.05, 0.05), rand(-0.06, 0.07), 0.065);
      held.add(dot);
    }
    rig.add(held);
  }

  const shadow = makeBlobShadow(0.33, 0.26);
  shadow.position.y = 0.012;
  group.add(shadow);

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 1.1, 0.55),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  hit.position.y = 0.55;
  hit.userData.type = type;
  group.add(hit);

  group.scale.setScalar(opts.scale ?? cfg.scale);
  group.rotation.y = opts.rotation ?? 0;

  const state = {
    time: Math.random() * 5,
    walking: false,
    hop: false,
    singing: false,
    talking: 0,
    blinkTimer: 2 + Math.random() * 2,
    blinking: false,
    tricking: false,
    armsOverride: false,
    pushing: false,
    disposed: false,
    baseRotY: group.rotation.y,
    baseArm: { left: arms.left.rotation.z, right: arms.right.rotation.z },
    lookTarget: null,
    headYaw: 0,
    headPitch: 0,
  };

  function blink() {
    if (state.blinking) return;
    state.blinking = true;
    gsap.to([...headGroup.children].filter((c) => c.geometry?.type === "SphereGeometry" && c.material === blackMat).map((c) => c.scale), {
      y: 0.1,
      duration: 0.06,
      onComplete: () => {
        gsap.to([...headGroup.children].filter((c) => c.geometry?.type === "SphereGeometry" && c.material === blackMat).map((c) => c.scale), {
          y: 1,
          duration: 0.1,
          onComplete: () => { state.blinking = false; },
        });
      },
    });
  }

  function jump() {
    if (state.disposed) return Promise.resolve();
    state.tricking = true;
    const tl = gsap.timeline({ onComplete: () => { state.tricking = false; } });
    tl.to(rig.scale, { x: 1.12, y: 0.86, z: 1.12, duration: 0.08 })
      .to(rig.position, { y: 0.3, duration: 0.22, ease: "power2.out" }, 0.04)
      .to(rig.scale, { x: 0.95, y: 1.08, z: 0.95, duration: 0.1 }, 0.08)
      .to(rig.position, { y: 0, duration: 0.2, ease: "power2.in" }, 0.28)
      .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.25, ease: "elastic.out(1,0.5)" }, 0.38);
    return new Promise((resolve) => tl.eventCallback("onComplete", () => { state.tricking = false; resolve(); }));
  }

  function clap(times = 6) {
    if (state.disposed) return Promise.resolve();
    state.armsOverride = true;
    const tl = gsap.timeline({ onComplete: () => { state.armsOverride = false; } });
    for (let i = 0; i < times; i++) {
      tl.to(arms.left.rotation, { z: -0.65, x: 0.5, duration: 0.11, ease: "sine.inOut" }, i * 0.2)
        .to(arms.right.rotation, { z: 0.65, x: 0.5, duration: 0.11, ease: "sine.inOut" }, i * 0.2)
        .to(rig.position, { y: 0.07, duration: 0.1 }, i * 0.2)
        .to(rig.position, { y: 0, duration: 0.1 }, i * 0.2 + 0.1)
        .to(arms.left.rotation, { z: state.baseArm.left, x: 0, duration: 0.09 }, i * 0.2 + 0.11)
        .to(arms.right.rotation, { z: state.baseArm.right, x: 0, duration: 0.09 }, i * 0.2 + 0.11);
    }
    return new Promise((resolve) => tl.eventCallback("onComplete", () => { state.armsOverride = false; resolve(); }));
  }

  function highFive() {
    if (state.disposed) return Promise.resolve();
    state.armsOverride = true;
    const tl = gsap.timeline({ onComplete: () => { state.armsOverride = false; } });
    tl.to(arms.right.rotation, { z: -2.4, x: 0.2, duration: 0.2, ease: "back.out(2)" })
      .to(rig.rotation, { z: -0.12, duration: 0.15 }, 0.1)
      .to(arms.right.rotation, { z: -2.1, duration: 0.18, yoyo: true, repeat: 1 }, 0.35)
      .to(rig.rotation, { z: 0, duration: 0.2 }, 0.45)
      .to(arms.right.rotation, { z: state.baseArm.right, x: 0, duration: 0.25 }, 0.6);
    return new Promise((resolve) => tl.eventCallback("onComplete", () => { state.armsOverride = false; resolve(); }));
  }

  function raiseArm(duration = 1.2) {
    if (state.disposed) return Promise.resolve();
    state.armsOverride = true;
    const tl = gsap.timeline({ onComplete: () => { state.armsOverride = false; } });
    tl.to(arms.right.rotation, { z: -2.2, x: 0.2, duration: 0.25, ease: "back.out(2)" })
      .to(arms.right.rotation, { z: -2.2, duration })
      .to(arms.right.rotation, { z: state.baseArm.right, x: 0, duration: 0.3 });
    return new Promise((resolve) => tl.eventCallback("onComplete", () => { state.armsOverride = false; resolve(); }));
  }

  function spin() {
    if (state.disposed) return Promise.resolve();
    state.tricking = true;
    return new Promise((resolve) => {
      gsap.to(group.rotation, {
        y: state.baseRotY + Math.PI * 2,
        duration: 0.9,
        ease: "power2.inOut",
        onComplete: () => {
          group.rotation.y = state.baseRotY;
          state.tricking = false;
          resolve();
        },
      });
    });
  }

  function slide() {
    if (state.disposed) return Promise.resolve();
    state.tricking = true;
    const z0 = group.position.z;
    const tl = gsap.timeline({ onComplete: () => { state.tricking = false; } });
    tl.to(rig.rotation, { x: -1.0, duration: 0.25, ease: "power2.out" })
      .to(group.position, { z: z0 - 0.5, duration: 0.35, ease: "power2.out" }, 0.1)
      .to(group.position, { z: z0, duration: 0.4, ease: "power2.inOut" }, 0.55)
      .to(rig.rotation, { x: 0, duration: 0.3 }, 0.7);
    return new Promise((resolve) => tl.eventCallback("onComplete", () => { state.tricking = false; resolve(); }));
  }

  function backflip() {
    if (state.disposed) return Promise.resolve();
    state.tricking = true;
    const tl = gsap.timeline({ onComplete: () => { state.tricking = false; } });
    tl.to(rig.position, { y: 0.42, duration: 0.25, ease: "power2.out" })
      .to(rig.rotation, { x: -Math.PI * 2, duration: 0.55, ease: "power1.inOut" }, 0.05)
      .to(rig.position, { y: 0, duration: 0.22, ease: "power2.in" }, 0.35)
      .set(rig.rotation, { x: 0 });
    return new Promise((resolve) => tl.eventCallback("onComplete", () => { state.tricking = false; resolve(); }));
  }

  function walkPath(points, duration = 1.6, options = {}) {
    if (state.disposed) return Promise.resolve();
    state.walking = true;
    state.hop = Boolean(options.hop);
    const tl = gsap.timeline({
      onComplete: () => {
        state.walking = false;
        state.hop = false;
        rig.position.y = 0;
      },
    });
    const seg = duration / Math.max(1, points.length);
    for (const p of points) {
      tl.to(group.position, { x: p.x, z: p.z, duration: seg, ease: "sine.inOut" });
    }
    if (options.rotation !== undefined) {
      tl.to(group.rotation, { y: options.rotation, duration: 0.35, ease: "sine.inOut" }, "-=0.15");
    }
    return new Promise((resolve) => tl.eventCallback("onComplete", () => {
      state.walking = false;
      state.hop = false;
      rig.position.y = 0;
      resolve();
    }));
  }

  function talkFor(seconds = 1.6) {
    state.talking = Math.max(state.talking, seconds);
  }

  function setSinging(value) {
    state.singing = value;
  }

  function setPush(value) {
    state.pushing = value;
  }

  function lookAt(vec) {
    state.lookTarget = vec ? vec.clone() : null;
  }

  function update(dt) {
    if (state.disposed) return;
    state.time += dt;
    const t = state.time;

    state.talking = Math.max(0, state.talking - dt);

    if (!state.tricking) {
      const bob = state.walking
        ? Math.abs(Math.sin(t * 8)) * (state.hop ? 0.18 : 0.045)
        : Math.sin(t * 2.1) * 0.012;
      rig.position.y = bob;
      if (state.walking) {
        rig.rotation.z = Math.sin(t * 8) * 0.06;
      } else {
        rig.rotation.z += (0 - rig.rotation.z) * Math.min(1, dt * 8);
      }
    }

    if (!state.armsOverride) {
      if (state.pushing) {
        arms.left.rotation.x += (-1.1 - arms.left.rotation.x) * Math.min(1, dt * 8);
        arms.right.rotation.x += (-1.1 - arms.right.rotation.x) * Math.min(1, dt * 8);
        arms.left.rotation.z = state.baseArm.left;
        arms.right.rotation.z = state.baseArm.right;
      } else if (state.walking) {
        arms.left.rotation.x = Math.sin(t * 8) * 0.5;
        arms.right.rotation.x = -Math.sin(t * 8) * 0.5;
        arms.left.rotation.z = state.baseArm.left;
        arms.right.rotation.z = state.baseArm.right;
      } else {
        arms.left.rotation.x += (0 - arms.left.rotation.x) * Math.min(1, dt * 8);
        arms.right.rotation.x += (0 - arms.right.rotation.x) * Math.min(1, dt * 8);
        arms.left.rotation.z += (state.baseArm.left - arms.left.rotation.z) * Math.min(1, dt * 8);
        arms.right.rotation.z += (state.baseArm.right - arms.right.rotation.z) * Math.min(1, dt * 8);
      }
    }

    if (state.walking) {
      legs.left.rotation.x = Math.sin(t * 8) * 0.55;
      legs.right.rotation.x = -Math.sin(t * 8) * 0.55;
    } else {
      legs.left.rotation.x += (0 - legs.left.rotation.x) * Math.min(1, dt * 8);
      legs.right.rotation.x += (0 - legs.right.rotation.x) * Math.min(1, dt * 8);
    }

    if (tail) {
      if (tail.isGroup || tail.isMesh) {
        tail.rotation.y = Math.sin(t * 2.4) * 0.25;
        tail.rotation.z = Math.sin(t * 1.8) * 0.08;
      }
    }
    if (held) {
      held.rotation.z = Math.sin(t * 1.7) * 0.08;
    }

    headGroup.rotation.z = Math.sin(t * 0.9) * 0.03;
    if (state.lookTarget) {
      const local = rig.worldToLocal(state.lookTarget.clone());
      const targetYaw = Math.atan2(local.x, local.z);
      const targetPitch = Math.atan2(local.y - 0.78, Math.hypot(local.x, local.z));
      state.headYaw += (THREE.MathUtils.clamp(targetYaw, -0.6, 0.6) - state.headYaw) * Math.min(1, dt * 6);
      state.headPitch += (THREE.MathUtils.clamp(targetPitch, -0.35, 0.35) - state.headPitch) * Math.min(1, dt * 6);
      headGroup.rotation.y = state.headYaw;
      headGroup.rotation.x = state.headPitch;
    } else {
      state.headYaw += (0 - state.headYaw) * Math.min(1, dt * 6);
      state.headPitch += (0 - state.headPitch) * Math.min(1, dt * 6);
      headGroup.rotation.y = state.headYaw + Math.sin(t * 0.6) * 0.06;
      headGroup.rotation.x = state.headPitch;
    }

    if (state.singing) {
      mouth.scale.y = 0.5 + Math.abs(Math.sin(t * 8)) * 1.6;
      mouth.scale.x = 1.1 + Math.sin(t * 8) * 0.15;
    } else if (state.talking > 0) {
      mouth.scale.y = 0.5 + Math.abs(Math.sin(t * 14)) * 1.2;
    } else {
      mouth.scale.y += (0.5 - mouth.scale.y) * Math.min(1, dt * 8);
      mouth.scale.x += (1.1 - mouth.scale.x) * Math.min(1, dt * 8);
    }

    state.blinkTimer -= dt;
    if (state.blinkTimer <= 0 && !state.blinking) {
      blink();
      state.blinkTimer = 2.2 + Math.random() * 2.5;
    }
  }

  function dispose() {
    state.disposed = true;
    gsap.killTweensOf(group.position);
    gsap.killTweensOf(group.rotation);
    gsap.killTweensOf(rig.position);
    gsap.killTweensOf(rig.rotation);
    gsap.killTweensOf(rig.scale);
    gsap.killTweensOf(arms.left.rotation);
    gsap.killTweensOf(arms.right.rotation);
    disposeGroup(group);
  }

  return {
    group,
    hit,
    type,
    update,
    jump,
    clap,
    highFive,
    raiseArm,
    spin,
    slide,
    backflip,
    walkPath,
    talkFor,
    setSinging,
    setPush,
    lookAt,
    dispose,
    get state() {
      return state;
    },
  };
}
