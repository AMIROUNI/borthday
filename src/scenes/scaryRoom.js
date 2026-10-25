import * as THREE from "three";
import gsap from "gsap";
import { createRabbit } from "../models/rabbit.js";
import { makeGhost, makeBat, makeCobweb } from "../models/doors.js";
import {
  mat,
  basicMat,
  emissiveMat,
  canvasTexture,
  makeFloorTexture,
  makeScaryWallpaper,
  makeGlowTexture,
  makeLabelSprite,
  makeSprayParticles,
  disposeGroup,
  rand,
} from "../models/props.js";
import { CONFIG } from "../config.js";

function makeCauldron() {
  const group = new THREE.Group();
  const iron = mat(0x2c2333, { roughness: 0.55, metalness: 0.35 });
  const pts = [
    new THREE.Vector2(0.02, 0),
    new THREE.Vector2(0.28, 0.03),
    new THREE.Vector2(0.4, 0.14),
    new THREE.Vector2(0.44, 0.34),
    new THREE.Vector2(0.42, 0.52),
    new THREE.Vector2(0.34, 0.58),
  ];
  const pot = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), iron);
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 8, 28), iron);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.57;
  group.add(rim);
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 14, Math.PI), iron);
    handle.position.set(side * 0.4, 0.4, 0);
    handle.rotation.y = Math.PI / 2;
    handle.rotation.z = side * Math.PI / 2;
    group.add(handle);
  }
  const liquid = new THREE.Mesh(
    new THREE.CircleGeometry(0.31, 28),
    new THREE.MeshStandardMaterial({
      color: 0x4aff5a,
      emissive: 0x2aff4a,
      emissiveIntensity: 2.1,
      roughness: 0.25,
      transparent: true,
      opacity: 0.92,
    })
  );
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 0.555;
  group.add(liquid);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("124,255,107"),
      color: 0x7cff6b,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.position.y = 0.7;
  glow.scale.set(1.4, 1.0, 1);
  group.add(glow);

  // firewood
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.55, 6),
      mat(0x4a3026, { roughness: 1 })
    );
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 4) * Math.PI;
    log.position.set(0, 0.055, 0);
    group.add(log);
  }
  for (let i = 0; i < 3; i++) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), emissiveMat(i === 1 ? 0xffd66b : 0xff7a2f, 2.4));
    flame.position.set((i - 1) * 0.09, 0.12 + (i === 1 ? 0.06 : 0), 0.02);
    group.add(flame);
  }

  // bubbles
  const bubbles = [];
  for (let i = 0; i < 11; i++) {
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(rand(0.022, 0.055), 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0x8dff9a,
        emissive: 0x4aff6a,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.55,
        roughness: 0.2,
      })
    );
    b.userData.phase = Math.random() * 1;
    b.userData.speed = rand(0.15, 0.35);
    b.userData.x = rand(-0.24, 0.24);
    b.userData.z = rand(-0.24, 0.24);
    group.add(b);
    bubbles.push(b);
  }

  const light = new THREE.PointLight(0x7cff6b, 1.7, 4.5, 2);
  light.position.set(0, 0.9, 0.1);
  group.add(light);
  const smoke = makeSprayParticles("smoke", { count: 20 });
  group.add(smoke.object3D);
  const sparkles = makeSprayParticles("sparkles", { count: 80 });
  group.add(sparkles.object3D);
  let time = 0;
  let smokeTimer = 0;
  return {
    group,
    light,
    update(dt) {
      time += dt;
      light.intensity = 1.3 + Math.sin(time * 4.2) * 0.25 + Math.random() * 0.12;
      glow.material.opacity = 0.38 + Math.sin(time * 3.4) * 0.12;
      for (const b of bubbles) {
        b.userData.phase += dt * b.userData.speed;
        const t = (b.userData.phase % 1);
        b.position.set(
          b.userData.x + Math.sin(time * 2 + b.userData.phase * 7) * 0.03,
          0.56 + t * 0.55,
          b.userData.z + Math.cos(time * 2 + b.userData.phase * 5) * 0.03
        );
        b.scale.setScalar(1 - t * 0.7);
        b.material.opacity = 0.55 * (1 - t);
      }
      smokeTimer -= dt;
      if (smokeTimer <= 0) {
        smokeTimer = 0.8 + Math.random() * 1.1;
        smoke.burst(new THREE.Vector3(rand(-0.15, 0.15), 0.65, rand(-0.15, 0.15)), { count: 1, color: 0x8fd49a });
      }
      smoke.update(dt);
      sparkles.update(dt);
    },
    dispose() {
      smoke.dispose();
      sparkles.dispose();
      disposeGroup(group);
    },
  };
}

function makeSkeleton() {
  const group = new THREE.Group();
  const bone = mat(0xd9d0c3, { roughness: 0.88 });
  const boneDark = mat(0xb9ad9e, { roughness: 0.9 });
  const black = basicMat(0x1a0d22);

  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), bone);
  pelvis.position.y = 0.78;
  pelvis.scale.set(1.1, 0.7, 0.8);
  group.add(pelvis);
  for (let i = 0; i < 3; i++) {
    const spine = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.1, 4, 8), boneDark);
    spine.position.y = 0.9 + i * 0.13;
    group.add(spine);
  }
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.16 - i * 0.012, 0.018, 6, 20), bone);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = 1.03 + i * 0.08;
    rib.scale.z = 0.7;
    group.add(rib);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.12, 8), boneDark);
  neck.position.y = 1.34;
  group.add(neck);

  const skullGroup = new THREE.Group();
  skullGroup.position.y = 1.5;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), bone);
  skull.scale.set(1, 1.12, 0.95);
  skullGroup.add(skull);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.13), bone);
  jaw.position.set(0, -0.14, 0.02);
  skullGroup.add(jaw);
  for (const side of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), black);
    socket.position.set(side * 0.06, 0.02, 0.14);
    socket.scale.z = 0.5;
    skullGroup.add(socket);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), emissiveMat(0x7cff6b, 2));
    glow.position.set(side * 0.06, 0.02, 0.165);
    skullGroup.add(glow);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.045, 4), black);
  nose.position.set(0, -0.06, 0.16);
  nose.rotation.x = Math.PI;
  skullGroup.add(nose);
  for (let i = 0; i < 3; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.04, 0.02), bone);
    tooth.position.set((i - 1) * 0.035, -0.16, 0.08);
    skullGroup.add(tooth);
  }
  group.add(skullGroup);

  const armGroups = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.2, 1.26, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.027, 0.2, 4, 8), bone);
    upper.position.y = -0.13;
    arm.add(upper);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.18, 4, 8), bone);
    fore.position.set(0, -0.36, 0.02);
    fore.rotation.x = 0.25;
    arm.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), bone);
    hand.position.set(0, -0.48, 0.05);
    arm.add(hand);
    arm.rotation.z = side * 0.18;
    group.add(arm);
    armGroups.push({ arm, side });
  }

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.1, 0.76, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.25, 4, 8), bone);
    thigh.position.y = -0.17;
    leg.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.23, 4, 8), bone);
    shin.position.set(0, -0.48, 0.02);
    leg.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.055, 0.17), bone);
    foot.position.set(0, -0.63, 0.06);
    leg.add(foot);
    group.add(leg);
  }

  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.8, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  hit.position.y = 0.9;
  hit.userData.type = "skeleton";
  group.add(hit);

  const bubble = makeLabelSprite("Ghalta fel bab ya Arnouba 😂", {
    width: 640,
    height: 250,
    font: "600 56px Caveat, cursive",
    scale: 0.9,
    bg: "rgba(255,248,251,0.97)",
    border: "#7cff6b",
    color: "#4a3355",
  });
  bubble.position.set(0.1, 2.2, 0.1);
  bubble.visible = false;
  bubble.userData.baseScale = bubble.scale.clone();
  group.add(bubble);

  let time = 0;
  let waveTimer = 0;
  return {
    group,
    hit,
    bubble,
    wave() {
      waveTimer = 2.4;
    },
    update(dt) {
      time += dt;
      waveTimer = Math.max(0, waveTimer - dt);
      const right = armGroups[1].arm;
      const base = -0.2;
      if (waveTimer > 0) {
        right.rotation.z = -2.1 + Math.sin(time * 12) * 0.3;
        right.rotation.x = 0.1;
      } else {
        right.rotation.z = base + Math.sin(time * 1.4) * 0.08;
        right.rotation.x = Math.sin(time * 1.1) * 0.05;
      }
      armGroups[0].arm.rotation.z = 0.2 + Math.sin(time * 1.2 + 1) * 0.05;
      skullGroup.rotation.y = Math.sin(time * 0.9) * 0.12;
      skullGroup.rotation.z = Math.sin(time * 0.7) * 0.05;
      group.position.y = Math.sin(time * 1.6) * 0.008;
      if (bubble.visible) {
        bubble.position.y = 2.2 + Math.sin(time * 2) * 0.04;
      }
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

function makeFloatingCandle() {
  const group = new THREE.Group();
  const wax = mat(0xfff3e4, { roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.24, 10), wax);
  body.castShadow = true;
  group.add(body);
  for (let i = 0; i < 3; i++) {
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), wax);
    const a = rand(0, Math.PI * 2);
    drip.position.set(Math.cos(a) * 0.045, rand(-0.08, 0.08), Math.sin(a) * 0.045);
    drip.scale.set(1, 1.8, 1);
    group.add(drip);
  }
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 4), basicMat(0x2a1a1a));
  wick.position.y = 0.14;
  group.add(wick);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffb13d, transparent: true, opacity: 0.95, toneMapped: false })
  );
  flame.scale.set(0.7, 1.9, 0.7);
  flame.position.y = 0.19;
  group.add(flame);
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff0a8, toneMapped: false })
  );
  inner.position.y = 0.185;
  group.add(inner);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture("255,180,80"), color: 0xffb13d, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.y = 0.2;
  glow.scale.set(0.45, 0.45, 1);
  group.add(glow);
  return { group, flame, glow, phase: Math.random() * 10 };
}

function makePumpkin() {
  const group = new THREE.Group();
  const orange = mat(0xff8a2f, { roughness: 0.65 });
  const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 18), orange);
  pumpkin.scale.set(1.25, 0.9, 1.25);
  pumpkin.castShadow = true;
  group.add(pumpkin);
  for (let i = 0; i < 6; i++) {
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 5, 24, Math.PI), mat(0xe67824, { roughness: 0.7 }));
    ridge.rotation.y = (i / 6) * Math.PI;
    ridge.rotation.x = Math.PI / 2;
    ridge.scale.set(1.2, 0.9, 1);
    group.add(ridge);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.12, 6), mat(0x5c7a3d));
  stem.position.y = 0.28;
  stem.rotation.z = 0.2;
  group.add(stem);
  const face = new THREE.Group();
  face.position.z = 0.31;
  for (const side of [-1, 1]) {
    const eyeShape = new THREE.Shape();
    eyeShape.moveTo(-0.07, 0);
    eyeShape.lineTo(0.07, 0);
    eyeShape.lineTo(0, 0.09);
    eyeShape.closePath();
    const eye = new THREE.Mesh(new THREE.ShapeGeometry(eyeShape), basicMat(0x1a0d22));
    eye.position.set(side * 0.12, 0.05, 0);
    eye.rotation.z = side * -0.2;
    face.add(eye);
  }
  const mouthShape = new THREE.Shape();
  mouthShape.moveTo(-0.16, -0.09);
  mouthShape.lineTo(-0.1, -0.02);
  mouthShape.lineTo(-0.04, -0.1);
  mouthShape.lineTo(0.03, -0.02);
  mouthShape.lineTo(0.09, -0.1);
  mouthShape.lineTo(0.15, -0.03);
  mouthShape.lineTo(0.1, -0.16);
  mouthShape.lineTo(-0.12, -0.16);
  mouthShape.closePath();
  const mouth = new THREE.Mesh(new THREE.ShapeGeometry(mouthShape), basicMat(0x1a0d22));
  mouth.position.y = -0.02;
  face.add(mouth);
  group.add(face);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture("255,150,60"), color: 0xff9a3d, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.set(0, 0, 0.35);
  glow.scale.set(0.9, 0.9, 1);
  group.add(glow);
  const light = new THREE.PointLight(0xff8a2f, 1.1, 3.4, 2);
  light.position.set(0, 0, 0.45);
  group.add(light);
  return { group, light, glow, phase: Math.random() * 10 };
}

function makeFloatingBook() {
  const group = new THREE.Group();
  const coverMat = mat(0x4b2a5f, { roughness: 0.8 });
  const pagesMat = mat(0xfff3e4, { roughness: 0.9 });
  for (const side of [-1, 1]) {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.24), coverMat);
    cover.position.set(side * 0.16, 0, 0);
    cover.rotation.z = side * 0.18;
    group.add(cover);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.02, 0.22), pagesMat);
    pages.position.set(side * 0.16, 0.03, 0);
    pages.rotation.z = side * 0.18;
    group.add(pages);
  }
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.2), pagesMat);
  page.position.set(0.02, 0.06, 0);
  page.rotation.y = 0.3;
  group.add(page);
  const runes = canvasTexture(256, 192, (ctx, w, h) => {
    ctx.fillStyle = "#fff3e4";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(80,50,90,0.55)";
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(24, 24 + i * 16, rand(80, 190), 2);
    }
    ctx.fillStyle = "#7cff6b";
    ctx.beginPath();
    ctx.arc(w - 50, 44, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  const pageFace = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.19), new THREE.MeshBasicMaterial({ map: runes }));
  pageFace.position.set(0.02, 0.075, 0.001);
  pageFace.rotation.y = 0.3;
  group.add(pageFace);
  let time = 0;
  return {
    group,
    update(dt) {
      time += dt;
      group.rotation.y = Math.sin(time * 0.6) * 0.2;
      group.rotation.z = Math.sin(time * 0.4 + 1) * 0.08;
      group.position.y = group.userData.baseY + Math.sin(time * 1.2) * 0.06;
      page.rotation.y = 0.3 + Math.sin(time * 1.4) * 0.35;
      pageFace.rotation.y = page.rotation.y;
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createScaryRoom(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x150b1e);
  scene.fog = new THREE.FogExp2(0x2a1a3a, 0.095);

  const state = {
    time: 0,
    busy: false,
    entered: false,
    shake: 0,
    nextLightning: 4,
    disposed: false,
  };

  /* ---------------- lights ---------------- */
  const hemi = new THREE.HemisphereLight(0x9a7ab8, 0x0b0610, 0.85);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x9db8ff, 0.75);
  moon.position.set(-1.5, 4.5, -3.5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -3.5;
  moon.shadow.camera.right = 3.5;
  moon.shadow.camera.top = 4;
  moon.shadow.camera.bottom = -2;
  moon.shadow.camera.near = 0.5;
  moon.shadow.camera.far = 12;
  scene.add(moon);

  /* ---------------- room ---------------- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshStandardMaterial({ map: makeFloorTexture(), color: 0x8a7288, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallTex = makeScaryWallpaper();
  for (const [x, z, ry] of [
    [0, -2.5, 0],
    [-2.5, 0, Math.PI / 2],
    [2.5, 0, -Math.PI / 2],
    [0, 2.5, Math.PI],
  ]) {
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 3.2),
      new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 })
    );
    wall.position.set(x, 1.6, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    scene.add(wall);
  }
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshStandardMaterial({ color: 0x1d1029, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.2;
  scene.add(ceiling);
  for (const z of [-1.7, 0.2, 2.0]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5, 0.14, 0.18), mat(0x2e1c36, { roughness: 1 }));
    beam.position.set(0, 3.12, z);
    beam.castShadow = true;
    scene.add(beam);
  }

  // crooked floorboards
  for (let i = 0; i < 6; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(rand(0.5, 1.1), 0.025, 0.14), mat(0x5a4050, { roughness: 1 }));
    board.position.set(rand(-1.8, 1.8), 0.016, rand(-1.8, 1.8));
    board.rotation.y = rand(-0.15, 0.15);
    board.rotation.z = rand(-0.02, 0.02);
    scene.add(board);
  }

  // cobwebs
  const webA = makeCobweb(0.8, 0.65, 1, -1);
  webA.position.set(-2.47, 3.1, -2.47);
  scene.add(webA);
  const webB = makeCobweb(0.6, 0.5, -1, -1);
  webB.position.set(2.47, 3.1, -2.47);
  scene.add(webB);
  const webC = makeCobweb(0.55, 0.5, 1, -1);
  webC.position.set(-2.47, 3.1, 2.4);
  webC.rotation.y = Math.PI / 2;
  scene.add(webC);

  /* ---------------- window + lightning ---------------- */
  const stormTex = canvasTexture(512, 640, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0c0818");
    g.addColorStop(0.5, "#241536");
    g.addColorStop(1, "#3b2448");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = "rgba(40,20,60,0.5)";
      ctx.beginPath();
      ctx.ellipse(rand(0, w), rand(0, h * 0.6), rand(70, 150), rand(24, 60), rand(-0.3, 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = "rgba(160,180,255,0.18)";
      ctx.lineWidth = 1;
      const x = rand(0, w);
      const y = rand(0, h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 22);
      ctx.stroke();
    }
    ctx.strokeStyle = "#dfe8ff";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#bcd4ff";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(w * 0.6, 40);
    ctx.lineTo(w * 0.5, 160);
    ctx.lineTo(w * 0.63, 200);
    ctx.lineTo(w * 0.48, 340);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(180,200,255,0.15)";
    ctx.fillRect(0, 0, w, h);
  });
  const windowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.7),
    new THREE.MeshBasicMaterial({ map: stormTex, toneMapped: false })
  );
  windowPlane.position.set(0.05, 1.9, -2.46);
  scene.add(windowPlane);
  const windowFrame = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.9, 0.13), mat(0x2a1a2a, { roughness: 0.9 }));
    post.position.set(0.05 + side * 0.73, 1.9, -2.4);
    post.rotation.z = side * 0.012;
    windowFrame.add(post);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.13), mat(0x2a1a2a));
  top.position.set(0.05, 2.83, -2.4);
  top.rotation.z = -0.01;
  windowFrame.add(top);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.18), mat(0x2a1a2a));
  bottom.position.set(0.05, 0.97, -2.4);
  windowFrame.add(bottom);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.75, 0.08), mat(0x2a1a2a));
  crossV.position.set(0.05, 1.9, -2.39);
  windowFrame.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.08), mat(0x2a1a2a));
  crossH.position.set(0.05, 1.9, -2.39);
  windowFrame.add(crossH);
  scene.add(windowFrame);
  const flashPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.7),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  flashPlane.position.set(0.05, 1.9, -2.35);
  scene.add(flashPlane);
  const windowLight = new THREE.PointLight(0xbcd4ff, 0, 6, 2);
  windowLight.position.set(0.05, 1.9, -1.7);
  scene.add(windowLight);
  function lightning() {
    const tl = gsap.timeline();
    tl.to(flashPlane.material, { opacity: 0.85, duration: 0.05 })
      .to(windowLight, { intensity: 4.5, duration: 0.05 }, 0)
      .to(flashPlane.material, { opacity: 0.12, duration: 0.08 })
      .to(windowLight, { intensity: 0.8, duration: 0.08 }, "-=0.08")
      .to(flashPlane.material, { opacity: 0.6, duration: 0.05 }, "-=0.01")
      .to(windowLight, { intensity: 3, duration: 0.05 }, "-=0.05")
      .to(flashPlane.material, { opacity: 0, duration: 0.3 }, "-=0.02")
      .to(windowLight, { intensity: 0, duration: 0.35 }, "-=0.3");
    state.shake = Math.max(state.shake, 0.35);
  }

  /* ---------------- props ---------------- */
  const cauldron = makeCauldron();
  cauldron.group.position.set(-1.35, 0, -1.35);
  scene.add(cauldron.group);

  const skeleton = makeSkeleton();
  skeleton.group.position.set(1.25, 0, -1.55);
  skeleton.group.rotation.y = -0.28;
  scene.add(skeleton.group);

  const pumpkin = makePumpkin();
  pumpkin.group.position.set(1.8, 1.55, -2.0);
  scene.add(pumpkin.group);

  const candles = [];
  const candlePositions = [
    [-2.0, 1.25, -0.3],
    [1.75, 1.65, -0.7],
    [2.05, 2.1, 0.7],
  ];
  for (const [x, y, z] of candlePositions) {
    const c = makeFloatingCandle();
    c.group.position.set(x, y, z);
    c.group.userData.baseY = y;
    scene.add(c.group);
    candles.push(c);
  }
  const candleLight = new THREE.PointLight(0xffb36b, 1.0, 4.5, 2);
  candleLight.position.set(0.2, 2.0, 0.2);
  scene.add(candleLight);

  const book = makeFloatingBook();
  book.group.position.set(-1.9, 1.7, -2.15);
  book.group.userData.baseY = 1.7;
  scene.add(book.group);

  // bats
  const bats = [];
  for (let i = 0; i < 3; i++) {
    const bat = makeBat();
    bat.position.set(rand(-1.6, 1.6), rand(1.9, 2.8), rand(-1.8, 1.4));
    bat.scale.setScalar(0.8 + i * 0.12);
    bat.userData.orbit = {
      cx: rand(-1, 1),
      cy: rand(2.0, 2.6),
      cz: rand(-1.2, 0.8),
      rx: rand(0.7, 1.4),
      ry: rand(0.2, 0.5),
      speed: rand(0.4, 0.8),
      phase: Math.random() * 6,
    };
    scene.add(bat);
    bats.push(bat);
  }

  // bones on the floor
  for (let i = 0; i < 5; i++) {
    const bone = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, rand(0.08, 0.16), 3, 6), mat(0xcfc5b6, { roughness: 0.9 }));
    bone.position.set(rand(0.6, 1.9), 0.03, rand(-.8, 0.7));
    bone.rotation.z = rand(-1.2, 1.2);
    bone.rotation.y = rand(0, Math.PI);
    scene.add(bone);
  }

  // ghosts
  const ghostData = [
    { pos: [-1.55, 1.35, -2.0], scale: 0.8, phase: 0.4 },
    { pos: [1.85, 1.5, -0.5], scale: 0.72, phase: 2.1 },
    { pos: [-0.7, 1.85, 1.1], scale: 0.62, phase: 3.7 },
  ];
  const ghosts = [];
  const ghostHearts = makeSprayParticles("hearts", { count: 16 });
  scene.add(ghostHearts.object3D);
  for (const gd of ghostData) {
    const ghost = makeGhost(gd.scale);
    ghost.position.set(...gd.pos);
    ghost.userData.baseY = gd.pos[1];
    ghost.userData.phase = gd.phase;
    ghost.userData.home = new THREE.Vector3(...gd.pos);
    ghost.userData.hidden = false;
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.42 * gd.scale, 10, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hit.position.y = 0.3;
    hit.userData.type = "ghost";
    ghost.add(hit);
    scene.add(ghost);
    ghosts.push({ ghost, hit, ...gd });
  }

  // ghost that pops for the intro
  const booGhost = makeGhost(0.95);
  booGhost.position.set(0, 1.3, 1.35);
  booGhost.visible = false;
  booGhost.scale.setScalar(0.01);
  booGhost.userData.baseScale = 0.95;
  scene.add(booGhost);
  const booBubble = makeLabelSprite("BOOOO! 😱", {
    width: 420,
    height: 220,
    font: "700 76px Fredoka, sans-serif",
    scale: 0.7,
    bg: "rgba(255,248,251,0.96)",
    border: "#ff2b4d",
    color: "#b52a48",
  });
  booBubble.position.set(0, 1.95, 1.3);
  booBubble.visible = false;
  booBubble.userData.baseScale = booBubble.scale.clone();
  scene.add(booBubble);

  // exit arrow
  const arrow = new THREE.Group();
  const arrowMat = emissiveMat(0x7cff6b, 1.8, { transparent: true, opacity: 0.85 });
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.62), arrowMat);
  shaft.position.z = 0.35;
  arrow.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.32, 4), arrowMat);
  head.rotation.x = Math.PI / 2;
  head.rotation.y = Math.PI / 4;
  head.position.z = 0.8;
  arrow.add(head);
  arrow.position.set(0, 0.03, 1.35);
  scene.add(arrow);
  const arrowGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture("124,255,107"), color: 0x7cff6b, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  arrowGlow.position.set(0, 0.25, 1.8);
  arrowGlow.scale.set(1.2, 0.7, 1);
  scene.add(arrowGlow);
  const arrowLabel = makeLabelSprite("Raja3 ⬅", {
    width: 380,
    height: 190,
    font: "600 70px Caveat, cursive",
    scale: 0.62,
    bg: "rgba(20,10,28,0.86)",
    border: "#7cff6b",
    color: "#b8ffb0",
  });
  arrowLabel.position.set(0, 0.55, 1.9);
  scene.add(arrowLabel);
  const arrowHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.4, 1.0),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  arrowHit.position.set(0, 0.2, 1.5);
  arrowHit.userData.type = "exit";
  scene.add(arrowHit);

  /* ---------------- rabbit ---------------- */
  const rabbit = createRabbit();
  rabbit.group.position.set(0, 0, 0.45);
  rabbit.group.rotation.y = Math.PI;
  scene.add(rabbit.group);
  scene.add(rabbit.effects);
  rabbit.interactive.userData.onTap = () => {
    rabbit.giggle();
  };

  // dust / sparkles ambience
  const dust = makeSprayParticles("dust", { count: 20 });
  scene.add(dust.object3D);
  const sparkles = makeSprayParticles("sparkles", { count: 100 });
  scene.add(sparkles.object3D);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const tmp = new THREE.Vector3();

  async function onEnter() {
    state.busy = false;
    ctx.showBack(goBack);
    if (state.entered) return;
    state.entered = true;
    rabbit.setPosition(0, 0, 0.45);
    rabbit.group.rotation.y = Math.PI;
    rabbit.lookAt(new THREE.Vector3(0, 1.3, -1.2));
    await wait(650);
    lightning();
    booGhost.visible = true;
    booGhost.scale.setScalar(0.01);
    booBubble.visible = true;
    booBubble.scale.setScalar(0.001);
    gsap.to(booGhost.scale, { x: booGhost.userData.baseScale, y: booGhost.userData.baseScale, z: booGhost.userData.baseScale, duration: 0.35, ease: "back.out(2.4)" });
    gsap.to(booBubble.scale, { x: booBubble.userData.baseScale.x, y: booBubble.userData.baseScale.y, z: booBubble.userData.baseScale.z, duration: 0.3, ease: "back.out(2)" });
    rabbit.lookAt(booGhost.position);
    await rabbit.scare();
    await ctx.say([CONFIG.texts.scaryRoom[0]]);
    gsap.to(booGhost.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.25, ease: "back.in(2)", onComplete: () => { booGhost.visible = false; } });
    gsap.to(booBubble.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.2, onComplete: () => { booBubble.visible = false; } });
    skeleton.wave();
    skeleton.bubble.visible = true;
    skeleton.bubble.scale.setScalar(0.001);
    gsap.to(skeleton.bubble.scale, {
      x: skeleton.bubble.userData.baseScale.x,
      y: skeleton.bubble.userData.baseScale.y,
      z: skeleton.bubble.userData.baseScale.z,
      duration: 0.4,
      ease: "back.out(2)",
    });
    rabbit.lookAt(skeleton.group.position.clone().setY(1.2));
    await ctx.say([CONFIG.texts.scaryRoom[1]]);
    await ctx.say([CONFIG.texts.scaryRoom[2]]);
    gsap.to(skeleton.bubble.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.25, onComplete: () => { skeleton.bubble.visible = false; } });
    ctx.hint("Tap the arrow or the button to go back ⬅️");
  }

  async function goBack() {
    if (state.busy) return;
    state.busy = true;
    ctx.hideBack();
    ctx.hideHint();
    state.shake = 0.5;
    await wait(250);
    await ctx.transition("hallway", { from: "scary" });
    state.busy = false;
  }

  function onGhostTap(index) {
    const data = ghosts[index];
    if (!data || data.ghost.userData.hidden) return;
    data.ghost.userData.hidden = true;
    const p = new THREE.Vector3();
    data.ghost.getWorldPosition(p);
    p.y += 0.4;
    ghostHearts.burst(p, { count: 5 });
    gsap.to(data.ghost.scale, {
      x: 0.01,
      y: 0.01,
      z: 0.01,
      duration: 0.28,
      ease: "back.in(2)",
      onComplete: () => {
        data.ghost.visible = false;
        setTimeout(() => {
          if (state.disposed) return;
          data.ghost.visible = true;
          data.ghost.userData.hidden = false;
          gsap.to(data.ghost.scale, { x: data.scale, y: data.scale, z: data.scale, duration: 0.45, ease: "back.out(2)" });
        }, 3600);
      },
    });
    ctx.toast("Hihi! 💨", 1200);
  }

  function onSkeletonTap() {
    skeleton.wave();
    skeleton.bubble.visible = true;
    skeleton.bubble.scale.setScalar(0.001);
    gsap.to(skeleton.bubble.scale, {
      x: skeleton.bubble.userData.baseScale.x,
      y: skeleton.bubble.userData.baseScale.y,
      z: skeleton.bubble.userData.baseScale.z,
      duration: 0.35,
      ease: "back.out(2)",
    });
    ctx.toast("Ghalta fel bab ya Arnouba 😂", 2200);
    clearTimeout(onSkeletonTap._t);
    onSkeletonTap._t = setTimeout(() => {
      if (!state.disposed) {
        gsap.to(skeleton.bubble.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.25, onComplete: () => { skeleton.bubble.visible = false; } });
      }
    }, 3200);
  }

  ghosts.forEach((g, i) => {
    g.hit.userData.onTap = () => onGhostTap(i);
  });
  skeleton.hit.userData.onTap = onSkeletonTap;
  arrowHit.userData.onTap = goBack;
  cauldron.group.userData.hit = null;

  function update(dt) {
    if (state.disposed) return;
    state.time += dt;
    const t = state.time;
    rabbit.update(dt);
    cauldron.update(dt);
    skeleton.update(dt);
    pumpkin.update(dt);
    book.update(dt);
    for (const c of candles) {
      c.group.position.y = c.group.userData.baseY + Math.sin(t * 0.9 + c.phase) * 0.08;
      const f = 0.9 + Math.sin(t * 12 + c.phase) * 0.12;
      c.flame.scale.set(f, 1 + Math.sin(t * 9 + c.phase) * 0.1, f);
      c.glow.material.opacity = 0.4 + Math.sin(t * 5 + c.phase) * 0.14;
    }
    candleLight.intensity = 0.75 + Math.sin(t * 8) * 0.16;
    pumpkin.group.position.y = 1.55 + Math.sin(t * 0.8 + pumpkin.phase) * 0.09;
    pumpkin.group.rotation.y = Math.sin(t * 0.5 + pumpkin.phase) * 0.12;
    pumpkin.light.intensity = 0.9 + Math.sin(t * 5 + pumpkin.phase) * 0.2;
    for (const bat of bats) {
      const o = bat.userData.orbit;
      bat.position.x = o.cx + Math.cos(t * o.speed + o.phase) * o.rx;
      bat.position.y = o.cy + Math.sin(t * o.speed * 1.4 + o.phase) * o.ry;
      bat.position.z = o.cz + Math.sin(t * o.speed + o.phase) * 0.4;
      bat.rotation.y = Math.cos(t * o.speed + o.phase) * 0.5;
      for (const wing of bat.userData.wings) {
        wing.rotation.z = Math.sin(t * 10 + o.phase) * 0.7;
      }
    }
    for (const g of ghosts) {
      if (g.ghost.visible) {
        g.ghost.position.y = g.ghost.userData.baseY + Math.sin(t * 1.1 + g.ghost.userData.phase) * 0.1;
        g.ghost.rotation.y = Math.sin(t * 0.7 + g.ghost.userData.phase) * 0.12;
      }
    }
    if (booGhost.visible) {
      booGhost.position.y = 1.3 + Math.sin(t * 2) * 0.04;
      booBubble.position.y = 1.95 + Math.sin(t * 2.2) * 0.03;
    }
    if (skeleton.bubble.visible) skeleton.bubble.position.y = 2.2 + Math.sin(t * 2) * 0.04;

    // lightning
    state.nextLightning -= dt;
    if (state.nextLightning <= 0) {
      lightning();
      state.nextLightning = 6 + Math.random() * 7;
    }
    state.shake = Math.max(0, state.shake - dt * 1.6);

    // ambient particles
    if (Math.random() < dt * 2.5) {
      tmp.set(rand(-2, 2), rand(0.3, 2.6), rand(-2, 1.8));
      dust.burst(tmp, { count: 1, color: 0xb9a8d8 });
    }
    if (Math.random() < dt * 2.0) {
      tmp.set(rand(-1.8, 1.8), rand(0.6, 2.5), rand(-1.8, 1.2));
      sparkles.burst(tmp, { count: 1, speed: 0.2, life: 1.6, spread: 0.3, colors: [0x7cff6b, 0xc9a7ff, 0xff2b4d] });
    }
    dust.update(dt);
    sparkles.update(dt);
    ghostHearts.update(dt);

    arrowLabel.position.y = 0.55 + Math.sin(t * 2) * 0.05;
    arrowGlow.material.opacity = 0.25 + Math.sin(t * 2.4) * 0.12;
  }

  function getCameraPose(aspect, t) {
    const portrait = aspect < 0.82;
    const shake = state.shake;
    const pos = new THREE.Vector3(
      Math.sin(t * 0.4) * 0.04 + (Math.random() - 0.5) * shake * 0.08,
      (portrait ? 1.95 : 1.82) + Math.sin(t * 0.5) * 0.025 + (Math.random() - 0.5) * shake * 0.05,
      (portrait ? 3.35 : 2.95) + (Math.random() - 0.5) * shake * 0.08
    );
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * shake * 0.06,
      1.02 + (Math.random() - 0.5) * shake * 0.04,
      -0.75
    );
    return { position: pos, target, fov: portrait ? 68 : 58 };
  }

  function dispose() {
    state.disposed = true;
    ctx.hideBack();
    rabbit.dispose();
    cauldron.dispose();
    skeleton.dispose();
    pumpkin.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) o.material.dispose?.();
    });
    candles.forEach((c) => disposeGroup(c.group));
    book.dispose();
    ghosts.forEach((g) => disposeGroup(g.ghost));
    ghostHearts.dispose();
    dust.dispose();
    sparkles.dispose();
    disposeGroup(booGhost);
    disposeGroup(booBubble);
    disposeGroup(scene);
  }

  return {
    name: "scary",
    scene,
    update,
    getCameraPose,
    onEnter,
    interactives: [skeleton.hit, ...ghosts.map((g) => g.hit), arrowHit, rabbit.interactive],
    get busy() {
      return state.busy;
    },
    dispose,
  };
}
