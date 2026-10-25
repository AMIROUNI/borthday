import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config.js";
import { mat, makeGlowTexture, disposeGroup } from "./props.js";

function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d") };
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function createKridiBook() {
  const group = new THREE.Group();
  group.visible = false;
  group.position.set(0.5, 1.55, 1.1);
  group.rotation.set(-0.1, -0.06, 0.015);

  const coverCanvas = makeCanvas(720, 960);
  const cc = coverCanvas.ctx;
  cc.fillStyle = "#f27fae";
  cc.fillRect(0, 0, 720, 960);
  const coverGrad = cc.createLinearGradient(0, 0, 720, 960);
  coverGrad.addColorStop(0, "rgba(255,255,255,0.32)");
  coverGrad.addColorStop(0.45, "rgba(255,255,255,0)");
  coverGrad.addColorStop(1, "rgba(120,20,70,0.16)");
  cc.fillStyle = coverGrad;
  cc.fillRect(0, 0, 720, 960);
  cc.strokeStyle = "rgba(255,240,248,0.6)";
  cc.lineWidth = 5;
  cc.strokeRect(32, 32, 656, 896);
  cc.fillStyle = "#fff5fa";
  cc.textAlign = "center";
  cc.font = "700 90px Caveat, Segoe Print, cursive";
  cc.fillText("EL KRIDI", 360, 410);
  cc.font = "700 86px Segoe UI Emoji, sans-serif";
  cc.fillText("\u{1F4B8}", 360, 530);
  cc.font = "500 34px Caveat, Segoe Print, cursive";
  cc.fillStyle = "rgba(255,245,250,0.9)";
  cc.fillText("cadeaux \u2022 7essab \u2022 7ob", 360, 650);
  const coverTexture = new THREE.CanvasTexture(coverCanvas.canvas);
  coverTexture.colorSpace = THREE.SRGBColorSpace;

  const coverMat = new THREE.MeshBasicMaterial({ map: coverTexture, toneMapped: false });
  const coverPivot = new THREE.Group();
  coverPivot.position.set(-0.66, 0, 0.08);
  group.add(coverPivot);
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 1.72), coverMat);
  cover.position.set(0.66, 0, 0);
  coverPivot.add(cover);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.76, 0.08),
    mat(0xd95f92, { roughness: 0.6 })
  );
  spine.position.set(-0.68, 0, 0.02);
  group.add(spine);

  const pageBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 1.7, 0.07),
    mat(0xfff6ea, { roughness: 0.9 })
  );
  pageBack.position.z = 0.005;
  group.add(pageBack);

  const pageCanvas = makeCanvas(900, 1180);
  const pageTexture = new THREE.CanvasTexture(pageCanvas.canvas);
  pageTexture.colorSpace = THREE.SRGBColorSpace;
  const pageMat = new THREE.MeshBasicMaterial({ map: pageTexture, toneMapped: false });
  const page = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 1.63), pageMat);
  page.position.z = 0.045;
  group.add(page);

  const elastic = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 1.72, 0.025),
    mat(0xffd66b, { roughness: 0.3, metalness: 0.4 })
  );
  elastic.position.set(0.68, 0, 0.095);
  coverPivot.add(elastic);

  const pencil = new THREE.Group();
  const pencilShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.72, 8),
    mat(0xffd66b, { roughness: 0.5 })
  );
  pencilShaft.position.y = 0.2;
  pencil.add(pencilShaft);
  const pencilTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.12, 8),
    mat(0xf5d8b0, { roughness: 0.8 })
  );
  pencilTip.position.y = -0.22;
  pencilTip.rotation.z = Math.PI;
  pencil.add(pencilTip);
  const pencilLead = new THREE.Mesh(
    new THREE.ConeGeometry(0.009, 0.035, 8),
    mat(0x4a3140, { roughness: 0.8 })
  );
  pencilLead.position.y = -0.295;
  pencilLead.rotation.z = Math.PI;
  pencil.add(pencilLead);
  pencil.rotation.set(0.2, 0, -0.9);
  pencil.position.set(0.82, 0.2, 0.16);
  group.add(pencil);

  const stampCanvas = makeCanvas(640, 260);
  const sc = stampCanvas.ctx;
  sc.clearRect(0, 0, 640, 260);
  sc.strokeStyle = "#d8294b";
  sc.lineWidth = 13;
  sc.strokeRect(12, 12, 616, 236);
  sc.fillStyle = "#d8294b";
  sc.textAlign = "center";
  sc.font = "800 86px Caveat, Segoe Print, cursive";
  sc.fillText(CONFIG.kridi.stampText, 320, 142);
  sc.font = "700 30px Caveat, Segoe Print, cursive";
  sc.fillText("9ayed 3lih \u{1F497}", 320, 195);
  const stampTexture = new THREE.CanvasTexture(stampCanvas.canvas);
  stampTexture.colorSpace = THREE.SRGBColorSpace;
  const stampMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.32),
    new THREE.MeshBasicMaterial({ map: stampTexture, transparent: true, opacity: 0.92, toneMapped: false })
  );
  stampMesh.position.set(0.2, -0.34, 0.09);
  stampMesh.rotation.z = -0.18;
  stampMesh.visible = false;
  group.add(stampMesh);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("255,167,202"),
      color: 0xffa7ca,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(2.2, 2.6, 1);
  glow.position.z = -0.08;
  group.add(glow);

  const state = {
    open: false,
    closed: true,
    items: [],
    stampOn: false,
    writing: false,
    disposed: false,
    time: 0,
  };
  let onScratch = null;

  function renderPage() {
    const ctx = pageCanvas.ctx;
    ctx.clearRect(0, 0, 900, 1180);
    ctx.fillStyle = "#fffaf1";
    ctx.fillRect(0, 0, 900, 1180);
    ctx.strokeStyle = "rgba(225,180,195,0.28)";
    ctx.lineWidth = 2;
    for (let y = 190; y < 1120; y += 58) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(840, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#c94a78";
    ctx.textAlign = "left";
    ctx.font = "700 58px Caveat, Segoe Print, cursive";
    ctx.fillText("EL KRIDI \u{1F4B8}", 66, 120);
    ctx.strokeStyle = "#e7a9be";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(64, 142);
    ctx.lineTo(570, 142);
    ctx.stroke();

    ctx.font = "500 38px Caveat, Segoe Print, cursive";
    ctx.fillStyle = "#5d3a4b";
    let y = 220;
    for (const item of state.items) {
      const shown = item.text.slice(0, item.shown);
      const lines = wrapLines(ctx, shown, 760);
      for (const line of lines) {
        ctx.fillText(line, 66, y);
        y += 58;
      }
      y += 14;
    }
    if (state.stampOn) {
      ctx.save();
      ctx.translate(590, 980);
      ctx.rotate(-0.18);
      ctx.strokeStyle = "rgba(210,35,70,0.82)";
      ctx.lineWidth = 11;
      ctx.strokeRect(-220, -70, 440, 140);
      ctx.fillStyle = "rgba(210,35,70,0.82)";
      ctx.textAlign = "center";
      ctx.font = "800 58px Caveat, Segoe Print, cursive";
      ctx.fillText(CONFIG.kridi.stampText, 0, 20);
      ctx.font = "600 24px Caveat, Segoe Print, cursive";
      ctx.fillText("9ayed 3lih \u{1F497}", 0, 52);
      ctx.restore();
    }
    pageTexture.needsUpdate = true;
  }

  renderPage();

  function writeItem(text, { instant = false, scratch = true } = {}) {
    return new Promise((resolve) => {
      const item = { text, shown: instant ? text.length : 0 };
      state.items.push(item);
      state.writing = true;
      pencil.visible = true;
      renderPage();
      if (instant) {
        pencil.visible = false;
        state.writing = false;
        resolve();
        return;
      }
      const duration = Math.min(2.8, Math.max(0.7, text.length * 0.026));
      let lastScratch = 0;
      gsap.to(item, {
        shown: text.length,
        duration,
        ease: "none",
        onUpdate: () => {
          renderPage();
          const now = performance.now();
          if (scratch && now - lastScratch > 130) {
            lastScratch = now;
            onScratch?.();
          }
          const p = item.shown / Math.max(1, text.length);
          pencil.position.set(0.78 - p * 1.35, 0.3 - (state.items.length - 1) * 0.03 + Math.sin(p * 18) * 0.02, 0.18);
          pencil.rotation.z = -0.9 + Math.sin(p * 14) * 0.08;
        },
        onComplete: () => {
          pencil.visible = false;
          state.writing = false;
          resolve();
        },
      });
    });
  }

  function openBook() {
    if (state.open) return Promise.resolve();
    state.open = true;
    state.closed = false;
    group.visible = true;
    group.position.set(0.5, 0.65, 1.1);
    group.scale.setScalar(0.72);
    coverPivot.rotation.y = 0;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(group.position, { y: 1.55, duration: 0.7, ease: "back.out(1.5)" }, 0)
        .to(group.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "power2.out" }, 0)
        .to(coverPivot.rotation, { y: -2.05, duration: 0.65, ease: "power2.inOut" }, 0.55)
        .to(glow.material, { opacity: 0.42, duration: 0.4 }, 0.2);
    });
  }

  function stamp() {
    if (state.stampOn) return Promise.resolve();
    state.stampOn = true;
    stampMesh.visible = true;
    stampMesh.scale.setScalar(2.4);
    stampMesh.position.set(0.2, 0.8, 0.09);
    renderPage();
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(stampMesh.position, { y: -0.34, duration: 0.2, ease: "power3.in" }, 0)
        .to(stampMesh.scale, { x: 1, y: 1, z: 1, duration: 0.18, ease: "power3.out" }, 0.18)
        .to(group.position, { x: 0.56, duration: 0.06, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0.18)
        .to(group.rotation, { z: 0.04, duration: 0.06, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0.18)
        .to(stampMesh.material, { opacity: 0.55, duration: 0.4 }, 0.45)
        .to(group.position, { x: 0.5, duration: 0.2 }, 0.55)
        .to(group.rotation, { z: 0.015, duration: 0.2 }, 0.55);
    });
  }

  function closeBook() {
    if (!state.open) return Promise.resolve();
    state.open = false;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: () => {
        group.visible = false;
        resolve();
      } });
      tl.to(coverPivot.rotation, { y: 0, duration: 0.35, ease: "power2.in" }, 0)
        .to(group.position, { y: 2.4, z: 2.3, duration: 0.6, ease: "power2.in" }, 0.25)
        .to(group.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 0.55, ease: "power2.in" }, 0.25)
        .to(glow.material, { opacity: 0, duration: 0.3 }, 0.25);
    });
  }

  function setScratchCallback(cb) {
    onScratch = cb;
  }

  function update(dt) {
    if (!state.open || state.disposed) return;
    state.time += dt;
    if (!state.writing) {
      group.position.y = 1.55 + Math.sin(state.time * 1.2) * 0.015;
      group.rotation.y = -0.06 + Math.sin(state.time * 0.7) * 0.012;
    }
    glow.material.opacity = 0.24 + Math.sin(state.time * 1.8) * 0.04;
  }

  function dispose() {
    state.disposed = true;
    gsap.killTweensOf(group.position);
    gsap.killTweensOf(group.scale);
    gsap.killTweensOf(group.rotation);
    gsap.killTweensOf(coverPivot.rotation);
    gsap.killTweensOf(stampMesh.position);
    gsap.killTweensOf(stampMesh.scale);
    gsap.killTweensOf(glow.material);
    coverTexture.dispose();
    pageTexture.dispose();
    stampTexture.dispose();
    disposeGroup(group);
  }

  return {
    group,
    open: openBook,
    close: closeBook,
    writeItem,
    stamp,
    setScratchCallback,
    update,
    dispose,
    get isOpen() {
      return state.open;
    },
    get itemCount() {
      return state.items.length;
    },
  };
}
