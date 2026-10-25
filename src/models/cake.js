import * as THREE from "three";
import gsap from "gsap";
import {
  COLORS,
  mat,
  basicMat,
  makeStarShape,
  makeSprayParticles,
  makeGlowTexture,
  disposeGroup,
  rand,
  pick,
} from "./props.js";

/**
 * A three-tier pastel birthday cake with candles that can be blown out.
 * Returns { group, update, blowCandle, blowAll, relight, interactives, ... }
 */
export function createCake() {
  const group = new THREE.Group();
  group.name = "birthdayCake";

  const pink = mat(0xffb6d5, { roughness: 0.65 });
  const cream = mat(0xfff3e4, { roughness: 0.7 });
  const lilac = mat(0xc9a7ff, { roughness: 0.7 });
  const raspberry = mat(0xff5c9e, { roughness: 0.6 });
  const gold = mat(COLORS.gold, { roughness: 0.3, metalness: 0.35 });
  const plateMat = mat(0xfff6ee, { roughness: 0.35, metalness: 0.1 });

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.88, 0.045, 48), plateMat);
  plate.position.y = 0.022;
  plate.receiveShadow = true;
  plate.castShadow = true;
  group.add(plate);
  const plateRim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.018, 8, 48), gold);
  plateRim.rotation.x = Math.PI / 2;
  plateRim.position.y = 0.045;
  group.add(plateRim);

  const tiers = [
    { radius: 0.7, height: 0.35, y: 0.215, color: pink, frosting: cream },
    { radius: 0.5, height: 0.35, y: 0.565, color: cream, frosting: mat(0xffb6d5, { roughness: 0.65 }) },
    { radius: 0.3, height: 0.35, y: 0.915, color: lilac, frosting: cream },
  ];

  for (const tier of tiers) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(tier.radius, tier.radius, tier.height, 48), tier.color);
    mesh.position.y = tier.y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // gold rim beads
    if (tier.radius > 0.6) {
      const beadGeo = new THREE.SphereGeometry(0.018, 8, 6);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const bead = new THREE.Mesh(beadGeo, gold);
        bead.position.set(Math.cos(a) * (tier.radius + 0.005), tier.y - tier.height / 2 + 0.02, Math.sin(a) * (tier.radius + 0.005));
        group.add(bead);
      }
    }
  }

  // raspberry ribbon around the bottom tier
  const ribbon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.706, 0.706, 0.05, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xff5c9e, roughness: 0.55, side: THREE.DoubleSide })
  );
  ribbon.position.y = 0.24;
  group.add(ribbon);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), raspberry);
    bow.position.set(Math.cos(a) * 0.71, 0.24, Math.sin(a) * 0.71);
    bow.scale.set(1.4, 0.8, 0.5);
    group.add(bow);
  }

  // frosting drips
  const dripSphere = new THREE.SphereGeometry(0.032, 10, 8);
  const dripGeo = new THREE.CapsuleGeometry(0.018, 0.1, 4, 8);
  for (const tier of tiers) {
    const topY = tier.y + tier.height / 2;
    const count = tier.radius > 0.6 ? 18 : tier.radius > 0.4 ? 14 : 10;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand(-0.08, 0.08);
      const len = rand(0.06, 0.16);
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * (tier.radius - 0.012), topY - 0.004, Math.sin(a) * (tier.radius - 0.012));
      const blob = new THREE.Mesh(dripSphere, tier.frosting);
      blob.scale.set(1.45, 0.7, 0.8);
      g.add(blob);
      const drop = new THREE.Mesh(dripGeo, tier.frosting);
      drop.position.y = -len / 2 - 0.006;
      drop.scale.set(0.85, len / 0.1, 0.75);
      g.add(drop);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), tier.frosting);
      tip.position.y = -len - 0.01;
      tip.scale.set(1, 1.3, 1);
      g.add(tip);
      group.add(g);
    }
  }

  // piped cream swirls around the base
  const swirlGeo = new THREE.SphereGeometry(0.042, 10, 8);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const swirl = new THREE.Mesh(swirlGeo, cream);
    swirl.position.set(Math.cos(a) * 0.715, 0.062, Math.sin(a) * 0.715);
    swirl.scale.set(1.25, 0.72, 1);
    group.add(swirl);
  }

  // sprinkles, instanced
  const sprinkleGeo = new THREE.CapsuleGeometry(0.0065, 0.026, 2, 4);
  const sprinkleMat = new THREE.MeshStandardMaterial({ roughness: 0.45 });
  const sprinkleColors = [0xff5c9e, 0xffd66b, 0xa8d8ff, 0xa8f0d1, 0xc9a7ff, 0xfff3f8];
  const sprinkleCount = 76;
  const sprinkles = new THREE.InstancedMesh(sprinkleGeo, sprinkleMat, sprinkleCount);
  const dummy = new THREE.Object3D();
  let si = 0;
  for (const tier of tiers) {
    const n = tier.radius > 0.6 ? 30 : tier.radius > 0.4 ? 24 : 22;
    for (let i = 0; i < n && si < sprinkleCount; i++, si++) {
      const a = rand(0, Math.PI * 2);
      const y = tier.y + rand(-tier.height / 2 + 0.03, tier.height / 2 - 0.03);
      dummy.position.set(Math.cos(a) * (tier.radius + 0.004), y, Math.sin(a) * (tier.radius + 0.004));
      dummy.rotation.set(rand(-0.8, 0.8), a + Math.PI / 2, rand(-0.8, 0.8));
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      sprinkles.setMatrixAt(si, dummy.matrix);
      sprinkles.setColorAt(si, new THREE.Color(pick(sprinkleColors)));
    }
  }
  for (; si < sprinkleCount; si++) {
    dummy.position.set(0, -999, 0);
    dummy.updateMatrix();
    sprinkles.setMatrixAt(si, dummy.matrix);
  }
  if (sprinkles.instanceColor) sprinkles.instanceColor.needsUpdate = true;
  group.add(sprinkles);

  // strawberries + cherries on top
  const topY = tiers[2].y + tiers[2].height / 2;
  const berryMat = mat(0xff3b63, { roughness: 0.45 });
  const leafMat = mat(0x5c9b73, { roughness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), berryMat);
    berry.position.set(Math.cos(a) * 0.255, topY + 0.04, Math.sin(a) * 0.255);
    berry.scale.set(1, 1.25, 1);
    berry.castShadow = true;
    group.add(berry);
    for (let l = 0; l < 3; l++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 5), leafMat);
      const la = (l / 3) * Math.PI * 2;
      leaf.position.set(berry.position.x + Math.cos(la) * 0.025, topY + 0.1, berry.position.z + Math.sin(la) * 0.025);
      leaf.rotation.z = Math.cos(la) * 0.9;
      leaf.rotation.x = Math.sin(la) * 0.9;
      group.add(leaf);
    }
    const seedGeo = new THREE.SphereGeometry(0.006, 4, 3);
    for (let s = 0; s < 5; s++) {
      const seed = new THREE.Mesh(seedGeo, mat(0xffe08a));
      const sa = rand(0, Math.PI * 2);
      seed.position.set(
        berry.position.x + Math.cos(sa) * 0.045,
        topY + rand(0.01, 0.08),
        berry.position.z + Math.sin(sa) * 0.045
      );
      group.add(seed);
    }
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 1.2;
    const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), berryMat);
    cherry.position.set(Math.cos(a) * 0.24, topY + 0.035, Math.sin(a) * 0.24);
    cherry.scale.set(1, 0.9, 1);
    group.add(cherry);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.09, 4), leafMat);
    stem.position.set(cherry.position.x, topY + 0.1, cherry.position.z);
    stem.rotation.z = 0.25;
    group.add(stem);
  }

  // gold star topper
  const star = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeStarShape(0.16, 0.068, 5), {
      depth: 0.035,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.01,
      bevelThickness: 0.008,
    }),
    gold
  );
  star.position.set(0, 1.82, 0);
  group.add(star);
  const starGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture("255,226,140"), color: 0xffd66b, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  starGlow.position.set(0, 1.82, 0.02);
  starGlow.scale.set(0.6, 0.6, 1);
  group.add(starGlow);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.7, 5), mat(0xe6d4b0));
  stick.position.set(0, 1.46, 0);
  group.add(stick);

  // candles
  const candleColors = [
    [0xff9ec9, 0xfff3e4],
    [0xa8f0d1, 0xfff3e4],
    [0xc9a7ff, 0xfff3e4],
    [0xa8d8ff, 0xfff3e4],
    [0xffd1a8, 0xfff3e4],
  ];
  const candles = [];
  const candleRadius = 0.145;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const candle = new THREE.Group();
    candle.position.set(Math.cos(a) * candleRadius, topY, Math.sin(a) * candleRadius);
    const bodyGroup = new THREE.Group();
    for (let s = 0; s < 3; s++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.1, 12),
        mat(candleColors[i][s % 2], { roughness: 0.6 })
      );
      seg.position.y = 0.05 + s * 0.1;
      seg.castShadow = true;
      bodyGroup.add(seg);
    }
    candle.add(bodyGroup);
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.035, 4), basicMat(0x2a1a1a));
    wick.position.y = 0.37;
    candle.add(wick);
    const flameGroup = new THREE.Group();
    flameGroup.position.y = 0.41;
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb13d, transparent: true, opacity: 0.95, toneMapped: false })
    );
    outer.scale.set(0.8, 1.9, 0.8);
    flameGroup.add(outer);
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff0a8, toneMapped: false })
    );
    inner.scale.set(0.7, 1.4, 0.7);
    inner.position.y = -0.01;
    flameGroup.add(inner);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: makeGlowTexture("255,180,80"), color: 0xffb13d, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.scale.set(0.22, 0.22, 1);
    flameGroup.add(glow);
    candle.add(flameGroup);

    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.46, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hit.position.y = 0.23;
    hit.userData.type = "candle";
    hit.userData.candleIndex = i;
    candle.add(hit);

    group.add(candle);
    candles.push({
      group: candle,
      flame: flameGroup,
      hit,
      lit: true,
      basePos: candle.position.clone(),
      phase: Math.random() * Math.PI * 2,
    });
  }

  // candle light
  const candleLight = new THREE.PointLight(0xffb766, 2.2, 4.5, 2);
  candleLight.position.set(0, 1.48, 0.1);
  group.add(candleLight);

  const smoke = makeSprayParticles("smoke", { count: 32 });
  group.add(smoke.object3D);
  const sparkles = makeSprayParticles("sparkles", { count: 100 });
  group.add(sparkles.object3D);

  let litCount = 5;
  let time = 0;

  function refreshLight() {
    candleLight.visible = litCount > 0;
  }

  function lightCandle(i, instant = false) {
    const c = candles[i];
    if (!c || c.lit) return Promise.resolve();
    c.lit = true;
    litCount += 1;
    refreshLight();
    c.flame.visible = true;
    gsap.killTweensOf(c.flame.scale);
    if (instant) {
      c.flame.scale.set(1, 1, 1);
      return Promise.resolve();
    }
    c.flame.scale.set(0.01, 0.01, 0.01);
    return new Promise((resolve) => {
      gsap.to(c.flame.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.28,
        ease: "back.out(2.5)",
        onComplete: resolve,
      });
    });
  }

  function setLitAll(lit) {
    litCount = 0;
    candles.forEach((c) => {
      c.lit = lit;
      c.flame.visible = lit;
      gsap.killTweensOf(c.flame.scale);
      c.flame.scale.setScalar(lit ? 1 : 0.01);
      if (lit) litCount += 1;
    });
    refreshLight();
    if (!lit) candleLight.intensity = 0;
  }

  function blowCandle(i) {
    const c = candles[i];
    if (!c || !c.lit) return Promise.resolve();
    c.lit = false;
    litCount--;
    refreshLight();
    const flameWorld = new THREE.Vector3();
    c.flame.getWorldPosition(flameWorld);
    const local = group.worldToLocal(flameWorld.clone());
    smoke.burst(local, { count: 7, color: 0xe0d6e6 });
    sparkles.burst(local, { count: 8, colors: [0xffb13d, 0xffd66b], speed: 0.5, life: 0.6, spread: 0.1 });
    gsap.killTweensOf(c.flame.scale);
    return new Promise((resolve) => {
      gsap.to(c.flame.scale, {
        x: 0.01,
        y: 0.01,
        z: 0.01,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          c.flame.visible = false;
          resolve();
        },
      });
    });
  }

  function blowAll() {
    const ps = [];
    for (let i = 0; i < candles.length; i++) {
      ps.push(new Promise((resolve) => {
        setTimeout(() => {
          blowCandle(i).then(resolve);
        }, i * 180);
      }));
    }
    return Promise.all(ps);
  }

  function relight() {
    litCount = candles.length;
    refreshLight();
    candles.forEach((c) => {
      c.lit = true;
      c.flame.visible = true;
      gsap.killTweensOf(c.flame.scale);
      gsap.to(c.flame.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "back.out(2)" });
    });
  }

  function update(dt) {
    time += dt;
    for (const c of candles) {
      if (!c.lit) continue;
      const f = 0.9 + Math.sin(time * 11 + c.phase) * 0.12 + Math.sin(time * 23 + c.phase * 2) * 0.06;
      c.flame.scale.x = f;
      c.flame.scale.z = f;
      c.flame.scale.y = 1 + Math.sin(time * 8 + c.phase) * 0.12;
      c.flame.rotation.z = Math.sin(time * 6 + c.phase) * 0.08;
    }
    const ratio = litCount / candles.length;
    candleLight.intensity = litCount > 0 ? 1.3 * ratio + Math.sin(time * 9) * 0.18 : 0;
    starGlow.material.opacity = 0.45 + Math.sin(time * 1.6) * 0.12;
    star.rotation.y = Math.sin(time * 0.7) * 0.2;
    smoke.update(dt);
    sparkles.update(dt);
  }

  function dispose() {
    candles.forEach((c) => gsap.killTweensOf(c.flame.scale));
    smoke.dispose();
    sparkles.dispose();
    disposeGroup(group);
  }

  return {
    group,
    update,
    blowCandle,
    blowAll,
    relight,
    lightCandle,
    setLitAll,
    interactives: candles.map((c) => c.hit),
    candles,
    dispose,
    get litCount() {
      return litCount;
    },
    get allBlown() {
      return litCount === 0;
    },
  };
}
