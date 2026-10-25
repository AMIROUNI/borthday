# scenario2.md — Party Room v2 (fixes + photo frame + cake delivery + animal party) 🎂🐾

This file **replaces Scene 4 of scenario.md**. Hallway, doors and scary room stay as they are.

---

## 0) BUG FIX (priority #1): the candles don't go out
Currently clicking the candles does nothing. Debug and fix in this order:
1. **Hitbox**: flames/candles are tiny, so raycasting misses them. Add ONE big invisible hit-mesh (`SphereGeometry` r≈0.9, `visible=false` but `raycast` enabled via `material.visible=false` / `opacity 0`) around the candle cluster with `userData.type = 'candles'`. Raycast against that, not against thin cylinders.
2. **UI overlay blocking clicks**: dialogue box, ui layers and the "Click 3al sham3a" bubble must have `pointer-events: none`, only the bubble button itself `pointer-events: auto`. Check that the canvas receives `pointerdown` (log it).
3. **State machine**: use states `ENTER → CAKE_DELIVERY → WISH → BLOW → CELEBRATE → LETTER`. Candles are clickable ONLY in `BLOW`. Log state changes to the console.
4. **blowCandles()** must really do: flame scale → 0 (gsap, staggered 0.15s), flame point-light intensity → 0, spawn smoke particles, set `candlesOut = true`, then trigger CELEBRATE. Make it idempotent.
5. **Fallbacks (all three)**: (a) tap/click the candles, (b) a big button **"Tfi 🕯️"** under the dialogue, (c) **microphone blow detection** (`getUserMedia` + `AnalyserNode`, RMS > threshold for 400ms) with a clear "Nfa5 3la el sham3a" hint; if mic is denied, silently fall back to (a)/(b).
6. Add `console.log('[candles] out')` so I can verify.

---

## 1) 📸 Photo frame with OUR photo
- The image is in the project root: `na_ou_arnouba.jpg` (portrait, ratio ≈ 0.563, 577x1024). **Move it to `public/na_ou_arnouba.jpg`** and load it with `THREE.TextureLoader` from `/na_ou_arnouba.jpg`. Set `texture.colorSpace = THREE.SRGBColorSpace`, `anisotropy = 8`.
- Build a **cute framed picture** on the back wall, to the **left of the window above the pink armchair** (or where it's clearly visible from the camera): 
  - Picture plane keeps the real aspect ratio (no stretching), height ≈ 1.4m.
  - Frame: rounded gold/pink frame (ExtrudeGeometry with bevel), a white inner matte, little pink bow on the top corner, tiny hearts and flowers on the corners, fairy lights around it, soft warm spotlight pointed at it.
  - Small hand-written label under it (Caveat): **"Na w Arnouba 💗"** (editable in config.js).
  - Slight tilt (-3°) and gentle swing when the room starts.
- **Interaction**: tap the frame → camera glides close to it, frame glows, hearts float up, the rabbit looks at it and says "Awwww 🥹". Tap anywhere to return.
- Add a **second smaller frame** (optional) with a heart-shaped mat to fill the wall, using the same photo, with a different crop.
- Don't distort or edit the photo; just display it.

---

## 2) 🎬 NEW entrance sequence: the cake is delivered (before she can blow anything)
At room start the table in the middle is **empty** (only the lace cloth), the room is slightly dim (only fairy lights), music is soft.

1. Arnouba enters, looks around, text: **"Waw… ama win el gateaux?? 🤔"**
2. Drum roll sound, lights flicker, a door/curtain at the back opens (or a trapdoor beside the table).
3. **Animal parade (all 3D, procedural, cute)** comes in carrying/pushing the cake on a decorated trolley:
   - 🦊 the fox (tha3leb) leads, carrying a tiny party horn;
   - 🐻 a teddy bear pushes the trolley;
   - 🐱 a cat and 🐧 a penguin carry balloons;
   - 🦔 a hedgehog and 🦆 a duck walk behind throwing confetti;
   - 🐼 a panda carries a gift;
   - 🐰 two baby bunnies hop in front.
   They walk in a line to the table (waddle/hop animations, each with a different rhythm) with a cheerful marching tune.
4. The trolley stops at the table, the animals **lift the cake onto the table** (cake rises with a bounce, sparkle burst, "ding").
5. The fox lights the candles one by one with a tiny match (flames appear sequentially, each with a soft "pshh"), the room lights come up warm.
6. Animals arrange in a half-circle around the table, facing Arnouba. They sway to a music-box "happy birthday" style melody (original tune, synthesized). Their mouths open/close like singing.
7. Dialogue: **"3idmilédek mbarek ya Arnouba 💗"** → **"Taw… etmanna 7aja w nfa5 3la esh-sham3a 🕯️"**

---

## 3) 🌟 Make a wish → blow the candles (state `WISH` → `BLOW`)
1. Camera pushes in to the cake. Arnouba stands at the table, closes her eyes (eyelid scale), small stars float around her.
2. A moment of silence (2s), then hint bubble **"Nfa5 3la esh-sham3a bech tteffiha"** + the **"Tfi 🕯️"** button + mic hint.
3. When she blows / taps: candles go out **one by one** with smoke curls, a soft "fffhh" sound, the room darkens for 1 second.

---

## 4) 👏 CELEBRATE: the animals applaud
Right after the last candle goes out:
1. 1 second of silence, then **everyone claps**: all animals do a clapping animation (arms swing together repeatedly, bodies bounce, mouths open "yay"), with applause sound (synth noise bursts) + cheers.
2. The **fox** (tha3leb) and the **bear** high-five, the duck does a little spin, the penguin does a belly slide, the panda jumps, bunnies do back-flips.
3. Confetti cannons fire, fireworks outside the window, balloons rise a bit, the garland letters twinkle one by one.
4. Arnouba does her `happy()` jump + wears the crown (`setOutfit('party')`), hearts burst from the framed photo too.
5. Dialogue: **"Sana 7elwa ya 7abibti! 🎉"**

---

## 5) 🎁 Free play & final letter (state `LETTER`)
- Everything is still tappable: animals (each says a funny short line, jumps), balloons pop, gifts open with notes, mirror gives crown, **photo frame zoom**.
- After all gifts are opened OR after 25 seconds, show the **final letter** (full-screen soft overlay, handwritten font, typewriter) from `CONFIG.finalLetter`, then buttons **"💗 Replay"** and **"Share"**.

---

## Config additions (`src/config.js`)
```
photo: { src: '/na_ou_arnouba.jpg', label: 'Na w Arnouba 💗' },
animalLines: { fox: [...], bear: [...], cat: [...], penguin: [...], hedgehog: [...], duck: [...], panda: [...], bunny: [...] },
candleCount: 5,
micBlowEnabled: true
```
