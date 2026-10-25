# scenario3.md — Photos fix, "El Kridi" notebook joke, and the Haunted Maze horror game 👻🦊

Continues from `scenario2.md`. The party room works. Three upgrades:

---

## PART A — 📸 Fix the photo + support MORE photos

### Problem
The frame on the wall shows the photo cropped/too small (only part of it is visible). Fix:
1. **Never crop or stretch.** Size the picture plane from the real image aspect (`texture.image.width / height`) after load. Photo is portrait (≈ 577x1024). Make the main frame **bigger** (height ≈ 1.8m) and put it where the camera sees it clearly.
2. Check UVs: `PlaneGeometry` with the full 0..1 UV, `texture.repeat = (1,1)`, `texture.offset = (0,0)`, `colorSpace = SRGBColorSpace`, `MeshBasicMaterial` (so lighting doesn't darken it), `toneMapped = false`.
3. Frame inner border must be slightly larger than the photo (no overlap, no clipping behind the frame).

### Photo gallery (I will add more photos)
- All photos live in `public/photos/` (move `na_ou_arnouba.jpg` there too).
- Config list in `src/config.js`:
```
photos: [
  { src: '/photos/na_ou_arnouba.jpg', caption: 'Na w Arnouba 💗' },
  // I will add more here
]
```
- **3 frames on the walls** (big on the back wall, 2 smaller on side walls with different frame styles: gold, pink heart, wooden with flowers). Each shows a photo from the list (cycles/crossfades every 6s if there are more photos than frames; if only 1 photo, all frames show it).
- **Tap a frame → fullscreen photo viewer** (HTML overlay, not 3D): the full photo uncropped (`object-fit: contain`), soft pink backdrop, caption in handwriting font, swipe/arrow buttons to go to next/previous photo, close button. Hearts float in the background. This guarantees the photo is always shown whole.
- Preload textures, use `anisotropy = 8`, max texture size 2048.

---

## PART B — 📓 "9ayed fil Kridi": the notebook joke (inside joke about last year)
Context: I forgot her birthday last year, so I "owe" her gifts. We joke about it as "el kridi" (the tab / debt).

### When it happens
After the candles + applause + final letter (state `LETTER`), instead of ending, a new state `KRIDI` starts.

### Sequence
1. Arnouba looks at the camera with a mischievous face, narrows her eyes, text: **"Wa9ila nsit 7aja… 9bal ma nemchi… 😏"**
2. She **pulls out a 3D notebook (kourrasa)** from behind the armchair (or from a little bag): a pink hardcover notebook with a gold elastic band, cover text **"EL KRIDI 📓"** (canvas texture), a pencil behind her ear.
3. The notebook floats up in front of the camera and opens (pages flip). The pencil **writes by itself** on the page (handwriting animation using a canvas texture revealing text letter by letter, with scratchy pencil sound).
4. She tells me (text in a speech bubble): **"9ayed 3lih cadeaux jdod fel kridi! 😤"**
5. Lines get written one by one (all editable in `CONFIG.kridi.items`), for example:
   - "Cadeau 3am li fet: mou nsa … DENYEN 💸"
   - "Cadeau 3am jey: … DENYEN 💸"
   - "Tsawer m3ak fi blasa 7elwa: DENYEN 💸"
   - "Brunch w 7lou: DENYEN 💸"
   (Placeholders now; I'll replace them with our real jokes.)
6. **Interaction**: a button **"+ Zid cadeau"** lets her tap to add another random debt line from `CONFIG.kridi.extra` (the pencil writes it). A running **total** at the bottom ("Total: barcha barcha 😭").
7. Finally a big red **stamp "DENYEN 💗"** slams onto the page (shake + thud sound + small paper confetti). Dialogue: **"Mrigel, el kridi yetsakkar fel 3am el jey 😂"**
8. Buttons: **"Sakker el kridi"** (notebook closes, floats away) → then the horror door appears (Part C).

Optional: if she taps the animals during this scene, the fox says "Ana ma3andi 9a3da fi hadhi 😅" and hides.

---

## PART C — 🏚️ THE HAUNTED MAZE (horror game in the other room)
After the kridi, a **dark door** slides into the party room wall, with a hand-written sign: **"bara bara…"** and below **"redbalek t5af 😈"**. A dialogue asks: **"Tod5el lel bit el ro3eb? (redbalek, ma3andekch 3odhr)"** with buttons **[Yes, dhakhal]** / **[Mouch taw]**.
If she says no, nothing changes (the door stays, the animals say "jebnek 5ayfa 😂"). If yes, a short transition (lights flicker, door creaks open) → Maze game.

### Goal
She must **escape the maze** ("to5rej mel mata7a"): find **3 pink keys**, open the **exit door**, and avoid the **scary fox** that hunts her. Always cartoon-horror (creepy, jumpy, never gory).

### Controls
- Mobile: virtual joystick (left) + a "Hide" button + a "Flashlight" toggle (right). 
- Desktop: WASD/arrows + Space (hide) + F (flashlight). Mouse look optional.
- Camera: third-person close behind the rabbit (or first-person toggle), slight head bob, the rabbit holds a pink flashlight.

### Maze
- Procedural: 11x11 grid via recursive backtracker (seeded so it can be tested), corridor width 3m, walls 3m high, merged/instanced for performance. Rooms inserted at random: a kids' bedroom, a kitchen, a library, a bathroom with a flooded floor, a toy room.
- Theme: old abandoned house, peeling wallpaper, wooden floors, fog (`FogExp2`), flickering lamps, cobwebs, dust particles.
- **Writings on the walls (the "syabe 3like" idea)**: hand-drawn red-ish paint (cartoon, not blood) appears on walls as she walks: **"bara bara"**, **"rawwa7 Arnouba"**, **"hedha mouch bit lik"**, **"yalla ma t5afch 😈"**, **"nchoufouk"**, **"el bab el 7elou 9odamek"**. Text is revealed dynamically when she gets close (canvas decals). Always address her by name.
- **Minimap off** (more tension), but each found key adds a hint arrow for 3 seconds.

### The Scary Fox (tha3leb mor3eb) 🦊
- Same fox species as the party fox but corrupted: dark orange/black, long stretched body, glowing white eyes, too-wide grin, uneven walk, tail with a lantern/flame. Slightly twitchy, sometimes breaks the "4th wall" and looks at the camera.
- AI: state machine `PATROL → SUSPECT → CHASE → SEARCH`. 
  - Patrol between waypoints, hearing range 6m (louder if she runs), vision cone 60°, line-of-sight via raycast.
  - Chase speed ≈ 90% of rabbit's run speed, so she can escape but must use corners and hiding.
  - If caught: big cartoon jump scare (fox face fills the screen, scream, screen shake), she loses 1 of **3 lives**, respawns at the last checkpoint; the fox goes back to patrol. After 3 lives: friendly fail screen **"Ya3tik 3asba 😂 jarreb mara o5ra"** + restart.
- **Hiding**: tap near wardrobes/under beds/curtains to hide (rabbit shrinks inside, vignette, heartbeat). The fox sniffs around, looks directly at the hiding spot, then leaves after a few seconds (or finds her if she moved).
- Audio: heartbeat that speeds up with proximity, fox growl/laugh, floor creaks, whispers behind her, music box in the distance (distorted).

### Unexpected things (random, scripted triggers, each triggers once)
1. Lights go out, flashlight flickers, a giant shadow of the fox passes on the wall.
2. A door slams behind her and locks; she must find another way.
3. A doll/plush bunny sitting in a chair turns its head to follow her, then falls.
4. Hands (cartoon, gray) reach out of a wall and wave, then retract.
5. A painting's eyes follow her; one painting is the **framed photo of us**, which suddenly flashes with a warm glow (a safe, sweet moment: heart sound, +safe zone where the fox can't enter, checkpoint).
6. A fake exit: a door that looks like the exit, opens to a brick wall with the text "bara bara 😈".
7. A swarm of bats flies down the corridor.
8. A rubber duck squeaks in the dark (comic relief), a toy cat yells "MEOW" (false scare).
9. The floor creaks and a trapdoor opens under a rug (she falls to a lower flooded corridor, funny splash, alternate path).
10. A mannequin/teddy bear in a costume "scares" her then takes off the head — it's the **bear friend** from the party: **"Tkhaft?? 😂"** (twist). He gives her the second key as a "sorry".
11. Whispering from a radio: **"Arnouba… Arnouba… nchoufouk…"** (the voice is the fox's).
12. A random 5% chance each run for an extra secret scare, so it stays unpredictable.

### Keys & exit
- 3 pink keys hidden in different areas (bedroom, library, kitchen), glowing slightly. Collecting plays a chime, the fox gets faster after each key.
- The **exit door** (heavy wooden door with 3 heart-shaped locks) is placed far from the start. When she has all keys and reaches it: the locks click open one by one, bright light.
- **Final chase**: after the last key, the lights go red and the fox **sprints** for 20 seconds; she has to run to the exit.

### Victory
- She exits to the party room: all animals are waiting and **clap and cheer** ("Brava Arnouba!"), the fox (friendly one) comes with a "scary fox mask" in his hands: **"Hehe, ana li kont nkhawwef fik 😂"** — the scary fox was him in a costume (twist). Confetti, a last gift appears (a small surprise note from me, `CONFIG.finalGift`).
- Show time and lives used: "Khrajt fi 4:32, 2 lives 😎".

### Difficulty & safety
- Difficulty switch at start: **Easy (fox slow, 5 lives) / Normal / Hard**. Default Normal.
- "Raja3 lel party" button always available in the pause menu.
- Warning screen at the start: **"El game fiha jump scares 😈"**.
- No gore, no realistic blood: use cartoon style, paint/ink for writings.
- Respect `prefers-reduced-motion` (reduce screen shake and flashing).

---

## State flow
`… LETTER → KRIDI → (door appears) → MAZE_INTRO → MAZE → (WIN | FAIL) → PARTY_WIN → END`

## Config additions (`src/config.js`)
```
photos: [...],
kridi: { items: [...], extra: [...], stampText: 'DENYEN 💗' },
maze: { size: 11, keys: 3, lives: 3, difficulty: 'normal', wallTexts: [...] },
finalGift: { text: '...' }
```
