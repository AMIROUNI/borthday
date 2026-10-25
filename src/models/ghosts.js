import * as THREE from "three";
import gsap from "gsap";
import { makeGlowTexture, disposeGroup } from "./props.js";

const GHOST_STYLE = {
  classic: {
    color: 0xdff6ff,
    emissive: 0x4b8dff,
    opacity: 0.75,
    scale: 1,
    floatY: 0.12,
    speed: 1.15,
    chaseSpeed: 1.9,
    radius: 0.55,
    bob: 0.12,
  },
  kid: {
    color: 0xffe8f4,
    emissive: 0xff7eb6,
    opacity: 0.72,
    scale: 0.62,
    floatY: 0.1,
    speed: 1.35,
    chaseSpeed: 2.15,
    radius: 0.38,
    bob: 0.16,
  },
  lantern: {
    color: 0xc8ffe8,
    emissive: 0x5cffb0,
    opacity: 0.72,
    scale: 1.05,
    floatY: 0.16,
    speed: 1.05,
    chaseSpeed: 1.8,
    radius: 0.58,
    bob: 0.1,
  },
  shadow: {
    color: 0x050208,
    emissive: 0xff2b4d,
    opacity: 0.86,
    scale: 1.1,
    floatY: 1.12,
    speed: 1.5,
    chaseSpeed: 2.35,
    radius: 0.62,
    bob: 0.04,
  },
  boss: {
    color: 0xc9e9ff,
    emissive: 0x2b5cff,
    opacity: 0.78,
    scale: 2.55,
    floatY: 0.2,
    speed: 0.95,
    chaseSpeed: 1.7,
    radius: 1.5,
    bob: 0.18,
  },
};

function sheetGeometry(scale = 1) {
  const points = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    const r = 0.08 + Math.sin(t * Math.PI) * 0.48;
    points.push(new THREE.Vector2(r * scale, t * 1.55 * scale));
  }
  return new THREE.LatheGeometry(points, 22);
}

function addWavyHem(group, material, scale, count = 6) {
  const geo = new THREE.ConeGeometry(0.16 * scale, 0.42 * scale, 6, 1, true);
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const flap = new THREE.Mesh(geo, material);
    flap.position.set(Math.cos(a) * 0.3 * scale, -0.08 * scale, Math.sin(a) * 0.3 * scale);
    flap.rotation.z = Math.PI;
    flap.rotation.y = -a;
    flap.scale.y = 0.8 + (i % 3) * 0.15;
    group.add(flap);
  }
}

function addEyes(group, scale, color = 0x0a0610, pupil = 0x9fe8ff, big = false) {
  const eyeGeo = new THREE.SphereGeometry((big ? 0.085 : 0.062) * scale, 14, 10);
  const pupilGeo = new THREE.SphereGeometry((big ? 0.025 : 0.018) * scale, 10, 8);
  const eyeMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.25,
    emissive: 0x050308,
    emissiveIntensity: 0.2,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: pupil,
    emissive: pupil,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.14 * scale, 1.08 * scale, 0.4 * scale);
    eye.scale.set(1, 1.15, 0.55);
    group.add(eye);
    const p = new THREE.Mesh(pupilGeo, pupilMat);
    p.position.set(side * 0.14 * scale, 1.08 * scale, 0.44 * scale);
    group.add(p);
  }
}

function addMouth(group, scale, color = 0x160710) {
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.095 * scale, 0.03 * scale, 8, 18),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  );
  mouth.position.set(0, 0.82 * scale, 0.42 * scale);
  mouth.scale.set(1, 1.2, 0.55);
  group.add(mouth);
}

function addArms(group, scale, material) {
  const geo = new THREE.CapsuleGeometry(0.06 * scale, 0.32 * scale, 5, 8);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(geo, material);
    arm.position.set(side * 0.48 * scale, 0.78 * scale, 0.05 * scale);
    arm.rotation.z = side * 0.75;
    group.add(arm);
  }
}

function addWisps(group, scale) {
  const tex = makeGlowTexture("190,235,255");
  const wisps = [];
  for (let i = 0; i < 4; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        color: 0xbfe9ff,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    const a = (i / 4) * Math.PI * 2;
    sprite.position.set(Math.cos(a) * 0.42 * scale, 0.25 + i * 0.24, Math.sin(a) * 0.32 * scale);
    sprite.scale.setScalar(0.22 * scale);
    group.add(sprite);
    wisps.push({ sprite, phase: i * 1.7, baseX: sprite.position.x, baseZ: sprite.position.z });
  }
  return wisps;
}

function makeLantern(scale) {
  const group = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.26 * scale, 8),
    new THREE.MeshStandardMaterial({
      color: 0xbfffd9,
      emissive: 0x5cff9b,
      emissiveIntensity: 2.4,
      transparent: true,
      opacity: 0.8,
      roughness: 0.2,
    })
  );
  group.add(glass);
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.16 * scale, 0.12 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b1b16, roughness: 0.8 })
  );
  cap.position.y = 0.18 * scale;
  group.add(cap);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.1 * scale, 0.018 * scale, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x2b1b16, roughness: 0.8 })
  );
  handle.position.y = 0.25 * scale;
  group.add(handle);
  const light = new THREE.PointLight(0x7cff9b, 2.6, 5.5, 1.4);
  light.position.y = 0.02 * scale;
  group.add(light);
  group.position.set(0.55 * scale, 0.95 * scale, 0.15 * scale);
  return { group, light, glass };
}

function makeShadowBody() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.95);
  shape.bezierCurveTo(-0.46, 1.9, -0.7, 1.25, -0.62, 0.55);
  shape.bezierCurveTo(-0.58, 0.22, -0.7, 0.02, -0.5, -0.05);
  shape.bezierCurveTo(-0.3, -0.13, -0.18, 0.06, 0, -0.02);
  shape.bezierCurveTo(0.18, 0.06, 0.3, -0.13, 0.5, -0.05);
  shape.bezierCurveTo(0.7, 0.02, 0.58, 0.22, 0.62, 0.55);
  shape.bezierCurveTo(0.7, 1.25, 0.46, 1.9, 0, 1.95);
  const geo = new THREE.ShapeGeometry(shape, 18);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x050208,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, material: mat };
}

export function createGhost(type = "classic") {
  const style = GHOST_STYLE[type] || GHOST_STYLE.classic;
  const group = new THREE.Group();
  group.name = `ghost-${type}`;
  group.scale.setScalar(style.scale);

  const materials = [];
  const baseEmissive = [];
  let wisps = [];
  let lantern = null;
  let shadow = null;

  if (type === "shadow") {
    shadow = makeShadowBody();
    group.add(shadow.mesh);
    materials.push(shadow.material);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2b4d });
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeMat);
      eye.position.set(side * 0.17, 1.34, 0.03);
      eye.scale.set(1.1, 0.7, 0.5);
      group.add(eye);
    }
  } else {
    const mat = new THREE.MeshStandardMaterial({
      color: style.color,
      emissive: style.emissive,
      emissiveIntensity: type === "boss" ? 0.8 : 0.55,
      transparent: true,
      opacity: style.opacity,
      roughness: 0.55,
      metalness: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    materials.push(mat);
    baseEmissive.push({ material: mat, color: mat.emissive.clone(), intensity: mat.emissiveIntensity });
    const body = new THREE.Mesh(sheetGeometry(), mat);
    group.add(body);
    addWavyHem(group, mat, 1);
    addEyes(group, 1, 0x0a0610, type === "boss" ? 0xff3f91 : 0x9fe8ff, type === "kid" || type === "boss");
    addMouth(group, type === "boss" ? 1.15 : 1, type === "kid" ? 0x8c2b50 : 0x160710);
    addArms(group, type === "boss" ? 1.6 : 1, mat);
    wisps = addWisps(group, type === "boss" ? 1.8 : 1);
    if (type === "lantern") {
      lantern = makeLantern(1);
      group.add(lantern.group);
      materials.push(lantern.glass.material);
      baseEmissive.push({
        material: lantern.glass.material,
        color: lantern.glass.material.emissive.clone(),
        intensity: lantern.glass.material.emissiveIntensity,
      });
    }
    if (type === "boss") {
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x24152f, roughness: 0.8 });
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.55, 8), hornMat);
        horn.position.set(side * 0.28, 1.62, 0.04);
        horn.rotation.z = side * -0.3;
        group.add(horn);
      }
    }
  }

  const state = {
    type,
    mode: "IDLE_FLOAT",
    time: Math.random() * 10,
    active: false,
    stunTimer: 0,
    vanishTimer: 0,
    soundTimer: 1 + Math.random() * 3,
    spawn: { x: 0, z: 0 },
    speed: style.speed,
    chaseSpeed: style.chaseSpeed,
    radius: style.radius,
    bob: style.bob,
    floatY: style.floatY,
    opacity: 1,
    insideWall: false,
    disposed: false,
  };

  function setOpacity(value) {
    state.opacity = value;
    for (const mat of materials) {
      mat.transparent = true;
      mat.opacity = (mat.userData.baseOpacity ?? style.opacity) * value;
    }
  }
  for (const mat of materials) {
    mat.userData.baseOpacity = mat.opacity;
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode === "STUNNED") {
      state.stunTimer = 3;
      for (const entry of baseEmissive) {
        entry.material.emissive.setHex(0xffffff);
        entry.material.emissiveIntensity = 2.8;
      }
    } else if (mode === "VANISH") {
      state.vanishTimer = 1.2;
    } else {
      for (const entry of baseEmissive) {
        entry.material.emissive.copy(entry.color);
        entry.material.emissiveIntensity = entry.intensity;
      }
    }
  }

  function stun(seconds = 3) {
    if (state.mode === "VANISH") return;
    setMode("STUNNED");
    state.stunTimer = seconds;
    gsap.fromTo(
      group.scale,
      { x: style.scale * 1.15, y: style.scale * 1.15, z: style.scale * 1.15 },
      { x: style.scale, y: style.scale, z: style.scale, duration: 0.35, ease: "back.out(2)" }
    );
  }

  function vanish(seconds = 1.2) {
    setMode("VANISH");
    state.vanishTimer = seconds;
  }

  function resetAt(x, z) {
    state.spawn.x = x;
    state.spawn.z = z;
    group.position.set(x, style.floatY, z);
    group.scale.setScalar(style.scale);
    group.visible = true;
    state.active = true;
    state.mode = "IDLE_FLOAT";
    state.stunTimer = 0;
    state.vanishTimer = 0;
    state.soundTimer = 1 + Math.random() * 3;
    setOpacity(1);
    for (const entry of baseEmissive) {
      entry.material.emissive.copy(entry.color);
      entry.material.emissiveIntensity = entry.intensity;
    }
  }

  function moveToward(x, z, speed, dt) {
    const dx = x - group.position.x;
    const dz = z - group.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.001) return dist;
    const step = Math.min(dist, speed * dt);
    group.position.x += (dx / dist) * step;
    group.position.z += (dz / dist) * step;
    if (type !== "shadow") {
      group.rotation.y = Math.atan2(dx, dz);
    }
    return dist;
  }

  function update(dt, opts = {}) {
    if (state.disposed) return;
    state.time += dt;
    const t = state.time;
    const player = opts.player;
    const maze = opts.maze;

    if (state.mode === "STUNNED") {
      state.stunTimer -= dt;
      group.position.y = style.floatY + Math.sin(t * 18) * 0.04;
      if (state.stunTimer <= 0) vanish(1.0);
    } else if (state.mode === "VANISH") {
      state.vanishTimer -= dt;
      group.position.y -= dt * 0.35;
      setOpacity(Math.max(0, state.vanishTimer / 1.2));
      if (state.vanishTimer <= 0) {
        state.active = false;
        group.visible = false;
      }
    } else {
      group.position.y = style.floatY + Math.sin(t * 1.7) * style.bob;
      if (type === "shadow" && player) {
        group.rotation.y = Math.atan2(player.x - group.position.x, player.z - group.position.z);
      } else if (type === "boss") {
        group.rotation.y += Math.sin(t * 0.7) * dt * 0.25;
      }
      const inside = maze ? !maze.canMove(group.position.x, group.position.z, 0.08) : false;
      state.insideWall = inside;
      const target = state.mode === "CHASE" ? 1 : inside ? 0.32 : 0.78;
      setOpacity(state.opacity + (target - state.opacity) * Math.min(1, dt * 4));
    }

    for (const wisp of wisps) {
      wisp.sprite.position.y = 0.3 + Math.sin(t * 1.6 + wisp.phase) * 0.2;
      wisp.sprite.position.x = wisp.baseX + Math.sin(t * 1.1 + wisp.phase) * 0.08;
      wisp.sprite.position.z = wisp.baseZ + Math.cos(t * 1.3 + wisp.phase) * 0.08;
      wisp.sprite.material.opacity = 0.18 + (Math.sin(t * 2.2 + wisp.phase) + 1) * 0.12;
    }
    if (lantern) {
      lantern.light.intensity = 2.2 + Math.sin(t * 7.5) * 0.7;
      lantern.group.rotation.z = Math.sin(t * 1.3) * 0.18;
    }
    if (state.mode === "STUNNED") {
      for (const entry of baseEmissive) {
        entry.material.emissiveIntensity = 2.4 + Math.sin(t * 24) * 1.2;
      }
    }
  }

  function dispose() {
    state.disposed = true;
    for (const mat of materials) mat.dispose?.();
    disposeGroup(group);
  }

  return {
    group,
    type,
    state,
    update,
    moveToward,
    resetAt,
    stun,
    vanish,
    setMode,
    get mode() {
      return state.mode;
    },
    get active() {
      return state.active;
    },
    get position() {
      return group.position;
    },
    get radius() {
      return state.radius;
    },
    dispose,
  };
}

export const GHOST_TYPES = ["classic", "kid", "lantern", "shadow", "boss"];
