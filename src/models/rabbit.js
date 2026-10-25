import * as THREE from "three";
import gsap from "gsap";
import {
  COLORS,
  mat,
  addOutline,
  makeSprayParticles,
  makeBlobShadow,
  roundedBoxGeometry,
  makeHeartShape,
  tubeFromPoints,
  disposeGroup,
} from "./props.js";

/**
 * Arnouba — a chubby, soft-toy pink rabbit built entirely from primitives.
 * Returns { group, effects, update, idle, walk, jump, wave, scare, happy,
 *           giggle, lookAt, blink, setOutfit, dispose, interactive }
 */
export function createRabbit() {
  const root = new THREE.Group();
  root.name = "Arnouba";
  root.scale.setScalar(0.82);

  const hop = new THREE.Group();
  const rig = new THREE.Group();
  root.add(hop);
  hop.add(rig);

  const fur = mat(COLORS.rabbit, { roughness: 0.92 });
  const furDark = mat(0xf6a6c8, { roughness: 0.92 });
  const cream = mat(COLORS.cream, { roughness: 0.94 });
  const inner = mat(COLORS.innerEar, { roughness: 0.85 });
  const dark = mat(0x3a1b2f, { roughness: 0.35 });
  const glossy = mat(0x2a1020, { roughness: 0.18, metalness: 0.05 });
  const white = mat(0xffffff, { roughness: 0.2 });
  const mouthMat = mat(0xa34a6a, { roughness: 0.6 });
  const blushMat = new THREE.MeshStandardMaterial({
    color: 0xff6aa6,
    roughness: 0.9,
    transparent: true,
    opacity: 0.58,
  });
  const gold = mat(COLORS.gold, { roughness: 0.35, metalness: 0.25 });
  const lilac = mat(COLORS.lilac, { roughness: 0.85 });

  /* ---------------- body ---------------- */
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 36, 26), fur);
  body.position.y = 0.36;
  body.scale.set(1, 0.95, 0.9);
  body.castShadow = true;
  body.receiveShadow = true;
  addOutline(body, 0xe75a9a, 1.035);
  rig.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.205, 28, 20), cream);
  belly.position.set(0, 0.34, 0.12);
  belly.scale.set(1, 1.15, 0.62);
  belly.castShadow = false;
  rig.add(belly);

  /* ---------------- skirt ---------------- */
  const skirtGroup = new THREE.Group();
  skirtGroup.position.y = 0.34;
  const skirtPts = [
    new THREE.Vector2(0.175, 0.03),
    new THREE.Vector2(0.2, 0.0),
    new THREE.Vector2(0.255, -0.07),
    new THREE.Vector2(0.31, -0.15),
    new THREE.Vector2(0.325, -0.17),
  ];
  const skirt = new THREE.Mesh(new THREE.LatheGeometry(skirtPts, 40), lilac);
  skirt.castShadow = true;
  skirtGroup.add(skirt);
  const waist = new THREE.Mesh(new THREE.TorusGeometry(0.178, 0.018, 8, 30), cream);
  waist.rotation.x = Math.PI / 2;
  waist.position.y = 0.028;
  skirtGroup.add(waist);
  const dotGeo = new THREE.SphereGeometry(0.014, 8, 6);
  const dotMat = mat(0xffffff, { roughness: 0.9 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(Math.cos(a) * 0.292, -0.128 + Math.sin(i * 2.3) * 0.01, Math.sin(a) * 0.292);
    skirtGroup.add(dot);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const scallop = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), lilac);
    scallop.position.set(Math.cos(a) * 0.315, -0.17, Math.sin(a) * 0.315);
    scallop.scale.set(1, 0.55, 1);
    skirtGroup.add(scallop);
  }
  rig.add(skirtGroup);

  /* ---------------- head ---------------- */
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.82;
  rig.add(headPivot);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 30), fur);
  head.scale.set(1.1, 0.96, 1);
  head.castShadow = true;
  head.receiveShadow = true;
  addOutline(head, 0xe75a9a, 1.03);
  headPivot.add(head);

  // muzzle / cheeks
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 18), cream);
  muzzle.position.set(0, -0.045, 0.255);
  muzzle.scale.set(1.18, 0.78, 0.62);
  headPivot.add(muzzle);

  const cheekGeo = new THREE.SphereGeometry(0.083, 18, 14);
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(cheekGeo, blushMat);
    cheek.position.set(side * 0.225, -0.02, 0.235);
    cheek.scale.set(1.05, 0.7, 0.32);
    cheek.rotation.z = side * -0.15;
    headPivot.add(cheek);
  }

  // eyes
  const eyeGroups = [];
  const eyeGeo = new THREE.SphereGeometry(0.058, 22, 18);
  const shineGeo = new THREE.SphereGeometry(0.018, 10, 8);
  const shineSmallGeo = new THREE.SphereGeometry(0.01, 8, 6);
  const lashGeo = new THREE.CapsuleGeometry(0.006, 0.032, 3, 6);
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * 0.118, 0.055, 0.292);
    const ball = new THREE.Mesh(eyeGeo, glossy);
    ball.scale.set(1, 1.12, 0.72);
    eye.add(ball);
    const shine = new THREE.Mesh(shineGeo, white);
    shine.position.set(side * 0.017, 0.024, 0.042);
    eye.add(shine);
    const shine2 = new THREE.Mesh(shineSmallGeo, white);
    shine2.position.set(side * -0.012, -0.016, 0.04);
    shine2.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    eye.add(shine2);
    for (let l = 0; l < 3; l++) {
      const lash = new THREE.Mesh(lashGeo, mat(0xc44b7f, { roughness: 0.7 }));
      lash.position.set(side * (0.028 + l * 0.018), 0.05 + l * 0.012, 0.035);
      lash.rotation.z = side * (-0.35 - l * 0.16);
      eye.add(lash);
    }
    headPivot.add(eye);
    eyeGroups.push(eye);
  }

  // nose + "w" mouth
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10), inner);
  nose.position.set(0, -0.035, 0.33);
  nose.scale.set(1.25, 0.82, 0.8);
  headPivot.add(nose);
  const mouthCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.062, -0.082, 0.322),
    new THREE.Vector3(-0.032, -0.104, 0.332),
    new THREE.Vector3(0, -0.078, 0.337),
    new THREE.Vector3(0.032, -0.104, 0.332),
    new THREE.Vector3(0.062, -0.082, 0.322),
  ]);
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(mouthCurve, 24, 0.0065, 6, false), mouthMat);
  headPivot.add(mouth);
  const philtrum = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.025, 3, 6), mouthMat);
  philtrum.position.set(0, -0.052, 0.332);
  headPivot.add(philtrum);

  /* ---------------- ears ---------------- */
  const earGeo = new THREE.CapsuleGeometry(0.088, 0.4, 8, 16);
  const innerEarGeo = new THREE.CapsuleGeometry(0.05, 0.31, 6, 12);
  const ears = {};
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.135, 0.2, -0.01);
    ear.rotation.z = side * -0.16;
    ear.rotation.x = -0.06;
    const outer = new THREE.Mesh(earGeo, fur);
    outer.position.y = 0.28;
    outer.castShadow = true;
    addOutline(outer, 0xe75a9a, 1.035);
    ear.add(outer);
    const inn = new THREE.Mesh(innerEarGeo, inner);
    inn.position.set(0, 0.285, 0.06);
    inn.scale.set(0.82, 1, 0.28);
    ear.add(inn);
    headPivot.add(ear);
    ears[side === -1 ? "left" : "right"] = ear;
  }

  // bow on her right ear
  const bow = new THREE.Group();
  bow.position.set(0.085, 0.12, 0.085);
  bow.rotation.z = -0.3;
  const lobeGeo = new THREE.ConeGeometry(0.072, 0.14, 14);
  const bowCream = mat(0xfff0dc, { roughness: 0.85 });
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(lobeGeo, side === -1 ? bowCream : mat(0xffc7dd, { roughness: 0.85 }));
    lobe.position.x = side * 0.065;
    lobe.rotation.z = side * -Math.PI / 2;
    lobe.scale.z = 0.7;
    lobe.castShadow = true;
    bow.add(lobe);
  }
  const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.043, 14, 10), inner);
  bow.add(bowKnot);
  for (const side of [-1, 1]) {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.12, 0.012), bowCream);
    ribbon.position.set(side * 0.035, -0.1, 0);
    ribbon.rotation.z = side * 0.25;
    bow.add(ribbon);
  }
  ears.right.add(bow);

  /* ---------------- arms ---------------- */
  const armGeo = new THREE.CapsuleGeometry(0.064, 0.16, 6, 12);
  const pawGeo = new THREE.SphereGeometry(0.072, 16, 12);
  const arms = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.255, 0.42, 0.02);
    arm.rotation.z = side * 0.28;
    arm.rotation.x = 0.05;
    const limb = new THREE.Mesh(armGeo, furDark);
    limb.position.y = -0.105;
    limb.castShadow = true;
    arm.add(limb);
    const paw = new THREE.Mesh(pawGeo, cream);
    paw.position.y = -0.215;
    paw.scale.set(1, 0.92, 0.95);
    arm.add(paw);
    rig.add(arm);
    arms[side === -1 ? "left" : "right"] = arm;
  }

  /* ---------------- legs ---------------- */
  const legGeo = new THREE.CapsuleGeometry(0.07, 0.11, 6, 12);
  const footGeo = new THREE.SphereGeometry(0.082, 16, 12);
  const legs = {};
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.12, 0.17, 0.015);
    const limb = new THREE.Mesh(legGeo, furDark);
    limb.position.y = -0.052;
    limb.castShadow = true;
    leg.add(limb);
    const foot = new THREE.Mesh(footGeo, cream);
    foot.position.set(0, -0.14, 0.055);
    foot.scale.set(1.02, 0.58, 1.32);
    leg.add(foot);
    rig.add(leg);
    legs[side === -1 ? "left" : "right"] = leg;
  }

  /* ---------------- tail ---------------- */
  const tail = new THREE.Group();
  tail.position.set(0, 0.34, -0.245);
  const tailMat = mat(0xfff7fb, { roughness: 1 });
  const tailGeo = new THREE.SphereGeometry(0.075, 14, 10);
  for (const [x, y, z, s] of [
    [0, 0, 0, 1],
    [0.05, 0.03, 0.01, 0.68],
    [-0.045, 0.02, 0.005, 0.62],
    [0.01, 0.06, 0.01, 0.55],
  ]) {
    const puff = new THREE.Mesh(tailGeo, tailMat);
    puff.position.set(x, y, z);
    puff.scale.setScalar(s);
    tail.add(puff);
  }
  rig.add(tail);

  /* ---------------- outfit extras ---------------- */
  const crown = new THREE.Group();
  crown.position.set(0, 0.315, 0.0);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.055, 18, 1, true), gold);
  band.position.y = 0.015;
  crown.add(band);
  const spikeGeo = new THREE.ConeGeometry(0.028, 0.11, 8);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(spikeGeo, gold);
    spike.position.set(Math.cos(a) * 0.1, 0.09, Math.sin(a) * 0.1);
    crown.add(spike);
    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mat(i % 2 ? 0xff7eb6 : 0xa8d8ff, { roughness: 0.2 }));
    jewel.position.set(Math.cos(a) * 0.115, 0.03, Math.sin(a) * 0.115);
    crown.add(jewel);
  }
  crown.visible = false;
  headPivot.add(crown);

  const cape = new THREE.Group();
  cape.position.set(0, 0.36, -0.2);
  cape.rotation.x = -0.12;
  const capeMesh = new THREE.Mesh(roundedBoxGeometry(0.42, 0.52, 0.025, 0.08), lilac);
  capeMesh.position.y = -0.2;
  capeMesh.castShadow = true;
  cape.add(capeMesh);
  const capeTrim = new THREE.Mesh(roundedBoxGeometry(0.44, 0.07, 0.03, 0.03), mat(0xffe0ec, { roughness: 0.8 }));
  capeTrim.position.y = -0.45;
  cape.add(capeTrim);
  cape.visible = false;
  rig.add(cape);

  /* ---------------- shadow + hit target ---------------- */
  const shadow = makeBlobShadow(0.36, 0.3);
  shadow.position.y = 0.006;
  root.add(shadow);

  const interactive = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.44, 1.5, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  interactive.position.y = 0.7;
  interactive.userData.type = "rabbit";
  root.add(interactive);

  /* ---------------- particle effects ---------------- */
  const dust = makeSprayParticles("dust", { count: 20 });
  const hearts = makeSprayParticles("hearts", { count: 30 });
  const effects = new THREE.Group();
  effects.add(dust.object3D, hearts.object3D);

  /* ---------------- state ---------------- */
  const state = {
    time: 0,
    blinkTimer: 2.4 + Math.random() * 1.8,
    blinking: false,
    eyesClosed: false,
    walking: false,
    walkPhase: 0,
    walkSpeed: 1,
    lookTarget: null,
    headYaw: 0,
    headPitch: 0,
    squashActive: false,
    waving: false,
    armBase: { left: arms.left.rotation.z, right: arms.right.rotation.z },
    earBase: { left: ears.left.rotation.z, right: ears.right.rotation.z },
    lastStep: 0,
    disposed: false,
  };
  const headTilt = { x: 0, z: 0 };
  const tmp = new THREE.Vector3();
  const tmpLocal = new THREE.Vector3();

  function blinkNow() {
    if (state.blinking || state.eyesClosed) return;
    state.blinking = true;
    gsap.to(eyeGroups.map((e) => e.scale), {
      y: 0.08,
      duration: 0.055,
      ease: "power2.in",
      onComplete: () => {
        gsap.to(eyeGroups.map((e) => e.scale), {
          y: 1,
          duration: 0.1,
          ease: "power2.out",
          onComplete: () => {
            state.blinking = false;
          },
        });
      },
    });
  }

  function closeEyes(duration = 2) {
    state.eyesClosed = true;
    state.blinking = false;
    gsap.killTweensOf(eyeGroups.map((e) => e.scale));
    gsap.to(eyeGroups.map((e) => e.scale), { y: 0.08, duration: 0.2, ease: "power2.inOut" });
    if (duration > 0) {
      setTimeout(() => {
        if (!state.disposed) openEyes();
      }, duration * 1000);
    }
  }

  function openEyes() {
    state.eyesClosed = false;
    gsap.killTweensOf(eyeGroups.map((e) => e.scale));
    gsap.to(eyeGroups.map((e) => e.scale), { y: 1, duration: 0.22, ease: "power2.out" });
  }

  function worldPos(y = 0.8) {
    root.getWorldPosition(tmp);
    tmp.y += y * root.scale.y;
    return tmp.clone();
  }

  function update(dt) {
    if (state.disposed) return;
    dt = Math.min(dt, 0.05);
    state.time += dt;
    const t = state.time;

    dust.update(dt);
    hearts.update(dt);

    // blink
    state.blinkTimer -= dt;
    if (state.blinkTimer <= 0 && !state.blinking && !state.eyesClosed) {
      blinkNow();
      state.blinkTimer = 2.6 + Math.random() * 2.4;
    }

    // breathing
    if (!state.squashActive) {
      const b = Math.sin(t * 2.5) * 0.014;
      rig.scale.y = 1 + b;
      rig.scale.x = 1 - b * 0.45;
      rig.scale.z = 1 - b * 0.45;
      body.scale.set(1 + b * 0.5, 0.95 + b, 0.9 + b * 0.4);
    }

    // walk cycle
    if (state.walking) {
      state.walkPhase += dt * (6.2 + state.walkSpeed * 2.6);
      const p = state.walkPhase;
      const bounce = Math.abs(Math.sin(p)) * 0.038;
      hop.position.y = bounce;
      legs.left.rotation.x = Math.sin(p) * 0.7;
      legs.right.rotation.x = -Math.sin(p) * 0.7;
      arms.left.rotation.x = -Math.sin(p) * 0.55;
      arms.right.rotation.x = Math.sin(p) * 0.55;
      rig.rotation.x = 0.04 + Math.sin(p * 2) * 0.01;
      rig.rotation.z = Math.sin(p) * 0.03;
      ears.left.rotation.x = -0.06 + Math.sin(p * 2 + 0.6) * 0.09;
      ears.right.rotation.x = -0.06 + Math.sin(p * 2 + 1.4) * 0.11;
      const step = Math.floor(p / Math.PI);
      if (step !== state.lastStep) {
        state.lastStep = step;
        const side = step % 2 === 0 ? legs.left : legs.right;
        side.getWorldPosition(tmp);
        tmp.y = 0.03;
        dust.burst(tmp, { count: 2 });
      }
    } else {
      hop.position.y += (0 - hop.position.y) * Math.min(1, dt * 10);
      legs.left.rotation.x += (0 - legs.left.rotation.x) * Math.min(1, dt * 9);
      legs.right.rotation.x += (0 - legs.right.rotation.x) * Math.min(1, dt * 9);
      arms.left.rotation.x += (0 - arms.left.rotation.x) * Math.min(1, dt * 9);
      arms.right.rotation.x += (0 - arms.right.rotation.x) * Math.min(1, dt * 9);
      if (!state.squashActive) {
        rig.rotation.x += (0 - rig.rotation.x) * Math.min(1, dt * 8);
        rig.rotation.z += (0 - rig.rotation.z) * Math.min(1, dt * 8);
      }
      if (!state.squashActive) {
        ears.left.rotation.x = -0.06 + Math.sin(t * 1.4) * 0.025;
        ears.right.rotation.x = -0.06 + Math.sin(t * 1.1 + 1) * 0.03;
      }
    }

    // ear idle sway
    if (!state.squashActive && !state.walking) {
      ears.left.rotation.z = state.earBase.left + Math.sin(t * 1.6) * 0.02;
      ears.right.rotation.z = state.earBase.right + Math.sin(t * 1.25 + 0.8) * 0.025;
    }

    // tail
    tail.rotation.y = Math.sin(t * 4.2) * 0.32;
    tail.rotation.z = Math.sin(t * 3.1) * 0.08;

    // head look / idle sway
    let targetYaw = Math.sin(t * 0.8) * 0.05;
    let targetPitch = Math.sin(t * 1.15) * 0.02;
    if (state.lookTarget) {
      headPivot.getWorldPosition(tmp);
      tmpLocal.copy(state.lookTarget);
      headPivot.worldToLocal(tmpLocal);
      targetYaw = THREE.MathUtils.clamp(Math.atan2(tmpLocal.x, tmpLocal.z), -Math.PI / 3, Math.PI / 3);
      targetPitch = THREE.MathUtils.clamp(
        Math.atan2(tmpLocal.y, Math.hypot(tmpLocal.x, tmpLocal.z)),
        -0.42,
        0.42
      );
    }
    state.headYaw += (targetYaw - state.headYaw) * Math.min(1, dt * 4.2);
    state.headPitch += (targetPitch - state.headPitch) * Math.min(1, dt * 4.2);
    headPivot.rotation.y = state.headYaw;
    headPivot.rotation.x = state.headPitch + headTilt.x;
    headPivot.rotation.z = headTilt.z + Math.sin(t * 0.9) * 0.015;

    // arms rest
    if (!state.walking && !state.squashActive && !state.waving) {
      arms.left.rotation.z += (state.armBase.left - arms.left.rotation.z) * Math.min(1, dt * 6);
      arms.right.rotation.z += (state.armBase.right - arms.right.rotation.z) * Math.min(1, dt * 6);
    }

    // skirt sway
    skirtGroup.rotation.z = Math.sin(t * 2.2) * 0.012;
    skirtGroup.rotation.x = Math.sin(t * 1.7) * 0.01;
  }

  function idle() {
    state.walking = false;
    state.lookTarget = null;
    if (walkTween) {
      walkTween.kill();
      walkTween = null;
    }
    gsap.to(hop.position, { y: 0, duration: 0.2, ease: "power2.out" });
    gsap.to(arms.left.rotation, { z: state.armBase.left, duration: 0.25 });
    gsap.to(arms.right.rotation, { z: state.armBase.right, duration: 0.25 });
    return Promise.resolve();
  }

  let walkTween = null;
  function walk(target, speed = 1.7) {
    if (state.disposed) return Promise.resolve();
    state.lookTarget = null;
    const start = root.position.clone();
    const dx = target.x - start.x;
    const dz = target.z - start.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.02) return Promise.resolve();
    if (walkTween) walkTween.kill();
    state.walking = true;
    state.walkSpeed = speed;
    state.lastStep = -1;
    const yaw = Math.atan2(dx, dz);
    root.rotation.y = yaw;
    return new Promise((resolve) => {
      walkTween = gsap.to(root.position, {
        x: target.x,
        z: target.z,
        duration: Math.max(0.3, dist / speed),
        ease: "none",
        onUpdate: () => {
          state.lookTarget = null;
        },
        onComplete: () => {
          state.walking = false;
          walkTween = null;
          gsap.to(hop.position, { y: 0, duration: 0.15, ease: "power2.out" });
          resolve();
        },
      });
    });
  }

  function jump() {
    if (state.disposed) return Promise.resolve();
    state.walking = false;
    state.squashActive = true;
    gsap.killTweensOf([rig.scale, hop.position, arms.left.rotation, arms.right.rotation]);
    const tl = gsap.timeline({
      onComplete: () => {
        state.squashActive = false;
      },
    });
    tl.to(rig.scale, { x: 1.16, y: 0.8, z: 1.16, duration: 0.1, ease: "power2.out" })
      .to(hop.position, { y: 0.44, duration: 0.28, ease: "power2.out" }, 0.07)
      .to(rig.scale, { x: 0.9, y: 1.18, z: 0.9, duration: 0.16, ease: "power1.inOut" }, 0.1)
      .to(ears.left.rotation, { z: state.earBase.left - 0.22, duration: 0.16 }, 0.1)
      .to(ears.right.rotation, { z: state.earBase.right + 0.22, duration: 0.16 }, 0.1)
      .to(hop.position, { y: 0, duration: 0.25, ease: "power2.in" }, 0.36)
      .to(rig.scale, { x: 1.13, y: 0.86, z: 1.13, duration: 0.09, ease: "power2.out" }, 0.57)
      .to(ears.left.rotation, { z: state.earBase.left, duration: 0.35, ease: "elastic.out(1,0.4)" }, 0.55)
      .to(ears.right.rotation, { z: state.earBase.right, duration: 0.35, ease: "elastic.out(1,0.4)" }, 0.55)
      .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.42, ease: "elastic.out(1,0.45)" }, 0.68);
    return new Promise((resolve) => tl.eventCallback("onComplete", () => {
      state.squashActive = false;
      resolve();
    }));
  }

  function wave() {
    if (state.disposed) return Promise.resolve();
    state.lookTarget = null;
    state.waving = true;
    const tl = gsap.timeline({ onComplete: () => { state.waving = false; } });
    tl.to(arms.right.rotation, { z: -2.25, duration: 0.28, ease: "back.out(2.2)" }, 0)
      .to(headTilt, { z: 0.13, x: -0.05, duration: 0.25 }, 0.05)
      .to(arms.right.rotation, { z: -1.82, duration: 0.17, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0.34)
      .to(arms.right.rotation, { z: state.armBase.right, duration: 0.32, ease: "power2.inOut" }, 1.5)
      .to(headTilt, { z: 0, x: 0, duration: 0.3 }, 1.55);
    return new Promise((resolve) => tl.eventCallback("onComplete", () => {
      state.waving = false;
      resolve();
    }));
  }

  function scare() {
    if (state.disposed) return Promise.resolve();
    state.walking = false;
    state.squashActive = true;
    state.lookTarget = null;
    gsap.killTweensOf([rig.scale, hop.position, rig.rotation]);
    const forward = new THREE.Vector3(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y));
    const back = forward.multiplyScalar(-0.38);
    const tl = gsap.timeline({
      onComplete: () => {
        state.squashActive = false;
        gsap.to(eyeGroups.map((e) => e.scale), { x: 1, y: 1, duration: 0.2 });
        gsap.to(rig.rotation, { z: 0, duration: 0.15 });
      },
    });
    tl.to(rig.scale, { x: 0.86, y: 1.2, z: 0.86, duration: 0.1, ease: "power2.out" }, 0)
      .to(hop.position, { y: 0.38, duration: 0.2, ease: "power2.out" }, 0.05)
      .to(root.position, { x: root.position.x + back.x, z: root.position.z + back.z, duration: 0.26, ease: "power2.out" }, 0.05)
      .to(eyeGroups.map((e) => e.scale), { x: 1.35, y: 1.35, duration: 0.1 }, 0)
      .to(ears.left.rotation, { z: state.earBase.left * 0.15, x: 0.08, duration: 0.1 }, 0)
      .to(ears.right.rotation, { z: state.earBase.right * 0.15, x: 0.08, duration: 0.1 }, 0)
      .to(hop.position, { y: 0, duration: 0.22, ease: "power2.in" }, 0.28)
      .to(rig.scale, { x: 1.15, y: 0.84, z: 1.15, duration: 0.08 }, 0.48)
      .to(rig.rotation, { z: 0.045, duration: 0.045, yoyo: true, repeat: 11, ease: "sine.inOut" }, 0.52)
      .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "elastic.out(1,0.5)" }, 0.62)
      .to(ears.left.rotation, { z: state.earBase.left, x: -0.06, duration: 0.3 }, 0.7)
      .to(ears.right.rotation, { z: state.earBase.right, x: -0.06, duration: 0.3 }, 0.7);
    return new Promise((resolve) => tl.eventCallback("onComplete", resolve));
  }

  function happy() {
    if (state.disposed) return Promise.resolve();
    state.walking = false;
    state.squashActive = true;
    gsap.killTweensOf([rig.scale, hop.position]);
    const burst = () => hearts.burst(worldPos(1.1), { count: 7 });
    const tl = gsap.timeline({
      onComplete: () => {
        state.squashActive = false;
      },
    });
    for (let i = 0; i < 2; i++) {
      const at = i * 0.62;
      tl.to(rig.scale, { x: 1.14, y: 0.82, z: 1.14, duration: 0.09, ease: "power2.out" }, at)
        .to(hop.position, { y: 0.36, duration: 0.24, ease: "power2.out" }, at + 0.07)
        .to(rig.scale, { x: 0.92, y: 1.14, z: 0.92, duration: 0.14, ease: "power1.inOut" }, at + 0.09)
        .to(ears.left.rotation, { z: state.earBase.left - 0.3, duration: 0.15 }, at + 0.08)
        .to(ears.right.rotation, { z: state.earBase.right + 0.3, duration: 0.15 }, at + 0.08)
        .to(hop.position, { y: 0, duration: 0.22, ease: "power2.in" }, at + 0.31)
        .to(rig.scale, { x: 1.1, y: 0.9, z: 1.1, duration: 0.07 }, at + 0.51)
        .to(ears.left.rotation, { z: state.earBase.left, duration: 0.25 }, at + 0.48)
        .to(ears.right.rotation, { z: state.earBase.right, duration: 0.25 }, at + 0.48)
        .call(burst, null, at + 0.28)
        .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.22, ease: "power2.out" }, at + 0.56);
    }
    tl.call(() => {
      state.squashActive = false;
      burst();
    });
    return new Promise((resolve) => tl.eventCallback("onComplete", () => {
      state.squashActive = false;
      resolve();
    }));
  }

  function giggle() {
    if (state.disposed) return Promise.resolve();
    const tl = gsap.timeline();
    tl.to(rig.rotation, { z: 0.055, duration: 0.06, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0)
      .to(headTilt, { z: 0.1, duration: 0.1, yoyo: true, repeat: 3 }, 0)
      .to(rig.scale, { x: 1.06, y: 0.95, z: 1.06, duration: 0.08, yoyo: true, repeat: 3 }, 0)
      .call(() => hearts.burst(worldPos(1.2), { count: 5 }), null, 0.25)
      .to(rig.rotation, { z: 0, duration: 0.2 }, 0.65)
      .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.2 }, 0.65)
      .to(headTilt, { z: 0, duration: 0.2 }, 0.7);
    return new Promise((resolve) => tl.eventCallback("onComplete", resolve));
  }

  function lookAt(vec3) {
    state.lookTarget = vec3 ? vec3.clone() : null;
  }

  function setOutfit(outfit = "casual") {
    const party = outfit === "party";
    crown.visible = party;
    cape.visible = party;
    if (party) {
      crown.scale.setScalar(0.01);
      cape.scale.setScalar(0.01);
      gsap.to(crown.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2.5)" });
      gsap.to(cape.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: "back.out(1.8)" });
    }
  }

  function setPosition(x, y, z) {
    root.position.set(x, y, z);
  }

  function setWalking(walking, speed = 1) {
    if (state.disposed) return;
    state.walking = walking;
    state.walkSpeed = speed;
    if (!walking) {
      gsap.to(hop.position, { y: 0, duration: 0.12, ease: "power2.out" });
    }
  }

  function dispose() {
    state.disposed = true;
    gsap.killTweensOf([root.position, rig.scale, rig.rotation, hop.position, arms.left.rotation, arms.right.rotation, headTilt]);
    dust.dispose();
    hearts.dispose();
    disposeGroup(root);
    disposeGroup(effects);
  }

  return {
    group: root,
    effects,
    update,
    idle,
    walk,
    jump,
    wave,
    scare,
    happy,
    giggle,
    lookAt,
    blink: blinkNow,
    closeEyes,
    openEyes,
    setOutfit,
    setPosition,
    setWalking,
    dispose,
    interactive,
    get height() {
      return 1.32;
    },
    get position() {
      return root.position;
    },
    get rotation() {
      return root.rotation;
    },
    get walking() {
      return state.walking;
    },
  };
}
