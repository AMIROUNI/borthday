import * as THREE from "three";
import { AUDIO_BASE, AUDIO_MAP, FOOTSTEP_KEYS, MUSIC_STATES } from "./audioMap.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function pannerPosition(panner, position, time = 0) {
  const x = position?.x ?? position?.[0] ?? 0;
  const y = position?.y ?? position?.[1] ?? 0;
  const z = position?.z ?? position?.[2] ?? 0;
  if (panner.positionX) {
    panner.positionX.setValueAtTime(x, time);
    panner.positionY.setValueAtTime(y, time);
    panner.positionZ.setValueAtTime(z, time);
  } else {
    panner.setPosition(x, y, z);
  }
}

function movePanner(panner, position, time = 0, timeConstant = 0.06) {
  const x = position?.x ?? position?.[0] ?? 0;
  const y = position?.y ?? position?.[1] ?? 0;
  const z = position?.z ?? position?.[2] ?? 0;
  if (panner.positionX) {
    panner.positionX.setTargetAtTime(x, time, timeConstant);
    panner.positionY.setTargetAtTime(y, time, timeConstant);
    panner.positionZ.setTargetAtTime(z, time, timeConstant);
  } else {
    panner.setPosition(x, y, z);
  }
}

export class AudioManager {
  constructor({ camera, ensureContext, basePath = AUDIO_BASE, onProgress = null } = {}) {
    this.camera = camera;
    this.ensureContext = ensureContext;
    this.basePath = basePath;
    this.onProgress = onProgress;
    this.ctx = null;
    this.listener = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.ambienceBus = null;
    this.voiceBus = null;
    this.screamBus = null;
    this.buffers = new Map();
    this.failed = new Set();
    this.active = new Set();
    this.ambience = new Map();
    this.music = null;
    this.musicTarget = 0;
    this.musicState = null;
    this.heartbeat = null;
    this.heartbeatIntensity = 0;
    this.muted = false;
    this.ready = false;
    this.progress = 0;
    this.preloadPromise = null;
    this.sceneActive = false;
    this.started = false;
    this.duckFactor = 1;
    this.duckTimer = null;
    this.duckAllTimer = null;
    this.footstepIndex = 0;
  }

  unlock() {
    if (!this.ctx) {
      const ctx = this.ensureContext?.();
      if (ctx) this.attach(ctx);
    }
    if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  attach(ctx) {
    if (this.ctx || !ctx) return;
    this.ctx = ctx;
    THREE.AudioContext.setContext(ctx);
    this.listener = new THREE.AudioListener();
    if (this.camera) this.camera.add(this.listener);

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.ambienceBus = ctx.createGain();
    this.ambienceBus.connect(this.master);
    this.voiceBus = ctx.createGain();
    this.voiceBus.connect(this.master);
    this.screamBus = ctx.createGain();
    this.screamBus.connect(this.master);
  }

  setMuted(value) {
    this.muted = !!value;
    if (!this.muted) this.unlock();
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.025);
    }
    if (!this.muted && this.sceneActive) this.startMaze();
  }

  async preload(onProgress = this.onProgress) {
    if (this.ready) {
      onProgress?.(1, null);
      return true;
    }
    if (this.preloadPromise) return this.preloadPromise;
    this.unlock();
    if (!this.ctx) return false;

    const entries = Object.entries(AUDIO_MAP);
    const total = entries.length;
    let done = 0;

    this.preloadPromise = (async () => {
      await Promise.all(
        entries.map(async ([key, def]) => {
          try {
            const response = await fetch(`${this.basePath}${def.file}`, { cache: "force-cache" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.arrayBuffer();
            const buffer = await this.ctx.decodeAudioData(data);
            this.buffers.set(key, buffer);
          } catch (error) {
            this.failed.add(key);
            console.warn(`[audio] Could not load ${key} (${def.file}); procedural fallback remains available.`, error);
          }
          done += 1;
          this.progress = done / total;
          onProgress?.(this.progress, key);
        })
      );
      this.ready = true;
      onProgress?.(1, null);
      return this.buffers.size > 0;
    })();

    return this.preloadPromise;
  }

  startMaze() {
    this.sceneActive = true;
    this.unlock();
    if (!this.ctx) return;
    if (!this.ready) {
      this.preload().then(() => {
        if (this.sceneActive) this.startMazeAudio();
      });
      return;
    }
    this.startMazeAudio();
  }

  startMazeAudio() {
    if (!this.sceneActive || !this.ready || this.started) return;
    this.started = true;
    this.startAmbience();
    this.setMusicState("calm", { force: true, fade: 0.4 });
  }

  startAmbience() {
    for (const key of ["amb-wind-house", "amb-horror-drone"]) {
      if (!this.buffers.has(key) || this.ambience.has(key)) continue;
      const handle = this.startLoop(key, { bus: this.ambienceBus, volume: 0, fadeIn: 0.05 });
      if (handle) this.ambience.set(key, handle);
    }
  }

  stopMaze() {
    this.sceneActive = false;
    this.started = false;
    this.stopAll();
  }

  stopAll() {
    this.stopMusic(0.2);
    for (const handle of [...this.active]) handle.stop(0.2);
    this.active.clear();
    this.ambience.clear();
    this.heartbeat = null;
    this.heartbeatIntensity = 0;
    this.musicState = null;
    this.musicTarget = 0;
  }

  play(key, options = {}) {
    if (!this.ctx || this.muted || !this.ready) return null;
    const def = AUDIO_MAP[key];
    const buffer = this.buffers.get(key);
    if (!def || !buffer) return null;

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? def.loop;
    source.playbackRate.setValueAtTime(options.rate ?? 1, now);

    const gain = this.ctx.createGain();
    const level = clamp(options.volume ?? 1, 0, 4);
    const target = Math.max(0.0001, level * def.volume);
    const fadeIn = Math.max(0.001, options.fadeIn ?? (source.loop ? 0.06 : 0.006));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(target, now + fadeIn);

    let panner = null;
    if (options.position) {
      panner = this.ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = options.refDistance ?? def.refDistance ?? 1.5;
      panner.maxDistance = options.maxDistance ?? def.maxDistance ?? 16;
      panner.rolloffFactor = options.rolloff ?? def.rolloff ?? 1.2;
      pannerPosition(panner, options.position, now);
      gain.connect(panner);
    }

    const bus =
      options.bus ||
      (def.category === "music"
        ? this.musicBus
        : def.category === "ambience"
          ? this.ambienceBus
          : def.category === "voice"
            ? this.voiceBus
            : this.sfxBus);

    source.connect(gain);
    (panner || gain).connect(bus);
    const manager = this;

    const handle = {
      key,
      def,
      source,
      gain,
      panner,
      level,
      stopped: false,
      setLevel(value, timeConstant = 0.08) {
        if (handle.stopped || !handle.gain) return;
        handle.level = clamp(value, 0, 4);
        const final = Math.max(0.0001, handle.level * handle.def.volume);
        handle.gain.gain.setTargetAtTime(final, handle.gain.context.currentTime, Math.max(0.01, timeConstant));
      },
      setRate(value, timeConstant = 0.1) {
        if (handle.stopped || !handle.source) return;
        handle.source.playbackRate.setTargetAtTime(value, handle.source.context.currentTime, Math.max(0.01, timeConstant));
      },
      setPosition(position, timeConstant = 0.06) {
        if (handle.stopped || !handle.panner) return;
        movePanner(handle.panner, position, handle.panner.context.currentTime, timeConstant);
      },
      stop(fade = 0.05) {
        if (handle.stopped) return;
        handle.stopped = true;
        const context = handle.gain.context;
        const at = context.currentTime;
        const duration = Math.max(0.01, fade);
        const current = Math.max(0.0001, handle.gain.gain.value);
        handle.gain.gain.cancelScheduledValues(at);
        handle.gain.gain.setValueAtTime(current, at);
        handle.gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        setTimeout(() => {
          try {
            handle.source.stop();
          } catch (error) {
            /* already stopped */
          }
        }, duration * 1000 + 12);
        manager.active.delete(handle);
      },
    };

    source.onended = () => {
      handle.stopped = true;
      manager.active.delete(handle);
    };

    this.active.add(handle);
    source.start(now);
    return handle;
  }

  startLoop(key, options = {}) {
    return this.play(key, { ...options, loop: true });
  }

  playAt(key, position, options = {}) {
    return this.play(key, { ...options, position });
  }

  playFootstep(running, position) {
    const keys = running ? FOOTSTEP_KEYS.run : FOOTSTEP_KEYS.walk;
    if (!keys?.length) return null;
    const key = keys[this.footstepIndex % keys.length];
    this.footstepIndex += 1;
    return this.playAt(key, position, {
      volume: running ? 0.55 : 0.42,
      rate: 0.92 + Math.random() * 0.16,
      fadeIn: 0.004,
    });
  }

  setMusicState(stateName, options = {}) {
    const next = MUSIC_STATES[stateName];
    if (!next) return;
    const fade = options.fade ?? 1.2;
    if (this.musicState === stateName && !options.force) {
      this.musicTarget = next.volume;
      this.applyAmbience(next.ambience, fade);
      if (this.music) this.music.setLevel(this.musicTarget * this.duckFactor, Math.min(0.35, fade));
      return;
    }

    this.musicState = stateName;
    this.musicTarget = next.volume;
    this.applyAmbience(next.ambience, fade);

    if (next.oneShot) {
      this.stopMusic(0.2);
      if (next.track) this.play(next.track, { bus: this.musicBus, volume: next.volume, fadeIn: 0.05 });
      return;
    }

    if (!next.track) {
      this.stopMusic(fade);
      return;
    }

    if (this.music?.key === next.track && !this.music.stopped) {
      this.music.setLevel(next.volume * this.duckFactor, Math.min(0.5, fade));
      return;
    }

    this.stopMusic(fade);
    this.music = this.startLoop(next.track, {
      bus: this.musicBus,
      volume: next.volume * this.duckFactor,
      fadeIn: 0.2,
    });
  }

  applyAmbience(levels, fade = 1.2) {
    for (const [key, level] of Object.entries(levels || {})) {
      this.ambience.get(key)?.setLevel(level, Math.max(0.05, fade * 0.6));
    }
  }

  stopMusic(fade = 1.2) {
    if (this.music) {
      this.music.stop(fade);
      this.music = null;
    }
  }

  setHeartbeat(intensity) {
    const target = clamp(intensity, 0, 1);
    this.heartbeatIntensity = target;
    if (target <= 0.01) {
      if (this.heartbeat) {
        this.heartbeat.stop(0.4);
        this.heartbeat = null;
      }
      return;
    }
    if (!this.heartbeat) {
      this.heartbeat = this.startLoop("heartbeat", { bus: this.sfxBus, volume: 0, fadeIn: 0.2 });
    }
    if (this.heartbeat) {
      this.heartbeat.setLevel(target, 0.12);
      this.heartbeat.setRate(0.8 + target * 0.7, 0.2);
    }
  }

  duck(amount = 0.16, ms = 520) {
    this.duckFactor = clamp(amount, 0, 1);
    if (this.music) this.music.setLevel(this.musicTarget * this.duckFactor, 0.05);
    clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.duckFactor = 1;
      if (this.music) this.music.setLevel(this.musicTarget, 0.35);
    }, ms);
  }

  duckAll(amount = 0.08, ms = 1600) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const level = clamp(amount, 0, 1);
    for (const bus of [this.musicBus, this.sfxBus, this.ambienceBus, this.voiceBus]) {
      if (!bus) continue;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setTargetAtTime(level, now, 0.035);
    }
    clearTimeout(this.duckAllTimer);
    this.duckAllTimer = setTimeout(() => {
      if (!this.ctx) return;
      const at = this.ctx.currentTime;
      for (const bus of [this.musicBus, this.sfxBus, this.ambienceBus, this.voiceBus]) {
        if (!bus) continue;
        bus.gain.cancelScheduledValues(at);
        bus.gain.setTargetAtTime(1, at, 0.18);
      }
    }, Math.max(50, ms));
  }

  update() {
    if (this.listener) this.listener.updateMatrixWorld();
  }

  get activeCount() {
    return this.active.size;
  }

  get debugState() {
    return {
      state: this.musicState,
      ready: this.ready,
      progress: this.progress,
      active: this.active.size,
      heartbeat: this.heartbeatIntensity,
      failed: [...this.failed],
    };
  }
}
