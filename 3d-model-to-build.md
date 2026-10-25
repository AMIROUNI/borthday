# 3d-model-to-build.md — Procedural 3D Models (Three.js primitives only) 🧸

Rule: **no external model files.** Build everything with Three.js geometries, grouped in `THREE.Group`s, exported as functions: `createRabbit()`, `createScaryDoor()`, `createPrettyDoor()`, `createCake()`, etc. Each returns `{ group, update(dt), ...animationHandles }`.
Units: 1 unit = 1 meter. Rabbit height ≈ 1.0. Doors ≈ 2.4 tall x 1.3 wide.
Shadows: `castShadow = true` on main pieces only.

---

## 1) 🐰 Arnouba — the girl rabbit (`models/rabbit.js`)
**Look:** very cute, chubby, pink, big head (chibi proportions: head ≈ 55% of the body height), soft toy feeling.

### Parts
- **Body:** squashed sphere (scale 1, 0.95, 0.9), radius 0.38, pink #FFB6D5. **Belly patch:** slightly smaller cream sphere on the front (#FFF3F8).
- **Head:** big sphere radius 0.42 (scale 1.1, 0.95, 1), sits on the body. Cheeks: two hot pink flattened spheres (#FF7EB6, opacity 0.7) on the sides.
- **Eyes:** two glossy black spheres (r 0.06) with a smaller white sphere highlight each (r 0.02) + optional pink eyelashes (3 small thin capsules per eye) to make her feminine. Blink by scaling Y to 0.1 for 0.12s.
- **Nose:** tiny pink sphere/cone (r 0.03). **Mouth:** a small "w" shape made from 2 thin torus arcs (or a TubeGeometry curve).
- **Ears:** two long capsules (CapsuleGeometry r 0.1, length 0.55), pink outside, inner ear a smaller hot-pink flattened capsule. Slightly tilted outward, one ear can **flop** a bit (rotation) for charm.
- **Bow / accessory:** a big cream-and-pink **bow** (two cones + one sphere) on the right ear base. Makes her recognizable as a girl.
- **Arms:** two small capsules, pink, with round paws (cream spheres). **Legs:** two chunky capsules + oval feet (cream). 
- **Tail:** fluffy white sphere (r 0.12) with tiny scale bobbing.
- **Optional dress/skirt:** a cone/lathe skirt in pastel lilac around the waist, with little white dots. (Toggle: `rabbit.setOutfit('party')` adds a crown + small cape for the final scene.)
- **Outline:** (optional) inverted-hull back-face mesh in #E75A9A scaled 1.04.

### Animations (all in `update(dt)` + GSAP helpers)
- `idle()`: breathing (body scale Y ±2%, 2.5s loop), blink every 3–5s random, ears slight wiggle, tail wag.
- `walk(targetVec3, speed)`: face the direction, bounce (Y sin wave), legs alternate swing, arms swing, ears flop, tiny footstep dust particles.
- `jump()`: squash → stretch up → land squash → settle (0.7s).
- `wave()`: right arm up and wave 3 times, head tilt.
- `scare()`: quickly jump back, eyes widen (scale 1.4), ears straight up, body shivers 0.8s.
- `happy()`: two small jumps with ears flapping, hearts particle burst.
- `giggle()`: body shake + "hihi" sound.
- `lookAt(vec3)`: head turns toward point (clamped ±60°).

---

## 2) 🚪 The Two Doors (`models/doors.js`)
Both doors share a frame, a door leaf with a pivot at the hinge (so `rotation.y` opens it), a knob and a sign plane (CanvasTexture).

### A) Scary door `createScaryDoor()`
- **Frame:** crooked dark wood (#1B1024) slightly rotated 1–2°, cracks made with thin black boxes.
- **Door leaf:** dark violet wood (#2A1A3A), vertical plank grooves (boxes), **claw scratches** (3 thin curved TubeGeometry lines in light gray), a big rusty ring knocker (torus).
- **Cobwebs:** triangle fan geometry with transparent white lines (or canvas texture) in the corners.
- **Eyes in the gap:** two small glowing red spheres (#FF2B4D, emissive) in a dark slit that blink randomly and follow the rabbit (lookAt).
- **Green glow:** point light #7CFF6B, flickers (random intensity 0.3–1.2 every 80–200ms).
- **Decor:** 3 mini bats (cone wings flapping via scale/rotation), a small ghost (lathe geometry, white translucent, floating up/down) peeking from behind the frame, a hanging skull lantern (sphere + emissive eyes), a dead-looking potted plant, spider on a thread (descends/ascends with GSAP).
- **Sign:** dark wooden plank hung by two ropes, canvas text **"bara bara…"** in Creepster/shaky style, slightly swinging. Below in small chalk text: "el bab el o5ra 5ir… click 3lieha 💗".
- **API:** `shake()`, `crack()` (opens 15°), `slam()`, `lockClosed()`, `setEyesTarget(vec3)`.

### B) Pretty door `createPrettyDoor()`  ← pick the NICEST design
- **Frame:** white, rounded (use RoundedBox-like shape via ExtrudeGeometry with bevel), decorated with small pink flowers (5-petal spheres around a yellow center) and green leaves climbing the left side.
- **Door leaf:** pastel **rainbow vertical stripes** (lilac #C9A7FF, mint #A8F0D1, peach #FFD1A8, sky #A8D8FF) with rounded panels; a **heart-shaped window** at the top (glowing warm light behind, emissive); gold stars and tiny polka dots scattered; golden **heart-shaped knob**.
- **Lights:** fairy light string (small emissive spheres, alternating pink/yellow, twinkling) draped around the frame. A warm point light #FFC2DD in front, slowly pulsing.
- **Decor:** small welcome mat/little carpet in front (raspberry + cream stripes, rounded rectangle), two mini potted flowers, tiny cloud above the door with a rainbow arc (TorusGeometry partial).
- **Sign:** pastel wooden heart with canvas text **"Click me 💗"** in Caveat, gently bobbing (appears after 6s idle).
- **API:** `open()` (leaf rotates -110° with `back.out`, light floods, sparkles burst), `pulse()`, `showHint()`, `onClick(cb)`.
- Door must be a **raycast target** (set `userData.type = 'prettyDoor'`).

---

## 3) 🏚️ Hallway Environment (`scenes/hallway.js` using `models/props.js`)
- Floor: wooden planks with a long runner carpet leading to the doors (carpet pink-cream on the right half, dark and tattered on the left half → visually splits the path).
- Walls: split in two moods — **left half** dark purple with cracked wallpaper and green lantern, **right half** peach pink with flower wallpaper and warm lamps. Smooth gradient in the middle behind the doors.
- Ceiling: hanging lanterns, a few floating stars on the right, a few floating wisps on the left.
- Camera: behind and above the rabbit, FOV 55 (portrait: 65).

---

## 4) 👻 Scary Room (`scenes/scaryRoom.js`)
Small room 5x5m. Dark purple walls with fog (`FogExp2 #2A1A3A, 0.08`).
Props (procedural): bubbling **cauldron** (lathe + green emissive liquid + rising bubbles), cartoon **skeleton** (capsules, sphere skull, waving arm), 3 **ghosts** (lathe body, two black eye spheres, oscillating), crooked **window** with lightning flash (emissive plane + white flash), floating **candles** (cylinder + flame cone, emissive), **pumpkin lantern** (squashed orange sphere + carved eyes), spider webs, a creaky wooden floor, a floating book that flips pages.
Interactions: tap ghost → it giggles and hides; tap skeleton → bubble text; arrow back to hallway.

---

## 5) 🎂 Party Room (`scenes/partyRoom.js`)
Large pastel room 8x8m, 3.5m high.
- **Floor:** light wood; **carpet:** big round raspberry/cream striped rug (concentric torus/ring segments).
- **Walls:** soft peach pink with white polka dots (canvas texture), a big arched **window** showing a starry night with a crescent moon.
- **Banner:** garland with letters **"HAPPY BIRTHDAY ARNOUBA"** — each letter a `TextGeometry`/extruded canvas plane in alternating pastel colors, hanging from a curved string with tiny flags. If TextGeometry is not available without a font file, use canvas-texture planes with slight thickness (BoxGeometry) and a drop shadow.
- **Cake table:** round white table with a lace cloth (lathe) in the center.
- **🎂 Cake (`models/cake.js`):** 3 tiers (cylinders radius 0.7 / 0.5 / 0.3, heights 0.35 each) in pink, cream and lilac. Frosting drips (small squashed spheres + capsules hanging at the top edge of each tier), piped cream swirls around the base (small spheres/cones), strawberries and cherries on top (red spheres with tiny green leaves), sprinkles (tiny colored capsules randomly on the sides), gold star topper. **Candles:** 5 thin cylinders with striped colors + flame (teardrop cone, emissive orange, flicker via scale and point light). API: `blowCandle(i)`, `blowAll()` (flame shrinks, smoke particles rise), `relight()`.
- **Balloons:** 12 balloons (stretched spheres, glossy, pastel colors + tiny knot cones + curved TubeGeometry strings) floating gently with sinusoidal sway; pop on tap with confetti.
- **Gifts:** 4–5 gift boxes (box + lid + ribbon cross + bow made from two torus/cones) in different colors; lid lifts and a note sprite pops up on tap.
- **🦊 Fox plush (tha3leb):** orange sphere body, big head, white cheek fluff cones, pointed triangular ears with dark tips, white-tipped tail (cone + sphere), sitting on a small chair or next to the cake. Tap → little jump + silly line.
- **More cute stuff:** pink armchair (rounded boxes + spheres), stack of plushies (small bear, small cloud, heart cushion), bunny-ear-shaped mirror with a gold frame, vases with flowers (sphere heads on thin cylinders), floating hearts, fairy lights along the walls, a shelf with tiny books and a snow-globe, a floating "1 more year" star mobile.
- **Particles:** confetti cannons (instanced small planes with random colors, gravity), sparkles (points), floating hearts (sprites), fireworks at the window after the candles are blown.

---

## 6) Shared utilities (`models/props.js`)
- `makeCanvasTextTexture(text, font, color, bg)` for signs, banner letters and notes.
- `makeSprayParticles(type)` for confetti/hearts/smoke/dust.
- `roundedBox(w,h,d,r)` helper (ExtrudeGeometry with bevel).
- `makeToonGradient()` for `MeshToonMaterial.gradientMap` (3-step gradient).
- `disposeGroup(group)` to clean geometries/materials when switching scenes.

## Quality checklist
- Every model readable and cute at phone size.
- Rabbit visible from every camera in every scene.
- No clipping between rabbit and furniture.
- Consistent scale across scenes.
- 60fps target: reuse geometries, instance confetti/balloons, cap lights (max 4 active point lights per scene).
