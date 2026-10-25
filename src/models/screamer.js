import * as THREE from "three";
import gsap from "gsap";

const FACE_ASPECT = 336 / 595;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...options });
}

function makeGlowTexture(rgb = "255,255,255") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, `rgba(${rgb},1)`);
  gradient.addColorStop(0.22, `rgba(${rgb},0.7)`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeDustTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 220; i += 1) {
    const alpha = Math.random() * 0.28;
    ctx.fillStyle = `rgba(220,205,180,${alpha})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 384, Math.random() * 1.8 + 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 12; i += 1) {
    ctx.strokeStyle = `rgba(255,245,220,${Math.random() * 0.12})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, 0);
    ctx.lineTo(Math.random() * 256, 384);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCrackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "rgba(245,235,220,0.9)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 3;
  for (let i = 0; i < 9; i += 1) {
    let x = 128 + (Math.random() - 0.5) * 70;
    let y = 180 + (Math.random() - 0.5) * 80;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j += 1) {
      x += (Math.random() - 0.5) * 46;
      y += (Math.random() - 0.5) * 58;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeStaticTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(256, 160);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.random() * 255;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeEyeSprite(texture, size = 0.32) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  sprite.scale.set(size, size, 1);
  return sprite;
}

function isLookingAt(camera, fromX, fromZ, toX, toZ) {
  if (!camera) return false;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const length = Math.hypot(dx, dz);
  if (length < 0.001) return true;
  return (forward.x * dx + forward.z * dz) / length > 0.45;
}

function cloneFaceTexture(texture) {
  const clone = texture.clone();
  clone.colorSpace = THREE.SRGBColorSpace;
  clone.needsUpdate = true;
  return clone;
}

export function createCursedFrame(texture, { behavior = "eyes" } = {}) {
  const group = new THREE.Group();
  const imageHeight = 1.5;
  const imageWidth = imageHeight * FACE_ASPECT;
  const frameWidth = imageWidth + 0.22;
  const frameHeight = imageHeight + 0.22;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth, frameHeight, 0.12),
    material(0x241712, { roughness: 0.72, metalness: 0.18 })
  );
  frame.position.y = 1.58;
  group.add(frame);
  const innerFrame = new THREE.Mesh(
    new THREE.BoxGeometry(imageWidth + 0.1, imageHeight + 0.1, 0.08),
    material(0x6b4a2f, { roughness: 0.8, metalness: 0.2 })
  );
  innerFrame.position.set(0, 1.58, 0.065);
  group.add(innerFrame);
  const faceTexture = cloneFaceTexture(texture);
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(imageWidth, imageHeight),
    new THREE.MeshBasicMaterial({ map: faceTexture, toneMapped: false })
  );
  photo.position.set(0, 1.58, 0.112);
  group.add(photo);
  const dustTexture = makeDustTexture();
  const dust = new THREE.Mesh(
    new THREE.PlaneGeometry(imageWidth, imageHeight),
    new THREE.MeshBasicMaterial({ map: dustTexture, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })
  );
  dust.position.set(0, 1.58, 0.116);
  group.add(dust);
  const crackTexture = makeCrackTexture();
  const cracks = new THREE.Mesh(
    new THREE.PlaneGeometry(imageWidth, imageHeight),
    new THREE.MeshBasicMaterial({ map: crackTexture, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
  );
  cracks.position.set(0, 1.58, 0.12);
  group.add(cracks);
  const glowTexture = makeGlowTexture("255,255,255");
  const eyeLeft = makeEyeSprite(glowTexture, 0.3);
  eyeLeft.position.set(-imageWidth * 0.16, 1.58 + imageHeight * 0.08, 0.14);
  group.add(eyeLeft);
  const eyeRight = makeEyeSprite(glowTexture, 0.3);
  eyeRight.position.set(imageWidth * 0.16, 1.58 + imageHeight * 0.08, 0.14);
  group.add(eyeRight);
  const lampGlow = makeEyeSprite(makeGlowTexture("255,170,80"), 1.2);
  lampGlow.position.set(0, 1.58 + imageHeight * 0.66, 0.16);
  lampGlow.material.opacity = 0.25;
  group.add(lampGlow);

  let zoom = 1;
  let eyeGlow = 0;
  let cooldown = 0;
  let lungeTimer = 0;
  let disposed = false;
  let onScare = null;

  function setZoom(value) {
    zoom = value;
    faceTexture.repeat.set(1 / zoom, 1 / zoom);
    faceTexture.offset.set((1 - 1 / zoom) * 0.5, (1 - 1 / zoom) * 0.5);
    dust.scale.set(1 / zoom, 1 / zoom, 1);
    dust.position.z = 0.116;
    cracks.scale.set(1 / zoom, 1 / zoom, 1);
    cracks.position.z = 0.12;
  }

  function lunge() {
    if (disposed) return;
    cooldown = 8;
    cracks.material.opacity = 1;
    const tl = gsap.timeline({
      onComplete: () => {
        if (disposed) return;
        gsap.to(photo.scale, { x: 1, y: 1, duration: 0.25 });
        gsap.to(photo.position, { z: 0.112, duration: 0.25 });
        gsap.to(cracks.material, { opacity: 0, duration: 0.35 });
        setZoom(1);
      },
    });
    tl.to(photo.scale, { x: 2.8, y: 2.8, duration: 0.12, ease: "power4.in" }, 0)
      .to(photo.position, { z: 0.5, duration: 0.12, ease: "power4.in" }, 0)
      .to(group.rotation, { z: 0.08, duration: 0.06, yoyo: true, repeat: 3 }, 0);
    onScare?.("painting");
  }

  return {
    group,
    get behavior() {
      return behavior;
    },
    set onScare(value) {
      onScare = value;
    },
    update(player, camera, dt) {
      if (disposed || !player) return;
      cooldown = Math.max(0, cooldown - dt);
      const dx = group.position.x - player.x;
      const dz = group.position.z - player.z;
      const distance = Math.hypot(dx, dz);
      const looking = isLookingAt(camera, player.x, player.z, group.position.x, group.position.z);
      const proximity = THREE.MathUtils.clamp(1 - distance / 7, 0, 1);
      const targetGlow = behavior === "eyes" ? proximity : Math.max(0, eyeGlow - dt * 0.4);
      eyeGlow += (targetGlow - eyeGlow) * Math.min(1, dt * 4);
      eyeLeft.material.opacity = eyeGlow;
      eyeRight.material.opacity = eyeGlow;
      lampGlow.material.opacity = 0.15 + Math.sin(performance.now() * 0.011) * 0.08;
      if (behavior === "zoom") {
        if (distance < 6.5 && !looking) setZoom(Math.min(1.65, zoom + dt * 0.11));
        if (looking && zoom > 1.22 && cooldown <= 0) {
          setZoom(1);
          cooldown = 9;
          onScare?.("painting");
        }
      } else if (behavior === "lunge") {
        if (distance < 4.2 && looking && cooldown <= 0) {
          lungeTimer += dt;
          if (lungeTimer > 1.2) {
            lungeTimer = 0;
            lunge();
          }
        } else {
          lungeTimer = Math.max(0, lungeTimer - dt * 0.5);
        }
      }
    },
    reset() {
      cooldown = 0;
      lungeTimer = 0;
      eyeGlow = 0;
      setZoom(1);
      photo.scale.set(1, 1, 1);
      photo.position.z = 0.112;
      cracks.material.opacity = 0;
    },
    dispose() {
      disposed = true;
      faceTexture.dispose();
      dustTexture.dispose();
      crackTexture.dispose();
      glowTexture.dispose();
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item?.dispose?.());
        }
      });
    },
  };
}

export function createMirror(texture) {
  const group = new THREE.Group();
  const width = 1.0;
  const height = 1.78;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.16, height + 0.16, 0.1),
    material(0x2a201c, { roughness: 0.7, metalness: 0.25 })
  );
  frame.position.y = 1.5;
  group.add(frame);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.18, metalness: 0.75 })
  );
  glass.position.set(0, 1.5, 0.065);
  group.add(glass);
  const faceTexture = cloneFaceTexture(texture);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.94, height * 0.94),
    new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true, opacity: 0, toneMapped: false })
  );
  face.position.set(0, 1.5, 0.075);
  group.add(face);
  const crackTexture = makeCrackTexture();
  const cracks = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: crackTexture, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
  );
  cracks.position.set(0, 1.5, 0.08);
  group.add(cracks);
  let faceAlpha = 0;
  let timer = 0;
  let triggered = false;
  let disposed = false;
  let onScare = null;

  return {
    group,
    set onScare(value) {
      onScare = value;
    },
    update(player, camera, dt) {
      if (disposed || triggered || !player) return;
      const distance = Math.hypot(group.position.x - player.x, group.position.z - player.z);
      const looking = isLookingAt(camera, player.x, player.z, group.position.x, group.position.z);
      if (distance < 4.5 && looking) {
        timer += dt;
        faceAlpha = Math.min(1, faceAlpha + dt * 1.7);
        face.material.opacity = faceAlpha;
        face.scale.setScalar(1 + Math.min(0.25, timer * 0.08));
        if (timer > 1.1) {
          triggered = true;
          cracks.material.opacity = 1;
          onScare?.("mirror");
        }
      } else {
        faceAlpha = Math.max(0, faceAlpha - dt * 0.4);
        face.material.opacity = faceAlpha;
      }
    },
    reset() {
      triggered = false;
      timer = 0;
      faceAlpha = 0;
      face.material.opacity = 0;
      face.scale.setScalar(1);
      cracks.material.opacity = 0;
    },
    dispose() {
      disposed = true;
      faceTexture.dispose();
      crackTexture.dispose();
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item?.dispose?.());
        }
      });
    },
  };
}

export function createCRT(texture) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.75), material(0x2b2622, { roughness: 0.75, metalness: 0.15 }));
  body.position.y = 0.75;
  group.add(body);
  const screenStatic = makeStaticTexture();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.58),
    new THREE.MeshBasicMaterial({ map: screenStatic, toneMapped: false })
  );
  screen.position.set(0, 0.82, 0.382);
  group.add(screen);
  const faceTexture = cloneFaceTexture(texture);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.54),
    new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true, opacity: 0, toneMapped: false })
  );
  face.position.set(0, 0.82, 0.388);
  group.add(face);
  const glow = makeEyeSprite(makeGlowTexture("255,255,255"), 0.5);
  glow.position.set(0, 0.82, 0.4);
  glow.material.opacity = 0;
  group.add(glow);
  let timer = 0;
  let triggered = false;
  let disposed = false;
  let onScare = null;

  return {
    group,
    set onScare(value) {
      onScare = value;
    },
    update(player, camera, dt) {
      if (disposed || triggered || !player) return;
      const distance = Math.hypot(group.position.x - player.x, group.position.z - player.z);
      if (distance < 4.2) {
        timer += dt;
        screen.material.map.offset.x = Math.random() * 0.08;
        screen.material.map.offset.y = Math.random() * 0.08;
        if (timer > 1.25) {
          triggered = true;
          face.material.opacity = 1;
          glow.material.opacity = 0.8;
          gsap.to(screen.scale, { x: 1.18, y: 1.18, duration: 0.08, yoyo: true, repeat: 3 });
          onScare?.("tv");
        }
      }
    },
    reset() {
      triggered = false;
      timer = 0;
      face.material.opacity = 0;
      glow.material.opacity = 0;
      screen.scale.set(1, 1, 1);
    },
    dispose() {
      disposed = true;
      screenStatic.dispose();
      faceTexture.dispose();
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item?.dispose?.());
        }
      });
    },
  };
}

export function createCeilingFace(texture) {
  const group = new THREE.Group();
  const faceTexture = cloneFaceTexture(texture);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15 / FACE_ASPECT * 0.72),
    new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true, opacity: 0, toneMapped: false })
  );
  face.rotation.x = Math.PI / 2;
  face.position.y = 2.92;
  group.add(face);
  const glow = makeEyeSprite(makeGlowTexture("255,255,255"), 0.8);
  glow.position.set(0, 2.88, 0);
  glow.material.opacity = 0;
  group.add(glow);
  let triggered = false;
  let timer = 0;
  let disposed = false;
  let onScare = null;

  return {
    group,
    set onScare(value) {
      onScare = value;
    },
    update(player, camera, dt) {
      if (disposed || triggered || !player) return;
      const distance = Math.hypot(group.position.x - player.x, group.position.z - player.z);
      const direction = new THREE.Vector3();
      camera?.getWorldDirection(direction);
      const lookingUp = direction.y > 0.35;
      if (distance < 5 && lookingUp) {
        timer += dt;
        face.material.opacity = Math.min(1, face.material.opacity + dt * 2);
        glow.material.opacity = face.material.opacity * 0.7;
        if (timer > 1.0) {
          triggered = true;
          onScare?.("ceiling");
          gsap.to(group.position, { y: -1.1, duration: 0.3, ease: "power3.in" });
        }
      }
    },
    reset() {
      triggered = false;
      timer = 0;
      face.material.opacity = 0;
      glow.material.opacity = 0;
      group.position.y = 0;
    },
    dispose() {
      disposed = true;
      faceTexture.dispose();
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item?.dispose?.());
        }
      });
    },
  };
}

export function createScreamerEnemy(texture, { scale = 1.55 } = {}) {
  const group = new THREE.Group();
  const bodyMaterial = material(0x120d12, { roughness: 0.95, emissive: 0x16050a, emissiveIntensity: 0.35 });
  const dressMaterial = material(0x1b1119, { roughness: 1, transparent: true, opacity: 0.92 });
  const skinMaterial = material(0x9a8b7d, { roughness: 0.92 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.0, 6, 12), bodyMaterial);
  torso.position.y = 1.55;
  group.add(torso);
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.55, 14, 1, true), dressMaterial);
  dress.position.y = 1.0;
  group.add(dress);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 1.25, 4, 8), skinMaterial);
    arm.position.set(side * 0.34, 1.65, 0);
    arm.rotation.z = side * 0.18;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 6), skinMaterial);
    hand.position.set(side * 0.45, 0.9, 0.03);
    hand.rotation.z = Math.PI;
    group.add(hand);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.55, 4, 8), bodyMaterial);
    leg.position.set(side * 0.16, 0.35, 0);
    group.add(leg);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8), skinMaterial);
  neck.position.y = 2.16;
  group.add(neck);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 18),
    new THREE.MeshStandardMaterial({
      map: cloneFaceTexture(texture),
      color: 0xd6c4ae,
      roughness: 0.82,
      emissive: 0x21080c,
      emissiveIntensity: 0.45,
    })
  );
  head.scale.set(0.9, 1.15, 0.86);
  head.position.y = 2.44;
  group.add(head);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.7),
    new THREE.MeshBasicMaterial({ map: cloneFaceTexture(texture), toneMapped: false })
  );
  face.position.set(0, 2.42, 0.3);
  group.add(face);
  const jaw = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.34, 8, 1, true),
    material(0x180609, { roughness: 1, emissive: 0x2a0308, emissiveIntensity: 0.4 })
  );
  jaw.position.set(0, 2.2, 0.31);
  jaw.rotation.x = Math.PI;
  group.add(jaw);
  const eyeTexture = makeGlowTexture("255,255,255");
  const eyeLeft = makeEyeSprite(eyeTexture, 0.22);
  eyeLeft.position.set(-0.11, 2.5, 0.36);
  group.add(eyeLeft);
  const eyeRight = makeEyeSprite(eyeTexture, 0.22);
  eyeRight.position.set(0.11, 2.5, 0.36);
  group.add(eyeRight);
  const aura = makeEyeSprite(makeGlowTexture("255,40,70"), 1.2);
  aura.position.set(0, 2.3, 0.1);
  aura.material.opacity = 0.1;
  group.add(aura);
  group.scale.setScalar(scale);
  group.visible = false;

  const state = {
    active: false,
    mode: "HIDDEN",
    time: 0,
    stunTimer: 0,
    vanishTimer: 0,
    speed: 1.55,
    chaseSpeed: 3.1,
    disposed: false,
  };
  let onScream = null;

  function setOpacity(value) {
    group.traverse((object) => {
      if (!object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((item) => {
        if (item.transparent || item.opacity < 1) item.opacity = value;
      });
    });
  }

  return {
    group,
    state,
    get position() {
      return group.position;
    },
    get active() {
      return state.active;
    },
    get mode() {
      return state.mode;
    },
    set onScream(value) {
      onScream = value;
    },
    resetAt(x, z) {
      group.position.set(x, 0, z);
      group.visible = true;
      group.scale.setScalar(scale);
      state.active = true;
      state.mode = "CRAWL";
      state.stunTimer = 0;
      state.vanishTimer = 0;
      state.time = 0;
      setOpacity(1);
    },
    setMode(mode) {
      state.mode = mode;
      if (mode === "STUNNED") state.stunTimer = 2;
    },
    stun(seconds = 2) {
      state.mode = "STUNNED";
      state.stunTimer = seconds;
      eyeLeft.material.color.setHex(0xffffff);
      eyeRight.material.color.setHex(0xffffff);
    },
    vanish(seconds = 0.8) {
      state.mode = "VANISH";
      state.vanishTimer = seconds;
    },
    moveToward(x, z, speed, dt, maze) {
      const dx = x - group.position.x;
      const dz = z - group.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.001) return distance;
      const step = Math.min(distance, speed * dt);
      const nextX = group.position.x + (dx / distance) * step;
      const nextZ = group.position.z + (dz / distance) * step;
      if (!maze || maze.canMove(nextX, nextZ, 0.28)) {
        group.position.x = nextX;
        group.position.z = nextZ;
      }
      group.rotation.y = Math.atan2(dx, dz);
      return distance;
    },
    update(dt, { player } = {}) {
      if (state.disposed) return;
      state.time += dt;
      if (state.mode === "STUNNED") {
        state.stunTimer -= dt;
        group.position.y = Math.sin(state.time * 28) * 0.035;
        group.rotation.z = Math.sin(state.time * 37) * 0.08;
        if (state.stunTimer <= 0) {
          group.rotation.z = 0;
          state.mode = "CRAWL";
        }
        return;
      }
      if (state.mode === "VANISH") {
        state.vanishTimer -= dt;
        setOpacity(Math.max(0, state.vanishTimer / 0.8));
        if (state.vanishTimer <= 0) {
          state.active = false;
          group.visible = false;
        }
        return;
      }
      group.position.y = Math.sin(state.time * 7) * 0.025;
      group.rotation.z = Math.sin(state.time * 5) * 0.025;
      const pulse = 0.55 + Math.sin(state.time * 6) * 0.2;
      eyeLeft.material.opacity = pulse;
      eyeRight.material.opacity = pulse;
      aura.material.opacity = 0.08 + Math.sin(state.time * 3.5) * 0.04;
      if (player && state.mode === "CRAWL" && Math.hypot(player.x - group.position.x, player.z - group.position.z) < 6) {
        onScream?.();
      }
    },
    dispose() {
      state.disposed = true;
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => {
            if (item?.map) item.map.dispose?.();
            item?.dispose?.();
          });
        }
      });
      eyeTexture.dispose();
    },
  };
}

export function createCheckpointCandle() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 10), material(0x6b4a2f));
  base.position.y = 0.04;
  group.add(base);
  const wax = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 0.52, 10),
    material(0xf2e3c5, { roughness: 0.7, emissive: 0x4a2b13, emissiveIntensity: 0.25 })
  );
  wax.position.y = 0.34;
  group.add(wax);
  const flameTexture = makeGlowTexture("255,170,70");
  const flame = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: flameTexture, color: 0xffb35c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  flame.scale.set(0.34, 0.5, 1);
  flame.position.y = 0.72;
  group.add(flame);
  const glow = makeEyeSprite(makeGlowTexture("255,150,60"), 1.6);
  glow.position.y = 0.7;
  glow.material.opacity = 0.18;
  group.add(glow);
  let active = false;

  return {
    group,
    get active() {
      return active;
    },
    activate() {
      if (active) return;
      active = true;
      gsap.to(glow.material, { opacity: 0.55, duration: 0.5, yoyo: true, repeat: 1 });
      gsap.to(flame.scale, { x: 0.45, y: 0.65, duration: 0.18, yoyo: true, repeat: 3 });
    },
    update(dt) {
      flame.scale.x = 0.3 + Math.sin(performance.now() * 0.013) * 0.05;
      flame.scale.y = 0.46 + Math.cos(performance.now() * 0.011) * 0.06;
      glow.material.opacity = active ? 0.3 + Math.sin(performance.now() * 0.005) * 0.08 : 0.14;
    },
    reset() {
      active = false;
    },
    dispose() {
      flameTexture.dispose();
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item?.dispose?.());
        }
      });
    },
  };
}

export function createDoorFace(texture) {
  const group = new THREE.Group();
  const faceTexture = cloneFaceTexture(texture);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 1.25 / FACE_ASPECT),
    new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true, opacity: 0, toneMapped: false })
  );
  face.position.y = 1.45;
  group.add(face);
  const glow = makeEyeSprite(makeGlowTexture("255,255,255"), 0.5);
  glow.position.set(0, 1.65, 0.02);
  glow.material.opacity = 0;
  group.add(glow);
  group.visible = false;

  return {
    group,
    show() {
      group.visible = true;
      gsap.to(face.material, { opacity: 1, duration: 0.08 });
      gsap.to(glow.material, { opacity: 0.9, duration: 0.08 });
    },
    hide() {
      group.visible = false;
      face.material.opacity = 0;
      glow.material.opacity = 0;
    },
    dispose() {
      faceTexture.dispose();
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item?.dispose?.());
        }
      });
    },
  };
}
