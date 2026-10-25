import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config.js";
import {
  mat,
  makeHeartShape,
  makeGlowTexture,
  disposeGroup,
} from "./props.js";

function roundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export function createPhotoGallery() {
  const group = new THREE.Group();
  const textures = new Map();
  const frames = [];
  const viewer = document.getElementById("photoViewer");
  const viewerImage = document.getElementById("photoViewerImage");
  const viewerCaption = document.getElementById("photoViewerCaption");
  const viewerClose = document.getElementById("photoViewerClose");
  const viewerPrev = document.getElementById("photoViewerPrev");
  const viewerNext = document.getElementById("photoViewerNext");
  const viewerCount = document.getElementById("photoViewerCount");
  let viewerIndex = 0;
  let viewerStartX = null;

  const loader = new THREE.TextureLoader();

  function getTexture(src) {
    if (textures.has(src)) return textures.get(src);
    const entry = { texture: null, ready: false, aspect: 577 / 1024 };
    textures.set(src, entry);
    entry.texture = loader.load(
      src,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        entry.ready = true;
        entry.aspect = tex.image.width / tex.image.height;
        frames.forEach((frame) => {
          if (frame.currentSrc === src) frame.applySize();
        });
      },
      undefined,
      () => {
        entry.ready = false;
      }
    );
    return entry;
  }

  function makeFrame(style, height, position, rotationY) {
    const outerW = style === "heart" ? height * 0.82 : height * 0.72;
    const outerH = height;
    const openingW = outerW * 0.78;
    const openingH = outerH * 0.84;
    const frameGroup = new THREE.Group();
    frameGroup.position.copy(position);
    frameGroup.rotation.y = rotationY;

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture("255,180,210"),
        color: 0xffb6d5,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.scale.set(outerW * 1.45, outerH * 1.2, 1);
    glow.position.z = -0.05;
    frameGroup.add(glow);

    if (style === "heart") {
      const outer = makeHeartShape(outerW, outerH);
      const hole = makeHeartShape(openingW, openingH);
      outer.holes.push(hole);
      const frame = new THREE.Mesh(
        new THREE.ExtrudeGeometry(outer, {
          depth: 0.06,
          bevelEnabled: true,
          bevelSegments: 3,
          bevelSize: 0.018,
          bevelThickness: 0.018,
          curveSegments: 12,
        }),
        mat(0xff9ec9, { roughness: 0.45, metalness: 0.05 })
      );
      frame.position.z = -0.03;
      frame.castShadow = true;
      frameGroup.add(frame);
    } else {
      const outer = roundedRectShape(outerW, outerH, height * 0.07);
      const hole = roundedRectShape(openingW, openingH, height * 0.04);
      outer.holes.push(hole);
      const material =
        style === "gold"
          ? mat(0xffd08a, { roughness: 0.28, metalness: 0.45 })
          : mat(0x9b6748, { roughness: 0.75, metalness: 0.05 });
      const frame = new THREE.Mesh(
        new THREE.ExtrudeGeometry(outer, {
          depth: 0.075,
          bevelEnabled: true,
          bevelSegments: 3,
          bevelSize: 0.022,
          bevelThickness: 0.022,
          curveSegments: 12,
        }),
        material
      );
      frame.position.z = -0.035;
      frame.castShadow = true;
      frameGroup.add(frame);
      if (style === "wood") {
        const flowerMat = mat(0xff9ec9, { roughness: 0.6 });
        const centerMat = mat(0xffd66b, { roughness: 0.5 });
        for (const [sx, sy] of [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ]) {
          const flower = new THREE.Group();
          flower.position.set(sx * outerW * 0.38, sy * outerH * 0.38, 0.08);
          for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 5), flowerMat);
            const a = (i / 5) * Math.PI * 2;
            petal.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0);
            petal.scale.set(1, 0.7, 0.35);
            flower.add(petal);
          }
          const center = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), centerMat);
          flower.add(center);
          frameGroup.add(flower);
        }
      }
    }

    const matte = new THREE.Mesh(
      new THREE.PlaneGeometry(openingW * 0.94, openingH * 0.94),
      mat(0xfffdfb, { roughness: 0.85 })
    );
    matte.position.z = 0.035;
    frameGroup.add(matte);

    const photoMat = new THREE.MeshBasicMaterial({
      color: 0xffe6f0,
      transparent: true,
      toneMapped: false,
    });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat);
    photo.position.z = 0.045;
    frameGroup.add(photo);

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(outerW * 1.08, outerH * 1.08, 0.25),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hit.position.z = 0.08;
    hit.userData.type = "photoFrame";
    frameGroup.add(hit);

    const frame = {
      group: frameGroup,
      photo,
      hit,
      glow,
      openingW,
      openingH,
      style,
      currentSrc: null,
      currentIndex: 0,
      applySize() {
        const entry = textures.get(this.currentSrc);
        if (!entry?.ready) return;
        const maxW = openingW * 0.9;
        const maxH = openingH * 0.9;
        let h = maxH;
        let w = h * entry.aspect;
        if (w > maxW) {
          w = maxW;
          h = w / entry.aspect;
        }
        photo.scale.set(w, h, 1);
      },
      setPhoto(index, instant = false) {
        const list = CONFIG.photos;
        const photoDef = list[index % list.length];
        const entry = getTexture(photoDef.src);
        this.currentIndex = index % list.length;
        this.currentSrc = photoDef.src;
        const apply = () => {
          if (!this.currentSrc) return;
          const currentEntry = textures.get(this.currentSrc);
          if (!currentEntry?.ready) return;
          photoMat.map = currentEntry.texture;
          photoMat.color.set(0xffffff);
          photoMat.needsUpdate = true;
          this.applySize();
        };
        if (!instant && photoMat.map) {
          gsap.to(photoMat, {
            opacity: 0,
            duration: 0.25,
            onComplete: () => {
              apply();
              gsap.to(photoMat, { opacity: 1, duration: 0.35 });
            },
          });
        } else {
          apply();
        }
      },
    };
    frame.setPhoto(0, true);
    group.add(frameGroup);
    frames.push(frame);
    return frame;
  }

  const mainFrame = makeFrame("gold", 1.8, new THREE.Vector3(-3.12, 2.15, -3.91), 0);
  const heartFrame = makeFrame("heart", 1.28, new THREE.Vector3(-3.91, 2.08, 0.85), Math.PI / 2);
  const woodFrame = makeFrame("wood", 1.28, new THREE.Vector3(3.91, 2.05, 0.9), -Math.PI / 2);

  const allFrames = [mainFrame, heartFrame, woodFrame];
  allFrames.forEach((frame, i) => {
    frame.hit.userData.onTap = () => openViewer(frame.currentIndex);
    frame.setPhoto(i % CONFIG.photos.length, true);
  });

  let baseIndex = 0;
  let cycleTimer = 0;
  let time = 0;

  function openViewer(index = 0) {
    if (!viewer || CONFIG.photos.length === 0) return;
    viewerIndex = ((index % CONFIG.photos.length) + CONFIG.photos.length) % CONFIG.photos.length;
    updateViewer();
    viewer.hidden = false;
  }

  function updateViewer() {
    const photo = CONFIG.photos[viewerIndex];
    if (!photo) return;
    viewerImage.src = photo.src;
    viewerImage.alt = photo.caption;
    viewerCaption.textContent = photo.caption;
    viewerCount.textContent = `${viewerIndex + 1} / ${CONFIG.photos.length}`;
    const multiple = CONFIG.photos.length > 1;
    viewerPrev.hidden = !multiple;
    viewerNext.hidden = !multiple;
  }

  function closeViewer() {
    if (viewer) viewer.hidden = true;
  }

  function nextPhoto() {
    if (CONFIG.photos.length < 2) return;
    viewerIndex = (viewerIndex + 1) % CONFIG.photos.length;
    updateViewer();
  }

  function prevPhoto() {
    if (CONFIG.photos.length < 2) return;
    viewerIndex = (viewerIndex - 1 + CONFIG.photos.length) % CONFIG.photos.length;
    updateViewer();
  }

  if (viewer) {
    viewerClose.addEventListener("click", closeViewer);
    viewerPrev.addEventListener("click", prevPhoto);
    viewerNext.addEventListener("click", nextPhoto);
    viewer.addEventListener("pointerdown", (event) => {
      if (event.target !== viewerImage) return;
      viewerStartX = event.clientX;
    });
    viewer.addEventListener("pointerup", (event) => {
      if (viewerStartX === null) return;
      const dx = event.clientX - viewerStartX;
      viewerStartX = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) nextPhoto();
      else prevPhoto();
    });
    viewer.addEventListener("click", (event) => {
      if (event.target === viewer) closeViewer();
    });
    viewer.addEventListener("pointerdown", (event) => event.stopPropagation());
  }

  function update(dt) {
    time += dt;
    for (const frame of frames) {
      frame.group.rotation.z = Math.sin(time * 0.6 + frame.group.position.x) * 0.008;
      frame.glow.material.opacity = 0.14 + Math.sin(time * 1.5 + frame.group.position.z) * 0.04;
    }
    if (CONFIG.photos.length > frames.length) {
      cycleTimer += dt;
      if (cycleTimer >= 6) {
        cycleTimer = 0;
        baseIndex = (baseIndex + 1) % CONFIG.photos.length;
        frames.forEach((frame, i) => frame.setPhoto((baseIndex + i) % CONFIG.photos.length));
      }
    }
  }

  function glowAll() {
    frames.forEach((frame) => {
      gsap.killTweensOf(frame.glow.material);
      gsap.fromTo(
        frame.glow.material,
        { opacity: 0.18 },
        { opacity: 0.8, duration: 0.45, yoyo: true, repeat: 2, ease: "sine.inOut" }
      );
    });
  }

  function dispose() {
    textures.forEach((entry) => entry.texture?.dispose());
    frames.forEach((frame) => {
      gsap.killTweensOf(frame.glow.material);
      gsap.killTweensOf(frame.photo.material);
    });
    disposeGroup(group);
    if (viewer) viewer.hidden = true;
  }

  return {
    group,
    frames,
    interactives: frames.map((frame) => frame.hit),
    mainFrame,
    open: openViewer,
    glowAll,
    update,
    dispose,
  };
}
