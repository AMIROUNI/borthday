import * as THREE from "three";
import gsap from "gsap";
import {
  COLORS,
  mat,
  emissiveMat,
  basicMat,
  canvasTexture,
  makeSignTexture,
  makeCanvasTextTexture,
  roundedBoxGeometry,
  makeHeartShape,
  makeStarShape,
  makeGlowTexture,
  makeHeartTexture,
  makeSprayParticles,
  tubeFromPoints,
  disposeGroup,
  roundRect,
  rand,
  drawFlower,
} from "./props.js";

/* ------------------------------------------------------------------ */
/* shared bits                                                        */
/* ------------------------------------------------------------------ */

function makeHit(type, w = 1.95, h = 2.8, d = 0.5) {
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  hit.position.set(0, h / 2, 0.15);
  hit.userData.type = type;
  return hit;
}

export function makeCobweb(width = 0.7, height = 0.7, flipX = 1, flipY = 1) {
  const positions = [];
  const corner = new THREE.Vector3(0, 0, 0);
  const rays = 6;
  const pts = [];
  for (let i = 0; i <= rays; i++) {
    const a = (i / rays) * (Math.PI / 2);
    const p = new THREE.Vector3(Math.cos(a) * width, Math.sin(a) * height, 0);
    pts.push(p);
    positions.push(corner.x, corner.y, corner.z, p.x, p.y, p.z);
  }
  for (let ring = 1; ring <= 4; ring++) {
    const t = ring / 5;
    for (let i = 0; i < rays; i++) {
      const p1 = pts[i].clone().multiplyScalar(t);
      const p2 = pts[i + 1].clone().multiplyScalar(t);
      const mid = p1.clone().lerp(p2, 0.5).multiplyScalar(0.86);
      positions.push(p1.x, p1.y, p1.z, mid.x, mid.y, mid.z);
      positions.push(mid.x, mid.y, mid.z, p2.x, p2.y, p2.z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const web = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color: 0xd6cbe4, transparent: true, opacity: 0.38, depthWrite: false })
  );
  web.scale.x = flipX;
  web.scale.y = flipY;
  return web;
}

export function makeBat(color = 0x2a173b) {
  const g = new THREE.Group();
  const bodyMat = mat(color, { roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 9), bodyMat);
  body.scale.set(1, 0.9, 0.7);
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), bodyMat);
  head.position.y = 0.035;
  g.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.04, 6), bodyMat);
    ear.position.set(side * 0.026, 0.075, 0);
    ear.rotation.z = side * 0.25;
    g.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 5), emissiveMat(0xff6b8a, 2));
    eye.position.set(side * 0.017, 0.043, 0.035);
    g.add(eye);
  }
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.02);
  wingShape.quadraticCurveTo(0.12, 0.09, 0.2, 0.02);
  wingShape.quadraticCurveTo(0.13, -0.02, 0.16, -0.07);
  wingShape.quadraticCurveTo(0.08, -0.05, 0.02, -0.025);
  wingShape.closePath();
  const wingGeo = new THREE.ShapeGeometry(wingShape, 8);
  const wingMat = new THREE.MeshBasicMaterial({ color: 0x332046, side: THREE.DoubleSide });
  const wings = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.04, 0.01, -0.01);
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.scale.x = side;
    pivot.add(wing);
    g.add(pivot);
    wings.push(pivot);
  }
  g.userData.wings = wings;
  return g;
}

export function makeGhost(scale = 1) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.1, 0.02),
    new THREE.Vector2(0.15, 0.12),
    new THREE.Vector2(0.145, 0.28),
    new THREE.Vector2(0.11, 0.4),
    new THREE.Vector2(0.06, 0.48),
    new THREE.Vector2(0.001, 0.5),
  ];
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf5ecff,
    emissive: 0x9a7ab8,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.66,
    roughness: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), bodyMat);
  g.add(body);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), basicMat(0x241330));
    eye.position.set(side * 0.05, 0.31, 0.1);
    g.add(eye);
  }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), basicMat(0x241330));
  mouth.position.set(0, 0.24, 0.11);
  mouth.scale.set(1, 1.4, 0.5);
  g.add(mouth);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.08, 3, 6), bodyMat);
    arm.position.set(side * 0.15, 0.26, 0);
    arm.rotation.z = side * -0.9;
    g.add(arm);
  }
  g.scale.setScalar(scale);
  return g;
}

function makeSkullLantern() {
  const g = new THREE.Group();
  const bone = mat(0xd9d0c3, { roughness: 0.9 });
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), bone);
  skull.scale.set(1, 1.1, 0.9);
  skull.position.y = -0.14;
  g.add(skull);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.11), bone);
  jaw.position.set(0, -0.255, 0.015);
  g.add(jaw);
  for (const side of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), basicMat(0x1a0d22));
    socket.position.set(side * 0.045, -0.13, 0.105);
    g.add(socket);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), emissiveMat(0xffb347, 3));
    glow.position.set(side * 0.045, -0.13, 0.12);
    g.add(glow);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.04, 6), basicMat(0x1a0d22));
  nose.position.set(0, -0.19, 0.12);
  nose.rotation.x = Math.PI;
  g.add(nose);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 5), mat(0x5a4a63, { metalness: 0.4, roughness: 0.5 }));
  chain.position.y = 0.36;
  g.add(chain);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI), mat(0x5a4a63, { metalness: 0.4, roughness: 0.5 }));
  hook.position.y = 0.78;
  g.add(hook);
  return g;
}

function makeDeadPlant() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.08, 0.18, 10),
    mat(0x4a3040, { roughness: 0.95 })
  );
  pot.position.y = 0.09;
  pot.castShadow = true;
  g.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 10), mat(0x2a1b20));
  soil.position.y = 0.18;
  g.add(soil);
  const branchMat = mat(0x3b2a24, { roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const pts = [
      new THREE.Vector3(0, 0.18, 0),
      new THREE.Vector3((Math.random() - 0.5) * 0.08, 0.3 + Math.random() * 0.1, (Math.random() - 0.5) * 0.05),
      new THREE.Vector3((Math.random() - 0.5) * 0.16, 0.42 + Math.random() * 0.15, (Math.random() - 0.5) * 0.08),
    ];
    const branch = new THREE.Mesh(tubeFromPoints(pts, 0.008, 16, 5), branchMat);
    g.add(branch);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 5), mat(0x2d3a2b, { roughness: 1 }));
    leaf.position.copy(pts[2]);
    leaf.scale.set(1.6, 0.35, 0.8);
    leaf.rotation.z = Math.random() * 1.5;
    g.add(leaf);
  }
  return g;
}

function makeSpider() {
  const g = new THREE.Group();
  const black = mat(0x140b1b, { roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), black);
  body.scale.set(1, 1.2, 0.9);
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), black);
  head.position.set(0, -0.045, 0.02);
  g.add(head);
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.13, 4), black);
      leg.position.set(side * 0.045, -0.01 + i * 0.012, 0);
      leg.rotation.z = side * (0.8 + i * 0.15);
      leg.rotation.x = (i - 1.5) * 0.2;
      g.add(leg);
    }
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 5, 4), emissiveMat(0xff2b4d, 2));
    eye.position.set(side * 0.012, -0.04, 0.04);
    g.add(eye);
  }
  return g;
}

function makePottedFlower(petal = 0xff9ec9, potColor = 0xfff3f8, scale = 1) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.13, 12), mat(potColor, { roughness: 0.85 }));
  pot.position.y = 0.065;
  pot.castShadow = true;
  g.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 6, 16), mat(0xffd1a8));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.13;
  g.add(rim);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.18, 6), mat(0x5c9b73));
  stem.position.y = 0.22;
  g.add(stem);
  const head = new THREE.Group();
  head.position.y = 0.32;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petalMesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(petal, { roughness: 0.8 }));
    petalMesh.position.set(Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0);
    petalMesh.scale.set(1.3, 0.8, 0.5);
    petalMesh.rotation.z = a;
    head.add(petalMesh);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(0xffd66b));
  center.position.z = 0.02;
  head.add(center);
  g.add(head);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x7bb88e));
  leaf.position.set(0.04, 0.22, 0);
  leaf.scale.set(1.5, 0.4, 0.7);
  leaf.rotation.z = -0.5;
  g.add(leaf);
  g.scale.setScalar(scale);
  return g;
}

/* ------------------------------------------------------------------ */
/* SCARY DOOR                                                         */
/* ------------------------------------------------------------------ */

export function createScaryDoor() {
  const group = new THREE.Group();
  group.name = "scaryDoor";

  const state = {
    time: 0,
    flickerTimer: 0,
    lightTarget: 1,
    locked: false,
    eyeTarget: null,
    eyeBlink: 3,
    blinking: false,
  };

  const woodTex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#2a1a3a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? "#322045" : "#281838";
      ctx.fillRect(i * (w / 6) + 2, 0, w / 6 - 4, h);
      ctx.strokeStyle = "#140b1e";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(i * (w / 6), 0);
      ctx.lineTo(i * (w / 6), h);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      const x = Math.random() * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 8, h * 0.3, x - 8, h * 0.7, x, h);
      ctx.stroke();
    }
  });
  const wood = mat(0xffffff, { map: woodTex, roughness: 0.92 });
  const frameWood = mat(0x24132f, { roughness: 0.95 });
  const iron = mat(0x4c4552, { metalness: 0.55, roughness: 0.55 });
  const scratchMat = mat(0xcfc4d4, { roughness: 0.8 });

  const frame = new THREE.Group();
  frame.rotation.z = 0.014;
  group.add(frame);

  const postGeo = new THREE.BoxGeometry(0.2, 2.8, 0.24);
  const leftPost = new THREE.Mesh(postGeo, frameWood);
  leftPost.position.set(-0.82, 1.4, 0);
  leftPost.rotation.z = 0.02;
  leftPost.castShadow = true;
  leftPost.receiveShadow = true;
  frame.add(leftPost);
  const rightPost = new THREE.Mesh(postGeo, frameWood);
  rightPost.position.set(0.82, 1.38, 0);
  rightPost.rotation.z = -0.018;
  rightPost.castShadow = true;
  rightPost.receiveShadow = true;
  frame.add(rightPost);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.24, 0.26), frameWood);
  lintel.position.set(0, 2.72, 0);
  lintel.rotation.z = -0.012;
  lintel.castShadow = true;
  frame.add(lintel);
  const threshold = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 0.42), mat(0x1a0e23, { roughness: 1 }));
  threshold.position.set(0, 0.05, 0.05);
  frame.add(threshold);

  for (let i = 0; i < 7; i++) {
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, rand(0.16, 0.42), 0.012),
      basicMat(0x0d0613)
    );
    const side = i % 2 ? 1 : -1;
    crack.position.set(side * 0.82 + rand(-0.07, 0.07), rand(0.5, 2.4), 0.125);
    crack.rotation.z = rand(-0.7, 0.7);
    frame.add(crack);
  }

  // dark void behind the leaf
  const voidTex = canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.6, 10, w / 2, h * 0.55, h * 0.65);
    g.addColorStop(0, "#123a1e");
    g.addColorStop(0.35, "#08170d");
    g.addColorStop(0.8, "#050208");
    g.addColorStop(1, "#020103");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const voidPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.46, 2.42),
    new THREE.MeshBasicMaterial({ map: voidTex, toneMapped: false })
  );
  voidPlane.position.set(0, 1.24, -0.055);
  frame.add(voidPlane);

  // web corners
  const web1 = makeCobweb(0.65, 0.55, 1, 1);
  web1.position.set(-0.84, 2.55, 0.15);
  web1.rotation.z = -Math.PI / 2;
  frame.add(web1);
  const web2 = makeCobweb(0.45, 0.4, -1, -1);
  web2.position.set(0.84, 0.25, 0.15);
  web2.rotation.z = Math.PI / 2;
  frame.add(web2);

  // door leaf pivot
  const leafPivot = new THREE.Group();
  leafPivot.position.set(-0.65, 0, 0.02);
  frame.add(leafPivot);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.38, 0.09), wood);
  leaf.position.set(0.64, 1.24, 0);
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  leafPivot.add(leaf);

  for (let i = 0; i < 5; i++) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.016, 2.3, 0.01), mat(0x160c20, { roughness: 1 }));
    groove.position.set(0.16 + i * 0.24, 1.24, 0.052);
    leafPivot.add(groove);
  }
  const brace = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.1, 0.04), mat(0x1d1028));
  brace.position.set(0.64, 0.48, 0.065);
  leafPivot.add(brace);
  const brace2 = brace.clone();
  brace2.position.y = 1.98;
  leafPivot.add(brace2);

  for (const y of [0.35, 2.05]) {
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.06), iron);
    hinge.position.set(0.06, y, 0.075);
    leafPivot.add(hinge);
  }

  // claw scratches
  for (let s = 0; s < 3; s++) {
    const pts = [];
    const baseX = 0.42 + s * 0.09;
    for (let i = 0; i < 5; i++) {
      pts.push(new THREE.Vector3(baseX + Math.sin(i * 1.6 + s) * 0.035, 0.55 + i * 0.15, 0.056));
    }
    const scratch = new THREE.Mesh(tubeFromPoints(pts, 0.0055, 22, 4), scratchMat);
    leafPivot.add(scratch);
  }

  // ring knocker
  const ringPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 12), iron);
  ringPlate.rotation.x = Math.PI / 2;
  ringPlate.position.set(0.96, 1.32, 0.06);
  leafPivot.add(ringPlate);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.017, 8, 22), iron);
  ring.position.set(0.96, 1.22, 0.085);
  ring.castShadow = true;
  leafPivot.add(ring);
  const ringMount = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), iron);
  ringMount.position.set(0.96, 1.33, 0.095);
  leafPivot.add(ringMount);

  // eyes in the dark slit
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.42), basicMat(0x09030d));
  slit.position.set(0.47, 1.22, 0.057);
  leafPivot.add(slit);
  const eyeRoot = new THREE.Group();
  eyeRoot.position.set(0.47, 1.22, 0.075);
  leafPivot.add(eyeRoot);
  const eyeMats = [];
  const pupilOffsets = [];
  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.06, 0.02, 0);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), emissiveMat(COLORS.scaryRed, 3.2));
    glow.scale.set(1, 1.15, 0.5);
    eyeGroup.add(glow);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), basicMat(0x2b0009));
    pupil.position.set(0, 0, 0.028);
    eyeGroup.add(pupil);
    pupilOffsets.push(pupil);
    eyeMats.push(glow.material);
    eyeRoot.add(eyeGroup);
  }

  // sign
  const signTex = makeSignTexture({
    title: "bara baraâ€¦",
    sub: "el bab el o5ra 5irâ€¦ click 3lieha ðŸ’—",
    titleFont: "86px Creepster, cursive",
    subFont: "500 37px Caveat, cursive",
    titleColor: "#e7d6ef",
    subColor: "#d8a8c7",
    bg: "#2a1a3a",
    border: "#6b4a7a",
    width: 680,
    height: 400,
  });
  const signPivot = new THREE.Group();
  signPivot.position.set(-1.12, 2.42, 0.22);
  signPivot.rotation.z = -0.05;
  const signGroup = new THREE.Group();
  signPivot.add(signGroup);
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.55, 0.045),
    [
      mat(0x2a1a3a),
      mat(0x2a1a3a),
      mat(0x2a1a3a),
      mat(0x2a1a3a),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.9 }),
      mat(0x1b1024),
    ]
  );
  signBoard.position.y = -0.5;
  signBoard.castShadow = true;
  signGroup.add(signBoard);
  for (const side of [-1, 1]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 5), mat(0x8d7a67));
    rope.position.set(side * 0.33, -0.22, 0);
    rope.rotation.z = side * 0.08;
    signGroup.add(rope);
  }
  group.add(signPivot);

  // green glow
  const light = new THREE.PointLight(COLORS.scaryGreen, 1.3, 5.5, 2);
  light.position.set(0, 1.6, 1.1);
  group.add(light);
  const glowTex = makeGlowTexture("124,255,107");
  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, color: 0x7cff6b, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glowSprite.scale.set(1.5, 1.5, 1);
  glowSprite.position.set(0, 1.4, 0.2);
  group.add(glowSprite);

  // ghost peeking from behind the frame
  const ghost = makeGhost(0.7);
  ghost.position.set(-1.0, 1.6, -0.12);
  ghost.rotation.y = 0.5;
  group.add(ghost);

  // bats
  const bats = [];
  for (let i = 0; i < 3; i++) {
    const bat = makeBat();
    bat.position.set(-0.8 + i * 0.55, 1.9 + i * 0.25, 0.65);
    bat.scale.setScalar(0.8 + i * 0.15);
    bat.userData.orbit = {
      cx: -0.5 + i * 0.6,
      cy: 1.8 + i * 0.25,
      cz: 0.7,
      rx: 0.5 + i * 0.12,
      ry: 0.2 + i * 0.08,
      speed: 0.55 + i * 0.12,
      phase: i * 2.1,
    };
    group.add(bat);
    bats.push(bat);
  }

  // skull lantern
  const skull = makeSkullLantern();
  skull.position.set(0.98, 2.65, 0.28);
  skull.rotation.z = -0.08;
  group.add(skull);

  const plant = makeDeadPlant();
  plant.position.set(-1.12, 0.02, 0.35);
  plant.rotation.y = 0.4;
  group.add(plant);

  // spider + thread
  const spider = makeSpider();
  spider.position.set(0.7, 1.5, 0.62);
  group.add(spider);
  const threadGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.7, 2.8, 0.62), new THREE.Vector3(0.7, 1.5, 0.62)]);
  const thread = new THREE.Line(threadGeo, new THREE.LineBasicMaterial({ color: 0x9d8ca9, transparent: true, opacity: 0.35 }));
  group.add(thread);
  gsap.to(spider.position, { y: 0.65, duration: 4.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
  gsap.to(spider.rotation, { z: 0.3, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });

  // closed sign (hidden)
  const closedTex = makeCanvasTextTexture("CLOSED", {
    width: 512,
    height: 256,
    font: "700 84px Fredoka, sans-serif",
    color: "#f3d9e6",
    bg: "#3a1f35",
    border: "#7c3f5f",
    radius: 22,
    rotate: -0.05,
  });
  const closed = new THREE.Group();
  const closedPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.25),
    new THREE.MeshBasicMaterial({ map: closedTex, transparent: true })
  );
  closed.add(closedPlane);
  for (const side of [-1, 1]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4), mat(0x8d7a67));
    rope.position.set(side * 0.16, 0.22, 0);
    closed.add(rope);
  }
  closed.position.set(0.1, 1.5, 0.55);
  closed.visible = false;
  group.add(closed);

  const hit = makeHit("scaryDoor");
  group.add(hit);
  const sparkles = makeSprayParticles("sparkles", { count: 120 });
  group.add(sparkles.object3D);

  /* ---------------- API ---------------- */
  function shake() {
    if (state.locked) return;
    const tl = gsap.timeline();
    tl.to(frame.rotation, { z: 0.03, duration: 0.05, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0)
      .to(leafPivot.rotation, { y: -0.05, duration: 0.05, yoyo: true, repeat: 5 }, 0)
      .to(frame.position, { x: 0.03, duration: 0.06, yoyo: true, repeat: 4 }, 0)
      .to(ring.rotation, { z: 0.5, duration: 0.07, yoyo: true, repeat: 5 }, 0)
      .to(frame.rotation, { z: 0.014, duration: 0.2 }, 0.5)
      .to(frame.position, { x: 0, duration: 0.2 }, 0.5);
    sparkles.burst(new THREE.Vector3(0, 1.4, 0.6), { count: 8, colors: [0x7cff6b, 0xff2b4d], speed: 0.9, life: 0.8, spread: 0.8 });
    return new Promise((r) => tl.eventCallback("onComplete", r));
  }

  function crack() {
    if (state.locked) return Promise.resolve();
    gsap.killTweensOf(leafPivot.rotation);
    return new Promise((resolve) => {
      gsap.to(leafPivot.rotation, {
        y: -0.34,
        duration: 0.7,
        ease: "power2.out",
        onComplete: resolve,
      });
      gsap.to(eyeMats, { emissiveIntensity: 4, duration: 0.3 });
      sparkles.burst(new THREE.Vector3(0.35, 1.2, 0.4), { count: 6, colors: [0xff2b4d, 0x7cff6b], speed: 0.8, life: 0.7 });
    });
  }

  function slam() {
    gsap.killTweensOf(leafPivot.rotation);
    const tl = gsap.timeline();
    tl.to(leafPivot.rotation, { y: 0, duration: 0.16, ease: "power3.in" })
      .to(frame.position, { x: 0.03, duration: 0.04, yoyo: true, repeat: 5 }, 0.13)
      .to(frame.position, { x: 0, duration: 0.15 }, 0.35);
    return new Promise((r) => tl.eventCallback("onComplete", r));
  }

  function lockClosed() {
    state.locked = true;
    slam();
    closed.visible = true;
    closed.scale.setScalar(0.01);
    gsap.to(closed.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)" });
    gsap.to(eyeMats, { emissiveIntensity: 0.3, duration: 0.4 });
    gsap.to(glowSprite.material, { opacity: 0.12, duration: 0.6 });
    gsap.to(light, { intensity: 0.25, duration: 0.6 });
    hit.userData.disabled = true;
  }

  function unlock() {
    state.locked = false;
    hit.userData.disabled = false;
    closed.visible = false;
    gsap.to(eyeMats, { emissiveIntensity: 1.6, duration: 0.5 });
    gsap.to(glowSprite.material, { opacity: 0.35, duration: 0.5 });
    gsap.to(light, { intensity: 0.9, duration: 0.5 });
  }

  function setEyesTarget(vec3) {
    state.eyeTarget = vec3 ? vec3.clone() : null;
  }

  function onClick(cb) {
    hit.userData.onTap = cb;
    return hit;
  }

  function update(dt) {
    state.time += dt;
    const t = state.time;

    // green light flicker
    state.flickerTimer -= dt;
    if (state.flickerTimer <= 0) {
      state.flickerTimer = 0.08 + Math.random() * 0.14;
      state.lightTarget = state.locked ? 0.2 : 0.35 + Math.random() * 0.95;
    }
    light.intensity += (state.lightTarget - light.intensity) * Math.min(1, dt * 22);
    glowSprite.material.opacity = 0.18 + light.intensity * 0.28;
    glowSprite.scale.setScalar(1.2 + light.intensity * 0.45);

    // eyes
    if (state.eyeTarget) {
      eyeRoot.getWorldPosition(new THREE.Vector3());
      const dir = state.eyeTarget.clone().sub(eyeRoot.getWorldPosition(new THREE.Vector3()));
      dir.normalize();
      for (let i = 0; i < pupilOffsets.length; i++) {
        const p = pupilOffsets[i];
        const side = i === 0 ? -1 : 1;
        p.position.x = side * 0.004 + THREE.MathUtils.clamp(dir.x, -1, 1) * 0.012;
        p.position.y = THREE.MathUtils.clamp(dir.y, -1, 1) * 0.014;
      }
    }
    state.eyeBlink -= dt;
    if (state.eyeBlink <= 0 && !state.blinking) {
      state.blinking = true;
      gsap.to(eyeRoot.scale, {
        y: 0.1,
        duration: 0.06,
        onComplete: () => gsap.to(eyeRoot.scale, {
          y: 1,
          duration: 0.09,
          onComplete: () => {
            state.blinking = false;
          },
        }),
      });
      state.eyeBlink = 2.2 + Math.random() * 3.5;
    }

    // bats
    for (const bat of bats) {
      const o = bat.userData.orbit;
      bat.position.x = o.cx + Math.cos(t * o.speed + o.phase) * o.rx;
      bat.position.y = o.cy + Math.sin(t * o.speed * 1.3 + o.phase) * o.ry;
      bat.position.z = o.cz + Math.sin(t * o.speed + o.phase) * 0.2;
      bat.rotation.y = Math.cos(t * o.speed + o.phase) * 0.5;
      for (const wing of bat.userData.wings) {
        wing.rotation.z = Math.sin(t * 11 + o.phase) * 0.7;
      }
    }

    // ghost bob
    ghost.position.y = 1.6 + Math.sin(t * 1.1) * 0.12;
    ghost.rotation.z = Math.sin(t * 0.8) * 0.05;

    // sign swing
    signPivot.rotation.z = -0.05 + Math.sin(t * 1.4) * 0.035;
    signPivot.rotation.x = Math.sin(t * 0.9) * 0.02;

    // skull swing
    skull.rotation.z = -0.08 + Math.sin(t * 0.7 + 1) * 0.035;

    // thread follows spider
    const posAttr = thread.geometry.attributes.position;
    posAttr.setXYZ(0, spider.position.x, 2.8, spider.position.z);
    posAttr.setXYZ(1, spider.position.x, spider.position.y + 0.05, spider.position.z);
    posAttr.needsUpdate = true;

    // ring sway
    ring.rotation.z = Math.sin(t * 1.3) * 0.08;
    sparkles.update(dt);
  }

  function dispose() {
    gsap.killTweensOf(spider.position);
    gsap.killTweensOf(spider.rotation);
    gsap.killTweensOf(leafPivot.rotation);
    gsap.killTweensOf(frame.rotation);
    gsap.killTweensOf(frame.position);
    gsap.killTweensOf(ring.rotation);
    gsap.killTweensOf(eyeMats);
    sparkles.dispose();
    disposeGroup(group);
  }

  return {
    group,
    update,
    shake,
    crack,
    slam,
    lockClosed,
    unlock,
    setEyesTarget,
    onClick,
    hit,
    interactives: [hit],
    dispose,
    get locked() {
      return state.locked;
    },
  };
}

/* ------------------------------------------------------------------ */
/* PRETTY DOOR                                                        */
/* ------------------------------------------------------------------ */

export function createPrettyDoor() {
  const group = new THREE.Group();
  group.name = "prettyDoor";

  const state = {
    time: 0,
    opened: false,
    hintVisible: false,
    baseLight: 1.6,
  };

  const white = mat(0xfffdfb, { roughness: 0.55 });
  const cream = mat(0xfff3f8, { roughness: 0.8 });
  const gold = mat(COLORS.gold, { roughness: 0.3, metalness: 0.35 });
  const lilac = mat(COLORS.lilac, { roughness: 0.7 });
  const mint = mat(COLORS.mint, { roughness: 0.7 });
  const peach = mat(COLORS.peach, { roughness: 0.7 });
  const sky = mat(COLORS.sky, { roughness: 0.7 });
  const pink = mat(0xffb6d5, { roughness: 0.7 });
  const green = mat(0x8fce9d, { roughness: 0.8 });

  const frame = new THREE.Group();
  group.add(frame);

  const sideGeo = roundedBoxGeometry(0.22, 2.8, 0.24, 0.09);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(sideGeo, white);
    post.position.set(side * 0.8, 1.4, 0);
    post.castShadow = true;
    post.receiveShadow = true;
    frame.add(post);
  }
  const lintel = new THREE.Mesh(roundedBoxGeometry(1.94, 0.26, 0.26, 0.1), white);
  lintel.position.set(0, 2.74, 0);
  lintel.castShadow = true;
  frame.add(lintel);
  const threshold = new THREE.Mesh(roundedBoxGeometry(1.9, 0.1, 0.46, 0.04), cream);
  threshold.position.set(0, 0.05, 0.06);
  frame.add(threshold);
  // glowing portal behind the leaf
  const portalTex = canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.6, 10, w / 2, h * 0.55, h * 0.62);
    g.addColorStop(0, "#fff6e0");
    g.addColorStop(0.35, "#ffd8a8");
    g.addColorStop(0.7, "#ffb6d5");
    g.addColorStop(1, "#c9a7ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.7})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2.46),
    new THREE.MeshBasicMaterial({ map: portalTex, toneMapped: false })
  );
  portal.position.set(0, 1.26, -0.055);
  frame.add(portal);

  // flowers + vine climbing the left side
  function flowerCluster(x, y, z, scale = 1) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const petals = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), pink);
      p.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0);
      p.scale.set(1.25, 0.75, 0.55);
      p.rotation.z = a;
      petals.add(p);
    }
    g.add(petals);
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), gold);
    center.position.z = 0.025;
    g.add(center);
    for (let i = 0; i < 2; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), green);
      leaf.position.set(0.08 * (i ? 1 : -1), -0.06, -0.01);
      leaf.scale.set(1.5, 0.45, 0.5);
      leaf.rotation.z = i ? -0.7 : 0.7;
      g.add(leaf);
    }
    g.scale.setScalar(scale);
    return g;
  }
  for (let i = 0; i < 6; i++) {
    const f = flowerCluster(-0.83 + Math.sin(i * 1.7) * 0.05, 0.7 + i * 0.34, 0.13, 0.8 + (i % 2) * 0.15);
    f.rotation.z = rand(-0.4, 0.4);
    frame.add(f);
  }
  const vinePts = [];
  for (let i = 0; i < 8; i++) {
    vinePts.push(new THREE.Vector3(-0.83 + Math.sin(i * 1.3) * 0.05, 0.5 + i * 0.28, 0.1));
  }
  frame.add(new THREE.Mesh(tubeFromPoints(vinePts, 0.008, 32, 5), green));
  for (let i = 0; i < 5; i++) {
    const f = flowerCluster(0.72 + rand(-0.05, 0.08), 2.55 + rand(-0.04, 0.04), 0.15, 0.7);
    frame.add(f);
  }

  // fairy light string
  const fairyCurvePts = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    fairyCurvePts.push(new THREE.Vector3(Math.cos(a) * 0.96, 2.5 + Math.sin(a) * 0.28, 0.18));
  }
  fairyCurvePts.push(new THREE.Vector3(0.88, 2.3, 0.18), new THREE.Vector3(0.9, 1.2, 0.18), new THREE.Vector3(0.86, 0.35, 0.18));
  const fairyWire = new THREE.Mesh(tubeFromPoints(fairyCurvePts, 0.006, 80, 4), mat(0x8d7a67));
  frame.add(fairyWire);
  const bulbMats = [];
  const bulbGeo = new THREE.SphereGeometry(0.027, 8, 6);
  const bulbColors = [0xff7eb6, 0xffd66b, 0xa8d8ff, 0xffb6d5];
  const fairyCurve = new THREE.CatmullRomCurve3(fairyCurvePts);
  for (let i = 0; i < 26; i++) {
    const p = fairyCurve.getPoint(i / 25);
    const m = new THREE.MeshStandardMaterial({
      color: bulbColors[i % bulbColors.length],
      emissive: bulbColors[i % bulbColors.length],
      emissiveIntensity: 1.6,
      roughness: 0.35,
    });
    const bulb = new THREE.Mesh(bulbGeo, m);
    bulb.position.copy(p);
    frame.add(bulb);
    bulbMats.push(m);
  }

  // door leaf
  const leafPivot = new THREE.Group();
  leafPivot.position.set(-0.65, 0, 0.02);
  frame.add(leafPivot);
  const leafBack = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 0.08), cream);
  leafBack.position.set(0.65, 1.25, 0);
  leafBack.castShadow = true;
  leafBack.receiveShadow = true;
  leafPivot.add(leafBack);
  const stripeMats = [lilac, mint, peach, sky];
  for (let i = 0; i < 4; i++) {
    const stripe = new THREE.Mesh(roundedBoxGeometry(0.29, 2.3, 0.06, 0.035), stripeMats[i]);
    stripe.position.set(0.65 - 0.465 + i * 0.31, 1.25, 0.045);
    stripe.castShadow = true;
    leafPivot.add(stripe);
  }
  // rounded inset panels
  for (let i = 0; i < 4; i++) {
    const panel = new THREE.Mesh(roundedBoxGeometry(0.2, 0.72, 0.025, 0.05), cream);
    panel.position.set(0.65 - 0.465 + i * 0.31, 0.62, 0.085);
    leafPivot.add(panel);
  }
  for (let i = 0; i < 4; i++) {
    const panel = new THREE.Mesh(roundedBoxGeometry(0.2, 0.5, 0.025, 0.05), cream);
    panel.position.set(0.65 - 0.465 + i * 0.31, 2.02, 0.085);
    leafPivot.add(panel);
  }

  // heart window
  const heartBorder = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeHeartShape(0.62, 0.52), { depth: 0.035, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.02, bevelThickness: 0.015, curveSegments: 24 }),
    white
  );
  heartBorder.position.set(0.65, 1.68, 0.06);
  leafPivot.add(heartBorder);
  const heartGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffd8a8,
    emissive: 0xffb95e,
    emissiveIntensity: 1.7,
    roughness: 0.4,
  });
  const heartGlass = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeHeartShape(0.48, 0.4), { depth: 0.02, bevelEnabled: false, curveSegments: 24 }),
    heartGlassMat
  );
  heartGlass.position.set(0.65, 1.7, 0.11);
  leafPivot.add(heartGlass);
  const heartGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture("255,205,140"), color: 0xffd29a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  heartGlow.position.set(0.65, 1.7, 0.2);
  heartGlow.scale.set(1.1, 0.9, 1);
  leafPivot.add(heartGlow);

  // stars and dots
  const starMat = mat(COLORS.gold, { metalness: 0.3, roughness: 0.4 });
  const starGeo = new THREE.ExtrudeGeometry(makeStarShape(0.055, 0.024), { depth: 0.012, bevelEnabled: false });
  for (let i = 0; i < 7; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(rand(0.25, 1.05), rand(0.35, 2.1), 0.09);
    if (Math.abs(star.position.y - 1.7) < 0.4) star.position.y += 0.5;
    star.rotation.z = rand(-0.4, 0.4);
    leafPivot.add(star);
  }
  const dotGeo = new THREE.SphereGeometry(0.016, 8, 6);
  for (let i = 0; i < 12; i++) {
    const dot = new THREE.Mesh(dotGeo, cream);
    dot.position.set(rand(0.15, 1.15), rand(0.25, 2.25), 0.085);
    dot.scale.z = 0.4;
    leafPivot.add(dot);
  }

  // heart knob
  const knobBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), gold);
  knobBase.rotation.x = Math.PI / 2;
  knobBase.position.set(1.13, 1.08, 0.09);
  leafPivot.add(knobBase);
  const knobHeart = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeHeartShape(0.13, 0.11), { depth: 0.035, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.008, bevelThickness: 0.008, curveSegments: 16 }),
    gold
  );
  knobHeart.position.set(1.13, 1.08, 0.1);
  knobHeart.rotation.z = Math.PI;
  leafPivot.add(knobHeart);

  // welcome mat
  const matTex = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 8, 8, w - 16, h - 16, 38);
    ctx.fillStyle = "#fff3f8";
    ctx.fill();
    ctx.save();
    roundRect(ctx, 24, 24, w - 48, h - 48, 26);
    ctx.clip();
    for (let x = 24; x < w - 24; x += 56) {
      ctx.fillStyle = (x / 56) % 2 === 0 ? "#ff5c9e" : "#fff3f8";
      ctx.fillRect(x, 24, 56, h - 48);
    }
    ctx.restore();
    ctx.strokeStyle = "#ffd66b";
    ctx.lineWidth = 7;
    roundRect(ctx, 20, 20, w - 40, h - 40, 30);
    ctx.stroke();
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10 + i * 28, h - 12);
      ctx.lineTo(10 + i * 28, h - 2);
      ctx.stroke();
    }
  });
  const welcomeMat = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 0.62),
    new THREE.MeshStandardMaterial({ map: matTex, transparent: true, roughness: 0.95 })
  );
  welcomeMat.rotation.x = -Math.PI / 2;
  welcomeMat.position.set(0, 0.012, 0.82);
  group.add(welcomeMat);

  // potted flowers
  const potA = makePottedFlower(0xff9ec9, 0xfff3f8, 0.85);
  potA.position.set(-0.98, 0.02, 0.42);
  potA.rotation.y = 0.3;
  group.add(potA);
  const potB = makePottedFlower(0xffd1a8, 0xc9a7ff, 0.75);
  potB.position.set(0.98, 0.02, 0.36);
  potB.rotation.y = -0.4;
  group.add(potB);

  // cloud + rainbow above
  const cloud = new THREE.Group();
  cloud.position.set(0, 2.98, 0.12);
  for (const [x, y, s] of [
    [0, 0, 0.14],
    [0.14, 0.02, 0.11],
    [-0.14, 0.01, 0.1],
    [0.07, 0.08, 0.1],
    [-0.06, 0.07, 0.09],
  ]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 9), white);
    puff.position.set(x, y, 0);
    cloud.add(puff);
  }
  const rainbowColors = [0xff9ec9, 0xffd1a8, 0xffd66b, 0xa8f0d1, 0xa8d8ff];
  rainbowColors.forEach((c, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.34 + i * 0.035, 0.021, 6, 26, Math.PI),
      new THREE.MeshBasicMaterial({ color: c })
    );
    arc.position.set(0, 0.05, -0.05 - i * 0.01);
    cloud.add(arc);
  });
  group.add(cloud);

  // hint heart sign
  const sign = new THREE.Group();
  sign.position.set(0, 2.28, 0.42);
  sign.visible = false;
  const signHeart = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeHeartShape(0.62, 0.54), { depth: 0.05, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.018, bevelThickness: 0.012, curveSegments: 24 }),
    mat(0xffc2dd, { roughness: 0.7 })
  );
  sign.add(signHeart);
  const signText = makeCanvasTextTexture("Click me ðŸ’—", {
    width: 512,
    height: 256,
    font: "700 82px Caveat, cursive",
    color: "#e75a9a",
    stroke: "#fff8fb",
    strokeWidth: 12,
    shadow: false,
  });
  const signTextMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.31),
    new THREE.MeshBasicMaterial({ map: signText, transparent: true })
  );
  signTextMesh.position.set(0, -0.01, 0.075);
  sign.add(signTextMesh);
  for (const side of [-1, 1]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.36, 4), mat(0xc9a7ff));
    rope.position.set(side * 0.15, 0.35, 0);
    rope.rotation.z = side * 0.1;
    sign.add(rope);
  }
  group.add(sign);

  // light + glow
  const light = new THREE.PointLight(0xffc2dd, 1.6, 6, 2);
  light.position.set(0, 1.6, 1.25);
  group.add(light);
  const doorGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture("255,194,221"), color: 0xffc2dd, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  doorGlow.position.set(0, 1.5, 0.35);
  doorGlow.scale.set(2.1, 2.4, 1);
  group.add(doorGlow);

  const hit = makeHit("prettyDoor");
  group.add(hit);
  const sparkles = makeSprayParticles("sparkles", { count: 200 });
  group.add(sparkles.object3D);
  const hearts = makeSprayParticles("hearts", { count: 24 });
  group.add(hearts.object3D);

  /* ---------------- API ---------------- */
  function pulse() {
    const tl = gsap.timeline();
    tl.to(light, { intensity: 3.6, duration: 0.5, ease: "sine.inOut" })
      .to(doorGlow.material, { opacity: 0.8, duration: 0.5, ease: "sine.inOut" }, 0)
      .to(light, { intensity: state.opened ? 4.2 : state.baseLight, duration: 0.8, ease: "sine.inOut" })
      .to(doorGlow.material, { opacity: state.opened ? 0.6 : 0.4, duration: 0.8, ease: "sine.inOut" }, "-=0.8");
    return new Promise((r) => tl.eventCallback("onComplete", r));
  }

  function open() {
    if (state.opened) return Promise.resolve();
    state.opened = true;
    gsap.killTweensOf(leafPivot.rotation);
    sign.visible = false;
    const tl = gsap.timeline();
    tl.to(leafPivot.rotation, { y: -1.92, duration: 1.05, ease: "back.out(1.15)" }, 0)
      .to(light, { intensity: 4.6, duration: 0.8, ease: "power2.out" }, 0.1)
      .to(doorGlow.material, { opacity: 0.85, duration: 0.7 }, 0.1)
      .to(heartGlassMat, { emissiveIntensity: 3, duration: 0.7 }, 0.1)
      .to(heartGlow.material, { opacity: 0.95, duration: 0.6 }, 0.1);
    sparkles.burst(new THREE.Vector3(0, 1.4, 0.7), { count: 60, speed: 2.4, life: 1.8, spread: 1.1 });
    hearts.burst(new THREE.Vector3(0, 1.2, 0.6), { count: 12 });
    return new Promise((r) => tl.eventCallback("onComplete", r));
  }

  function showHint() {
    if (state.hintVisible || state.opened) return;
    state.hintVisible = true;
    sign.visible = true;
    sign.scale.setScalar(0.01);
    sign.position.y = 2.28;
    gsap.to(sign.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: "back.out(2.2)" });
    gsap.to(sign.position, {
      y: 2.36,
      duration: 1.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 0.5,
    });
    gsap.to(sign.rotation, {
      z: 0.06,
      duration: 1.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    pulse();
  }

  function hideHint() {
    state.hintVisible = false;
    gsap.to(sign.scale, {
      x: 0.01,
      y: 0.01,
      z: 0.01,
      duration: 0.25,
      ease: "back.in(1.8)",
      onComplete: () => {
        sign.visible = false;
      },
    });
    gsap.killTweensOf(sign.position);
    gsap.killTweensOf(sign.rotation);
  }

  function onClick(cb) {
    hit.userData.onTap = cb;
    return hit;
  }

  function update(dt) {
    state.time += dt;
    const t = state.time;

    // fairy twinkle
    for (let i = 0; i < bulbMats.length; i++) {
      bulbMats[i].emissiveIntensity = 1.1 + Math.sin(t * 2.4 + i * 0.9) * 0.55;
    }

    // soft pulse when not open
    if (!state.opened) {
      light.intensity = state.baseLight + Math.sin(t * 0.9) * 0.35;
      doorGlow.material.opacity = 0.35 + Math.sin(t * 0.9) * 0.08;
    }
    heartGlassMat.emissiveIntensity = 1.5 + Math.sin(t * 1.7) * 0.25;
    heartGlow.material.opacity = 0.45 + Math.sin(t * 1.7) * 0.1;

    cloud.position.y = 2.98 + Math.sin(t * 0.8) * 0.035;
    cloud.rotation.z = Math.sin(t * 0.6) * 0.02;

    sparkles.update(dt);
    hearts.update(dt);
  }

  function dispose() {
    gsap.killTweensOf(leafPivot.rotation);
    gsap.killTweensOf(light);
    gsap.killTweensOf(doorGlow.material);
    gsap.killTweensOf(sign.position);
    gsap.killTweensOf(sign.rotation);
    gsap.killTweensOf(sign.scale);
    sparkles.dispose();
    hearts.dispose();
    disposeGroup(group);
  }

  return {
    group,
    update,
    open,
    pulse,
    showHint,
    hideHint,
    onClick,
    hit,
    interactives: [hit],
    dispose,
    get opened() {
      return state.opened;
    },
  };
}
