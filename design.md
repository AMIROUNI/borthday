# design.md — Arnouba's Birthday World 🐰🎂

## Concept
A tiny storybook-game in 3D. She wanders into a magical hallway, must choose between two doors (a scary one and a pretty one), and ends up in a pink birthday party made just for her. Tone: **magical, funny, tender, a little mischievous**. Scary elements are always cartoon-cute.

## Mood & Style
- Style: stylized **cute low-poly / soft toy 3D** (think Animal Crossing x Pixar short). Rounded shapes, no sharp edges, soft shading.
- Materials: `MeshToonMaterial` or soft `MeshStandardMaterial` (roughness 0.7, metalness 0). Slight outline (inverted-hull) on the rabbit is a bonus.
- Camera: gentle floating motion, shallow depth, always slightly looking at the rabbit.

## Color Palette
| Role | Color | Hex |
|---|---|---|
| Rabbit fur | Bubblegum pink | #FFB6D5 |
| Rabbit inner ear / cheeks | Hot pink | #FF7EB6 |
| Rabbit belly / tail | Cream white | #FFF3F8 |
| Pretty door | Pastel rainbow (lilac, mint, peach, sky) | #C9A7FF / #A8F0D1 / #FFD1A8 / #A8D8FF |
| Pretty room walls | Soft peach pink | #FFE0EC |
| Carpet | Raspberry + cream stripes | #FF5C9E / #FFF3F8 |
| Gold accents (stars, candles) | Warm gold | #FFD66B |
| Scary door | Dark violet-black wood | #1B1024 |
| Scary glow | Toxic green + blood red eyes | #7CFF6B / #FF2B4D |
| Scary room walls | Deep purple fog | #2A1A3A |
| UI text box | Cream with pink border | #FFF8FB / #FF7EB6 |

## Typography (Google Fonts)
- Titles / story: **"Fredoka"** (rounded, playful)
- Handwritten signs ("bara bara", love notes): **"Caveat"** or **"Patrick Hand"**
- Scary sign variant: **"Creepster"** (only for the scary door sign, small)
- Body UI: Fredoka 400. Sizes: title 40–64px, dialogue 20–26px (min 18px on mobile).

## UI components
1. **Dialogue box**: bottom-center, rounded 24px, cream background, pink 4px border, tiny rabbit-ear icon, **typewriter effect** (30ms/char), tap to continue (a bouncing ▼ indicator).
2. **Hand-written sign** (3D plank/paper on the doors) rendered via CanvasTexture so it feels part of the world.
3. **Hint pulse**: the pretty door gently glows and a small "tap me" arrow bounces after 6 seconds of inactivity (never before).
4. **Mute button** (top-right, speaker emoji), **Restart button** (top-left, small).
5. **Loading screen**: pink background, bouncing rabbit head, text "Arnouba is getting ready…".
6. **Transitions**: soft iris-wipe shaped like a heart, or fade through white with sparkles.

## Lighting
- Hallway: warm ambient + two colored point lights (one green flickering on the scary door, one warm pink on the pretty door) so the choice is visually obvious.
- Scary room: low light, purple fog (`scene.fog`), flickering point lights, lightning flash occasionally.
- Party room: bright warm hemisphere light + warm point lights from candles + soft shadows, floating sparkles/bokeh particles.

## Animation principles
- Everything squashes and stretches slightly (cartoon feel). Use `gsap` with `back.out`, `elastic.out`.
- The rabbit is ALWAYS alive: breathing, blinking every 3–5s, ear wiggle, tail wiggle.
- Particles: hearts, stars, confetti, tiny bats (scary side), dust motes.

## Sound design (WebAudio, procedural, starts after first tap)
- Intro: soft music-box lullaby loop (simple sine/triangle arpeggio).
- Footsteps: tiny soft "pat-pat".
- Scary door: low creak + whispery wind + short spooky sting.
- Pretty door open: sparkly chime + "pop".
- Party room: happy upbeat loop, then a "Happy Birthday" style melody (original simple melody, instruments synthesized) when candles are blown.
- Mute toggle persists in localStorage.

## Responsive
- Portrait phone first (most likely she opens it on her phone), then desktop.
- Canvas fullscreen, `devicePixelRatio` capped at 2.
- On portrait, move camera back / raise FOV so both doors stay visible.
- All interactions work with touch (tap) and mouse (click); no hover-only features.

## Accessibility & performance
- Respect `prefers-reduced-motion` (reduce camera sway and particles).
- Keep draw calls low, reuse geometry, max 1 shadow-casting light per scene.
- Text contrast AA on dialogue boxes.

## Language
Default texts: Tunisian Arabic written in Latin letters (Arabizi) + a bit of English, all stored in `src/config.js` so they can be changed easily. Keep the tone teasing and loving.
