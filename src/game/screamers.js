import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D uTex;
uniform float uTime;
uniform float uOpacity;
uniform float uFlash;
uniform float uGlitch;
uniform float uAspect;
uniform float uImageAspect;
uniform float uReduced;
varying vec2 vUv;

vec2 coverUv(vec2 uv) {
  float imageAspect = uImageAspect;
  vec2 scale = uAspect > imageAspect
    ? vec2(1.0, imageAspect / uAspect)
    : vec2(uAspect / imageAspect, 1.0);
  return (uv - 0.5) * scale + vec2(0.5, 0.43);
}

void main() {
  vec2 uv = coverUv(vUv);
  float t = uTime;
  float glitch = (1.0 - uReduced) * (0.003 + uGlitch * 0.025) * sin(uv.y * 90.0 + t * 37.0);
  vec2 dir = uv - 0.5;
  float ca = 0.003 + uGlitch * 0.012;
  float r = texture2D(uTex, uv + vec2(ca, 0.0) + vec2(glitch, 0.0)).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - vec2(ca, 0.0) - vec2(glitch, 0.0)).b;
  vec3 col = vec3(r, g, b);
  float scan = 0.84 + 0.16 * sin(uv.y * 900.0);
  col *= scan;
  col *= 1.0 - uGlitch * 0.18 * step(0.5, fract(t * 17.0));
  col = mix(col, vec3(1.0, 0.88, 0.88), uFlash * 0.92);
  float vig = smoothstep(0.98, 0.28, length(dir));
  col *= mix(0.42, 1.0, vig);
  gl_FragColor = vec4(col, uOpacity);
}
`;

function makeNoiseBuffer(ctx, seconds = 1.2) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  return buffer;
}

export class ScreamerSystem {
  constructor({ scene, camera, audio, onShake, onLifeLoss, onBuild, onAftermath, onDone } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.audio = audio;
    this.onShake = onShake;
    this.onLifeLoss = onLifeLoss;
    this.onBuild = onBuild;
    this.onAftermath = onAftermath;
    this.onDone = onDone;
    this.intensity = CONFIG.horror?.jumpScareIntensity || "high";
    this.cooldownMs = (CONFIG.horror?.screamerCooldown || 25) * 1000;
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
    this.busy = false;
    this.cooldownUntil = 0;
    this.disposed = false;
    this.glitch = 0;
    this.type = null;
    this.texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${CONFIG.horror?.image || "horror/ro3eb.jpg"}`);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.uniforms = {
      uTex: { value: this.texture },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uFlash: { value: 0 },
      uGlitch: { value: 0 },
      uAspect: { value: camera?.aspect || 1 },
      uReduced: { value: this.reducedMotion ? 1 : 0 },
    };
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
    );
    this.quad.renderOrder = 9999;
    this.quad.frustumCulled = false;
    this.quad.visible = false;
    this.quad.onBeforeRender = (renderer, currentScene, activeCamera) => {
      const direction = new THREE.Vector3();
      activeCamera.getWorldDirection(direction);
      const distance = 0.32;
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(activeCamera.fov) / 2) * distance;
      const width = height * activeCamera.aspect;
      this.quad.scale.set(width, height, 1);
      this.quad.position.copy(activeCamera.position).add(direction.multiplyScalar(distance));
      this.quad.quaternion.copy(activeCamera.quaternion);
      this.quad.updateMatrixWorld(true);
      this.uniforms.uAspect.value = activeCamera.aspect;
    };
    scene.add(this.quad);
    this.overlay = document.getElementById("mazeScreamer");
    this.face = document.getElementById("mazeScreamerFace");
    if (this.face) this.face.src = `${import.meta.env.BASE_URL}${CONFIG.horror?.image || "horror/ro3eb.jpg"}`;
    this.overlayText = document.getElementById("mazeScreamerText");
    this.overlayStatic = document.getElementById("mazeScreamerStatic");
  }

  get isBusy() {
    return this.busy;
  }

  get cooldownRemaining() {
    return Math.max(0, this.cooldownUntil - performance.now());
  }

  get debugState() {
    return {
      busy: this.busy,
      type: this.type,
      cooldown: Math.round(this.cooldownRemaining / 1000),
      intensity: this.intensity,
    };
  }

  setIntensity(value) {
    if (["low", "medium", "high"].includes(value)) this.intensity = value;
  }

  playHit(type) {
    const audio = this.audio;
    const bus = audio?.screamBus;
    const options = { bus, volume: 1, fadeIn: 0.004 };
    let played = false;
    if (type === "final" || type === "enemy" || type === "chase") {
      played = !!audio?.play("scream-long", options);
    } else {
      played = !!audio?.play("scream-short", options);
    }
    if (!played) this.proceduralScream(type);
    audio?.play("scream-boom", { bus, volume: 1 });
    audio?.play("scream-whoosh", { bus, volume: 0.8 });
    setTimeout(() => {
      if (!this.disposed) audio?.play("scream-ring", { bus, volume: 0.8 });
    }, 480);
  }

  proceduralScream(type) {
    const ctx = this.audio?.ctx;
    if (!ctx) return;
    const output = this.audio.screamBus || this.audio.master || ctx.destination;
    const now = ctx.currentTime;
    const duration = type === "final" || type === "enemy" ? 1.5 : 1.05;
    const oscillator = ctx.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(210, now);
    oscillator.frequency.exponentialRampToValueAtTime(920, now + 0.16);
    oscillator.frequency.exponentialRampToValueAtTime(160, now + duration);
    const formant = ctx.createBiquadFilter();
    formant.type = "bandpass";
    formant.frequency.setValueAtTime(900, now);
    formant.frequency.exponentialRampToValueAtTime(2300, now + 0.18);
    formant.Q.value = 8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(ctx, duration);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 600;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(formant).connect(gain).connect(output);
    noise.connect(noiseFilter).connect(noiseGain).connect(output);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    noise.start(now);
    noise.stop(now + duration + 0.02);
  }

  async trigger(type = "jump", { force = false, lifeLoss = false } = {}) {
    if (this.disposed || this.busy) return false;
    if (!force && performance.now() < this.cooldownUntil) return false;
    this.busy = true;
    this.type = type;
    this.onBuild?.(type);
    this.audio?.duckAll(0.06, 2400);
    this.audio?.setHeartbeat(0);
    this.audio?.play("whisper", { volume: 0.85, rate: 0.82 });
    const buildMs = this.intensity === "low" ? 1000 : this.intensity === "medium" ? 1200 : 1450;
    await wait(buildMs);
    if (this.disposed) {
      this.busy = false;
      return false;
    }
    const flash = this.intensity === "high" && !this.reducedMotion ? 1 : this.intensity === "medium" && !this.reducedMotion ? 0.55 : 0;
    this.quad.visible = true;
    this.uniforms.uOpacity.value = 1;
    this.uniforms.uFlash.value = flash;
    this.glitch = this.reducedMotion ? 0 : 1;
    if (this.overlay) {
      this.overlay.hidden = false;
      this.overlay.classList.remove("aftermath");
      this.overlay.classList.add("show", "hit");
    }
    if (this.overlayText) {
      this.overlayText.textContent = CONFIG.horror?.screamerText || "NCHOUFOUK";
    }
    this.playHit(type);
    this.onShake?.(this.intensity === "low" ? 0.3 : this.intensity === "medium" ? 0.65 : 1);
    await wait(900);
    if (this.disposed) {
      this.busy = false;
      return false;
    }
    this.uniforms.uFlash.value = 0;
    this.overlay?.classList.remove("hit");
    this.overlay?.classList.add("aftermath");
    this.onAftermath?.(type);
    gsap.to(this.uniforms.uOpacity, { value: 0, duration: this.reducedMotion ? 0.35 : 0.6 });
    await wait(this.reducedMotion ? 380 : 640);
    if (this.overlayStatic) this.overlayStatic.style.opacity = "0.55";
    await wait(420);
    if (this.overlay) {
      this.overlay.classList.remove("show", "aftermath");
      this.overlay.hidden = true;
    }
    if (this.overlayStatic) this.overlayStatic.style.opacity = "";
    this.quad.visible = false;
    this.glitch = 0;
    this.audio?.duckAll(1, 500);
    this.audio?.setHeartbeat(0.55);
    if (lifeLoss) this.onLifeLoss?.(type);
    this.cooldownUntil = performance.now() + this.cooldownMs;
    this.busy = false;
    this.type = null;
    this.onDone?.(type);
    return true;
  }

  update(dt) {
    if (this.disposed) return;
    this.uniforms.uTime.value += dt;
    this.glitch = Math.max(0, this.glitch - dt * 1.8);
    this.uniforms.uGlitch.value = this.glitch;
  }

  dispose() {
    this.disposed = true;
    this.scene?.remove(this.quad);
    this.quad.geometry.dispose();
    this.quad.material.dispose();
    this.texture.dispose();
    if (this.overlay) {
      this.overlay.hidden = true;
      this.overlay.classList.remove("show", "hit", "aftermath");
    }
  }
}
