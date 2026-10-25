# scenario.md — The Story & Interactions 🎬

Main character: **Arnouba**, a cute pink girl rabbit (3D). The real girl controls her by tapping.
Secret: she doesn't know the site was made for her birthday until the very last scene.

All texts below are defaults, stored in `src/config.js` (CONFIG.texts). Edit freely.

---

## SCENE 1 — "Once upon a time…" (Intro)
**Setting:** A dark-blue night sky with stars and a crescent moon. A tiny cozy hill with a little tree. The rabbit is sitting in the center, back turned.

1. When the site loads: loading screen → fade in. Camera slowly pushes in from far to medium.
2. Storybook text appears (typewriter, one line at a time, tap to continue). **The rabbit must visibly react**: she tilts her head, looks at the text, nods.
   - "Fi youm men el ayem… kenet thama arnouba tayba toul 🐰"
   - "Ama el lila… kenet lila khassa barcha. 3idmilédha ✨"
   - "W lazem n7tflou bih. Ama el tari9 mouch sahel…"
   - "Taw… tehbet el arnouba bech tkhtar. Mrigel? 💗"
3. Rabbit turns around, waves, giggles. A glowing path appears on the hill leading to a magical door-shaped light. Button: **"Yallah nemchiw"**.
4. Transition: heart iris-wipe into the Hallway.

## SCENE 2 — The Hallway (the choice)
**Setting:** A long cozy magical hallway. Camera behind the rabbit (3rd person, slightly high). At the end, two doors side by side:
- **LEFT: the SCARY door** (dark, cobwebs, green flickering light, glowing red eyes in the gap, tiny bats, a ghost peeking, scratches, creepy hanging lantern).
- **RIGHT: the PRETTY door** (pastel rainbow, stars, flowers, a heart-shaped window, glowing warm light, small fairy lights, a welcome mat/little carpet in front).

Both doors have a hand-written sign:
- Scary door sign (creepy font, shaky): **"bara bara…"** (means "go away!")  and below in small text **"el bab el o5ra 5ir… click 3lieha 💗"** (the other door is better, click it).
- Pretty door sign (cute font): **"Click me 💗"** (appears fully only after 6s idle, otherwise just a glowing pulse).

### Player choice: she taps a door (or taps the floor in front of it); the rabbit walks to it.
The rabbit **walks** (walk cycle, soft footsteps, camera follows slightly).

### Path A — She walks toward the SCARY door
1. As the rabbit gets close, the light flickers, a creak sound, the door shakes by itself, eyes in the gap blink.
2. A dialogue/hand-written text pops up over the door: **"bara bara! mat3addich! 😱"**
3. Rabbit jumps back with a squash-and-stretch scare, ears up, trembling.
4. Dialogue: **"Arnouba… 5ayrek tmchi lel bab el o5ra, hedhi mouch lik 😅"**
5. The door does NOT open by walking. She can tap the scary door **one more time** to peek: door cracks open → short cut to Scene 3 (Scary Room peek). Otherwise she goes back to the hallway.
6. Camera returns to the hallway, and the pretty door starts to glow stronger.

### Path B — She walks toward the PRETTY door
1. Rabbit arrives on the little carpet, happy bounce.
2. The door does **not** open automatically. A hint arrow appears: **"Click 3al bab 💗"**.
3. When she **clicks/taps the door**: knob turns, door swings open with a sparkly chime, warm light floods out, hearts and confetti burst, camera dollies forward through the door.
4. Transition → Scene 4 (Party Room).

## SCENE 3 — The Scary Room (peek, ~15 seconds, funny not horrifying)
**Setting:** A small dark purple room with fog, a crooked window with lightning, a cauldron bubbling green, floating candles, spiderwebs, a cartoon skeleton waving, 3 little ghosts, bats flying, a floating pumpkin lantern.

1. Door creaks open, camera moves in, lightning flash.
2. Little ghost pops up in front of the camera: **"BOOOO!"** (quick jump scare, cartoon). Rabbit squeaks and does a big jump.
3. Skeleton waves and a speech bubble: **"Ghalta fel bab ya Arnouba 😂 rawwa7 lel bab el hlou!"**
4. The door slams behind her with a gust of wind and then reopens softly. A big arrow points back: **"Raja3"**.
5. Button/tap leads back to the Hallway, where the pretty door is now shining even brighter and the scary door is "closed for good" (a little "closed" sign swings).

## SCENE 4 — The Party Room (birthday payoff) 🎂
**Setting:** A big pastel pink room, wooden floor with a raspberry/cream striped carpet, string lights, "HAPPY BIRTHDAY ARNOUBA" 3D letters hanging from a garland, floating balloons, wrapped gifts, a table in the center with a big 3D **cake** with candles, a small fox (tha3leb) plush toy on a chair, flower vases, a fireplace-less cozy window with a night sky and stars, a bunny-ear shaped mirror, a stack of cute plushies, a cuddly pink armchair.

1. Entrance: music starts, confetti cannon, camera glides into the room and settles in front of the cake. Rabbit jumps for joy.
2. Dialogue sequence (tap to continue):
   - "Surprise!!! 🎉"
   - "3idmilédek mbarek ya Arnouba 💗"
   - "Ena nsit l3am li fet… ama hedha l3am 7adhert lik 7aja khassa."
   - "Taw lazem tetmenna 9bal ma tteffi esh-sham3a 🕯️"
3. **Interaction — blow the candles:** Tap the candles (or tap the flame button / blow into microphone if permitted, with graceful fallback). Flames go out one by one with smoke curls, then a firework show + confetti + music-box "Happy Birthday" melody.
4. **Easter eggs:**
   - Tap the rabbit → giggle + jump + hearts.
   - Tap balloons → pop + confetti.
   - Tap each gift → opens, a note pops out (texts in `CONFIG.giftNotes`, e.g. "Kol 3am w nti 7abiba 8alya", "Nheb dhe7ketek", "Merci 5ater kont mawjouda").
   - Tap the fox plush → he says a silly line.
   - Tap the mirror → the rabbit gets a little crown and sparkles.
5. **Final message** (large, handwritten font, appears after 20s or when all gifts are opened): a heartfelt personal letter from me (stored in `CONFIG.finalLetter`, with a placeholder I will fill in), followed by the buttons **"💗 Replay"** and **"Share"**.

## Flow summary
Intro → Hallway → [Scary door attempt → Scary room peek → back to Hallway] (optional, repeatable) → Pretty door **click** → Party room → Final letter.

## Edge cases
- If she taps the pretty door before the rabbit reaches it, the rabbit walks first, then the door opens.
- If she keeps ignoring the hint, after 6s the pretty door pulses and its sign appears.
- Replay resets all state.
- First tap anywhere unlocks audio.
