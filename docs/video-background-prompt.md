# Video background prompt (image generation)

Backplate for the Synthesia welcome/handover video. 16:9, centre kept clear for
the composited avatar, themed to the sim's palette (deep violet-black base with
magenta `#d033e0` and cyan `#22d3ee` neon, plus a lime `#c8e83a` data accent).

## The tension we learned

Image tools bias "supermarket aisle" hard toward **bright stock photography**,
so asking for daylight pulls it off-theme (the sim is dark). Bright + neutral
cannot feel like the sim. The reliable route is to commit to the **dark
Under-Pressure look** and keep only a readable pool of light in the centre for
the presenter. Leading with the mood ("dark, after-hours, lights off") beats
tacking it on at the end. Editing a good bright base into darkness is often more
controllable than fighting text-to-image bias from scratch.

## Best route: edit a good bright aisle image into the dark look

Generate (or reuse) a clean bright supermarket-aisle image with good
composition (straight down a wide aisle, open centre), then edit it:

> Keep the composition and shelves exactly as they are, but dramatically change the lighting and mood. Turn the ceiling lights off and remove the bright daylight window at the end - the scene should be dark, after-hours and moody, with a deep violet-black base (near-black with a purple tint). Relight it almost entirely with neon: strong magenta / fuchsia (#d033e0) glowing across the left shelves, strong cyan / teal (#22d3ee) glowing across the right shelves, with their colours reflecting down the now-dark glossy floor. Add a faint lime-green glow far in the background. High contrast, cinematic, immersive - much darker overall. Keep the central aisle a little brighter than the sides so a presenter can stand there, but the whole image should read as dark and neon, not a bright daytime store.

## Fresh-generation prompt (lead with the mood)

> A dark, after-hours, cinematic neon scene. The store lights are off. The only light is magenta and cyan neon. A modern supermarket interior viewed straight down a wide grocery aisle: tall shelves stocked with groceries left and right, polished floor receding into the distance. Deep violet-black base throughout (very dark, near-black with a purple tint, like #0b0a12). Strong magenta / fuchsia glow (#d033e0) rimming the left shelves, bright cyan / teal glow (#22d3ee) rimming the right shelves, reflections streaking down the dark glossy floor. A subtle lime-green glow (#c8e83a) deep in the background. High contrast, atmospheric, premium. Keep the central aisle slightly more lit than the sides - a soft, calm pool of cool light down the middle - so a standing presenter reads clearly against the dark surroundings, especially in the lower-centre. No blown-out windows, no daylight. Empty aisle, no people, no text, no logos, no orange or amber tones.

## If it drifts

- Too bright / not on-theme: *"the store lights are OFF, dark and after-hours, lit only by neon."*
- Too pink: *"reduce the magenta, balance it evenly with the cyan, cooler overall."*
- Centre too busy or too bright for a presenter: *"keep the centre and lower-centre calm and mid-toned, all detail pushed to the outer thirds."*
- Always request **16:9** explicitly.

## Constraints (always)

- 16:9, no people, no text, no logos, no readable brand signage.
- No orange or amber (Sainsbury's cue is banned; the product is fictional Plumfield).
