import * as THREE from "three";
import gsap from "gsap";
import { mat, makeGlowTexture, disposeGroup } from "./props.js";

export function createScaryFox() {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const fur = mat(0x8f3f21, { roughness: 0.85 });
  const darkFur = mat(0x2a1510, { roughness: 0.9 });
  const belly = mat(0xc9774b, { roughness: 0.85 });
  const black = mat(0x140b0e, { roughness: 0.8 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xeaffff,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });
  const pupilMat = mat(0x120a12, { roughness: 0.3 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff6a1a,
    emissiveIntensity: 2.2,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), fur);
  body.scale.set(0.82, 1.3, 1.65);
  body.position.y = 1.05;
  body.castShadow = true;
  root.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), belly);
  chest.scale.set(0.8, 1.25, 0.55);
  chest.position.set(0, 0.96, 0.37);
  root.add(chest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.5, 10), darkFur);
  neck.position.set(0, 1.5, 0.2);
  neck.rotation.x = -0.35;
  root.add(neck);

  const head = new THREE.Group();
  head.position.set(0, 1.8, 0.42);
  root.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), fur);
  skull.scale.set(1.05, 0.95, 1.18);
  head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.52, 10), belly);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, -0.04, 0.42);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), black);
  nose.position.set(0, -0.02, 0.68);
  head.add(nose);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 4), darkFur);
    ear.position.set(side * 0.19, 0.35, 0);
    ear.rotation.z = side * 0.22;
    head.add(ear);

    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), black);
    socket.position.set(side * 0.135, 0.07, 0.23);
    head.add(socket);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.064, 12, 10), eyeMat);
    eye.position.set(side * 0.135, 0.07, 0.29);
    eye.scale.set(0.8, 1.25, 0.5);
    head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), pupilMat);
    pupil.position.set(side * 0.135, 0.07, 0.345);
    head.add(pupil);

    for (let i = 0; i < 4; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.075, 5), mat(0xfff4e8));
      tooth.position.set(side * (0.04 + i * 0.035), -0.18 + (i % 2) * 0.02, 0.42 + i * 0.012);
      tooth.rotation.z = Math.PI;
      head.add(tooth);
    }
  }

  const grin = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.018, 6, 20, Math.PI),
    mat(0xffe8dc, { roughness: 0.4 })
  );
  grin.rotation.x = Math.PI / 2;
  grin.rotation.z = Math.PI;
  grin.position.set(0, -0.16, 0.4);
  head.add(grin);

  const legs = [];
  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.78, 8), darkFur);
      leg.position.set(side * 0.22, 0.39, front * 0.38);
      leg.castShadow = true;
      root.add(leg);
      legs.push(leg);
    }
  }

  const tail = new THREE.Group();
  tail.position.set(0, 1.0, -0.45);
  root.add(tail);
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.2 - i * 0.03, 10, 8), i === 1 ? belly : fur);
    puff.position.set(0, i * 0.12, -i * 0.3);
    tail.add(puff);
  }
  const lantern = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 8), flameMat);
  lantern.position.set(0, 0.42, -0.78);
  lantern.rotation.x = Math.PI;
  tail.add(lantern);
  const flameGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("255,130,60"),
      color: 0xff8a3a,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  flameGlow.scale.set(0.9, 0.9, 1);
  flameGlow.position.set(0, 0.42, -0.78);
  tail.add(flameGlow);

  const state = {
    mode: "PATROL",
    time: 0,
    disposed: false,
    walkPhase: 0,
  };

  function setMode(mode) {
    state.mode = mode;
    if (mode === "CHASE") {
      gsap.to(head.rotation, { x: -0.08, z: 0.12, duration: 0.2 });
      eyeMat.emissiveIntensity = 3.4;
    } else if (mode === "SUSPECT") {
      gsap.to(head.rotation, { x: 0.08, z: -0.16, duration: 0.3 });
      eyeMat.emissiveIntensity = 2.6;
    } else if (mode === "SEARCH") {
      gsap.to(head.rotation, { x: 0.03, z: 0.05, duration: 0.3 });
      eyeMat.emissiveIntensity = 2.1;
    } else {
      gsap.to(head.rotation, { x: 0, z: 0, duration: 0.4 });
      eyeMat.emissiveIntensity = 1.9;
    }
  }

  function update(dt) {
    if (state.disposed) return;
    state.time += dt;
    const t = state.time;
    const chasing = state.mode === "CHASE";
    state.walkPhase += dt * (chasing ? 9 : 4);
    const p = state.walkPhase;
    root.position.y = Math.abs(Math.sin(p)) * 0.05;
    root.rotation.z = Math.sin(p * 0.5) * (chasing ? 0.03 : 0.015);
    legs.forEach((leg, i) => {
      leg.rotation.x = Math.sin(p + (i % 2 ? Math.PI : 0)) * (chasing ? 0.7 : 0.35);
    });
    head.rotation.y = Math.sin(t * (chasing ? 2.6 : 1.1)) * 0.08;
    head.rotation.z = Math.sin(t * 3.2) * (chasing ? 0.025 : 0.012);
    tail.rotation.y = Math.sin(t * 1.7) * 0.2;
    tail.rotation.x = -0.2 + Math.sin(t * 2.1) * 0.08;
    flameGlow.material.opacity = 0.4 + Math.sin(t * 5.5) * 0.12;
    lantern.scale.y = 1 + Math.sin(t * 7) * 0.08;
  }

  function lookAtPoint(point) {
    if (!point) return;
    const dx = point.x - group.position.x;
    const dz = point.z - group.position.z;
    group.rotation.y = Math.atan2(dx, dz);
  }

  function lunge() {
    gsap.killTweensOf(root.scale);
    gsap.fromTo(root.scale, { x: 1, y: 1, z: 1 }, {
      x: 1.35,
      y: 1.35,
      z: 1.35,
      duration: 0.18,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });
  }

  function dispose() {
    state.disposed = true;
    gsap.killTweensOf(head.rotation);
    gsap.killTweensOf(root.scale);
    disposeGroup(group);
  }

  return {
    group,
    update,
    setMode,
    lookAt: lookAtPoint,
    lunge,
    dispose,
    get mode() {
      return state.mode;
    },
  };
}
