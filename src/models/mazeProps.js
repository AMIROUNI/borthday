import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config.js";
import { mat, makeGlowTexture, disposeGroup, pick } from "./props.js";
import { MAZE_CELL, MAZE_WALL_H } from "../game/mazeGen.js";

function canvasTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d"), w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeWallTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#5b3b4b";
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = x % 64 === 0 ? "rgba(255,220,235,0.05)" : "rgba(0,0,0,0.06)";
      ctx.fillRect(x, 0, 16, h);
    }
    for (let i = 0; i < 28; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = `rgba(28,14,24,${0.08 + Math.random() * 0.14})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 12 + Math.random() * 40, 8 + Math.random() * 24, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(20,8,16,0.28)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = Math.random() * w;
      let y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 40;
        y += 18 + Math.random() * 28;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, h - 24, w, 24);
  });
}

function makeFloorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#3a2328";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) {
      ctx.fillStyle = y % 128 === 0 ? "#452a2d" : "#352024";
      ctx.fillRect(0, y, w, 60);
      ctx.strokeStyle = "rgba(15,5,10,0.65)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,220,200,0.045)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x + ((y / 64) % 2) * 35, y + 8);
        ctx.lineTo(x + ((y / 64) % 2) * 35, y + 52);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.18})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 14, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function createMazeWorld(maze) {
  const group = new THREE.Group();
  const span = maze.size * MAZE_CELL + 4;
  const floorTex = makeFloorTexture();
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(maze.size / 2, maze.size / 2);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(span, span),
    new THREE.MeshStandardMaterial({ map: floorTex, color: 0x8f6a68, roughness: 0.92 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(span, span),
    new THREE.MeshStandardMaterial({ color: 0x1b1018, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = MAZE_WALL_H;
  group.add(ceiling);

  const wallTex = makeWallTexture();
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(1.2, 1);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    color: 0xa37a84,
    roughness: 0.92,
  });
  const wallGeo = new THREE.BoxGeometry(MAZE_CELL, MAZE_WALL_H, 0.3);
  const walls = new THREE.InstancedMesh(wallGeo, wallMat, maze.wallSegments.length);
  walls.castShadow = true;
  walls.receiveShadow = true;
  const dummy = new THREE.Object3D();
  maze.wallSegments.forEach((wall, i) => {
    dummy.position.set(wall.x, MAZE_WALL_H / 2, wall.z);
    dummy.rotation.y = wall.horizontal ? 0 : Math.PI / 2;
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    walls.setMatrixAt(i, dummy.matrix);
  });
  walls.instanceMatrix.needsUpdate = true;
  group.add(walls);

  const trimMat = mat(0x2a171e, { roughness: 0.9 });
  const baseGeo = new THREE.BoxGeometry(MAZE_CELL, 0.24, 0.34);
  const trims = new THREE.InstancedMesh(baseGeo, trimMat, maze.wallSegments.length);
  maze.wallSegments.forEach((wall, i) => {
    dummy.position.set(wall.x, 0.12, wall.z);
    dummy.rotation.y = wall.horizontal ? 0 : Math.PI / 2;
    dummy.updateMatrix();
    trims.setMatrixAt(i, dummy.matrix);
  });
  trims.instanceMatrix.needsUpdate = true;
  group.add(trims);

  const lampCells = [
    [2, 2],
    [Math.floor(maze.size / 2), maze.size - 3],
    [maze.size - 3, 2],
    [maze.size - 2, Math.floor(maze.size / 2)],
  ];
  const lamps = [];
  for (const [r, c] of lampCells) {
    const { x, z } = maze.cellToWorld(c, r);
    const lamp = new THREE.Group();
    lamp.position.set(x, 2.65, z);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 0.28, 10, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x2b1820, side: THREE.DoubleSide, roughness: 0.8 })
    );
    shade.rotation.x = Math.PI;
    lamp.add(shade);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0xffd9a8,
        emissive: 0xffb35c,
        emissiveIntensity: 1.4,
        roughness: 0.3,
      })
    );
    lamp.add(bulb);
    const light = new THREE.PointLight(0xffc080, 1.4, 8.5, 1.5);
    light.position.y = -0.12;
    lamp.add(light);
    group.add(lamp);
    lamps.push({ group: lamp, light, bulb, base: 1.2 + Math.random() * 0.5, phase: Math.random() * 10 });
  }

  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 260;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * span;
    positions[i * 3 + 1] = Math.random() * 2.8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * span;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffd9e8,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
  );
  group.add(dust);

  let time = 0;
  function update(dt, flashlightOn = true) {
    time += dt;
    for (const lamp of lamps) {
      const flicker =
        Math.sin(time * 11 + lamp.phase) * 0.06 +
        (Math.random() < 0.004 ? -0.35 : 0) +
        Math.sin(time * 1.8 + lamp.phase) * 0.05;
      lamp.light.intensity = Math.max(0.08, lamp.base + flicker);
      lamp.bulb.material.emissiveIntensity = 1 + lamp.light.intensity;
    }
    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3 + 1] += dt * 0.025;
      if (arr[i * 3 + 1] > 2.9) arr[i * 3 + 1] = 0.1;
      arr[i * 3] += Math.sin(time * 0.3 + i) * dt * 0.012;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dust.material.opacity = flashlightOn ? 0.32 : 0.18;
  }

  function dispose() {
    floorTex.dispose();
    wallTex.dispose();
    disposeGroup(group);
  }

  return { group, walls, lamps, update, dispose, floorTex, wallTex };
}

export function createKeyMesh(index) {
  const group = new THREE.Group();
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xff8fc4,
    emissive: 0xff3f91,
    emissiveIntensity: 1.3,
    metalness: 0.5,
    roughness: 0.25,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 10, 20), keyMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), keyMat);
  shaft.position.y = -0.32;
  group.add(shaft);
  for (const [x, y] of [[0.13, -0.5], [0.13, -0.62]]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.07), keyMat);
    tooth.position.set(x, y, 0);
    group.add(tooth);
  }
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("255,80,160"),
      color: 0xff6fb0,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(0.9, 0.9, 1);
  group.add(glow);
  group.position.y = 1.0;
  let t = index * 1.7;
  return {
    group,
    update(dt) {
      t += dt;
      group.position.y = 1.0 + Math.sin(t * 1.6) * 0.08;
      group.rotation.y += dt * 1.2;
      glow.material.opacity = 0.45 + Math.sin(t * 2.2) * 0.15;
    },
    collect() {
      gsap.to(group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.35, ease: "back.in" });
      gsap.to(group.position, { y: 1.6, duration: 0.35 });
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createHidingSpot(type = "wardrobe") {
  const group = new THREE.Group();
  if (type === "bed") {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.3, 1.05), mat(0x5d3a3f, { roughness: 0.9 }));
    frame.position.y = 0.25;
    group.add(frame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.22, 0.94), mat(0x9b7382, { roughness: 0.95 }));
    mattress.position.y = 0.48;
    group.add(mattress);
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.68), mat(0x7e4b64, { roughness: 0.95 }));
    blanket.position.set(0, 0.62, -0.08);
    group.add(blanket);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.34), mat(0xe8c8d5, { roughness: 0.9 }));
    pillow.position.set(0, 0.67, -0.37);
    group.add(pillow);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.0, 0.62), mat(0x5a3039, { roughness: 0.9 }));
    body.position.y = 1.0;
    group.add(body);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.47, 1.8, 0.06), mat(0x74414c, { roughness: 0.85 }));
    door.position.set(-0.24, 1.0, 0.34);
    group.add(door);
    const door2 = door.clone();
    door2.position.x = 0.24;
    group.add(door2);
    for (const side of [-1, 1]) {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xd8b06b, { metalness: 0.4 }));
      knob.position.set(side * 0.03, 1.0, 0.39);
      group.add(knob);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.7), mat(0x3d2027, { roughness: 0.9 }));
    top.position.y = 2.05;
    group.add(top);
  }
  return {
    group,
    type,
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createRoomSet(type) {
  const group = new THREE.Group();
  const wood = mat(0x6b4035, { roughness: 0.9 });
  const dark = mat(0x38222a, { roughness: 0.9 });
  if (type === "bedroom") {
    const bed = createHidingSpot("bed");
    bed.group.position.set(-0.55, 0, 0);
    bed.group.rotation.y = 0.2;
    group.add(bed.group);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xffd2a1));
    lamp.position.set(0.6, 0.8, -0.45);
    group.add(lamp);
  } else if (type === "library") {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 0.38), wood);
    shelf.position.set(0.45, 1.05, -0.55);
    group.add(shelf);
    const bookColors = [0x8e3b54, 0x3c5a70, 0x6b5a35, 0x53325c, 0x7a4433];
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 6; i++) {
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.22), mat(pick(bookColors)));
        book.position.set(-0.18 + i * 0.14, 0.5 + r * 0.55, -0.33);
        group.add(book);
      }
    }
  } else if (type === "kitchen") {
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.6), dark);
    counter.position.set(0, 0.45, -0.5);
    group.add(counter);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.68), mat(0x8c7a70, { roughness: 0.6 }));
    top.position.set(0, 0.94, -0.5);
    group.add(top);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.24, 10), mat(0x3c3a42));
    pot.position.set(0.3, 1.1, -0.5);
    group.add(pot);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 12), wood);
    table.position.set(-0.4, 0.7, 0.35);
    group.add(table);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6), wood);
    leg.position.set(-0.4, 0.35, 0.35);
    group.add(leg);
  } else if (type === "bathroom") {
    const bath = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.7), mat(0xb7c3c8, { roughness: 0.35 }));
    bath.position.set(0.1, 0.3, -0.45);
    group.add(bath);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x5c8e96, transparent: true, opacity: 0.55, roughness: 0.15 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0.1, 0.58, -0.45);
    group.add(water);
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 24),
      new THREE.MeshStandardMaterial({ color: 0x446a75, transparent: true, opacity: 0.35, roughness: 0.2 })
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.012;
    group.add(puddle);
  } else if (type === "toyroom") {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.6), mat(0x7e4a64));
    chest.position.set(0.2, 0.35, -0.5);
    group.add(chest);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 0.64), mat(0x9d5c7b));
    lid.position.set(0.2, 0.74, -0.5);
    group.add(lid);
    const colors = [0xff9ec9, 0xa8d8ff, 0xffd66b, 0xa8f0d1];
    for (let i = 0; i < 7; i++) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), mat(pick(colors)));
      block.position.set(-0.7 + Math.random() * 1.5, 0.09, 0.2 + Math.random() * 0.8);
      block.rotation.y = Math.random() * Math.PI;
      group.add(block);
    }
  }
  return {
    group,
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createExitDoor() {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 0.24), mat(0x2b171c, { roughness: 0.9 }));
  frame.position.y = 1.4;
  group.add(frame);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.5, 0.16), mat(0x633b2e, { roughness: 0.85 }));
  door.position.set(0, 1.25, 0.14);
  group.add(door);
  const locks = [];
  for (let i = 0; i < 3; i++) {
    const lock = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.045, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0xff8fc4,
        emissive: 0xff3f91,
        emissiveIntensity: 1.2,
        metalness: 0.4,
        roughness: 0.25,
      })
    );
    lock.position.set(-0.42 + i * 0.42, 1.45, 0.23);
    lock.userData.index = i;
    group.add(lock);
    locks.push(lock);
  }
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.28),
    new THREE.MeshBasicMaterial({ color: 0x1b0d12, transparent: true })
  );
  sign.position.set(0, 2.0, 0.23);
  group.add(sign);
  const light = new THREE.PointLight(0xffe6a8, 0, 5, 1.5);
  light.position.set(0, 1.5, 0.6);
  group.add(light);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("255,230,170"),
      color: 0xffe6a8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(2.8, 3, 1);
  glow.position.set(0, 1.4, 0.3);
  group.add(glow);
  let openAmount = 0;
  return {
    group,
    get position() {
      return group.position;
    },
    setLocks(n) {
      locks.forEach((lock, i) => {
        lock.visible = i >= n;
      });
    },
    open() {
      return new Promise((resolve) => {
        const tl = gsap.timeline({ onComplete: resolve });
        tl.to(light, { intensity: 3.2, duration: 0.5 }, 0)
          .to(glow.material, { opacity: 0.9, duration: 0.5 }, 0)
          .to(door.rotation, { y: -1.35, duration: 1.0, ease: "power2.inOut" }, 0.2)
          .to(door.position, { x: -0.72, duration: 1.0, ease: "power2.inOut" }, 0.2);
        openAmount = 1;
      });
    },
    update() {},
    get opened() {
      return openAmount;
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createFakeExit() {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.2), mat(0x2b171c));
  frame.position.y = 1.25;
  group.add(frame);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.12), mat(0x5a3428));
  door.position.set(0, 1.1, 0.14);
  group.add(door);
  const brick = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x5d3732, roughness: 0.95 })
  );
  brick.position.set(0, 1.1, 0.06);
  brick.visible = false;
  group.add(brick);
  return {
    group,
    open() {
      return new Promise((resolve) => {
        gsap.to(door.rotation, { y: -1.3, x: -0.2, duration: 0.7, ease: "power2.inOut" });
        gsap.to(door.position, { x: -0.68, duration: 0.7, ease: "power2.inOut", onComplete: () => {
          brick.visible = true;
          resolve();
        } });
      });
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createPainting(photoSrc, caption = "") {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.1), mat(0xc9a46b, { roughness: 0.4, metalness: 0.3 }));
  frame.position.y = 1.7;
  group.add(frame);
  const matte = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.36), mat(0xfff6ec));
  matte.position.set(0, 1.7, 0.06);
  group.add(matte);
  const tex = new THREE.TextureLoader().load(photoSrc);
  tex.colorSpace = THREE.SRGBColorSpace;
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.28),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
  );
  photo.position.set(0, 1.7, 0.07);
  group.add(photo);
  const eyeMat = mat(0x2a1520, { roughness: 0.3 });
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeMat);
    eye.position.set(side * 0.16, 1.88, 0.085);
    group.add(eye);
    eyes.push(eye);
  }
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("255,210,150"),
      color: 0xffd9a8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(2.1, 2.6, 1);
  glow.position.set(0, 1.6, 0.12);
  group.add(glow);
  let activated = false;
  return {
    group,
    caption,
    activate() {
      activated = true;
      gsap.to(glow.material, { opacity: 0.8, duration: 0.5, yoyo: true, repeat: 3 });
    },
    get activated() {
      return activated;
    },
    update(player) {
      if (!player) return;
      for (const eye of eyes) {
        const dx = player.x - group.position.x;
        const dz = player.z - group.position.z;
        eye.position.x = Math.sign(eye.position.x) * 0.16 + THREE.MathUtils.clamp(dx * 0.008, -0.03, 0.03);
        eye.position.y = 1.88 + THREE.MathUtils.clamp(dz * 0.004, -0.02, 0.02);
      }
    },
    dispose() {
      tex.dispose();
      disposeGroup(group);
    },
  };
}

export function createBearFriend() {
  const group = new THREE.Group();
  const fur = mat(0x8b5a3c, { roughness: 0.9 });
  const belly = mat(0xd9a77a, { roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), fur);
  body.scale.set(0.9, 1.2, 0.8);
  body.position.y = 0.95;
  group.add(body);
  const tummy = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), belly);
  tummy.scale.set(0.9, 1.0, 0.4);
  tummy.position.set(0, 0.9, 0.33);
  group.add(tummy);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), fur);
  head.position.y = 1.68;
  group.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), fur);
    ear.position.set(side * 0.25, 1.93, 0);
    group.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x1b0e14));
    eye.position.set(side * 0.12, 1.74, 0.3);
    group.add(eye);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.38, 4, 8), fur);
    arm.position.set(side * 0.43, 1.05, 0);
    arm.rotation.z = side * 0.35;
    group.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.35, 4, 8), fur);
    leg.position.set(side * 0.2, 0.3, 0);
    group.add(leg);
  }
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), belly);
  muzzle.position.set(0, 1.6, 0.31);
  group.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x211017));
  nose.position.set(0, 1.64, 0.43);
  group.add(nose);
  const mask = new THREE.Group();
  const maskHead = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.55, 4), mat(0x8f3f21));
  maskHead.rotation.z = Math.PI / 4;
  maskHead.position.y = 1.65;
  mask.add(maskHead);
  const maskEyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaffff, emissiveIntensity: 1.5 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), maskEyeMat);
    eye.position.set(side * 0.12, 1.72, 0.31);
    mask.add(eye);
  }
  group.add(mask);
  let revealed = false;
  return {
    group,
    get revealed() {
      return revealed;
    },
    reveal() {
      revealed = true;
      gsap.to(mask.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.3, ease: "back.in" });
      gsap.to(group.position, { y: 0.18, duration: 0.3, yoyo: true, repeat: 1 });
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createDoll() {
  const group = new THREE.Group();
  const pink = mat(0xe3a6bc, { roughness: 0.95 });
  const dress = mat(0x7e4b64, { roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), pink);
  body.position.y = 0.65;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), pink);
  head.position.y = 1.02;
  group.add(head);
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.02;
  head.position.y = 0;
  headPivot.add(head);
  group.add(headPivot);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.18, 3, 6), pink);
    ear.position.set(side * 0.1, 0.18, 0);
    ear.rotation.z = side * 0.18;
    headPivot.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(0x231018));
    eye.position.set(side * 0.07, 0.02, 0.18);
    headPivot.add(eye);
  }
  const dressMesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 10), dress);
  dressMesh.position.y = 0.42;
  group.add(dressMesh);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.22, 3, 6), pink);
    arm.position.set(side * 0.24, 0.7, 0);
    arm.rotation.z = side * 0.5;
    group.add(arm);
  }
  return {
    group,
    headPivot,
    update(player) {
      if (!player) return;
      const dx = player.x - group.position.x;
      const dz = player.z - group.position.z;
      headPivot.rotation.y = Math.atan2(dx, dz);
    },
    fall() {
      gsap.to(group.rotation, { z: Math.PI / 2, duration: 0.4, ease: "bounce.out" });
    },
    dispose() {
      disposeGroup(group);
    },
  };
}

export function createWallWriting(text) {
  const texture = canvasTexture(720, 220, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(190,35,55,0.88)";
    ctx.textAlign = "center";
    ctx.font = "700 78px Caveat, Segoe Print, cursive";
    ctx.save();
    ctx.translate(w / 2, h / 2 + 12);
    ctx.rotate(-0.035);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  });
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.55), material);
  return {
    mesh,
    reveal() {
      gsap.to(material, { opacity: 0.9, duration: 0.5 });
    },
    hide() {
      gsap.to(material, { opacity: 0, duration: 0.4 });
    },
    dispose() {
      texture.dispose();
      material.dispose();
      mesh.geometry.dispose();
    },
  };
}

export function createRadio() {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.24), mat(0x4b3430));
  box.position.y = 0.8;
  group.add(box);
  const speaker = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), mat(0x221318));
  speaker.position.set(0, 0.8, 0.13);
  group.add(speaker);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), mat(0x9b8b7a));
  antenna.position.set(0.16, 1.15, 0);
  antenna.rotation.z = -0.2;
  group.add(antenna);
  return { group, dispose: () => disposeGroup(group) };
}

export function createSlamDoor() {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 0.18), mat(0x2b171c, { roughness: 0.9 }));
  frame.position.y = 1.15;
  group.add(frame);
  const pivot = new THREE.Group();
  pivot.position.set(-0.68, 1.08, 0.12);
  group.add(pivot);
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.05, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x633b2e, roughness: 0.85, emissive: 0x1a0804, emissiveIntensity: 0.25 })
  );
  panel.position.x = 0.66;
  pivot.add(panel);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0xd8a85c, { metalness: 0.4, roughness: 0.3 }));
  knob.position.set(1.12, 0, 0.1);
  pivot.add(knob);
  pivot.rotation.y = -1.15;
  let busy = false;
  function slam() {
    if (busy) return Promise.resolve();
    busy = true;
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { busy = false; resolve(); } })
        .to(pivot.rotation, { y: 0, duration: 0.16, ease: "power3.in" })
        .to(pivot.rotation, { y: -0.06, duration: 0.12, ease: "elastic.out(1, 0.3)" });
    });
  }
  function reset() {
    gsap.killTweensOf(pivot.rotation);
    pivot.rotation.y = -1.15;
    busy = false;
  }
  return { group, slam, reset, dispose: () => disposeGroup(group) };
}

export function createFallingShelf() {
  const group = new THREE.Group();
  const wood = mat(0x6b4035, { roughness: 0.9 });
  const pivot = new THREE.Group();
  pivot.position.y = 0;
  group.add(pivot);
  for (let i = 0; i < 3; i += 1) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.42), wood);
    board.position.y = 0.42 + i * 0.48;
    pivot.add(board);
    for (let j = 0; j < 2; j += 1) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.26, 0.2),
        mat(i % 2 ? 0xc98fa8 : 0x8f6a68, { roughness: 0.9 })
      );
      box.position.set(-0.26 + j * 0.48, 0.61 + i * 0.48, 0);
      pivot.add(box);
    }
  }
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), wood);
    post.position.set(side * 0.56, 0.95, -0.16);
    pivot.add(post);
  }
  let busy = false;
  function topple() {
    if (busy) return Promise.resolve();
    busy = true;
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { busy = false; resolve(); } })
        .to(pivot.rotation, { z: -1.22, duration: 0.38, ease: "power2.in" })
        .to(pivot.position, { y: -0.08, duration: 0.2, ease: "bounce.out" });
    });
  }
  function reset() {
    gsap.killTweensOf([pivot.rotation, pivot.position]);
    pivot.rotation.z = 0;
    pivot.position.y = 0;
    busy = false;
  }
  return { group, topple, reset, dispose: () => disposeGroup(group) };
}

const POWER_STYLE = {
  battery: { color: 0xff7eb6, emissive: 0xff3f91, icon: "\u{1F50B}" },
  boots: { color: 0x9fe8ff, emissive: 0x3f9fff, icon: "\u{1F462}" },
  heart: { color: 0xff9ec9, emissive: 0xff2b6d, icon: "\u{1F497}" },
  shield: { color: 0xc9a7ff, emissive: 0x8b5cff, icon: "\u{1F6E1}" },
};

function iconTexture(icon) {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "84px Segoe UI Emoji, Apple Color Emoji, sans-serif";
    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = 18;
    ctx.fillText(icon, w / 2, h / 2 + 4);
  });
}

export function createPowerUp(type = "battery") {
  const style = POWER_STYLE[type] || POWER_STYLE.battery;
  const group = new THREE.Group();
  group.name = `powerup-${type}`;
  const coreMat = new THREE.MeshStandardMaterial({
    color: style.color,
    emissive: style.emissive,
    emissiveIntensity: 1.7,
    roughness: 0.25,
    metalness: 0.2,
    transparent: true,
    opacity: 0.92,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), coreMat);
  core.position.y = 0.9;
  group.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.018, 8, 32),
    new THREE.MeshBasicMaterial({
      color: style.color,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  ring.position.y = 0.9;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(type === "boots" ? "160,230,255" : type === "shield" ? "190,160,255" : "255,150,200"),
      color: style.color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.position.y = 0.9;
  glow.scale.setScalar(1.15);
  group.add(glow);

  const iconTex = iconTexture(style.icon);
  const icon = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: iconTex, transparent: true, depthWrite: false, toneMapped: false })
  );
  icon.position.y = 1.52;
  icon.scale.setScalar(0.48);
  group.add(icon);

  let collected = false;
  let time = Math.random() * 8;
  function update(dt) {
    if (collected) return;
    time += dt;
    core.rotation.y += dt * 1.7;
    core.rotation.x = Math.sin(time * 1.3) * 0.25;
    core.position.y = 0.9 + Math.sin(time * 2.2) * 0.1;
    ring.rotation.z += dt * 1.1;
    ring.position.y = core.position.y;
    glow.position.y = core.position.y;
    glow.material.opacity = 0.38 + (Math.sin(time * 3) + 1) * 0.12;
    icon.position.y = core.position.y + 0.62 + Math.sin(time * 1.8) * 0.04;
  }
  function collect() {
    if (collected) return Promise.resolve();
    collected = true;
    return new Promise((resolve) => {
      gsap.to(group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.35, ease: "back.in(2)" });
      gsap.to([coreMat, ring.material, glow.material, icon.material], {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          group.visible = false;
          resolve();
        },
      });
    });
  }
  function reset() {
    collected = false;
    group.visible = true;
    group.scale.setScalar(1);
    coreMat.opacity = 0.92;
    ring.material.opacity = 0.55;
    glow.material.opacity = 0.5;
    icon.material.opacity = 1;
  }
  function dispose() {
    iconTex.dispose();
    disposeGroup(group);
  }
  return { group, type, update, collect, reset, dispose, get collected() { return collected; } };
}

